import assert from "node:assert/strict";
import test from "node:test";
import { normalizeOpenFoodFactsProduct } from "./open-food-facts.normalizer";
import { OpenFoodFactsClient } from "./open-food-facts.client";
import { OpenFoodFactsUnavailableError } from "./open-food-facts.types";

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
  assert.deepEqual(product.missingFields, ["allergens"]);
});

test("normalizes a partial product while keeping unavailable facts explicit", () => {
  const product = normalizeOpenFoodFactsProduct({ code: "8901234567890", product_name_en: "Partial Product" }, "8901234567890");
  assert.equal(product.brandName, null);
  assert.equal(product.nutrition, null);
  assert.deepEqual(product.missingFields, ["brand", "category", "ingredients", "nutrition", "allergens"]);
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
