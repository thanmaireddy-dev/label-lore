# PROJECT_STATUS.md — Label Reader Handoff Report

> **Current update (2026-11-01):** The deterministic grading engine is implemented and persisted. It uses methodology `label-lore-npm2004-adapted-v1`; Nutella scores 35/D from complete per-100g required nutrients. Its result is version-upserted in PostgreSQL and repeat calculation keeps one row. See the grading methodology and verification section below.


_Last updated: 2026-10-31 | Phase: PostgreSQL and ingestion foundation in progress_

## Phase 2B update (2026-10-31)

- Docker Compose setup added in `docker-compose.yml` with PostgreSQL 16, environment-based credentials, a health check, and a named persistent volume. `.env.example` now includes matching local connection settings.
- Docker Desktop 29.9.2 and Compose 5.6.1 were verified; the CLI was run from Docker Desktop's install directory because it is not on this shell's PATH. The `label-lore-postgres` container is running and healthy, and PostgreSQL accepts connections at `localhost:5432`.
- `npx prisma migrate deploy` applied `20261031090000_postgresql_foundation`. Its SQL uses `CREATE SCHEMA IF NOT EXISTS` and creates tables, indexes, and foreign keys; it contains no drop/reset operations. The preflight catalog check found no existing tables or relations in `app` or `food`.
- The legacy SQLite database was inspected read-only: Brand 6, Product 6, Ingredient 9, ProductIngredient 15, Nutrition 6, Claim 4, ProductClaim 4, Scan 6. `PRAGMA foreign_key_check` returned no errors. Its applied migration is `20261003215840_init`.
- A byte-for-byte backup exists at `prisma/backups/dev-pre-postgresql-20261031.db` (SHA-256 `B7E9B8CE8A99C7EB5D48AB7249EA2D69E153F5BE4F299B4E9908901078D6CEB6`). The source `prisma/dev.db` remains untouched.
- Legacy `Product.category` text was mapped to `food.Category`/`Product.categoryId`, and SQLite `Ingredient.insCode` values were mapped to `food.Additive`/`Ingredient.additiveId`. The target permits nullable brands; all six legacy product brand IDs were preserved. No source barcodes, users, search history, source records, or provenance observations existed in SQLite.
- `npm run db:migrate:legacy` now performs the verified transfer with SQLite opened read-only, confirms its SHA-256 matches the ignored backup, and uses upserts that preserve existing target rows. It was run three times successfully. Counts match: Brand 6, Category 6 (mapped from legacy category text), Product 6, Ingredient 9, Additive 2 (mapped from INS 319 and 621), ProductIngredient 15, Nutrition 6, Claim 4, ProductClaim 4, Scan 6. Repeated runs left counts unchanged.
- PostgreSQL contains all 15 `food` model tables and all 3 `app` model tables, plus `app._prisma_migrations`. All legacy IDs were checked; imported relationship checks found zero orphans. PostgreSQL has 22 foreign-key constraints, all validated. SQLite `PRAGMA foreign_key_check` is clean.
- Legacy SQLite has no barcode identifiers, source records, field observations, source attribution, users, or search events. Those PostgreSQL tables remain empty for these imported rows. `Scan.source` was copied; legacy nutritional basis was not recorded, so imported nutrition uses `nutritionBasis = null` and remains `UNVERIFIED`. The original SQLite file and backup still have the same SHA-256.
- The live Open Food Facts endpoint returned Nutella for barcode `3017620422003`; the existing client and normalizer now handle the current string `status: "success"` envelope. The normalized result included name/brand, two ingredients, 539 kcal, 56.3 g sugar, 42.8 mg sodium, and `100g` basis; absent trans fat remained null and was listed in `missingFields`. Regression tests cover string success/failure statuses.
- Live barcode lookup and persistence are verified: Nutella was stored with one GTIN identifier, one Open Food Facts source record, 23 field observations, two ingredient rows, and nutrition. Repeated lookup returned the same product ID and did not add duplicates. The original six SQLite products remain intact. See the later barcode workflow update for endpoint and check results.

## Barcode lookup verification (2026-10-31)

