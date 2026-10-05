import { NextRequest, NextResponse } from "next/server";
import { ProductService } from "@/features/products/product.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const product = await ProductService.getProductById(id);
    
    if (!product) {
      return NextResponse.json(
        { error: { message: "Product not found", code: "NOT_FOUND" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error("Product API Error:", error);
    return NextResponse.json(
      { error: { message: "Failed to fetch product", code: "INTERNAL_ERROR" } },
      { status: 500 }
    );
  }
}
