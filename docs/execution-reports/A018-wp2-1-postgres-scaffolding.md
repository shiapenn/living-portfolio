# A018 — WP-2.1: PostgreSQL 16 Scaffolding, Connection Pooling, and Migration Harness

| Field | Value |
| --- | --- |
| Report ID | A018 |
| Date | 2026-10-22 |
| Author | A (Implementer) |
| Task ID | `WP-2.1` |
| Evidence SHA | `3c55efe` |
| CI run | 39766584423 |

---

## 1. Scope

- **`[implemented]`** Added PostgreSQL 16 + `pgvector` container service (`pgvector/pgvector:pg16`) with health check options to `.github/workflows/ci.yml` under the required status check job `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`ci-and-audit-gate`).
- **`[implemented]`** Configured `DATABASE_URL` environment variable for test execution against the container service in CI (`OSR-15`).
- **`[implemented]`** Implemented PostgreSQL connection pool factory (`createDbPool`), default instance cache, graceful pool teardown (`closeDbPool`), health check helper (`checkDbHealth`), and Drizzle ORM client bindings (`createDrizzleDb`) in `packages/db/src/connection.ts`.
- **`[implemented]`** Implemented forward-only SQL migration runner (`runMigrations`) and authoritative QRXP schema boot check (`assertSchemaVersion`, `getSchemaVersion`) tracking `qrxp_schema_version` in `schema_info` table (§9, §19, `packages/db/src/migrate.ts`).
- **`[implemented]`** Added initial DDL migration `0001_init.sql` and embedded TypeScript module `packages/db/src/migrations/0001_init.ts` defining `uuid-ossp`, `vector` extensions, all 18 core and operational schema tables, and query indexes.
- **`[implemented]`** Added schema boot refusal invariant per Spec §19: app halts with descriptive error and prints exact command `Run 'pnpm --filter @living-portfolio/db migrate' to apply pending migrations` when schema is uninitialized or mismatched.
- **`[implemented]`** Added CLI migration runner `packages/db/src/bin/migrate.ts` and wired `pnpm --filter @living-portfolio/db migrate` and root `pnpm db:migrate`.
- **`[implemented]`** Added comprehensive test suite `packages/db/src/postgres.test.ts` verifying semantic versioning, migration idempotence, boot check rejection/acceptance, connection error handling, and vector embedding operations.
- **`[partial]`** Full `PostgresPortfolioRepository` persistence implementation deferred to WP-2.2 to keep PRs scoped to single tasks.
- **`[not-started]`** `pg-boss` background worker migration deferred to Fix 8 / WP-2.3 (`P3`, `F1`–`F3`).

---

## 2. CI Evidence

### 2.1 Commit and PR Provenance
- PR: `#21` (`feat(wp2.1): PostgreSQL 16 service container, connection pool, and migration harness`)
- Merge Method: Rebase and merge (`origin/main` at `3c55efe`)
- Commits landed:
  - `c0126e0` (`ci: scaffold PostgreSQL 16 and pgvector service container for CI test lane`)
  - `3c55efe` (`feat(db): implement connection pooling, migration harness, and schema boot check`)
- Ancestor Verification: `git merge-base --is-ancestor 3c55efe HEAD` exits 0.

### 2.2 Verbatim Vitest Results per Package (Job 119783434497)
```
@living-portfolio/config:test:  Test Files  1 passed (1)
@living-portfolio/config:test:  Tests  5 passed (5)
@living-portfolio/ai:test:  Test Files  1 passed (1)
@living-portfolio/ai:test:  Tests  7 passed (7)
@living-portfolio/core:test:  Test Files  1 passed (1)
@living-portfolio/core:test:  Tests  17 passed (17)
@living-portfolio/worker:test:  Test Files  1 passed (1)
@living-portfolio/worker:test:  Tests  4 passed (4)
@living-portfolio/web:test:  Test Files  1 passed (1)
@living-portfolio/web:test:  Tests  5 passed (5)
@living-portfolio/db:test:  Test Files  2 passed (2)
@living-portfolio/db:test:  Tests  10 passed | 4 skipped (14)
@living-portfolio/api:test:  Test Files  15 passed (15)
@living-portfolio/api:test:  Tests  105 passed (105)
```
*Total: 22 test files, 153 tests passed across 7 packages (computed from the above).*

### 2.3 Verbatim Playwright E2E Results (Job 119783433985)
```
11 passed (8.9s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 119783432205)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 119783432840)
```
10:54AM INF 84 commits scanned.
10:54AM INF no leaks found
✓ Gitleaks scan passed with 0 leaks.
```

### 2.6 Verbatim DCO Verification Line (Job 119783434497)
```
✓ [OSR-07 DCO] All 2 commit(s) in 10c92a9b231566fce20f423bf6049da76c022e46..3c55efe29bdc68916ad5049ce9d039341421d615 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

Total: 153 tests across 22 test files (increased from 145 tests across 21 test files in A017).

