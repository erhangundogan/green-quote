# CLAUDE.md — GreenQuote

GreenQuote is a solar financing pre-qualification platform built as a Yarn 4 monorepo.
Users register, submit a quote request, and receive a risk-banded financing offer with
three installment term options.

---

## Repo Layout

```
apps/web/          Next.js 14 (Pages Router) — the main application
packages/shared/   Zod schemas + TypeScript types shared between app and potential clients
```

`packages/shared` is the **only** cross-package import allowed from `apps/web`.

---

## Key Commands

```bash
# Dev
yarn dev                          # start Next.js dev server (from repo root)
yarn workspace @greenquote/web dev

# Tests
yarn test                         # unit + integration (Vitest)
yarn test:e2e                     # E2E against deployed Vercel URL (Playwright)

# Lint / types
yarn lint                         # next lint across all workspaces
yarn typecheck                    # tsc --noEmit across all workspaces

# Database
yarn db:migrate                   # prisma migrate dev (local)
yarn db:seed                      # node prisma/seed.js

# Prisma (from apps/web or via workspace)
yarn workspace @greenquote/web exec prisma generate
yarn workspace @greenquote/web exec prisma migrate dev --name <name>
yarn workspace @greenquote/web exec prisma studio

# Docker
docker compose up db -d           # start local PostgreSQL only
docker compose up --build         # full stack (postgres + web)
```

---

## Environment Variables

| Variable       | Dev (local)                                          | Production        |
|----------------|------------------------------------------------------|-------------------|
| `DATABASE_URL` | `postgresql://greenquote:greenquote@localhost:5432/greenquote` | Neon (pooled) |
| `JWT_SECRET`   | any ≥ 32-char string                                 | Vercel env var    |

- `.env.local` takes precedence over `.env` in Next.js — keep `DATABASE_URL` consistent across both.
- Never commit `.env`, `.env.local`, or any file containing real credentials.

---

## Pricing Model

```
systemPrice     = systemSizeKw × 1200   (EUR)
principalAmount = systemPrice − downPayment

riskBand:
  A → monthlyConsumptionKwh ≥ 400 AND systemSizeKw ≤ 6   → APR 6.9%
  B → monthlyConsumptionKwh ≥ 250 (and not A)             → APR 8.9%
  C → otherwise                                            → APR 11.9%

monthlyPayment = P × [r(1+r)^n] / [(1+r)^n − 1]
  where r = annualAPR/12,  n = termYears × 12

Offer terms: 5 yr, 10 yr, 15 yr
Total Cost (UI-only, not stored) = monthlyPayment × termYears × 12
```

All logic lives in `apps/web/src/lib/pricing.ts`. Do not duplicate it in other files.

---

## Domain Models

### User
| Field     | Type   | Notes              |
|-----------|--------|--------------------|
| id        | string | CUID               |
| fullName  | string |                    |
| email     | string | unique             |
| password  | string | bcrypt hash        |
| role      | string | `USER` \| `ADMIN`  |
| createdAt | Date   |                    |

### Quote
| Field                 | Type   | Notes                     |
|-----------------------|--------|---------------------------|
| id                    | string | CUID                      |
| userId                | string | FK → User (cascade delete)|
| fullName              | string | snapshot at submission    |
| email                 | string | snapshot at submission    |
| address               | string |                           |
| monthlyConsumptionKwh | float  |                           |
| systemSizeKw          | float  |                           |
| downPayment           | float  | default 0                 |
| systemPrice           | float  | computed                  |
| principalAmount       | float  | computed                  |
| riskBand              | string | A / B / C                 |
| offers                | string | JSON-serialised QuoteOffer[]|
| createdAt             | Date   |                           |

---

## API Routes

| Method | Path                  | Auth      | Notes                              |
|--------|-----------------------|-----------|------------------------------------|
| GET    | /api/health           | none      | Liveness probe                     |
| POST   | /api/auth/register    | none      |                                    |
| POST   | /api/auth/login       | none      | Sets httpOnly JWT cookie           |
| POST   | /api/auth/logout      | none      | Clears cookie                      |
| GET    | /api/auth/me          | required  |                                    |
| POST   | /api/quotes           | required  | Creates quote + computes pricing   |
| GET    | /api/quotes           | required  | Own quotes; admin sees all         |
| GET    | /api/quotes/:id       | required  | Ownership enforced                 |
| GET    | /api/quotes/:id/pdf   | required  | PDF download                       |

