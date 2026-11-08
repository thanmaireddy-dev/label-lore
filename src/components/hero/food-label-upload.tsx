"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { foodLabelExtractionResponseSchema } from "@/features/analysis/food-label.contract";
import type { FoodLabelExtraction, LabelNutrientKey } from "@/features/analysis/food-label-parser";
import { isUserCorrected } from "@/features/analysis/food-label-review";

const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxBytes = 8 * 1024 * 1024;
const nutritionLabels: Record<LabelNutrientKey, string> = {
  energyKcal: "Energy",
  fat: "Total fat",
  saturatedFat: "Saturated fat",
  transFat: "Trans fat",
  carbohydrates: "Carbohydrates",
  sugars: "Total sugars",
  fibre: "Fiber",
  protein: "Protein",
  sodium: "Sodium",
  salt: "Salt",
};

export function FoodLabelUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FoodLabelExtraction | null>(null);
  const [ingredientText, setIngredientText] = useState("");
  const [changedIngredients, setChangedIngredients] = useState(false);
  const [values, setValues] = useState<Record<LabelNutrientKey, string> | null>(null);
  const [changedValues, setChangedValues] = useState<Set<LabelNutrientKey>>(new Set());

  const upload = async (file: File | undefined) => {
    setError(null);
    setResult(null);
    setValues(null);
    setChangedValues(new Set());
    setChangedIngredients(false);
    if (!file) return;
    if (!acceptedTypes.includes(file.type)) { setError("Use a JPEG, PNG, or WebP image."); return; }
    if (file.size === 0) { setError("Choose a non-empty image file."); return; }
    if (file.size > maxBytes) { setError("The image is too large. Choose an image up to 8 MB."); return; }

    const form = new FormData();
    form.append("image", file);
    setLoading(true);
    try {
      const response = await fetch("/api/ocr", { method: "POST", body: form });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message = body && typeof body === "object" && "error" in body && body.error && typeof body.error === "object" && "message" in body.error
          ? String(body.error.message)
          : "The image could not be processed. Please try again.";
        throw new Error(message);
      }
      const parsed = foodLabelExtractionResponseSchema.safeParse(body);
      if (!parsed.success) throw new Error("The OCR service returned an invalid result.");
      const extraction = parsed.data.data;
      setResult(extraction);
      setIngredientText(extraction.ingredients.originalText ?? "");
      setValues(Object.fromEntries(Object.entries(extraction.nutrition.values).map(([key, value]) => [key, value.value === null ? "" : String(value.value)])) as Record<LabelNutrientKey, string>);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The image could not be processed. Please try again.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const keys = Object.keys(nutritionLabels) as LabelNutrientKey[];

  return (
    <section className="w-full" aria-labelledby="label-upload-heading">
      <h2 id="label-upload-heading" className="sr-only">Extract food label text from an image</h2>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Upload a food label photo"
        disabled={loading}
        onChange={(event) => void upload(event.target.files?.[0])}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="group w-full rounded-2xl border-2 border-dashed border-border bg-surface/60 px-6 py-8 text-center backdrop-blur-sm transition-colors hover:border-primary/40 hover:bg-surface/80 disabled:cursor-wait"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); void upload(event.dataTransfer.files[0]); }}
      >
        <span className="flex flex-col items-center gap-3">
          <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
            {loading ? <Loader2 className="size-6 animate-spin" /> : <Camera className="size-6" strokeWidth={1.5} />}
          </span>
          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">{loading ? "Reading label text…" : "Drop a label photo or click to upload"}</span>
            <span className="block text-xs text-foreground-muted">JPEG, PNG, or WebP · up to 8 MB · processed on this server</span>
          </span>
        </span>
      </button>

      {error && <p className="mt-3 rounded-lg border border-flag/30 bg-flag-bg p-3 text-sm text-flag" role="alert">{error}</p>}

      {result && values && (
        <div className="mt-5 space-y-5 rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center gap-2">
            <Upload className="size-4 text-primary" />
            <h3 className="font-semibold text-foreground">Review extracted label</h3>
            <span className="rounded-full bg-caution-bg px-2 py-1 text-xs font-medium text-caution">Unverified OCR</span>
          </div>
          <p className="text-sm text-foreground-muted">OCR can be inaccurate. Review the text and edit parsed values before using them. Nothing is saved as a branded product or used to calculate a grade.</p>
          {result.warnings.map((warning) => <p key={warning} className="text-xs text-foreground-muted">{warning}</p>)}

          <label className="block text-sm font-medium text-foreground" htmlFor="ocr-raw-text">Raw OCR text <span className="font-normal text-foreground-muted">(read-only source)</span></label>
          <textarea id="ocr-raw-text" value={result.rawText} readOnly rows={7} className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-mono text-xs leading-5 text-foreground-muted" />

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground" htmlFor="ocr-ingredients">Ingredient list <span className="font-normal text-foreground-muted">(editable)</span></label>
            <textarea id="ocr-ingredients" value={ingredientText} onChange={(event) => { setIngredientText(event.target.value); setChangedIngredients(isUserCorrected(result.ingredients.originalText, event.target.value)); }} rows={3} placeholder="No ingredient list identified" className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" />
            {changedIngredients && <span className="mt-1 block text-xs text-primary">User corrected</span>}
            {result.ingredients.items.length > 0 && <p className="mt-2 text-xs text-foreground-muted">Parsed items: {result.ingredients.items.map((item) => item.name).join(" · ")}</p>}
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-sm font-semibold text-foreground">Nutrition values <span className="font-normal text-foreground-muted">· {result.nutrition.basis === "PER_100G" ? "per 100 g" : result.nutrition.basis === "PER_100ML" ? "per 100 ml" : "basis not identified"}</span></h4>
              <span className="text-xs text-foreground-muted">Null means not confidently read; it is not zero.</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {keys.map((key) => (
                <label key={key} className="block text-xs font-medium text-foreground">
                  {nutritionLabels[key]} <span className="text-foreground-muted">({result.nutrition.values[key].unit})</span>
                  <input type="number" min="0" step="any" value={values[key]} onChange={(event) => {
                    setValues((previous) => previous ? { ...previous, [key]: event.target.value } : previous);
                    const original = result.nutrition.values[key].value;
                    setChangedValues((previous) => { const next = new Set(previous); if (isUserCorrected(original, event.target.value)) next.add(key); else next.delete(key); return next; });
                  }} placeholder="Not detected" className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground" />
                  {changedValues.has(key) ? <span className="mt-1 block text-xs text-primary">User corrected</span> : result.nutrition.values[key].sourceText && <span className="mt-1 block truncate font-normal text-foreground-muted">Read from: {result.nutrition.values[key].sourceText}</span>}
                </label>
              ))}
            </div>
          </div>
          <p className="border-t border-border pt-3 text-xs text-foreground-muted">Your edits remain in this review only. They are not saved or submitted for analysis in this phase.</p>
        </div>
      )}
    </section>
  );
}
