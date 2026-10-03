"use client";

import { Mail } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce } from "@/lib/animations";
import { Button } from "@/components/ui/button";

/**
 * Newsletter — email signup section before the footer.
 *
 * Design spec §18: newsletter section near the footer.
 * Phase 1: visual-only. No backend email handling yet.
 */

export function Newsletter() {
  return (
    <section className="border-t border-border bg-surface/50 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.div
          className="mx-auto max-w-lg text-center"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeUp}
            className="mx-auto mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"
          >
            <Mail className="size-5" strokeWidth={1.5} />
          </motion.div>

          <motion.h2
            variants={fadeUp}
            className="mb-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl"
          >
            Stay in the loop
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mb-6 text-sm text-foreground-muted"
          >
            Get weekly insights on food labels, ingredient alerts, and
            product transparency — no spam, unsubscribe anytime.
          </motion.p>

          <motion.form
            variants={fadeUp}
            className="flex gap-2"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="you@example.com"
              className="h-11 min-w-0 flex-1 rounded-[var(--radius-control)] border border-border bg-surface px-4 text-sm text-foreground placeholder:text-foreground-muted/60 transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10"
              aria-label="Email address"
            />
            <Button type="submit">Subscribe</Button>
          </motion.form>
        </motion.div>
      </div>
    </section>
  );
}
