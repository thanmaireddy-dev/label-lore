# LabelLore

> Understand what's inside your packaged food.

---

## Project

LabelLore is a food label intelligence platform focused on packaged food
products available in India. It helps consumers decode confusing ingredient
lists, nutrition panels, and marketing claims — transparently and without
fearmongering.

The goal is **food label literacy**, not a generic health-score calculator.
Every analysis result explains *why* a product received its grade, what
ingredients are doing, and whether front-of-pack claims hold up against the
label data.

---

## Current Phase

**Phase 0 — Project Foundation**

The Next.js application is initialised with TypeScript, Tailwind CSS, and the
complete design token system. The project structure is established. No product
features have been implemented yet.

---

## Stack

| Technology  | Role                                               |
|-------------|----------------------------------------------------|
| Next.js 16  | Full-stack framework — App Router, Route Handlers  |
| React 19    | Component rendering                                |
| TypeScript  | End-to-end type safety                             |
| Tailwind v4 | Utility-first CSS, design token system             |
| Node.js 24  | Runtime                                            |

Future phases will add:
- **PostgreSQL + Prisma** (Phase 2) — relational product/ingredient database
- **Zod** (Phase 2) — runtime validation at API boundaries
- **Framer Motion** (Phase 1) — micro-interactions and scroll animations
- **Lucide React** (Phase 1) — icon set

---

## Architecture

Label Reader uses a **modular monolith** — one Next.js application and one
deployment, but with clearly separated domain boundaries inside it.

```
src/app/            ← UI: pages and route handlers (thin HTTP layer)
src/components/     ← Reusable React components (no business logic)
src/features/       ← Domain modules: ingredients, analysis, scoring, OCR, AI
src/lib/            ← Cross-cutting utilities: db client, env, cn(), tokens
src/types/          ← Shared TypeScript type definitions
src/config/         ← Site-level constants
```

Data flow:

```
UI (React)
    ↓
Route Handlers (src/app/api/)
    ↓
Feature services (src/features/<module>/*.service.ts)
    ↓
Data Access (Prisma → PostgreSQL)
```

External services (OCR, LLM) are isolated behind feature modules in
`src/features/ocr/` and `src/features/ai/`. The UI never calls external APIs
directly.

The scoring engine is separate from the AI explanation layer — the engine
produces structured, deterministic facts; the AI only narrates those facts in
plain language.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Production build (run before deploying)
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to see the Phase 0
placeholder.

### Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

No environment variables are required to run the Phase 0 foundation.

---

## Development Roadmap

| Phase | Goal                                              | Status      |
|-------|---------------------------------------------------|-------------|
| 0     | Project foundation — Next.js, TypeScript, Tailwind| ✅ Complete  |
| 1     | Core web application — landing page, UI components| 🔜 Next      |
| 2     | PostgreSQL + Prisma + product data                | 📋 Planned  |
| 3     | Analysis + explainable scoring engine             | 📋 Planned  |
| 4     | OCR — image → normalised product data             | 📋 Planned  |
| 5     | AI explanation layer / chatbot                    | 📋 Planned  |
| 6     | Product comparison                                | 📋 Planned  |
| 7     | Recommendation engine                             | 📋 Planned  |
| 8     | User accounts, scan history, saved products       | 📋 Planned  |
| 9     | Multilingual support and accessibility polish     | 📋 Planned  |

---

## Design System

The visual design is documented in `design implementation.md`. Key decisions:

- **Background:** `#FAFAF7` warm off-white — editorial "paper" feel
- **Primary:** `#1B3A4B` deep ink-teal — clarity and trust
- **Semantic colors:** safe `#1F8A5B`, caution `#B8791A`, flag `#B4432E`
- **Typography:** Inter (all UI) + Fraunces Italic (1–3 word headline accents only)
- **Cards:** 16px radius, 1px border, soft dual-layer shadow
- **Tone:** calm authority — no fearmongering, no alarm-red, evidence-based

Design tokens are defined in `src/app/globals.css` and mirrored as JS constants
in `src/lib/tokens.ts`.

---

## Design Philosophy

- Simple over clever. Explicit over abstract.
- Business logic belongs in `src/features/`, never in React components.
- The scoring engine is deterministic and independently testable.
- The AI layer explains facts; it does not produce them.
- Every ingredient warning pairs colour with a text label and icon (accessibility).
- All animations respect `prefers-reduced-motion`.
