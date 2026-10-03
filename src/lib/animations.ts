/**
 * Shared Framer Motion animation variants.
 *
 * Centralising motion config here guarantees consistent easing/duration
 * across the entire app and makes a global prefers-reduced-motion override
 * a one-file change.
 *
 * Per design spec §12:
 *   - Card hover: 150–200ms ease-out
 *   - Status pill entrance: fade + scale 0.95→1, 200ms
 *   - Section scroll reveal: opacity 0→1, translateY 16→0, 400ms
 *   - Nav blur transition: 200ms
 */

import type { Variants, Transition } from "framer-motion";

/* ─── Shared easing ────────────────────────────────────────────────────── */

export const ease = {
  out: [0.25, 0.46, 0.45, 0.94] as const, // cubic-bezier
  inOut: [0.42, 0, 0.58, 1] as const,
};

/* ─── Transition presets ───────────────────────────────────────────────── */

export const transition = {
  fast: { duration: 0.15, ease: ease.out } satisfies Transition,
  normal: { duration: 0.2, ease: ease.out } satisfies Transition,
  slow: { duration: 0.4, ease: ease.out } satisfies Transition,
  spring: { type: "spring", stiffness: 260, damping: 20 } satisfies Transition,
};

/* ─── Variants ─────────────────────────────────────────────────────────── */

/** Section fade + slide-up on scroll-into-view. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transition.slow,
  },
};

/** Staggered children container — pair with fadeUp on children. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

/** Status pill entrance: fade + scale-in. */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transition.normal,
  },
};

/** Card hover lift: translateY(-2px) + shadow deepen (handled in CSS). */
export const cardHover = {
  rest: { y: 0, transition: transition.fast },
  hover: { y: -2, transition: transition.fast },
};

/* ─── Viewport defaults for whileInView ─────────────────────────────── */

export const viewportOnce = { once: true, margin: "-80px" } as const;
