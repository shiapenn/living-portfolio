# The Living Portfolio (Open Source)

A self-hosted personal site that works as a tech blog, a design portfolio, and a showcase for shipped ventures—backed by a time-aware knowledge graph of the owner's actual records.

## Core Principles (§0, §1)

1. **Entry-first, structure optional (`L0` → `L3`).** Any Markdown document publishes, is searchable, and is citable on day one at `L0 Text`. Context facets (`L1`), role annotations (`L2`), and scoped claims (`L3`) enrich capabilities progressively.
2. **Honesty is the invariant.** Bitemporal revisions (`valid_from` event time vs `written_at` transaction time) and `is_hindsight` flags preserve what the owner wrote and believed at each date. Machine output stays marked `suggested` until confirmed by the owner.
3. **Static-first resilience & graceful degradation.** Public pages are readable without JavaScript. When model quotas or providers fail, `/api/ask` steps down the degradation ladder (§10.8) to cached or extractive answers rather than returning errors.

## Monorepo Architecture (§7, §8)

- [`packages/core`](./packages/core): Kernel types, Zod schemas, Role Profiles (`case-study`, `decision-record`, `design-project`, `research-note`, `how-to`, `freeform`), structure-aware Markdown chunking & text-quote re-anchoring (§10.1), Gap Questions (§10.2), Bitemporal validity (§10.4), Constraint Gate & Tier 1–3 Routing (§10.5), Later-Thinking staleness detection (§10.7), Self-Calibration engine (§11), and Plugin SDK contracts (§14).
- [`packages/ai`](./packages/ai): `ModelProvider` interface, data-class policy router (`public`, `unpublished`, `private`, `sensitive`), `BudgetGovernor` (§13.5), faithfulness & anachronism verification (§10.6), and local redaction scanner (§4.3, §15).
- [`packages/db`](./packages/db): PostgreSQL + `pgvector` Drizzle ORM schema (§9), `InMemoryPortfolioRepository` with Reciprocal Rank Fusion (RRF) hybrid search and recursive temporal graph expansion, and `seedDemoPortfolio`.
- [`apps/api`](./apps/api): Hono HTTP server exposing `/healthz`, `/api/entries`, `/api/structure`, `/api/ask`, `/api/timeline`, `/api/inbox`, `/api/calibration`, `/api/audit`, `/api/import`, `/api/settings` (including portable Markdown + JSON sidecar export and §18.2 evaluation harness), `/.well-known/living-portfolio.json`, `/rss.xml`, and `/sitemap.xml`.
- [`apps/worker`](./apps/worker): Asynchronous pipeline worker (`INGEST` → `EMBED` → `ENRICH` → debounced `PUBLISH` → `BACKUP` with scratch restore drill → cascading `DELETE`).
- [`apps/web`](./apps/web): Strata Design System (§12) static-first HTML renderer and 3-pane Owner Admin Workspace (`/admin`).

## Quickstart (§13.13)

```bash
pnpm build
pnpm test
```

To start the API server with the seeded multi-year portfolio corpus:

```bash
pnpm --filter @living-portfolio/api dev
```

Or deploy via Docker Compose (§13.10):

```bash
cp .env.example .env
docker compose -f docker/docker-compose.hobbyist.yml up -d
```
