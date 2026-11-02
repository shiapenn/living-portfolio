# A043 — WP-9.3 Production Deploy Workflow, Health Gate and Auto-Rollback

| Field | Value |
| --- | --- |
| Report ID | A043 |
| Date | 2026-11-02 |
| Author | A (Implementer) |
| Task ID | `WP-9.3 (OSR-22)` |
| Evidence SHA | `1636732` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/41420322087 |

---

## 1. Scope

- 1. Declarative production Render blueprint in `deploy/render/render.production.yaml` specifying decoupled services (`living-portfolio-web-prod`, `living-portfolio-api-prod`, `living-portfolio-worker-prod`) with `DEPLOYMENT_CLASS=production`, native `/healthz` check endpoints, and managed PostgreSQL 16 database (`portfolio_production`) with `pgvector` (§13.1, §19, OSR-22) [implemented]
- 2. Continuous deployment and automated rollback CLI in `scripts/deploy-with-rollback` enforcing immutable SHA-256 container image digests, issuing scoped provider deploy hooks, polling API (`/healthz` and `/api/v1/health`) and Web (`/healthz`) endpoints across a 120s timeout window, and automatically triggering rollback to previous healthy image digests when health gates fail [implemented]
- 3. Production continuous deployment workflow in `.github/workflows/deploy-production.yml` targeting the `production` environment with required reviewer manual approval, concurrency control, pinned action SHAs, and scoped production secrets [implemented]
- 4. Staging rollback drill proof integration in `.github/workflows/deploy-staging.yml` exposing `trigger_rollback_drill` workflow dispatch input and drill step to prove automated rollback recovery in staging without risking production availability [implemented]
- 5. Operational runbooks updated in `deploy/render/README.md` documenting production architecture, required reviewer protection, health gate verification, and auto-rollback protocol [implemented]
- 6. Comprehensive conformance regression suite in `apps/api/src/conformance/production-deploy.conformance.test.ts` (24 tests passing) covering blueprint verification, workflow protection, digest pinning, health gate evaluation, staged failure auto-rollback, and staging drill proof [implemented]
- 7. Finding `OSR-22` updated to `status: fixed` in `docs/audits/register.yml` [implemented]

---

## 2. CI Evidence

### 2.1 Build & Typecheck (Job 125194038977)

- Turbo build executed cleanly across all 8 packages (`@living-portfolio/config`, `@living-portfolio/core`, `@living-portfolio/client`, `@living-portfolio/ai`, `@living-portfolio/db`, `@living-portfolio/web`, `@living-portfolio/worker`, `@living-portfolio/api`).
- Pinned action verification confirmed 33/33 GitHub Action pins resolve upstream to valid immutable commit SHAs.
- Zero compilation errors, 0 type errors.

### 2.2 Verbatim Vitest Results per Package (Job 125194038977)

```
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  17 passed (17)
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  17 passed (17)
Test Files  1 passed (1)
Tests  28 passed (28)
Test Files  2 passed (2)
Tests  13 passed (13)
Test Files  5 passed (5)
Tests  54 passed (54)
Test Files  24 passed (24)
Tests  223 passed (223)
```

*(Note: Total across workspaces: 36 test files passed, 362 tests passed).*

### 2.3 Verbatim Playwright E2E Results (Job 125194039339)

```
24 passed (12.6s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125194038996)

```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125194039465)

```
173 commits scanned.
no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 125194038977)

```
✓ [OSR-07 DCO] All 1 commit(s) in a3591825d0a2236f57eeaacc96401db5db0939c5..16367322d61a2feab55f72a94702f577cfde4c9b carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- Unit & Conformance (Vitest): 362 tests across 36 test files (net +24 tests and +1 test file over A042 count of 338 tests across 35 files from `apps/api/src/conformance/production-deploy.conformance.test.ts`).
- Production Deploy & Rollback Conformance: All 24 tests in `apps/api/src/conformance/production-deploy.conformance.test.ts` pass, verifying:
  - Declarative production Render blueprint (`deploy/render/render.production.yaml`) specifies all 4 services and PostgreSQL 16 `portfolio_production`
  - All production services declare `DEPLOYMENT_CLASS=production` and `/healthz` probes
  - Production deploy workflow (`.github/workflows/deploy-production.yml`) targets `environment: production` with required reviewer protection
  - Production deploy workflow restricts concurrency and triggers on releases and workflow dispatch
  - Workflow pins all action references to full 40-character commit SHAs
  - Invokes `scripts/deploy-with-rollback` with scoped secrets
  - Digest validation strictly accepts `@sha256:...` digests and rejects mutable `:latest` tags
  - Trigger hook correctly passes `?imgURL=` parameter and handles network errors
  - Health gate probe validates API `/healthz`, `/api/v1/health`, and Web `/healthz`
  - Health gate detects degraded and 500 error responses
  - Happy path deployment succeeds with exit code 0
  - Staged deployment failure triggers immediate automated rollback to previous healthy digests and restores cluster health (exit code 1)
  - Staging rollback drill proof (`simulateFailure=true`) cleanly proves rollback execution
  - Mutable image tags are rejected before any deployment is triggered
  - Staging workflow exposes `trigger_rollback_drill` input and step
  - Documentation in `deploy/render/README.md` details production deployment, review, and rollback runbooks
- Browser Integration (Playwright): 24 tests (unchanged from A042 count of 24).
- Documentation & Process Conformance: All 71 registered documents validated with zero sequence gaps or checksum drift via `node scripts/docs-check` (`IAHP PROC-1`).

---

## 4. Files Touched

Matches `git diff --name-only e2b7f04..1636732` (11 files):
- `.github/workflows/deploy-production.yml`
- `.github/workflows/deploy-staging.yml`
- `apps/api/src/conformance/production-deploy.conformance.test.ts`
- `deploy/render/README.md`
- `deploy/render/render.production.yaml`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A042-wp-92-observability-budget-caps-and-spend-alerts.md`
- `package.json`
- `scripts/deploy-with-rollback`

---

## 5. Register and Backlog Changes

- `OSR-22` marked `status: fixed` in `docs/audits/register.yml` (production deploy workflow with required reviewer, health gate, auto-rollback to previous healthy digests, production blueprint, and staging rollback drill proof).
- Register totals: 63 fixed, 0 partial, 34 open (P0: 0, P1: 18, P2: 13, P3: 3; 97 total).

---

## 6. Not Done (Tagged)

- WP-9.4 (`P5` [P2]): Worker buildsToday counter UTC midnight reset and static artifact emission [not-started]
- WP-9.5: Work Package 9 Gate Closure & Handover Snapshot H010 [not-started]

---

## 7. Changes to Earlier Reports

- None. Historical receipts A001 through A042 and handovers H001 through H009 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A043-wp-93-production-deploy-and-auto-rollback.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '1636732' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff e2b7f04..1636732 (11 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A043-wp-93-production-deploy-and-auto-rollback.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 125194038977)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 125194039339)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125194038996)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125194039465)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 125194038977)" verified against CI logs.

🎉 All receipt checks PASSED for A043-wp-93-production-deploy-and-auto-rollback.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 3 (A041, A042, A043); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-9.4 (P5 [P2] Worker buildsToday counter UTC midnight reset and static artifact emission)
