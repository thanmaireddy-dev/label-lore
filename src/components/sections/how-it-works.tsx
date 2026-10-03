"use client";

import { ScanLine, FlaskConical, ShieldCheck, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";

/**
 * HowItWorks — 4-step explainer section.
 *
 * Design spec §4/§6: the "how it works" section is 4 short numbered steps.
 * Desktop: 4-column grid. Tablet: 2×2. Mobile: vertical stack.
 *
 * Section headline uses the accent-italic treatment per §3.
 */

const steps = [
  {
    icon: ScanLine,
    number: "01",
    title: "Scan the label",
    description:
      "Take a photo of any packaged food label, or search by product name. Our system reads the ingredient list and nutrition panel.",
  },
  {
    icon: FlaskConical,
    number: "02",
    title: "Analyse ingredients",
    description:
      "Every ingredient is checked against our database of additives, allergens, and FSSAI guidelines — no black-box scoring.",
  },
  {
    icon: ShieldCheck,
    number: "03",
    title: "Get your breakdown",
    description:
      "See a plain-language summary: what's safe, what's flagged, and why. Every warning comes with evidence, not fear.",
  },
  {
    icon: FileText,
    number: "04",
    title: "Compare & decide",
    description:
      "Save scans, compare products side-by-side, and track your reading history. Make informed choices at the shelf.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        {/* Section header */}
        <motion.div
          className="mb-14 max-w-2xl md:mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.p
            variants={fadeUp}
            className="mb-3 text-xs font-medium uppercase tracking-[0.06em] text-foreground-muted"
          >
            How it works
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
            style={{ lineHeight: 1.15, letterSpacing: "-0.02em" }}
          >
            From a photo to{" "}
            <span className="accent-italic">full clarity.</span>
          </motion.h2>
        </motion.div>

        {/* Step grid */}
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={fadeUp}
              className="group relative rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]"
            >
              {/* Step number — large, muted, top-right */}
              <span className="absolute top-5 right-5 text-2xl font-semibold text-foreground-muted/20">
                {step.number}
              </span>

              {/* Icon */}
              <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="size-5" strokeWidth={1.5} />
              </div>

              {/* Content */}
              <h3 className="mb-2 text-base font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-foreground-muted">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
