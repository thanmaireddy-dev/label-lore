import assert from "node:assert/strict";
import test from "node:test";
import { parseFoodLabelText } from "./food-label-parser";
import { OcrAnalysisConflictError, OcrFoodLabelAnalysisService, type NewOcrAnalysis, type OcrAnalysisRepository, type SavedOcrAnalysis } from "./ocr-analysis.service";
import type { ReviewedOcrSubmission } from "./ocr-analysis.contract";

function submission(overrides: Partial<ReviewedOcrSubmission["confirmed"]> = {}, idempotencyKey = "583ba42e-e771-42b5-8939-3cec11e02f67"): ReviewedOcrSubmission {
  const rawText = "Ingredients: Oats, sugar\nNutrition information per 100 g\nEnergy 100 kcal\nSaturated fat 0 g\nTotal sugars 0 g\nSodium 0 mg\nSalt 0 g";
  const values = {
    energyKcal: 100, fat: null, saturatedFat: 0, transFat: null, carbohydrates: null,
    sugars: 0, fibre: null, protein: null, sodium: 0, salt: 0,
  };
  return {
    idempotencyKey,
    ocrDraft: parseFoodLabelText(rawText),
    confirmed: {
      ingredientsText: "Oats, sugar",
      nutritionBasis: "PER_100G",
      nutritionValues: values,
      ...overrides,
    },
  };
}

class MemoryOcrAnalysisRepository implements OcrAnalysisRepository {
  readonly rows = new Map<string, SavedOcrAnalysis>();
  readonly bySubmission = new Map<string, string>();
  createCount = 0;

  async findBySubmissionKey(key: string) {
    const id = this.bySubmission.get(key);
    return id ? this.rows.get(id) ?? null : null;
  }

  async create(input: NewOcrAnalysis) {
    this.createCount += 1;
    const row: SavedOcrAnalysis = {
      ...input,
      id: `analysis-${this.createCount}`,
      createdAt: new Date("2026-11-10T10:00:00.000Z"),
      explanation: null,
      explanationModel: null,
      explanationMethodologyVersion: null,
      explanationPromptVersion: null,
      explanationCreatedAt: null,
      ocrDraft: input.ocrDraft as unknown as SavedOcrAnalysis["ocrDraft"],
      confirmedData: input.confirmedData as unknown as SavedOcrAnalysis["confirmedData"],
      factors: input.factors as unknown as SavedOcrAnalysis["factors"],
      dataCompleteness: input.dataCompleteness as unknown as SavedOcrAnalysis["dataCompleteness"],
    };
    this.rows.set(row.id, row);
    this.bySubmission.set(input.submissionKey, row.id);
    return row;
  }

  async findById(id: string) { return this.rows.get(id) ?? null; }
}

test("scores reviewed OCR values with the existing deterministic engine and persists a standalone analysis", async () => {
  const repo = new MemoryOcrAnalysisRepository();
  const service = new OcrFoodLabelAnalysisService(repo);
  const submitted = submission({
    ingredientsText: "Oats, honey",
    nutritionValues: { ...submission().confirmed.nutritionValues, energyKcal: 500, sodium: 100, salt: 0.5 },
  });
  const result = await service.analyze(submitted);
  assert.equal(result.status, "GRADED");
  assert.ok(result.grade);
  assert.equal(result.verification, "UNVERIFIED");
  assert.equal(result.confirmed.nutritionValues.sodium, 100);
  assert.equal(result.confirmed.nutritionValues.salt, 0.5);
  assert.equal(result.corrections.ingredients, true);
  assert.ok(result.corrections.nutrients.includes("energyKcal"));
  assert.equal(result.sourceRawText, submitted.ocrDraft.rawText);
  assert.equal(repo.createCount, 1);
  const sodiumFactor = result.factors.find((factor) => factor.key === "sodium");
  assert.equal(sodiumFactor?.value, 100);
});

test("missing required nutrition and per-100ml data return Insufficient Data without a grade", async () => {
  const service = new OcrFoodLabelAnalysisService(new MemoryOcrAnalysisRepository());
  const missing = await service.analyze(submission({ nutritionValues: { ...submission().confirmed.nutritionValues, energyKcal: null } }));
  assert.equal(missing.status, "INSUFFICIENT_DATA");
  assert.equal(missing.grade, null);
  assert.equal(missing.score, null);
  assert.ok(missing.dataCompleteness.requiredFields.missing.includes("energyKcal"));

  const perMl = await service.analyze(submission({ nutritionBasis: "PER_100ML" }, "92be0f26-4af4-4b75-997f-cfb8d930a3e7"));
  assert.equal(perMl.status, "INSUFFICIENT_DATA");
  assert.equal(perMl.dataCompleteness.basisStatus, "UNSUPPORTED");
});

test("rejects manipulated or out-of-range client values and unknown grade fields", async () => {
  const service = new OcrFoodLabelAnalysisService(new MemoryOcrAnalysisRepository());
  await assert.rejects(service.analyze({ ...submission(), grade: "A", score: 100, factors: [] }), /Unrecognized key/);
  await assert.rejects(service.analyze(submission({ nutritionValues: { ...submission().confirmed.nutritionValues, sodium: -3 } })), /Too small/);
  await assert.rejects(service.analyze(submission({ nutritionValues: { ...submission().confirmed.nutritionValues, fat: 101 } })), /Too big/);
});

test("reuses the same persisted analysis for an identical submission and rejects key reuse with changed data", async () => {
  const repo = new MemoryOcrAnalysisRepository();
  const service = new OcrFoodLabelAnalysisService(repo);
  const input = submission();
  const first = await service.analyze(input);
  const repeated = await service.analyze(input);
  assert.equal(repeated.id, first.id);
  assert.equal(repo.createCount, 1);
  assert.deepEqual(await service.getById(first.id), first);

  await assert.rejects(service.analyze(submission({ ingredientsText: "Oats, honey" })), OcrAnalysisConflictError);
  assert.equal(repo.createCount, 1);
});
