"use client";

import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Droplets, Flame } from "lucide-react";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { StatusPill } from "@/components/ui/status-pill";

/**
 * FeaturedScan — hero-adjacent highlighted scan example.
 *
 * Design spec §8/§15: a larger featured card showing a scan result
 * with product name, brand, safety score, and top flag pills.
 * Demonstrates the product's core value proposition with real-looking data.
 *
 * This uses mock/demo data — real data comes in Phase 2+.
 */

const mockProduct = {
  name: "Choco-Nut Crunch Granola Bar",
  brand: "NutriSnack India",
  score: 62,
  grade: "C" as const,
  flags: [
    { label: "High added sugar (18g)", variant: "flag" as const, icon: Droplets },
    { label: "Contains palm oil", variant: "caution" as const, icon: AlertTriangle },
    { label: "No artificial colours", variant: "safe" as const, icon: ShieldCheck },
  ],
  nutrition: [
    { label: "Calories", value: "186 kcal" },
    { label: "Sugar", value: "18g" },
    { label: "Sodium", value: "140mg" },
    { label: "Protein", value: "4g" },
  ],
};

const gradeColors: Record<string, string> = {
  A: "text-safe",
  B: "text-safe",
  C: "text-caution",
  D: "text-flag",
};

export function FeaturedScan() {
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
          className="rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-card)]"
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
                    {mockProduct.name}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {mockProduct.brand}
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
                      className={`text-4xl font-semibold ${gradeColors[mockProduct.grade]}`}
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      {mockProduct.score}
                    </span>
                    <span className="text-sm text-foreground-muted">/ 100</span>
                  </div>
                </div>
                <span
                  className={`inline-flex size-12 items-center justify-center rounded-xl text-xl font-bold ${gradeColors[mockProduct.grade]} bg-current/10`}
                  style={{
                    backgroundColor:
                      mockProduct.grade === "C"
                        ? "var(--color-caution-bg)"
                        : mockProduct.grade === "D"
                          ? "var(--color-flag-bg)"
                          : "var(--color-safe-bg)",
                  }}
                >
                  {mockProduct.grade}
                </span>
              </div>

              {/* Safety score bar */}
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-foreground-muted">
                  <span>Ingredient Safety</span>
                  <span>{mockProduct.score}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-flag via-caution to-safe transition-all duration-700"
                    style={{ width: `${mockProduct.score}%` }}
                  />
                </div>
              </div>

              {/* Flag pills */}
              <div className="flex flex-wrap gap-2">
                {mockProduct.flags.map((flag) => (
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
                {mockProduct.nutrition.map((item) => (
                  <div key={item.label} className="min-w-[64px]">
                    <p className="text-xs text-foreground-muted">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
