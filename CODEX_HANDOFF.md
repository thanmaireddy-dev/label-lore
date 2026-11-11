# CODEX_HANDOFF.md — Instructions for the Next Coding Agent

> **Current update (2026-11-10):** Phase 10 reliability review is complete. Successful Open Food Facts refreshes now invalidate persisted product grades and their cascading saved explanations in the same transaction, preventing stale derived results. The dev script uses Next.js 16's Webpack option after the default Turbopack server hit a Windows junction-point error. All 53 automated tests, Prisma validation/status, TypeScript, ESLint, and webpack production build pass. Docker PostgreSQL is healthy; schemas `app` and `food` exist. Live OFF retrieval and repeated Nutella lookup passed with stable counts (7 products, one GTIN). Browser click-through and real-image upload were not performed because localhost browser access was unavailable and the repo has no representative image fixture. OpenAI is unconfigured; SQLite and its backup remain preserved.


## Read These First

1. **README.md** � Setup, environment variables, and all available scripts
2. **PROJECT_STATUS.md** � Full implementation state, architecture, API reference, known bugs, and roadmap

---

## Critical Rules

- **Inspect before editing.** Read the relevant source file before changing anything. The actual code may differ from this document.
- **Preserve the architecture.** Features are organised as service classes in `src/features/`. API routes delegate to these services. Do not collapse service methods into route handlers.
- **Use existing primitives.** UI components (Button, Card, StatusPill), design tokens (globals.css), and animation presets (lib/animations.ts) already exist. Use them.
- **Do not assume planned features are implemented.** Product history is browser-local in `/history`; authentication, Insights, and a newsletter backend remain out of scope.
- **Do not restart or rewrite.** The existing data layer, API routes, and UI are working. Build on them.

---

## Current Capabilities (Working)

- Product and scan data stored in PostgreSQL using `food` and `app` schemas
- REST API includes products, barcode ingestion, `POST /api/ocr`, OCR analysis/retrieval/explanation endpoints, and persisted grade/explanation endpoints; unscoped anonymous scan-history endpoints return 410
- Home page renders real data from DB (server component)
- Product detail page at `/scan/[id]` with nutrition, ingredients, claims
- Search widget on hero and `/scan` searches the local catalog by name/brand/category and submits barcode lookups to Open Food Facts
- Recent products on home and `/history` are stored in the current browser only
- Product displays use the persisted current-version grade, with insufficient-data/loading/error states

---

## Feature Status

| Feature | Status |
|---|---|
| Deterministic scoring engine and persisted UI integration | Implemented; see `docs/GRADING_METHODOLOGY.md` |
| Food-label OCR and grading | Implemented with local Tesseract.js, editable unverified drafts, standalone analysis persistence, existing deterministic scorer, and reused explanation service |
| AI grade explanations | Implemented; optional OpenAI config required for generation |
| /history page | Implemented with browser-local recent products and clear-history action |
| Insights | Not implemented; no navigation link is present |
| Authentication | Not started |
| Newsletter backend | Form is UI-only |
| Dark mode | Not started |

---

## Implemented Workflows and Follow-up Notes

### Grading engine and product experience (complete)

`src/features/analysis/grading.ts` is pure and deterministic. `ProductGradingService` persists one row per product and methodology version. `GET /api/products/[id]/grade` returns the current methodology row or creates it when absent; POST forces a current-version recalculation. Product cards and detail analysis consume this API and validate its response contract. Thresholds, grade mapping, assumptions, and references are in `docs/GRADING_METHODOLOGY.md`. No production product display uses fabricated grades.

### 2. Recent product history (complete)

- `src/app/history/page.tsx` reads browser-local product visits; no user history is exposed from the shared database.
- Product detail views update the bounded, deduplicated local list; clear action removes it.

### 3. Food-label OCR and analysis (Phases 6 and 8, implemented)

- `POST /api/ocr` and `FoodLabelUpload` are implemented.
- Tesseract.js runs locally in the Node.js route; English trained data downloads and caches on first use.
- Supports JPEG, PNG and WebP up to 8 MB. Reviewed values are sent to `POST /api/ocr/analyses`, server validated and passed to the existing `scoreProduct` engine.
- Results persist in `food.FoodLabelAnalysis` without a Product/barcode record. Same idempotency key and content reuses the analysis; changed content conflicts. `GET /api/ocr/analyses/{id}` retrieves it.
- Explanation endpoints reuse `ProductGradeExplanationService`; they load the persisted OCR analysis and do not change its grade. Missing OpenAI config does not block analysis.

