import { OpenFoodFactsSearchResponseSchema } from "./open-food-facts.types";
import { selectOpenFoodFactsFrontImage } from "./open-food-facts-image";

const SEARCH_URL = "https://search.openfoodfacts.org/search";
const SEARCH_PAGE_SIZE = 8;
const MAX_SEARCH_REQUESTS_PER_MINUTE = 8;
const requestTimes: number[] = [];

export class OpenFoodFactsSearchError extends Error {
  constructor(readonly code: "RATE_LIMITED" | "TIMEOUT" | "UNAVAILABLE" | "INVALID_RESPONSE") {
    super(code);
    this.name = "OpenFoodFactsSearchError";
  }
}

export type OpenFoodFactsSearchPage = {
  products: Array<{
    barcode: string | null;
    name: string;
    brand: string | null;
    category: string | null;
    imageUrl: string | null;
  }>;
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

function takeSearchSlot() {
  const now = Date.now();
  while (requestTimes.length && now - requestTimes[0]! >= 60_000) requestTimes.shift();
  if (requestTimes.length >= MAX_SEARCH_REQUESTS_PER_MINUTE) throw new OpenFoodFactsSearchError("RATE_LIMITED");
  requestTimes.push(now);
}

function firstText(value: string | string[] | null | undefined): string | null {
  const text = Array.isArray(value) ? value[0] : value;
  return typeof text === "string" && text.trim() ? text.trim() : null;
}

function totalCount(value: number | { value: number } | undefined): number {
  return typeof value === "number" ? value : value?.value ?? 0;
}

export class OpenFoodFactsSearchClient {
  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly userAgent = process.env.OPEN_FOOD_FACTS_USER_AGENT ?? `LabelLore/0.3.0 (${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"})`,
  ) {}

  async search(query: string, page: number): Promise<OpenFoodFactsSearchPage> {
    takeSearchSlot();
    let response: Response;
    try {
      response = await this.fetchImpl(SEARCH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": this.userAgent },
        body: JSON.stringify({
          q: query,
          page,
          page_size: SEARCH_PAGE_SIZE,
          fields: ["code", "product_name", "product_name_en", "brands", "categories", "image_url", "image_front_url", "image_front_small_url"],
          langs: ["en"],
          boost_phrase: true,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(7_000),
      });
    } catch (error) {
      throw new OpenFoodFactsSearchError(error instanceof Error && error.name === "TimeoutError" ? "TIMEOUT" : "UNAVAILABLE");
    }
    if (response.status === 429) throw new OpenFoodFactsSearchError("RATE_LIMITED");
    if (!response.ok) throw new OpenFoodFactsSearchError("UNAVAILABLE");

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new OpenFoodFactsSearchError("INVALID_RESPONSE");
    }
    const parsed = OpenFoodFactsSearchResponseSchema.safeParse(payload);
    if (!parsed.success) throw new OpenFoodFactsSearchError("INVALID_RESPONSE");

    const products = parsed.data.hits.flatMap((hit) => {
      const name = hit.product_name?.trim() || hit.product_name_en?.trim();
      if (!name) return [];
      const code = hit.code == null ? "" : String(hit.code).trim();
      return [{
        barcode: /^\d{8,14}$/.test(code) ? code : null,
        name,
        brand: firstText(hit.brands),
        category: firstText(hit.categories),
        imageUrl: selectOpenFoodFactsFrontImage(hit as Record<string, unknown>),
      }];
    });
    const total = parsed.data.count ?? totalCount(parsed.data.total);
    const pageCount = parsed.data.page_count ?? Math.ceil(total / SEARCH_PAGE_SIZE);
    return { products, page, pageSize: SEARCH_PAGE_SIZE, total, hasMore: page < pageCount };
  }
}

export const openFoodFactsSearchClient = new OpenFoodFactsSearchClient();
