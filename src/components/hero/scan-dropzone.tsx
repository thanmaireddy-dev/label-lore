"use client";

import { Upload, Camera, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ScanDropzone — the hero's primary interactive element.
 *
 * Design spec §6 / §15:
 *   Replace the reference site's search bar with a scan/upload dropzone
 *   styled with the same visual weight (bordered input-like surface,
 *   icon-left, placeholder text). The dropzone IS the hero visual.
 *
 * Phase 1 implementation: visual-only. Actual upload/OCR logic comes in
 * Phase 4. For now it's a styled surface that communicates the product's
 * core verb ("scan a label").
 */

interface ScanDropzoneProps {
  className?: string;
}

export function ScanDropzone({ className }: ScanDropzoneProps) {
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
              PNG, JPG, or HEIC — max 10 MB
            </p>
          </div>
        </div>

        {/* Hidden file input — functional in Phase 4 */}
        <input
          type="file"
          className="absolute inset-0 cursor-pointer opacity-0"
          accept="image/*"
          aria-label="Upload a food label photo"
          tabIndex={-1}
        />
      </div>

      {/* Separator */}
      <div className="flex items-center gap-3 py-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-foreground-muted">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Text search fallback */}
      <div className="relative">
        <Search
          className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-foreground-muted"
          strokeWidth={1.75}
        />
        <input
          type="text"
          placeholder="Search by product name or brand..."
          className="h-12 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm text-foreground placeholder:text-foreground-muted/60 transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
          aria-label="Search by product name or brand"
        />
      </div>
    </div>
  );
}
