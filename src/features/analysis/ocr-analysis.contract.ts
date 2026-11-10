import { z } from "zod";
import { gradingResultSchema } from "./grading.contract";
import { foodLabelExtractionSchema } from "./food-label.contract";
import type { LabelNutrientKey } from "./food-label-parser";

const amount = (max: number) => z.number().finite().nonnegative().max(max).nullable();

export const reviewedNutritionValuesSchema = z.object({
  energyKcal: amount(100_000),
  fat: amount(100),
  saturatedFat: amount(100),
  transFat: amount(100),
  carbohydrates: amount(100),
  sugars: amount(100),
  fibre: amount(100),
  protein: amount(100),
  sodium: amount(100_000),
  salt: amount(100),
}).strict();

export const confirmedFoodLabelSchema = z.object({
  ingredientsText: z.string().max(10_000),
  nutritionBasis: z.enum(["PER_100G", "PER_100ML"]).nullable(),
  nutritionValues: reviewedNutritionValuesSchema,
}).strict();

export const reviewedOcrSubmissionSchema = z.object({
  idempotencyKey: z.string().uuid(),
  ocrDraft: foodLabelExtractionSchema.extend({ rawText: z.string().max(50_000) }),
  confirmed: confirmedFoodLabelSchema,
}).strict();

const { productId: _productId, ...gradingFields } = gradingResultSchema.shape;
void _productId;

export const ocrAnalysisResultSchema = z.object(gradingFields).extend({
  id: z.string(),
  sourceRawText: z.string(),
  ocrDraft: foodLabelExtractionSchema,
  confirmed: confirmedFoodLabelSchema.extend({
    ingredients: z.array(z.object({ name: z.string(), originalText: z.string(), normalizedName: z.string() }).strict()),
  }),
  corrections: z.object({
    ingredients: z.boolean(),
    nutritionBasis: z.boolean(),
    nutrients: z.array(z.string()),
  }).strict(),
  verification: z.literal("UNVERIFIED"),
}).strict().refine((result) => result.status === "GRADED"
  ? result.grade !== null && result.score !== null
  : result.grade === null && result.score === null, {
  message: "Grade and score must match the assessment status.",
});

export type ReviewedOcrSubmission = z.infer<typeof reviewedOcrSubmissionSchema>;
export type ConfirmedFoodLabel = z.infer<typeof confirmedFoodLabelSchema>;
export type OcrAnalysisResult = z.infer<typeof ocrAnalysisResultSchema>;
export type OcrNutrientKey = LabelNutrientKey;
