import assert from "node:assert/strict";
import test from "node:test";
import { scoreProduct, type GradeProductInput } from "./grading";

function fixture(overrides: Partial<GradeProductInput["nutrition"]> = {}, ingredients: GradeProductInput["ingredients"] = []): GradeProductInput {
  return {
    productId: "fixture-product",
    nutrition: {
      energyKcal: 0,
      saturatedFat: 0,
      sugar: 0,
      sodium: 0,
      salt: null,
      fibre: null,
      protein: null,
      transFat: null,
      nutritionBasis: "100g",
      verification: "UNVERIFIED",
      ...overrides,
    },
    ingredients,
  };
}

test("maps all five Label Lore score bands deterministically", () => {
  const cases: Array<{ grade: string; expectedScore: number; nutrition: NonNullable<GradeProductInput["nutrition"]> }> = [
    { grade: "A", expectedScore: 100, nutrition: { ...fixture().nutrition! } },
    { grade: "B", expectedScore: 78, nutrition: { ...fixture({ energyKcal: 300, saturatedFat: 2.1, sugar: 9.1, sodium: 181 }).nutrition! } },
    { grade: "C", expectedScore: 58, nutrition: { ...fixture({ energyKcal: 350, saturatedFat: 4.1, sugar: 22.6, sodium: 361 }).nutrition! } },
    { grade: "D", expectedScore: 38, nutrition: { ...fixture({ energyKcal: 500, saturatedFat: 6.1, sugar: 31.1, sodium: 541 }).nutrition! } },
    { grade: "E", expectedScore: 18, nutrition: { ...fixture({ energyKcal: 700, saturatedFat: 8.1, sugar: 40.1, sodium: 721 }).nutrition! } },
  ];
  for (const item of cases) {
    const result = scoreProduct({ ...fixture(), nutrition: item.nutrition });
    assert.equal(result.status, "GRADED");
    assert.equal(result.grade, item.grade);
    assert.equal(result.score, item.expectedScore);
  }
});

test("calculates each adverse nutrient factor and strict threshold boundaries", () => {
  const atThresholds = scoreProduct(fixture({ energyKcal: 335 / 4.184, saturatedFat: 1, sugar: 4.5, sodium: 90 }));
  assert.deepEqual(atThresholds.factors.filter((factor) => factor.effect === "risk").map((factor) => factor.points), [0, 0, 0, 0]);

  const aboveThresholds = scoreProduct(fixture({ energyKcal: 336 / 4.184, saturatedFat: 1.01, sugar: 4.51, sodium: 90.1 }));
  assert.deepEqual(aboveThresholds.factors.filter((factor) => factor.effect === "risk").map((factor) => factor.points), [1, 1, 1, 1]);
});

test("uses salt as a sodium equivalent only when sodium is unavailable", () => {
  const saltOnly = scoreProduct(fixture({ sodium: null, salt: 1 }));
  const sodiumFactor = saltOnly.factors.find((factor) => factor.key === "sodium");
  assert.equal(sodiumFactor?.value, 400);
  assert.equal(sodiumFactor?.points, 4);
  assert.match(sodiumFactor?.explanation ?? "", /salt converted/);

  const preferSodium = scoreProduct(fixture({ sodium: 0, salt: 5 }));
  assert.equal(preferSodium.factors.find((factor) => factor.key === "sodium")?.value, 0);
});

test("awards available fibre and eligible protein points, omitting protein at the NPM gate", () => {
  const lowRisk = scoreProduct(fixture({ fibre: 2, protein: 4 }));
  assert.equal(lowRisk.factors.find((factor) => factor.key === "fibre")?.points, 2);
  assert.equal(lowRisk.factors.find((factor) => factor.key === "protein")?.points, 2);

  const highRisk = scoreProduct(fixture({ energyKcal: 300, saturatedFat: 10, sugar: 20, sodium: 0, protein: 9 }));
  assert.equal(highRisk.factors.find((factor) => factor.key === "protein")?.points, 0);
  assert.equal(highRisk.factors.find((factor) => factor.key === "protein")?.applied, false);
});

