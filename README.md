# Label Reader

> Understand what's inside your packaged food. Label Reader decodes ingredient lists, nutrition facts, and marketing claims for Indian consumers.

---

## Project Purpose

Label Reader is a web application that helps Indian consumers understand food product labels. Users can search for products and view ingredients (including INS additive codes), nutrition facts, front-of-pack claims, and a persisted deterministic A–E nutrition profile. The score is Label Lore's own documented heuristic, not an official FSSAI rating or medical assessment. AI grade explanations are available when the optional OpenAI server configuration is set. Food-label OCR can extract editable unverified text and submit reviewed label values to the same deterministic grading method without creating a branded product.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (via `@theme` tokens) |
| Animation | Framer Motion 14 |
| Icons | Lucide React |
| ORM | Prisma 5.22 |
| Database | PostgreSQL (`app` + `food` schemas) |
| Validation | Zod |
| Runtime | Node.js |

---

## Prerequisites

- Node.js >= 20.9 for Next.js
- npm >= 9
- Docker Desktop with Docker Compose (for local PostgreSQL)

The one-time SQLite transfer script uses Node's built-in `node:sqlite` and requires Node.js >= 22.5.

A PostgreSQL database is required for the current Prisma schema. The previous local SQLite database is retained at `prisma/dev.db`; its data is not automatically transferred.

---

## Installation

```bash
git clone <repo-url>
cd label-reader
npm install
```

---

## Environment Setup

Copy the example for Docker Compose and the application. Prisma CLI reads `.env`; Next.js reads `.env.local` (and `.env`):

```bash
cp .env.example .env
cp .env.example .env.local
```

The example includes local-only PostgreSQL credentials. Change `POSTGRES_PASSWORD` and make its password match in `DATABASE_URL` in both env files. Keep `.env` and `.env.local` private.

## Local PostgreSQL Setup

Start PostgreSQL with persistent Docker volume storage:

```bash
docker compose up -d postgres
```

Apply the PostgreSQL baseline and transfer the preserved demo database before starting the app:

```bash
npx prisma generate
npx prisma migrate deploy
# If the legacy SQLite database and its backup are present:
npm run db:migrate:legacy
npx prisma migrate status
npm run dev
```

On a clean checkout without the local legacy SQLite file and backup, use `npx prisma db seed` instead of the transfer command to load the six sample products.

Check database readiness with `docker compose ps`. Use `docker compose down` to stop the container; the named volume remains. `docker compose down -v` deletes the local PostgreSQL data volume and should only be used when you intentionally want to remove this database.

---

The SQLite transfer script verifies the backup hash, reads `prisma/dev.db` read-only, preserves existing IDs and relationships, and uses non-overwriting upserts so it can be rerun. It maps old category text into `food.Category` and old ingredient INS codes into `food.Additive`. It requires Node 22.5+ for built-in `node:sqlite`. The original database and ignored backup remain unchanged. The current migration and transfer results are documented in `PROJECT_STATUS.md`.

---

## Development

```bash
npm run dev
```

Open http://localhost:3000

## Product search and recent history

On `/scan`, a submitted name, brand, or category query searches the local PostgreSQL catalog first and then a bounded page of Open Food Facts community catalog matches. Local products appear first; external matches are clearly marked and are imported only after the user presses Import. Imported products use the existing barcode ingestion, normalization, provenance, and grading pipeline. A submitted 8–14 digit barcode also uses the existing Open Food Facts lookup. Search is submit-driven rather than fired on every keystroke. The scan page also includes the independent food-label OCR review and analysis flow.

Opening a product adds it to Recent products in this browser. `/history`, the home-page recent-products section, and the footer history link use browser `localStorage`; no anonymous search history is written to the shared database. Repeated views move a product to the top, the list keeps at most 20 products, and Clear history removes the browser-local list. Recent cards load the same persisted current-method grade shown on product detail pages. Unscoped legacy `/api/scans` endpoints return `410 HISTORY_NOT_AVAILABLE` instead of disclosing shared anonymous history.

## Reliability status

The development command uses Next.js 16's documented `--webpack` option because the default Turbopack dev server hit a Windows junction-point error in this environment. A successful Open Food Facts refresh invalidates persisted product grades and their saved explanations transactionally; subsequent reads recalculate from the latest stored inputs. Prompt 11 adds hybrid catalogue discovery and product image display using the existing product image field. Current Prompt 11 checks: 61 automated tests, Prisma validation and migration status, TypeScript, ESLint, production build, and `git diff --check`; live Haldiram search/import, persistence, repeat lookup, local-first deduplication, and the Next route handler were verified. Browser click-through and remote image retrieval from the browser were blocked by this environment's localhost/socket restrictions. See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the verification record and limitations.

