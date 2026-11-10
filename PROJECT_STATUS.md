# PROJECT_STATUS.md — Label Reader Handoff Report

> **Current update (2026-11-10):** Phase 10 reliability review is complete. Product data refresh now invalidates persisted derived grades and cascading explanations transactionally. All 53 automated tests, Prisma validation/status, TypeScript, ESLint, and production build pass. Live Open Food Facts Nutella retrieval, duplicate-safe repeated lookup, local name/brand/category search, persisted detail/grade, and healthy PostgreSQL were verified; browser UI testing and representative-image OCR upload were not performed in this environment.


_Last updated: 2026-11-10 | Phase: product discovery, local history, and connected OCR/product flows_

## Application reliability hardening (Phase 10, 2026-11-10)

- **Confirmed issue and fix:** the ingestion repository updated source-owned product data and provenance without invalidating existing `ProductGradingResult` rows. Grade reads could therefore return a previous result after a successful source refresh, and the corresponding saved AI explanation could appear current. The repository now deletes all derived grading rows for that product in the same PostgreSQL transaction as successful ingestion. `ProductGradeExplanation` rows cascade with their grade result; provenance and user-verified product facts are retained. A subsequent grade read recalculates from the persisted product.
- The invalidation path was exercised against PostgreSQL with a uniquely barcoded temporary product and temporary persisted grade/explanation. A second repository persistence call removed the stale grade and cascaded explanation; the temporary product and related data were then deleted.
- The Next.js 16 default Turbopack dev server previously failed with a Windows junction-point error in this environment. The `dev` script now uses the documented `next dev --webpack` option, matching the already verified production bundler. The browser still could not access localhost here, so this change is not presented as a successful browser test.
- **Barcode/database workflow:** direct Open Food Facts client request for `3017620422003` returned Nutella with a matching barcode. Two service lookups returned the same product. PostgreSQL counts remained at 7 products and one matching GTIN before and after both calls. Product detail resolved and the persisted grade was D/35 (`GRADED`). Explanation status was `NOT_CONFIGURED`, consistent with missing optional OpenAI configuration.
- **Local search:** database-backed product service queries by Nutella name, its current brand, and its current category each returned the same product. The underlying product detail and grade paths resolved. Recent-history persistence/clear behavior remains browser-local and is covered by parser/de-duplication/limit tests; browser UI clearing was not exercised.
- **OCR/security review:** existing multipart size/type/signature validation, strict server-side reviewed-data schema, server-side grading, and rejection of client-supplied calculated fields remain in place. OCR tests cover parsing, edits, nulls, validation, idempotent persistence behavior, and deterministic grading. A temporary PostgreSQL OCR analysis round trip returned Insufficient Data, stayed unverified, reused its ID on repeat, and returned deterministic explanation state; the test row was removed. This checkout contains no representative label image fixture; this pass did not claim a real-image upload or browser OCR flow. Prior Phase 6 synthetic-image smoke results are documented above. OCR results stay unverified and separate from branded products.
- **Explanation review:** existing tests cover saved explanation reuse, missing credentials, insufficient data, provider failure, timeout/rate limit, malformed responses, and grade immutability. No live OpenAI call was made because the optional key is not configured. Open Food Facts has an 8-second timeout and OpenAI requests have a 15-second timeout.
- **Configuration/database:** root `.env` and `.env.example` each contain PostgreSQL configuration with internally consistent URL credentials. `.env.local` has the same `DATABASE_URL` as `.env`; it does not duplicate Docker-only credential variables, which remain in root `.env` for Compose. Docker Compose reports `label-lore-postgres` healthy with port 5432 published; `pg_isready` accepts connections; Prisma connects to database `label_lore`, recognizes schemas `app` and `food`, and reports all five migrations up to date.
- **Checks:** 53 automated tests passed; `npx prisma validate`, `npx prisma migrate status`, `npx tsc --noEmit`, `npm run lint`, `npm run build` (`next build --webpack`), and `git diff --check` passed. No dependencies or tables were added. SQLite and its verified backup were not modified.
- **Browser limitation:** this environment could not reach the local app from the in-app browser or shell, as recorded in Phase 9. No browser click-through, localStorage UI-clear, or upload-through-page result is claimed. Before deployment, repeat those journeys in a browser with localhost access and evaluate OCR on representative packaging photos; configure OpenAI only if explanation generation is desired.

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

