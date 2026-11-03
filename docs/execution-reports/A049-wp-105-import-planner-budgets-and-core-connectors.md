# A049 — WP-10.5 Import Planner Budgets and Core Connectors

| Field | Value |
| --- | --- |
| Report ID | A049 |
| Date | 2026-11-03 |
| Author | A (Implementer) |
| Task ID | `WP-10.5 (M9)` |
| Evidence SHA | `6d5a6fc` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/41582828635 |

---

## 1. Scope

- 1. Implement import planner algorithm `planImport(documents, config)` in `@living-portfolio/core` evaluating configured daily token and audio second budgets, calculating item counts, token estimates, multi-day free ETAs, and paid fast options ("Finish in minutes for ~$X") (§4, §13.6, Finding M9, Fix 21) [implemented]
- 2. Implement resumable per-document import job engine with database persistence and granular checkpointing (`importJobs` schema, `createImportJob`, `getImportJob`, `updateImportJob`) surviving interruptions, crashes, and page reloads (§13.6, Fix 21) [implemented]
- 3. Expose import planner and job endpoints in `apps/api/src/routes/import.ts` (`POST /api/import/plan`, `POST /api/import/jobs`, `GET /api/import/jobs/:id`, `POST /api/import/jobs/:id/resume`, `POST /api/import/jobs/:id/pause`) [implemented]
- 4. Implement core source connectors (`GitHubConnector`, `RSSConnector`, `FileDropConnector`) implementing `SourceConnector` SDK interface with declared permissions, crawl methods yielding `ImportedAsset`, and `inferTemporalConfidence` (§14, Fix 21) [implemented]
- 5. Implement concrete notification channel adapters (`NtfyNotificationChannel`, `TelegramNotificationChannel`, `WebhookNotificationChannel`, `EmailNotificationChannel`) implementing `NotificationChannel` SDK interface with live dispatch and test delivery (§13.9, §14, Fix 21) [implemented]
- 6. Expose connector and notification test endpoints in `apps/api/src/routes/import.ts` and `apps/api/src/routes/settings.ts`, preserving 501 `SIMULATED(M1)` default backward compatibility while enabling live adapter delivery via `?live=true` [implemented]
- 7. Add unit tests (5 in `packages/core/src/algorithms/algorithms.test.ts`) and conformance tests (4 in `apps/api/src/conformance/m9-import-planner-connectors.conformance.test.ts`) covering planner budget enforcement, resumable checkpointing, source connector crawl and permissions, and notification dispatch [implemented]
- 8. Mark finding `M9` as `status: fixed` in `docs/audits/register.yml` and update Spec sections 13.6 and 14 to `status: implemented` in `docs/audits/conformance.yml` [implemented]

---

## 2. CI Evidence

### 2.1 Build & Typecheck (Job 125741341154)

- Turbo build executed cleanly across all 8 packages (`@living-portfolio/config`, `@living-portfolio/core`, `@living-portfolio/client`, `@living-portfolio/ai`, `@living-portfolio/db`, `@living-portfolio/web`, `@living-portfolio/worker`, `@living-portfolio/api`).
- Pinned action verification confirmed 38/38 GitHub Action pins resolve upstream to valid immutable commit SHAs.
- Zero compilation errors, 0 type errors.

### 2.2 Verbatim Vitest Results per Package (Job 125741341154)

```
Test Files  1 passed (1)
Tests  24 passed (24)
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  33 passed (33)
Test Files  1 passed (1)
Tests  28 passed (28)
Test Files  2 passed (2)
Tests  16 passed (16)
Test Files  5 passed (5)
Tests  54 passed (54)
Test Files  29 passed (29)
Tests  243 passed (243)
```

*(Note: Total across workspaces: 41 test files passed, 408 passed | 1 skipped, 409 tests).*

### 2.3 Verbatim Playwright E2E Results (Job 125741341499)

```
24 passed (10.9s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125741341055)

```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125741340548)

```
187 commits scanned.
```

### 2.6 Verbatim DCO Verification Line (Job 125741341154)

