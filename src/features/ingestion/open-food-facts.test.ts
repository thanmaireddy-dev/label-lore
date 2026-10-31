import assert from "node:assert/strict";
import test from "node:test";
import { normalizeOpenFoodFactsProduct } from "./open-food-facts.normalizer";
import { OpenFoodFactsClient } from "./open-food-facts.client";
import { OpenFoodFactsRequestError, OpenFoodFactsUnavailableError } from "./open-food-facts.types";
import { ProductIngestionService } from "./product-ingestion.service";

test("normalizes an OFF barcode product without losing incomplete fields", () => {
  const product = normalizeOpenFoodFactsProduct({
    code: "8901234567890",
    product_name: "Example Noodles",
    brands: "Example Foods, Other Brand",
    categories: "Instant foods, Noodles",
    quantity: "70 g",
    serving_size: "35 g",
    ingredients_text: "Wheat flour, seasoning (salt, spices), acidity regulator (INS 330)",
    additives_tags: ["en:e330", "en:e330"],
    nutrition_data_per: "100g",
    nutriments: { "energy-kcal_100g": 350, proteins_100g: 9, carbohydrates_100g: 70, sugars_100g: 3, "added-sugars_100g": 1, fat_100g: 1, "saturated-fat_100g": 0.2, "trans-fat_100g": 0, fiber_100g: 2, sodium_100g: 0.5 },
    last_modified_t: 1_700_000_000,
  }, "8901234567890");

  assert.equal(product.name, "Example Noodles");
  assert.equal(product.brandName, "Example Foods");
  assert.equal(product.packageSize, "70 g");
  assert.equal(product.nutrition?.servingSizeG, 35);
  assert.equal(product.nutritionBasis, "100g");
  assert.equal(product.nutrition?.sodium, 500);
  assert.equal(product.ingredients.length, 3);
  assert.equal(product.ingredients[1].rawName, "seasoning (salt, spices)");
  assert.deepEqual(product.additivesCodes, ["330"]);
  assert.deepEqual(product.missingFields, ["nutrition.salt", "allergens"]);
});

test("normalizes a partial product while keeping unavailable facts explicit", () => {
  const product = normalizeOpenFoodFactsProduct({ code: "8901234567890", product_name_en: "Partial Product" }, "8901234567890");
  assert.equal(product.brandName, null);
  assert.equal(product.nutrition, null);
  assert.deepEqual(product.missingFields, ["brand", "category", "ingredients", "nutrition", "allergens"]);
});

test("extracts ingredient text without changing order, qualifiers, or repeated entries", () => {
  const product = normalizeOpenFoodFactsProduct({
    product_name: "Ingredient fixture",
    ingredients_text: "Sugar.,  PALM   OIL, sugar, Salt (sea salt)",
  }, "0000000000001");

  assert.deepEqual(product.ingredients.map(({ order, rawName, normalizedName }) => ({ order, rawName, normalizedName })), [
    { order: 0, rawName: "Sugar.", normalizedName: "sugar" },
    { order: 1, rawName: "PALM   OIL", normalizedName: "palm oil" },
    { order: 2, rawName: "sugar", normalizedName: "sugar" },
    { order: 3, rawName: "Salt (sea salt)", normalizedName: "salt (sea salt)" },
  ]);
});

test("uses structured OFF ingredients, and keeps empty ingredient lists empty", () => {
  const structured = normalizeOpenFoodFactsProduct({
    product_name: "Structured fixture",
    ingredients_text: "This fallback must not be combined",
    ingredients: [{ text: "Water" }, { ingredients: [{ text: "Sugar" }, { text: "Water" }] }],
  }, "0000000000002");
  assert.deepEqual(structured.ingredients.map((item) => [item.order, item.rawName]), [[0, "Water"], [1, "Sugar"], [2, "Water"]]);

  const empty = normalizeOpenFoodFactsProduct({ product_name: "Empty fixture", ingredients_text: "  ", ingredients: [] }, "0000000000003");
  assert.deepEqual(empty.ingredients, []);
  assert.equal(empty.ingredientsText, null);
  assert.ok(empty.missingFields.includes("ingredients"));
});

test("maps per-100ml nutrition, keeps salt separate, and normalizes energy and sodium units", () => {
  const product = normalizeOpenFoodFactsProduct({
    product_name: "Nutrition fixture",
    nutrition_data_per: "100ml",
    nutriments: {
      "energy-kj_100g": 4184, "energy-kj_100ml": 418.4,
      fat_100g: 9, fat_100ml: 2,
      "saturated-fat_100ml": 0.5, "trans-fat_100ml": 0.1,
      carbohydrates_100ml: 3, sugars_100ml: 1, fiber_100ml: 0.2, proteins_100ml: 0.7,
      salt_100ml: 0.4, sodium_100ml: 0.16,
    },
  }, "0000000000004");

  assert.ok(Math.abs((product.nutrition?.energyKcal ?? 0) - 100) < 0.000001);
  assert.equal(product.nutrition?.fat, 2);
  assert.equal(product.nutrition?.saturatedFat, 0.5);
  assert.equal(product.nutrition?.transFat, 0.1);
  assert.equal(product.nutrition?.carbohydrate, 3);
  assert.equal(product.nutrition?.sugar, 1);
  assert.equal(product.nutrition?.fibre, 0.2);
  assert.equal(product.nutrition?.protein, 0.7);
  assert.equal(product.nutrition?.salt, 0.4);
  assert.equal(product.nutrition?.sodium, 160);
  assert.equal(product.nutritionBasis, "100ml");
});

