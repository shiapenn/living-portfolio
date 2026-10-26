# Known Issues (`KNOWN_ISSUES.md`)

> **Alpha version with known defects. Do not use in production or input real sensitive data.**

This file summarizes open **P0** (release-blocking) and **P1** (high-priority correctness/safety) findings from [`docs/audits/register.yml`](docs/audits/register.yml) (`AUD-2026-10-19`) in plain language per [`docs/plans/osr-001-open-source-release.md`](docs/plans/osr-001-open-source-release.md) (§1.4 rule 3, `OSR-06`).

## 1. Phase 1a Security Baseline Findings (Claimed Fixed — Awaiting Auditor Verification)

The following P0 security findings have been remediated in code and covered by passing conformance tests in [`apps/api/src/conformance/p0-probes.conformance.test.ts`](apps/api/src/conformance/p0-probes.conformance.test.ts), and remain in `verified_by: null` state until independent auditor re-verification:

| ID | Summary | Current Status |
| --- | --- | --- |
| `S1` | Authentication, CSRF protection, login throttling, and hashed revocable Bearer tokens across API and admin routes. | `fixed` (`verified_by: null`) |
| `S2` | Structural visibility boundary (`allowedVisibilities`) and signed `redactionPreviewToken` gate on public visibility transitions. | `fixed` (`verified_by: null`) |
| `S3` | DOM XSS prevention in the Ask widget via strict HTML escaping and URL sanitization. | `fixed` (`verified_by: null`) |
| `S4` | Rate limiting keyed by daily-salted SHA-256 client IP hash rather than client-supplied `session_id`. | `fixed` (`verified_by: null`) |
| `S5` | Origin-allowlisted CORS (`SITE_ORIGIN`, `ADMIN_ORIGIN`), Content-Security-Policy, and security headers. | `fixed` (`verified_by: null`) |
| `S6` | Evidence URL protocol validation (`http:` / `https:` only) in API validation and SSR HTML rendering. | `fixed` (`verified_by: null`) |

## 2. Open P0 Findings (Target: Remediation Gates 1b and 1c)

| ID | Plain-Language Defect Description | Target Gate |
| --- | --- | --- |
| `G1` | Entry-side unknown facets are skipped in `checkGate` instead of returning `INDETERMINATE` when required hard constraints are missing on the entry. | Gate 1b (Fix 4) |
| `G2` | `/api/ask` hard-codes `hasEvidence`, `hasVerifiedEvidence`, `outcomeStatus`, and `hasScope` instead of computing them from retrieved claims and evidence. | Gate 1b (Fix 4) |
| `G3` | Confirmed scoped constraints (`scoped_constraints`) are not loaded in `/api/ask` or evaluated by value/scope in `checkGate`. | Gate 1b (Fix 4) |
| `G4` | Hard facets are hard-coded (`database`, `stack`) instead of loaded from domain configuration. | Gate 1b (Fix 4) |
| `G5` | Time-travel anachronisms detected by `verifyAnswerBeforeDelivery` still deliver unredacted `verifiedText` at Tier 1 instead of downgrading to extractive excerpts. | Gate 1b (Fix 4) |
| `G6` | `INDETERMINATE` gate results escalate immediately to Tier 2/3 without offering a single-turn missing-context prompt (`needs_context`). | Gate 1b (Fix 4) |
| `G7` | Tier 2 inbox escalations store a static template draft rather than a verified model-synthesized draft. | Gate 1b (Fix 4) |
| `P1` | Runtime defaults to `InMemoryPortfolioRepository` until `PostgresPortfolioRepository` is wired in Gate 1c (unconditional demo seeding on boot removed in `OSR-04`). | Gate 1c (Fix 7) |
| `P2` | Drizzle schema lacks SQL migrations, `schema_info` startup check, and `PostgresPortfolioRepository` with `pgvector` + FTS Reciprocal Rank Fusion. | Gate 1c (Fix 7) |
| `P3` | Worker lacks standalone `pg-boss` entrypoint and real local ONNX (`bge-small-en-v1.5`) embedding persistence. | Gate 1c (Fix 8) |
| `F1` | Public web renderer (`apps/web`) is mounted in `server.ts` rather than decoupled via `/api/v1` client, and lacks `/build/:slug` and `/admin/*` sub-routes. | Gate 1c / G2 (Fix 8, `OSR-13`) |
| `F2` | `docker/Dockerfile.api` and `docker/Dockerfile.worker` referenced by `docker/docker-compose.hobbyist.yml` are not yet created. | Gate 1c / G2 (Fix 8, `OSR-16`) |
| `F3` | `/healthz` returns a constant callback instead of probing Postgres, `pg-boss` queue depth, disk free space, and backup age. | Gate 1c (Fix 8) |

## 3. Open P1 Findings (Target: Phase 2 Correctness & Privacy)

| ID | Plain-Language Defect Description | Target Fix |
| --- | --- | --- |
| `M3`–`M4` | Verifier missing entailment judge and query classifier defaulting to `lookup` instead of `advisory`. | Phase 2 (Fixes 14, 15) |
