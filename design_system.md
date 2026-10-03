# Label Reader — Design System Reference

This is a condensed quick-reference for the Label Reader design system. The full detailed specification is in `design implementation.md`. The actual tokens are implemented in `src/app/globals.css` and `src/lib/tokens.ts`.

## 1. Core Principles
- **Aesthetic:** Editorial-scientific, not generic SaaS.
- **Tone:** Calm authority. No fearmongering, no alarmist reds. Show the data, don't decorate around it.
- **Hierarchy:** Restrained color use. Semantic colors (Safe/Caution/Flag) carry the most weight. One primary accent color.

## 2. Color Palette
| Role | Token | Value | Purpose |
|------|-------|-------|---------|
| Background | `--color-background` | `#FAFAF7` | Warm off-white, editorial "paper" feel |
| Surface | `--color-surface` | `#FFFFFF` | Card backgrounds |
| Foreground | `--color-foreground` | `#16181C` | Near-black text |
| Muted Text | `--color-foreground-muted` | `#6B6E76` | Secondary copy, metadata |
| Border | `--color-border` | `#E9E8E3` | Hairline borders (carries structural weight) |
| Primary | `--color-primary` | `#1B3A4B` | Deep ink-teal (clarity, trust). Interactive elements. |
| Safe | `--color-safe` | `#1F8A5B` | Clean / no flags (Green) |
| Caution | `--color-caution` | `#B8791A` | Moderate concern e.g., sodium, sugar (Amber) |
| Flag | `--color-flag` | `#B4432E` | Allergen/concern. Terracotta, not neon red. |
| Unknown | `--color-unknown` | `#8A8D94` | Insufficient data (Gray) |

*Note: Status pills use a 12% opacity background of the semantic color with full-strength text.*

## 3. Typography
- **Primary Font:** Inter (Sans-serif). Used for all UI, headings, and body copy.
- **Accent Font:** Fraunces (Italic Serif). Used **exclusively** for 1–3 word emphasis fragments inside section headlines. (Never in H1, never in body copy).
- **Scale:**
  - H1: `clamp(2rem, 5vw + 1rem, 4.5rem)`, weight 560, tracking `-0.02em`, leading `1.08`.
  - H2: 32–40px, leading 1.15.
  - Body: 16–18px, weight 400.

## 4. Components & Layout
- **Cards:** Composable primitive. 16–20px radius, 1px border, soft dual-layer shadow (`0 1px 2px rgba(16,16,16,0.04), 0 8px 24px rgba(16,16,16,0.04)`).
- **Buttons:**
  - Primary: Solid ink-teal, white text. Active state scales down `0.98`.
  - Secondary: Transparent, 1px border, dark text.
  - Radius: 8–10px (`--radius-control`).
- **Layout:** Single-column narrative. Max width 1200–1280px. Generous vertical spacing (`--space-section-y-desktop: 112px`).

## 5. Motion
- **Philosophy:** Calm, subtle. Respects `prefers-reduced-motion`.
- **Durations:** Fast (150ms) for hovers, Normal (200ms) for state changes, Slow (400ms) for scroll reveals.
- **Common patterns:**
  - Card hover: `translateY(-2px)` + deeper shadow.
  - Scroll reveal: Fade + slight slide up (`translateY(16px)` to `0`).
