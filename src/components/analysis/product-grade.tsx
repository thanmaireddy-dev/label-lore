"use client";

import { useCallback, useEffect, useState } from "react";
import { gradingResponseSchema, type PersistedGrade } from "@/features/analysis/grading.contract";
import type { ProductGrade } from "@/features/analysis/grading";

const gradeRequests = new Map<string, { request: Promise<PersistedGrade>; expiresAt: number }>();

const gradeStyles: Record<ProductGrade, string> = {
  A: "text-[#14532d] bg-[#dcfce7]",
  B: "text-[#166534] bg-[#f0fdf4]",
  C: "text-[#92400e] bg-[#fef3c7]",
  D: "text-[#c2410c] bg-[#ffedd5]",
  E: "text-[#b91c1c] bg-[#fee2e2]",
};

function fetchGrade(productId: string) {
  const existing = gradeRequests.get(productId);
  if (existing && existing.expiresAt > Date.now()) return existing.request;
  const request = (async () => {
    const response = await fetch(`/api/products/${encodeURIComponent(productId)}/grade`, { cache: "no-store" });
    const body: unknown = await response.json();
    if (!response.ok) {
      if (response.status === 404) throw new Error("PRODUCT_NOT_FOUND");
      throw new Error("Unable to load this product assessment. Please try again.");
    }
    const parsed = gradingResponseSchema.safeParse(body);
    if (!parsed.success || parsed.data.data.productId !== productId) throw new Error("The grading service returned an invalid result.");
    return parsed.data.data;
  })();
  gradeRequests.set(productId, { request, expiresAt: Date.now() + 15_000 });
  void request.catch(() => gradeRequests.delete(productId));
  return request;
}

function explainFactor(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/-/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function ProductGrade({ productId, compact = false }: { productId: string; compact?: boolean }) {
  const [grade, setGrade] = useState<PersistedGrade | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const requestGrade = useCallback(async () => {
    try {
      setGrade(await fetchGrade(productId));
      setNotFound(false);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unable to load this product assessment. Please try again.";
      if (message === "PRODUCT_NOT_FOUND") setNotFound(true);
      else setError(message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const retry = () => {
    setLoading(true);
    setError(null);
    void requestGrade();
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void requestGrade(); }, 0);
    return () => window.clearTimeout(timer);
  }, [requestGrade]);

  if (compact) {
    if (loading) return <span className="text-xs text-foreground-muted" aria-live="polite">Loading grade…</span>;
    if (notFound) return <span className="text-xs text-foreground-muted">Product not found</span>;
    if (error) return <span className="text-xs text-foreground-muted" title={error}>Grade unavailable</span>;
    if (!grade || grade.status === "INSUFFICIENT_DATA" || grade.grade === null || grade.score === null) {
      return <span className="text-xs text-foreground-muted">Insufficient data for a grade</span>;
    }
    return <span className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-sm font-semibold ${gradeStyles[grade.grade]}`}>
      {grade.grade}<span className="font-normal">{grade.score}/100</span>
    </span>;
  }

  if (loading) return <section className="rounded-2xl border border-border bg-surface p-6" aria-live="polite">Loading saved product analysis…</section>;
  if (notFound) return <section className="rounded-2xl border border-border bg-surface p-6" role="alert">This product could not be found.</section>;
  if (error) return <section className="rounded-2xl border border-border bg-surface p-6" role="alert">
    <p className="font-medium">Product analysis could not be loaded.</p>
    <p className="mt-1 text-sm text-foreground-muted">{error}</p>
    <button type="button" onClick={retry} className="mt-3 rounded-lg border border-border px-3 py-2 text-sm hover:bg-foreground/5">Retry</button>
  </section>;
  if (!grade) return <section className="rounded-2xl border border-border bg-surface p-6">No grading result is available.</section>;

  const completeness = grade.dataCompleteness;
  const factors = grade.factors;
  return <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]" aria-labelledby="grade-heading">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p id="grade-heading" className="text-xs font-medium uppercase tracking-widest text-foreground-muted">Label Lore assessment</p>
        <p className="mt-1 text-xs text-foreground-muted">Method {grade.methodologyVersion}</p>
      </div>
      {grade.status === "GRADED" && grade.grade !== null && grade.score !== null ? (
        <div className="flex items-center gap-3">
          <span className="text-3xl font-semibold">{grade.score}<span className="text-base text-foreground-muted"> / 100</span></span>
          <span className={`inline-flex size-12 items-center justify-center rounded-xl text-xl font-bold ${gradeStyles[grade.grade]}`}>{grade.grade}</span>
        </div>
      ) : <span className="rounded-lg bg-caution-bg px-3 py-2 text-sm font-medium text-caution">Insufficient data</span>}
    </div>

    <p className="mt-4 text-sm text-foreground-muted">
      {grade.status === "GRADED"
        ? "This is Label Lore’s deterministic nutrition profile score, not an official FSSAI rating."
        : `No grade or score was assigned. Required nutrition fields missing: ${completeness.requiredFields.missing.join(", ") || "none"}. Invalid fields: ${completeness.requiredFields.invalid.join(", ") || "none"}. Basis: ${completeness.basisStatus.toLowerCase()}.`}
    </p>

    {grade.status === "GRADED" && grade.score !== null && <div className="mt-4" aria-label={`Score ${grade.score} out of 100`}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border"><div className="h-full rounded-full bg-primary" style={{ width: `${grade.score}%` }} /></div>
    </div>}

    <details className="mt-5">
      <summary className="cursor-pointer text-sm font-medium">Scoring factors and data quality</summary>
      <div className="mt-3 space-y-3">
        {factors.filter((factor) => factor.category !== "ingredients").map((factor, index) => <div key={`${factor.key}-${index}`} className="rounded-lg border border-border/70 p-3">
          <div className="flex flex-wrap justify-between gap-2 text-sm font-medium">
            <span>{explainFactor(factor.key)}</span>
            <span className={factor.effect === "risk" ? "text-flag" : factor.effect === "benefit" ? "text-safe" : "text-foreground-muted"}>{factor.applied ? `${factor.points} ${factor.effect} point(s)` : "Not applied"}</span>
          </div>
          <p className="mt-1 text-xs text-foreground-muted">Source value: {factor.value ?? "Unavailable"}{factor.unit ? ` ${factor.unit}` : ""}</p>
          <p className="mt-1 text-xs text-foreground-muted">{factor.explanation}</p>
        </div>)}
        <div className="rounded-lg border border-border/70 p-3 text-sm">
          <p className="font-medium">Nutrition completeness</p>
          <p className="mt-1 text-xs text-foreground-muted">{completeness.requiredFields.available}/{completeness.requiredFields.total} required checks available · basis {completeness.basisStatus.toLowerCase()} · verification {completeness.nutritionVerification ?? "unspecified"}</p>
          {completeness.uncertainties.map((uncertainty) => <p key={uncertainty} className="mt-1 text-xs text-foreground-muted">{uncertainty}</p>)}
        </div>
        <p className="text-xs text-foreground-muted">Calculated {new Date(grade.calculatedAt).toLocaleString()}</p>
      </div>
    </details>
  </section>;
}
