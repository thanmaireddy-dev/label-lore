import assert from "node:assert/strict";
import test from "node:test";
import { ProductDiscoveryService } from "./product-discovery.service";
import type { ProductSearchRecord } from "./product.types";
import { OpenFoodFactsSearchError, type OpenFoodFactsSearchPage } from "@/features/ingestion/open-food-facts-search.client";

const localProduct = {
  id: "local-1",
  name: "Amul Milk",
  imageUrl: null,
  identifiers: [{ value: "8901262010012" }],
  brand: { name: "Amul" },
  category: { name: "Milk" },
} as unknown as ProductSearchRecord;

function external(products: OpenFoodFactsSearchPage["products"]): OpenFoodFactsSearchPage {
  return { products, page: 1, pageSize: 8, total: products.length, hasMore: false };
}

test("combines local results first and removes external matches by barcode", async () => {
  const service = new ProductDiscoveryService(
    async () => [localProduct],
    async () => external([
      { barcode: "8901262010012", name: "Amul Milk duplicate", brand: "Amul", category: "Milk", imageUrl: null },
      { barcode: "8901063090301", name: "Britannia Biscuit", brand: "Britannia", category: "Biscuits", imageUrl: null },
    ]),
  );
  const result = await service.search("milk");
  assert.deepEqual(result.data.map((item) => item.source), ["LOCAL", "OPEN_FOOD_FACTS"]);
  assert.deepEqual(result.data.map((item) => item.barcode), ["8901262010012", "8901063090301"]);
  assert.equal(result.meta.externalStatus, "AVAILABLE");
});

test("returns local matches when Open Food Facts is unavailable or rate limited", async () => {
  const unavailable = new ProductDiscoveryService(async () => [localProduct], async () => { throw new Error("offline"); });
  const offlineResult = await unavailable.search("Amul");
  assert.equal(offlineResult.data.length, 1);
  assert.equal(offlineResult.data[0]?.productId, "local-1");
  assert.equal(offlineResult.meta.externalStatus, "UNAVAILABLE");

  const limited = new ProductDiscoveryService(async () => [localProduct], async () => {
    throw new OpenFoodFactsSearchError("RATE_LIMITED");
  });
  const limitedResult = await limited.search("Amul");
  assert.equal(limitedResult.meta.externalStatus, "RATE_LIMITED");
});

test("only queries local products on the first page", async () => {
  let localCalls = 0;
  const service = new ProductDiscoveryService(
    async () => { localCalls += 1; return [localProduct]; },
    async (_query, page) => ({ ...external([]), page, total: 80, hasMore: true }),
  );
  const pageOne = await service.search("Amul", 1);
  const pageTwo = await service.search("Amul", 2);
  assert.equal(localCalls, 1);
  assert.equal(pageOne.data.length, 1);
  assert.equal(pageTwo.data.length, 0);
  assert.equal(pageTwo.meta.hasMore, true);
});
