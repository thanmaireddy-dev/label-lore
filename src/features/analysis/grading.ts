export const GRADING_METHODOLOGY_VERSION = "label-lore-npm2004-adapted-v1";

export type ProductGrade = "A" | "B" | "C" | "D" | "E";
export type GradingStatus = "GRADED" | "INSUFFICIENT_DATA";

export type GradeIngredientInput = {
  rawName: string | null;
  normalizedName: string | null;
  additive: { insCode: string; commonName: string } | null;
};

export type GradeProductInput = {
  productId: string;
  nutrition: {
    energyKcal: number | null;
    saturatedFat: number | null;
    sugar: number | null;
    sodium: number | null;
    salt: number | null;
    fibre: number | null;
    protein: number | null;
    transFat: number | null;
    nutritionBasis: string | null;
    verification: string | null;
  } | null;
  ingredients: GradeIngredientInput[];
};

export type GradingFactor = {
  key: string;
  category: "nutrition" | "ingredients" | "data";
  effect: "risk" | "benefit" | "neutral";
  points: number;
  value: number | string | null;
  unit: string | null;
  thresholds?: number[];
  applied: boolean;
  explanation: string;
};

export type GradeDataCompleteness = {
  nutritionBasis: string | null;
  nutritionVerification: string | null;
  basisStatus: "SUPPORTED" | "MISSING" | "UNSUPPORTED";
  requiredFields: { available: number; total: number; missing: string[]; invalid: string[] };
  optionalFields: { fibre: boolean; protein: boolean; transFat: boolean };
  invalidOptionalFields: string[];
  ingredientsAvailable: boolean;
  ingredientCount: number;
  recognizedAdditiveCodes: string[];
  unrecognizedAdditiveCodes: string[];
  uncertainties: string[];
};

export type ProductGradeAssessment = {
  productId: string;
  status: GradingStatus;
  grade: ProductGrade | null;
  score: number | null;
  methodologyVersion: string;
  netProfilePoints: number | null;
  factors: GradingFactor[];
  dataCompleteness: GradeDataCompleteness;
};

const thresholds = {
  energyKj: [335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350],
  saturatedFatG: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  totalSugarsG: [4.5, 9, 13.5, 18, 22.5, 27, 31, 36, 40, 45],
  sodiumMg: [90, 180, 270, 360, 450, 540, 630, 720, 810, 900],
  fibreG: [0.9, 1.9, 2.8, 3.7, 4.7],
  proteinG: [1.6, 3.2, 4.8, 6.4, 8],
} as const;

function validNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function pointsAbove(value: number, cutoffs: readonly number[]): number {
  return cutoffs.filter((cutoff) => value > cutoff).length;
}

function canonicalBasis(value: string | null | undefined): "100g" | "100ml" | null {
  const basis = value?.trim().toLocaleLowerCase("en-US").replace(/\s+/g, "") ?? "";
  if (/^(?:per)?100g$/.test(basis)) return "100g";
  if (/^(?:per)?100ml$/.test(basis)) return "100ml";
  return null;
}

function mapGrade(score: number): ProductGrade {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "E";
}

function additiveEvidence(ingredients: GradeIngredientInput[]) {
  const recognized = new Set<string>();
  const unrecognized = new Set<string>();
  for (const ingredient of ingredients) {
    if (ingredient.additive?.insCode) recognized.add(ingredient.additive.insCode.toUpperCase());
    const match = ingredient.rawName?.match(/\b(?:INS\s*|E\s*)(\d{3,4}[a-z]?)\b/i);
    if (match) {
      const code = match[1].toUpperCase();
      if (ingredient.additive?.insCode?.toUpperCase() === code) recognized.add(code);
      else unrecognized.add(code);
    }
  }
  return { recognized: [...recognized].sort(), unrecognized: [...unrecognized].sort() };
}

