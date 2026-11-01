"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { ProductWithDetails } from "@/features/products/product.types";
import Link from "next/link";
import { ProductGrade } from "@/components/analysis/product-grade";

interface FeaturedScanProps {
  product?: ProductWithDetails | null;
}

export function FeaturedScan({ product }: FeaturedScanProps) {
  // Fallback if no product is passed
  if (!product) return null;

  // Map database nutrition to UI display strip
  const n = product.nutrition;
  const nutritionStrip = n
    ? [
        { label: "Calories", value: `${n.energyKcal ?? "--"} kcal` },
        { label: "Sugar", value: n.sugar != null ? `${n.sugar}g` : "Unavailable" },
        { label: "Sodium", value: n.sodium != null ? `${n.sodium}mg` : "Unavailable" },
        { label: "Protein", value: `${n.protein ?? "--"}g` },
      ]
    : [];

  return (
    <section className="py-24 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* Section header */}
        <motion.div
          className="mb-10 max-w-2xl md:mb-14"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.p
            variants={fadeUp}
            className="mb-3 text-xs font-medium uppercase tracking-[0.06em] text-foreground-muted"
          >
            Featured
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            style={{ lineHeight: 1.15, letterSpacing: "-0.02em" }}
          >
            See what a{" "}
            <span className="accent-italic">scan reveals.</span>
          </motion.h2>
        </motion.div>

        {/* Featured card */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
        >
          <Link
            href={`/scan/${product.id}`}
            className="block rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elevated)]"
          >
            <div className="grid gap-0 md:grid-cols-5">
              {/* Left: product image placeholder */}
              <div className="flex items-center justify-center rounded-t-[var(--radius-card)] bg-gradient-to-br from-primary/5 to-primary/10 p-10 md:col-span-2 md:rounded-t-none md:rounded-l-[var(--radius-card)]">
                <div className="space-y-3 text-center">
                  <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-primary/10">
                    <Flame className="size-10 text-primary/60" strokeWidth={1.25} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {product.name}
                    </p>
                    <p className="text-xs text-foreground-muted">
                      {product.brand?.name ?? "Unknown brand"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: analysis results */}
              <div className="space-y-6 p-6 md:col-span-3 md:p-8">
                {/* Current methodology result from PostgreSQL */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground-muted">Product assessment</p>
                    <ProductGrade productId={product.id} compact />
                  </div>
                </div>

                {product.ingredients.length > 0 && <p className="text-xs text-foreground-muted">{product.ingredients.length} source-listed ingredients · identities are shown without safety labels</p>}

                {/* Nutrition strip */}
                {nutritionStrip.length > 0 && (
                  <div className="flex flex-wrap gap-4 border-t border-border pt-4">
                    {nutritionStrip.map((item) => (
                      <div key={item.label} className="min-w-[64px]">
                        <p className="text-xs text-foreground-muted">{item.label}</p>
                        <p className="text-sm font-medium text-foreground">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
