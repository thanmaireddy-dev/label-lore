import { OpenFoodFactsResponseSchema, OpenFoodFactsRequestError, OpenFoodFactsUnavailableError, OpenFoodFactsRateLimitError } from "./open-food-facts.types";

const API_BASE = "https://world.openfoodfacts.org/api/v3/product";
const WINDOW_MS = 60_000; const MAX_REQUESTS_PER_WINDOW = 15; const requestTimes: number[] = [];
function takeReadSlot(): void {
  const now = Date.now(); while (requestTimes.length && now - requestTimes[0] >= WINDOW_MS) requestTimes.shift();
  if (requestTimes.length >= MAX_REQUESTS_PER_WINDOW) throw new OpenFoodFactsRateLimitError(Math.max(1, Math.ceil((WINDOW_MS - (now - requestTimes[0])) / 1000)));
  requestTimes.push(now);
}
export class OpenFoodFactsClient {
  constructor(private readonly fetchImpl: typeof fetch = fetch, private readonly userAgent = process.env.OPEN_FOOD_FACTS_USER_AGENT ?? `LabelLore/0.3.0 (${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"})`) {}
  async getProductByBarcode(barcode: string) {
    takeReadSlot();
    const fields = ["code", "product_name", "product_name_en", "brands", "categories", "image_url", "quantity", "serving_size", "ingredients_text", "ingredients", "allergens", "allergens_tags", "additives_tags", "nutriments", "nutrition_data_per", "last_modified_t"].join(",");
    let response: Response;
    try {
      response = await this.fetchImpl(`${API_BASE}/${encodeURIComponent(barcode)}.json?fields=${encodeURIComponent(fields)}`, {
        method: "GET", headers: { "User-Agent": this.userAgent, Accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(8_000),
      });
    } catch (error) { throw new OpenFoodFactsRequestError(error instanceof Error ? error.message : "Open Food Facts request failed"); }
    if (response.status === 404) throw new OpenFoodFactsUnavailableError();
    if (response.status === 429) throw new OpenFoodFactsRateLimitError(60);
    if (!response.ok) throw new OpenFoodFactsRequestError(`Open Food Facts returned HTTP ${response.status}`, response.status);
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new OpenFoodFactsRequestError("Open Food Facts returned malformed JSON", response.status); }
    const parsed = OpenFoodFactsResponseSchema.safeParse(payload);
    if (!parsed.success) throw new OpenFoodFactsRequestError("Open Food Facts response did not match the documented product response", response.status);
    const unsuccessful = typeof parsed.data.status === "number"
      ? parsed.data.status !== 1
      : parsed.data.status !== "success";
    if (unsuccessful || !parsed.data.product) throw new OpenFoodFactsUnavailableError(parsed.data.status_verbose ?? undefined);
    return parsed.data.product;
  }
}
