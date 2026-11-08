import path from "node:path";
import { mkdir } from "node:fs/promises";
import { createWorker } from "tesseract.js";
import { parseFoodLabelText, type FoodLabelExtraction } from "./food-label-parser";

export const MAX_LABEL_IMAGE_BYTES = 8 * 1024 * 1024;
export const SUPPORTED_LABEL_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type LabelImageType = (typeof SUPPORTED_LABEL_IMAGE_TYPES)[number];

export type LabelImageUpload = { type: string; size: number; bytes: Uint8Array };

export class FoodLabelOcrError extends Error {
  constructor(readonly code: "EMPTY_FILE" | "FILE_TOO_LARGE" | "UNSUPPORTED_TYPE" | "INVALID_IMAGE" | "NO_TEXT" | "OCR_FAILED") {
    super(code);
    this.name = "FoodLabelOcrError";
  }
}

function hasValidSignature(type: string, bytes: Uint8Array): boolean {
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte);
  if (type === "image/webp") return bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

export function validateLabelImage(upload: LabelImageUpload): void {
  if (upload.size <= 0 || upload.bytes.byteLength <= 0) throw new FoodLabelOcrError("EMPTY_FILE");
  if (upload.size > MAX_LABEL_IMAGE_BYTES || upload.bytes.byteLength > MAX_LABEL_IMAGE_BYTES) throw new FoodLabelOcrError("FILE_TOO_LARGE");
  if (!(SUPPORTED_LABEL_IMAGE_TYPES as readonly string[]).includes(upload.type)) throw new FoodLabelOcrError("UNSUPPORTED_TYPE");
  if (upload.size !== upload.bytes.byteLength || !hasValidSignature(upload.type, upload.bytes)) throw new FoodLabelOcrError("INVALID_IMAGE");
}

export async function recognizeLabelText(image: Uint8Array): Promise<string> {
  const packagePath = (name: string) => path.dirname(require.resolve(`${name}/package.json`));
  const cachePath = path.join(process.cwd(), "node_modules", ".cache", "label-lore-tesseract");
  await mkdir(cachePath, { recursive: true });
  const worker = await createWorker("eng", 1, {
    workerPath: path.join(packagePath("tesseract.js"), "src", "worker-script", "node", "index.js"),
    corePath: packagePath("tesseract.js-core"),
    cachePath,
  });
  try {
    const result = await worker.recognize(Buffer.from(image));
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}

export async function extractFoodLabel(
  upload: LabelImageUpload,
  recognize: (image: Uint8Array) => Promise<string> = recognizeLabelText,
): Promise<FoodLabelExtraction> {
  validateLabelImage(upload);
  let rawText: string;
  try {
    rawText = await recognize(upload.bytes);
  } catch {
    throw new FoodLabelOcrError("OCR_FAILED");
  }
  if (!rawText.trim()) throw new FoodLabelOcrError("NO_TEXT");
  return parseFoodLabelText(rawText);
}
