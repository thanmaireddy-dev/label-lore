export type LabelNutrientKey =
  | "energyKcal" | "fat" | "saturatedFat" | "transFat" | "carbohydrates"
  | "sugars" | "fibre" | "protein" | "sodium" | "salt";

export type ParsedLabelValue = {
  value: number | null;
  unit: "kcal" | "g" | "mg";
  sourceText: string | null;
  status: "UNVERIFIED" | "UNAVAILABLE";
};

export type FoodLabelExtraction = {
  rawText: string;
  ingredients: { originalText: string | null; items: Array<{ name: string; originalText: string }> };
  nutrition: { basis: "PER_100G" | "PER_100ML" | null; values: Record<LabelNutrientKey, ParsedLabelValue> };
  warnings: string[];
};

const nutrientLabels: Array<{ key: LabelNutrientKey; labels: string[]; unit: "kcal" | "g" | "mg" }> = [
  { key: "energyKcal", labels: ["energy", "calories", "calorie"], unit: "kcal" },
  { key: "saturatedFat", labels: ["saturated fat", "sat fat"], unit: "g" },
  { key: "transFat", labels: ["trans fat"], unit: "g" },
  { key: "carbohydrates", labels: ["carbohydrate", "carbohydrates", "total carbohydrate"], unit: "g" },
  { key: "sugars", labels: ["total sugars", "sugars", "sugar"], unit: "g" },
  { key: "fibre", labels: ["dietary fibre", "dietary fiber", "fibre", "fiber"], unit: "g" },
  { key: "protein", labels: ["protein"], unit: "g" },
  { key: "sodium", labels: ["sodium"], unit: "mg" },
  { key: "salt", labels: ["salt"], unit: "g" },
  { key: "fat", labels: ["total fat", "total fats", "fat"], unit: "g" },
];

const emptyValues = (): Record<LabelNutrientKey, ParsedLabelValue> => ({
  energyKcal: { value: null, unit: "kcal", sourceText: null, status: "UNAVAILABLE" },
  fat: { value: null, unit: "g", sourceText: null, status: "UNAVAILABLE" },
  saturatedFat: { value: null, unit: "g", sourceText: null, status: "UNAVAILABLE" },
  transFat: { value: null, unit: "g", sourceText: null, status: "UNAVAILABLE" },
  carbohydrates: { value: null, unit: "g", sourceText: null, status: "UNAVAILABLE" },
  sugars: { value: null, unit: "g", sourceText: null, status: "UNAVAILABLE" },
  fibre: { value: null, unit: "g", sourceText: null, status: "UNAVAILABLE" },
  protein: { value: null, unit: "g", sourceText: null, status: "UNAVAILABLE" },
  sodium: { value: null, unit: "mg", sourceText: null, status: "UNAVAILABLE" },
  salt: { value: null, unit: "g", sourceText: null, status: "UNAVAILABLE" },
});

export function splitFoodLabelIngredients(text: string): Array<{ name: string; originalText: string }> {
  const items: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "(") depth += 1;
    if (text[i] === ")" && depth > 0) depth -= 1;
    if ((text[i] === "," || text[i] === ";") && depth === 0) {
      const item = text.slice(start, i).trim();
      if (item) items.push(item);
      start = i + 1;
    }
  }
  const last = text.slice(start).trim();
  if (last) items.push(last);
  return items.map((item) => ({ name: item, originalText: item }));
}

function normalizeNutrientValue(key: LabelNutrientKey, amountText: string, unitText: string): number | null {
  const amount = Number(amountText.replace(",", "."));
  if (!Number.isFinite(amount) || amount < 0) return null;
  const unit = unitText.toLowerCase();
  if (key === "energyKcal") {
    if (unit === "kj" || unit === "k.j.") return Math.round((amount / 4.184) * 100) / 100;
    if (unit === "kcal" || unit === "cal" || unit === "k.cal.") return amount;
    return null;
  }
  if (key === "sodium") {
    if (unit === "g") return amount * 1000;
    if (unit === "mg") return amount;
    return null;
  }
  if (unit === "mg") return amount / 1000;
  if (unit === "g") return amount;
  return null;
}

