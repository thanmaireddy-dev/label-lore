# CODEX_HANDOFF.md — Instructions for the Next Coding Agent

> **Current update (2026-10-31):** This note supersedes the legacy SQLite/PostgreSQL-prod setup and “score engine next” directions below. The Prisma schema now targets PostgreSQL with `app` and `food` schemas, and `GET /api/products/by-barcode/[barcode]` integrates OFF. The PostgreSQL migration was generated but not applied because no PostgreSQL URL is configured. SQLite file and original migration remain preserved; rows have not been transferred. Read the “Active architecture update” at the end before acting on the historical status below.


## Read These First

1. **README.md** � Setup, environment variables, and all available scripts
2. **PROJECT_STATUS.md** � Full implementation state, architecture, API reference, known bugs, and roadmap

---

## Critical Rules

- **Inspect before editing.** Read the relevant source file before changing anything. The actual code may differ from this document.
- **Preserve the architecture.** Features are organised as service classes in `src/features/`. API routes delegate to these services. Do not collapse service methods into route handlers.
- **Use existing primitives.** UI components (Button, Card, StatusPill), design tokens (globals.css), and animation presets (lib/animations.ts) already exist. Use them.
- **Do not assume planned features are implemented.** Scoring, OCR, AI, history, and insights are explicitly listed as NOT implemented.
- **Do not restart or rewrite.** The existing data layer, API routes, and UI are working. Build on them.

---

## Current Capabilities (Working)

- Product and scan data stored in SQLite via Prisma
- REST API: products list, product by ID, product search, scans list, scan by ID, recent scans, create scan
- Home page renders real data from DB (server component)
- Product detail page at `/scan/[id]` with nutrition, ingredients, claims
- Search widget (debounced, live dropdown) in hero and /scan page
- Recent scans horizontal carousel on home page
- Mock grade/score on all product displays (TEMPORARY � replace in Phase 3)

---

## What Is NOT Implemented

| Feature | Status |
|---|---|
| Deterministic scoring engine | NOT started |
| OCR image upload | UI placeholder only (input is disabled) |
| AI/LLM explanations | NOT started |
| /history page | Route exists in nav but no page file |
| /insights page | Route exists in nav but no page file |
| Authentication | Not started |
| Newsletter backend | Form is UI-only |
| Dark mode | Not started |

---

## Recommended Next Steps (Prioritized)

### 1. Build the deterministic scoring engine (Phase 3) � HIGHEST PRIORITY

This is the core product value and unblocks all subsequent phases.

**Files to create:**
- `src/features/analysis/ingredient-rules.ts` � Known INS codes with safety classification
- `src/features/analysis/nutrition-rules.ts` � Per-100g thresholds (FSSAI/WHO)
- `src/features/analysis/scoring.ts` � `scoreProduct(product: ProductWithDetails): AnalysisResult`

**Files to update:**
- `src/types/index.ts` � Fill in `NutritionAnalysis`, `IngredientAnalysis`, `ClaimAnalysis` (currently stubs)
- `src/app/scan/[id]/page.tsx` � Replace mock score with `scoreProduct()` output
- `src/app/page.tsx` � Replace mock score mapping with `scoreProduct()` output
- `src/components/sections/featured-scan.tsx` � Same

**Dependencies:** None � uses only the existing Prisma data and domain types.

### 2. Create the /history page (Phase 3)

- File: `src/app/history/page.tsx`
- Fetch `ScanService.getAllScans()` (already implemented)
- Display scans in a list/grid with product name, brand, grade, timestamp

### 3. Enable OCR upload (Phase 4)

- Remove `disabled` from the file input in `src/components/hero/scan-dropzone.tsx`
- Create `src/app/api/ocr/route.ts` � POST handler that accepts image, calls OCR provider, returns parsed ingredient text
- Create `src/features/analysis/ingredient-parser.ts` � Parse OCR text into ingredient list
- Requires: `OCR_API_KEY` environment variable

### 4. Add AI explanations (Phase 5)

- After Phase 3 scoring engine exists, add a POST route at `/api/analysis/explain`
- Send `AnalysisResult` to LLM; return natural-language summary
- Requires: `AI_API_KEY` environment variable

### 5. Migrate to PostgreSQL for production

- Change `DATABASE_URL` to a Neon/Supabase PostgreSQL URL
- Run `npx prisma migrate deploy`
- This also fixes case-insensitive search (currently broken on SQLite)

---

## First Feature to Implement Next

