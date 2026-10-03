# features/

This directory holds the domain feature modules that implement Label Reader's
core business logic. Each subdirectory is one feature/domain boundary.

## Architectural rule

**Components in `src/app/` or `src/components/` must NOT contain business
logic.** Business logic — scoring rules, ingredient classification, claim
verification — lives here, in these feature modules.

The data flow is:

```
src/app/ (UI)
    ↓
src/app/api/ (Route Handlers — thin HTTP layer)
    ↓
src/features/<module>/<module>.service.ts  (business logic)
    ↓
src/lib/db.ts (Prisma client — Phase 2+)
    ↓
PostgreSQL
```

## Modules (to be built in Phases 2–7)

| Directory     | Phase | Responsibility                                         |
|---------------|-------|--------------------------------------------------------|
| `products/`   | 2     | Product CRUD, brand lookup, normalised FoodProduct     |
| `ingredients/`| 2–3   | INS additive DB, ingredient parsing, hazard lookup     |
| `nutrition/`  | 3     | Per-100g normalisation, daily value thresholds (FSSAI) |
| `analysis/`   | 3     | Coordinates nutrition + ingredient analysis            |
| `scoring/`    | 3     | Explainable A/B/C/D scoring engine                     |
| `claims/`     | 3     | Front-of-pack claim vs. label evidence matching        |
| `ocr/`        | 4     | Image → raw text → normalised FoodProduct pipeline     |
| `ai/`         | 5     | LLM explanation adapter (explains scores in plain text)|

## Rule for new modules

1. Create `src/features/<name>/` with at minimum `<name>.service.ts` and `types.ts`.
2. Export only through `index.ts` — internal implementation is private.
3. Never import from another feature module directly — go through the API layer.
