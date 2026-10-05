import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/features/products/product.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ data: [] });
    }

    const products = await ProductService.searchProducts(query);
    
    return NextResponse.json({ data: products });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json(
      { error: { message: "Failed to search products", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
