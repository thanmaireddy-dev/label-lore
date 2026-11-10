import { NextResponse } from "next/server";
import { reviewedOcrSubmissionSchema } from "@/features/analysis/ocr-analysis.contract";
import { OcrAnalysisConflictError, ocrFoodLabelAnalysisService } from "@/features/analysis/ocr-analysis.service";

const MAX_REVIEW_BODY_BYTES = 256 * 1024;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REVIEW_BODY_BYTES) {
    return NextResponse.json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Reviewed label data is too large." } }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "Send reviewed label fields as JSON." } }, { status: 400 });
  }
  const parsed = reviewedOcrSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "INVALID_REVIEW", message: "Check the ingredient text, nutrition values, and measurement basis.", issues: parsed.error.issues.map(({ path, message }) => ({ path, message })) } }, { status: 400 });
  }

  try {
    const result = await ocrFoodLabelAnalysisService.analyze(parsed.data);
    return NextResponse.json({ data: result }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof OcrAnalysisConflictError) {
      return NextResponse.json({ error: { code: "IDEMPOTENCY_CONFLICT", message: "This submission key already belongs to different reviewed data. Start a new label review." } }, { status: 409 });
    }
    console.error("Reviewed OCR analysis could not be saved");
    return NextResponse.json({ error: { code: "ANALYSIS_FAILED", message: "The reviewed label could not be analyzed. Please retry." } }, { status: 500 });
  }
}
