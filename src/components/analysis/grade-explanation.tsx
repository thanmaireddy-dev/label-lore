"use client";

import { useCallback, useEffect, useState } from "react";
import { explanationResponseSchema, type ExplanationResult } from "@/features/analysis/explanation.contract";

type LastAction = "load" | "generate";

export function GradeExplanation({ productId }: { productId: string }) {
  const [result, setResult] = useState<ExplanationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [lastAction, setLastAction] = useState<LastAction>("load");

  const readResponse = async (response: Response) => {
    const body: unknown = await response.json();
    if (!response.ok) {
      const message = body && typeof body === "object" && "error" in body
        && body.error && typeof body.error === "object" && "message" in body.error
        ? String(body.error.message)
        : "The explanation could not be loaded. Please retry.";
      throw new Error(message);
    }
    const parsed = explanationResponseSchema.safeParse(body);
    if (!parsed.success || parsed.data.data.methodologyVersion.length === 0) {
      throw new Error("The explanation service returned an invalid response.");
    }
    return parsed.data.data;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLastAction("load");
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(productId)}/explanation`, { cache: "no-store" });
      setResult(await readResponse(response));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The explanation could not be loaded. Please retry.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setLastAction("generate");
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(productId)}/explanation`, { method: "POST" });
      setResult(await readResponse(response));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The explanation could not be generated. Please retry.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]" aria-labelledby="grade-explanation-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="grade-explanation-heading" className="text-lg font-semibold">Grade explanation</h2>
          <p className="mt-1 text-xs text-foreground-muted">The grade is calculated deterministically; AI only explains the saved result.</p>
        </div>
        {result?.status === "GENERATED" && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">AI-generated</span>}
        {result?.status === "INSUFFICIENT_DATA" && <span className="rounded-full bg-caution-bg px-3 py-1 text-xs font-medium text-caution">Deterministic note</span>}
      </div>

      {loading || generating ? (
        <p className="mt-4 text-sm text-foreground-muted" aria-live="polite">{generating ? "Generating an explanation…" : "Loading saved explanation…"}</p>
      ) : error ? (
        <div className="mt-4" role="alert">
          <p className="text-sm text-foreground-muted">{error}</p>
          <button type="button" onClick={() => lastAction === "generate" ? void generate() : void load()} className="mt-3 rounded-lg border border-border px-3 py-2 text-sm hover:bg-foreground/5">Retry</button>
        </div>
      ) : result?.status === "GENERATED" ? (
        <div className="mt-4">
          <p className="text-sm leading-6 text-foreground-muted">{result.explanation}</p>
          <p className="mt-3 text-xs text-foreground-muted">Generated with {result.model} · prompt {result.promptVersion}. This text does not set or change the grade.</p>
        </div>
      ) : result?.status === "INSUFFICIENT_DATA" ? (
        <p className="mt-4 text-sm leading-6 text-foreground-muted">{result.explanation}</p>
      ) : result?.status === "NOT_CONFIGURED" ? (
        <p className="mt-4 text-sm leading-6 text-foreground-muted">AI explanations are not configured. Set the server-side <code>OPENAI_API_KEY</code> and <code>OPENAI_MODEL</code> values to enable them.</p>
      ) : result?.status === "NOT_GENERATED" ? (
        <div className="mt-4">
          <p className="text-sm text-foreground-muted">Generate a short explanation from the saved grade factors and product data.</p>
          <button type="button" onClick={() => void generate()} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">Generate explanation</button>
        </div>
      ) : <p className="mt-4 text-sm text-foreground-muted">No explanation is available for this product.</p>}
    </section>
  );
}