- `GET /api/products/by-barcode/3017620422003` made a live Open Food Facts v3 lookup and persisted Nutella as internal product `cmvwfekaz0005bdcov9v3ufsl`. The response included two ingredients and the available nutrition facts; absent trans fat remains null and listed as missing.
- `GET /api/products/{id}` returned that persisted PostgreSQL product. Repeating the barcode GET returned the same ID. Before the live lookup, PostgreSQL had 6 products and no barcode/source records; afterward it had 7 products, 1 identifier, 1 source, 1 source record, 23 field observations, 17 product-ingredient rows, and 7 nutrition rows. Ingredient count stayed 9; the additional two product-ingredient relationships belong to Nutella.
- The source record preserves `open_food_facts`, the barcode as external ID, the OFF product URL, retrieval time `2026-10-31 13:17:33.915`, and source modification time `2026-10-28 13:47:08`. Read-only relationship checks found zero orphan identifiers, source records, observations, or product-ingredient rows.
- HTTP results: malformed barcode `123` returned 400; syntactically valid but absent barcode `0000000000000` returned 404; the live barcode and internal ID routes returned 200. Client tests cover incomplete nullable payloads, unavailable responses, upstream HTTP failures, and malformed JSON.
- No SQLite files were changed. The persisted category label is the source's `fr:Nuttela` category string; OFF category labels are source-provided and remain unverified.

## Ingredient and nutrition normalization (2026-10-31)

- Ingredient normalization uses OFF structured ingredients when present, otherwise splits the source ingredient text on top-level commas/semicolons. It preserves the source label text, order, repeated entries, and parenthetical qualifiers. Matching names normalize Unicode compatibility forms, case, whitespace, and common punctuation spacing; no ingredients are inferred. Missing/empty lists produce no ingredient rows and remain recorded as missing in source observations.
- Nutrition normalization prefers the basis declared by OFF (`100g` or `100ml`), with a fallback to the other standardized basis, then raw values. Energy is stored in kcal (kJ converted by 4.184); macros, salt, and fiber are stored in grams; sodium is stored in milligrams. Salt and sodium remain separate and are never inferred from each other. Invalid or unsupported values remain null. Raw OFF payload and basis are retained, and imported nutrition remains `UNVERIFIED`.
- Added nullable `food.Nutrition.salt` through additive migration `20261031120000_add_salt_nutrition`. Existing product and nutrition rows were preserved; no existing source record or observation was deleted. The migration is applied and Prisma status is up to date.
- Live OFF Nutella re-ingestion preserved product ID `cmvwfekaz0005bdcov9v3ufsl`, its single GTIN and source record, and its two ordered ingredients (`sugar`, `palm oil`). Nutrition now stores 539 kcal, 6.3 g protein, 57.5 g carbohydrate, 56.3 g sugar, 30.9 g fat, 10.6 g saturated fat, 0 g fiber, 0.107 g salt, and 42.8 mg sodium; unavailable trans fat remains null. Basis is `100g`; verification remains `UNVERIFIED`.
- The live repository persistence method was run twice with the same fetched OFF payload. Product count stayed 7, ingredient count 9, product-ingredient relationship count 17, and nutrition count 7. The GTIN/source record remained unique; observations increased from 23 to 24 because the new explicit `nutrition.salt` observation was added.
- Focused tests cover structured/text extraction, order, repeats, punctuation/case/whitespace normalization, per-100ml preference, kJ and sodium/salt unit conversions, invalid/null values, and repeated lookup cache behavior. Fourteen ingestion tests pass.

## Deterministic grading engine (2026-11-01)

