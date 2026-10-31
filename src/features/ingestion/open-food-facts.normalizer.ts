import { OpenFoodFactsProductSchema, type NormalizedFoodProduct, type NormalizedIngredient, type NormalizedNutrition, type OpenFoodFactsProduct } from "./open-food-facts.types";

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function basisSuffixes(product: OpenFoodFactsProduct): string[] {
  const basis = product.nutrition_data_per?.toLocaleLowerCase("en-US") ?? "";
  return basis.includes("100ml") ? ["_100ml", "_100g"] : ["_100g", "_100ml"];
}
function pickNutrient(n: Record<string, unknown> | undefined, product: OpenFoodFactsProduct, ...keys: string[]): number | null {
  if (!n) return null;
  for (const suffix of basisSuffixes(product)) {
    for (const key of keys) {
      const value = toFiniteNumber(n[`${key}${suffix}`]);
      if (value !== null) return value;
    }
  }
  for (const key of keys) {
    const value = toFiniteNumber(n[`${key}_value`] ?? n[key]);
    if (value !== null) return value;
  }
  return null;
}
function pickSodiumMg(n: Record<string, unknown> | undefined, product: OpenFoodFactsProduct): number | null {
  if (!n) return null;
  for (const suffix of basisSuffixes(product)) {
    const milligrams = toFiniteNumber(n[`sodium_mg${suffix}`]);
    if (milligrams !== null) return milligrams;
  }
  const sodium = pickNutrient(n, product, "sodium");
  if (sodium === null) return toFiniteNumber(n.sodium_mg_value);
  const unit = typeof n.sodium_unit === "string" ? n.sodium_unit.trim().toLocaleLowerCase("en-US") : "g";
  if (["mg", "milligram", "milligrams"].includes(unit)) return sodium;
  if (["g", "gram", "grams"].includes(unit)) return sodium * 1000;
  return null;
}
function pickSaltG(n: Record<string, unknown> | undefined, product: OpenFoodFactsProduct): number | null {
  if (!n) return null;
  const unit = typeof n.salt_unit === "string" ? n.salt_unit.trim().toLocaleLowerCase("en-US") : "g";
  for (const suffix of basisSuffixes(product)) {
    const grams = toFiniteNumber(n[`salt${suffix}`]);
    if (grams !== null) {
      if (["g", "gram", "grams"].includes(unit)) return grams;
      if (["mg", "milligram", "milligrams"].includes(unit)) return grams / 1000;
      return null;
    }
    const milligrams = toFiniteNumber(n[`salt_mg${suffix}`]);
    if (milligrams !== null) return milligrams / 1000;
  }
  const saltValue = toFiniteNumber(n.salt_value ?? n.salt);
  if (saltValue !== null) {
    if (["g", "gram", "grams"].includes(unit)) return saltValue;
    if (["mg", "milligram", "milligrams"].includes(unit)) return saltValue / 1000;
    return null;
  }
  const milligrams = toFiniteNumber(n.salt_mg_value);
  return milligrams === null ? null : milligrams / 1000;
}
function normalizedName(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en-US")
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[‐‑‒–—]/g, "-")
    .trim().replace(/\s+([,.;:!?])/g, "$1").replace(/([([{])\s+/g, "$1")
    .replace(/\s+([)\]}])/g, "$1").replace(/[.,;:!?]+$/g, "").replace(/\s+/g, " ");
}
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
  return items.map((rawName, index) => ({ rawName, normalizedName: normalizedName(rawName), order: index, insCode: extractInsCode(rawName) })).filter((item) => item.normalizedName.length > 0);
}
function normalizeNutrition(product: OpenFoodFactsProduct): NormalizedNutrition | null {
  const n = product.nutriments as Record<string, unknown> | undefined; if (!n) return null;
  const energyInKj = pickNutrient(n, product, "energy-kj");
  const energyKcal = pickNutrient(n, product, "energy-kcal") ?? (energyInKj === null ? null : energyInKj / 4.184);
  const result: NormalizedNutrition = {
    energyKcal,
    protein: pickNutrient(n, product, "proteins"), carbohydrate: pickNutrient(n, product, "carbohydrates"),
    sugar: pickNutrient(n, product, "sugars"), addedSugar: pickNutrient(n, product, "added-sugars"), fat: pickNutrient(n, product, "fat"),
    saturatedFat: pickNutrient(n, product, "saturated-fat"), transFat: pickNutrient(n, product, "trans-fat"),
    fibre: pickNutrient(n, product, "fiber", "fibre"),
    salt: pickSaltG(n, product),
    sodium: pickSodiumMg(n, product),
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