---

### Catalogue search and product images (Phase 11)

Product discovery combines the local catalogue with the Open Food Facts Search-a-licious endpoint (`POST /search`). Search is explicitly submitted, requests at most eight remote results per page and five pages, and caps calls at eight per minute per application process. Local results are shown first; barcode matches are deduplicated. External results remain unpersisted until a user chooses Import, which calls the existing barcode ingestion route. If Open Food Facts is unavailable or rate-limited, matching local products remain usable. Provider results are community-contributed and unverified.

Product images use the existing nullable `Product.imageUrl` field. Ingestion chooses an Open Food Facts front image, stores its source observation with the existing provenance record, and does not clear a saved image when a later response has no valid image. Image URLs are restricted to HTTPS `images.openfoodfacts.org` product paths; Next Image is configured for that host and disables redirects. Missing or failed images render a neutral fallback. Image attribution is displayed in product views. Open Food Facts product data is ODbL; images may have separate CC BY-SA licensing, so review provider terms before redistribution. A shared rate limiter is needed if the app runs in multiple instances.

No database migration was needed. `Product.imageUrl` existed already. Current verification used a live Haldiram search result (`8904063210029`), imported it through the existing ingestion pipeline, verified its persisted image URL/source and grade, and confirmed a repeated import returned the same product ID. Database count changed from 7 to 8 for the intentional import, and a subsequent hybrid search returned one local match for that barcode. Browser UI/image loading could not be verified because this environment denied localhost socket access.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR using Webpack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run ingestion, grading, OCR, OCR analysis, and browser-history data tests |
| `npm run db:migrate:legacy` | Safely transfer rows from the preserved SQLite database |
| `npx tsc --noEmit` | TypeScript type check |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma db seed` | Seed sample data |
| `npx prisma migrate deploy` | Apply migrations |
| `npx prisma studio` | Visual database browser |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string; Prisma manages `app` and `food` schemas |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public URL for metadata/OG tags |
| `NEXT_PUBLIC_APP_VERSION` | No | Version string (display only) |
| `OPENAI_API_KEY` | No | Optional server-only key for grade explanations |
| `OPENAI_MODEL` | No | OpenAI model ID for grade explanations |

---

## Project Structure

```
label-reader/
+-- prisma/
�   +-- schema.prisma       # PostgreSQL schema (`app` and `food`)
�   +-- migrations/         # Applied SQL migrations
�   +-- seed.ts             # Sample data seeder
�   +-- dev.db              # Preserved legacy SQLite database
+-- src/
    +-- app/                # Next.js App Router
    �   +-- api/products/   # Catalog search, barcode lookup, details, grade, explanation
    �   +-- api/ocr/        # OCR extraction, analysis, retrieval, explanation
    �   +-- api/scans/      # Retired shared-anonymous history endpoints (410)
    �   +-- history/        # Browser-local recent products
    �   +-- scan/           # Search/OCR page and /scan/[id] product detail
    �   +-- layout.tsx      # Root layout (Navbar + Footer)
    �   +-- page.tsx        # Home page (server component, real data)
    +-- components/
    �   +-- background/     # GradientBlobs background
    �   +-- hero/           # HeroSection + ScanDropzone (search)
    �   +-- layout/         # Navbar + Footer
    �   +-- sections/       # FeaturedScan, RecentScans, HowItWorks, CTABanner
    �   +-- ui/             # Button, Card, StatusPill primitives
    +-- config/site.ts      # Centralised site config
    +-- features/
    �   +-- analysis/       # Grading, explanations, OCR parser and analysis services
    �   +-- history/        # Browser-local recent product data
    �   +-- ingestion/      # Open Food Facts normalization and persistence
    �   +-- products/       # ProductService + Prisma types
    +-- lib/
    �   +-- animations.ts   # Framer Motion presets
    �   +-- env.ts          # Typed env var accessors
    �   +-- prisma.ts       # PrismaClient singleton
    �   +-- tokens.ts       # Design token JS re-exports
    �   +-- utils.ts        # cn() utility
    +-- types/index.ts      # Domain type definitions