- Methodology is documented in `docs/GRADING_METHODOLOGY.md`. Nutrient cutoffs are adapted from the UK FSA 2004/05 nutrient profiling model. Those published points are not FSSAI limits. Label Lore separately maps `round(clamp(100 - 2.5 × (adverse points - eligible positive points), 0, 100))` to A (80–100), B (60–79), C (40–59), D (20–39), and E (0–19); this mapping is a project heuristic, not an official rating.
- Required data are a `100g` basis, energy, saturated fat, total sugars, and sodium or salt. Missing, invalid, negative, non-finite, or unsupported-basis requirements yield `INSUFFICIENT_DATA` with no grade or score. Per-100ml values are not compared to per-100g thresholds without density. Salt is converted to sodium equivalent only if sodium is unavailable (400 mg sodium per gram salt); sodium is preferred if both are present. Optional missing or invalid fibre/protein earn no benefit. Protein points follow the NPM high-adverse-points gate; no FVNS percentage is estimated.
- Ingredient/additive evidence is shown separately with zero scoring effect. Existing INS 319 and INS 621 rows supply names/functions but no source or verification/hazard classification; an INS number alone does not imply harm. Unknown codes are also neutral.
- Added pure deterministic module `src/features/analysis/grading.ts`, PostgreSQL-backed `ProductGradingService`, and `POST /api/products/[id]/grade`. `ProductGradingResult` stores status, grade/score (nullable for insufficient data), methodology version, JSON factors/completeness, and calculation timestamp. Unique `[productId, methodologyVersion]` makes recalculation update the existing result. Migration `20261101100000_product_grading_results` adds the table.
- Nutella (`3017620422003`) receives **D, score 35**, status `GRADED`, version `label-lore-npm2004-adapted-v1`, and net NPM points 26. Breakdown: energy 2,255.176 kJ/100g = 6 adverse points; saturated fat 10.6 g = 10; total sugars 56.3 g = 10; sodium 42.8 mg = 0; fibre 0 g = 0 positive; protein 6.3 g is omitted because adverse points exceed 10 and FVNS percentage is unavailable. Trans fat remains null and is not scored. Nutrition is still `UNVERIFIED` and this uncertainty is persisted with the assessment.
- PostgreSQL persistence was executed twice for Nutella: the same grading row ID was returned both times and row count remained 1 for this product/methodology version. No product, nutrition, ingredient, or source provenance records were changed by grade persistence.
- Tests cover all five bands, each adverse factor and threshold edge, salt conversion/preference, fibre/protein rules, missing/null/invalid data, unsupported 100ml basis, different ingredient/additive lists, unknown additive neutrality, determinism, and Nutella. The combined suite has 23 passing tests. Prisma validation and migration status, TypeScript, lint, production build, and `git diff --check` are verified for this update.

---

## 1. Project Overview & Implementation Status

Label Reader is a Next.js web application that helps Indian consumers decode food product labels. It displays ingredient analysis, nutrition facts, and marketing claims for packaged Indian food products.

**Historical state at handoff:** Phase 2 used Prisma + SQLite and the UI displayed placeholder scores. The backend now has a deterministic grading engine and persisted results; UI score displays remain placeholders. OCR and AI explanations remain out of scope.

---

## 2. Folder Structure

```
prisma/
  schema.prisma          � 7-model SQLite/PG schema
  migrations/            � One applied migration (init)
  seed.ts                � Seeds 6 products with full data
  dev.db                 � Local SQLite file (gitignored)

src/
  app/
    page.tsx             � Home page (server component; fetches real DB data)
    layout.tsx           � Root layout: fonts, Navbar, Footer, metadata
    globals.css          � Tailwind v4 @theme token definitions + base styles
    api/
      products/route.ts          � GET /api/products
      products/[id]/route.ts     � GET /api/products/[id]
      products/search/route.ts   � GET /api/products/search?q=
      scans/route.ts             � GET|POST /api/scans
      scans/[id]/route.ts        � GET /api/scans/[id]
      scans/recent/route.ts      � GET /api/scans/recent
    scan/
      page.tsx                   � /scan: search-only page
      [id]/page.tsx              � /scan/[id]: full product analysis page

  components/
    background/gradient-blobs.tsx � Animated ink-teal blob background
    hero/
      hero-section.tsx            � Landing hero with H1, paragraph, dropzone
      scan-dropzone.tsx           � Search widget with debounced API calls + dropdown
    layout/
      navbar.tsx                  � Sticky blur-on-scroll nav, mobile slide-out menu
      footer.tsx                  � 4-column footer with link groups
    sections/
      featured-scan.tsx           � Featured product card with mock score
      recent-scans.tsx            � Horizontal scroll carousel of scan cards
      how-it-works.tsx            � Static 3-step explainer section
      cta-banner.tsx              � Mid-page primary CTA section
      newsletter.tsx              � Newsletter signup form (UI only, no backend)
    ui/
      button.tsx                  � Reusable Button with variant/size props
      card.tsx                    � Card + CardHeader + CardTitle + CardContent
      status-pill.tsx             � Semantic status badge (safe/caution/flag/unknown/primary)

  config/
    site.ts                       � Site name, tagline, description, URL constants

  features/
    products/
      product.service.ts          � getAllProducts, getProductById, searchProducts
      product.types.ts            � Prisma-derived ProductWithDetails, ProductSummary types
    scans/
      scan.service.ts             � getRecentScans, getScanById, getAllScans, createScan

  lib/
    animations.ts                 � Framer Motion variant presets (fadeUp, staggerContainer, etc.)
    env.ts                        � Typed env var accessors (serverEnv, publicEnv)
    prisma.ts                     � HMR-safe PrismaClient singleton
    tokens.ts                     � Design token JS constants (mirrors globals.css)
    utils.ts                      � cn() utility (clsx + tailwind-merge)

  types/
    index.ts                      � Domain types: FoodProduct, Ingredient, NutritionPer100g,
                                    MarketingClaim, AnalysisResult, Score (Phase 3 stubs)
```

