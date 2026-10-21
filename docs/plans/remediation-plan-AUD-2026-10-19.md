# Optimization & Remediation Plan (`AUD-2026-10-19` & `OSR-001`)

| Field | Value |
| --- | --- |
| Document ID | `PLAN-AUD-2026-10-19` |
| Version | 1.1 |
| Date | 19 October 2026 |
| Status | Active — Gate 1a & OSR G0/G1 In-Repo Tasks Claimed Complete |
| Repository Path | `docs/plans/remediation-plan-AUD-2026-10-19.md` |
| Related Documents | [`AUD-2026-10-19`](../audits/2026-10-19-independent-technical-audit/report.md), [`DR-AUD-001`](../governance/DR-AUD-001.md), [`OSR-001`](./osr-001-open-source-release.md), [`register.yml`](../audits/register.yml) |

---

## Changelog (`A.1`)

| Version | Date | Author | Summary of Changes |
| --- | --- | --- | --- |
| 1.0 | 2026-10-19 | A | Initial 4-phase optimization & remediation plan covering all 29 §5 findings (`S1`–`S7`, `G1`–`G8`, `B1`–`B4`, `P1`–`P6`, `F1`–`F4`), 11 matrix findings (`M1`–`M11`), and 26 prioritized fixes (`Fix 1`–`Fix 26`). |
| 1.1 | 2026-10-19 | A | Applied auditor review amendments (`A.1`–`A.3`, `B.1`–`B.6`, `C.1`–`C.12`, `D.1`–`D.4`) and integrated concurrent Open-Source Release gates `G0` and `G1` (`OSR-01`–`OSR-11`). Completed Gate 1a (`Fixes 1, 2, 5, 6`) and G0/G1 repository tasks (`OSR-01`–`OSR-11`). |
| 1.2 | 2026-10-21 | A | Staged Gate 1b+ (Fix 4 + UX P0-1, P0-2, P0-3, P0-9) and aligned with AUD-2026-10-20 UX findings: G2 alpha (`P0-4`, `P0-5`, `P0-7`, route trees inside `OSR-13`), before G4 (`P0-6`, `P0-8`, `P0-10`, `P0-11`), v0.2 (`P1`), and before G5 (`P2`). Clarified that `OSR-13` means HTTP decoupling, not Astro/React migration. Each fix merges with its Playwright spec. |

---

## 1. Phase & Gate Sequencing (`C.1`, `C.2`, `C.10`, `OSR-001` §2.1, AUD-2026-10-20)

> **Release Readiness Rule (`C.10` & `OSR-001` §1.4):** Closing all P0 findings is necessary but **not sufficient** for `v0.1.0` (Spec §20 also requires a passing encrypted backup/restore drill, interactive setup wizard, import planner, rich editor, concrete notifications, and direct-upload publishing). The Phase 1 deliverable is therefore a **pre-release (`v0.1.0-alpha.1` / `v0.1.0-rc`)** governed by the alpha warning and synthetic-data rules in `OSR-001` §1.4.
>
> **Decoupling Architecture Note (`OSR-13`):** `OSR-13` represents strict HTTP API decoupling between the web layer and API server (`/api/v1`), **not** an Astro/React framework migration. Each remediation fix merges alongside its corresponding Playwright spec (per Spec §18.1 and AUD-2026-10-20 Appendix B).

