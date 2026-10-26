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
| Database | SQLite (dev) / PostgreSQL (production) |
| Validation | Zod |
| Runtime | Node.js |

---

## Prerequisites

- Node.js >= 18
- npm >= 9

No external services are required for local development -- the project uses a local SQLite file.

---

## Installation

```bash
git clone <repo-url>
cd label-reader
npm install
```

---

## Environment Setup

Copy the example and edit if needed:

```bash
cp .env.example .env.local
```

The default `.env.local` already works for local development:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_APP_VERSION="0.2.0"
```

> **DATABASE_URL note**: Prisma resolves this path relative to `prisma/schema.prisma`, so `file:./dev.db` maps to `prisma/dev.db`.

---

## Database Setup

```bash
# 1. Generate Prisma client
npx prisma generate

# 2. Apply schema migrations
npx prisma migrate deploy

# 3. Seed with sample Indian food products
npx prisma db seed
```

Full reset (re-creates DB and re-seeds):

```bash
npx prisma migrate reset
```

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
| `npx tsc --noEmit` | TypeScript type check |
| `npx prisma generate` | Regenerate Prisma client |
| `npx prisma db seed` | Seed sample data |
| `npx prisma migrate deploy` | Apply migrations |
| `npx prisma studio` | Visual database browser |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | SQLite (`file:./dev.db`) or PostgreSQL URL |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public URL for metadata/OG tags |
| `NEXT_PUBLIC_APP_VERSION` | No | Version string (display only) |
| `OCR_API_KEY` | No (Phase 4) | OCR provider API key |
| `AI_API_KEY` | No (Phase 5) | LLM provider API key |

---

## Project Structure

```
label-reader/
+-- prisma/
¦   +-- schema.prisma       # Database schema (SQLite/PostgreSQL)
¦   +-- migrations/         # Applied SQL migrations
¦   +-- seed.ts             # Sample data seeder
¦   +-- dev.db              # Local SQLite database
+-- src/
    +-- app/                # Next.js App Router
    ¦   +-- api/products/   # GET /api/products, /[id], /search
    ¦   +-- api/scans/      # GET|POST /api/scans, /[id], /recent
    ¦   +-- scan/           # Scan page and /scan/[id] result page
    ¦   +-- layout.tsx      # Root layout (Navbar + Footer)
    ¦   +-- page.tsx        # Home page (server component, real data)
    +-- components/
    ¦   +-- background/     # GradientBlobs background
    ¦   +-- hero/           # HeroSection + ScanDropzone (search)
    ¦   +-- layout/         # Navbar + Footer
    ¦   +-- sections/       # FeaturedScan, RecentScans, HowItWorks, CTABanner
    ¦   +-- ui/             # Button, Card, StatusPill primitives
    +-- config/site.ts      # Centralised site config
    +-- features/
    ¦   +-- products/       # ProductService + Prisma types
    ¦   +-- scans/          # ScanService + Prisma types
    +-- lib/
    ¦   +-- animations.ts   # Framer Motion presets
    ¦   +-- env.ts          # Typed env var accessors
    ¦   +-- prisma.ts       # PrismaClient singleton
    ¦   +-- tokens.ts       # Design token JS re-exports
    ¦   +-- utils.ts        # cn() utility
    +-- types/index.ts      # Domain type definitions
```

## Seeded Sample Products

Six Indian food products from Nestle, Amul, Britannia, Haldirams, Paper Boat, and Organic Tattva with full ingredient, nutrition, and claim data.
