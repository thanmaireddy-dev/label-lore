/**
 * Environment variable access helper.
 *
 * Why this exists:
 *   1. It provides a single place to see all env vars the app depends on.
 *   2. It makes missing variables fail loudly at startup rather than silently
 *      at the callsite (which would cause confusing runtime bugs).
 *   3. It enforces the client/server boundary — NEXT_PUBLIC_ vars are safe to
 *      access anywhere; server-only vars must never be exposed to the browser.
 *
 * Add new variables here as they are introduced in later phases.
 * Never import server-only vars in Client Components (files with "use client").
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Check your .env.local file against .env.example`
    );
  }
  return value;
}

/**
 * Server-only environment variables.
 * Import this only in Route Handlers, Server Components, and server utilities.
 * These values are never sent to the browser.
 */
export const serverEnv = {
  /**
   * Phase 2: PostgreSQL connection string (Neon / Supabase URL).
   * Required once Prisma is introduced.
   */
  get databaseUrl() {
    return requireEnv("DATABASE_URL");
  },

  /** Optional server-side OpenAI configuration. Missing values disable explanations gracefully. */
  get openAiApiKey() {
    return process.env.OPENAI_API_KEY?.trim() || null;
  },

  get openAiModel() {
    return process.env.OPENAI_MODEL?.trim() || null;
  },
} as const;

/**
 * Public (client-safe) environment variables.
 * These are readable in both Server and Client Components.
 * All keys must begin with NEXT_PUBLIC_.
 */
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
