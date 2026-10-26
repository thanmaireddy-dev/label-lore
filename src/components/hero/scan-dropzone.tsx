"use client";

import { Camera, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ProductSummary } from "@/features/products/product.types";

interface ScanDropzoneProps {
  className?: string;
}

export function ScanDropzone({ className }: ScanDropzoneProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data && data.data) {
          setResults(data.data);
          setIsOpen(true);
        }
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

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
      {/* Main dropzone area */}
      <div className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-border bg-surface/60 px-6 py-8 text-center backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:bg-surface/80">
        <div className="flex flex-col items-center gap-3">
          <div className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
            <Camera className="size-6" strokeWidth={1.5} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Drop a label photo or click to upload
            </p>
            <p className="text-xs text-foreground-muted">
              (OCR functionality coming in Phase 4)
            </p>
          </div>
        </div>

        {/* Hidden file input — visual only for now */}
        <input
          type="file"
          className="absolute inset-0 cursor-pointer opacity-0"
          accept="image/*"
          aria-label="Upload a food label photo"
          tabIndex={-1}
          disabled
        />
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3 py-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-foreground-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Text search fallback */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search
            className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-foreground-muted"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder="Search by product name or brand..."
            className="h-12 w-full rounded-xl border border-border bg-surface pl-11 pr-10 text-sm text-foreground placeholder:text-foreground-muted/60 transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
            aria-label="Search by product name or brand"
          />
          {isLoading && (
            <Loader2 className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin text-foreground-muted" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {isOpen && (
          <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-[var(--shadow-elevated)]">
            {results.length > 0 ? (
              <ul className="max-h-64 overflow-y-auto p-2">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/scan/${product.id}`}
                      className="flex flex-col rounded-lg px-3 py-2 transition-colors hover:bg-foreground/5"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {product.name}
                      </span>
                      <span className="text-xs text-foreground-muted">
                        {product.brand.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : query.trim() !== "" && !isLoading ? (
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
