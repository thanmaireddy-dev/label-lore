import assert from "node:assert/strict";
import test from "node:test";
import { addRecentProduct, parseRecentProducts, RECENT_PRODUCTS_LIMIT, type RecentProduct } from "./recent-products";

const item = (productId: string): RecentProduct => ({ productId, name: `Product ${productId}`, brand: "Brand", visitedAt: "2026-11-10T00:00:00.000Z" });

test("recent product history tolerates empty, invalid, and malformed local data", () => {
  assert.deepEqual(parseRecentProducts(null), []);
  assert.deepEqual(parseRecentProducts("not json"), []);
  assert.deepEqual(parseRecentProducts(JSON.stringify([{ productId: "ok", name: "Name", brand: "Brand", visitedAt: "today" }, { productId: 3 }])), [{ productId: "ok", name: "Name", brand: "Brand", visitedAt: "today" }]);
});

test("recent product history moves repeats to the top and caps the list", () => {
  const initial = Array.from({ length: RECENT_PRODUCTS_LIMIT }, (_, index) => item(String(index)));
  const added = addRecentProduct(initial, item("new"));
  assert.equal(added.some(({ productId }) => productId === "19"), false);
  const repeated = addRecentProduct(added, item("10"));
  assert.equal(repeated.length, RECENT_PRODUCTS_LIMIT);
  assert.equal(repeated[0]?.productId, "10");
  assert.equal(repeated.filter(({ productId }) => productId === "10").length, 1);
});
