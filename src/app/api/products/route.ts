import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/features/products/product.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/products
 * Returns a paginated list of all products.
 * Query params:
 *   limit: number (default 50, max 100)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit");
    const limit = Math.min(parseInt(limitParam ?? "50", 10) || 50, 100);

    const products = await ProductService.getAllProducts(limit);
    return NextResponse.json({ data: products, count: products.length });
  } catch (error) {
    console.error("Products list API Error:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch products", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
