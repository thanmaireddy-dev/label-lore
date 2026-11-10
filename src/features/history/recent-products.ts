export const RECENT_PRODUCTS_STORAGE_KEY = "label-lore-recent-products-v1";
export const RECENT_PRODUCTS_EVENT = "label-lore:recent-products-changed";
export const RECENT_PRODUCTS_LIMIT = 20;

export type RecentProduct = {
  productId: string;
  name: string;
  brand: string;
  visitedAt: string;
};

export function parseRecentProducts(raw: string | null): RecentProduct[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry): RecentProduct[] => {
      if (!entry || typeof entry !== "object") return [];
      const value = entry as Record<string, unknown>;
      if (typeof value.productId !== "string" || typeof value.name !== "string"
        || typeof value.brand !== "string" || typeof value.visitedAt !== "string") return [];
      return [{ productId: value.productId, name: value.name, brand: value.brand, visitedAt: value.visitedAt }];
    }).slice(0, RECENT_PRODUCTS_LIMIT);
  } catch {
    return [];
  }
}

export function addRecentProduct(entries: RecentProduct[], product: RecentProduct): RecentProduct[] {
  return [product, ...entries.filter((entry) => entry.productId !== product.productId)]
    .slice(0, RECENT_PRODUCTS_LIMIT);
}
