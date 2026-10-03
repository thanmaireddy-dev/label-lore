/**
 * Domain type definitions — Phase 0 sketch.
 *
 * These are intentionally minimal stubs. They establish the names and rough
 * shapes of core domain concepts without over-specifying the data model before
 * Phase 2 (Prisma schema design).
 *
 * Rules:
 *   - DO NOT add fields you don't yet know you need
 *   - DO reference these types in API route handlers and service modules
 *   - DO expand them in Phase 2/3 as the schema and analysis engine are built
 *
 * The comments explain *why* each field is present, not what TypeScript means.
 */

// ─── Product ────────────────────────────────────────────────────────────────

/**
 * A single packaged food product as understood by the system.
 * This is the normalised internal representation — whether data comes
 * from manual entry, an external dataset, or future OCR, it all becomes
 * a FoodProduct before reaching the analysis engine.
 */
export interface FoodProduct {
  id:          string;
  name:        string;
  brand:       string;
  category?:   string;            // e.g. "biscuits", "namkeen", "health drink"
  ingredients: Ingredient[];
  nutrition:   NutritionPer100g;
  claims?:     MarketingClaim[];  // front-of-pack claims, added in Phase 3
  imageUrl?:   string;
}

// ─── Ingredient ─────────────────────────────────────────────────────────────

/**
 * A single parsed ingredient from the product's ingredient list.
 * insCode is the Indian Standard (INS) additive number where applicable
 * (e.g., "INS 621" = monosodium glutamate).
 */
export interface Ingredient {
  name:      string;
  insCode?:  string;  // e.g. "621", "330"
  quantity?: string;  // percentage or mass where declared on label
}

// ─── Nutrition ──────────────────────────────────────────────────────────────

/**
 * Nutritional values normalised to per-100g / per-100ml basis.
 * All values in grams unless noted. This normalisation is essential for
 * comparing products that use different serving sizes on their labels.
 */
export interface NutritionPer100g {
  energyKcal:      number;
  protein:         number;
  carbohydrate:    number;
  sugar?:          number;
  addedSugar?:     number;  // declared separately on newer FSSAI-compliant labels
  fat:             number;
  saturatedFat?:   number;
  transFat?:       number;
  fibre?:          number;
  sodium?:         number;  // mg per 100g
  servingSizeG?:   number;  // stored for per-serving display, not analysis basis
}

// ─── Claims ─────────────────────────────────────────────────────────────────

/**
 * A front-of-pack marketing claim found on the product packaging.
 * Examples: "High Protein", "No Added Sugar", "Made with Whole Grains"
 */
export interface MarketingClaim {
  text:       string;          // exact claim text from packaging
  category?:  ClaimCategory;
}

export type ClaimCategory =
  | "nutrition"    // e.g. "High Protein", "Low Fat"
  | "ingredient"   // e.g. "No Preservatives", "No Artificial Colours"
  | "process"      // e.g. "Cold Pressed", "Stone Ground"
  | "marketing";   // e.g. "Immunity Boosting" (vague/aspirational)

// ─── Analysis ───────────────────────────────────────────────────────────────

/**
 * The structured output of the deterministic analysis engine (Phase 3).
 * The AI explanation layer (Phase 5) receives this as input and generates
 * natural-language summaries from it — the AI does NOT produce the score.
 */
export interface AnalysisResult {
  productId:    string;
  nutrition:    NutritionAnalysis;  // detailed in Phase 3
  ingredients:  IngredientAnalysis; // detailed in Phase 3
  claims?:      ClaimAnalysis[];    // detailed in Phase 3
  score?:       Score;              // detailed in Phase 3
  analysedAt:   Date;
}

// Placeholder shapes — will be fully defined in Phase 3
export interface NutritionAnalysis  { summary: string }
export interface IngredientAnalysis { summary: string }
export interface ClaimAnalysis      { claim: MarketingClaim; status: string }

// ─── Score ──────────────────────────────────────────────────────────────────

/**
 * Explainable grade — the overall assessment and its component breakdown.
 * The grade must never be a black-box number; every sub-score has a label
 * and a brief rationale so the UI can explain WHY the product received it.
 */
export interface Score {
  grade:       "A" | "B" | "C" | "D";
  overall:     number;      // 0–100
  breakdown:   ScoreBreakdown[];
}

export interface ScoreBreakdown {
  dimension: string;        // e.g. "Nutrition", "Ingredient Safety", "Processing"
  score:     number;        // 0–100
  rationale: string;        // one sentence explaining the sub-score
}

// ─── Scan ───────────────────────────────────────────────────────────────────

/**
 * Represents a single user scan event (Phase 4+).
 * A scan may originate from manual entry or OCR image upload.
 */
export interface Scan {
  id:        string;
  productId: string;
  source:    "manual" | "ocr";
  createdAt: Date;
}
