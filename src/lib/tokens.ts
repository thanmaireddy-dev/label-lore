/**
 * Design token mirrors — JavaScript/TypeScript constants that reflect the
 * CSS custom properties defined in globals.css.
 *
 * Why these exist: CSS variables can only be read at runtime in the browser.
 * These constants allow design values to be referenced in:
 *   - TypeScript type definitions
 *   - Future Framer Motion transition objects (keyframe colors, spring configs)
 *   - Unit tests that assert on computed visual states
 *   - Server-side code that renders inline styles
 *
 * Source of truth: design implementation.md §15, §17
 * Keep these in sync with the :root block in globals.css.
 */

export const colors = {
  background:       "#FAFAF7",
  surface:          "#FFFFFF",
  foreground:       "#16181C",
  foregroundMuted:  "#6B6E76",
  border:           "#E9E8E3",
  borderSubtle:     "#F0EFE9",
  primary:          "#1B3A4B",
  primaryForeground:"#FFFFFF",
  safe:             "#1F8A5B",
  safeBg:           "#1F8A5B1F",
  caution:          "#B8791A",
  cautionBg:        "#B8791A1F",
  flag:             "#B4432E",
  flagBg:           "#B4432E1F",
  unknown:          "#8A8D94",
  unknownBg:        "#8A8D941F",
} as const;

export const radius = {
  card:    "16px",
  control: "10px",
  pill:    "999px",
} as const;

export const shadow = {
  card:     "0 1px 2px rgba(16,16,16,0.04), 0 8px 24px rgba(16,16,16,0.04)",
  elevated: "0 8px 30px rgba(16,16,16,0.12)",
} as const;

export const spacing = {
  navHeight:       "68px",
  sectionYDesktop: "112px",
  sectionYMobile:  "56px",
  cardGap:         "24px",
  cardPadding:     "24px",
} as const;

/**
 * Animation durations — shared baseline for transitions.
 * Per design spec §12: card hover 150–200ms, status pill 200ms, section reveal 400ms.
 */
export const duration = {
  fast:   150,  // card hover lift
  normal: 200,  // status pill entrance
  slow:   400,  // section scroll reveal
} as const;

export type SemanticColor = keyof typeof colors;