```
✓ [OSR-07 DCO] All 1 commit(s) in c3686dd817f361c3b8b8c25c8153f3f7d0661442..6d5a6fc91b85520182ec2a1e1680ee68b39d5800 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- **Unit Tests (`packages/core/src/algorithms/algorithms.test.ts`):** 5 new tests added (increasing `packages/core` test suite from 28 to 33 tests):
  - `calculates token estimates, ETAs within daily budgets, and paid fast options`: verifies character-to-token projection, multi-day free ETA under constrained quotas, and dollar-estimate paid option.
  - `handles audio files converting seconds into quotas and estimates`: verifies audio second tracking against daily allowances.
  - `GitHubConnector exposes permissions and crawls commits/releases`: verifies declared permissions and synthetic crawling yielding `ImportedAsset` records with temporal confidence.
  - `RSSConnector and FileDropConnector expose permissions and crawl content`: verifies connector permissions and mock parsing of feed items and dropped markdown/text files.
  - `Concrete notification channels send alerts and test connections`: verifies `send()` and `test()` on `NtfyNotificationChannel`, `TelegramNotificationChannel`, and `WebhookNotificationChannel`.
- **Conformance Tests (`apps/api/src/conformance/m9-import-planner-connectors.conformance.test.ts`):** 4 new conformance tests added (increasing `apps/api` test suite from 239 to 243 tests):
  - `POST /api/import/plan enforces configured budgets and provides document preview (§13.6, Fix 21)`: verifies planner endpoint calculations against daily token and audio quotas.
  - `Resumable import jobs checkpoint per document and survive interruptions (§13.6, Fix 21)`: verifies job creation, per-document checkpointing, pausing, and resuming only uncheckpointed documents.
  - `Core source connectors expose declared permissions and crawl imported assets (§14, Fix 21)`: verifies connector catalog endpoint and crawling execution.
  - `Concrete notification adapters send and test delivery across channels (§13.9, §14, Fix 21)`: verifies adapter test invocations via `POST /api/settings/notifications/test?live=true` across `ntfy`, `telegram`, `email`, and `webhook`.
- **Browser Integration (Playwright):** 24 tests passed in 10.9s.
- **Documentation & Process Conformance:** All 78 registered documents validated with zero sequence gaps or checksum drift via `node scripts/docs-check` (`IAHP PROC-1`).

---

## 4. Files Touched

Matches `git diff --name-only 04793fa..6d5a6fc` (19 files):
- `apps/api/src/conformance/m9-import-planner-connectors.conformance.test.ts`
- `apps/api/src/routes/import.ts`
- `apps/api/src/routes/settings.ts`
- `docs/INDEX.md`
- `docs/audits/conformance.yml`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A048-wp-104-dynamic-topology-audit-and-staleness.md`
- `packages/core/src/algorithms/algorithms.test.ts`
- `packages/core/src/algorithms/importPlanner.ts`
- `packages/core/src/index.ts`
- `packages/core/src/sdk/connectors.ts`
- `packages/core/src/sdk/index.ts`
- `packages/core/src/sdk/notifications.ts`
- `packages/core/src/types/index.ts`
- `packages/db/src/dual-write-repository.ts`
- `packages/db/src/postgres-repository.ts`
- `packages/db/src/repository.ts`
- `packages/db/src/schema/index.ts`

---

## 5. Register and Backlog Changes

- `M9` marked `status: fixed` in `docs/audits/register.yml` (Import planner budget enforcement `planImport`, resumable per-document import jobs with checkpointing, core source connectors `GitHubConnector`, `RSSConnector`, `FileDropConnector`, and concrete notification adapters `NtfyNotificationChannel`, `TelegramNotificationChannel`, `WebhookNotificationChannel`, `EmailNotificationChannel` [§4, §13.6, §14, Fix 21]).
- Section `13.6` marked `status: implemented` in `docs/audits/conformance.yml`.
- Section `14` marked `status: implemented` in `docs/audits/conformance.yml`.
- Register totals: 70 fixed, 0 partial, 27 open (P0: 0, P1: 16, P2: 8, P3: 3; 97 total).

---

## 6. Not Done (Tagged)

- WP-10.6: Labeled evaluation runner, chaos/Playwright/axe test suites, and CI supply-chain checks (M11 [P3]) [not-started]
- WP-10.7: Work Package 10 Gate Closure & Handover Snapshot H011 [not-started]

---

## 7. Changes to Earlier Reports

- None. Historical reports A001–A048 and handovers H001–H010 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A049-wp-105-import-planner-budgets-and-core-connectors.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '6d5a6fc' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 04793fa..6d5a6fc (19 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A049-wp-105-import-planner-budgets-and-core-connectors.md.
Found 5 section(s) marked verbatim.

✓ [CI-MATCH: 2.2] Vitest line matched verbatim in Job 125741341154 log:
    Test Files  1 passed (1)
✓ [CI-MATCH: 2.3] Playwright line matched verbatim in Job 125741341499 log:
    24 passed (10.9s)
✓ [CI-MATCH: 2.4] SARIF gate line matched verbatim in Job 125741341055 log:
    ✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
✓ [CI-MATCH: 2.5] Gitleaks line matched verbatim in Job 125741340548 log:
    187 commits scanned.
✓ [CI-MATCH: 2.6] DCO line matched verbatim in Job 125741341154 log:
    ✓ [OSR-07 DCO] All 1 commit(s) in c3686dd817f361c3b8b8c25c8153f3f7d0661442..6d5a6fc91b85520182ec2a1e1680ee68b39d5800 carry a valid Signed-off-by trailer.

🎉 All receipt checks PASSED for A049-wp-105-import-planner-budgets-and-core-connectors.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 1 (A049); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-10.6 (M11 [P3]: Labeled evaluation runner, chaos/Playwright/axe test suites, and CI supply-chain checks)
