import { z } from "zod";

const NutrimentsSchema = z.record(z.string(), z.union([z.number(), z.string(), z.null()])).nullish();
const IngredientNodeSchema: z.ZodType<unknown> = z.lazy(() => z.union([
  z.string(),
  z.object({ text: z.string().nullish(), id: z.string().nullish(), ingredients: z.array(IngredientNodeSchema).nullish() }).passthrough(),
]));

export const OpenFoodFactsProductSchema = z.object({
  code: z.string().nullish(), product_name: z.string().nullish(), product_name_en: z.string().nullish(),
  brands: z.string().nullish(), categories: z.string().nullish(), image_url: z.string().url().nullish().or(z.literal("")),
  quantity: z.string().nullish(), serving_size: z.string().nullish(), ingredients_text: z.string().nullish(), ingredients: z.array(IngredientNodeSchema).nullish(),
  allergens: z.string().nullish(), allergens_tags: z.array(z.string()).nullish(), additives_tags: z.array(z.string()).nullish(),
  nutriments: NutrimentsSchema, nutrition_data_per: z.string().nullish(), last_modified_t: z.number().int().nonnegative().nullish(),
}).passthrough();

export const OpenFoodFactsResponseSchema = z.object({ status: z.union([z.number(), z.string()]), status_verbose: z.string().nullish(), product: OpenFoodFactsProductSchema.nullish() }).passthrough();
export type OpenFoodFactsProduct = z.infer<typeof OpenFoodFactsProductSchema>;
export type NormalizedIngredient = { rawName: string; normalizedName: string; order: number; insCode: string | null };
export type NormalizedNutrition = {
  energyKcal: number | null; protein: number | null; carbohydrate: number | null; sugar: number | null; addedSugar: number | null;
  fat: number | null; saturatedFat: number | null; transFat: number | null; fibre: number | null;
  sodium: number | null; servingSizeG: number | null;
};
export type NormalizedFoodProduct = {
  externalId: string; name: string; brandName: string | null; packageSize: string | null; categoryName: string | null; imageUrl: string | null;
  ingredients: NormalizedIngredient[]; ingredientsText: string | null; allergensText: string | null; allergenNames: string[]; additivesCodes: string[];
  nutrition: NormalizedNutrition | null; nutritionBasis: string | null; missingFields: string[]; sourceUpdatedAt: Date | null; sourceUrl: string;
};

export class OpenFoodFactsUnavailableError extends Error {
  constructor(message = "Product was not found in Open Food Facts") { super(message); this.name = "OpenFoodFactsUnavailableError"; }
}
export class OpenFoodFactsRateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) { super("Open Food Facts lookup limit reached; retry later"); this.name = "OpenFoodFactsRateLimitError"; }
}
export class OpenFoodFactsRequestError extends Error {
  constructor(message: string, readonly status?: number) { super(message); this.name = "OpenFoodFactsRequestError"; }
}
export class IncompleteOpenFoodFactsProductError extends Error {
  constructor() { super("Open Food Facts returned a product without a usable product name"); this.name = "IncompleteOpenFoodFactsProductError"; }
}
