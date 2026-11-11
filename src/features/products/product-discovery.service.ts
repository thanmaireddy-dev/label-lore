import { ProductRepository } from "./product.repository";
import { openFoodFactsSearchClient, OpenFoodFactsSearchError, type OpenFoodFactsSearchPage } from "@/features/ingestion/open-food-facts-search.client";
import { isValidOpenFoodFactsImageUrl } from "@/features/ingestion/open-food-facts-image";
import type { ProductSearchRecord } from "./product.types";

export const MAX_EXTERNAL_SEARCH_PAGES = 5;

export type ProductDiscoveryResult = {
  source: "LOCAL" | "OPEN_FOOD_FACTS";
  productId: string | null;
  barcode: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
};

export type ProductDiscoveryResponse = {
  data: ProductDiscoveryResult[];
  meta: { page: number; hasMore: boolean; externalStatus: "AVAILABLE" | "UNAVAILABLE" | "RATE_LIMITED" };
};

function dedupeKey(result: ProductDiscoveryResult): string {
  if (result.barcode) return `barcode:${result.barcode}`;
  return `name:${result.name.toLocaleLowerCase("en-US").trim()}|${result.brand?.toLocaleLowerCase("en-US").trim() ?? ""}`;
}

export class ProductDiscoveryService {
  constructor(
    private readonly searchLocal: (query: string, limit?: number) => Promise<ProductSearchRecord[]> = ProductRepository.search,
    private readonly searchExternal: (query: string, page: number) => Promise<OpenFoodFactsSearchPage> = openFoodFactsSearchClient.search.bind(openFoodFactsSearchClient),
  ) {}

  async search(query: string, page = 1): Promise<ProductDiscoveryResponse> {
    const local = page === 1 ? await this.searchLocal(query, 10) : [];
    const results: ProductDiscoveryResult[] = local.map((product) => ({
      source: "LOCAL",
      productId: product.id,
      barcode: product.identifiers[0]?.value ?? null,
      name: product.name,
      brand: product.brand?.name ?? null,
      category: product.category?.name ?? null,
      imageUrl: isValidOpenFoodFactsImageUrl(product.imageUrl) ? product.imageUrl : null,
    }));
    const seen = new Set(results.map(dedupeKey));

    try {
      const externalPage = await this.searchExternal(query, page);
      for (const product of externalPage.products) {
        const result: ProductDiscoveryResult = {
          source: "OPEN_FOOD_FACTS",
          productId: null,
          barcode: product.barcode,
          name: product.name,
          brand: product.brand,
          category: product.category,
          imageUrl: isValidOpenFoodFactsImageUrl(product.imageUrl) ? product.imageUrl : null,
        };
        const key = dedupeKey(result);
        if (seen.has(key)) continue;
        seen.add(key);
        results.push(result);
      }
      return { data: results, meta: { page, hasMore: page < MAX_EXTERNAL_SEARCH_PAGES && externalPage.hasMore, externalStatus: "AVAILABLE" } };
    } catch (error) {
      const externalStatus = error instanceof OpenFoodFactsSearchError && error.code === "RATE_LIMITED" ? "RATE_LIMITED" : "UNAVAILABLE";
      return { data: results, meta: { page, hasMore: false, externalStatus } };
    }
  }
}

export const productDiscoveryService = new ProductDiscoveryService();
