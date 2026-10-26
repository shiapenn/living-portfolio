# A025 — WP-3.3: Degradation Ladder Answer Cache, Fallback Provider & Offline Handoff

| Field | Value |
| --- | --- |
| Report ID | A025 |
| Date | 2026-10-26 |
| Author | A (Implementer) |
| Task ID | `WP-3.3` |
| Evidence SHA | `6b890e1` |
| CI run | 40298452604 |

---

## 1. Scope

Execution of Task WP-3.3 under Work Package 3 (Phase 2, Gate 2 alpha):
- **`[implemented]`** Degradation Ladder Step 2 (`cached`): Implemented `AnswerCache` in `packages/ai/src/cache/answer-cache.ts` providing in-memory caching of verified answers across normalized question, set of cited entry revisions, visitor facets, and as-of dates for public entries (`M2`, `Fix 12`).
- **`[implemented]`** Invalidation hooks: Wired `invalidateRevision` on revision creation, update, and deletion in `entries.ts`, and `invalidateClaim` on claim updates and relation acceptance in `structure.ts` (`M2`, `Fix 12`).
- **`[implemented]`** Degradation Ladder Step 3 (`fallback_provider`): Configured `BudgetGovernor.acquire` and `/api/ask` fallback completion loop to assign `degradationStep: 'fallback_provider'` when falling back from primary provider (`M2`, `Fix 12`).
- **`[implemented]`** Degradation Ladder Step 6 (`handoff`): Handled database and embedding subsystem failure/offline status in `/api/ask`, returning `degradationStep: 'handoff'`, `tier: 'disabled'`, and booking links (`M2`, `Fix 12`).
- **`[implemented]`** Authored unit and conformance test suites in `packages/ai/src/ai.test.ts`, `apps/api/src/api.test.ts`, `apps/api/src/conformance/provider-degradation.conformance.test.ts`, and `apps/api/src/conformance/p0-probes.conformance.test.ts`.
- **`[implemented]`** Updated `docs/audits/register.yml` marking `M2` as `status: fixed`.

---

## 2. CI Evidence

### 2.1 Commit and PR Provenance
- PR: `#35` (`feat(api): degradation ladder answer cache, fallback provider, and offline handoff (M2, Fix 12)`)
- Merge Method: Rebase and merge (`origin/main` at `6b890e1`)
- Commits landed: `6b890e1` (`feat(api): degradation ladder answer cache, fallback provider, and offline handoff (M2, Fix 12)`)
- Evidence SHA: `6b890e1`
- Ancestor Verification: `git merge-base --is-ancestor 6b890e1 HEAD` exits 0.

### 2.2 Verbatim Vitest Results per Package (Job 121490169903)
```
@living-portfolio/config:test:  Test Files  1 passed (1)
@living-portfolio/config:test:  Tests  5 passed (5)
@living-portfolio/core:test:  Test Files  1 passed (1)
@living-portfolio/core:test:  Tests  17 passed (17)
@living-portfolio/ai:test:  Test Files  1 passed (1)
@living-portfolio/ai:test:  Tests  13 passed (13)
@living-portfolio/web:test:  Test Files  1 passed (1)
@living-portfolio/web:test:  Tests  5 passed (5)
@living-portfolio/worker:test:  Test Files  2 passed (2)
@living-portfolio/worker:test:  Tests  9 passed (9)
@living-portfolio/db:test:  Test Files  4 passed (4)
@living-portfolio/db:test:  Tests  45 passed (45)
@living-portfolio/api:test:  Test Files  16 passed (16)
@living-portfolio/api:test:  Tests  122 passed (122)
```
*Total: 26 test files, 216 passed tests across 7 packages (computed from the above).*

### 2.3 Verbatim Playwright E2E Results (Job 121490170169)
```
11 passed (6.9s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 121490169271)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 121490169489)
```
9:18AM INF 119 commits scanned.
✓ Gitleaks scan passed with 0 leaks.
9:18AM INF no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 121490169903)
```
✓ [OSR-07 DCO] All 1 commit(s) in 3a9b5244460ef8f033dd5a0aa99ccf34575691cc..6b890e158d071a3c5d5216bcfb3dc1dc6e2123c5 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

Total: 216 passed tests across 26 test files.

### Tests Added
1. `packages/ai/src/ai.test.ts`:
   - `[M2] AnswerCache provides Step 2 degradation caching, time-travel isolation, and revision/claim invalidation (§10.8 Step 2)`
   - `[M2] Governor returns degradationStep: fallback_provider when falling back to secondary provider (§10.8 Step 3)`
2. `apps/api/src/api.test.ts`:
   - `[M2] Degradation Step 2: Caches verified answer on repeat query and invalidates on revision modification (§10.8 Step 2)`
   - `[M2] Degradation Step 3: Falls back to secondary provider and returns degradationStep: fallback_provider (§10.8 Step 3)`
   - `[M2] Degradation Step 6: Offline/unreachable database returns degradationStep: handoff and booking options (§10.8 Step 6)`
3. `apps/api/src/conformance/p0-probes.conformance.test.ts`:
   - `[M2] (status=fixed) Degradation ladder implements Step 2 answer cache, Step 3 distinct fallback provider, and Step 6 offline handoff (§10.8, Fix 12)`

---

## 4. Files Touched

Base Evidence SHA: `2ef2f657312be5844db7fc218a192203d251db85`
Target Evidence SHA: `6b890e158d071a3c5d5216bcfb3dc1dc6e2123c5`

Files verified by `receipt:check`:
- `apps/api/src/api.test.ts`
- `apps/api/src/app.ts`
- `apps/api/src/conformance/p0-probes.conformance.test.ts`
- `apps/api/src/conformance/provider-degradation.conformance.test.ts`
- `apps/api/src/routes/ask.ts`
- `apps/api/src/routes/entries.ts`
- `apps/api/src/routes/structure.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A024-wp3-2-governor-ledger.md`
- `packages/ai/src/ai.test.ts`
- `packages/ai/src/cache/answer-cache.ts`
- `packages/ai/src/governor/index.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/providers/adapters/mock.ts`

*Note: `docs/INDEX.md`, `docs/doc-registry.json`, and `docs/execution-reports/A024-wp3-2-governor-ledger.md` were merged into `main` in docs PR #34 between Evidence SHAs `2ef2f65` and `6b890e1`.*

---

## 5. Register and Backlog Changes

- Marked finding `M2` as `status: fixed` in `docs/audits/register.yml`.
- Register status totals: 43 fixed, 3 partial, 51 open (97 total).

---

## 6. Not Done (Tagged)

- **`[not-started]`** Task WP-3.4 (`S7`, `Fix 13`): Data-class privacy router and enrichment scanner.
- **`[not-started]`** Task WP-3.5 (`Fix 10`): Gate WP-3 closure and verification.

---

## 7. Changes to Earlier Reports

None. All earlier reports stand unmodified.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A025-wp3-3-degradation-ladder.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '6b890e1' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 2ef2f65..6b890e1 (16 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A025-wp3-3-degradation-ladder.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 121490169903)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 121490170169)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 121490169271)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 121490169489)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 121490169903)" verified against CI logs.

🎉 All receipt checks PASSED for A025-wp3-3-degradation-ladder.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R1
- Receipts since last handover: 3 (A023, A024, A025; last handover was H003 at A022).
- Clean-boundary preconditions: all tests pass cleanly, 0 static analysis alerts, 0 credential leaks, linear git history with DCO sign-offs.
- Next action: Proceed with Task WP-3.4 (`S7`, `Fix 13`).