---

## 3. Technology Stack & Rationale

| Technology | Version | Why |
|---|---|---|
| Next.js (App Router) | 16.3.5 | Server components for SSR data fetching; API routes for backend |
| TypeScript | 5.x | Type safety; Prisma types derived from schema |
| Tailwind CSS v4 | 4.x | `@theme inline` design tokens; no arbitrary values in components |
| Framer Motion | 14.x | Scroll-reveal animations, consistent easing via centralized presets |
| Prisma | 5.22 | Type-safe ORM; PostgreSQL with `app` and `food` schemas |
| Zod | 4.x | Request body validation in API route handlers |
| Lucide React | 1.51 | Consistent icon set |
| PostgreSQL | `app` + `food` | One database with separate app activity and food reference schemas |

---

## 4. Architecture & Data Flow

```
Browser ? Next.js Server Component (page.tsx)
           ? ProductService.getAllProducts() / ScanService.getRecentScans()
             ? Prisma ? SQLite (dev) / PostgreSQL (prod)
           ? Renders HTML with real data

Browser ? Client Component (ScanDropzone)
           ? fetch('/api/products/search?q=...')
             ? Route Handler ? ProductService.searchProducts()
               ? Prisma ? DB
           ? Renders dropdown

Browser ? /scan/[id]
           ? Server Component fetches ProductService.getProductById(id)
           ? Falls back: ScanService.getScanById(id) ? then product lookup
           ? Calls ScanService.createScan() fire-and-forget to record visit
           ? Renders full product analysis page
```

---

## 5. Database Schema

Models: **Brand ? Product ? ProductIngredient ? Ingredient**, **Product ? Nutrition** (1:1), **Product ? ProductClaim ? Claim**, **Product ? Scan**

Key design decisions:
- `ProductIngredient.order` preserves label ingredient list order
- `Ingredient.normalizedName` is unique (case-folded); raw label text stored in `ProductIngredient.rawName`
- `Ingredient.insCode` stores INS/E-number (e.g. "621" for MSG)
- `Scan.source` distinguishes manual vs future OCR scans
- `Scan.productId` is nullable (future: OCR scans before product is matched)
- Cascade deletes on all product-dependent tables

**One migration:** `20261003215840_init` � initial full schema.

**Seed data (6 products):**
- Maggi Masala Noodles (Nestl�) � MSG, palm oil
- Amul Dark Chocolate � high sugar
- Britannia Good Day Biscuits � TBHQ
- Haldiram's Aloo Bhujia � high fat/sodium
- Paper Boat Aam Panna � "No Preservatives", "100% Natural" claims
- Organic Tattva Brown Rice � "Certified Organic", "High Protein" claims

---

## 6. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/products` | List all products. `?limit=N` (default 50, max 100) |
| GET | `/api/products/[id]` | Single product with brand, ingredients, nutrition, claims |
| POST | `/api/products/[id]/grade` | Calculate and persist the current versioned deterministic grade |
| GET | `/api/products/search` | Search by name/brand/category. `?q=query` |
| GET | `/api/scans` | List all scans with product. `?limit=N` |
| POST | `/api/scans` | Create scan. Body: `{ productId, source?: "manual"|"ocr" }` |
| GET | `/api/scans/[id]` | Single scan with product + brand |
| GET | `/api/scans/recent` | 10 most-recent scans with product + brand |

**Response shape (all routes):**
- Success: `{ data: ... }` or `{ data: ..., count: N }`
- Error: `{ error: { message, code, details? } }`

---

## 7. Implemented Features

