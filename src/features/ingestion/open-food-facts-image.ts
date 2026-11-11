const OFF_IMAGE_HOST = "images.openfoodfacts.org";

export function isValidOpenFoodFactsImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === OFF_IMAGE_HOST
      && url.pathname.startsWith("/images/products/");
  } catch {
    return false;
  }
}

function firstUrl(values: unknown[]): string | null {
  return values.find(isValidOpenFoodFactsImageUrl) ?? null;
}

export function selectOpenFoodFactsFrontImage(product: Record<string, unknown>): string | null {
  const selected = product.selected_images;
  if (selected && typeof selected === "object") {
    const front = (selected as Record<string, unknown>).front;
    if (front && typeof front === "object") {
      const frontImages = front as Record<string, unknown>;
      const display = frontImages.display;
      const small = frontImages.small;
      const languageUrls = (value: unknown) => value && typeof value === "object"
        ? Object.values(value as Record<string, unknown>)
        : [];
      const urls = firstUrl([
        product.image_front_url,
        ...languageUrls(display),
        ...languageUrls(small),
        product.image_front_small_url,
        product.image_url,
      ]);
      if (urls) return urls;
    }
  }
  return firstUrl([
    product.image_front_url,
    product.image_front_small_url,
    product.image_url,
  ]);
}