### 4. AI grade explanations (Phase 5, implemented)

- Existing route: `GET|POST /api/products/[id]/explanation`; generation uses the persisted grade only.
- Send `AnalysisResult` to LLM; return natural-language summary
- Requires `OPENAI_API_KEY` and `OPENAI_MODEL` in the private server environment.

## Remaining product work

Insights route and authentication remain deferred. AI explanation generation requires optional provider credentials. Do not add ingredient hazard classifications from INS codes alone; the current additive references contain identity/function fields but no verified hazard status.

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

## Product discovery and local history (Phase 9, 2026-11-10)

- `/scan` debounces local catalog search by product name, brand, or category. Submitting 8–14 digits uses `/api/products/by-barcode/{barcode}` and navigates to the persisted product detail; names are not searched against Open Food Facts.
- `/history` and the home-page Recent products list use `localStorage`, deduplicate to the most recent 20 views, and provide Clear history. Product detail mounts `TrackProductView`; all cards request the same persisted grade API.
- Product detail shows available source URLs, product/nutrition verification, ingredients/nutrition, deterministic grade factors/method limits, explanation, and a return link to search/OCR.
- The unscoped `/api/scans` endpoints return 410 `HISTORY_NOT_AVAILABLE`; the anonymous history UI no longer reads or writes shared scan records. Existing DB rows were not deleted.
- Verification: 53 tests, TypeScript, ESLint, Prisma validate/migration status, and production build pass. Read-only PostgreSQL checks found Nutella in catalog search with Open Food Facts provenance and persisted D/35. Browser automation was unavailable because this environment could not reach localhost; do not claim a UI click-through was observed.

## Active architecture update — 2026-10-31

### Phase 2B follow-up status

`docker-compose.yml` and `.env.example` describe a local PostgreSQL 16 service with env credentials and persistent storage. Docker Desktop/Compose were verified; `label-lore-postgres` is running and healthy with port 5432 published. `npx prisma migrate deploy` applied the baseline; `npx prisma migrate status` reports up to date.

Read-only inspection found 6 brands, 6 products, 9 ingredients, 15 product-ingredient relationships, 6 nutrition rows, 4 claims, 4 product-claim relationships, and 6 scans; SQLite foreign-key check was clean. The backup `prisma/backups/dev-pre-postgresql-20261031.db` has the same SHA-256 as `prisma/dev.db` and is ignored by Git. The repeatable `npm run db:migrate:legacy` transfer reads SQLite only, preserves IDs, maps categories and INS codes, and uses non-overwriting upserts. It was run three times successfully with unchanged counts.

The live Open Food Facts endpoint returned Nutella for barcode `3017620422003`. The client supports both current string `status: "success"` and numeric success, accepts nullable optional fields, and maps missing usable product names to an incomplete-product error. The normalized product persisted to PostgreSQL with its GTIN, source payload, URL, retrieval/source timestamps, observations, two ingredient rows, and nutrition; missing trans fat remained explicitly null. Repeated lookup returned the same internal product ID without duplicate identifiers or records, and `/api/products/{id}` returned the saved record. Invalid barcode returned 400, absent product returned 404, and client tests cover incomplete, upstream HTTP, and malformed JSON responses. Exact counts and results are recorded in `PROJECT_STATUS.md`.

PostgreSQL has 15 `food` model tables and 3 `app` model tables plus migration metadata. The transfer verified all source IDs and reported zero broken legacy relationships. All 22 PostgreSQL foreign keys are validated. Legacy SQLite had no external source/provenance, barcode, user, or search records; these were not fabricated. `Scan.source` was retained and nutrition is unverified with unknown basis recorded as null.

The current Prisma provider is PostgreSQL with `multiSchema` enabled. `food` is the canonical reference-data domain; `app` is the usage/history domain. The earlier SQLite schema is archived under `prisma/legacy-sqlite-migrations/`; `prisma/dev.db` remains untouched. The baseline migration is applied and the SQLite transfer is separate. Do not run `migrate reset`.