**Deterministic ingredient scoring** in `src/features/analysis/scoring.ts`.

**Minimal viable implementation:**
1. Create an INS code danger list (e.g. 102 Tartrazine, 110 Sunset Yellow, 319/320 TBHQ/BHA, 621 MSG, 951 Aspartame)
2. For each product ingredient: look up INS code ? assign "safe" | "caution" | "flag"
3. Compute score: start at 100, deduct points per flag (e.g. -20 for "flag", -10 for "caution")
4. Apply nutrition deductions: sugar > 10g (-10), sodium > 600mg (-10), saturated fat > 5g (-10)
5. Map final score to grade: >=80=A, >=60=B, >=40=C, <40=D
6. Return a typed `AnalysisResult` object
7. Wire into `/scan/[id]/page.tsx`, replacing the mock

**No new dependencies needed.** Uses existing Prisma types and domain types from `src/types/index.ts`.

---

## Verification Commands

Run these before and after any change to confirm nothing is broken:

```bash
npx tsc --noEmit          # TypeScript � must exit 0
npx eslint src            # ESLint � must be 0 errors (warnings OK)
npm run build             # Production build � must succeed
```

---

## Git State at Handoff

Branch `main` has diverged from origin (1 local commit, 1 remote commit); a merge conflict in README.md was resolved. The merge is staged but not committed. **Commit before continuing:**

```bash
git commit -m "docs: finalize Phase 2 handoff documentation"
```

## Active architecture update — 2026-10-31

### Phase 2B follow-up status

`docker-compose.yml` and `.env.example` now describe a simple local PostgreSQL 16 service with credentials supplied through env vars and a persistent named volume. The runtime environment did not have Docker/Compose or PostgreSQL tools/server, so PostgreSQL could not be started and migrations were not applied.

Read-only inspection of `prisma/dev.db` found 6 brands, 6 products, 9 ingredients, 15 product-ingredient relationships, 6 nutrition rows, 4 claims, 4 product-claim relationships, and 6 scans; the SQLite foreign-key check was clean. A byte-for-byte backup is at `prisma/backups/dev-pre-postgresql-20261031.db` (SHA-256 `B7E9B8CE8A99C7EB5D48AB7249EA2D69E153F5BE4F299B4E9908901078D6CEB6`). This backup is ignored by Git. Original SQLite remains untouched. A transfer is required; inspect the mapping documented in `PROJECT_STATUS.md` before writing/running it.

The live Open Food Facts endpoint returned Nutella for barcode `3017620422003`. Testing the actual client and normalizer exposed a current API envelope change (`status: "success"` rather than numeric `1`); the validator/client now accept both forms and tests cover string success/failure. The normalized response included name, brand, ingredients and nutrition; missing trans fat remained explicitly null. Database persistence and internal retrieval remain unverified.

The repo's app remains configured locally with a SQLite `DATABASE_URL`; configure `.env` and `.env.local` from the updated `.env.example` before trying the Compose database. Do not claim Phase 2B complete until Compose, Prisma migration/connection, SQLite transfer, and repeat barcode lookup persistence have actually been verified.

The current Prisma provider is PostgreSQL with `multiSchema` enabled. `food` is the canonical reference-data domain; `app` is the usage/history domain. The earlier SQLite schema is archived under `prisma/legacy-sqlite-migrations/`, and its `prisma/dev.db` file remains untouched. The new PostgreSQL baseline migration has been generated, not applied. Do not run `migrate reset` or treat the baseline as an SQLite data transfer.

OFF is the initial barcode integration. Keep its v3 response schema/client in `src/features/ingestion/`; normalize and validate before persistence. OFF imported fields and ingredient/allergen records stay unverified, source payload and observations retain provenance, and existing non-null canonical nutrition values are not replaced by a different source. The barcode route is `/api/products/by-barcode/[barcode]`. The provider read cap is per process and the successful source record cache is 24 hours; shared infrastructure is needed if deployment scales across instances.

Database setup now needs PostgreSQL: configure `DATABASE_URL` from `.env.example`, then run `npx prisma migrate deploy` and `npx prisma db seed`. The seed script is idempotent and does not delete records. Existing SQLite rows require a separately reviewed backup-and-transfer step; no PostgreSQL connection was configured during this foundation work.

Keep OCR, deterministic grading, AI explanations, and GS1 DataKart integration deferred. Before the next implementation step, provision PostgreSQL and plan the legacy SQLite data transfer so the six existing demonstration products remain available.
