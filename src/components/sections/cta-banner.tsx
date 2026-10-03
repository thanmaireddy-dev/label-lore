"use client";

import { ArrowRight, ScanLine } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, viewportOnce } from "@/lib/animations";
import { Button } from "@/components/ui/button";

/**
 * CTABanner — mid-page call-to-action.
 *
 * Design spec §15/§18: a prominent CTA banner between the content
 * sections and the footer. Uses the primary color as a background
 * tint to visually break from the page rhythm and draw attention.
 */

export function CTABanner() {
  return (
    <section className="py-24 md:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={fadeUp}
          className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center md:px-12 md:py-20"
        >
          {/* Subtle gradient overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 30% 20%, rgba(255,255,255,0.15), transparent), radial-gradient(ellipse 50% 60% at 80% 80%, rgba(255,255,255,0.1), transparent)",
            }}
          />

          <div className="relative space-y-6">
            <h2
              className="mx-auto max-w-xl text-2xl font-semibold text-primary-foreground md:text-3xl lg:text-4xl"
              style={{ lineHeight: 1.15, letterSpacing: "-0.02em" }}
            >
              Ready to understand your food labels?
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-primary-foreground/70 md:text-base">
              Scan your first product in seconds. No account required —
              just point, scan, and learn what&apos;s inside.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                variant="secondary"
                className="border-primary-foreground/20 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                size="lg"
              >
                <ScanLine className="size-4" strokeWidth={1.75} />
                Start scanning
              </Button>
              <a
                href="#how-it-works"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary-foreground/70 transition-colors hover:text-primary-foreground"
              >
                Learn more
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
