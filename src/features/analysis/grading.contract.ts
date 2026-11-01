import { z } from "zod";

export const gradingResultSchema = z.object({
  productId: z.string(),
  status: z.enum(["GRADED", "INSUFFICIENT_DATA"]),
  grade: z.enum(["A", "B", "C", "D", "E"]).nullable(),
  score: z.number().nullable(),
  methodologyVersion: z.string(),
  factors: z.array(z.object({
    key: z.string(),
    category: z.enum(["nutrition", "ingredients", "data"]),
    effect: z.enum(["risk", "benefit", "neutral"]),
    points: z.number(),
    value: z.union([z.number(), z.string(), z.null()]),
    unit: z.string().nullable(),
    thresholds: z.array(z.number()).optional(),
    applied: z.boolean(),
    explanation: z.string(),
  })),
  dataCompleteness: z.object({
    nutritionBasis: z.string().nullable(),
    nutritionVerification: z.string().nullable(),
    basisStatus: z.enum(["SUPPORTED", "MISSING", "UNSUPPORTED"]),
    requiredFields: z.object({ available: z.number(), total: z.number(), missing: z.array(z.string()), invalid: z.array(z.string()) }),
    optionalFields: z.object({ fibre: z.boolean(), protein: z.boolean(), transFat: z.boolean() }),
    invalidOptionalFields: z.array(z.string()),
    ingredientsAvailable: z.boolean(),
    ingredientCount: z.number(),
    recognizedAdditiveCodes: z.array(z.string()),
    unrecognizedAdditiveCodes: z.array(z.string()),
    uncertainties: z.array(z.string()),
  }),
  calculatedAt: z.string().datetime(),
}).refine((result) => result.status === "GRADED"
  ? result.grade !== null && result.score !== null
  : result.grade === null && result.score === null, {
  message: "Grade and score must match the assessment status.",
});

export const gradingResponseSchema = z.object({ data: gradingResultSchema });
export type PersistedGrade = z.infer<typeof gradingResultSchema>;
