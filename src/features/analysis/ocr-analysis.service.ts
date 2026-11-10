import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeIngredientName } from "@/features/ingestion/open-food-facts.normalizer";
import { splitFoodLabelIngredients, type LabelNutrientKey } from "./food-label-parser";
import { scoreProduct, GRADING_METHODOLOGY_VERSION, type GradeProductInput } from "./grading";
import { gradingResultSchema } from "./grading.contract";
import { confirmedFoodLabelSchema, ocrAnalysisResultSchema, reviewedOcrSubmissionSchema, type ConfirmedFoodLabel, type OcrAnalysisResult, type ReviewedOcrSubmission } from "./ocr-analysis.contract";

export type SavedOcrAnalysis = {
  id: string;
  submissionKey: string;
  submissionFingerprint: string;
  sourceRawText: string;
  ocrDraft: Prisma.JsonValue;
  confirmedData: Prisma.JsonValue;
  nutritionBasis: string | null;
  verificationStatus: string;
  status: string;
  grade: string | null;
  score: number | null;
  methodologyVersion: string;
  factors: Prisma.JsonValue;
  dataCompleteness: Prisma.JsonValue;
  calculatedAt: Date;
  explanation: string | null;
  explanationModel: string | null;
  explanationMethodologyVersion: string | null;
  explanationPromptVersion: string | null;
  explanationCreatedAt: Date | null;
  createdAt: Date;
};

export type NewOcrAnalysis = Omit<SavedOcrAnalysis, "id" | "createdAt" | "explanation" | "explanationModel" | "explanationMethodologyVersion" | "explanationPromptVersion" | "explanationCreatedAt" | "ocrDraft" | "confirmedData" | "factors" | "dataCompleteness" | "verificationStatus"> & {
  verificationStatus: "UNVERIFIED";
  ocrDraft: Prisma.InputJsonValue;
  confirmedData: Prisma.InputJsonValue;
  factors: Prisma.InputJsonValue;
  dataCompleteness: Prisma.InputJsonValue;
};

export interface OcrAnalysisRepository {
  findBySubmissionKey(submissionKey: string): Promise<SavedOcrAnalysis | null>;
  create(input: NewOcrAnalysis): Promise<SavedOcrAnalysis>;
  findById(id: string): Promise<SavedOcrAnalysis | null>;
}

export class OcrAnalysisConflictError extends Error {
  constructor() {
    super("This analysis submission key was already used for different reviewed data.");
    this.name = "OcrAnalysisConflictError";
  }
}

class PrismaOcrAnalysisRepository implements OcrAnalysisRepository {
  findBySubmissionKey(submissionKey: string): Promise<SavedOcrAnalysis | null> {
    return prisma.foodLabelAnalysis.findUnique({ where: { submissionKey } });
  }

  create(input: NewOcrAnalysis): Promise<SavedOcrAnalysis> {
    return prisma.foodLabelAnalysis.create({ data: input });
  }