| Phase / Gate | OSR Stage Gate | Scope (Prioritized Fixes & UX Roadmap Items) | Findings / Tasks Addressed | Current Status |
| --- | --- | --- | --- | --- |
| **Phase 0** | — | **Fix 3** (`SIMULATED(...)` `501` gate), **Fix 25** (P0 conformance probes & `scripts/audit-check`) | `M1`, `AUD-01`–`AUD-23`, `D.1`–`D.4` | **Claimed Fixed** (`verified_by: null`) |
| **Gate 1a** | **G0 + G1 (Part 1)** | **Fixes 1, 2, 5, 6** + **OSR-01..OSR-11** (Auth, setup flow, CSRF, login throttling, revocable Bearer tokens, structural visibility, signed `redactionPreviewToken`, XSS/URL sanitization, hashed IP rate limit, CORS/CSP, `@living-portfolio/config`, clean baseline, governance & rulesets) | `S1`, `S2`, `S3`, `S4`, `S5`, `S6`, `OSR-01`–`OSR-11` | **Claimed Fixed** (`verified_by: null`) |
| **Gate 1b+** | **G1 (Pre-Public)** | **Fix 4** (`/api/ask` safety: `G1`–`G7`) + **UX P0-1, P0-2, P0-3, P0-9** (Login page, first-run wizard, removal of every default token, admin `apiClient` with CSRF & `res.ok` check, server-side publish gate, expanded scanner, removal of hardcoded status cards & honest `healthz`) | `S1`, `S2`, `G1`–`G7`, `20261020-UX-01`, `20261020-UX-02`, `20261020-UX-03`, `20261020-UX-05` | **Claimed Fixed** (`verified_by: null`) |
| **Gate 1c** | **G2 (`v0.1.0-alpha.1`)** | **Fixes 7, 8** + **OSR-12..OSR-16** + **UX P0-4, P0-5, P0-7** (Postgres + `pgvector`, migrations, `pg-boss` worker, ONNX embeddings, route trees and HTTP decoupling inside `OSR-13`, Markdown fidelity, structured text view; merges with Playwright specs) | `P1`, `P2`, `P3`, `F1`–`F3`, `20261020-UX-04`, `20261020-UX-07`, `OSR-12`–`OSR-16` | Planned (`open`) |
| **Phase 2 (Pre-G4)** | **Before G4** | **UX P0-6, P0-8, P0-10, P0-11** + **Fixes 9–15** + **OSR-17..OSR-19** (Triage keyboard UX, structure review inspector, booking confirmation, time-travel site-wide mode; bitemporal time, revision immutability, BudgetGovernor owner reserve, privacy router) | `20261020-UX-06`, `20261020-UX-08`, `20261020-UX-10`, `20261020-UX-11`, `P4`, `P6`, `G8`, `B1`–`B4`, `M2`–`M4`, `S7`, `OSR-17`–`OSR-19` | Planned (`open`) |
| **Phase 3 (v0.2)** | **v0.2** | **UX P1 Findings** (Structural & information-architecture refactoring: import triage, visitor ask states, axe accessibility on all routes) | `20261020-UX-12`–`16`, `20261020-UI-01`–`06` | Planned (`open`) |
| **Phase 4 (Pre-G5)** | **Before G5 (`v0.1.0`)** | **UX P2 Findings** (Visual polish, token architecture, micro-interactions, copy linting) + **Fixes 16–24, 26** + **OSR-20..OSR-23** | `20261020-UI-07`–`10`, `20261020-CP-01`–`07`, `M5`–`M11`, `P5`, `F4`, `OSR-20`–`OSR-23` | Planned (`open`) |

---

## 2. Detailed Technical Specifications for Amended Controls (`C.3`–`C.9`, `C.12`)

### 2.1 Gate 1a: Authentication, Visibility & Edge Security (`Fixes 1, 2, 5, 6`, `C.3`, `C.4`, `C.9`)

1. **First-Run Admin Setup, Login Throttling, CSRF & Revocable Tokens (`C.3`, [`apps/api/src/auth/security.ts`](../../apps/api/src/auth/security.ts)):**
   - `POST /api/auth/setup`: One-time bootstrap endpoint setting the owner's `scrypt`-hashed password (`salt:hash`) and 20-byte RFC 6238 TOTP secret; returns `409 Conflict` on subsequent calls.
   - `POST /api/auth/login`: Verifies password (`timingSafeEqual`) + TOTP code (`±1` 30-second window). Enforces IP-keyed login throttling (**max 5 failed attempts per 15-minute window -> `429 Too Many Requests`**). Issues an `HttpOnly; SameSite=Strict; Path=/` session cookie (`lp_session`) and a paired `X-CSRF-Token`.
   - **CSRF Protection:** Cookie-authenticated state-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) MUST supply a matching `X-CSRF-Token` header or are rejected with `403 Forbidden`.
   - **Hashed, Revocable Bearer Tokens:** `POST /api/auth/tokens` issues `lp_pat_<random>` tokens stored only as SHA-256 hashes (`tokenHash`); `DELETE /api/auth/tokens/:id` immediately sets `revokedAt` and invalidates the token.
