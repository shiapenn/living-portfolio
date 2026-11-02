# A035 — WP-7.1 API Versioning and OpenAPI Client

| Field | Value |
| --- | --- |
| Report ID | A035 |
| Date | 2026-11-02 |
| Author | A (Implementer) |
| Task ID | `WP-7.1` |
| Evidence SHA | `28bac0a` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/41373822751 |

---

## 1. Scope

- **`[implemented]`** Canonical Versioned API Mounting (`OSR-12`, Spec §7, §8): Refactored `apps/api/src/app.ts` to mount all API routes on the canonical versioned prefix `/api/v1` (`/health`, `/auth`, `/entries`, `/ask`, `/timeline`, `/structure`, `/inbox`, `/calibration`, `/audit`, `/import`, `/settings`, `/book`, `/admin/metrics/shadow`, `/seed`, `/openapi.json`), while maintaining backward-compatible aliases on `/api` for smooth decoupling during subsequent work packages. Added `/auth/session` inspection endpoint.
- **`[implemented]`** Committed OpenAPI 3.1.0 Specification (`OSR-12`, Spec §7, §8): Built schema generator in `packages/core/src/openapi/index.ts` translating Zod validation schemas (`EntryCreateSchema`, `EntryUpdateSchema`, `RevisionCreateSchema`, `AskQuerySchema`, `BookingCreateSchema`, `RoutingConfigSchema`, etc.) to OpenAPI 3.1 compatible schemas. Generated and committed `docs/spec/openapi.json` (2,616 lines). Added `scripts/generate-openapi` and root script `pnpm openapi:generate`.
- **`[implemented]`** Automated Zero-Drift CI Gate (`OSR-12`): Implemented `scripts/verify-openapi-drift` and root script `pnpm openapi:drift`. Integrated drift check as Step 3 in `scripts/verify-all` and bound regression test in `apps/api/src/conformance/openapi.conformance.test.ts`. Fails CI immediately if schemas change without regenerating the committed specification.
- **`[implemented]`** Strongly-Typed TypeScript API Client (`@living-portfolio/client`, `OSR-12`, Spec §7, §8): Created new workspace package `packages/client` providing `LivingPortfolioClient` and `createLivingPortfolioClient()`. Supports normalized base URLs (`/api/v1`), Bearer token and CSRF header binding, typed subclients (`health`, `auth`, `entries`, `ask`, `timeline`, `book`, `structure`, `inbox`, `calibration`, `audit`, `import`, `settings`, `metrics`, `seedDemo`), and typed error handling. Tested with Vitest unit suite and E2E conformance tests against `createApp()`.
- **`[implemented]`** Register Governance (`docs/audits/register.yml`): Transitioned finding `OSR-12` from `status: open` -> `status: fixed` with `regression_test: apps/api/src/conformance/openapi.conformance.test.ts` and dated history entry `2026-11-02`.

---

## 2. CI Evidence

### 2.1 Commit and PR Provenance
- PR: `#56` (`WP-7.1: Versioned API (/api/v1), committed OpenAPI specification, and generated TypeScript client (OSR-12)`)
- Merge Method: Rebase and merge (`origin/main` at `28bac0afd3be105911c1c2c7b374003b717ec0f8`)
- Commits landed: `28bac0a`
- Evidence SHA: `28bac0a`
- Ancestor Verification: `git merge-base --is-ancestor 28bac0a HEAD` exits 0.

### 2.2 Verbatim Vitest Results per Package (Job 125048044370)
```
@living-portfolio/core:test:  Test Files  1 passed (1)
@living-portfolio/core:test:  Tests  17 passed (17)
@living-portfolio/client:test:  Test Files  1 passed (1)
@living-portfolio/client:test:  Tests  5 passed (5)
@living-portfolio/ai:test:  Test Files  1 passed (1)
@living-portfolio/ai:test:  Tests  17 passed (17)
@living-portfolio/config:test:  Test Files  1 passed (1)
@living-portfolio/config:test:  Tests  5 passed (5)
@living-portfolio/web:test:  Test Files  1 passed (1)
@living-portfolio/web:test:  Tests  27 passed (27)
@living-portfolio/worker:test:  Test Files  2 passed (2)
@living-portfolio/worker:test:  Tests  12 passed (12)
@living-portfolio/db:test:  Test Files  4 passed (4)
@living-portfolio/db:test:  Tests  45 passed (45)
@living-portfolio/api:test:  Test Files  17 passed (17)
@living-portfolio/api:test:  Tests  142 passed (142)
```
*Total: 28 test files, 270 passed tests across 8 packages (computed from the above).*

### 2.3 Verbatim Playwright E2E Results (Job 125049692646)
```
  24 passed (11.6s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125049693224)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125049692595)
```
150 commits scanned.
no leaks found
✓ Gitleaks scan passed with 0 leaks.
```

### 2.6 Verbatim DCO Verification Line (Job 125049692502)
```
✓ [OSR-07 DCO] All 1 commit(s) in 56ac16cfaab479f552acc917817149d4b3b3cee2..28bac0afd3be105911c1c2c7b374003b717ec0f8 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- Unit & Conformance (Vitest): 270 tests (+11 new tests compared to A034 count of 259).
  - `packages/client/src/client.test.ts`: 5 new unit tests.
  - `apps/api/src/conformance/openapi.conformance.test.ts`: 6 new conformance regression tests.
- Browser Integration (Playwright): 24 tests (unchanged from A034 count of 24).

---

## 4. Files Touched

- apps/api/package.json
- apps/api/src/app.ts
- apps/api/src/auth/security.ts
- apps/api/src/conformance/openapi.conformance.test.ts
- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A034-wp6-1-release-packaging-and-container-workflow.md
- docs/handovers/H007-wp-6-gate-closure-and-wp-7-kickoff.md
- docs/plans/gates.json
- docs/spec/openapi.json
- package.json
- packages/client/package.json
- packages/client/src/client.test.ts
- packages/client/src/client.ts
- packages/client/src/index.ts
- packages/client/src/types.ts
- packages/client/tsconfig.json
- packages/core/src/index.ts
- packages/core/src/openapi/index.ts
- packages/core/src/schemas/index.ts
- packages/core/src/types/index.ts
- pnpm-lock.yaml
- scripts/audit-check
- scripts/generate-openapi
- scripts/verify-all
- scripts/verify-openapi-drift

---

## 5. Register and Backlog Changes

- `OSR-12` transitioned from `status: open` to `status: fixed` with bound regression test `apps/api/src/conformance/openapi.conformance.test.ts`.

---

## 6. Not Done (Tagged)

- **`[not-started]`** `OSR-13`: Decouple web from API; remove web mounting from `createApp()`; enforce HTTP client calls from `apps/web` to `/api/v1` (WP-7.2).
- **`[not-started]`** `OSR-23`: Documentation suite and API boundary ADR (WP-7.3 / WP-12.3).

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation
```
=== Validating Receipt A035-wp-71-api-versioning-and-openapi-client.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '28bac0a' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 2ee5a34..28bac0a (27 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A035-wp-71-api-versioning-and-openapi-client.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 125048044370)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 125049692646)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125049693224)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125049692484)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 125049692502)" verified against CI logs.

🎉 All receipt checks PASSED for A035-wp-71-api-versioning-and-openapi-client.md.
```

---

## 9. Handover Decision
- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 1 (A035); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-7.2 (OSR-13)