```

## Seeded Sample Products

Six Indian food products from Nestle, Amul, Britannia, Haldirams, Paper Boat, and Organic Tattva with full ingredient, nutrition, and claim data.


## Data foundation update (2026-10-31)

The active Prisma schema now targets one PostgreSQL database with two namespaces: `food` contains canonical brands, products, identifiers, ingredients, nutrition, additives, categories, allergens, and source provenance; `app` contains users and user/anonymous-session search and scan history. The SQLite database and its original migration are preserved in `prisma/dev.db` and `prisma/legacy-sqlite-migrations/`. Existing SQLite rows have **not** been transferred or deleted.

The PostgreSQL baseline migration is `prisma/migrations/20261031090000_postgresql_foundation/migration.sql`; it creates the `app` and `food` schemas and their tables, but does not import SQLite data. The legacy transfer is handled separately by `npm run db:migrate:legacy` after the baseline is applied.

The repeatable seed inserts the six demonstration products only when absent. It no longer clears tables or creates synthetic scan-history entries.

### Open Food Facts barcode lookup

`GET /api/products/by-barcode/{barcode}` fetches one barcode using the current v3 product API, persists the normalized result, and returns the internal Prisma product shape. `GET /api/products/{id}` retrieves that saved record. The response never exposes the raw OFF response as the application contract. The client sends `OPEN_FOOD_FACTS_USER_AGENT` when configured (otherwise `LabelLore/0.3.0` plus the configured site URL), makes no search-as-you-type calls, caps reads at 15 per minute per running process, and reuses an imported record for 24 hours. A distributed deployment needs a shared rate limiter/cache to enforce the provider's per-IP limit across instances.

Each lookup preserves the source product response, source URL, external ID, retrieval timestamp, and source modification timestamp. Field observations retain source candidate values. Product facts remain `UNVERIFIED`; imported values only fill missing canonical facts, and repeated OFF imports update OFF-owned nutrition values. Missing nutrition, allergens, ingredients, brand, or category remain nullable/explicit. Additive tags are retained as source observations; this phase does not classify additives or make health claims. OFF data are community-contributed and may be incomplete or wrong. The application records source attribution and ODbL-1.0; product images may have separate CC BY-SA licensing. Review OFF reuse terms before publishing a database derived from its data.

OFF ingredients preserve source spelling/text and list order; normalized names only standardize Unicode form, casing, whitespace, and punctuation spacing. Repeated ingredient entries are retained in order, and missing lists do not create empty ingredient rows. Nutrition prefers the declared `100g`/`100ml` basis, stores energy in kcal, macros/fiber/salt in grams, and sodium in milligrams. Salt and sodium remain separate; invalid or missing values stay null. The nullable `food.Nutrition.salt` field was added by migration `20261031120000_add_salt_nutrition`.

### Deterministic A–E grading

`POST /api/products/{id}/grade` calculates a deterministic result and upserts it by product and methodology version. The current `label-lore-npm2004-adapted-v1` method adapts published UK FSA nutrient profiling points and maps them to a Label Lore score and A–E bands. It is a project heuristic, not an FSSAI rating or medical assessment. Grading requires a `100g` basis, energy, saturated fat, total sugars, and sodium or salt; a `100ml`-only record returns `INSUFFICIENT_DATA` until a valid density conversion is available. Ingredient and additive evidence is reported without scoring because the current reference rows do not contain a verified hazard classification. See [`docs/GRADING_METHODOLOGY.md`](docs/GRADING_METHODOLOGY.md) for exact thresholds, assumptions, and references.

`GET /api/products/{id}/grade` returns the result for the current methodology version, generating and persisting it when no current-version row exists. Product search results, the featured product, recent scan cards, and product detail pages use this API. The detail analysis shows the grade, score, persisted nutrient values and points, nutrition verification/completeness, and limitations. Missing required data produces “Insufficient Data” without a grade or score. Ingredient and additive identities remain separate from scoring; an INS code alone is not presented as a safety warning. See [`PROJECT_STATUS.md`](PROJECT_STATUS.md) for current verification results.

For regulatory work, use current FSSAI regulations and amendments as separately maintained evidence. FSSAI is not treated as a branded product catalog. GS1 India DataKart remains deferred pending commercial access and redistribution terms. USDA FoodData Central and ICMR-NIN IFCT remain supplementary nutrient references, not authoritative Indian packaged-label records.

The PostgreSQL baseline, legacy SQLite transfer, salt migration, and grading-result migration are applied and verified. Nutella (`3017620422003`) returns a persisted grade of D/35 under the documented heuristic; repeated calculation updates the single result row for that methodology version. Prisma reports migration status up to date. SQLite and its verified backup remain unchanged. Detailed normalization and verification results are in `PROJECT_STATUS.md`. Grade explanations and local OCR are implemented below.

## AI grade explanations (Phase 5, 2026-11-08)

Product detail pages now include an explicit, user-triggered grade explanation panel. `GET /api/products/{id}/explanation` returns an existing saved explanation, a deterministic insufficient-data explanation, or a not-configured/not-generated state; it never makes an OpenAI call. `POST` generates only when the product has a persisted `GRADED` result and both `OPENAI_API_KEY` and `OPENAI_MODEL` are configured. The server calls OpenAI's Responses API directly with strict structured output, `store: false`, a timeout, and explicit instruction/data separation. It supplies only the persisted grade, nutrition factors, completeness and product/ingredient verification context. It cannot calculate or update grades. Explanations are stored by product, methodology version and prompt version. No AI explanation was persisted locally because credentials were not configured; the real provider path is covered with mocked tests, not a live provider call.

To enable generation locally, add `OPENAI_API_KEY` and `OPENAI_MODEL` to the private server environment (`.env` and `.env.local`); never expose the key through a `NEXT_PUBLIC_` variable. Missing configuration is supported and the detail UI shows a setup message. Products and OCR analyses with insufficient grading data always receive deterministic explanation text without an AI call.

Verification for this update: the additive explanation migration `20261108120000_product_grade_explanations` is applied; Prisma status reports the database up to date. Docker reports `label-lore-postgres` healthy and Prisma connects. The explanation API has explicit GET/POST behavior and errors for missing products, rate limits, timeouts, provider errors and invalid output. Focused provider/service/contract tests use mocks; no live OpenAI request was performed.

## OCR label analysis (Phase 8, 2026-11-10)

After reviewing OCR text and correcting ingredients, nutrient values, and the `per 100 g` or `per 100 ml` basis, users can submit a label for analysis. `POST /api/ocr/analyses` strictly validates the reviewed fields on the server and recalculates with the existing `scoreProduct` engine. Missing values stay null; the scorer returns Insufficient Data for missing required nutrition or an unsupported 100 ml basis. Client-submitted grades and factors are rejected.

Results are stored in `food.FoodLabelAnalysis`, introduced by additive migration `20261110100000_ocr_food_label_analysis`. The row preserves source OCR text/draft, confirmed values, basis, unverified status, and deterministic result without a Product or barcode relationship. Repeating the same submission key and content returns the same row; changing content with that key returns 409. `GET /api/ocr/analyses/{id}` retrieves a saved result.

Valid OCR grades use the existing explanation service through `GET|POST /api/ocr/analyses/{id}/explanation`, which reads persisted analysis data and cannot change the grade. Insufficient-data explanations are deterministic. Missing `OPENAI_API_KEY` or `OPENAI_MODEL` does not block analysis and is reported by the explanation endpoint. No live OpenAI request was made.

Verification on 2026-11-10: Prisma reports the local database up to date. A temporary real PostgreSQL check created, retrieved, and repeated an OCR analysis (grade A), found one row for the submission key, and received `NOT_CONFIGURED` for explanation; the temporary row was removed. Feature tests cover correction, valid and insufficient results, rejected manipulated values, per-100ml handling, sodium/salt separation, and idempotent reuse. See `PROJECT_STATUS.md` for full check results.

## Food label OCR (Phase 6, 2026-11-08)

The scan page accepts JPEG, PNG, and WebP images up to 8 MB. The Node.js route checks type, size, non-empty content, and image signatures, then uses Tesseract.js locally through WebAssembly to read English text. Images stay in request memory and are not saved. Tesseract's English trained data downloads on first use and is cached under ignored `node_modules/.cache/label-lore-tesseract`, so first-time operation needs outbound access; recognition runs locally after that. OCR is not guaranteed accurate.

`POST /api/ocr` accepts multipart form data with the `image` field and returns preserved raw OCR text, best-effort ingredients and nutrition fields, source snippets, explicit nulls, and warnings. Energy is normalized to kcal, nutrient masses to g, sodium to mg, and a readable per-100g/per-100ml basis is recorded. Salt and sodium remain separate. The review UI lets users edit parsed values and labels changed values as user corrections. Uploading alone does not save a product or calculate a grade; users explicitly submit their reviewed values using the Phase 8 flow below.
