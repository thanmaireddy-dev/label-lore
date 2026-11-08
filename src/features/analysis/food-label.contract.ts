import { z } from "zod";

const nutrientValueSchema = z.object({
  value: z.number().nonnegative().nullable(),
  unit: z.enum(["kcal", "g", "mg"]),
  sourceText: z.string().nullable(),
  status: z.enum(["UNVERIFIED", "UNAVAILABLE"]),
}).strict();

export const foodLabelExtractionSchema = z.object({
  rawText: z.string(),
  ingredients: z.object({
    originalText: z.string().nullable(),
    items: z.array(z.object({ name: z.string(), originalText: z.string() }).strict()),
  }).strict(),
  nutrition: z.object({
    basis: z.enum(["PER_100G", "PER_100ML"]).nullable(),
    values: z.object({
      energyKcal: nutrientValueSchema,
      fat: nutrientValueSchema,
      saturatedFat: nutrientValueSchema,
      transFat: nutrientValueSchema,
      carbohydrates: nutrientValueSchema,
      sugars: nutrientValueSchema,
      fibre: nutrientValueSchema,
      protein: nutrientValueSchema,
      sodium: nutrientValueSchema,
      salt: nutrientValueSchema,
    }).strict(),
  }).strict(),
  warnings: z.array(z.string()),
}).strict();

export const foodLabelExtractionResponseSchema = z.object({ data: foodLabelExtractionSchema }).strict();
