# A023 — WP-3.1: CMS Lifecycle Extension, Immutable History & Bitemporal Time

| Field | Value |
| --- | --- |
| Report ID | A023 |
| Date | 2026-10-26 |
| Author | A (Implementer) |
| Task ID | `WP-3.1` |
| Evidence SHA | `369db83` |
| CI run | 40287820921 |

---

## 1. Scope

Execution of Task WP-3.1 under Work Package 3 (Phase 2, Gate 2 alpha):
- **`[implemented]`** Extended admin CMS entry lifecycle with Save draft (`#btn-save-draft`), Unpublish (`#btn-unpublish`), and Delete (`#btn-delete-entry`) actions (`20261020-UX-04`, `Fix 9`).
- **`[implemented]`** Added 3-state visibility dropdown (`#entry-visibility`) supporting `private` (draft), `unlisted`, and `public` alongside dynamic mode headings and state chips (`20261020-UX-04`).
- **`[implemented]`** Enforced auto-slug generation from entry titles on new draft entries (`20261020-UX-04`).
- **`[implemented]`** Fixed V16 sidebar link leak: private entries in the admin sidebar no longer link to `/work/:slug`, eliminating 404 navigation errors (`20261020-UX-04`).
- **`[implemented]`** Added 30-second dismissible undo confirmation banner (`#admin-undo-banner`) with immediate restore capability (`20261020-UX-04`).
- **`[implemented]`** Added revision history listing to the third-pane inspector (`#inspector-revisions-list`) backed by new endpoint `GET /api/entries/:id/revisions` (`20261020-UX-04`).
- **`[implemented]`** Enforced revision immutability and duplicate slug rejection across API (`POST /api/entries` returning 409 Conflict) and database repositories (`P6`, `Fix 9`).
- **`[implemented]`** Removed `written_at` overwrite with `valid_from` for non-hindsight entries in repository; transaction time defaults cleanly to `now()` while preserving seed/fixture overrides (`P4`, `Fix 9`).
- **`[implemented]`** Replaced worker stub body hash with real SHA-256 digest (`P4`, `Fix 9`).
- **`[implemented]`** Authored regression test probe in `apps/api/src/conformance/ux-p0-probes.conformance.test.ts` for `20261020-UX-04`.
- **`[implemented]`** Updated `docs/audits/register.yml` marking `20261020-UX-04`, `P4`, and `P6` as `status: fixed`.

---

## 2. CI Evidence

### 2.1 Commit and PR Provenance
- PR: `#31` (`feat(cms): lifecycle extension, revision immutability, and redaction inspector (UX-04, P4, P6)`)
- Merge Method: Rebase and merge (`origin/main` at `369db83`)
- Commits landed:
  - `426078b` (`feat(cms): lifecycle extension, revision immutability, and redaction inspector (UX-04, P4, P6)`)
  - `369db83` (`fix(triage): evaluate receipt and handover counts only when modified in diff`)
- Evidence SHA: `369db83`
- Ancestor Verification: `git merge-base --is-ancestor 369db83 HEAD` exits 0.

### 2.2 Verbatim Vitest Results per Package (Job 121455549245)
```
@living-portfolio/ai:test:  Test Files  1 passed (1)
@living-portfolio/ai:test:  Tests  7 passed (7)
@living-portfolio/core:test:  Test Files  1 passed (1)
@living-portfolio/core:test:  Tests  17 passed (17)
@living-portfolio/config:test:  Test Files  1 passed (1)
@living-portfolio/config:test:  Tests  5 passed (5)
@living-portfolio/web:test:  Test Files  1 passed (1)
@living-portfolio/web:test:  Tests  5 passed (5)
@living-portfolio/worker:test:  Test Files  2 passed (2)
@living-portfolio/worker:test:  Tests  9 passed (9)
@living-portfolio/db:test:  Test Files  4 passed (4)
@living-portfolio/db:test:  Tests  43 passed (43)
@living-portfolio/api:test:  Test Files  16 passed (16)
@living-portfolio/api:test:  Tests  113 passed (113)
```
*Total: 26 test files, 199 tests passed across 7 packages (computed from the above).*

### 2.3 Verbatim Playwright E2E Results (Job 121455548857)
```
11 passed (11.5s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 121455549713)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 121455549226)
```
7:46AM INF 114 commits scanned.
✓ Gitleaks scan passed with 0 leaks.
7:46AM INF no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 121455549245)
```
✓ [OSR-07 DCO] All 2 commit(s) in eb5488081db799cc941fe16e92b2517e51414d8e..369db8381e79a6d1d804fa3636bab32aa87bd6e4 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

Total: 199 passed tests across 26 test files.

### Tests Added
1. `apps/api/src/conformance/ux-p0-probes.conformance.test.ts`:
   - `[20261020-UX-04] (status=fixed) [P0-4 / Fix 9] admin workspace provides save draft, unpublish, delete, revision history, and undo banner; private entries do not link to /work/:slug; duplicate slugs return 409 Conflict`

---

## 4. Files Touched

Base Evidence SHA: `295c09dae642311a9a9f1e0f9c8d83379e57c655`
Target Evidence SHA: `369db8381e79a6d1d804fa3636bab32aa87bd6e4`

Files verified by `receipt:check`:
- `apps/api/src/api.test.ts`
- `apps/api/src/conformance/ux-p0-probes.conformance.test.ts`
- `apps/api/src/routes/entries.ts`
- `apps/web/src/renderer.ts`
- `apps/worker/src/worker.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A022-wp2-5-production-cutover.md`
- `packages/db/src/postgres-repository.ts`
- `packages/db/src/repository.ts`
- `scripts/triage`

*Note: `docs/INDEX.md`, `docs/doc-registry.json`, and `docs/execution-reports/A022-wp2-5-production-cutover.md` were merged into `main` in docs PR #30 between Evidence SHAs `295c09d` and `369db83`.*

---

## 5. Register and Backlog Changes

- Marked findings `20261020-UX-04`, `P4`, and `P6` as `status: fixed` in `docs/audits/register.yml`.
- Register status totals: 37 fixed, 3 partial, 57 open (97 total).

---

## 6. Not Done (Tagged)

- **`[not-started]`** Task WP-3.2 (`B1`–`B4`, `Fix 11`): Postgres-persisted BudgetGovernor ledger and midnight reset.
- **`[not-started]`** Task WP-3.3 (`M2`, `Fix 12`): Degradation ladder answer cache and fallback provider.
- **`[not-started]`** Task WP-3.4 (`S7`, `Fix 13`): Data-class privacy router and enrichment scanner.
- **`[not-started]`** Task WP-3.5 (`G8`, `Fix 10`): Gate WP-3 closure and verification.

---

## 7. Changes to Earlier Reports

None. All earlier reports stand unmodified.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A023-wp3-1-cms-lifecycle.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '369db83' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 295c09d..369db83 (12 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A023-wp3-1-cms-lifecycle.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 121455549245)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 121455548857)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 121455549713)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 121455549226)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 121455549245)" verified against CI logs.

🎉 All receipt checks PASSED for A023-wp3-1-cms-lifecycle.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R1
- Receipts since last handover: 1 (A023; last handover was H003 at A022).
- Clean-boundary preconditions: all tests pass cleanly, 0 static analysis alerts, 0 credential leaks, linear git history with DCO sign-offs.
- Next action: Proceed with Task WP-3.2 (`B1`–`B4`, `Fix 11`).
