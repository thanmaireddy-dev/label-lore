import { NextResponse } from "next/server";
import { extractFoodLabel, FoodLabelOcrError, MAX_LABEL_IMAGE_BYTES, SUPPORTED_LABEL_IMAGE_TYPES } from "@/features/analysis/food-label-ocr.service";

export const runtime = "nodejs";

const messages: Record<FoodLabelOcrError["code"], { status: number; message: string }> = {
  EMPTY_FILE: { status: 400, message: "Choose a non-empty image file." },
  FILE_TOO_LARGE: { status: 413, message: "The image is too large. Choose an image up to 8 MB." },
  UNSUPPORTED_TYPE: { status: 415, message: "Use a JPEG, PNG, or WebP image." },
  INVALID_IMAGE: { status: 400, message: "The uploaded file does not appear to be a valid image." },
  NO_TEXT: { status: 422, message: "No readable text was detected. Try a clearer, well-lit label photo." },
  OCR_FAILED: { status: 503, message: "Local text extraction failed. Please try another image." },
};

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_LABEL_IMAGE_BYTES + 64 * 1024) {
    return NextResponse.json({ error: { code: "FILE_TOO_LARGE", message: messages.FILE_TOO_LARGE.message } }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_IMAGE", message: "Upload the image as multipart form data." } }, { status: 400 });
  }

  const file = form.get("image");
  if (!file || typeof file === "string" || !("arrayBuffer" in file) || !("type" in file) || !("size" in file)) {
    return NextResponse.json({ error: { code: "EMPTY_FILE", message: messages.EMPTY_FILE.message } }, { status: 400 });
  }
  if (file.size <= 0) return NextResponse.json({ error: { code: "EMPTY_FILE", message: messages.EMPTY_FILE.message } }, { status: 400 });
  if (file.size > MAX_LABEL_IMAGE_BYTES) return NextResponse.json({ error: { code: "FILE_TOO_LARGE", message: messages.FILE_TOO_LARGE.message } }, { status: 413 });
  if (!(SUPPORTED_LABEL_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: { code: "UNSUPPORTED_TYPE", message: messages.UNSUPPORTED_TYPE.message } }, { status: 415 });
  }

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const extraction = await extractFoodLabel({ type: file.type, size: file.size, bytes });
    return NextResponse.json({ data: extraction }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof FoodLabelOcrError) {
      const response = messages[error.code];
      return NextResponse.json({ error: { code: error.code, message: response.message } }, { status: response.status });
    }
    console.error("Food label OCR request failed");
    return NextResponse.json({ error: { code: "OCR_FAILED", message: messages.OCR_FAILED.message } }, { status: 503 });
  }
}