**Historical note:** Earlier handoff snapshots described placeholder score displays and OCR without grading. The grading engine and OCR-to-grading integration are now complete; see the 2026-11-08 and 2026-11-10 updates.

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
      page.tsx                   � /scan: product/brand/category catalog search, barcode lookup, and OCR analysis
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
           ? ProductService.getAllProducts()
             ? Prisma ? PostgreSQL (`food` + `app`)
           ? Renders HTML with real product data and browser-local recent history

Browser ? Client Component (ScanDropzone)
           ? Name/brand/category: GET /api/products/search?q=... (local catalog)
           ? Barcode submit: GET /api/products/by-barcode/[barcode] (Open Food Facts, then PostgreSQL)
           ? Renders matches/errors and opens persisted product detail

Browser ? /scan/[id]
           ? Server Component fetches ProductService.getProductById(id)
           ? Falls back: ScanService.getScanById(id) ? then product lookup
           ? Client tracker writes product visit to this browser's localStorage
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

**Current database:** PostgreSQL 16 with five applied Prisma migrations across `app` and `food`; the initial SQLite DB and backup remain preserved.

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
| GET / POST | `/api/products/[id]/grade` | Read/currently calculate or recalculate the persisted deterministic grade |
| GET | `/api/products/search` | Search by name/brand/category. `?q=query` |
| GET | `/api/products/by-barcode/[barcode]` | Open Food Facts lookup and product persistence |
| GET / POST | `/api/scans` | 410 `HISTORY_NOT_AVAILABLE`; anonymous history is browser-local |
| GET | `/api/scans/[id]` | 410 `HISTORY_NOT_AVAILABLE` |
| GET | `/api/scans/recent` | 410 `HISTORY_NOT_AVAILABLE` |
| POST | `/api/ocr` | Extract unverified text from a label image |
| POST | `/api/ocr/analyses` | Persist a validated standalone reviewed OCR analysis |
| GET | `/api/ocr/analyses/[id]` | Retrieve standalone OCR analysis |
| GET / POST | `/api/ocr/analyses/[id]/explanation` | Existing explanation service for persisted OCR analysis |
| GET / POST | `/api/products/[id]/explanation` | Load or generate explanation for the persisted product grade |

**Response shape (all routes):**
- Success: `{ data: ... }` or `{ data: ..., count: N }`
- Error: `{ error: { message, code, details? } }`

---

## 7. Implemented Features

- **Home page** (server-rendered) with hero, featured product card, how-it-works steps, browser-local recent products, CTA banner, newsletter form (UI only)
- **Product search** � local catalog name/brand/category suggestions plus submitted Open Food Facts barcode lookup; results navigate to `/scan/[id]`
- **Product detail page** (`/scan/[id]`) � shows product info, API-backed grade and factor breakdown, nutrition facts, neutral ingredient/additive evidence, and marketing claims
- **Deterministic product grading** � pure `scoreProduct()` engine, persisted `ProductGradingResult`, and `GET|POST /api/products/[id]/grade`; product views use the current-version persisted result
- **Recent products** � browser-local views with grade cards, reopen links, max 20, and clear action
- **Featured scan section** � first product from DB with persisted grade state and source nutrition strip
- **Navbar** � sticky, blur-on-scroll, mobile slide-out menu, all links wired
- **Footer** � 4-column with product, resources, legal columns (most links marked coming soon)
- **Design token system** � all colors, shadows, radii, and spacing as CSS custom properties in `globals.css` with Tailwind v4 `@theme` mapping
- **Animations** � centralized Framer Motion presets; `prefers-reduced-motion` collapse

---

## 8. Partial, Broken, or Unimplemented Features

| Feature | Status | Notes |
|---|---|---|
| **Grading display** | Implemented | Current-version persisted results across search, featured, recent, and detail views |
| **OCR upload and analysis** | Implemented | Local Tesseract.js, editable unverified review, server-side grading and standalone persistence |
| **Catalog and barcode search** | Implemented | Catalog search by product/brand/category; submitted barcodes use Open Food Facts |
| **Recent products** | Implemented | Browser `localStorage`, deduplicated, max 20, clear action; no cross-user DB history |
| **Newsletter** | UI only | Form renders; no backend submit handler |
| **Dark mode toggle** | Not started | Sun/Moon icons removed (unused). Design tokens are light-only |
| **History page** (`/history`) | Implemented | Browser-local recent products; clears without server history |
| **Insights page** (`/insights`) | 404 | Nav link exists, page does not |
| **Authentication** | Not started | User icon visible but non-functional (cursor-not-allowed) |
| **AI explanations** | Implemented; optional OpenAI config | Phase 5 |
| **Product comparison** | Not started | Phase 5+ |
| **Claim verification** | Partial | Claims displayed; no verification logic |
| **Ingredient descriptions** | Partial | `description` field in schema but seed data doesn't populate it |
| **Name matching** | Implemented | Active PostgreSQL search uses case-insensitive matching; legacy SQLite is not the active datasource |

