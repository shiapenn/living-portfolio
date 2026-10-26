# A024 — WP-3.2: BudgetGovernor Postgres Ledger, Priority Limits & Owner Reserve

| Field | Value |
| --- | --- |
| Report ID | A024 |
| Date | 2026-10-26 |
| Author | A (Implementer) |
| Task ID | `WP-3.2` |
| Evidence SHA | `2ef2f65` |
| CI run | 40292950438 |

---

## 1. Scope

Execution of Task WP-3.2 under Work Package 3 (Phase 2, Gate 2 alpha):
- **`[implemented]`** Persisted provider daily token buckets (`visitor_tokens`, `owner_tokens`, `background_tokens`) in PostgreSQL `governor_ledger` table with UTC midnight resets (`B1`–`B4`, `Fix 11`).
- **`[implemented]`** Enforced >=20% capacity reserve for owner-interactive calls and priority ordering (`owner_interactive` > `visitor_interactive` > `background`) (`B1`).
- **`[implemented]`** Computed visitor soft threshold (0.8) and hard threshold (1.0) against visitor token allocation, making `smaller_model` step reachable (`B2`, `B3`).
- **`[implemented]`** Wired per-minute sliding window limits (TPM/RPM), 429 jittered backoff discount, response header limit learning, and token reconciliation (`B4`).
- **`[implemented]`** Prevented side-effect quota consumption on extractive or non-generating routes in `ask.ts`, and released provisional spend on failure (`G8`).
- **`[implemented]`** Authored unit and conformance test suites in `packages/ai/src/ai.test.ts`, `packages/db/src/repository.conformance.test.ts`, and `apps/api/src/conformance/p0-probes.conformance.test.ts`.
- **`[implemented]`** Updated `docs/audits/register.yml` marking `B1`, `B2`, `B3`, `B4`, and `G8` as `status: fixed`.

---

## 2. CI Evidence

### 2.1 Commit and PR Provenance
- PR: `#33` (`feat(governor): persist budget ledger in postgres, enforce priority limits and owner reserve (B1-B4, G8, Fix 11)`)
- Merge Method: Rebase and merge (`origin/main` at `2ef2f65`)
- Commits landed: `2ef2f65` (`feat(governor): persist budget ledger in postgres, enforce priority limits and owner reserve (B1-B4, G8, Fix 11)`)
- Evidence SHA: `2ef2f65`
- Ancestor Verification: `git merge-base --is-ancestor 2ef2f65 HEAD` exits 0.

### 2.2 Verbatim Vitest Results per Package (Job 121472090378)
```
@living-portfolio/config:test:  Test Files  1 passed (1)
@living-portfolio/config:test:  Tests  5 passed (5)
@living-portfolio/core:test:  Test Files  1 passed (1)
@living-portfolio/core:test:  Tests  17 passed (17)
@living-portfolio/ai:test:  Test Files  1 passed (1)
@living-portfolio/ai:test:  Tests  11 passed (11)
@living-portfolio/web:test:  Test Files  1 passed (1)
@living-portfolio/web:test:  Tests  5 passed (5)
@living-portfolio/worker:test:  Test Files  2 passed (2)
@living-portfolio/worker:test:  Tests  9 passed (9)
@living-portfolio/db:test:  Test Files  4 passed (4)
@living-portfolio/db:test:  Tests  45 passed (45)
@living-portfolio/api:test:  Test Files  16 passed (16)
@living-portfolio/api:test:  Tests  118 passed (118)
```
*Total: 26 test files, 210 passed tests across 7 packages (computed from the above).*