2. **Signed `redactionPreviewToken` (`C.4`, [`apps/api/src/auth/security.ts`](../../apps/api/src/auth/security.ts)):**
   - Publishing an entry (`visibility: 'public'`) via `POST /api/entries`, `PUT /api/entries/:id`, or `POST /api/import/batch` (`publishAsIs: true`) requires an HMAC-SHA256 signed token issued by `POST /api/entries/redaction-preview` bound to `{ entryId, bodyHash, scanHash, exp }` (15-minute expiry). Boolean flags are rejected when confidential patterns exist, and mismatched `entryId` or `bodyHash` payloads fail with `400 Bad Request`.
3. **Structural Visibility Filtering (`Fix 2`, [`packages/db/src/repository.ts`](../../packages/db/src/repository.ts)):**
   - `getEntry(id, allowedVisibilities?)` and `getEntryBySlug(slug, allowedVisibilities?)` filter by `allowedVisibilities` at the repository query layer. Public callers pass `['public', 'unlisted']` for slug lookups and `['public']` for list/retrieval queries.
4. **Kill-Switch & Routing Settings Behind Auth (`C.9`, [`apps/api/src/routes/settings.ts`](../../apps/api/src/routes/settings.ts)):**
   - `PATCH /api/settings/routing` (`automatedAnsweringEnabled: false`) remains live behind `auth.requireAdminMiddleware()`, immediately switching `/api/ask` into `disabled` handoff mode.

### 2.2 Gate 1b: `/api/ask` Gate, Routing & Verification (`Fix 4`, `C.5`, `C.7`)

1. **Entry-Side Unknown Facets (`G1`):** In `checkGate`, if a required hard facet (`domainConfig.hardFacets`) is present on the visitor query (`queryVal !== 'unknown'`) but missing or unconfirmed on the entry (`!entryVal || entryVal === 'unknown'`), return `{ status: 'INDETERMINATE', reason: ... }` instead of `continue`.
2. **Dynamic Routing Inputs & Confirmed Scoped Constraints (`G2`, `G3`, `G4`):** Load confirmed `scoped_constraints`, `claims`, and `evidence` from the repository in `/api/ask`, compute `hasEvidence`, `hasVerifiedEvidence`, `outcomeStatus`, and `hasScope` from the retrieved entry records, and load `hardFacets` from domain configuration.
3. **Time-Travel Anachronism Downgrade (`G5`, `C.5`):** When `verifyAnswerBeforeDelivery` detects an anachronistic year (`year > asOfYear`), do **not** strip individual sentences and deliver at Tier 1; instead **downgrade the response to the extractive answer (`tier: 'extractive'`)**. Document that the 4-digit year regex is a **partial control** supplemented by bitemporal retrieval filtering (`written_at <= t_q` and `valid_from <= t_q`) and the entailment verifier.
4. **Entailment Verifier & Labeled Test Set (`M3`, `C.7`):** Route an LLM entailment judge prompt through `BudgetGovernor` (`selectProviderForDataClass('public', ...)`), falling back deterministically to extractive citation overlap when budget or provider is unavailable, backed by a labeled test fixture (`packages/ai/src/verification/fixtures/entailment-cases.json`).
5. **Single-Turn Missing Context (`G6`) & Verified Tier 2 Draft (`G7`):** When `gateResult.status === 'INDETERMINATE'` and the visitor has not yet been prompted for missing facets in the session, return `tier: 'needs_context'` with `missingFacets` once before escalating; synthesize Tier 2 inbox drafts via the model + `verifyAnswerBeforeDelivery`.

### 2.3 Gate 1c & Phase 2: Persistence, Provenance & Real-Component CI (`Fixes 7–15`, `C.6`, `C.8`, `C.12`)

1. **Bitemporal `written_at` & Seed Fixture Override (`P4`, `C.6`):** `createEntry` and `createRevision` always set `written_at = now()` on API paths; `seedDemoPortfolio` uses a repository-internal fixture option (`_fixtureProvenanceOverride?: { written_at: string; source: 'seed-fixture' }`) never exposed through any HTTP schema or route.
2. **Postgres-Persisted `BudgetGovernor` Ledger (`B1`–`B4`, `C.8`):** Persist daily token buckets (`visitor_tokens`, `owner_tokens`, `background_tokens`) and UTC midnight resets in PostgreSQL (`governor_ledger` table), reserving >=20% capacity for `owner-interactive` calls.
3. **Real-Component CI Lanes (`C.12`, `OSR-15`):** Add a PostgreSQL 16 + `pgvector` service container and real `onnxruntime-node` (`bge-small-en-v1.5`) integration test lane in `.github/workflows/ci.yml`.

