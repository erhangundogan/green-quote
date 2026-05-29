# GreenQuote

Solar financing pre-qualification platform. Authenticated users submit details about their residential solar installation and instantly receive a risk-banded financing quote with three installment term options (5, 10, 15 years).

**Live demo:** https://green-quote-gray.vercel.app

---

## Table of contents

1. [Tech stack](#tech-stack)
2. [Architecture overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [Quick start (local dev)](#quick-start-local-dev)
5. [Environment variables](#environment-variables)
6. [Available scripts](#available-scripts)
7. [Running with Docker](#running-with-docker)
8. [Deploying to Vercel](#deploying-to-vercel)
9. [Project structure](#project-structure)
10. [Pricing model](#pricing-model)
11. [API reference](#api-reference)
12. [Testing](#testing)
13. [Design decisions & trade-offs](#design-decisions--trade-offs)
14. [What I'd add next](#what-id-add-next)
15. [GCP deployment recommendation](#gcp-deployment-recommendation)

---

## Tech stack

| Layer        | Choice                                              |
|--------------|-----------------------------------------------------|
| Monorepo     | Yarn 4 workspaces                                   |
| Frontend     | Next.js 14 — Pages Router (no Server Components)    |
| Styling      | Tailwind CSS + shadcn/ui                            |
| Forms        | react-hook-form + Zod resolver                      |
| Backend      | Next.js API routes (Node.js runtime)                |
| Database     | SQLite (local dev) · PostgreSQL/Neon (production)   |
| Auth         | JWT in `httpOnly` cookie — `jose` + `bcryptjs`      |
| Validation   | Zod — shared schemas in `packages/shared`           |
| Logging      | pino (structured JSON) + pino-pretty in dev         |
| Unit tests   | Vitest + Testing Library                            |
| E2E tests    | Playwright                                          |
| Shared lib   | Vite library build (`packages/shared`)              |

---

## Architecture overview

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                 │
│  Next.js Pages Router (no Server Components)            │
│  react-hook-form + Zod → fetch → API routes             │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (same origin)
┌────────────────────────▼────────────────────────────────┐
│  Next.js API routes  (src/pages/api/)                   │
│  withAuth() middleware → JWT verify → handler           │
│  Zod validation → pricing engine → Prisma               │
└────────────────────────┬────────────────────────────────┘
                         │ Prisma Client
┌────────────────────────▼────────────────────────────────┐
│  SQLite (local dev · prisma/dev.db)                     │
│  PostgreSQL/Neon (production)                           │
│  Tables: User, Quote                                    │
└─────────────────────────────────────────────────────────┘
```

**Monorepo layout:**
- `apps/web` — the Next.js application (frontend + API)
- `packages/shared` — Zod schemas and TypeScript types shared between frontend and backend, built as a Vite library

---

## Prerequisites

| Tool        | Version   | Install                          |
|-------------|-----------|----------------------------------|
| Node.js     | ≥ 22      | [nodejs.org](https://nodejs.org) |
| Yarn        | 4.x       | `corepack enable`                |
| Docker      | optional  | for containerised runs           |

---

## Quick start Docker

The image uses a multi-stage build (deps → builder → runner). On first start the entrypoint automatically runs `prisma migrate deploy` then seeds the database (admin + test user) if it is empty.

```bash
# 1. Set a real JWT_SECRET in docker-compose.yml (or pass via environment)
# 2. Build and start
docker compose up --build

# App available at http://localhost:3000
# Data persisted in Docker volume: sqlite_data
```

**Architecture (Apple Silicon):** the image is pinned to `linux/arm64` in `docker-compose.yml`. For amd64 deployment (Cloud Run, CI) change `platform` to `linux/amd64` or remove it — the `linux-musl-openssl-3.0.x` Prisma binary is included for both architectures.

---

## Quick start (local dev)

```bash
# 1. Clone and install
git clone https://github.com/erhangundogan/green-quote
cd green-quote
yarn install

# 2. Configure environment
cp apps/web/.env.example apps/web/.env
# Open apps/web/.env and set JWT_SECRET to a random string:
# openssl rand -base64 32

# 3. Initialise the database
yarn db:migrate        # creates prisma/dev.db and applies migrations
yarn db:seed           # seeds admin + test user

# 4. Start the dev server
yarn dev               # → http://localhost:3000
```

### Seed credentials

| Email           | Password   | Role  |
|-----------------|------------|-------|
| admin@test.com  | Admin1234! | ADMIN |
| user@test.com   | User1234!  | USER  |

---

## Environment variables

All variables live in `apps/web/.env` (copy from `apps/web/.env.example`).

| Variable              | Required | Default              | Description                              |
|-----------------------|----------|----------------------|------------------------------------------|
| `DATABASE_URL`        | yes      | `file:./dev.db`      | Prisma connection string                 |
| `JWT_SECRET`          | yes      | —                    | ≥ 32-char random secret for JWT signing  |
| `JWT_EXPIRES_IN`      | no       | `7d`                 | JWT lifetime                             |
| `NEXT_PUBLIC_APP_URL` | no       | `http://localhost:3000` | Public base URL                       |
| `NODE_ENV`            | no       | `development`        | `development` \| `production`            |
| `LOG_LEVEL`           | no       | `info`               | pino log level                           |

Generate a secure secret:

```bash
openssl rand -base64 32
```

---

## Available scripts

Run all scripts from the **repo root** unless noted.

| Command                  | Description                                         |
|--------------------------|-----------------------------------------------------|
| `yarn dev`               | Start Next.js dev server with hot-reload            |
| `yarn build`             | Build `packages/shared` then `apps/web` for production |
| `yarn test`              | Run Vitest unit + integration tests                 |
| `yarn test:e2e`          | Run Playwright E2E tests (starts dev server)        |
| `yarn test:e2e:report`   | Open the last Playwright HTML report                |
| `yarn lint`              | ESLint all workspaces                               |
| `yarn typecheck`         | TypeScript strict check all workspaces              |
| `yarn db:migrate`        | Create/apply Prisma migrations                      |
| `yarn db:seed`           | Seed the database (idempotent)                      |
| `yarn db:studio`         | Open Prisma Studio UI                               |

---

## Deploying to Vercel

The repo ships with a `vercel.json` that configures the monorepo build automatically.

```bash
# Install Vercel CLI and deploy
npx vercel --prod
```

**Required environment variables in Vercel:**

| Variable       | Description                                          |
|----------------|------------------------------------------------------|
| `DATABASE_URL` | Neon PostgreSQL connection string (pooled)           |
| `JWT_SECRET`   | ≥ 32-char random secret (`openssl rand -base64 32`) |

**Neon setup (free tier):**
1. Vercel dashboard → **Storage** → **Create Database** → **Neon Postgres**
2. Neon auto-sets `DATABASE_URL` in your project environment
3. Redeploy — `prisma migrate deploy` runs automatically during the build and creates all tables

**Corepack (Yarn 4):** add `ENABLE_EXPERIMENTAL_COREPACK=1` as an environment variable in Vercel so it uses Yarn 4 instead of the default Yarn 1.

---

## Project structure

```
cloover/
├── apps/
│   └── web/                      # @greenquote/web — Next.js app
│       ├── prisma/
│       │   ├── schema.prisma     # DB schema + Prisma generator config
│       │   ├── seed.js           # Idempotent CJS seed (local dev + Docker)
│       │   └── migrations/       # Migration history
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/               # shadcn/ui primitives (Button, Input, NavigationMenu, …)
│       │   │   ├── AuthGuard.tsx     # Client-side route protection
│       │   │   ├── Layout.tsx        # App shell — logo | Quotes nav | Sign Out
│       │   │   ├── QuoteForm.tsx     # Pre-qualification form
│       │   │   ├── QuoteResults.tsx  # System price + risk band + offers
│       │   │   └── QuotesTable.tsx   # Sortable quotes list with "Yours" badge
│       │   ├── hooks/
│       │   │   └── useAuth.ts    # Current user + logout
│       │   ├── lib/
│       │   │   ├── auth.ts       # JWT sign/verify, withAuth() middleware (+ DB user check)
│       │   │   ├── db.ts         # Prisma singleton
│       │   │   ├── logger.ts     # pino instance
│       │   │   ├── pricing.ts    # Pricing & amortisation engine
│       │   │   ├── quote-pdf.tsx # @react-pdf/renderer PDF template
│       │   │   └── utils.ts      # cn(), formatCurrency(), formatDate()
│       │   ├── pages/
│       │   │   ├── api/
│       │   │   │   ├── auth/     # register, login, logout, me
│       │   │   │   ├── quotes/
│       │   │   │   │   ├── index.ts        # GET (list) + POST (create)
│       │   │   │   │   └── [id]/
│       │   │   │   │       ├── index.ts    # GET single quote
│       │   │   │   │       └── pdf.tsx     # GET quote PDF download
│       │   │   │   └── health.ts
│       │   │   ├── admin/
│       │   │   │   └── quotes.tsx  # Admin — all quotes + search + sort
│       │   │   ├── quotes/
│       │   │   │   ├── index.tsx   # My quotes list
│       │   │   │   └── [id].tsx    # Quote detail + PDF download button
│       │   │   ├── new-quote.tsx # New quote form (dedicated route)
│       │   │   ├── index.tsx     # Landing page
│       │   │   ├── login.tsx
│       │   │   └── register.tsx
│       │   ├── tests/
│       │   │   ├── unit/         # pricing, quote-schema, quotes-table, layout
│       │   │   ├── integration/  # quotes-api.test.ts
│       │   │   └── e2e/          # auth-quote-flow.spec.ts
│       │   └── types/
│       │       └── index.ts      # QuoteRow et al.
│       ├── next.config.js        # standalone output + transpile shared
│       ├── tailwind.config.js
│       ├── vitest.config.ts
│       └── playwright.config.ts
├── packages/
│   └── shared/                   # @greenquote/shared — Vite library
│       └── src/
│           ├── schemas/          # RegisterSchema, LoginSchema, QuoteInputSchema
│           └── types/            # AuthUser, QuoteResult, QuoteOffer, RiskBand …
├── docs/
│   └── API.md                    # Full API endpoint reference
├── Dockerfile                    # Multi-stage: deps → builder → runner
├── docker-compose.yml
├── docker-entrypoint.sh          # migrate deploy → seed → start server
├── vercel.json                   # Vercel monorepo build config
└── .env.example                  # Root-level example (Docker)
```

---

## Pricing model

```
systemPrice      = systemSizeKw × 1,200   (EUR)
principalAmount  = systemPrice − downPayment

Risk band:
  A  →  monthlyConsumptionKwh ≥ 400  AND  systemSizeKw ≤ 6
  B  →  monthlyConsumptionKwh ≥ 250  (and not A)
  C  →  otherwise

Base APR:  A → 6.9%,  B → 8.9%,  C → 11.9%

Monthly payment (standard amortisation):
  M = P × [r(1+r)^n] / [(1+r)^n − 1]
  where r = annualAPR / 12,  n = termYears × 12

Offers returned: 5 yr, 10 yr, 15 yr
Each offer: { termYears, apr, principalUsed, monthlyPayment }
```

The engine is implemented in `apps/web/src/lib/pricing.ts` and is fully unit-tested.

---

## API reference

Full documentation in [docs/API.md](docs/API.md).

| Method | Path                     | Auth        | Description                              |
|--------|--------------------------|-------------|------------------------------------------|
| GET    | `/api/health`            | none        | Liveness probe                           |
| POST   | `/api/auth/register`     | none        | Create account, issue JWT cookie         |
| POST   | `/api/auth/login`        | none        | Verify credentials, issue JWT cookie     |
| POST   | `/api/auth/logout`       | none        | Clear JWT cookie                         |
| GET    | `/api/auth/me`           | required    | Return current user                      |
| POST   | `/api/quotes`            | required    | Create quote, compute pricing            |
| GET    | `/api/quotes`            | required    | List own quotes (`?all=true` for admins) |
| GET    | `/api/quotes/:id`        | required    | Fetch one quote (ownership enforced)     |
| GET    | `/api/quotes/:id/pdf`    | required    | Download quote as a formatted PDF        |

---

## Testing

```bash
# Unit + integration (Vitest)
yarn test

# E2E (Playwright — starts dev server automatically)
yarn test:e2e

# Open Playwright HTML report
yarn test:e2e:report
```

**Test coverage:**

| Layer       | What is tested                                                                   |
|-------------|----------------------------------------------------------------------------------|
| Unit        | `pricing.ts` — all band/APR/amortisation cases (14 tests)                        |
| Unit        | Zod schemas — valid + invalid inputs for quote, register, login (12 tests)       |
| Unit        | `QuotesTable` — sort logic (pure) + sort UI interactions + `aria-sort` (16 tests)|
| Unit        | `Layout` — NavigationMenu items/gating + Sign Out button (10 tests)              |
| Integration | API routes — quote CRUD with real test SQLite DB (5 tests)                       |
| E2E         | Register → navigate via Quotes menu → submit quote → redirect to detail page     |
| E2E         | Login → view existing quotes via Quotes menu                                     |
| E2E         | Quotes menu shows All Quotes only for ADMIN                                      |
| E2E         | Non-admin blocked from `/admin/quotes`                                           |
| E2E         | Admin navigates to `/admin/quotes` via Quotes menu                               |
| E2E         | All Quotes table column sorting (date + system size, aria-sort)                  |
| E2E         | Admin searches/filters the All Quotes table                                      |

---

## Design decisions & trade-offs

**SQLite locally, PostgreSQL in production** — SQLite requires zero infrastructure for local dev. The production deployment on Vercel uses Neon (serverless Postgres) — SQLite's ephemeral `/tmp` filesystem on serverless is incompatible with persistent data. Switching providers required only changing `provider = "postgresql"` in `schema.prisma` and updating the migration SQL; no application code changed.

**Pages Router over App Router** — Avoids the complexity of Server Components and async layouts while satisfying the "no server components" requirement. All data fetching is explicit (`useEffect` / `fetch`), making the data flow easy to follow and test.

**JWT in `httpOnly` cookie** — Immune to XSS (JS cannot read the cookie). `SameSite=Strict` mitigates CSRF. Simpler than a session store for this scope. Trade-off: no server-side revocation before expiry (7 d); mitigated by short lifetime.

**`packages/shared` Zod-first schemas** — Zod schemas are the single source of truth. TypeScript types are derived via `z.infer<>`, so there is zero duplication between server-side validation and client-side form resolvers. Changing a field type in one place propagates everywhere.

**`?all=true` for admin list** — `GET /api/quotes` always returns only the caller's own quotes. Admins opt in to the full list via `?all=true`. This keeps the endpoint behaviour predictable regardless of role, and makes it impossible to accidentally leak data via a missing role check on the client.

**`withAuth()` wrapper** — Auth logic is centralised in one higher-order function. Every protected route is a one-liner: `export default withAuth(handler)`. Role checks (`requireAdmin: true`) are enforced server-side; client-side guards are UI-only conveniences.

**No repository layer** — Prisma's generated client is expressive enough for this scope. A repository layer would add indirection without benefit here; it would be the first thing to add before the codebase grows significantly.

---

## What I'd add next

1. **Refresh tokens / session revocation** — a `RefreshToken` table with rotation; the current stolen-JWT window is 7 days.
2. **CI/CD pipeline** — GitHub Actions: `lint → typecheck → test → build → deploy to Vercel`.
3. **Amortisation schedule view** — month-by-month breakdown (payment / principal / interest / balance) expandable on the quote detail page.
4. **OpenAPI docs** — auto-generate from Zod schemas via `zod-to-openapi` + Swagger UI at `/api/docs`.
5. **Rate limiting** — token-bucket on auth endpoints (register, login) to prevent brute-force.
6. **Error boundaries + Sentry** — global React error boundary + structured error reporting for production observability.
7. **Optimistic UI** — submit the quote form optimistically and reconcile on response.
8. **Internationalisation** — currency and number formatting are already locale-aware (`Intl`); adding `next-intl` for string translations is a natural next step.

---

## GCP deployment recommendation

**Cloud Run** is the best fit: containerised, scales to zero, no cluster management, and deploys in seconds from a Docker image.

```
Artifact Registry → Cloud Build (on push to main) → Cloud Run
                                                         │
                                        Cloud SQL (Postgres, private IP)
                                        Secret Manager (JWT_SECRET, DATABASE_URL)
```

- **Database:** Cloud SQL for Postgres. The schema already uses `provider = "postgresql"` — only `DATABASE_URL` needs updating. No application code changes required.
- **Secrets:** `JWT_SECRET` and `DATABASE_URL` stored in Secret Manager, mounted as env vars in the Cloud Run service.
- **Migrations:** run `prisma migrate deploy` as a Cloud Run Job before each new revision (the `docker-entrypoint.sh` already does this for Docker-based deployments).
- **Observability:** Cloud Logging ingests pino's structured JSON natively; add Cloud Trace for request tracing.
- **CI/CD:** Cloud Build trigger on `main` — lint → test → `docker build` → push to Artifact Registry → deploy new Cloud Run revision.
