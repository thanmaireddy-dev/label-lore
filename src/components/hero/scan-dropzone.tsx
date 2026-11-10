"use client";

import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductSummary } from "@/features/products/product.types";
import { ProductGrade } from "@/components/analysis/product-grade";
import { FoodLabelUpload } from "./food-label-upload";

interface ScanDropzoneProps {
  className?: string;
}

export function ScanDropzone({ className }: ScanDropzoneProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [isBarcodeLoading, setIsBarcodeLoading] = useState(false);
  const isLoading = isCatalogLoading || isBarcodeLoading;
  const [isOpen, setIsOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const trimmed = query.trim();
      if (!trimmed || /^\d+$/.test(trimmed)) {
        setResults([]);
        setIsOpen(false);
        setIsCatalogLoading(false);
        return;
      }
      
      setIsCatalogLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        const data: unknown = await res.json();
        if (!res.ok) throw new Error("Catalog search is temporarily unavailable. Please try again.");
        if (data && typeof data === "object" && "data" in data && Array.isArray(data.data)) {
          setResults(data.data as ProductSummary[]);
          setIsOpen(true);
        }
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setResults([]);
        setIsOpen(true);
        setSearchError(cause instanceof Error ? cause.message : "Catalog search is temporarily unavailable.");
      } finally {
        if (!controller.signal.aborted) setIsCatalogLoading(false);
      }
    }, 300);

    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  const submitSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    setSearchError(null);
    setSearchMessage(null);
    if (!trimmed) {
      setSearchError("Enter a barcode or a product name to search.");
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
          const apiCode = body && typeof body === "object" && "error" in body && body.error && typeof body.error === "object" && "code" in body.error ? String(body.error.code) : "";
          if (response.status === 400) throw new Error("That barcode is invalid. Enter 8 to 14 digits.");
          if (response.status === 404) throw new Error("No product was found for that barcode in Open Food Facts.");
          if (response.status === 422) throw new Error("Open Food Facts returned incomplete product information, so it could not be saved.");
          if (response.status === 429) throw new Error("Too many barcode lookups. Please wait a moment and try again.");
          if (response.status >= 500 || apiCode === "UPSTREAM_ERROR") throw new Error("The product source is temporarily unavailable. Please try again.");
          throw new Error("The barcode lookup could not be completed.");
        }
        const product = body && typeof body === "object" && "data" in body ? body.data : null;
        if (!product || typeof product !== "object" || !("id" in product) || typeof product.id !== "string") {
          throw new Error("The barcode lookup returned an invalid product response.");
        }
        router.push(`/scan/${encodeURIComponent(product.id)}`);
      } catch (cause) {
        setSearchError(cause instanceof Error ? cause.message : "The barcode lookup failed. Please try again.");
      } finally {
        setIsBarcodeLoading(false);
      }
      return;
    }
    setIsCatalogLoading(true);
    setIsOpen(false);
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(trimmed)}`, { cache: "no-store" });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error("Catalog search is temporarily unavailable. Please try again.");
      const matches = body && typeof body === "object" && "data" in body && Array.isArray(body.data) ? body.data as ProductSummary[] : [];
      if (matches.length === 0) {
        setSearchMessage("No matching product in the local catalog. Search by barcode to check Open Food Facts.");
        setIsOpen(true);
        return;
      }
      router.push(`/scan/${encodeURIComponent(matches[0]!.id)}`);
    } catch (cause) {
      setSearchError(cause instanceof Error ? cause.message : "Catalog search is temporarily unavailable.");
    } finally {
      setIsCatalogLoading(false);
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className={cn("w-full max-w-xl", className)}>
      <FoodLabelUpload />

      {/* Separator */}
      <div className="flex items-center gap-3 py-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-foreground-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Local catalog search and remote barcode lookup */}
      <div className="relative" ref={dropdownRef}>
        <form onSubmit={(event) => void submitSearch(event)} className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-foreground-muted" strokeWidth={1.75} />
            <input
              type="search"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setResults([]); setIsOpen(false); setSearchError(null); setSearchMessage(null); }}
              onFocus={() => { if (results.length > 0) setIsOpen(true); }}
              placeholder="Product name, brand, or barcode"
              className="h-12 w-full rounded-xl border border-border bg-surface pl-11 pr-10 text-sm text-foreground placeholder:text-foreground-muted/60 transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
              aria-label="Search product catalog by name, brand, or look up a barcode"
              aria-describedby="search-scope"
            />
            {isLoading && <Loader2 className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin text-foreground-muted" />}
          </div>
          <button type="submit" disabled={isLoading} className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {isLoading ? "Searching…" : "Search"}
          </button>
        </form>
        <p id="search-scope" className="mt-2 text-xs text-foreground-muted">Name, brand, and category search checks the local catalog. Submitting a barcode looks it up with Open Food Facts.</p>
        {(searchError || searchMessage) && <p className={`mt-2 text-sm ${searchError ? "text-flag" : "text-foreground-muted"}`} role={searchError ? "alert" : "status"}>{searchError ?? searchMessage}</p>}

        {/* Search Results Dropdown */}
        {isOpen && (
          <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-elevated)]">
            {results.length > 0 ? (
              <ul className="max-h-64 overflow-y-auto p-2">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/scan/${product.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-foreground/5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">{product.name}</span>
                        <span className="block text-xs text-foreground-muted">{product.brand?.name ?? "Unknown brand"}</span>
                      </span>
                      <ProductGrade productId={product.id} compact />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : query.trim() !== "" && !isLoading && !searchError && !searchMessage && !/^\d+$/.test(query.trim()) ? (
              <div className="p-4 text-center text-sm text-foreground-muted">
                No products found.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