function makeCompleteness(input: GradeProductInput): GradeDataCompleteness {
  const nutrition = input.nutrition;
  const basis = canonicalBasis(nutrition?.nutritionBasis);
  const basisStatus = !nutrition?.nutritionBasis
    ? "MISSING"
    : basis === "100g" ? "SUPPORTED" : "UNSUPPORTED";
  const required = [
    ["energyKcal", nutrition?.energyKcal],
    ["saturatedFat", nutrition?.saturatedFat],
    ["sugar", nutrition?.sugar],
  ] as const;
  const missing: string[] = nutrition ? required.filter(([, value]) => value == null).map(([name]) => name) : required.map(([name]) => name);
  const invalid: string[] = nutrition ? required.filter(([, value]) => value != null && !validNonNegativeNumber(value)).map(([name]) => name) : [];
  const sodiumValid = validNonNegativeNumber(nutrition?.sodium);
  const saltValid = validNonNegativeNumber(nutrition?.salt);
  if (!sodiumValid && !saltValid) {
    const hasSodium = nutrition?.sodium != null;
    const hasSalt = nutrition?.salt != null;
    if (hasSodium) invalid.push("sodium");
    if (hasSalt) invalid.push("salt");
    missing.push("sodiumOrSalt");
  } else if (nutrition?.sodium != null && !sodiumValid) {
    invalid.push("sodium");
  } else if (nutrition?.salt != null && !saltValid) {
    invalid.push("salt");
  }
  const validRequiredCount = required.filter(([, value]) => validNonNegativeNumber(value)).length + ((sodiumValid || saltValid) ? 1 : 0);
  const available = (basisStatus === "SUPPORTED" ? 1 : 0) + validRequiredCount;
  const evidence = additiveEvidence(input.ingredients ?? []);
  return {
    nutritionBasis: nutrition?.nutritionBasis ?? null,
    nutritionVerification: nutrition?.verification ?? null,
    basisStatus,
    requiredFields: { available: Math.max(0, available), total: 5, missing: [...new Set(missing)], invalid: [...new Set(invalid)] },
    optionalFields: {
      fibre: validNonNegativeNumber(nutrition?.fibre),
      protein: validNonNegativeNumber(nutrition?.protein),
      transFat: validNonNegativeNumber(nutrition?.transFat),
    },
    invalidOptionalFields: nutrition ? (["fibre", "protein", "transFat"] as const).filter((key) => nutrition[key] != null && !validNonNegativeNumber(nutrition[key])) : [],
    ingredientsAvailable: (input.ingredients?.length ?? 0) > 0,
    ingredientCount: input.ingredients?.length ?? 0,
    recognizedAdditiveCodes: evidence.recognized,
    unrecognizedAdditiveCodes: evidence.unrecognized,
    uncertainties: [
      ...(validNonNegativeNumber(nutrition?.fibre) ? ["OFF does not provide a verified fibre analysis method here; any fibre bonus is provisional."] : []),
      ...(nutrition?.verification && nutrition.verification !== "REGULATORY_VERIFIED" ? [`Nutrition verification status is ${nutrition.verification}.`] : []),
      "Ingredient and INS reference data have no verified hazard classification and do not affect the grade.",
      ...(basis === "100ml" ? ["Reference thresholds are per 100g; product density is unavailable for a valid 100ml-to-100g conversion."] : []),
    ],
  };
}

function factor(input: Omit<GradingFactor, "category"> & { category?: GradingFactor["category"] }): GradingFactor {
  return { ...input, category: input.category ?? "nutrition" };
}

