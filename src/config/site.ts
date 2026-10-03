/**
 * Site-level configuration constants.
 *
 * Centralising these prevents the same strings from being scattered across
 * layout.tsx, metadata exports, OG tags, and footer components.
 * Extend this as the product grows (add nav links, social URLs, etc.).
 */
export const siteConfig = {
  name:        "Label Reader",
  tagline:     "Know what you're eating",
  description:
    "Understand what's inside your packaged food. Label Reader decodes ingredient lists, nutrition facts, and marketing claims for Indian consumers.",
  url:         process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  locale:      "en_IN",
} as const;
