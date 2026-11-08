import assert from "node:assert/strict";
import test from "node:test";
import { scoreProduct, type GradeProductInput } from "./grading";
import { EXPLANATION_PROMPT_VERSION, ProductGradeExplanationService, type CurrentProductAssessment, type GradeExplanationRepository } from "./explanation.service";
import type { OpenAIExplanationInput } from "./openai-explanation.client";

const validNutrition: NonNullable<GradeProductInput["nutrition"]> = {
  energyKcal: 100, saturatedFat: 0, sugar: 0, sodium: 0, salt: null, fibre: null, protein: null,
  transFat: null, nutritionBasis: "100g", verification: "UNVERIFIED",
};

function assessment(overrides: Partial<NonNullable<GradeProductInput["nutrition"]>> = {}, methodologyVersion?: string): CurrentProductAssessment {
  const scored = scoreProduct({ productId: "product-1", nutrition: { ...validNutrition, ...overrides }, ingredients: [] });
  return {
    productName: "Test food",
    productVerification: "VERIFIED",
    ingredients: [{ sourceText: "sugar", normalizedName: "sugar", additiveCode: null, verification: "VERIFIED" }],
    grade: { ...scored, methodologyVersion: methodologyVersion ?? scored.methodologyVersion, calculatedAt: "2026-11-08T10:00:00.000Z" },
  };
}

class MemoryExplanationRepository implements GradeExplanationRepository {
  current: CurrentProductAssessment | null = assessment();
  readonly saved = new Map<string, { explanation: string; model: string; createdAt: Date }>();
  readonly saves: Array<{ productId: string; methodologyVersion: string; promptVersion: string; explanation: string; model: string }> = [];

  async loadCurrent() { return this.current; }
  async findExplanation(_productId: string, methodologyVersion: string, promptVersion: string) {
    return this.saved.get(`${methodologyVersion}:${promptVersion}`) ?? null;
  }
  async saveExplanation(input: { productId: string; methodologyVersion: string; promptVersion: string; explanation: string; model: string }) {
    this.saves.push(input);
    const value = { explanation: input.explanation, model: input.model, createdAt: new Date("2026-11-08T10:30:00.000Z") };
    this.saved.set(`${input.methodologyVersion}:${input.promptVersion}`, value);
    return value;
  }
}

const goodExplanation = "The listed sugars contributed the strongest adverse nutrition factor. Ingredient names are shown as source evidence and do not change this calculated nutrition result.";

test("generates and persists an explanation from the saved grade factors without changing the grade", async () => {
  const repo = new MemoryExplanationRepository();
  const savedGrade = repo.current?.grade;
  const supplied: OpenAIExplanationInput[] = [];
  const service = new ProductGradeExplanationService(repo, () => ({ apiKey: "key", model: "test-model" }), async (input) => {
    supplied.push(input);
    return goodExplanation;
  });

  const result = await service.generateAndPersist("product-1");
  assert.equal(result?.status, "GENERATED");
  assert.equal(result?.explanation, goodExplanation);
  assert.equal(result?.aiGenerated, true);
  assert.equal(result?.model, "test-model");
  assert.equal(supplied[0]?.grade, savedGrade?.grade);
  assert.equal(supplied[0]?.score, savedGrade?.score);
  assert.ok(supplied[0]?.nutritionFactors.length);
  assert.equal(repo.saves.length, 1);
  assert.deepEqual(repo.current?.grade, savedGrade);
  assert.equal("grade" in (result ?? {}), false);
  assert.equal("score" in (result ?? {}), false);
});

test("serves a persisted explanation on repeated requests without another provider call", async () => {
  const repo = new MemoryExplanationRepository();
  let generationCount = 0;
  const service = new ProductGradeExplanationService(repo, () => ({ apiKey: "key", model: "test-model" }), async () => {
    generationCount += 1;
    return goodExplanation;
  });
  await service.generateAndPersist("product-1");
  const repeated = await service.get("product-1");
  assert.equal(repeated?.status, "GENERATED");
  assert.equal(generationCount, 1);
  assert.equal(repo.saves.length, 1);
});

test("regenerates explanations when methodology or prompt version changes", async () => {
  const repo = new MemoryExplanationRepository();
  repo.saved.set(`${repo.current!.grade.methodologyVersion}:${EXPLANATION_PROMPT_VERSION}`, {
    explanation: goodExplanation, model: "old-model", createdAt: new Date("2026-11-08T10:00:00.000Z"),
  });
  let generationCount = 0;
  const generate = async () => {
    generationCount += 1;
    return goodExplanation;
  };

  repo.current = assessment({}, "methodology-v2");
  const methodologyService = new ProductGradeExplanationService(repo, () => ({ apiKey: "key", model: "test-model" }), generate);
  assert.equal((await methodologyService.get("product-1"))?.status, "NOT_GENERATED");
  assert.equal((await methodologyService.generateAndPersist("product-1"))?.methodologyVersion, "methodology-v2");

  const nextPromptService = new ProductGradeExplanationService(repo, () => ({ apiKey: "key", model: "test-model" }), generate, "grade-explanation-prompt-v2");
  assert.equal((await nextPromptService.get("product-1"))?.status, "NOT_GENERATED");
  assert.equal((await nextPromptService.generateAndPersist("product-1"))?.promptVersion, "grade-explanation-prompt-v2");
  assert.equal(generationCount, 2);
});

test("returns the missing-configuration state without calling OpenAI", async () => {
  const repo = new MemoryExplanationRepository();
  let generationCount = 0;
  const service = new ProductGradeExplanationService(repo, () => ({}), async () => {
    generationCount += 1;
    return goodExplanation;
  });
  const result = await service.generateAndPersist("product-1");
  assert.equal(result?.status, "NOT_CONFIGURED");
  assert.equal(result?.explanation, null);
  assert.equal(generationCount, 0);
});

test("insufficient-data results return a deterministic explanation and never call OpenAI", async () => {
  const repo = new MemoryExplanationRepository();
  repo.current = assessment({ energyKcal: null, nutritionBasis: "100ml" });
  let generationCount = 0;
  const service = new ProductGradeExplanationService(repo, () => ({ apiKey: "key", model: "test-model" }), async () => {
    generationCount += 1;
    return goodExplanation;
  });
  const result = await service.generateAndPersist("product-1");
  assert.equal(result?.status, "INSUFFICIENT_DATA");
  assert.equal(result?.aiGenerated, false);
  assert.match(result?.explanation ?? "", /energyKcal is missing/);
  assert.match(result?.explanation ?? "", /unsupported/);
  assert.equal(generationCount, 0);
  assert.equal(repo.saves.length, 0);
});

test("missing products and provider failures are propagated without fabricated text", async () => {
  const repo = new MemoryExplanationRepository();
  repo.current = null;
  const missingProductService = new ProductGradeExplanationService(repo);
  assert.equal(await missingProductService.get("missing"), null);

  repo.current = assessment();
  const failingService = new ProductGradeExplanationService(repo, () => ({ apiKey: "key", model: "test-model" }), async () => {
    throw new Error("provider unavailable");
  });
  await assert.rejects(failingService.generateAndPersist("product-1"));
  assert.equal(repo.saves.length, 0);
});