OFF is the initial barcode integration. Keep its v3 response schema/client in `src/features/ingestion/`; normalize and validate before persistence. OFF imported fields and ingredient/allergen records stay unverified, source payload and observations retain provenance, and existing non-null canonical nutrition values are not replaced by a different source. The barcode route is `/api/products/by-barcode/[barcode]`; the internal detail route is `/api/products/[id]`. The provider read cap is per process and the successful source record cache is 24 hours; shared infrastructure is needed if deployment scales across instances.

For a new local setup, copy `.env.example` to `.env` and `.env.local`, set matching PostgreSQL credentials and URL, start Docker with `docker compose up -d postgres`, then run `npx prisma generate`, `npx prisma migrate deploy`, and `npm run db:migrate:legacy`. The legacy transfer script requires Node 22.5+ for built-in `node:sqlite`. `npx prisma migrate status` should report up to date. Run the idempotent seed only if additional sample data is needed.

Ingredient normalization preserves OFF source text, order, repeated entries, and parenthetical qualifiers. Nutrition stores energy in kcal, macros/fiber/salt in grams, and sodium in milligrams; salt is a separate nullable `food.Nutrition.salt` field added by `20261031120000_add_salt_nutrition`. The live Nutella response verified 0.107 g salt and 42.8 mg sodium at a 100g basis, with unavailable trans fat null and verification still `UNVERIFIED`. Re-running repository persistence twice reused the same Nutella product/identifier/source record and left 7 products, 9 ingredients, 17 product-ingredient links, and 7 nutrition rows. Source provenance remains intact; the new salt field observation raised that record's observations from 23 to 24.

The current grading method is `label-lore-npm2004-adapted-v1`, documented in `docs/GRADING_METHODOLOGY.md`. It requires complete `100g` energy, saturated fat, total sugars, and sodium or salt data. Nutella persists as D/35 with transparent nutrient factors; two calculations update the same `(productId, methodologyVersion)` row. `POST /api/products/[id]/grade` exposes that calculation. Ingredient/additive references do not alter points because their hazard status is unverified; 100ml-only products remain ungraded without a density conversion. The method is a project heuristic and is not an FSSAI rating.

The grading core, product grading UI, AI explanation flow, and OCR-to-grading are implemented. GS1 DataKart integration remains deferred.

## Product grading UI integration (2026-11-01)

The grade API now supports GET as a current-method read-or-generate operation. It queries the unique `(productId, methodologyVersion)` row for `label-lore-npm2004-adapted-v1`, returns it unchanged when present, and computes/upserts only when that version is absent. Concurrent generation uses the existing Prisma unique key/upsert. Older methodology rows are not returned as current results. POST remains the explicit recalculation operation.

`src/components/analysis/product-grade.tsx` validates API responses with the shared Zod contract, deduplicates simultaneous requests and caches successful/in-flight responses briefly. It renders grade/score, persisted factor values and points, completeness, verification, uncertainty, method version, and calculation time. Insufficient results never display a grade or score. The panel has loading, error/retry, and not-found states. Compact product search, featured, and recent scan results use the same grade component. Ingredient/additive display is neutral identity evidence; no INS-based warning is generated.

Verification on 2026-11-01: production API GET returned Nutella D/35 with the current methodology; missing grades generated and repeat GET reused the same calculation timestamp; two parallel first-time GETs both received the same result/timestamp; a nonexistent product returned 404. PostgreSQL currently has three current-version grading rows (one `GRADED`, two `INSUFFICIENT_DATA`). The Nutella detail page was inspected in the browser. 26 tests pass, including three API-response contract tests. TypeScript, lint, Prisma validation, and `git diff --check` pass. `npx prisma migrate status` reports up to date. The `build` script uses Next.js's supported `--webpack` mode because Turbopack panicked while launching its CSS worker; `npm run build` succeeds with this setting.

## AI grade explanation implementation (2026-11-08)

Phase 5 is implemented in `src/features/analysis/` and `src/app/api/products/[id]/explanation/route.ts`. The private OpenAI Responses API client uses `OPENAI_API_KEY` and `OPENAI_MODEL` via typed server environment config, strict structured output, non-stored provider requests, a timeout, and output validation. It passes persisted grade factors and data completeness/verification; grade calculation remains deterministic and separate. `food.ProductGradeExplanation` stores one explanation per product + methodology version + prompt version. The additive migration is `20261108120000_product_grade_explanations`.

