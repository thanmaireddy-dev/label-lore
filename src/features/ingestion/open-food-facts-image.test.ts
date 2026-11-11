import assert from "node:assert/strict";
import test from "node:test";
import { isValidOpenFoodFactsImageUrl, selectOpenFoodFactsFrontImage } from "./open-food-facts-image";
import { normalizeOpenFoodFactsProduct } from "./open-food-facts.normalizer";

const frontImage = "https://images.openfoodfacts.org/images/products/890/406/321/0029/front_en.4.400.jpg";

test("prefers the selected front image and accepts only HTTPS Open Food Facts image URLs", () => {
  assert.equal(selectOpenFoodFactsFrontImage({
    image_url: "https://images.openfoodfacts.org/images/products/000/000/000/0000/1.jpg",
    image_front_url: "https://images.openfoodfacts.org/images/products/000/000/000/0000/front_en.2.400.jpg",
  }), "https://images.openfoodfacts.org/images/products/000/000/000/0000/front_en.2.400.jpg");
  assert.equal(isValidOpenFoodFactsImageUrl(frontImage), true);
  assert.equal(isValidOpenFoodFactsImageUrl("http://images.openfoodfacts.org/images/products/a.jpg"), false);
  assert.equal(isValidOpenFoodFactsImageUrl("https://example.test/images/products/a.jpg"), false);
  assert.equal(selectOpenFoodFactsFrontImage({ image_front_url: "https://example.test/not-a-product-image.jpg" }), null);
});

test("normalizes a front image URL while preserving null for missing images", () => {
  const normalized = normalizeOpenFoodFactsProduct({ code: "8904063210029", product_name: "Haldiram Rasgulla", image_front_url: frontImage }, "8904063210029");
  assert.equal(normalized.imageUrl, frontImage);
  const missing = normalizeOpenFoodFactsProduct({ code: "8904063210029", product_name: "Haldiram Rasgulla" }, "8904063210029");
  assert.equal(missing.imageUrl, null);
});
