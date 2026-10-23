# A021 — WP-2.4: Dual-Write Verification Harness & Shadow Metrics Suite

| Field | Value |
| --- | --- |
| Report ID | A021 |
| Date | 2026-10-23 |
| Author | A (Implementer) |
| Task ID | `WP-2.4` |
| Evidence SHA | `27e9954` |
| CI run | 39889365993 |

---

## 1. Scope

Execution of Task WP-2.4 under Work Package 2 (Gate 1c / G2 alpha):
- **`[implemented]`** `DualWritePortfolioRepository` in `packages/db/src/dual-write-repository.ts` implementing `IPortfolioRepository` with synchronous write replication across primary and shadow engines, preserving primary IDs and timestamps (`Fix 8`, `Fix 10`, `OSR-15`).
- **`[implemented]`** Concurrent shadow read parity comparison with field-level deep equality verification (`compareResults`), schema default normalization, and latency tracking (`Fix 8`, `Fix 10`, `OSR-15`).
- **`[implemented]`** Operational shadow metrics suite (`getShadowMetrics`, `resetShadowMetrics`) and ring-buffer mismatch logging with diagnostics and configurable `strictParity` mode (`Fix 8`, `Fix 10`, `OSR-15`).
- **`[implemented]`** API integration in `apps/api`: support `databaseKind: 'dual-write'` in `createApp`, wire admin metrics endpoints (`GET /api/admin/metrics/shadow`, `POST /api/admin/metrics/shadow/reset`, `GET /api/admin/metrics/shadow/parity`), and add `dual-write` to `HealthRouteOptions` (`Fix 8`, `Fix 10`, `OSR-15`).
- **`[implemented]`** Unit and live PostgreSQL integration test suite in `packages/db/src/dual-write.test.ts` testing ID preservation, dual-write across all entity types, error tolerance, divergence detection, strictParity exceptions, metrics reset, and live Postgres bit-for-bit parity (`Fix 8`, `Fix 10`, `OSR-15`).
- **`[implemented]`** API conformance test suite in `apps/api/src/conformance/dual-write.conformance.test.ts` testing authentication gating, admin metrics retrieval, and write/read parity telemetry (`Fix 8`, `Fix 10`, `OSR-15`).

---

## 2. CI Evidence

### 2.1 Commit and PR Provenance
- PR: `#27` (`feat(wp2.4): dual-write verification harness and shadow metrics suite`)
- Merge Method: Rebase and merge (`origin/main` at `27e9954`)
- Commits landed:
  - `32ef594` (`feat(db): implement dual-write verification harness and shadow metrics suite`)
  - `dbd6416` (`fix(db): ensure clean test isolation for live postgres dual-write parity test`)
  - `6972526` (`fix(db): normalize schema defaults and add filter support to parity verifier`)
- Ancestor Verification: `git merge-base --is-ancestor 27e9954 HEAD` exits 0.

### 2.2 Verbatim Vitest Results per Package (Job 120205143819)
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
@living-portfolio/api:test:  Tests  108 passed (108)
```
*Total: 26 test files, 194 tests passed across 7 packages (computed from the above).*

### 2.3 Verbatim Playwright E2E Results (Job 120205143583)
```
11 passed (9.1s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 120205142958)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 120205144029)
```
2:24AM INF 106 commits scanned.
✓ Gitleaks scan passed with 0 leaks.
2:24AM INF no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 120205143819)
```
✓ [OSR-07 DCO] All 3 commit(s) in 4fb4f67f86426ca837ef376124efeaafba6fe873..27e99542fb19ff41cf930fff5dc109af71821592 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

Total: 194 tests across 26 test files (increased from 184 tests across 24 test files in A020).

### Tests Added
1. `packages/db/src/dual-write.test.ts`:
   - `replicates venture creation and preserves primary ID in shadow`
   - `replicates entries, revisions, spans, annotations, and claims end to end`
   - `detects shadow divergence and records mismatch details without breaking primary traffic`
   - `throws ParityMismatchError when strictParity is enabled and divergence occurs`
   - `gracefully handles shadow errors without disrupting primary operations`
   - `resets shadow metrics when resetShadowMetrics is invoked`
   - `dual-writes from InMemory to live PostgreSQL and verifies bit-for-bit parity across engines`
2. `apps/api/src/conformance/dual-write.conformance.test.ts`:
   - `rejects unauthenticated requests to /api/admin/metrics/shadow with 401`
   - `serves shadow metrics to authenticated admin with healthy initial state`
   - `records matches and tracks latency when performing API write and read operations`

---

## 4. Files Touched

Base Evidence SHA: `897c853eeeaf4cbbc2117defde58b51567e50b10`
Target Evidence SHA: `27e99542fb19ff41cf930fff5dc109af71821592`

Files verified by `receipt:check`:
- `apps/api/src/app.ts`
- `apps/api/src/conformance/dual-write.conformance.test.ts`
- `apps/api/src/routes/health.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A020-wp2-3-worker-pgboss.md`
- `packages/db/src/dual-write-repository.ts`
- `packages/db/src/dual-write.test.ts`
- `packages/db/src/index.ts`
- `packages/db/src/postgres-repository.ts`
- `packages/db/src/repository.ts`

*Note: `docs/INDEX.md`, `docs/doc-registry.json`, and `docs/execution-reports/A020-wp2-3-worker-pgboss.md` were merged into `main` in docs PR #26 between Evidence SHAs `897c853` and `27e9954`.*

---

## 5. Register and Backlog Changes

None. No register or backlog changes in this task.

---

## 6. Not Done (Tagged)

- **`[not-started]`** Production cutover and in-memory deprecation gate (`Gate 1c / G2 alpha close`): Scheduled for WP-2.5.

---

## 7. Changes to Earlier Reports

None. All earlier reports stand unmodified.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A021-wp2-4-dual-write-verification.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '27e9954' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 897c853..27e9954 (11 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A021-wp2-4-dual-write-verification.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 120205143819)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 120205143583)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 120205142958)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 120205144029)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 120205143819)" verified against CI logs.

🎉 All receipt checks PASSED for A021-wp2-4-dual-write-verification.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 4 (A018, A019, A020, A021; last handover was H002 at A017).
- Clean-boundary preconditions: all 194 tests pass cleanly, 0 static analysis alerts, 0 credential leaks, linear git history with DCO sign-offs.
- Next action: Proceed with WP-2.5 (production cutover and in-memory deprecation gate).
