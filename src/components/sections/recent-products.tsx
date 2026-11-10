"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductGrade } from "@/components/analysis/product-grade";
import { addRecentProduct, parseRecentProducts, RECENT_PRODUCTS_EVENT, RECENT_PRODUCTS_STORAGE_KEY, type RecentProduct } from "@/features/history/recent-products";

function readHistory(): RecentProduct[] {
  try { return parseRecentProducts(window.localStorage.getItem(RECENT_PRODUCTS_STORAGE_KEY)); }
  catch { return []; }
}

export function rememberRecentProduct(product: Omit<RecentProduct, "visitedAt">) {
  if (typeof window === "undefined") return;
  try {
    const current = readHistory();
    const next = addRecentProduct(current, { ...product, visitedAt: new Date().toISOString() });
    window.localStorage.setItem(RECENT_PRODUCTS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(RECENT_PRODUCTS_EVENT));
  } catch {
    // Local history is optional and must never block viewing a product.
  }
}

export function TrackProductView({ productId, name, brand }: Omit<RecentProduct, "visitedAt">) {
  useEffect(() => { rememberRecentProduct({ productId, name, brand }); }, [productId, name, brand]);
  return null;
}

export function RecentProducts({ title = "Recent products", emptyMessage = "Products you open will appear here on this browser." }: { title?: string; emptyMessage?: string }) {
  const [entries, setEntries] = useState<RecentProduct[]>([]);

  useEffect(() => {
    const refresh = () => setEntries(readHistory());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(RECENT_PRODUCTS_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(RECENT_PRODUCTS_EVENT, refresh);
    };
  }, []);

  const clear = () => {
    try { window.localStorage.removeItem(RECENT_PRODUCTS_STORAGE_KEY); } catch { /* storage may be disabled */ }
    setEntries([]);
    window.dispatchEvent(new Event(RECENT_PRODUCTS_EVENT));
  };

  return (
    <section className="bg-background py-14 md:py-20" aria-labelledby="recent-products-heading">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mb-7 flex items-center justify-between gap-4">
          <h2 id="recent-products-heading" className="text-2xl font-semibold tracking-tight text-foreground">{title || "Recent products"}</h2>
          {entries.length > 0 && <button type="button" onClick={clear} className="rounded-lg border border-border px-3 py-2 text-sm text-foreground-muted hover:bg-foreground/5">Clear history</button>}
        </div>
        {entries.length === 0 ? <p className="rounded-xl border border-border bg-surface p-5 text-sm text-foreground-muted">{emptyMessage}</p> : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => (
              <li key={entry.productId}>
                <Link href={`/scan/${encodeURIComponent(entry.productId)}`} className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:bg-foreground/5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-foreground-muted">{new Date(entry.visitedAt).toLocaleDateString()}</span>
                    <ProductGrade productId={entry.productId} compact />
                  </div>
                  <h3 className="truncate text-sm font-semibold text-foreground">{entry.name}</h3>
                  <p className="mt-1 truncate text-xs text-foreground-muted">{entry.brand}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-foreground-muted">History is stored in this browser only.</p>
      </div>
    </section>
  );
}