`GET` returns saved text or a no-call status/fallback; `POST` is the explicit generation action. Products with `INSUFFICIENT_DATA` always get deterministic text and no provider call. The detail panel labels AI text, shows configuration/loading/error states and supports retry. Set both OpenAI variables in the private environment to enable generation. The current local environment has no configured key/model, so the live OpenAI service was not called. Provider behavior is mocked in tests. Local PostgreSQL is healthy; migration status reports four migrations and up to date.

Checks completed: Prisma client generate and schema validate; all 37 feature tests; TypeScript; ESLint; production build; migration status; Docker container health; `git diff --check`. Do not claim live model verification until a configured provider call is deliberately made.


## Food label OCR extraction (Phase 6, 2026-11-08)

`POST /api/ocr` accepts multipart field `image` and validates JPEG/PNG/WebP signatures and an 8 MB maximum. It uses Tesseract.js 7 in Node with the English model, returns raw text and a best-effort editable parse, and does not save uploaded image bytes. English trained data downloads/caches at first use; README documents this first-run network requirement. The parser keeps absent/invalid values null and distinguishes sodium from salt. All output is explicitly unverified; no product persistence or grading integration is included.

The upload/review UI is `src/components/hero/food-label-upload.tsx`, embedded in `src/components/hero/scan-dropzone.tsx`. Raw text is read-only; parsed ingredient/nutrition values can be corrected and edits are marked in the UI. Corrections remain client-side for this phase.

Verification: 47 tests pass; TypeScript, ESLint, production build, and `git diff --check` pass. The local Tesseract worker successfully read an in-memory synthetic high-contrast nutrition label (not a representative camera image).

## Catalogue discovery and images (Phase 11, 2026-11-11)

Search endpoint and flow: `POST /api/products/search` accepts a submitted query and page. `src/features/products/product-discovery.service.ts` returns up to ten local records first and bounded Search-a-licious results second; barcode duplicates are removed. The client sends no requests while the user types. Remote import remains explicit and calls `/api/products/by-barcode/{barcode}` so normalization, persistence, provenance, grading and explanation stay on the existing pipeline. If remote search is unavailable/rate-limited, local results still render. Current external result details are community contributed and unverified.

`src/features/ingestion/open-food-facts-search.client.ts` POSTs to Search-a-licious with a bounded field list, custom User-Agent, 7-second timeout, eight results per request and a per-process budget of eight requests per minute. Search-a-licious reports `count`/`page_count`; parser supports those and `total`. The provider's search limit is per IP, so a horizontally scaled app needs a shared limiter. Official docs: [Open Food Facts API](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/) and [Search-a-licious API](https://openfoodfacts.github.io/search-a-licious/users/ref-openapi/).

Images reuse `Product.imageUrl` and existing source observations; no migration. `src/features/ingestion/open-food-facts-image.ts` allows only HTTPS `images.openfoodfacts.org` product-image paths and prioritizes the front image. `next.config.ts` limits remote images to that host/path and sets `maximumRedirects: 0` (per Next.js 16 docs). Missing/failed image renders the fallback `ProductImage`. Attribution is shown in featured, recent, search and product detail UI. OFF image licensing may be CC BY-SA separately from ODbL database content; check the [image schema](https://openfoodfacts.github.io/documentation/docs/Product-Opener/schemas/schemas/product_images/) and [image download guide](https://openfoodfacts.github.io/openfoodfacts-server/api/how-to-download-images/) before redistribution.

Live integration check: queried Haldiram through Search-a-licious and imported `8904063210029` (Haldiram Rasgulla) into PostgreSQL; image URL and source record persisted; the persisted result graded B/70. Repeating the barcode import reused the same ID, product count changed 7→8 once, and a follow-up search returned the single local barcode match. The actual Next route handler was also executed in-process with live provider/database dependencies. Existing product and SQLite source/backup were preserved.

Final Prompt 11 checks: all 61 tests pass; `npx tsc --noEmit`, Prisma validate, five-migration Prisma status (up to date), `npm run lint`, `npm run build`, and `git diff --check` pass. Browser click-through is not verified: the browser timed out at localhost and direct shell access was denied by socket permissions. The live route was verified in-process; no claim of browser behavior or remote browser image rendering should be made.