  findById(id: string): Promise<SavedOcrAnalysis | null> {
    return prisma.foodLabelAnalysis.findUnique({ where: { id } });
  }
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function submissionFingerprint(input: ReviewedOcrSubmission): string {
  const content = canonicalJson({ ocrDraft: input.ocrDraft, confirmed: input.confirmed });
  return createHash("sha256").update(content).digest("hex");
}

function toGradeInput(analysisId: string, confirmed: ConfirmedFoodLabel): GradeProductInput {
  const ingredients = splitFoodLabelIngredients(confirmed.ingredientsText).map(({ name, originalText }) => ({
    rawName: originalText,
    normalizedName: normalizeIngredientName(name),
    additive: null,
  }));
  const values = confirmed.nutritionValues;
  return {
    productId: analysisId,
    ingredients,
    nutrition: {
      energyKcal: values.energyKcal,
      saturatedFat: values.saturatedFat,
      sugar: values.sugars,
      sodium: values.sodium,
      salt: values.salt,
      fibre: values.fibre,
      protein: values.protein,
      transFat: values.transFat,
      nutritionBasis: confirmed.nutritionBasis === "PER_100G" ? "100g" : confirmed.nutritionBasis === "PER_100ML" ? "100ml" : null,
      verification: "UNVERIFIED",
    },
  };
}

function correctionDetails(draft: ReviewedOcrSubmission["ocrDraft"], confirmed: ConfirmedFoodLabel) {
  const nutrients = (Object.keys(confirmed.nutritionValues) as LabelNutrientKey[]).filter((key) =>
    draft.nutrition.values[key].value !== confirmed.nutritionValues[key]);
  return {
    ingredients: (draft.ingredients.originalText ?? "") !== confirmed.ingredientsText,
    nutritionBasis: draft.nutrition.basis !== confirmed.nutritionBasis,
    nutrients,
  };
}

function view(record: SavedOcrAnalysis): OcrAnalysisResult {
  const draft = reviewedOcrSubmissionSchema.shape.ocrDraft.parse(record.ocrDraft);
  const confirmed = confirmedFoodLabelSchema.parse(record.confirmedData);
  const grade = gradingResultSchema.parse({
    productId: record.id,
    status: record.status,
    grade: record.grade,
    score: record.score,
    methodologyVersion: record.methodologyVersion,
    factors: record.factors,
    dataCompleteness: record.dataCompleteness,
    calculatedAt: record.calculatedAt.toISOString(),
  });
  const { productId: _productId, ...gradeFields } = grade;
  void _productId;
  const ingredients = splitFoodLabelIngredients(confirmed.ingredientsText).map(({ name, originalText }) => ({
    name,
    originalText,
    normalizedName: normalizeIngredientName(name),
  }));
  return ocrAnalysisResultSchema.parse({
    ...gradeFields,
    id: record.id,
    sourceRawText: record.sourceRawText,
    ocrDraft: draft,
    confirmed: { ...confirmed, ingredients },
    corrections: correctionDetails(draft, confirmed),
    verification: record.verificationStatus,
  });
}

export class OcrFoodLabelAnalysisService {
  constructor(private readonly repository: OcrAnalysisRepository = new PrismaOcrAnalysisRepository()) {}

  async analyze(rawInput: unknown): Promise<OcrAnalysisResult> {
    const parsed = reviewedOcrSubmissionSchema.parse(rawInput);
    const fingerprint = submissionFingerprint(parsed);
    const existing = await this.repository.findBySubmissionKey(parsed.idempotencyKey);
    if (existing) {
      if (existing.submissionFingerprint !== fingerprint) throw new OcrAnalysisConflictError();
      return view(existing);
    }

    const analysisId = `ocr:${parsed.idempotencyKey}`;
    const grade = scoreProduct(toGradeInput(analysisId, parsed.confirmed));
    const createInput: NewOcrAnalysis = {
      submissionKey: parsed.idempotencyKey,
      submissionFingerprint: fingerprint,
      sourceRawText: parsed.ocrDraft.rawText,
      ocrDraft: parsed.ocrDraft as Prisma.InputJsonValue,
      confirmedData: parsed.confirmed as Prisma.InputJsonValue,
      nutritionBasis: parsed.confirmed.nutritionBasis,
      verificationStatus: "UNVERIFIED",
      status: grade.status,
      grade: grade.grade,
      score: grade.score,
      methodologyVersion: GRADING_METHODOLOGY_VERSION,
      factors: grade.factors as unknown as Prisma.InputJsonValue,
      dataCompleteness: grade.dataCompleteness as unknown as Prisma.InputJsonValue,
      calculatedAt: new Date(),
    };

    try {
      return view(await this.repository.create(createInput));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const concurrent = await this.repository.findBySubmissionKey(parsed.idempotencyKey);
        if (concurrent) {
          if (concurrent.submissionFingerprint !== fingerprint) throw new OcrAnalysisConflictError();
          return view(concurrent);
        }
      }
      throw error;
    }
  }

  async getById(id: string): Promise<OcrAnalysisResult | null> {
    const record = await this.repository.findById(id);
    return record ? view(record) : null;
  }
}

export const ocrFoodLabelAnalysisService = new OcrFoodLabelAnalysisService();
