# A026 — WP-3.4: Data-Class Privacy Router, Enrichment Scanner & Model Claim Extraction

| Field | Value |
| --- | --- |
| Report ID | A026 |
| Date | 2026-10-26 |
| Author | A (Implementer) |
| Task ID | `WP-3.4` |
| Evidence SHA | `3d06a0c` |
| CI run | 40304080615 |

---

## 1. Scope

Execution of Task WP-3.4 under Work Package 3 (Phase 2, Gate 2 alpha):
- **`[implemented]`** Data-class policy router (`selectProviderForDataClass`): Implemented privacy routing walking provider chains to enforce strict zero-training, human review, and local-only boundaries across `public`, `unpublished`, `private`, and `sensitive` data classes (§13.5, §15, `S7`, `Fix 13`).
- **`[implemented]`** Local redaction & exclusion scanner: Integrated `scanForConfidentialData` and `determineDataClass` into background enrichment (`runEnrichJob`), checking for secrets, tokens, NDA clauses, and owner-configured custom exclusions, strictly preventing external cloud calls on sensitive material (§4.3, §15, `S7`, `Fix 13`).
- **`[implemented]`** BudgetGovernor background spend & reserve controls: Routed enrichment lease acquisition with priority `background`, preventing background jobs from exhausting the owner and background reserves, and reconciling token spend after extraction (§13.5, `S7`, `Fix 13`).
- **`[implemented]`** Structured LLM claim extraction: Implemented `extractClaimsFromSpans` in `packages/ai/src/extraction/index.ts`, replacing naive keyword matching in `runEnrichJob` with structured extraction that preserves claim kind, outcome status, and scope (§8, `S7`, `Fix 13`).
- **`[implemented]`** Authored unit and conformance test suites in `packages/ai/src/ai.test.ts`, `apps/worker/src/worker.test.ts`, and bound `S7` probe in `apps/api/src/conformance/p0-probes.conformance.test.ts`.
- **`[implemented]`** Updated `docs/audits/register.yml` marking `S7` as `status: fixed`.

---

## 2. CI Evidence

### 2.1 Commit and PR Provenance
- PR: `#37` (`feat(ai/worker): implement data-class privacy router and enrichment scanner (Fix 13, S7)`)
- Merge Method: Rebase and merge (`origin/main` at `3d06a0c`)
- Commits landed: `3d06a0c` (`feat(ai/worker): implement data-class privacy router and enrichment scanner (Fix 13, S7)`)
- Evidence SHA: `3d06a0c`
- Ancestor Verification: `git merge-base --is-ancestor 3d06a0c HEAD` exits 0.

### 2.2 Verbatim Vitest Results per Package (Job 121513333936)
```
@living-portfolio/config:test:  Test Files  1 passed (1)
@living-portfolio/config:test:  Tests  5 passed (5)
@living-portfolio/ai:test:  Test Files  1 passed (1)
@living-portfolio/ai:test:  Tests  16 passed (16)
@living-portfolio/core:test:  Test Files  1 passed (1)
@living-portfolio/core:test:  Tests  17 passed (17)
@living-portfolio/web:test:  Test Files  1 passed (1)
@living-portfolio/web:test:  Tests  5 passed (5)
@living-portfolio/worker:test:  Test Files  2 passed (2)
@living-portfolio/worker:test:  Tests  12 passed (12)
@living-portfolio/db:test:  Test Files  4 passed (4)
@living-portfolio/db:test:  Tests  45 passed (45)
@living-portfolio/api:test:  Test Files  16 passed (16)
@living-portfolio/api:test:  Tests  123 passed (123)
```
*Total: 26 test files, 223 passed tests across 7 packages (computed from the above).*

### 2.3 Verbatim Playwright E2E Results (Job 121513330788)
```
11 passed (6.1s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 121508750480)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 121508750603)
```
123 commits scanned.
scanned ~2538624 bytes (2.54 MB) in 414ms
no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 121513333936)
```
✓ [OSR-07 DCO] All 1 commit(s) in b3bde9e258b849d1409ca534bdf9f62726192284..3d06a0c1a5c3bc3fb3f183e1d3e684939ddee7a0 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

| Test Suite | File | Tests Added / Modified |
| --- | --- | --- |
| Worker Privacy Router & Extraction Suite | `apps/worker/src/worker.test.ts` | +3 tests covering data-class skipping for secrets/exclusions, local provider routing for sensitive data, and BudgetGovernor background reserve exhaustion |
| AI Privacy Router & Claims Extraction Suite | `packages/ai/src/ai.test.ts` | +3 tests covering `selectProviderForDataClass` data-policy gating, `determineDataClass` classification, and `extractClaimsFromSpans` structured outcome/scope extraction |
| P0 Conformance Probes | `apps/api/src/conformance/p0-probes.conformance.test.ts` | Bound probe `S7` marked `status: fixed` enforcing privacy router, scanner exclusion gate, and claim extraction |

Test count progression: 216 -> 223 unit/conformance tests (+7 tests across worker and ai suites).

---

## 4. Files Touched

Matches `git diff 6b890e1..3d06a0c --name-only`:
- `KNOWN_ISSUES.md`
- `apps/api/package.json`
- `apps/api/src/conformance/p0-probes.conformance.test.ts`
- `apps/worker/src/worker.test.ts`
- `apps/worker/src/worker.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A025-wp3-3-degradation-ladder.md`
- `packages/ai/src/ai.test.ts`
- `packages/ai/src/extraction/index.ts`
- `packages/ai/src/governor/index.ts`
- `packages/ai/src/providers/adapters/mock.ts`
- `packages/ai/src/providers/adapters/openai.ts`
- `packages/ai/src/providers/types.ts`
- `pnpm-lock.yaml`

---

## 5. Register and Backlog Changes

- `docs/audits/register.yml`:
  - `S7` (Enrichment job bypasses data-class privacy routing, governor, and redaction gate): updated status from `open` to `fixed`. Bound probe to `apps/api/src/conformance/p0-probes.conformance.test.ts`.
- `KNOWN_ISSUES.md`:
  - Cleared `S7` from open findings table.

---

## 6. Not Done (Tagged)

- **`[not-started]`** Task WP-3.5 (`Fix 10`): Work Package 3 Gate Closure and Verification (`H004`).

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

<!-- Verbatim receipt check output block -->
```
=== Validating Receipt A026-wp3-4-data-class-router.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '3d06a0c' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 6b890e1..3d06a0c (16 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A026-wp3-4-data-class-router.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 121513333936)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 121513330788)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 121508750480)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 121508750603)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 121513333936)" verified against CI logs.

🎉 All receipt checks PASSED for A026-wp3-4-data-class-router.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R1
- Receipts since last handover: 4 (A023, A024, A025, A026; last handover was H003 at A022).
- Clean-boundary preconditions: all tests pass cleanly, 0 static analysis alerts, 0 credential leaks, linear git history with DCO sign-offs.
- Next action: Proceed with Task WP-3.5 (`Fix 10`) under Handover `H004`.