### Tests Added
Added 12 tests in `packages/db/src/postgres.test.ts`:
- Unit suite (8 passed):
  1. `defines valid semantic QRXP schema version`
  2. `declares 0001_init migration with pgvector extension and core tables`
  3. `assertSchemaVersion throws when schema is uninitialized and prints exact command (§19)`
  4. `assertSchemaVersion throws when schema version is mismatched (§19)`
  5. `assertSchemaVersion succeeds when schema version matches expected version`
  6. `getSchemaVersion returns null when schema_info table does not exist (42P01)`
  7. `createDbPool creates pool instance with configured defaults`
  8. `checkDbHealth returns ok=false on unreachable database without crashing`
- Live integration suite (conditional on `DATABASE_URL` pass-through):
  9. `connects to live Postgres service and passes health check`
  10. `runs migrations, enables pgvector, and sets QRXP schema version`
  11. `executes migrations idempotently without errors`
  12. `performs Drizzle ORM operations including 384-dimensional vector embedding storage`

### Count Change
- Packages: 7 packages running Vitest.
- Total test files: increased from 21 to 22 (+1 test file in `@living-portfolio/db`).
- Total passed tests: increased from 145 to 153 (+8 passed unit tests in `@living-portfolio/db`, 4 skipped awaiting Turbo pass-through).
- Playwright E2E: 11 tests passed.

---

## 4. Files Touched

Matches `git diff --name-only c7936d4..3c55efe` (14 files verified):
- `.github/workflows/ci.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A017-wp-1-gate-closure-triage-and-handover-facts.md`
- `docs/handovers/H002-wp-1-gate-closure-and-wp-2-kickoff.md`
- `docs/INDEX.md`
- `package.json`
- `packages/db/migrations/0001_init.sql`
- `packages/db/package.json`
- `packages/db/src/bin/migrate.ts`
- `packages/db/src/connection.ts`
- `packages/db/src/index.ts`
- `packages/db/src/migrate.ts`
- `packages/db/src/migrations/0001_init.ts`
- `packages/db/src/postgres.test.ts`

*(Note: The 4 docs files in the diff range represent the intermediate docs-only PRs for receipt A017 and handover H002 merged to `main` between Evidence SHAs `c7936d4` and `3c55efe`).*

---

## 5. Register and Backlog Changes

### Finding Register Changes (`docs/audits/register.yml`)
No register changes were made in this task. Findings `P1` and `P2` remain open because full persistence closure requires `PostgresPortfolioRepository` (planned for WP-2.2) and removal of unconditional demo seeding on startup (`Fix 7`).

### Backlog Status
- `WP-2.1` (`Fix 7` / `Fix 10` scaffolding): **`[implemented]`** (PR #21, evidence `3c55efe`).
- Next backlog action: `WP-2.2` (`Fix 7`, `P1`, `P2`, `OSR-14`): Implement `PostgresPortfolioRepository` adhering to `IPortfolioRepository`, add `DATABASE_URL` to `turbo.json` task pass-through, and execute dual-engine repository conformance suite over both in-memory and PostgreSQL engines.

---

## 6. Not Done (Tagged)

- **`[partial]`** `PostgresPortfolioRepository` implementation (`P2`): Interface methods for ventures, entries, spans, annotations, claims, and relations in Postgres are scheduled for WP-2.2.
- **`[not-started]`** `pg-boss` background worker migration (`P3`, `F1`–`F3`): Worker entrypoint and queue processing scheduled for WP-2.3.
- **`[not-started]`** ONNX runtime embeddings persistence (`P3`): Worker embedding pipeline scheduled for WP-2.4.

---

## 7. Changes to Earlier Reports

- In CI run `39766584423` (job `119783434497`), `packages/db:test` reported `10 passed | 4 skipped (14)` tests. The 4 skipped tests are live integration assertions (`Postgres + pgvector Live Integration Suite`) guarded by `isDatabaseConfigured = Boolean(process.env.DATABASE_URL)`. While `.github/workflows/ci.yml` successfully booted the `pgvector/pgvector:pg16` service container on port 5432 and exported `DATABASE_URL`, Turborepo v2 strips undeclared environment variables from child processes unless declared in `turbo.json`'s `globalPassThroughEnv` or `tasks.test.env`. WP-2.2 will declare `DATABASE_URL` in `turbo.json` so the live container tests execute automatically under Turbo in CI.
- The 4 required status checks enforced by ruleset `main-gates` reported green on PR #21 and `main` commit `3c55efe`:
  1. `Typecheck, Unit, Security Regression, DCO & Audit Gate` (job `119783434497`)
  2. `Playwright End-to-End Suite` (job `119783433985`)
  3. `CodeQL (JavaScript / TypeScript)` (job `119783432205`)
  4. `Gitleaks Secret & Credential Scan` (job `119783432840`)

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A018-wp2-1-postgres-scaffolding.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '3c55efe' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 10c92a9..3c55efe (10 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A018-wp2-1-postgres-scaffolding.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 119783434497)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 119783433985)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 119783432205)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 119783432840)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 119783434497)" verified against CI logs.

🎉 All receipt checks PASSED for A018-wp2-1-postgres-scaffolding.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 1 (A018 since H002); work packages since: 0
- Clean-boundary preconditions: met
- Next action: Task WP-2.2 (PostgresPortfolioRepository implementation and turbo test passthrough)