---

## 9. Initial verification snapshot (2026-10-26; superseded by dated phase updates below)

All checks run on 2026-10-26:

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ? 0 errors |
| `npx eslint src` | ? 0 errors, 0 warnings (after fixing 4 unused-import warnings) |
| `npx prisma generate` | ? Client generated successfully |
| DB in sync (`prisma db push --skip-generate`) | ? Schema matches database |
| `npm run build` | ? All 10 routes compiled, no errors |

## Product grading UI integration (2026-11-01)

- Added `GET /api/products/[id]/grade`: it retrieves the exact current methodology version (`label-lore-npm2004-adapted-v1`) or calculates and persists it when absent. The current version uses the unique `(productId, methodologyVersion)` upsert; old-version results are not silently returned. Existing `POST` continues to recalculate.
- Added the shared `ProductGrade` component and Zod response contract. Search dropdown results, featured product, recent scans, and `/scan/[id]` all use actual API-backed results. Concurrent/in-flight and recent requests are briefly cached on the client to avoid duplicate calls.
- The analysis view renders grade and score, score bar, methodology version, persisted nutrient values/points/explanations, verification and completeness, uncertainties, and calculation time. `INSUFFICIENT_DATA` has no grade and no score. Missing and invalid required fields and unsupported basis are surfaced. API error/retry, loading, product-not-found, and page not-found states are present.
- Ingredient/additive evidence is separate from the nutrient score. INS codes are identity evidence only; mock “Safe”, “Caution”, and “Check” ingredient labels and heuristic feature pills were removed. Unavailable nutrient display values are no longer shown as zero.
- Live API verification: Nutella returned saved `GRADED`, D/35, and methodology `label-lore-npm2004-adapted-v1`. Amul Dark Chocolate had no saved result; its GET generated `INSUFFICIENT_DATA` with null grade/score, and the repeated GET returned the same `calculatedAt`. Two parallel first-time GETs for Britannia Good Day both returned the same `INSUFFICIENT_DATA` result and timestamp. A nonexistent product returned HTTP 404. The persisted table now contains three current-method rows, one `GRADED` and two `INSUFFICIENT_DATA`.
- Browser verification opened Nutella’s detail view and confirmed its grade/score, methodology disclaimer, nutrition facts, and neutral ingredient evidence. Frontend contract tests check all five grade bands, persisted nutrient factor presence, insufficient-data null grade/score, and malformed response rejection.
- Checks: `npm test` — 26 passed; `npx tsc --noEmit` — passed; `npm run lint` — passed; `npx prisma validate` — passed; `npx prisma migrate status` — database up to date; `git diff --check` — passed. The `build` script uses Next.js's supported `--webpack` mode because Turbopack panicked while launching its CSS worker; `npm run build` passes with this setting. No migration or other database schema change was made.

---

## 10. Current limitations and decisions (2026-11-10)

1. Anonymous recent products stay in the browser profile. They do not sync across devices or accounts and may be removed when browser storage is cleared.
2. The local catalog search is by product name, brand, or category. External lookup by name is not implemented; barcode lookup uses Open Food Facts.
3. English OCR is best effort; users must check extracted fields. Reviewed OCR data stays unverified, and current grading requires supported per-100g values.
4. AI explanation generation requires optional OpenAI configuration. No live OpenAI call was made in this verification.
5. The `/insights` route is still not implemented and is not linked in the main navbar. Search and product detail, browser-local history, and OCR are connected.
6. The database Scan and SearchEvent models remain for possible future scoped use, but this anonymous experience does not write to them. Unscoped scan-history APIs return 410 to avoid exposing shared events. Existing rows were not deleted.

---

## 11. Environment Variables

| Variable | Type | Description |
|---|---|---|
| `DATABASE_URL` | Server | SQLite or PostgreSQL connection string |
| `NEXT_PUBLIC_SITE_URL` | Public | Base URL for metadata |
| `NEXT_PUBLIC_APP_VERSION` | Public | Display version string |

| `OPENAI_API_KEY` | Optional server-only | OpenAI grade explanation key |
| `OPENAI_MODEL` | Optional server-only | OpenAI model ID |

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

### Phases 4 and 8 — OCR extraction and label analysis (implemented)

