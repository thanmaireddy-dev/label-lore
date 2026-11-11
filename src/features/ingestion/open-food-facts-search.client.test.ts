import assert from "node:assert/strict";
import test from "node:test";
import { OpenFoodFactsSearchClient, OpenFoodFactsSearchError } from "./open-food-facts-search.client";

test("uses bounded paginated Search-a-licious requests with the configured User-Agent", async () => {
  let request: RequestInit | undefined;
  const client = new OpenFoodFactsSearchClient(async (_input, init) => {
    request = init;
    return Response.json({
      total: 20,
      page: 2,
      page_size: 8,
      hits: [{
        code: "8904063210029",
        product_name: "Haldiram Rasgulla",
        brands: ["Haldiram"],
        categories: ["sweets"],
        image_front_url: "https://images.openfoodfacts.org/images/products/890/406/321/0029/front_en.4.400.jpg",
      }],
    });
  }, "LabelLore/test (https://example.test)");

  const result = await client.search("Haldiram", 2);
  assert.equal(request?.method, "POST");
  assert.equal((request?.headers as Record<string, string>)?.["User-Agent"], "LabelLore/test (https://example.test)");
  assert.equal(JSON.parse(String(request?.body)).page_size, 8);
  assert.equal(JSON.parse(String(request?.body)).page, 2);
  assert.equal(result.products[0]?.barcode, "8904063210029");
  assert.equal(result.products[0]?.brand, "Haldiram");
  assert.equal(result.hasMore, true);
});

test("leaves invalid barcodes unavailable for import and rejects untrusted image hosts", async () => {
  const client = new OpenFoodFactsSearchClient(async () => Response.json({ total: 2, hits: [
    { code: "bad-code", product_name: "No barcode" },
    { code: "1234567890123", product_name: "Untrusted image", image_url: "https://example.test/product.jpg" },
  ] }));
  const result = await client.search("product", 1);
  assert.equal(result.products[0]?.barcode, null);
  assert.equal(result.products[1]?.imageUrl, null);
});

test("maps HTTP and malformed provider responses to safe errors", async () => {
  const unavailable = new OpenFoodFactsSearchClient(async () => new Response("", { status: 503 }));
  await assert.rejects(unavailable.search("tea", 1), (error: unknown) => error instanceof OpenFoodFactsSearchError && error.code === "UNAVAILABLE");
  const malformed = new OpenFoodFactsSearchClient(async () => Response.json({ hits: "not-an-array" }));
  await assert.rejects(malformed.search("tea", 1), (error: unknown) => error instanceof OpenFoodFactsSearchError && error.code === "INVALID_RESPONSE");
  const rateLimited = new OpenFoodFactsSearchClient(async () => new Response("", { status: 429 }));
  await assert.rejects(rateLimited.search("tea", 1), (error: unknown) => error instanceof OpenFoodFactsSearchError && error.code === "RATE_LIMITED");
});