---

## Auth Rules

- Passwords: bcrypt, **cost factor ≥ 12**. Never lower it.
- JWT stored in `httpOnly`, `Secure`, `SameSite=strict` cookie. Never localStorage.
- `withAuth(handler)` verifies JWT signature **and** checks user still exists in DB.
  Do not inline auth logic in route handlers — always use the wrapper.
- Role checks are server-side. Client-side guards are UI-only (not security boundaries).
- Never log passwords, tokens, or PII.

---

## TypeScript Rules

- `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` — non-negotiable.
- No `any`. Use `unknown` + narrowing or generics.
- Prefer `type` over `interface` for plain data shapes.
- All exported functions must have explicit return types.
- Type-only imports: `import type { Foo } from '...'`.
- Absolute imports via `@/` alias (resolves to `src/`).

---

## React / Next.js Rules

- **Pages Router only** — no App Router, no Server Components, no `'use client'`.
- No anonymous default exports — always name your components.
- Hooks start with `use` and live in `src/hooks/`.
- Props interfaces named `<ComponentName>Props`.

---

## Zod Rules

- Every API request body and response shape validated with Zod.
- Schemas in `src/schemas/` (app) or `packages/shared/src/` (shared).
- Infer TypeScript types from schemas via `z.infer<typeof Schema>` — do not duplicate.

---

## Database Rules

- All DB access through the singleton in `src/lib/db.ts`.
- No raw SQL unless Prisma can't express the query — document the reason.
- **Never modify an existing migration file.** Create a new one instead.
- After schema changes: run `prisma migrate dev --name <name>`, commit the generated SQL.
- Seed accounts: `admin@test.com` / `Admin1234!` (ADMIN), `user@test.com` / `User1234!` (USER).
- `prisma/seed.js` (CJS, no ts-node) runs in Docker and on Vercel build. Uses `upsert` — safe to re-run.

---

## Styling Rules

- Tailwind utility classes only. No custom CSS except `globals.css` for base reset.
- shadcn/ui components are the first choice for UI primitives.
- Class merging via `cn()` (`clsx` + `tailwind-merge`) — no string concatenation for classes.

---

## Accessibility Rules

- Decorative icons: `aria-hidden="true"`.
- Loading spinners: `role="status"` + `<span className="sr-only">Loading…</span>`.
- Async-updating containers: `aria-busy={loading}`.
- Dynamic result counts: `aria-live="polite" aria-atomic="true"`.
- Tables with external titles: `aria-label` on `<Table>`.
- `<section>` landmarks: `aria-labelledby` (preferred) or `aria-label`.
- Password toggles: descriptive `aria-label` reflecting current state.
- Form errors: `id="<field>-error"` on the paragraph, `aria-describedby="<field>-error"` on the input.

---

## Testing Rules

| Layer       | Location                  | Runner     |
|-------------|---------------------------|------------|
| Unit        | `src/tests/unit/`         | Vitest     |
| Integration | `src/tests/integration/`  | Vitest     |
| E2E         | `src/tests/e2e/`          | Playwright |

- Test file names mirror source: `pricing.ts` → `pricing.test.ts`.
- No `test.only` or `test.skip` committed to main.
- E2E runs against `https://green-quote-gray.vercel.app` (set via `PLAYWRIGHT_BASE_URL` in `test:e2e` script).
- Setup file: `src/tests/setup.ts` — imports jest-dom matchers and stubs `ResizeObserver`.

---

## Git Rules

- Conventional Commits: `feat:`, `fix:`, `chore:`, `test:`, `docs:`.
- Each commit should pass `lint`, `typecheck`, and `test`.
- Branch naming: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Never commit `.env*` files, `next-env.d.ts`, `*.tsbuildinfo`, or `node_modules`.
- No `Co-Authored-By: Claude` trailers in commit messages.

---

## Deployment

- **Vercel** (production): `https://green-quote-gray.vercel.app`
  - Build command runs: `shared build → prisma migrate deploy → seed → next build`
  - Database: Neon PostgreSQL (persistent across deploys)
- **Docker** (local / GCP): `docker compose up --build`
  - Includes a local PostgreSQL 16 service — no external DB needed
  - `DATABASE_URL` defaults to `postgresql://greenquote:greenquote@db:5432/greenquote`
  - Override via `.env` at repo root for Neon or other PostgreSQL instances