6. **Image upload** — JPEG, PNG, WebP; validates signatures and an 8 MB limit
7. **Local OCR** — Tesseract.js 7 on Node/WebAssembly with cached English data
8. **Editable parse and analysis** — review raw OCR text and values, then submit to the existing deterministic scorer; persist unverified analysis without creating a product

### Phase 5 � AI Explanation Layer

9. **LLM summary** � Send structured `AnalysisResult` (from Phase 3) to an LLM; generate plain-language explanation of score
10. **Grounded output** � AI explains WHY a product got its score; it does not produce the score

### Phase 6 � Product & UX

11. **History page** � Implemented at `/history` with browser-local recent products and a clear-history action
12. **Insights page** � Aggregate insights across products (deferred)
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

Historical verification snapshot before the OCR-to-grading phase: checks included the additive salt migration, live OFF Nutella persistence, PostgreSQL record and relationship checks, Prisma validation/status, 14 ingestion tests, TypeScript, lint, production build, and `git diff --check`. The current OCR-to-grading status and latest checks are in the Phase 8 update below.

## AI grade explanations (2026-11-08)

- Added versioned `food.ProductGradeExplanation` persistence, keyed by product, grading methodology and prompt version. Migration `20261108120000_product_grade_explanations` is applied; Prisma reports all four migrations up to date.
- Added `GET|POST /api/products/{id}/explanation` and a detail-page panel. GET reuses stored text or returns deterministic insufficient-data/configuration states; POST generates only for a persisted graded result when both OpenAI variables are configured. The UI identifies AI-generated text and provides loading, error and retry states.
- The direct Responses API client uses strict JSON output, `store: false`, a 15-second timeout, instruction-safe treatment of product and ingredient strings, and validation against numeric values, grade changes, and unsupported medical/toxicity/health claims. It supplies persisted factors and completeness/verification metadata; it does not modify grading.
- No OpenAI credentials are configured locally, so no live provider request or generated text was claimed. Mock tests cover successful generation, reuse/versioning, configuration absence, insufficient data, provider/rate/timeout/invalid responses and grade immutability. Local PostgreSQL container was verified healthy and Prisma migration status is up to date.
- Checks: Prisma generate/validate, 37 tests, TypeScript, ESLint, production build, migration status, Docker health and `git diff --check`.
- Remaining limitation: explanation generation requires a valid OpenAI API key and model configured in the server environment. Provider output remains constrained and validated but is still generated text.

## Food label OCR extraction (Phase 6, 2026-11-08)

- Selected Tesseract.js 7: local Node.js/WebAssembly OCR, with no paid OCR provider or separate service. English trained data is downloaded and cached on first engine use; that initial use needs outbound access.
- Added `POST /api/ocr` with multipart `image` field, Node runtime, 8 MB limit, JPEG/PNG/WebP MIME and signature checks, empty/invalid file errors, and no image persistence. OCR failures and no-text results return clear client errors.
- `src/features/analysis/food-label-parser.ts` preserves raw text and line breaks, parses an ingredient line and ordered items, and best-effort nutrition fields. Supported nutrients: energy, total/saturated/trans fat, carbohydrates, total sugars, fiber, protein, sodium, and salt. Energy converts kJ to kcal; mass units convert mg/g where relevant; sodium and salt stay separate. Decimal comma is accepted; `<` values, negative values, unsupported units, and missing fields stay null.
- The scan-page review shows read-only raw OCR text, editable ingredients and nutrient fields, source snippets, explicit basis, warnings and unverified status. Edits are marked “User corrected.” Submitting creates an OCR analysis, not a branded product.
- Actual OCR smoke check: Tesseract read an in-memory synthetic high-contrast label image and extracted its ingredient line, basis, energy, protein and sodium lines. This is not a representative camera/photo accuracy evaluation. Automated upload/parser tests mock the OCR worker and cover validation, no-text/errors, parser units, nulls, and salt-versus-sodium.
- Verification: 47 tests pass; TypeScript, ESLint, production build, and `git diff --check` pass.
- Limitations: English only; low-resolution, rotated, multilingual, curved/reflective packaging and complex nutrition tables may be inaccurate. Confirm all values manually. Submitted OCR data and results remain unverified.

## OCR-to-grading integration (Phase 8, 2026-11-10)

