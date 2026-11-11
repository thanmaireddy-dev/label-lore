import { NextRequest, NextResponse } from "next/server";
import { productDiscoveryService } from "@/features/products/product-discovery.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.trim() ?? "";
    const pageValue = Number(searchParams.get("page") ?? "1");

    if (!query || query.length > 100 || /[\u0000-\u001f\u007f]/.test(query)) {
      return NextResponse.json({ error: { message: "Enter a search term up to 100 characters.", code: "INVALID_QUERY" } }, { status: 400 });
    }
    if (!Number.isInteger(pageValue) || pageValue < 1 || pageValue > 5) {
      return NextResponse.json({ error: { message: "Search page must be between 1 and 5.", code: "INVALID_PAGE" } }, { status: 400 });
    }

    const result = await productDiscoveryService.search(query, pageValue);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: { message: "Failed to search products", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