test("returns INSUFFICIENT_DATA for missing, null, invalid, or incompatible required data", () => {
  const cases: GradeProductInput[] = [
    { ...fixture(), nutrition: null },
    fixture({ nutritionBasis: null }),
    fixture({ nutritionBasis: "100ml" }),
    fixture({ energyKcal: null }),
    fixture({ saturatedFat: null }),
    fixture({ sugar: null }),
    fixture({ sodium: null, salt: null }),
    fixture({ energyKcal: Number.NaN }),
    fixture({ saturatedFat: -1 }),
    fixture({ sugar: Number.POSITIVE_INFINITY }),
    fixture({ sodium: Number.NaN, salt: -1 }),
  ];
  for (const input of cases) {
    const result = scoreProduct(input);
    assert.equal(result.status, "INSUFFICIENT_DATA");
    assert.equal(result.grade, null);
    assert.equal(result.score, null);
    assert.equal(result.netProfilePoints, null);
  }
  assert.match(scoreProduct(fixture({ nutritionBasis: "100ml" })).factors.at(-1)?.explanation ?? "", /density/);
});

test("does not turn invalid optional nutrients into points or zeros", () => {
  const result = scoreProduct(fixture({ fibre: Number.NaN, protein: -1, transFat: Number.POSITIVE_INFINITY }));
  assert.equal(result.status, "GRADED");
  assert.deepEqual(result.dataCompleteness.invalidOptionalFields.sort(), ["fibre", "protein", "transFat"]);
  assert.equal(result.factors.find((factor) => factor.key === "fibre")?.points, 0);
  assert.equal(result.factors.find((factor) => factor.key === "protein")?.points, 0);
});

test("ingredient lists and additive identity evidence do not create unsupported penalties", () => {
  const plain = scoreProduct(fixture({}, [{ rawName: "Water", normalizedName: "water", additive: null }]));
  const listed = scoreProduct(fixture({}, [
    { rawName: "INS 621", normalizedName: "monosodium glutamate", additive: { insCode: "621", commonName: "Monosodium Glutamate" } },
    { rawName: "E999", normalizedName: "unknown additive", additive: null },
  ]));
  assert.equal(plain.score, listed.score);
  assert.deepEqual(listed.dataCompleteness.recognizedAdditiveCodes, ["621"]);
  assert.deepEqual(listed.dataCompleteness.unrecognizedAdditiveCodes, ["999"]);
  assert.equal(listed.factors.find((factor) => factor.key === "ingredient-evidence")?.points, 0);
});

test("repeated calculations return identical output", () => {
  const input = fixture({ energyKcal: 539, saturatedFat: 10.6, sugar: 56.3, sodium: 42.8, salt: 0.107, fibre: 0, protein: 6.3 }, [
    { rawName: "sugar", normalizedName: "sugar", additive: null },
    { rawName: "palm oil", normalizedName: "palm oil", additive: null },
  ]);
  assert.deepEqual(scoreProduct(input), scoreProduct(input));
});

test("scores the persisted Nutella nutrition fixture as D with a transparent breakdown", () => {
  const result = scoreProduct(fixture({
    energyKcal: 539,
    saturatedFat: 10.6,
    sugar: 56.3,
    sodium: 42.8,
    salt: 0.107,
    fibre: 0,
    protein: 6.3,
    transFat: null,
  }, [
    { rawName: "sugar", normalizedName: "sugar", additive: null },
    { rawName: "palm oil", normalizedName: "palm oil", additive: null },
  ]));
  assert.equal(result.grade, "D");
  assert.equal(result.score, 35);
  assert.equal(result.netProfilePoints, 26);
  assert.deepEqual(result.factors.filter((factor) => factor.effect === "risk").map((factor) => factor.points), [6, 10, 10, 0]);
  assert.equal(result.factors.find((factor) => factor.key === "protein")?.applied, false);
  assert.equal(result.dataCompleteness.optionalFields.transFat, false);
  assert.equal(result.dataCompleteness.nutritionVerification, "UNVERIFIED");
});