function extractNutrient(line: string, key: LabelNutrientKey, labels: string[], expectedUnit: "kcal" | "g" | "mg"): ParsedLabelValue | null {
  // A minus sign immediately before the amount must never be consumed as a label separator.
  if (/\s-\s*\d/.test(line)) return null;
  if (key === "energyKcal") {
    const unitBeforeValue = line.match(/^\s*(?:energy|calories?)\s*\(?\s*(kcal|kj)\s*\)?\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*$/i);
    const caloriesWithoutUnit = line.match(/^\s*calories?\s*[:\-]?\s*(\d+(?:[.,]\d+)?)\s*$/i);
    const energyAmount = unitBeforeValue
      ? normalizeNutrientValue(key, unitBeforeValue[2], unitBeforeValue[1])
      : caloriesWithoutUnit ? Number(caloriesWithoutUnit[1].replace(",", ".")) : null;
    if (energyAmount !== null && Number.isFinite(energyAmount) && energyAmount >= 0) {
      return { value: energyAmount, unit: "kcal", sourceText: line.trim(), status: "UNVERIFIED" };
    }
  }
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = line.match(new RegExp(`^\\s*(?:${escaped})\\s*[:\\-]?\\s*(?:<\\s*)?(-?\\d+(?:[.,]\\d+)?)\\s*(k\\.?cal\\.?|kcal|cal|k\\.?j\\.?|kj|mg|g)\\b`, "i"));
  if (!match || line.match(/(?:^|\s)</)) return null;
  const parsed = normalizeNutrientValue(key, match[1], match[2]);
  if (parsed === null) return null;
  return { value: parsed, unit: expectedUnit, sourceText: line.trim(), status: "UNVERIFIED" };
}

export function parseFoodLabelText(rawText: string): FoodLabelExtraction {
  const normalizedLines = rawText.replace(/\r\n?/g, "\n").split("\n");
  const ingredientLineIndex = normalizedLines.findIndex((line) => /^\s*ingredients?\s*[:\-]/i.test(line));
  let ingredientText: string | null = null;
  if (ingredientLineIndex >= 0) {
    const first = normalizedLines[ingredientLineIndex].replace(/^\s*ingredients?\s*[:\-]\s*/i, "").trim();
    const continuation: string[] = [first];
    for (const line of normalizedLines.slice(ingredientLineIndex + 1)) {
      if (/^\s*(?:nutrition(?: facts)?|energy|calories|total fat|fat|protein|sodium|salt)\b/i.test(line)) break;
      if (line.trim()) continuation.push(line.trim());
    }
    ingredientText = continuation.join(" ").trim() || null;
  }

  const values = emptyValues();
  for (const line of normalizedLines) {
    for (const item of nutrientLabels) {
      const parsed = extractNutrient(line, item.key, item.labels, item.unit);
      if (parsed) values[item.key] = parsed;
    }
  }

  const joined = rawText.toLowerCase();
  const basis = /per\s*100\s*ml|100\s*ml\s*(?:basis)?/i.test(joined)
    ? "PER_100ML"
    : /per\s*100\s*g|100\s*g\s*(?:basis)?/i.test(joined) ? "PER_100G" : null;
  const hasNutrition = Object.values(values).some((entry) => entry.value !== null);
  const warnings = ["OCR text and parsed values are unverified; inspect and correct them before use."];
  if (!ingredientText) warnings.push("No ingredient list was confidently identified.");
  if (!hasNutrition) warnings.push("No nutrition values were confidently identified.");
  if (!basis && hasNutrition) warnings.push("Nutrition basis was not identified; do not assume per 100 g or per 100 ml.");

  return {
    rawText,
    ingredients: { originalText: ingredientText, items: ingredientText ? splitFoodLabelIngredients(ingredientText) : [] },
    nutrition: { basis, values },
    warnings,
  };
}
