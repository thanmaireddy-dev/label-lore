import { prisma } from "@/lib/prisma";
import { serverEnv } from "@/lib/env";
import { ProductRepository } from "@/features/products/product.repository";
import { ProductGradingService } from "./grading.service";
import { gradingResultSchema, type PersistedGrade } from "./grading.contract";
import { OpenAIExplanationError, generateOpenAIExplanation, type OpenAIExplanationConfig, type OpenAIExplanationInput } from "./openai-explanation.client";
import type { ExplanationResult } from "./explanation.contract";

export const EXPLANATION_PROMPT_VERSION = "grade-explanation-prompt-v1";

export type SavedExplanation = {
  explanation: string;
  model: string;
  createdAt: Date;
};

export type CurrentProductAssessment = {
  productName: string;
  productVerification: string;
  ingredients: OpenAIExplanationInput["ingredients"];
  grade: PersistedGrade;
};

export interface GradeExplanationRepository {
  loadCurrent(analysisId: string): Promise<CurrentProductAssessment | null>;
  findExplanation(analysisId: string, methodologyVersion: string, promptVersion: string): Promise<SavedExplanation | null>;
  saveExplanation(input: { analysisId: string; methodologyVersion: string; promptVersion: string; explanation: string; model: string }): Promise<SavedExplanation>;
}

export class ExplanationRequestError extends Error {
  constructor(readonly code: "RATE_LIMITED" | "TIMEOUT" | "PROVIDER_ERROR" | "INVALID_RESPONSE") {
    super(code);
    this.name = "ExplanationRequestError";
  }
}

class PrismaGradeExplanationRepository implements GradeExplanationRepository {
  async loadCurrent(analysisId: string): Promise<CurrentProductAssessment | null> {
    const product = await ProductRepository.getById(analysisId);
    if (!product) return null;
    const gradeRow = await ProductGradingService.getOrCalculateCurrent(analysisId);
    if (!gradeRow) return null;
    const parsedGrade = gradingResultSchema.safeParse({
      ...gradeRow,
      calculatedAt: gradeRow.calculatedAt.toISOString(),
    });
    if (!parsedGrade.success) throw new ExplanationRequestError("INVALID_RESPONSE");

    return {
      productName: product.name.slice(0, 160),
      productVerification: product.verificationStatus,
      grade: parsedGrade.data,
      ingredients: product.ingredients.slice(0, 40).map((entry) => ({
        sourceText: entry.rawName?.slice(0, 160) ?? null,
        normalizedName: entry.ingredient?.normalizedName?.slice(0, 160) ?? null,
        additiveCode: entry.ingredient?.additive?.insCode?.slice(0, 20) ?? null,
        verification: entry.verification,
      })),
    };
  }

  findExplanation(analysisId: string, methodologyVersion: string, promptVersion: string): Promise<SavedExplanation | null> {
    return prisma.productGradeExplanation.findUnique({
      where: { productId_methodologyVersion_promptVersion: { productId: analysisId, methodologyVersion, promptVersion } },
      select: { explanation: true, model: true, createdAt: true },
    });
  }

  saveExplanation(input: { analysisId: string; methodologyVersion: string; promptVersion: string; explanation: string; model: string }): Promise<SavedExplanation> {
    return prisma.productGradeExplanation.upsert({
      where: {
        productId_methodologyVersion_promptVersion: {
          productId: input.analysisId,
          methodologyVersion: input.methodologyVersion,
          promptVersion: input.promptVersion,
        },
      },
      create: { productId: input.analysisId, methodologyVersion: input.methodologyVersion, promptVersion: input.promptVersion, explanation: input.explanation, model: input.model },
      update: {},
      select: { explanation: true, model: true, createdAt: true },
    });
  }
}

function insufficientDataExplanation(grade: PersistedGrade): string {
  const completeness = grade.dataCompleteness;
  const reasons = [
    ...completeness.requiredFields.missing.map((field) => `${field} is missing`),
    ...completeness.requiredFields.invalid.map((field) => `${field} is invalid`),
    ...(completeness.basisStatus !== "SUPPORTED" ? [`the nutrition basis is ${completeness.basisStatus.toLowerCase()}`] : []),
  ];
  const detail = reasons.length ? reasons.join(", ") : "the required nutrition data is not sufficient";
  return `No AI explanation was generated because this product has no reliable grade. ${detail}. Nutrition verification is ${completeness.nutritionVerification ?? "unspecified"}.`;
}

