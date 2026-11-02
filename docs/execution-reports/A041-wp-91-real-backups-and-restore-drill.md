# A041 — WP-9.1 Real Backups and Restore Drill

| Field | Value |
| --- | --- |
| Report ID | A041 |
| Date | 2026-11-02 |
| Author | A (Implementer) |
| Task ID | `WP-9.1 (OSR-20 / M8)` |
| Evidence SHA | `234a61a` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/41411778887 |

---

## 1. Scope

- 1. Automated age-encrypted database backups with SHA-256 integrity sidecars (§13.9, OSR-20, M8) [implemented]
- 2. Automated scratch-container restore drill decrypting archive, validating payload SHA-256 against metadata sidecar, and restoring entries and chunks into isolated scratch database/repository (§13.9, §18.1, OSR-20) [implemented]
- 3. Configurable retention policy enforcement (7 daily, 4 weekly, 6 monthly threshold quotas) (§13.9) [implemented]
- 4. Backup freshness checking and `BACKUP_STALE` alerts when latest backup age exceeds 24 hours (§13.9, OSR-20) [implemented]
- 5. Real backup & restore execution in `PortfolioWorker.runBackupAndRestoreDrillJob(options)` while maintaining honest 501 `SIMULATED(M1)` when unconfigured (§13.9, OSR-20) [implemented]
- 6. HTTP API integration in `POST /api/v1/settings/backups/run-drill`, `GET /api/v1/settings`, and `GET /api/v1/health` reporting measured freshness, last backup timestamp, and last restore status [implemented]
- 7. Standalone CLI tools `scripts/backup-db` and `scripts/restore-drill` mapped to root `pnpm db:backup` and `pnpm db:restore-drill` [implemented]
- 8. Dedicated GitHub Actions workflow `.github/workflows/backup-restore-drill.yml` running on nightly schedule (`0 2 * * *`) and workflow dispatch with PostgreSQL 16 + pgvector container [implemented]
- 9. Regression & conformance test suite in `apps/api/src/conformance/backup-restore.conformance.test.ts` (11 tests passing) and `packages/db/src/backup/backup.test.ts` (9 tests passing) [implemented]
- 10. Finding `OSR-20` and `M8` updated to `status: fixed` in `docs/audits/register.yml` [implemented]

---

## 2. CI Evidence

### 2.1 Build & Typecheck (Job 125166652363)

- Turbo build executed across all 8 packages (`@living-portfolio/config`, `@living-portfolio/core`, `@living-portfolio/client`, `@living-portfolio/ai`, `@living-portfolio/db`, `@living-portfolio/web`, `@living-portfolio/worker`, `@living-portfolio/api`).
- Pinned action verification confirmed 33/33 GitHub Action pins resolve upstream to valid immutable commit SHAs.
- Zero compilation errors, 0 type errors.

### 2.2 Verbatim Vitest Results per Package (Job 125166652363)

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
Test Files  22 passed (22)
Tests  187 passed (187)
```

*(Note: Total across workspaces computed from above: 34 test files passed, 326 tests passed).*

### 2.3 Verbatim Playwright E2E Results (Job 125166651946)

```
24 passed (14.1s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125167469315)

```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125166221888)

```
168 commits scanned.
no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 125166652363)

