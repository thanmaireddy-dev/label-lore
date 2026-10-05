"use client";

import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Droplets, Flame } from "lucide-react";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { StatusPill } from "@/components/ui/status-pill";
import { ProductWithDetails } from "@/features/products/product.types";
import Link from "next/link";

interface FeaturedScanProps {
  product?: ProductWithDetails | null;
}

const gradeColors: Record<string, string> = {
  A: "text-safe bg-safe-bg",
  B: "text-safe bg-safe-bg",
  C: "text-caution bg-caution-bg",
  D: "text-flag bg-flag-bg",
};

export function FeaturedScan({ product }: FeaturedScanProps) {
  // Fallback if no product is passed
  if (!product) return null;

  // Determine a mock score and grade for Phase 2.
  // In Phase 3, this will be replaced by the actual scoring engine.
  const mockScore = (product.name.length * 7) % 100;
  let grade = "C";
  if (mockScore >= 80) grade = "A";
  else if (mockScore >= 60) grade = "B";
  else if (mockScore >= 40) grade = "C";
  else grade = "D";

  // Map database nutrition to UI display strip
  const n = product.nutrition;
  const nutritionStrip = n
    ? [
        { label: "Calories", value: `${n.energyKcal} kcal` },
        { label: "Sugar", value: `${n.totalSugar || n.sugar || 0}g` },
        { label: "Sodium", value: `${n.sodium || 0}mg` },
        { label: "Protein", value: `${n.protein}g` },
      ]
    : [];

  // Map database claims/ingredients to flag pills (mock logic for Phase 2)
  const flags = [];
  if (n && n.sugar && n.sugar > 15) {
    flags.push({ label: `High sugar (${n.sugar}g)`, variant: "flag" as const, icon: Droplets });
  }
  if (product.ingredients.some(i => i.ingredient.name.toLowerCase().includes("palm"))) {
    flags.push({ label: "Contains palm oil", variant: "caution" as const, icon: AlertTriangle });
  }
  if (product.claims.length > 0) {
    flags.push({ label: product.claims[0].claim.text, variant: "safe" as const, icon: ShieldCheck });
  }

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
                    {product.brand.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: analysis results */}
            <div className="space-y-6 p-6 md:col-span-3 md:p-8">
              {/* Score header */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
                    Label Score
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span
                      className={`text-4xl font-semibold ${gradeColors[grade].split(" ")[0]}`}
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {mockScore}
                    </span>
                    <span className="text-sm text-foreground-muted">/ 100</span>
                  </div>
                </div>
                <span
                  className={`inline-flex size-12 items-center justify-center rounded-xl text-xl font-bold ${gradeColors[grade]}`}
                >
                  {grade}
                </span>
              </div>

              {/* Safety score bar */}
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-foreground-muted">
                  <span>Ingredient Safety</span>
                  <span>{mockScore}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-flag via-caution to-safe transition-all duration-700"
                    style={{ width: `${mockScore}%` }}
                  />
                </div>
              </div>

              {/* Flag pills */}
              <div className="flex flex-wrap gap-2">
                {flags.map((flag) => (
                  <StatusPill
                    key={flag.label}
                    variant={flag.variant}
                    icon={<flag.icon className="size-3.5" strokeWidth={1.75} />}
                  >
                    {flag.label}
                  </StatusPill>
                ))}
              </div>

              {/* Nutrition strip */}
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
            </div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
