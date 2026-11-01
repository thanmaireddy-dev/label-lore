import assert from "node:assert/strict";
import test from "node:test";
import { gradingResponseSchema } from "./grading.contract";
import { scoreProduct } from "./grading";

function responseFor(nutrition: NonNullable<Parameters<typeof scoreProduct>[0]["nutrition"]>) {
  const result = scoreProduct({ productId: "product-1", nutrition, ingredients: [] });
  return { data: { ...result, calculatedAt: new Date("2026-11-01T00:00:00.000Z").toISOString() } };
}

const baseNutrition = {
  energyKcal: 100, saturatedFat: 0, sugar: 0, sodium: 0, salt: null,
  fibre: null, protein: null, transFat: null, nutritionBasis: "100g", verification: "UNVERIFIED",
};

test("frontend grading contract accepts persisted results for all five grade bands", () => {
  for (const nutrition of [
    baseNutrition,
    { ...baseNutrition, energyKcal: 300, saturatedFat: 2.1, sugar: 9.1, sodium: 181 },
    { ...baseNutrition, energyKcal: 350, saturatedFat: 4.1, sugar: 22.6, sodium: 361 },
    { ...baseNutrition, energyKcal: 500, saturatedFat: 6.1, sugar: 31.1, sodium: 541 },
    { ...baseNutrition, energyKcal: 700, saturatedFat: 8.1, sugar: 40.1, sodium: 721 },
  ]) {
    const parsed = gradingResponseSchema.parse(responseFor(nutrition));
    assert.equal(parsed.data.status, "GRADED");
    assert.ok(parsed.data.grade);
    assert.ok(parsed.data.score !== null);
    assert.ok(parsed.data.factors.some((factor) => factor.key === "energy"));
  }
});

test("frontend grading contract preserves insufficient data without a grade or score", () => {
  const payload = responseFor({ ...baseNutrition, energyKcal: null });
  const parsed = gradingResponseSchema.parse(payload);
  assert.equal(parsed.data.status, "INSUFFICIENT_DATA");
  assert.equal(parsed.data.grade, null);
  assert.equal(parsed.data.score, null);
  assert.ok(parsed.data.dataCompleteness.requiredFields.missing.includes("energyKcal"));
});

test("frontend grading contract rejects malformed and mismatched scoring responses", () => {
  assert.equal(gradingResponseSchema.safeParse({ data: { status: "GRADED", grade: "F", score: 0 } }).success, false);
  const result = responseFor(baseNutrition);
  assert.equal(gradingResponseSchema.safeParse({ data: { ...result.data, factors: "missing" } }).success, false);
  assert.equal(gradingResponseSchema.safeParse({ data: { ...result.data, grade: null } }).success, false);
});
