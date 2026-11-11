"use client";

import Image from "next/image";
import { useState } from "react";
import { Package } from "lucide-react";
import { isValidOpenFoodFactsImageUrl } from "@/features/ingestion/open-food-facts-image";

export function ProductImage({
  src,
  alt,
  className = "",
  sizes = "(max-width: 768px) 50vw, 240px",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const usableUrl = isValidOpenFoodFactsImageUrl(src) ? src : null;

  return (
    <div className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 ${className}`}>
      {usableUrl && failedUrl !== usableUrl ? (
        <Image
          src={usableUrl}
          alt={alt}
          fill
          sizes={sizes}
          className="object-contain p-2"
          onError={() => setFailedUrl(usableUrl)}
        />
      ) : (
        <div className="flex flex-col items-center gap-2 text-foreground-muted/60" aria-label={usableUrl ? "Product image unavailable" : "No product image available"}>
          <Package className="size-10" strokeWidth={1.25} aria-hidden="true" />
          <span className="text-[10px]">Image unavailable</span>
        </div>
      )}
    </div>
  );
}

