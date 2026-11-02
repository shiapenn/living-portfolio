# A042 — WP-9.2 Observability, Budget Caps and Spend Alerts

| Field | Value |
| --- | --- |
| Report ID | A042 |
| Date | 2026-11-02 |
| Author | A (Implementer) |
| Task ID | `WP-9.2 (OSR-21)` |
| Evidence SHA | `e2b7f04` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/41416306998 |

---

## 1. Scope

- 1. Provider budget governor limits, spend tracking, and rate limits per provider/model (§13.5, OSR-21) [implemented]
- 2. Sliding-window `MetricsCollector` in `apps/api/src/observability/metrics.ts` monitoring request counts, status codes, and 5xx error rates (§13.5, §13.9) [implemented]
- 3. Staged failure alerts: `BUDGET_SOFT_CAP` (at >= 80% spend with smaller model routing & context trimming) and `BUDGET_HARD_CAP` (at 100% spend falling back to extractive mode) (§10.8, §13.5) [implemented]
- 4. Provider 429 rate limit backoff alert (`PROVIDER_RATE_LIMITED`) and 24-hour jittered backoff tracking (§13.5) [implemented]
- 5. Elevated HTTP 5xx error rate alert (`HIGH_ERROR_RATE` severity critical) when 5xx errors exceed configurable threshold (§13.9) [implemented]
- 6. Subsystem observability integration in `GET /api/v1/health` and `GET /healthz` exposing measured metrics, provider utilization, and active alerts list [implemented]
- 7. Real provider utilization exposure in `GET /api/v1/settings` under `budgets.utilization` [implemented]
- 8. Notification listener adapter integration on governor and metrics collector dispatching alerts to configured notification channels (§13.9, OSR-21) [implemented]
- 9. Regression and staged failure conformance test suite in `apps/api/src/conformance/observability-alerts.conformance.test.ts` (12 tests passing) [implemented]
- 10. Finding `OSR-21` updated to `status: fixed` in `docs/audits/register.yml` [implemented]

---

## 2. CI Evidence

### 2.1 Build & Typecheck (Job 125180886286)

- Turbo build executed across all 8 packages (`@living-portfolio/config`, `@living-portfolio/core`, `@living-portfolio/client`, `@living-portfolio/ai`, `@living-portfolio/db`, `@living-portfolio/web`, `@living-portfolio/worker`, `@living-portfolio/api`).
- Pinned action verification confirmed 33/33 GitHub Action pins resolve upstream to valid immutable commit SHAs.
- Zero compilation errors, 0 type errors.

### 2.2 Verbatim Vitest Results per Package (Job 125180886286)

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
Test Files  23 passed (23)
Tests  199 passed (199)
```

*(Note: Total across workspaces computed from above: 35 test files passed, 338 tests passed).*

### 2.3 Verbatim Playwright E2E Results (Job 125180886989)

```
24 passed (15.8s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125180886374)

```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125180885674)

```
170 commits scanned.
no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 125180886286)

```
✓ [OSR-07 DCO] All 1 commit(s) in 781a7002940b5ec866c9b1277fb733cd70a32b79..e2b7f0482ea98ba4354ce2a8c78763a4e9ede1e7 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- Unit & Conformance (Vitest): 338 tests across 35 test files (net +12 tests and +1 test file over A041 count of 326 tests across 34 files from `apps/api/src/conformance/observability-alerts.conformance.test.ts`).
- Observability & Alert Conformance: All 12 tests in `apps/api/src/conformance/observability-alerts.conformance.test.ts` pass, verifying:
  - MetricsCollector tracks request counts, 5xx errors, 4xx errors, and 429 rate limits in a sliding window
  - Staged failure: 5xx error rate exceeding threshold fires `HIGH_ERROR_RATE` critical alert and marks `/healthz` degraded
  - Staged recovery: success traffic bringing error rate below threshold clears `HIGH_ERROR_RATE` alert
  - BudgetGovernor `getUtilization()` computes accurate utilization percentages and limit comparisons
  - Staged failure: spend reaching 80% soft threshold fires `BUDGET_SOFT_CAP` warning alert and triggers `smaller_model` routing
  - Staged failure: spend reaching 100% hard threshold fires `BUDGET_HARD_CAP` critical alert and degrades Ask flow to extractive mode
  - Staged failure: upstream 429 response enters 24-hour backoff, fires `PROVIDER_RATE_LIMITED` warning alert, and dispatches to notification channel
  - Initial healthy state exposes real measured metrics and empty alerts array without invented strings
  - Stale backup (> 24 hours) triggers `BACKUP_STALE` alert and marks `/healthz` status as degraded
  - Settings route `GET /api/v1/settings` exposes live provider utilization under `budgets.utilization`
- Browser Integration (Playwright): 24 tests (unchanged from A041 count of 24).
- Documentation & Process Conformance: All 70 registered documents validated with zero sequence gaps or checksum drift via `node scripts/docs-check` (`IAHP PROC-1`).

---

## 4. Files Touched

Matches `git diff --name-only 234a61a..e2b7f04` (12 files):
- `apps/api/src/app.ts`
- `apps/api/src/conformance/observability-alerts.conformance.test.ts`
- `apps/api/src/observability/metrics.ts`
- `apps/api/src/routes/health.ts`
- `apps/api/src/routes/settings.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A041-wp-91-real-backups-and-restore-drill.md`
- `packages/ai/src/governor/index.ts`
- `packages/client/src/types.ts`
- `packages/core/src/types/index.ts`

---

## 5. Register and Backlog Changes

- `OSR-21` marked `status: fixed` in `docs/audits/register.yml` (provider budget governor limits, spend tracking, rate limit backoff alerts, sliding-window error rate monitoring, soft/hard spend threshold alerts, and healthz observability integration).
- Register totals: 62 fixed, 0 partial, 35 open (P0: 0, P1: 18, P2: 14, P3: 3; 97 total).

---

## 6. Not Done (Tagged)

- WP-9.3 (`OSR-22` [P2]): Production deploy workflow with required reviewer, health gate, and auto-rollback [not-started]
- WP-9.4 (`P5` [P2]): Worker buildsToday counter UTC midnight reset and static artifact emission [not-started]
- WP-9.5: Work Package 9 Gate Closure & Handover Snapshot H010 [not-started]

---

## 7. Changes to Earlier Reports

- None. Historical receipts A001 through A041 and handovers H001 through H009 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A042-wp-92-observability-budget-caps-and-spend-alerts.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'e2b7f04' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 234a61a..e2b7f04 (12 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A042-wp-92-observability-budget-caps-and-spend-alerts.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 125180886286)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 125180886989)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125180886374)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125180885674)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 125180886286)" verified against CI logs.

🎉 All receipt checks PASSED for A042-wp-92-observability-budget-caps-and-spend-alerts.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 2 (A041, A042); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-9.3 (OSR-22 [P2] Production deploy workflow with required reviewer, health gate, and auto-rollback)