function explanationInput(assessment: CurrentProductAssessment): OpenAIExplanationInput {
  const grade = assessment.grade;
  return {
    productName: assessment.productName,
    productVerification: assessment.productVerification,
    grade: grade.grade as string,
    score: grade.score as number,
    methodologyVersion: grade.methodologyVersion,
    nutritionFactors: grade.factors.filter((factor) => factor.category === "nutrition").map((factor) => ({
      key: factor.key,
      effect: factor.effect,
      points: factor.points,
      value: factor.value,
      unit: factor.unit,
      applied: factor.applied,
      explanation: factor.explanation,
    })),
    ingredients: assessment.ingredients,
    dataCompleteness: grade.dataCompleteness,
  };
}

export class ProductGradeExplanationService {
  private readonly inFlight = new Map<string, Promise<ExplanationResult | null>>();

  constructor(
    private readonly repository: GradeExplanationRepository = new PrismaGradeExplanationRepository(),
    private readonly getConfig: () => Partial<OpenAIExplanationConfig> = () => ({ apiKey: serverEnv.openAiApiKey ?? undefined, model: serverEnv.openAiModel ?? undefined }),
    private readonly generate: (input: OpenAIExplanationInput, config: OpenAIExplanationConfig) => Promise<string> = generateOpenAIExplanation,
    private readonly promptVersion = EXPLANATION_PROMPT_VERSION,
  ) {}

  async get(analysisId: string): Promise<ExplanationResult | null> {
    return this.resolve(analysisId, false);
  }

  async generateAndPersist(analysisId: string): Promise<ExplanationResult | null> {
    const active = this.inFlight.get(analysisId);
    if (active) return active;
    const request = this.resolve(analysisId, true).finally(() => this.inFlight.delete(analysisId));
    this.inFlight.set(analysisId, request);
    return request;
  }

  private async resolve(analysisId: string, shouldGenerate: boolean): Promise<ExplanationResult | null> {
    const assessment = await this.repository.loadCurrent(analysisId);
    if (!assessment) return null;
    const grade = assessment.grade;
    if (grade.status === "INSUFFICIENT_DATA") {
      return {
        status: "INSUFFICIENT_DATA",
        explanation: insufficientDataExplanation(grade),
        aiGenerated: false,
        methodologyVersion: grade.methodologyVersion,
        promptVersion: this.promptVersion,
        model: null,
        generatedAt: null,
      };
    }

    const saved = await this.repository.findExplanation(analysisId, grade.methodologyVersion, this.promptVersion);
    if (saved) {
      return {
        status: "GENERATED",
        explanation: saved.explanation,
        aiGenerated: true,
        methodologyVersion: grade.methodologyVersion,
        promptVersion: this.promptVersion,
        model: saved.model,
        generatedAt: saved.createdAt.toISOString(),
      };
    }

    const partialConfig = this.getConfig();
    const apiKey = partialConfig.apiKey?.trim();
    const model = partialConfig.model?.trim();
    if (!apiKey || !model) {
      return {
        status: "NOT_CONFIGURED",
        explanation: null,
        aiGenerated: false,
        methodologyVersion: grade.methodologyVersion,
        promptVersion: this.promptVersion,
        model: null,
        generatedAt: null,
      };
    }
    if (!shouldGenerate) {
      return {
        status: "NOT_GENERATED",
        explanation: null,
        aiGenerated: false,
        methodologyVersion: grade.methodologyVersion,
        promptVersion: this.promptVersion,
        model: null,
        generatedAt: null,
      };
    }

    let explanation: string;
    try {
      explanation = await this.generate(explanationInput(assessment), { apiKey, model });
    } catch (error) {
      if (error instanceof OpenAIExplanationError) throw new ExplanationRequestError(error.code);
      throw error;
    }
    const persisted = await this.repository.saveExplanation({
      analysisId,
      methodologyVersion: grade.methodologyVersion,
      promptVersion: this.promptVersion,
      explanation,
      model,
    });
    return {
      status: "GENERATED",
      explanation: persisted.explanation,
      aiGenerated: true,
      methodologyVersion: grade.methodologyVersion,
      promptVersion: this.promptVersion,
      model: persisted.model,
      generatedAt: persisted.createdAt.toISOString(),
    };
  }
}

export const productGradeExplanationService = new ProductGradeExplanationService();
