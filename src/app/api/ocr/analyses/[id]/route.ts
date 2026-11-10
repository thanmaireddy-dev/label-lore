import { NextResponse } from "next/server";
import { ocrFoodLabelAnalysisService } from "@/features/analysis/ocr-analysis.service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await ocrFoodLabelAnalysisService.getById(id);
    if (!result) return NextResponse.json({ error: { code: "NOT_FOUND", message: "OCR analysis not found." } }, { status: 404 });
    return NextResponse.json({ data: result }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: { code: "ANALYSIS_READ_FAILED", message: "The OCR analysis could not be loaded." } }, { status: 500 });
  }
}
