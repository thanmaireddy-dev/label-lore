import { prisma } from "@/lib/prisma";
import { normalizeIngredientName } from "@/features/ingestion/open-food-facts.normalizer";
import { splitFoodLabelIngredients } from "./food-label-parser";
import { gradingResultSchema } from "./grading.contract";
import { confirmedFoodLabelSchema } from "./ocr-analysis.contract";
import type { CurrentProductAssessment, GradeExplanationRepository, SavedExplanation } from "./explanation.service";

export class PrismaOcrAnalysisExplanationRepository implements GradeExplanationRepository {
  async loadCurrent(analysisId: string): Promise<CurrentProductAssessment | null> {
    const row = await prisma.foodLabelAnalysis.findUnique({ where: { id: analysisId } });
    if (!row) return null;
    const confirmed = confirmedFoodLabelSchema.parse(row.confirmedData);
    const grade = gradingResultSchema.parse({
      productId: row.id,
      status: row.status,
      grade: row.grade,
      score: row.score,
      methodologyVersion: row.methodologyVersion,
      factors: row.factors,
      dataCompleteness: row.dataCompleteness,
      calculatedAt: row.calculatedAt.toISOString(),
    });
    return {
      productName: "Uploaded food label",
      productVerification: row.verificationStatus,
      grade,
      ingredients: splitFoodLabelIngredients(confirmed.ingredientsText).map(({ name, originalText }) => ({
        sourceText: originalText,
        normalizedName: normalizeIngredientName(name),
        additiveCode: null,
        verification: row.verificationStatus,
      })),
    };
  }

  async findExplanation(analysisId: string, methodologyVersion: string, promptVersion: string): Promise<SavedExplanation | null> {
    const row = await prisma.foodLabelAnalysis.findUnique({
      where: { id: analysisId },
      select: { explanation: true, explanationModel: true, explanationMethodologyVersion: true, explanationPromptVersion: true, explanationCreatedAt: true },
    });
    if (!row || row.explanationMethodologyVersion !== methodologyVersion || row.explanationPromptVersion !== promptVersion
      || !row.explanation || !row.explanationModel || !row.explanationCreatedAt) return null;
    return { explanation: row.explanation, model: row.explanationModel, createdAt: row.explanationCreatedAt };
  }

  async saveExplanation(input: { analysisId: string; methodologyVersion: string; promptVersion: string; explanation: string; model: string }): Promise<SavedExplanation> {
    const row = await prisma.foodLabelAnalysis.update({
      where: { id: input.analysisId },
      data: {
        explanation: input.explanation,
        explanationModel: input.model,
        explanationMethodologyVersion: input.methodologyVersion,
        explanationPromptVersion: input.promptVersion,
        explanationCreatedAt: new Date(),
      },
      select: { explanation: true, explanationModel: true, explanationCreatedAt: true },
    });
    if (!row.explanation || !row.explanationModel || !row.explanationCreatedAt) throw new Error("OCR grade explanation was not persisted.");
    return { explanation: row.explanation, model: row.explanationModel, createdAt: row.explanationCreatedAt };
  }
}
