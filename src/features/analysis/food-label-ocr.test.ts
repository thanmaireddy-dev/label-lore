import assert from "node:assert/strict";
import test from "node:test";
import { parseFoodLabelText } from "./food-label-parser";
import { extractFoodLabel, FoodLabelOcrError, MAX_LABEL_IMAGE_BYTES, validateLabelImage } from "./food-label-ocr.service";
import { isUserCorrected } from "./food-label-review";

const pngBytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const jpegBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0x00]);
const webpBytes = Uint8Array.from([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80]);

test("accepts supported image signatures and rejects empty, unsupported, malformed, and oversized uploads", () => {
  validateLabelImage({ type: "image/png", size: pngBytes.length, bytes: pngBytes });
  validateLabelImage({ type: "image/jpeg", size: jpegBytes.length, bytes: jpegBytes });
  validateLabelImage({ type: "image/webp", size: webpBytes.length, bytes: webpBytes });
  assert.throws(() => validateLabelImage({ type: "image/png", size: 0, bytes: new Uint8Array() }), (error) => error instanceof FoodLabelOcrError && error.code === "EMPTY_FILE");
  assert.throws(() => validateLabelImage({ type: "image/gif", size: 4, bytes: jpegBytes }), (error) => error instanceof FoodLabelOcrError && error.code === "UNSUPPORTED_TYPE");
  assert.throws(() => validateLabelImage({ type: "image/png", size: jpegBytes.length, bytes: jpegBytes }), (error) => error instanceof FoodLabelOcrError && error.code === "INVALID_IMAGE");
  assert.throws(() => validateLabelImage({ type: "image/png", size: MAX_LABEL_IMAGE_BYTES + 1, bytes: new Uint8Array(MAX_LABEL_IMAGE_BYTES + 1) }), (error) => error instanceof FoodLabelOcrError && error.code === "FILE_TOO_LARGE");
});

test("calls OCR only for validated uploads and returns parsed text without storing the image", async () => {
  let received: Uint8Array | null = null;
  const result = await extractFoodLabel({ type: "image/png", size: pngBytes.length, bytes: pngBytes }, async (image) => {
    received = image;
    return "Ingredients: oats, milk\nNutrition information per 100 g\nEnergy 400 kcal\nProtein 12 g";
  });
  assert.equal(received, pngBytes);
  assert.equal(result.rawText.includes("Ingredients: oats, milk"), true);
  assert.equal(result.ingredients.items.length, 2);
  assert.equal(result.nutrition.values.energyKcal.value, 400);
  assert.equal(result.nutrition.values.protein.value, 12);
});

test("reports empty OCR output and engine failures as explicit errors", async () => {
  await assert.rejects(extractFoodLabel({ type: "image/png", size: pngBytes.length, bytes: pngBytes }, async () => " \n "), (error) => error instanceof FoodLabelOcrError && error.code === "NO_TEXT");
  await assert.rejects(extractFoodLabel({ type: "image/png", size: pngBytes.length, bytes: pngBytes }, async () => { throw new Error("decode failed"); }), (error) => error instanceof FoodLabelOcrError && error.code === "OCR_FAILED");
});

test("parses ingredient text and keeps parenthetical commas and source wording", () => {
  const result = parseFoodLabelText("INGREDIENTS: Whole wheat flour, sugar, cocoa (processed with alkali, acidity regulator)\nNutrition Facts");
  assert.equal(result.ingredients.originalText, "Whole wheat flour, sugar, cocoa (processed with alkali, acidity regulator)");
  assert.deepEqual(result.ingredients.items.map((item) => item.name), ["Whole wheat flour", "sugar", "cocoa (processed with alkali, acidity regulator)"]);
  assert.equal(result.rawText.startsWith("INGREDIENTS:"), true);
});

test("parses common nutrition labels, units, and per-100 basis without mixing salt and sodium", () => {
  const result = parseFoodLabelText([
    "Nutrition information per 100 g",
    "Energy: 840 kJ",
    "Total fat 12 g",
    "Saturated fat: 4.5 g",
    "Trans fat 0 g",
    "Carbohydrates 22 g",
    "Total sugars 8,5 g",
    "Dietary fiber 3 g",
    "Protein 5 g",
    "Sodium 250 mg",
    "Salt 0.63 g",
  ].join("\n"));
  assert.equal(result.nutrition.basis, "PER_100G");
  assert.equal(result.nutrition.values.energyKcal.value, 200.76);
  assert.equal(result.nutrition.values.sugars.value, 8.5);
  assert.equal(result.nutrition.values.sodium.value, 250);
  assert.equal(result.nutrition.values.salt.value, 0.63);
  assert.notEqual(result.nutrition.values.sodium.value, result.nutrition.values.salt.value);
  assert.ok(Object.values(result.nutrition.values).every((value) => value.status === "UNVERIFIED" || value.status === "UNAVAILABLE"));
});

test("converts sodium grams to mg and other nutrient milligrams to grams", () => {
  const result = parseFoodLabelText("Energy 100 kcal\nFat 125 mg\nSodium 0.2 g\nSalt 500 mg");
  assert.equal(result.nutrition.values.fat.value, 0.125);
  assert.equal(result.nutrition.values.sodium.value, 200);
  assert.equal(result.nutrition.values.salt.value, 0.5);
});

test("recognizes standard Calories labels and energy units written before the value", () => {
  const result = parseFoodLabelText("Calories 120\nEnergy (kJ) 840");
  assert.equal(result.nutrition.values.energyKcal.value, 200.76);
  assert.equal(result.nutrition.values.energyKcal.unit, "kcal");
});

test("keeps missing, unsupported, negative, and less-than values null instead of inventing zero", () => {
  const result = parseFoodLabelText("Nutrition Facts per 100 ml\nSodium 20 mg\nFiber < 0.5 g\nProtein -4 g\nFat 1 oz");
  assert.equal(result.nutrition.basis, "PER_100ML");
  assert.equal(result.nutrition.values.sodium.value, 20);
  assert.equal(result.nutrition.values.fibre.value, null);
  assert.equal(result.nutrition.values.protein.value, null);
  assert.equal(result.nutrition.values.fat.value, null);
  assert.equal(result.nutrition.values.salt.value, null);
  assert.ok(result.warnings.some((warning) => warning.includes("unverified")));
});

test("does not treat a missing ingredient list or nutrition as empty facts", () => {
  const result = parseFoodLabelText("Front of pack only");
  assert.equal(result.ingredients.originalText, null);
  assert.deepEqual(result.ingredients.items, []);
  assert.ok(Object.values(result.nutrition.values).every((value) => value.value === null));
  assert.equal(result.nutrition.basis, null);
  assert.equal(result.warnings.length, 3);
});

test("marks edited values as user corrections and clears the mark when restored to source text", () => {
  assert.equal(isUserCorrected("oats, sugar", "oats, honey"), true);
  assert.equal(isUserCorrected("oats, sugar", "oats, sugar"), false);
  assert.equal(isUserCorrected(null, ""), false);
  assert.equal(isUserCorrected(12, "12.5"), true);
  assert.equal(isUserCorrected(12, "12"), false);
});
