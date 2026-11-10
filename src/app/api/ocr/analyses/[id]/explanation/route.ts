import { NextResponse } from "next/server";
import { ExplanationRequestError } from "@/features/analysis/explanation.service";
import { ocrGradeExplanationService } from "@/features/analysis/ocr-analysis.explanation.service";

function errorResponse(error: unknown) {
  if (error instanceof ExplanationRequestError) {
    if (error.code === "RATE_LIMITED") return NextResponse.json({ error: { code: error.code, message: "The explanation service is busy. Please try again shortly." } }, { status: 429 });
    if (error.code === "TIMEOUT") return NextResponse.json({ error: { code: error.code, message: "The explanation request timed out. Please retry." } }, { status: 504 });
    return NextResponse.json({ error: { code: error.code, message: "The explanation could not be generated. Please retry." } }, { status: 502 });
  }
  console.error("OCR analysis explanation request failed");
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "The explanation could not be loaded. Please retry." } }, { status: 500 });
}

async function getAnalysisId(params: Promise<{ id: string }>) {
  return (await params).id;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await ocrGradeExplanationService.get(await getAnalysisId(params));
    if (!result) return NextResponse.json({ error: { code: "NOT_FOUND", message: "OCR analysis not found." } }, { status: 404 });
    return NextResponse.json({ data: result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await ocrGradeExplanationService.generateAndPersist(await getAnalysisId(params));
    if (!result) return NextResponse.json({ error: { code: "NOT_FOUND", message: "OCR analysis not found." } }, { status: 404 });
    return NextResponse.json({ data: result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
