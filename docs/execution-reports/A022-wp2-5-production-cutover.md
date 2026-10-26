# A022 — WP-2.5: Production Cutover, In-Memory Deprecation & Work Package 2 Closure

| Field | Value |
| --- | --- |
| Report ID | A022 |
| Date | 2026-10-26 |
| Author | A (Implementer) |
| Task ID | `WP-2.5` |
| Evidence SHA | `295c09d` |
| CI run | 40277780107 |

---

## 1. Scope

Execution of Task WP-2.5 under Work Package 2 (Gate 1c / G2 alpha close):
- **`[implemented]`** Database engine cutover to PostgreSQL in production environments (`NODE_ENV === 'production'` or `PORTFOLIO_DB_MODE === 'postgres'`) and guarded `seedDemoPortfolio(repo)` behind `config.SEED_DEMO` in `apps/api/src/server.ts` (`Fix 7`, `P1`).
- **`[implemented]`** Deprecated `InMemoryPortfolioRepository` in production runtime with `@deprecated` JSDoc annotations and a standard stderr deprecation warning on initialization (`Fix 7`, `P1`).
- **`[implemented]`** Added `checkHealth(): Promise<boolean>` method across `InMemoryPortfolioRepository`, `PostgresPortfolioRepository`, and `DualWritePortfolioRepository`, wiring `/healthz` and `/api/health` to real measured database connectivity (`Fix 8`, `F3`).
- **`[implemented]`** Multi-stage, non-root Alpine Dockerfiles for API service (`docker/Dockerfile.api`) and background worker (`docker/Dockerfile.worker`) per Spec §13.10 and `docker-compose.hobbyist.yml` (`Fix 8`, `F2`, `OSR-16`).
- **`[implemented]`** Conformance test probes for `P1`, `P2`, `P3`, `F2`, `F3` in `apps/api/src/conformance/p0-probes.conformance.test.ts`.
- **`[implemented]`** Updated `docs/audits/register.yml` to mark `P1`, `P2`, `P3`, `F2`, `F3`, `OSR-14`, and `OSR-15` as `status: fixed`.
- **`[implemented]`** Defined `WP-2` gate in `docs/plans/gates.json` with required passing tests, closing receipt `A022`, and handover `H003`.
- **`[implemented]`** Authored handover `docs/handovers/H003-wp-2-gate-closure-and-wp-3-kickoff.md` superseding `H002`.

---

## 2. CI Evidence

### 2.1 Commit and PR Provenance
- PR: `#29` (`feat(wp2.5): production cutover, in-memory deprecation, Dockerfiles, and Gate 1c closure`)
- Merge Method: Rebase and merge (`origin/main` at `295c09d`)
- Commits landed:
  - `b37ef3f` (`feat(wp2.5): production cutover, in-memory deprecation, Dockerfiles, and Gate 1c closure`)
  - `295c09d` (`fix(api): preserve in-memory repository default when NODE_ENV is test`)
- Ancestor Verification: `git merge-base --is-ancestor 295c09d HEAD` exits 0.

### 2.2 Verbatim Vitest Results per Package (Job 121424116970)
```
@living-portfolio/ai:test:  Test Files  1 passed (1)
@living-portfolio/ai:test:  Tests  7 passed (7)
@living-portfolio/config:test:  Test Files  1 passed (1)
@living-portfolio/config:test:  Tests  5 passed (5)
@living-portfolio/core:test:  Test Files  1 passed (1)
@living-portfolio/core:test:  Tests  17 passed (17)
@living-portfolio/web:test:  Test Files  1 passed (1)
@living-portfolio/web:test:  Tests  5 passed (5)
@living-portfolio/worker:test:  Test Files  2 passed (2)
@living-portfolio/worker:test:  Tests  9 passed (9)
@living-portfolio/db:test:  Test Files  4 passed (4)
@living-portfolio/db:test:  Tests  43 passed (43)
@living-portfolio/api:test:  Test Files  16 passed (16)
@living-portfolio/api:test:  Tests  112 passed (112)
```
*Total: 26 test files, 198 tests passed across 7 packages (computed from the above).*