- **Home page** (server-rendered) with hero, featured product card, how-it-works steps, recent scans carousel, CTA banner, newsletter form (UI only)
- **Product search** � debounced text search in `ScanDropzone`, hitting `/api/products/search`, results shown in dropdown, click navigates to `/scan/[id]`
- **Product detail page** (`/scan/[id]`) � shows product info, mock label score + grade, nutrition facts grid, ingredient list with mock safety labels (INS code = flag, palm oil = caution), marketing claims as pills
- **Deterministic product grading** � pure `scoreProduct()` engine, persisted `ProductGradingResult`, and `POST /api/products/[id]/grade`; product pages still show their older mock score
- **Scan recording** � every visit to `/scan/[id]` fires `ScanService.createScan()` to record a scan event
- **Recent scans carousel** � horizontal scroll with snap, prev/next buttons, live scroll-state tracking
- **Featured scan section** � first product from DB, with mock score, nutrition strip, flag pills
- **Navbar** � sticky, blur-on-scroll, mobile slide-out menu, all links wired
- **Footer** � 4-column with product, resources, legal columns (most links marked coming soon)
- **Design token system** � all colors, shadows, radii, and spacing as CSS custom properties in `globals.css` with Tailwind v4 `@theme` mapping
- **Animations** � centralized Framer Motion presets; `prefers-reduced-motion` collapse

---

## 8. Partial, Broken, or Unimplemented Features

| Feature | Status | Notes |
|---|---|---|
| **Grading display** | Mock only | Core deterministic engine is implemented; replacing mock grades in the UI is deferred |
| **OCR upload** | UI placeholder | Dropzone renders but file input is `disabled`. Phase 4 |
| **Newsletter** | UI only | Form renders; no backend submit handler |
| **Dark mode toggle** | Not started | Sun/Moon icons removed (unused). Design tokens are light-only |
| **History page** (`/history`) | 404 | Nav link exists, page does not |
| **Insights page** (`/insights`) | 404 | Nav link exists, page does not |
| **Authentication** | Not started | User icon visible but non-functional (cursor-not-allowed) |
| **AI explanations** | Not started | Phase 5 |
| **Product comparison** | Not started | Phase 5+ |
| **Claim verification** | Partial | Claims displayed; no verification logic |
| **Ingredient descriptions** | Partial | `description` field in schema but seed data doesn't populate it |
| **`/api/products` � mode=insensitive** | SQLite limitation | `contains` is case-sensitive on SQLite; would be case-insensitive on PostgreSQL |

---

## 9. Verification Results

All checks run on 2026-10-26:

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ? 0 errors |
| `npx eslint src` | ? 0 errors, 0 warnings (after fixing 4 unused-import warnings) |
| `npx prisma generate` | ? Client generated successfully |
| DB in sync (`prisma db push --skip-generate`) | ? Schema matches database |
| `npm run build` | ? All 10 routes compiled, no errors |

---

## 10. Known Bugs, Technical Debt & Decisions

1. **Case-sensitive SQLite search** � `ProductService.searchProducts` uses `contains` which is case-insensitive on PostgreSQL but case-sensitive on SQLite. Upgrading to PostgreSQL for production resolves this; for SQLite dev, consider using `mode: 'insensitive'` which Prisma silently ignores on SQLite.

2. **Mock scoring UI** � The home and product detail displays still show the old placeholder score. The deterministic grading service and API now exist but have not been wired into those views.

3. **Fire-and-forget scan creation** � `/scan/[id]` calls `ScanService.createScan()` with `.catch(() => {})`. Failures are silently swallowed. Acceptable for Phase 2; Phase 3+ should log errors.

4. **No pagination UI** � API supports `limit` param but no "Load More" UI exists.

5. **`src/types/index.ts` vs feature types** � Two separate type layers exist: domain types (`types/index.ts`) and Prisma-derived types (`features/*/product.types.ts`, `scan.service.ts`). The domain types are Phase 3 stubs; components use the Prisma types.

6. **No tests** � No unit or integration tests exist. The project relies on TypeScript and manual verification.

7. **`LayoutProps<"/">` in layout.tsx** � Next.js 16 provides this type for App Router layouts; it's part of the new API, not a custom type.

8. **`next.config.ts` is minimal** � No image domains, no rewrites, no redirects configured yet.

---

## 11. Environment Variables

| Variable | Type | Description |
|---|---|---|
| `DATABASE_URL` | Server | SQLite or PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Public | Base URL for metadata |
| `NEXT_PUBLIC_APP_VERSION` | Public | Display version string |
| `OCR_API_KEY` | Server (Phase 4) | OCR provider key |
| `AI_API_KEY` | Server (Phase 5) | LLM provider key |

---

## 12. Running the Project Locally

```bash
# 1. Clone and install
git clone <repo-url>
cd label-reader
npm install

# 2. Environment
cp .env.example .env.local  # already correct for local dev

# 3. Database
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# 4. Start
npm run dev
# ? http://localhost:3000
```