### 2.3 Verbatim Playwright E2E Results (Job 121472090673)
```
11 passed (7.9s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 121472090928)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 121472090521)
```
8:32AM INF 116 commits scanned.
✓ Gitleaks scan passed with 0 leaks.
8:32AM INF no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 121472090378)
```
✓ [OSR-07 DCO] All 1 commit(s) in 79a8a5abbacfabbf4ecfa050299630599e5ccc54..2ef2f657312be5844db7fc218a192203d251db85 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

Total: 210 passed tests across 26 test files.

### Tests Added
1. `packages/ai/src/ai.test.ts`:
   - `[B1] reserves >=20% capacity for owner-interactive calls and enforces priority access (§13.5)`
   - `[B2, B3] computes visitor thresholds against visitor allocation and enables smaller_model step (§10.8, §13.5)`
   - `[B4] enforces per-minute limits, 429 penalty, header learning, and token reconciliation (§13.5)`
   - `[B1-B4] persists governor ledger with UTC midnight resets`
2. `packages/db/src/repository.conformance.test.ts`:
   - `persists and retrieves governor ledger entries across days (§13.5, B1-B4, Fix 11)`
3. `apps/api/src/conformance/p0-probes.conformance.test.ts`:
   - `[G8] (status=fixed) ask.ts avoids spending budget quota on extractive or non-generating routes, and reconciles provisional spend`
   - `[B1] (status=fixed) BudgetGovernor enforces >=20% owner-interactive reserve and priority access`
   - `[B2] (status=fixed) BudgetGovernor enables smaller_model step at visitor soft threshold rather than blocking at visitorShare`
   - `[B3] (status=fixed) visitor share and thresholds are computed against visitor token allocation`
   - `[B4] (status=fixed) BudgetGovernor wires per-minute limits, learned response headers, 429 discount, token reconciliation, and UTC midnight reset`

---

## 4. Files Touched

Base Evidence SHA: `369db8381e79a6d1d804fa3636bab32aa87bd6e4`
Target Evidence SHA: `2ef2f657312be5844db7fc218a192203d251db85`

Files verified by `receipt:check`:
- `apps/api/src/app.ts`
- `apps/api/src/conformance/p0-probes.conformance.test.ts`
- `apps/api/src/routes/ask.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A023-wp3-1-cms-lifecycle.md`
- `packages/ai/src/ai.test.ts`
- `packages/ai/src/governor/index.ts`
- `packages/db/migrations/0002_governor_ledger.sql`
- `packages/db/src/dual-write-repository.ts`
- `packages/db/src/migrate.ts`
- `packages/db/src/migrations/0002_governor_ledger.ts`
- `packages/db/src/postgres-repository.ts`
- `packages/db/src/repository.conformance.test.ts`
- `packages/db/src/repository.ts`
- `packages/db/src/schema/index.ts`

*Note: `docs/INDEX.md`, `docs/doc-registry.json`, and `docs/execution-reports/A023-wp3-1-cms-lifecycle.md` were merged into `main` in docs PR #32 between Evidence SHAs `369db83` and `2ef2f65`.*

---

## 5. Register and Backlog Changes

- Marked findings `B1`, `B2`, `B3`, `B4`, and `G8` as `status: fixed` in `docs/audits/register.yml`.
- Register status totals: 42 fixed, 3 partial, 52 open (97 total).

---

## 6. Not Done (Tagged)

- **`[not-started]`** Task WP-3.3 (`M2`, `Fix 12`): Degradation ladder answer cache and fallback provider.
- **`[not-started]`** Task WP-3.4 (`S7`, `Fix 13`): Data-class privacy router and enrichment scanner.
- **`[not-started]`** Task WP-3.5 (`Fix 10`): Gate WP-3 closure and verification.

---

## 7. Changes to Earlier Reports

None. All earlier reports stand unmodified.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A024-wp3-2-governor-ledger.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '2ef2f65' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 369db83..2ef2f65 (17 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A024-wp3-2-governor-ledger.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 121472090378)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 121472090673)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 121472090928)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 121472090521)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 121472090378)" verified against CI logs.

🎉 All receipt checks PASSED for A024-wp3-2-governor-ledger.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R1
- Receipts since last handover: 2 (A023, A024; last handover was H003 at A022).
- Clean-boundary preconditions: all tests pass cleanly, 0 static analysis alerts, 0 credential leaks, linear git history with DCO sign-offs.
- Next action: Proceed with Task WP-3.3 (`M2`, `Fix 12`).