### 2.3 Verbatim Playwright E2E Results (Job 121424117246)
```
11 passed (7.3s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 121424117267)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 121424117172)
```
6:05AM INF 109 commits scanned.
✓ Gitleaks scan passed with 0 leaks.
6:05AM INF no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 121424116970)
```
✓ [OSR-07 DCO] All 2 commit(s) in 412c43d654bf5bf07dc71378b833343efa614f6b..295c09dae642311a9a9f1e0f9c8d83379e57c655 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

Total: 198 tests across 26 test files (increased from 194 tests across 26 test files in A021).

### Tests Added
1. `apps/api/src/conformance/p0-probes.conformance.test.ts`:
   - `[P1] (status=fixed) storage defaults to PostgreSQL in production and server.ts does not unconditionally seed demo data on boot`
   - `[P2] (status=fixed) Drizzle schema is connected with migrations, schema_info verification, and PostgresPortfolioRepository`
   - `[P3] (status=fixed) worker daemon registers all 5 queues and persists chunk vector embeddings to repository`
   - `[F2] (status=fixed) docker/Dockerfile.api and docker/Dockerfile.worker exist on disk for docker compose`
   - `[F3] (status=fixed) /healthz performs real measured repository connectivity check instead of constant true`

---

## 4. Files Touched

Base Evidence SHA: `27e99542fb19ff41cf930fff5dc109af71821592`
Target Evidence SHA: `295c09dae642311a9a9f1e0f9c8d83379e57c655`

Files verified by `receipt:check`:
- `apps/api/src/app.ts`
- `apps/api/src/conformance/p0-probes.conformance.test.ts`
- `docker/Dockerfile.api`
- `docker/Dockerfile.worker`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A021-wp2-4-dual-write-verification.md`
- `docs/handovers/H003-wp-2-gate-closure-and-wp-3-kickoff.md`
- `docs/plans/gates.json`
- `packages/db/src/dual-write-repository.ts`
- `packages/db/src/migrate.ts`
- `packages/db/src/postgres-repository.ts`
- `packages/db/src/repository.ts`

*Note: `docs/execution-reports/A021-wp2-4-dual-write-verification.md` was merged into `main` in docs PR #28 between Evidence SHAs `27e9954` and `295c09d`.*

---

## 5. Register and Backlog Changes

- Marked findings `P1`, `P2`, `P3`, `F2`, `F3`, `OSR-14`, and `OSR-15` as `status: fixed` in `docs/audits/register.yml`.
- Register status totals: 34 fixed, 3 partial, 60 open (97 total).

---

## 6. Not Done (Tagged)

- **`[not-started]`** Task WP-3.1 (`P4`, `P6`, `Fix 9`): Bitemporal `written_at` & seed fixture override, revision immutability and duplicate slug rejection.
- **`[not-started]`** Task WP-3.2 (`B1`–`B4`, `Fix 11`): Postgres-persisted `BudgetGovernor` ledger and midnight reset.

---

## 7. Changes to Earlier Reports

None. All earlier reports stand unmodified.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A022-wp2-5-production-cutover.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '295c09d' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 27e9954..295c09d (14 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A022-wp2-5-production-cutover.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 121424116970)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 121424117246)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 121424117267)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 121424117172)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 121424116970)" verified against CI logs.

🎉 All receipt checks PASSED for A022-wp2-5-production-cutover.md.
```

---

## 9. Handover Decision

- Decision: REQUIRED
- Rule(s): HO-R1
- Receipts since last handover: 5 (A018, A019, A020, A021, A022; last handover was H002 at A017).
- Clean-boundary preconditions: all 198 tests pass cleanly across 7 packages, 0 static analysis alerts, 0 credential leaks, linear git history with DCO sign-offs, Gate WP-2 closed with handover H003 registered.
- Next action: Proceed with Work Package 3 Kickoff and Task WP-3.1 (`P4`, `P6`, `Fix 9`).