```
✓ [OSR-07 DCO] All 1 commit(s) in 9011b2970227023ef10c40968e925e8256581390..234a61acb2f086a2fb811abf9e07b828acbf046b carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- Unit & Conformance (Vitest): 326 tests across 34 test files (net +21 tests and +2 test files over A040 count of 305 tests across 32 files from `packages/db/src/backup/backup.test.ts` [+9 tests], `apps/worker/src/worker.test.ts` [+1 test], and `apps/api/src/conformance/backup-restore.conformance.test.ts` [+11 tests]).
- Backup & Restore Drill Conformance: All 11 tests in `apps/api/src/conformance/backup-restore.conformance.test.ts` pass, verifying:
  - Authenticated encryption / decryption round-trip and wrong-key rejection
  - Export archive and metadata sidecar emission with SHA-256 checksums
  - Scratch restore drill into isolated database repository verifying checksums and row counts
  - Retention policy thresholds (7 daily, 4 weekly, 6 monthly) pruning older archives
  - Freshness checking (unconfigured, fresh, stale) and `BACKUP_STALE` alert generation
  - HTTP `POST /api/settings/backups/run-drill` 501 `SIMULATED(M1)` when unconfigured and real execution when options are passed
  - Measured freshness values exposed on `GET /api/v1/settings` and `GET /api/v1/health`
  - PortfolioWorker background job execution when configured vs unconfigured
  - CLI script and workflow configuration integrity
- Remote CI Scratch Restore Drill: Dedicated workflow `.github/workflows/backup-restore-drill.yml` verified green on GitHub Actions (Run `41411808884`, Job `125166320833`), executing migration, demo seed, pg_dump backup, archive check, and scratch restore drill in 2m17s.
- Browser Integration (Playwright): 24 tests (unchanged from A040 count of 24).
- Documentation & Process Conformance: All 69 registered documents validated with zero sequence gaps or checksum drift via `node scripts/docs-check` (`IAHP PROC-1`).

---

## 4. Files Touched

Matches `git diff --name-only 1cc1a6b..234a61a` (23 files):
- `.github/workflows/backup-restore-drill.yml`
- `apps/api/src/conformance/backup-restore.conformance.test.ts`
- `apps/api/src/routes/health.ts`
- `apps/api/src/routes/settings.ts`
- `apps/worker/src/worker.test.ts`
- `apps/worker/src/worker.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A040-wp-83-staging-safeguards-and-deployment-class-handling.md`
- `docs/handovers/H009-wp-8-gate-closure-and-wp-9-kickoff.md`
- `docs/plans/gates.json`
- `package.json`
- `packages/db/src/backup/backup.test.ts`
- `packages/db/src/backup/engine.ts`
- `packages/db/src/backup/index.ts`
- `packages/db/src/backup/types.ts`
- `packages/db/src/index.ts`
- `packages/db/src/postgres-repository.ts`
- `scripts/backup-db`
- `scripts/restore-drill`
- `scripts/seed-db`
- `scripts/triage`

---

## 5. Register and Backlog Changes

- `OSR-20` marked `status: fixed` in `docs/audits/register.yml` (automated pg_dump + age encrypted backups, scratch-container restore drill, retention policy enforcement, and `BACKUP_STALE` freshness alerts).
- `M8` marked `status: fixed` in `docs/audits/register.yml` (real pg_dump + age encrypted backup, scratch-container restore drill, retention, and freshness alerts).
- Register totals: 61 fixed, 0 partial, 36 open (P0: 0, P1: 18, P2: 15, P3: 3; 97 total).

---

## 6. Not Done (Tagged)

- WP-9.2 (`OSR-21` [P2]): Observability, provider budget caps, error rate monitoring, and spend alerts [not-started]
- WP-9.3 (`OSR-22` [P2]): Production deploy workflow with required reviewer, health gate, and auto-rollback [not-started]
- WP-9.4 (`P5` [P2]): Worker buildsToday counter UTC midnight reset and static artifact emission [not-started]
- WP-9.5: Work Package 9 Gate Closure & Handover Snapshot H010 [not-started]

---

## 7. Changes to Earlier Reports

None. Earlier reports A001 through A040 remain unmodified and immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A041-wp-91-real-backups-and-restore-drill.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '234a61a' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 1cc1a6b..234a61a (23 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A041-wp-91-real-backups-and-restore-drill.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 125166652363)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 125166651946)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125167469315)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125166221888)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 125166652363)" verified against CI logs.

🎉 All receipt checks PASSED for A041-wp-91-real-backups-and-restore-drill.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 1 (A041); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-9.2 (`OSR-21` Observability, provider budget caps, and alerts)
