# Label Reader

> Understand what's inside your packaged food. Label Reader decodes ingredient lists, nutrition facts, and marketing claims for Indian consumers.

---

## Project Purpose

Label Reader is a web application that helps Indian consumers understand food product labels. Users can search for products and view a breakdown of ingredients (including INS additive codes), nutrition facts, and front-of-pack marketing claims. The current implementation covers product and scan data management with a UI foundation; deterministic scoring, OCR, and AI explanations are planned for later phases.

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

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Open Food Facts client and normalizer tests |
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
| `OCR_API_KEY` | No (Phase 4) | OCR provider API key |
| `AI_API_KEY` | No (Phase 5) | LLM provider API key |

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
    �   +-- api/products/   # GET /api/products, /[id], /search
    �   +-- api/scans/      # GET|POST /api/scans, /[id], /recent
    �   +-- scan/           # Scan page and /scan/[id] result page
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
    �   +-- products/       # ProductService + Prisma types
    �   +-- scans/          # ScanService + Prisma types
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

For regulatory work, use current FSSAI regulations and amendments as separately maintained evidence. FSSAI is not treated as a branded product catalog. GS1 India DataKart remains deferred pending commercial access and redistribution terms. USDA FoodData Central and ICMR-NIN IFCT remain supplementary nutrient references, not authoritative Indian packaged-label records.

The baseline and SQLite transfer have been applied and verified in the configured local PostgreSQL database. The live Nutella barcode lookup (`3017620422003`) was persisted, returned the same ID on repeat lookup, and was retrievable by internal ID. Invalid and missing barcode responses were checked. Prisma reports migration status up to date. SQLite row counts reconcile with PostgreSQL; the original source and verified backup are unchanged. Detailed live lookup counts are in `PROJECT_STATUS.md`. OCR, scoring, and AI explanation remain out of scope.