- Added `POST /api/ocr/analyses`, `GET /api/ocr/analyses/{id}`, and `GET|POST /api/ocr/analyses/{id}/explanation`. The submission accepts only OCR draft plus reviewed ingredient text, basis, and nutrient values; it rejects unknown client grade/score/factor fields and validates finite non-negative bounded numbers on the server.
- The service splits and normalizes reviewed ingredient names with the existing normalization helper, preserves source raw OCR and original extraction draft, computes correction flags against confirmed values, sets verification to `UNVERIFIED`, and calls the existing pure `scoreProduct` engine. Null values remain null. Per-100ml input is passed as 100ml and produces Insufficient Data under the current method, which requires 100g.
- Added the minimal standalone `food.FoodLabelAnalysis` model and additive migration `20261110100000_ocr_food_label_analysis`. It stores one row per idempotency key with a fingerprint, source/draft/confirmed JSON, basis/status, grade/score/method/version/factors/completeness/time, and explanation metadata. No Product foreign key, branded product, or barcode is fabricated. Same key + same contents returns the saved record; same key + changed contents returns 409.
- The OCR explanation repository implements the existing `GradeExplanationRepository`; `ProductGradeExplanationService` handles persisted state and provider generation. Explanation context is loaded from the persisted OCR row and its stored grade. Insufficient results get deterministic text. Missing API key/model gives the existing configuration state without preventing analysis.
- Real database verification: local PostgreSQL accepted a temporary valid submission and returned grade A; retrieval returned the same row; repeated submission reused its ID and left one row for that submission key. The explanation service returned `NOT_CONFIGURED` because no key is set. The test row was deleted. Prisma reports all five migrations up to date. Existing Nutella persistence, barcode normalization tests, and product explanation tests continue to pass.
- Automated verification: all 51 tests pass, including OCR service valid/insufficient/malicious-payload/idempotency cases and existing barcode grading tests. `npx prisma validate`, `npx prisma migrate status` (five migrations, up to date), `npx tsc --noEmit`, `npm run lint`, `npm run build`, and `git diff --check` pass. The first sandboxed build attempt could not reach configured Google Fonts; the production build passed with network access enabled.
- Limitations: OCR is English and best effort; users must review values. Current grading supports 100g basis only; 100ml without a valid density conversion is insufficient. No live OpenAI generation was tested because credentials are not configured.

## Product discovery and user-facing workflows (Phase 9, 2026-11-10)

- `/scan` and the home search now distinguish two supported paths: product/brand/category matching against the existing local catalog, and an explicit 8–14 digit barcode submission to the existing Open Food Facts persistence route. Name search is not represented as an Open Food Facts lookup. Empty, invalid, missing, incomplete-source, rate-limited, and upstream-failure states have clear user messages.
- Successful barcode lookup navigates to `/scan/{productId}`. Product detail links back to the search/scan flow and shows available external source links, product verification, nutrition basis/verification, ingredients, the persisted current-method grade and factors, methodology limitations, and the existing explanation state.
- Anonymous recent products use browser-local `localStorage` only. A viewed product is deduplicated and moved to the top; history is capped at 20; the user can clear it. The home page and `/history` use this same store, and `ProductGrade` reads the same persisted assessment API as detail/search cards. No anonymous search event is written to the shared database, avoiding cross-user exposure. Existing database Scan/SearchEvent models are not used for this browser history.
- Unscoped `/api/scans`, `/api/scans/recent`, and `/api/scans/{id}` APIs return 410 `HISTORY_NOT_AVAILABLE` to avoid disclosing anonymous events across users. Existing rows are retained; no database history records were deleted.
- Navbar/footer expose working Scan and Recent products links; the dead Insights nav item was removed. OCR upload/review/analyze remains on `/scan`, with analysis and explanations shown inline and a clear route back to product lookup.
- Verification: 53 tests pass; the new history tests cover malformed/empty storage, de-duplication, recency order, and list limit. TypeScript and lint pass. Prisma validation passes; migration status reports five migrations and the database up to date. Production build passes with `next build --webpack` when run outside the sandbox.
- Database-backed journey checks: catalog name search for Nutella resolved the existing product, product details included its Open Food Facts source record, the current persisted grade was D/35, and explanation state was `NOT_CONFIGURED`. A separate temporary 100ml OCR analysis persisted as `INSUFFICIENT_DATA`, reloaded with no grade, and returned a deterministic explanation; the row was removed afterward. Existing Nutella barcode/source/grade data were read-only.
- Main browser automation could not run in this environment: the in-app browser timed out reaching localhost and direct localhost access from the shell was denied/timed out. Next dev under default Turbopack also hit a Windows junction-point failure; `next dev --webpack` started but localhost remained inaccessible. No browser journey or live upload-through-UI is claimed as observed.
- Prisma schema was not changed for this phase. Search and viewing history are local, not server-persisted. A successful barcode lookup continues to use the existing live source/persistence code; OCR remains independent.
