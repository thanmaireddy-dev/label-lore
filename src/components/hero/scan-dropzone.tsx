"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ProductGrade } from "@/components/analysis/product-grade";
import { ProductImage } from "@/components/products/product-image";
import { FoodLabelUpload } from "./food-label-upload";

type SearchResult = {
  source: "LOCAL" | "OPEN_FOOD_FACTS";
  productId: string | null;
  barcode: string | null;
  name: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
};

type SearchResponse = {
  data: SearchResult[];
  meta: { page: number; hasMore: boolean; externalStatus: "AVAILABLE" | "UNAVAILABLE" | "RATE_LIMITED" };
};

interface ScanDropzoneProps {
  className?: string;
}

export function ScanDropzone({ className }: ScanDropzoneProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [isBarcodeLoading, setIsBarcodeLoading] = useState(false);
  const [importingBarcode, setImportingBarcode] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [externalStatus, setExternalStatus] = useState<SearchResponse["meta"]["externalStatus"]>("AVAILABLE");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isLoading = isCatalogLoading || isBarcodeLoading || importingBarcode !== null;

  const searchCatalog = async (term: string, nextPage: number, append: boolean) => {
    setIsCatalogLoading(true);
    setSearchError(null);
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(term)}&page=${nextPage}`, { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok || !body || typeof body !== "object" || !("data" in body) || !Array.isArray(body.data) || !("meta" in body)) {
        throw new Error("Product search is temporarily unavailable. Please try again.");
      }
      const payload = body as SearchResponse;
      setResults((current) => {
        const combined = append ? [...current, ...payload.data] : payload.data;
        const keys = new Set<string>();
        return combined.filter((item) => {
          const key = item.barcode ? `barcode:${item.barcode}` : `${item.source}:${item.name.toLowerCase()}|${item.brand?.toLowerCase() ?? ""}`;
          if (keys.has(key)) return false;
          keys.add(key);
          return true;
        });
      });
      setPage(nextPage);
      setHasMore(payload.meta.hasMore);
      setExternalStatus(payload.meta.externalStatus);
      setIsOpen(true);
    } catch (cause) {
      setSearchError(cause instanceof Error ? cause.message : "Product search is temporarily unavailable.");
      setIsOpen(true);
      if (!append) setResults([]);
    } finally {
      setIsCatalogLoading(false);
    }
  };

  const importProduct = async (barcode: string) => {
    setImportingBarcode(barcode);
    setSearchError(null);
    try {
      const response = await fetch(`/api/products/by-barcode/${encodeURIComponent(barcode)}`, { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok) {
        if (response.status === 404) throw new Error("Open Food Facts no longer has this product.");
        if (response.status === 429) throw new Error("Too many imports. Wait a moment and try again.");
        if (response.status === 422) throw new Error("Open Food Facts returned incomplete product data, so this result could not be imported.");
        throw new Error("The product could not be imported right now. Please try again.");
      }
      const product = body && typeof body === "object" && "data" in body ? body.data : null;
      if (!product || typeof product !== "object" || !("id" in product) || typeof product.id !== "string") throw new Error("The product import returned an invalid response.");
      router.push(`/scan/${encodeURIComponent(product.id)}`);
    } catch (cause) {
      setSearchError(cause instanceof Error ? cause.message : "The product could not be imported.");
    } finally {
      setImportingBarcode(null);
    }
  };

  const submitSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    setSearchError(null);
    if (!trimmed) {
      setSearchError("Enter a barcode or product name to search.");
      return;
    }
    if (/^\d+$/.test(trimmed)) {
      if (!/^\d{8,14}$/.test(trimmed)) {
        setSearchError("A barcode must contain 8 to 14 digits.");
        return;
      }
      setIsBarcodeLoading(true);
      setIsOpen(false);
      try {
        const response = await fetch(`/api/products/by-barcode/${encodeURIComponent(trimmed)}`, { cache: "no-store" });
        const body: unknown = await response.json();
        if (!response.ok) {
          if (response.status === 400) throw new Error("That barcode is invalid. Enter 8 to 14 digits.");
          if (response.status === 404) throw new Error("No product was found for that barcode in Open Food Facts.");
          if (response.status === 422) throw new Error("Open Food Facts returned incomplete product information, so it could not be saved.");
          if (response.status === 429) throw new Error("Too many barcode lookups. Please wait a moment and try again.");
          throw new Error("The barcode lookup could not be completed.");
        }
        const product = body && typeof body === "object" && "data" in body ? body.data : null;
        if (!product || typeof product !== "object" || !("id" in product) || typeof product.id !== "string") throw new Error("The barcode lookup returned an invalid product response.");
        router.push(`/scan/${encodeURIComponent(product.id)}`);
      } catch (cause) {
        setSearchError(cause instanceof Error ? cause.message : "The barcode lookup failed. Please try again.");
      } finally {
        setIsBarcodeLoading(false);
      }
      return;
    }
    setResults([]);
    setPage(1);
    setIsOpen(false);
    await searchCatalog(trimmed, 1, false);
  };

  return (
    <div className={cn("w-full max-w-xl", className)}>
      <FoodLabelUpload />
      <div className="flex items-center gap-3 py-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-foreground-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="relative">
        <form onSubmit={(event) => void submitSearch(event)} className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-foreground-muted" strokeWidth={1.75} />
            <input
              type="search"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setResults([]); setSearchError(null); setIsOpen(false); }}
              placeholder="Product name, brand, or barcode"
              className="h-12 w-full rounded-xl border border-border bg-surface pl-11 pr-10 text-sm text-foreground placeholder:text-foreground-muted/60 transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
              aria-label="Search products by name, brand, or barcode"
              aria-describedby="search-scope"
            />
            {isLoading && <Loader2 className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin text-foreground-muted" />}
          </div>
          <button type="submit" disabled={isLoading} className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {isLoading ? "Searching…" : "Search"}
          </button>
        </form>
        <p id="search-scope" className="mt-2 text-xs text-foreground-muted">Search checks the local catalog and Open Food Facts when submitted. External products are only saved after you select Import.</p>
        {searchError && <p className="mt-2 text-sm text-flag" role="alert">{searchError}</p>}

        {isOpen && <div className="mt-3 space-y-3" aria-live="polite">
          {externalStatus === "UNAVAILABLE" && <p className="rounded-lg border border-border bg-surface p-3 text-xs text-foreground-muted">Open Food Facts search is unavailable; showing local matches only.</p>}
          {externalStatus === "RATE_LIMITED" && <p className="rounded-lg border border-border bg-surface p-3 text-xs text-foreground-muted">Open Food Facts search is rate limited for a short time; showing local matches only.</p>}
          {results.length === 0 && !isCatalogLoading && <p className="rounded-lg border border-border bg-surface p-4 text-sm text-foreground-muted">{externalStatus === "AVAILABLE" ? "No matching products found." : "No local matches were found while Open Food Facts is unavailable."}</p>}
          {results.map((product, index) => (
            <div key={product.productId ?? `${product.barcode ?? "no-barcode"}-${product.name}-${index}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
              <ProductImage src={product.imageUrl} alt={`${product.name} product packaging`} className="w-16 shrink-0" sizes="64px" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
                <p className="truncate text-xs text-foreground-muted">{product.brand ?? "Unknown brand"}{product.category ? ` · ${product.category}` : ""}</p>
                {product.source === "LOCAL" ? <span className="text-[10px] font-medium text-primary">Saved in your catalogue{product.imageUrl ? " · Open Food Facts image" : ""}</span> : <span className="text-[10px] text-foreground-muted">Open Food Facts · community-contributed, unverified</span>}
              </div>
              {product.source === "LOCAL" && product.productId ? (
                <Link href={`/scan/${encodeURIComponent(product.productId)}`} className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-foreground/5">Open</Link>
              ) : product.barcode ? (
                <button type="button" disabled={isLoading} onClick={() => void importProduct(product.barcode!)} className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60">
                  {importingBarcode === product.barcode ? "Importing…" : "Import"}
                </button>
              ) : <span className="max-w-20 text-right text-[10px] text-foreground-muted">Barcode unavailable for import</span>}
              {product.source === "LOCAL" && product.productId && <span className="hidden sm:inline-flex"><ProductGrade productId={product.productId} compact /></span>}
            </div>
          ))}
          {hasMore && <button type="button" disabled={isCatalogLoading} onClick={() => void searchCatalog(query.trim(), page + 1, true)} className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground disabled:opacity-60">{isCatalogLoading ? "Loading…" : "Load more Open Food Facts results"}</button>}
        </div>}
      </div>
    </div>
  );
}
