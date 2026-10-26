"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { GradientBlobs } from "@/components/background/gradient-blobs";
import { ScanDropzone } from "@/components/hero/scan-dropzone";

/**
 * HeroSection — the landing page hero.
 *
 * Design spec §6:
 *   Eyebrow → plain 2-line H1 (no italic) → ~600px-capped paragraph →
 *   scan/upload dropzone → secondary arrow-link → ink-teal blob background.
 *
 * The H1 is plain sans per §3/§6: italic accents are reserved for
 * mid-page section headlines, not the primary hero line.
 */

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <GradientBlobs />

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.div
          className="flex flex-col items-start pt-32 pb-20 md:items-center md:pt-40 md:pb-28"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Eyebrow */}
          <motion.p
            variants={fadeUp}
            className="mb-5 text-xs font-medium uppercase tracking-[0.06em] text-foreground-muted md:text-center"
          >
            Label Reader · Know what you&apos;re eating
          </motion.p>

          {/* H1 — plain sans, no italic, per §3/§6 */}
          <motion.h1
            variants={fadeUp}
            className="max-w-3xl text-foreground md:text-center"
            style={{
              fontSize: "clamp(2rem, 5vw + 1rem, 4.5rem)",
              fontWeight: 560,
              letterSpacing: "-0.02em",
              lineHeight: 1.08,
            }}
          >
            Understand what&apos;s
            <br className="hidden sm:block" /> inside your food.
          </motion.h1>

          {/* Paragraph — capped at ~600px */}
          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-base leading-relaxed text-foreground-muted md:text-center md:text-lg"
          >
            Ingredient lists are long and full of jargon. Scan a label and get
            a plain-language breakdown of additives, allergens, and nutrition
            — in seconds.
          </motion.p>

          {/* Scan dropzone — the hero visual */}
          <motion.div variants={fadeUp} className="mt-10 w-full max-w-xl md:mx-auto">
            <ScanDropzone />
          </motion.div>

          {/* Secondary link */}
          <motion.a
            variants={fadeUp}
            href="#how-it-works"
            className="group mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground md:mx-auto"
          >
            See how scanning works
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