/** Pure, deterministic implementation of label-lore-npm2004-adapted-v1. */
export function scoreProduct(input: GradeProductInput): ProductGradeAssessment {
  const dataCompleteness = makeCompleteness(input);
  const nutrition = input.nutrition;
  const basis = canonicalBasis(nutrition?.nutritionBasis);
  const requiredNumericNames = ["energyKcal", "saturatedFat", "sugar"] as const;
  const requiredInvalid = requiredNumericNames.some((key) => nutrition?.[key] != null && !validNonNegativeNumber(nutrition[key]));
  const requiredMissing = requiredNumericNames.some((key) => !validNonNegativeNumber(nutrition?.[key]));
  const mineralAvailable = validNonNegativeNumber(nutrition?.sodium) || validNonNegativeNumber(nutrition?.salt);
  const basisSupported = basis === "100g";
  const factors: GradingFactor[] = [];
  const evidence = dataCompleteness;
  const recognizedCodes = evidence.recognizedAdditiveCodes.length
    ? `recognized reference codes: ${evidence.recognizedAdditiveCodes.join(", ")}`
    : "no recognized reference codes";
  const unrecognizedCodes = evidence.unrecognizedAdditiveCodes.length
    ? `unrecognized codes: ${evidence.unrecognizedAdditiveCodes.join(", ")}`
    : "no unrecognized codes";
  factors.push(factor({
    key: "ingredient-evidence", category: "ingredients", effect: "neutral", points: 0, value: evidence.ingredientCount,
    unit: "ingredients", applied: false,
    explanation: `Ingredients and additive codes are identity evidence only (${recognizedCodes}; ${unrecognizedCodes}). Current reference records do not support ingredient score adjustments.`,
  }));

  if (!nutrition || !basisSupported || requiredMissing || requiredInvalid || !mineralAvailable) {
    const reasons = [
      ...(!nutrition ? ["nutrition record is missing"] : []),
      ...(dataCompleteness.basisStatus !== "SUPPORTED" ? [basis === "100ml" ? "100ml values cannot be compared to per-100g thresholds without density" : "a supported 100g nutrition basis is missing"] : []),
      ...dataCompleteness.requiredFields.missing.map((name) => `${name} is missing`),
      ...dataCompleteness.requiredFields.invalid.map((name) => `${name} is invalid`),
    ];
    factors.push(factor({
      key: "insufficient-data", category: "data", effect: "neutral", points: 0, value: null, unit: null, applied: false,
      explanation: `No grade or score assigned: ${reasons.join("; ")}.`,
    }));
    return {
      productId: input.productId, status: "INSUFFICIENT_DATA", grade: null, score: null,
      methodologyVersion: GRADING_METHODOLOGY_VERSION, netProfilePoints: null, factors, dataCompleteness,
    };
  }

  const energyKj = (nutrition.energyKcal as number) * 4.184;
  const sodiumMg = validNonNegativeNumber(nutrition.sodium) ? nutrition.sodium : (nutrition.salt as number) * 400;
  const sodiumSource = validNonNegativeNumber(nutrition.sodium) ? "sodium" : "salt converted to sodium equivalent (400 mg/g)";
  const riskFactors = [
    { key: "energy", label: "Energy", value: energyKj, unit: "kJ/100g", cutoffs: thresholds.energyKj },
    { key: "saturatedFat", label: "Saturated fat", value: nutrition.saturatedFat as number, unit: "g/100g", cutoffs: thresholds.saturatedFatG },
    { key: "totalSugars", label: "Total sugars", value: nutrition.sugar as number, unit: "g/100g", cutoffs: thresholds.totalSugarsG },
    { key: "sodium", label: "Sodium", value: sodiumMg, unit: "mg/100g", cutoffs: thresholds.sodiumMg },
  ] as const;
  let adversePoints = 0;
  for (const item of riskFactors) {
    const points = pointsAbove(item.value, item.cutoffs);
    adversePoints += points;
    factors.push(factor({
      key: item.key, effect: "risk", points, value: item.value, unit: item.unit, thresholds: [...item.cutoffs], applied: true,
      explanation: `${item.label} contributes ${points} adverse point(s) under the published NPM thresholds${item.key === "sodium" ? ` using ${sodiumSource}` : ""}.`,
    }));
  }

  let positivePoints = 0;
  if (validNonNegativeNumber(nutrition.fibre)) {
    const points = pointsAbove(nutrition.fibre, thresholds.fibreG);
    positivePoints += points;
    factors.push(factor({
      key: "fibre", effect: "benefit", points, value: nutrition.fibre, unit: "g/100g", thresholds: [...thresholds.fibreG], applied: true,
      explanation: `Declared fibre contributes ${points} provisional positive point(s); its analytical method is not recorded.`,
    }));
  } else {
    factors.push(factor({
      key: "fibre", effect: "neutral", points: 0, value: null, unit: "g/100g", thresholds: [...thresholds.fibreG], applied: false,
      explanation: "Fibre is unavailable or invalid; no positive points were awarded.",
    }));
  }

  if (validNonNegativeNumber(nutrition.protein) && adversePoints < 11) {
    const points = pointsAbove(nutrition.protein, thresholds.proteinG);
    positivePoints += points;
    factors.push(factor({
      key: "protein", effect: "benefit", points, value: nutrition.protein, unit: "g/100g", thresholds: [...thresholds.proteinG], applied: true,
      explanation: `Protein contributes ${points} positive point(s) under the NPM thresholds.`,
    }));
  } else {
    factors.push(factor({
      key: "protein", effect: "neutral", points: 0, value: validNonNegativeNumber(nutrition.protein) ? nutrition.protein : null,
      unit: "g/100g", thresholds: [...thresholds.proteinG], applied: false,
      explanation: !validNonNegativeNumber(nutrition.protein)
        ? "Protein is unavailable or invalid; no positive points were awarded."
        : "Protein points are omitted because adverse points are at least 11 and fruit/vegetable/nut percentages are unavailable.",
    }));
  }
  factors.push(factor({
    key: "transFat", effect: "neutral", points: 0, value: validNonNegativeNumber(nutrition.transFat) ? nutrition.transFat : null,
    unit: "g/100g", applied: false,
    explanation: "Trans fat is disclosed as data when available but is not a factor in the selected NPM-derived calculation.",
  }));

  const netProfilePoints = adversePoints - positivePoints;
  const score = Math.max(0, Math.min(100, Math.round(100 - 2.5 * netProfilePoints)));
  return {
    productId: input.productId, status: "GRADED", grade: mapGrade(score), score,
    methodologyVersion: GRADING_METHODOLOGY_VERSION, netProfilePoints, factors, dataCompleteness,
  };
}