test("keeps invalid and unavailable nutrient values null without deriving salt or sodium", () => {
  const product = normalizeOpenFoodFactsProduct({
    product_name: "Incomplete nutrition fixture",
    nutrition_data_per: "100g",
    nutriments: { "energy-kcal_100g": 0, fat_100g: "not a number", salt_100g: null, sodium_100g: "?", sodium_unit: "unknown" },
  }, "0000000000005");
  assert.equal(product.nutrition?.energyKcal, 0);
  assert.equal(product.nutrition?.fat, null);
  assert.equal(product.nutrition?.salt, null);
  assert.equal(product.nutrition?.sodium, null);
  assert.ok(product.missingFields.includes("nutrition.salt"));
  assert.ok(product.missingFields.includes("nutrition.sodium"));

  const empty = normalizeOpenFoodFactsProduct({ product_name: "No nutrition", nutriments: { fat_100g: "bad" } }, "0000000000006");
  assert.equal(empty.nutrition, null);
  assert.ok(empty.missingFields.includes("nutrition"));
});

test("converts milligram salt and sodium into their separate canonical units", () => {
  const product = normalizeOpenFoodFactsProduct({
    product_name: "Milligram fixture",
    nutrition_data_per: "100g",
    nutriments: { salt_mg_100g: 500, salt_value: 900, salt_unit: "mg", sodium_mg_100g: 200 },
  }, "0000000000007");
  assert.equal(product.nutrition?.salt, 0.5);
  assert.equal(product.nutrition?.sodium, 200);
});

test("repeated barcode ingestion reuses the persisted product through the repository cache", async () => {
  const barcode = "0000000000008";
  let stored: { id: string } | null = null;
  let fetchCount = 0;
  let persistCount = 0;
  const client = {
    async getProductByBarcode() {
      fetchCount += 1;
      return { code: barcode, product_name: "Repeat fixture" };
    },
  };
  const repository = {
    async getFreshByBarcode() { return stored; },
    async persist() {
      persistCount += 1;
      stored = { id: "persisted-product" };
      return stored;
    },
  };
  const service = new ProductIngestionService(client as never, repository as never);

  const first = await service.lookupByBarcode(barcode);
  const second = await service.lookupByBarcode(barcode);
  assert.equal(first.id, "persisted-product");
  assert.equal(second.id, first.id);
  assert.equal(fetchCount, 1);
  assert.equal(persistCount, 1);
});

test("accepts nullable OFF fields and rejects a product with no usable name", async () => {
  const client = new OpenFoodFactsClient(async () => Response.json({
    status: "success",
    product: { code: "8901234567890", product_name: null, product_name_en: null, brands: null, nutriments: null },
  }));
  const product = await client.getProductByBarcode("8901234567890");
  assert.equal(product.product_name, null);
  assert.throws(
    () => normalizeOpenFoodFactsProduct({ code: "8901234567890", product_name: null, product_name_en: null }, "8901234567890"),
    /missing its product name/,
  );
});

test("Open Food Facts client sends an identifying User-Agent", async () => {
  let seenAgent = "";
  const client = new OpenFoodFactsClient(async (_input, init) => {
    seenAgent = new Headers(init?.headers).get("User-Agent") ?? "";
    return Response.json({ status: 1, product: { code: "8901234567890", product_name: "Product" } });
  }, "LabelLore-test/1.0 (https://labellore.example)");
  await client.getProductByBarcode("8901234567890");
  assert.equal(seenAgent, "LabelLore-test/1.0 (https://labellore.example)");
});

test("Open Food Facts client accepts the current string success status", async () => {
  const client = new OpenFoodFactsClient(async () => Response.json({
    status: "success",
    product: { code: "8901234567890", product_name: "Product" },
  }));
  const product = await client.getProductByBarcode("8901234567890");
  assert.equal(product.code, "8901234567890");
});

test("Open Food Facts client treats a string failure status as unavailable", async () => {
  const client = new OpenFoodFactsClient(async () => Response.json({ status: "failure", status_verbose: "product not found" }));
  await assert.rejects(client.getProductByBarcode("8901234567890"), OpenFoodFactsUnavailableError);
});

test("Open Food Facts client treats status zero as unavailable", async () => {
  const client = new OpenFoodFactsClient(async () => Response.json({ status: 0, status_verbose: "product not found" }));
  await assert.rejects(client.getProductByBarcode("8901234567890"), OpenFoodFactsUnavailableError);
});

test("Open Food Facts client reports upstream HTTP and malformed JSON errors", async () => {
  const failedRequest = new OpenFoodFactsClient(async () => new Response("upstream error", { status: 503 }));
  await assert.rejects(failedRequest.getProductByBarcode("8901234567890"), (error: unknown) =>
    error instanceof OpenFoodFactsRequestError && error.status === 503,
  );

  const malformedResponse = new OpenFoodFactsClient(async () => new Response("not json", { status: 200 }));
  await assert.rejects(malformedResponse.getProductByBarcode("8901234567890"), OpenFoodFactsRequestError);
});
