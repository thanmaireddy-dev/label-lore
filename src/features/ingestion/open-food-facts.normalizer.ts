import { OpenFoodFactsProductSchema, type NormalizedFoodProduct, type NormalizedIngredient, type NormalizedNutrition, type OpenFoodFactsProduct } from "./open-food-facts.types";

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function pickNutrient(n: Record<string, unknown> | undefined, ...keys: string[]): number | null {
  if (!n) return null;
  for (const key of keys) { const value = toFiniteNumber(n[key]); if (value !== null) return value; }
  return null;
}
function normalizedName(value: string): string { return value.normalize("NFKC").trim().toLocaleLowerCase("en-US").replace(/\s+/g, " "); }
function extractIngredientText(item: unknown): string[] {
  if (typeof item === "string") return [item];
  if (!item || typeof item !== "object") return [];
  const node = item as { text?: unknown; ingredients?: unknown };
  if (typeof node.text === "string" && node.text.trim()) return [node.text];
  if (Array.isArray(node.ingredients) && node.ingredients.length) return node.ingredients.flatMap(extractIngredientText);
  return [];
}
function splitIngredientText(text: string): string[] {
  const parts: string[] = []; let depth = 0; let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "(" || text[i] === "[") depth += 1;
    if (text[i] === ")" || text[i] === "]") depth = Math.max(0, depth - 1);
    if ((text[i] === "," || text[i] === ";") && depth === 0) { parts.push(text.slice(start, i)); start = i + 1; }
  }
  parts.push(text.slice(start)); return parts.map((p) => p.trim()).filter(Boolean);
}
function extractInsCode(value: string): string | null {
  const match = value.match(/\b(?:INS\s*)?(\d{3,4}[a-z]?)\b/i) ?? value.match(/\be(\d{3,4}[a-z]?)\b/i);
  return match?.[1]?.toUpperCase() ?? null;
}
function parseQuantityInGrams(value: string | null | undefined): number | null {
  if (!value) return null; const match = value.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram|grams)\b/i);
  return match ? toFiniteNumber(match[1].replace(",", ".")) : null;
}
function normalizeIngredients(product: OpenFoodFactsProduct, label: string | null): NormalizedIngredient[] {
  const structured = product.ingredients?.flatMap(extractIngredientText).map((v) => v.trim()).filter(Boolean) ?? [];
  const items = structured.length ? structured : label ? splitIngredientText(label) : [];
  return items.map((rawName, index) => ({ rawName, normalizedName: normalizedName(rawName.replace(/\s*\([^)]*\)\s*$/, "")), order: index, insCode: extractInsCode(rawName) })).filter((item) => item.normalizedName.length > 0);
}
function normalizeNutrition(product: OpenFoodFactsProduct): NormalizedNutrition | null {
  const n = product.nutriments as Record<string, unknown> | undefined; if (!n) return null;
  const sodiumGrams = pickNutrient(n, "sodium_100g", "sodium_value");
  const result: NormalizedNutrition = {
    energyKcal: pickNutrient(n, "energy-kcal_100g", "energy-kcal_value", "energy-kcal") ?? ((pickNutrient(n, "energy-kj_100g") ?? 0) / 4.184 || null),
    protein: pickNutrient(n, "proteins_100g", "proteins_value"), carbohydrate: pickNutrient(n, "carbohydrates_100g", "carbohydrates_value"),
    sugar: pickNutrient(n, "sugars_100g", "sugars_value"), addedSugar: pickNutrient(n, "added-sugars_100g", "added-sugars_value"), fat: pickNutrient(n, "fat_100g", "fat_value"),
    saturatedFat: pickNutrient(n, "saturated-fat_100g", "saturated-fat_value"), transFat: pickNutrient(n, "trans-fat_100g", "trans-fat_value"),
    fibre: pickNutrient(n, "fiber_100g", "fiber_value", "fibre_100g"),
    sodium: sodiumGrams === null ? pickNutrient(n, "sodium_mg_100g") : sodiumGrams * 1000,
    servingSizeG: parseQuantityInGrams(product.serving_size),
  };
  return Object.entries(result).some(([key, value]) => key !== "servingSizeG" && value !== null) ? result : null;
}

export function normalizeOpenFoodFactsProduct(input: unknown, requestedBarcode: string): NormalizedFoodProduct {
  const product = OpenFoodFactsProductSchema.parse(input);
  const name = product.product_name?.trim() || product.product_name_en?.trim();
  if (!name) throw new Error("Open Food Facts product is missing its product name");
  const ingredientsText = product.ingredients_text?.trim() || null;
  const nutrition = normalizeNutrition(product);
  const brandName = product.brands?.split(",")[0]?.trim() || null;
  const categoryName = product.categories?.split(",").map((value) => value.trim()).filter(Boolean).at(-1) || null;
  const sourceUpdatedAt = product.last_modified_t ? new Date(product.last_modified_t * 1000) : null;
  const ingredients = normalizeIngredients(product, ingredientsText);
  const missingFields = [
    ...(!brandName ? ["brand"] : []),
    ...(!categoryName ? ["category"] : []),
    ...(!ingredientsText && ingredients.length === 0 ? ["ingredients"] : []),
    ...(!nutrition ? ["nutrition"] : Object.entries(nutrition).filter(([key, value]) => key !== "servingSizeG" && value === null).map(([key]) => `nutrition.${key}`)),
    ...(nutrition && !product.nutrition_data_per ? ["nutritionBasis"] : []),
    ...(!product.allergens && !product.allergens_tags?.length ? ["allergens"] : []),
  ];
  return {
    externalId: product.code || requestedBarcode, name, brandName, packageSize: product.quantity?.trim() || null, categoryName, imageUrl: product.image_url || null,
    ingredients, ingredientsText, allergensText: product.allergens?.trim() || product.allergens_tags?.join(", ") || null,
    allergenNames: [...new Set((product.allergens_tags ?? []).map((tag) => tag.split(":").at(-1)?.replace(/-/g, " ").trim().toLocaleLowerCase("en-US")).filter((name): name is string => Boolean(name)))],
    additivesCodes: [...new Set((product.additives_tags ?? []).map((tag) => tag.match(/(?:^|:)e(\d{3,4}[a-z]?)(?:$|\b)/i)?.[1]?.toUpperCase()).filter((code): code is string => Boolean(code)))],
    nutrition, nutritionBasis: product.nutrition_data_per?.trim() || null, missingFields, sourceUpdatedAt: sourceUpdatedAt && !Number.isNaN(sourceUpdatedAt.getTime()) ? sourceUpdatedAt : null,
    sourceUrl: `https://world.openfoodfacts.org/product/${encodeURIComponent(product.code || requestedBarcode)}`,
  };
}
