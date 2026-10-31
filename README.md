# Swantara

Monolith ERP Project Covers the boring business cycle: sell, buy, make, stock, bill, pay, close.

## Product

### What it covers

- Sell: prospect, quote, order, delivery, invoice, payment, POS, returns
- Buy: purchase request, quote request, PO, receipt, bill, payment, expenses
- Make: recipe, production order, QC
- Stock: items, stock movements, transfers, counts
- Money: ledger, payables, receivables, tax, reports
- People and assets: employees, payroll, assets, service, subscriptions, projects

### Modules

| Flow | Modules |
|------|---------|
| O2C | Sales, POS + Checkout, Gift Card, Commission |
| P2P | Procurement, Expense |
| P2M | Manufacturing, Quality |
| I2F | Inventory, Products |
| R2R | Accounting, Reference, Localization (ID), Reporting |
| H2R | Payroll |
| A2R | Asset |
| S2C | Service, Returns (RMA) |
| Sub | Subscription |
| P2Pft | Project |
| Cross-cutting | IAM (JWT, RBAC), Inter-Organization, Approvals, Audit, Attachments (document vault) |

Checkout is the POS sell flow (`POST /api/v1/organizations/{id}/pos/orders`), and the document vault is the attachment store exposed at `/api/v1/organizations/{id}/attachments`.

### Flows

- O2C: Quote -> Order -> Delivery -> Invoice -> Payment
- P2P: Purchase request -> Quote request/PO -> Receive -> Bill -> Pay
- P2M: Demand -> Production order -> Consume -> Produce
- I2F: Inbound, outbound, transfer, count, return
- R2R: Post to ledger, close period, report
- H2R: Hire -> Contract -> Attendance -> Payroll run -> Pay
- A2R: Acquire -> Depreciate -> Dispose
- S2C / Sub / Project: shop task -> bill, recurring bill, project WIP vs billing

See `docs/references/glossary.md` for the generic business terms used across the codebase.

## Technical

Modular monolith + web client, containerized for local dev. No staging/prod yet.

### Service (`service/`)

| Component | Technology |
|-----------|-----------|
| Language | Go 1.26 |
| HTTP | Fiber v3 |
| Database | PostgreSQL 16 (GORM) |
| Migrations | Goose |
| Queue | Valkey 8 (Redis-compatible) + Asynq workers |
| Auth | JWT, RBAC |
| Validation | go-playground/validator |
| Mail | SMTP via go-mail |
| Logging | slog + tint |
| Config | Viper (.env) |
| Docs | Swagger (Swaggo) |
| Test | httpexpect, gofakeit, go-sqlmock |
| Lint | golangci-lint |

Architecture per domain: `Request -> Handler -> Service -> DAO -> PostgreSQL`. Handlers parse HTTP and write responses. Services hold business rules. DAOs embed generic `dao.Base[E]`. Shared code lives in `kernel/` and `httpx/`. Domains depend only on other domains' exported service interfaces and constants, never on their handlers or DAO internals; concrete wiring lives in `cmd/http/main.go`. This keeps the dependency graph acyclic while allowing cross-domain orchestration.

See `service/README.md` for layer rules, error handling, testing, and queue patterns.

### Web (`web/`)

Next.js 16, React 19, Tailwind 4, shadcn + Base UI, TanStack Query/Table, Zustand, React Hook Form + Zod, next-intl. Biome + `tsc` + Vitest + Playwright.

See `web/README.md` for feature module structure and container/presentation patterns.

### Layout

```
service/            Go API + workers + migrations
web/                Next.js client
docker-compose.yml  postgres, valkey, api, worker, web
justfile            root dev/lint/test/setup entrypoints + service/web modules
```

Infra services: `postgres` (5432), `valkey` (6379), `api` (8080), `worker` (Asynq), `web` (3000). Test profile adds `postgres-test` (5433), `api-e2e`, `worker-e2e`, `k6`.

## Getting Started

### Prerequisites

- Node 22+, pnpm 9+
- Go 1.26+
- Docker + Docker Compose
- `just`

Run `just doctor` to verify toolchain.

### Setup

```sh
cp -n service/.env.example service/.env
cp -n web/.env.example web/.env
just setup
just service::db-up
just service::migrate
just service::seed
```

The seeder creates a demo organization and a development-only admin
(`admin@swantara.id` / `password123`). Do not seed demo data in production.

### Run

Full stack via compose:

```sh
docker compose up
```

Or split dev servers (each command runs in its own terminal):

```sh
just web::dev
just service::dev
```

Service-only with live reload:

```sh
just service::dev        # API + worker
just service::dev-http   # API only
just service::dev-queue  # worker only
```

See `docs/technical/onboarding.md` for prerequisites, the repository tour, and
first-change recipes.

### Verify

- Web: http://localhost:3000
- API health: http://localhost:8080/api/v1/health
- Swagger: http://localhost:8080/docs/

### Useful Commands

```sh
just lint
just test
just web::typecheck
just web::build
just service::lint
just service::test
just service::check
```

# Self-hosting

Swantara runs on plain Docker Compose with no staging or external PaaS
required. Running your own instance requires a license from Swantara.

### Setup and run

```sh
cp service/.env.example service/.env
cp web/.env.example web/.env

# generate strong JWT secrets
openssl rand -base64 32   # use for JWT_ACCESS_TOKEN_SECRET / JWT_REFRESH_TOKEN_SECRET

export DOMAIN=erp.example.com
export POSTGRES_PASSWORD='<strong-password>'
just prod-up
```

The production compose file runs the Goose migrations before the API starts, then
brings up PostgreSQL, Valkey, API, worker, web, and Caddy. Caddy terminates TLS for
`DOMAIN` and reverse-proxies to the web container, which forwards `/api/v1` to the
API through its BFF.

Open `https://erp.example.com`, finish registration, and create your first
organization.

### Self-host configuration checklist

- `POSTGRES_PASSWORD` — set a strong value; the compose default is development-only.
- `service/.env` — set `JWT_ACCESS_TOKEN_SECRET`, `JWT_REFRESH_TOKEN_SECRET`
  (generate with `openssl rand -base64 32`), `APP_URL`, `CLIENT_WEB_URL`,
  `SMTP_*` for outbound mail, and `DB_SSL_MODE` for production.
- `DOMAIN` — public hostname for TLS issuance (e.g. `erp.example.com`).
- Do not run `just service::seed` against a production database; the compose topology
  never seeds, and demo data must not ship.

### Deploy shortcuts

```sh
just prod-up     # docker compose -f docker-compose.prod.yml up -d --build
just prod-down
just prod-logs
just prod-backup   # pg_dump of the swantara database
just prod-status
```

## License

Copyright (c) 2026 Swantara. All rights reserved.

This is proprietary software. Use, copying, modification, and distribution
require prior written permission from Swantara. See [`LICENSE`](LICENSE).

Third-party copyright and license notices are in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and are served by the web app
at `/licenses`. Regenerate them with `just notices` after dependency changes.
