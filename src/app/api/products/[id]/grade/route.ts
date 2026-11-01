import { NextRequest, NextResponse } from "next/server";
import { ProductGradingService } from "@/features/analysis/grading.service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await ProductGradingService.getOrCalculateCurrent(id);
    if (!result) {
      return NextResponse.json({ error: { message: "Product not found", code: "NOT_FOUND" } }, { status: 404 });
    }
    return NextResponse.json({ data: result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Product grade retrieval failed:", error);
    return NextResponse.json({ error: { message: "Failed to retrieve product grade", code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await ProductGradingService.calculateAndPersist(id);
    if (!result) {
      return NextResponse.json({ error: { message: "Product not found", code: "NOT_FOUND" } }, { status: 404 });
    }
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("Product grading failed:", error);
    return NextResponse.json({ error: { message: "Failed to calculate product grade", code: "INTERNAL_ERROR" } }, { status: 500 });
  }
}
