# The Living Portfolio (Open Source)

> **Alpha version with known defects. Do not use in production or input real sensitive data.**

A self-hosted personal site that works as a tech blog, a design portfolio, and a showcase for shipped ventures—backed by a time-aware knowledge graph of the owner's actual records.

## Core Principles (§0, §1)

1. **Entry-first, structure optional (`L0` → `L3`).** Any Markdown document publishes, is searchable, and is citable on day one at `L0 Text`. Context facets (`L1`), role annotations (`L2`), and scoped claims (`L3`) enrich capabilities progressively.
2. **Honesty is the invariant.** Bitemporal revisions (`valid_from` event time vs `written_at` transaction time) and `is_hindsight` flags preserve what the owner wrote and believed at each date. Machine output stays marked `suggested` until confirmed by the owner.
3. **Static-first resilience & graceful degradation.** Public pages are readable without JavaScript. When model quotas or providers fail, `/api/ask` steps down the degradation ladder (§10.8) to cached or extractive answers rather than returning errors.

## Monorepo Architecture (§7, §8)

- [`packages/config`](./packages/config): Zod-validated configuration contract (`loadConfig`), fail-fast boot checks, `*_FILE` secret mounts, `PUBLIC_` browser-safe variable extraction, and deterministic `.env.example` generator (`OSR-02`, `OSR-03`). See [`docs/G002-configuration-reference-and-environment-contract.md`](./docs/G002-configuration-reference-and-environment-contract.md).
- [`packages/core`](./packages/core): Kernel types, Zod schemas, Role Profiles (`case-study`, `decision-record`, `design-project`, `research-note`, `how-to`, `freeform`), structure-aware Markdown chunking & text-quote re-anchoring (§10.1), Gap Questions (§10.2), Bitemporal validity (§10.4), Constraint Gate & Tier 1–3 Routing (§10.5), Later-Thinking staleness detection (§10.7), Self-Calibration engine (§11), and Plugin SDK contracts (§14).
- [`packages/client`](./packages/client): Strongly-typed TypeScript client (`LivingPortfolioClient`) generated from Zod schemas against the canonical `/api/v1` versioned API and committed OpenAPI 3.1.0 specification (`OSR-12`).
- [`packages/ai`](./packages/ai): `ModelProvider` interface, data-class policy router (`public`, `unpublished`, `private`, `sensitive`), `BudgetGovernor` (§13.5), faithfulness & anachronism verification (§10.6), and local redaction scanner (§4.3, §15).
- [`packages/db`](./packages/db): PostgreSQL + `pgvector` Drizzle ORM schema (§9) and `InMemoryPortfolioRepository` with Reciprocal Rank Fusion (RRF) search and temporal graph expansion.
- [`apps/api`](./apps/api): Hono HTTP server exposing versioned API routes (`/api/v1/*`), health checks (`/healthz`), OpenAPI spec (`/openapi.json`), and optional single-process bundled adapter (`ENABLE_BUNDLED_WEB=true`).
- [`apps/worker`](./apps/worker): Asynchronous pipeline worker (`INGEST` → `EMBED` → `ENRICH` → debounced `PUBLISH` → `BACKUP` → cascading `DELETE`).
- [`apps/web`](./apps/web): Strata Design System (§12) static-first HTML renderer and 3-pane Owner Admin Workspace (`/admin`), strictly decoupled from the database and communicating with `/api/v1` via `@living-portfolio/client` (`OSR-13`). See [`docs/plans/P002-api-boundary-and-web-decoupling-adr.md`](./docs/plans/P002-api-boundary-and-web-decoupling-adr.md).
- [`examples/seed-demo.ts`](./examples/seed-demo.ts): Synthetic multi-year demo portfolio seed, executed only when explicitly requested (`SEED_DEMO=true` or `pnpm seed:demo`, `OSR-04`).

## Quickstart (§13.13)

```bash
pnpm build
pnpm test
pnpm audit:check
pnpm hardcode:check
```

To start the development server (with optional synthetic demo data via `SEED_DEMO=true`):

```bash
SEED_DEMO=true pnpm --filter @living-portfolio/api dev
```

## Specification, Audits, Plans & Governance (`AUD-06`, `AUD-23`, `OSR-001`)

- **Governing Specification:** [`docs/spec/The_Living_Portfolio_Open_Source_Spec.md`](./docs/spec/The_Living_Portfolio_Open_Source_Spec.md)
- **Audit Tracking & Conformance Register:** [`docs/audits/README.md`](./docs/audits/README.md) ([`register.yml`](./docs/audits/register.yml) | [`conformance.yml`](./docs/audits/conformance.yml))
- **Remediation & Open-Source Release Plans:** [`docs/plans/remediation-plan-AUD-2026-10-19.md`](./docs/plans/remediation-plan-AUD-2026-10-19.md) | [`docs/plans/osr-001-open-source-release.md`](./docs/plans/osr-001-open-source-release.md)
- **Audit Governance Specification:** [`docs/governance/DR-AUD-001.md`](./docs/governance/DR-AUD-001.md) | [`Flip-Day Checklist`](./docs/governance/flip-day-checklist.md) | [`Governance Changelog`](./docs/governance/CHANGELOG.md)
- **Execution Reports:** [`A002 (Current Honest Baseline)`](./docs/execution-reports/A002.md) | [`OSR-05 (Clean Tree & Rotation)`](./docs/execution-reports/OSR-05-clean-tree-and-rotation.md) | [`A001 (Superseded)`](./docs/execution-reports/A001.md)
- **Architecture Decision Records & Reference Contracts:** [`P002 (API Boundary & Web Decoupling ADR)`](./docs/plans/P002-api-boundary-and-web-decoupling-adr.md) | [`G002 (Configuration Reference & Environment Contract)`](./docs/G002-configuration-reference-and-environment-contract.md)
- **Known Issues, Security, Trademarks & Self-Hosting:** [`KNOWN_ISSUES.md`](./KNOWN_ISSUES.md) | [`SECURITY.md`](./SECURITY.md) | [`TRADEMARKS.md`](./TRADEMARKS.md) | [`docs/self-hosting.md`](./docs/self-hosting.md) | [`CONTRIBUTING.md`](./CONTRIBUTING.md)
