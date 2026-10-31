import { NextRequest, NextResponse } from "next/server";
import { ProductIngestionService } from "@/features/ingestion/product-ingestion.service";
import { IncompleteOpenFoodFactsProductError, OpenFoodFactsRateLimitError, OpenFoodFactsRequestError, OpenFoodFactsUnavailableError } from "@/features/ingestion/open-food-facts.types";

export const dynamic = "force-dynamic";
const ingestion = new ProductIngestionService();

export async function GET(_request: NextRequest, { params }: { params: Promise<{ barcode: string }> }) {
  const { barcode } = await params;
  if (!/^\d{8,14}$/.test(barcode)) {
    return NextResponse.json({ error: { message: "Barcode must contain 8 to 14 digits", code: "VALIDATION_ERROR" } }, { status: 400 });
  }
  try {
    const product = await ingestion.lookupByBarcode(barcode);
    return NextResponse.json({ data: product, source: "open_food_facts", verificationStatus: product.verificationStatus });
  } catch (error) {
    if (error instanceof OpenFoodFactsUnavailableError) return NextResponse.json({ error: { message: "Product is unavailable from Open Food Facts", code: "NOT_FOUND" } }, { status: 404 });
    if (error instanceof IncompleteOpenFoodFactsProductError) return NextResponse.json({ error: { message: error.message, code: "INCOMPLETE_SOURCE_DATA" } }, { status: 422 });
    if (error instanceof OpenFoodFactsRateLimitError) return NextResponse.json({ error: { message: error.message, code: "SOURCE_RATE_LIMITED" } }, { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } });
    if (error instanceof OpenFoodFactsRequestError) {
      console.error("Open Food Facts lookup failed:", error.message);
      return NextResponse.json({ error: { message: "Product source is temporarily unavailable", code: "UPSTREAM_ERROR" } }, { status: 502 });
    }
    console.error("Barcode product lookup failed:", error);
    return NextResponse.json({ error: { message: "Failed to retrieve product", code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}