---

## 3. Full Traceability Matrix (`C.11`)

| Fix # | Finding / Task IDs | P0 Probe Turned Green | Regression Test File | Target Gate |
| --- | --- | --- | --- | --- |
| **Fix 1** | `S1`, `S2` | `S1`, `S2` | `apps/api/src/conformance/p0-probes.conformance.test.ts`, `apps/api/src/api.test.ts` | **Gate 1a (Done — Claimed)** |
| **Fix 2** | `S1`, `S2` | `S1`, `S2` | `apps/api/src/conformance/p0-probes.conformance.test.ts`, `apps/api/src/api.test.ts` | **Gate 1a (Done — Claimed)** |
| **Fix 3** | `M1` | — | `apps/api/src/conformance/simulated-501.test.ts` | **Phase 0 (Done — Claimed)** |
| **Fix 4** | `G1`–`G7`, `M3`, `M4` | `G1`, `G5` | `apps/api/src/conformance/p0-probes.conformance.test.ts` | **Gate 1b** |
| **Fix 5** | `S3`, `S6` | `S3`, `S6` | `apps/api/src/conformance/p0-probes.conformance.test.ts` | **Gate 1a (Done — Claimed)** |
| **Fix 6** | `S4`, `S5` | `S4`, `S5` | `apps/api/src/conformance/p0-probes.conformance.test.ts` | **Gate 1a (Done — Claimed)** |
| **Fix 7** | `P1`, `P2` | — | `apps/api/src/conformance/p0-probes.conformance.test.ts` | **Gate 1c (G2)** |
| **Fix 8** | `P3`, `F1`, `F2`, `F3` | `F2` | `apps/api/src/conformance/p0-probes.conformance.test.ts` | **Gate 1c (G2)** |
| **Fix 9** | `P4`, `P6` | — | `packages/core/src/algorithms.test.ts`, `apps/api/src/api.test.ts` | **Phase 2 (G3)** |
| **Fix 10** | `P2`, `P3` | — | `packages/db/src/postgres.test.ts` | **Gate 1c / Phase 2** |
| **Fix 11** | `G8`, `B1`–`B4` | — | `packages/ai/src/ai.test.ts` | **Phase 2 (G3)** |
| **Fix 12** | `M2` | — | `apps/api/src/api.test.ts` | **Phase 2 (G3)** |
| **Fix 13** | `S7` | — | `apps/worker/src/worker.test.ts` | **Phase 2 (G3)** |
| **Fix 14** | `G5`, `M3` | `G5` | `packages/ai/src/ai.test.ts` | **Gate 1b / Phase 2** |
| **Fix 15** | `G6`, `M4` | — | `apps/api/src/api.test.ts` | **Gate 1b / Phase 2** |
| **Fix 16** | `M5` | — | `packages/core/src/algorithms.test.ts` | **Phase 3 (G4)** |
| **Fix 17** | `M6` | — | `apps/api/src/api.test.ts` | **Phase 3 (G4)** |
| **Fix 18** | `M7` | — | `packages/core/src/algorithms.test.ts` | **Phase 3 (G4)** |
| **Fix 19** | `P5` | — | `apps/worker/src/worker.test.ts` | **Phase 3 (G4)** |
| **Fix 20** | `M8` | — | `apps/worker/src/worker.test.ts` | **Phase 3 (G4)** |
| **Fix 21** | `M9` | — | `apps/api/src/api.test.ts` | **Phase 3 (G4)** |
| **Fix 22** | `F4` | — | `apps/web/src/web.test.ts` | **Phase 3 (G4)** |
| **Fix 23** | `M10`, `OSR-06` | — | `scripts/audit-check` | **Gate G0 (Done — Claimed)** |
| **Fix 24** | `M10`, `OSR-23` | — | `scripts/audit-check` | **Gate G2 / G4** |
| **Fix 25** | `M11`, `OSR-07` | — | `apps/api/src/conformance/p0-probes.conformance.test.ts` | **Phase 0 / G0 (Partial)** |
| **Fix 26** | `M11` | — | `packages/ai/src/evaluation.test.ts` | **Phase 3 (G4)** |
| **OSR-01..11** | `OSR-01`–`OSR-11` | — | `packages/config/src/config.test.ts`, `scripts/hardcode-check`, `scripts/dco-check`, `scripts/audit-check` | **Gates G0 & G1 (Done — Claimed)** |