---

## 13. Prioritized Roadmap for Next Phase

### Phase 3 � Deterministic Analysis Engine (Core grading complete; UI wiring deferred)

1. **Deterministic A–E engine** � Implemented with documented UK NPM-derived nutrient points and Label Lore grade mapping; additive hazard scoring is intentionally absent until verified references exist
2. **Nutrition benchmarking** � Implemented in `src/features/analysis/grading.ts`; 100ml-only records remain ungraded without density conversion
3. **Claim verification** � Cross-check front-of-pack claims against nutrition data (e.g., "High Protein" requires = 10g/100g protein)
4. **Persisted methodology results** � Implemented as versioned `food.ProductGradingResult` rows
5. **Replace mock scoring** in `page.tsx`, `featured-scan.tsx`, and `/scan/[id]/page.tsx` (not part of this task)

### Phase 4 � OCR Label Extraction

6. **Enable file upload** � Activate the disabled file input in `ScanDropzone`
7. **OCR API integration** � Send image to provider (Google Vision / Mistral OCR), parse response
8. **Ingredient parser** � Extract ingredient list from OCR text; match to known ingredients or create new ones

### Phase 5 � AI Explanation Layer

9. **LLM summary** � Send structured `AnalysisResult` (from Phase 3) to an LLM; generate plain-language explanation of score
10. **Grounded output** � AI explains WHY a product got its score; it does not produce the score

### Phase 6 � Product & UX

11. **History page** � List user scan history (currently a 404)
12. **Insights page** � Aggregate insights across scans
13. **Product comparison** � Side-by-side comparison of two products
14. **Better alternatives** � Suggest lower-risk alternatives in the same category
15. **Dark mode** � Design tokens already support overrides; just needs a second `:root[data-theme="dark"]` block

### Infrastructure

16. **PostgreSQL migration** � Resolves case-sensitive search; required for production
17. **Tests** � Add Vitest unit tests for the scoring engine and service layer
18. **Authentication** � Needed before user-specific scan history

## Current foundation update (2026-10-31)

**PostgreSQL foundation applied and legacy SQLite records transferred.** The active Prisma schema separates `app` and `food` in one PostgreSQL database. It includes canonical GTIN identifiers, categories, additives, allergens, source catalog/records, field observations, verification state, nullable nutrition, and application user/search/scan activity. Existing product and scan services/routes were adapted for those models.

Initial Open Food Facts barcode lookup is isolated in `src/features/ingestion/`: the v3 client, Zod response validation, normalizer, and ingestion/persistence service. `GET /api/products/by-barcode/{barcode}` returns internal product records. Imports retain source response and attribution, cache successful source records for 24 hours, preserve missing fields, and never set regulatory verification. Open Food Facts values remain community-sourced and unverified. Additive tags are stored as observations, without additive risk classifications.

The baseline migration `prisma/migrations/20261031090000_postgresql_foundation/migration.sql` was applied with `npx prisma migrate deploy`. `prisma/migrate-legacy-sqlite.mjs`, available as `npm run db:migrate:legacy`, transferred legacy rows without modifying SQLite. The script verifies the backup hash, reads SQLite in read-only mode, uses non-overwriting upserts, checks IDs/counts, and verifies imported relationships. It was run twice; counts remained stable. Legacy categories were mapped to `food.Category`, and INS codes 319 and 621 were mapped to `food.Additive`.

Counts reconcile with SQLite: Brand 6, Product 6, Ingredient 9, ProductIngredient 15, Nutrition 6, Claim 4, ProductClaim 4, Scan 6; PostgreSQL additionally has 6 mapped categories and 2 mapped additives. PostgreSQL has 22 validated foreign keys and zero imported relationship orphans. `npx prisma migrate status` reports up to date. The original SQLite source and backup still share SHA-256 `B7E9B8CE8A99C7EB5D48AB7249EA2D69E153F5BE4F299B4E9908901078D6CEB6`.

Checks recorded at this point include the additive salt migration, live OFF Nutella persistence twice, PostgreSQL record and relationship checks, Prisma validation/status, 14 ingestion tests, TypeScript, lint, production build, and `git diff --check`. Barcode persistence and internal API retrieval are verified. The current grading engine, migration, API test, and 23-test run are documented in the 2026-11-01 section above. Keep OCR and AI deferred.
