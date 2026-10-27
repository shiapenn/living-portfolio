# A030 — WP-4.3 Time-Travel Correctness and Navigation Links

| Field | Value |
| --- | --- |
| Report ID | A030 |
| Date | 2026-10-27 |
| Author | A (Implementer) |
| Task ID | `WP-4.3` |
| Evidence SHA | `fbb1985` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/40452447234 |

---

## 1. Scope

- **`[implemented]`** Default as-of date on `/timeline`: dynamically sets default date to today's date (`new Date().toISOString().slice(0, 10)`), ensuring that submitting the form without modifications excludes 0 active entries.
- **`[implemented]`** Dynamic month-end calculations: replaced hardcoded day 28 in strata timeline bands with dynamic calculation of the actual last day of each month (`new Date(Date.UTC(year, month, 0)).getUTCDate()`), correctly generating exact month-end dates (28, 29, 30, 31).
- **`[implemented]`** Strata timeline keyboard navigation: implemented client-side keyboard navigation for `.strata-band` elements supporting `ArrowLeft`/`ArrowRight`, `ArrowUp`/`ArrowDown`, `Home`/`End`, `PageUp`/`PageDown`, and `Enter`/`Space` to scrub and activate time-travel.
- **`[implemented]`** Robust date validation: added `parseAsOfDate` helper in `@living-portfolio/web` that gracefully handles invalid date strings (e.g. `as_of=garbage-date`) by falling back to present and rendering an alert warning banner without crashing.
- **`[implemented]`** Timeline empty state: added informative empty state with a "Reset to present" link when all entries are filtered out temporally.
- **`[implemented]`** Context carrying of as_of query parameter: carried `as_of` across `/timeline` entry links, `/work` and `/writing` temporal filters and outcome chips, `/work/:slug` (historical revision lookup, sticky as-of status banner, view switch link, and scoped ask form hidden input), and `/ask` (auto-expanded `<details open>`, `#facet-asof` prefill, and active time-travel query banner).
- **`[implemented]`** Automated tests: added 7 unit tests in `apps/web/src/web.test.ts` and 4 Playwright browser tests in `tests/e2e/visitor-time-travel.spec.ts`.
- **`[implemented]`** Register governance: updated `docs/audits/register.yml` transitioning finding `20261020-UX-12` (P0-11) to `status: fixed`.

---

## 2. CI Evidence

### 2.1 Commit and PR Provenance
- PR: `#45` (`feat(wp4.3): time-travel correctness, keyboard navigation, and as-of context carrying (Fix 20261020-UX-12)`)
- Merge Method: Rebase and merge (`origin/main` at `fbb1985640fe65f24f603c4cf7e7fb171aa5553e`)
- Commits landed: `fbb1985` (`feat(wp4.3): time-travel correctness, keyboard navigation, and as-of context carrying (Fix 20261020-UX-12)`)
- Evidence SHA: `fbb1985`
- Ancestor Verification: `git merge-base --is-ancestor fbb1985 HEAD` exits 0.

### 2.2 Verbatim Vitest Results per Package (Job 122018061547)
```
@living-portfolio/core:test:  Test Files  1 passed (1)
@living-portfolio/core:test:  Tests  17 passed (17)
@living-portfolio/ai:test:  Test Files  1 passed (1)
@living-portfolio/ai:test:  Tests  16 passed (16)
@living-portfolio/config:test:  Test Files  1 passed (1)
@living-portfolio/config:test:  Tests  5 passed (5)
@living-portfolio/web:test:  Test Files  1 passed (1)
@living-portfolio/web:test:  Tests  20 passed (20)
@living-portfolio/worker:test:  Test Files  2 passed (2)
@living-portfolio/worker:test:  Tests  12 passed (12)
@living-portfolio/db:test:  Test Files  4 passed (4)
@living-portfolio/db:test:  Tests  45 passed (45)
@living-portfolio/api:test:  Test Files  16 passed (16)
@living-portfolio/api:test:  Tests  125 passed (125)
```
*Total: 26 test files, 240 passed tests across 7 packages (computed from the above).*

### 2.3 Verbatim Playwright E2E Results (Job 122018061916)
```
21 passed (13.3s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 122018061817)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 122018061521)
```
134 commits scanned.
scanned ~2870865 bytes (2.87 MB) in 439ms
✓ Gitleaks scan passed with 0 leaks.
no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 122018061547)
```
✓ [OSR-07 DCO] All 1 commit(s) in 52422cfc5908ebe9f4f4133640ed15566d04c2c3..fbb19852cd6022debcb37d0911e66bd6d616a4be carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

Total count: 240 tests (progressed from 233 tests in A029).

| Test Suite | File | Tests Added / Modified |
| --- | --- | --- |
| Web UI Component & Page Suite | `apps/web/src/web.test.ts` | +7 tests covering `parseAsOfDate` valid/invalid/empty inputs, today's default date inclusion, dynamic month-end computation, keyboard navigation handler presence, graceful invalid date alert fallback, timeline empty state, cross-route context carrying, and historical revision resolution on entry detail |
| Visitor Time-Travel Browser Suite | `tests/e2e/visitor-time-travel.spec.ts` | +4 Playwright E2E browser tests covering default date apply and invalid date alert, dynamic month-end band navigation via keyboard (ArrowRight, Enter), empty state with reset-to-present, and end-to-end as_of context carrying from timeline to historical revision and scoped ask |

Test count progression: 233 -> 240 unit/conformance tests (+7 tests in web). Playwright tests: 17 -> 21 tests (+4 E2E tests).

---

## 4. Files Touched

Matches `git diff 61f7b73..fbb1985 --name-only`:
- `apps/api/src/conformance/sarif-gate.conformance.test.ts`
- `apps/api/src/routes/timeline.ts`
- `apps/api/src/server.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A029-wp-42-visitor-escalation-loop-and-booking-system.md`
- `scripts/sarif-gate`
- `tests/e2e/visitor-time-travel.spec.ts`

---

## 5. Register and Backlog Changes

- `docs/audits/register.yml`:
  - `20261020-UX-12` (Time-travel does not travel. The as-of date is not carried to entries, to Ask, or to nav): transitioned from `status: open` to `status: fixed`. Regression test: `tests/e2e/visitor-time-travel.spec.ts`.

---

## 6. Not Done (Tagged)

- **`[not-started]`** Work Package 5 (Phase 4 / v0.3): Major structural and information-architecture refactoring.

---

## 7. Changes to Earlier Reports

- Errata for Report A028: The execution report file was generated with slug `A028-wp-41-structure-review-loop-and-import-planner.md` (using `wp-41` instead of `wp4-1`). Per document naming convention `A###-wp<major>-<minor>-<slug>.md`, the canonical work package identifier is `wp4-1`. The file is retained as immutable on `main`.
- Errata for Report A029: The execution report file was generated with slug `A029-wp-42-visitor-escalation-loop-and-booking-system.md` (using `wp-42` instead of `wp4-2`). Per document naming convention `A###-wp<major>-<minor>-<slug>.md`, the canonical work package identifier is `wp4-2`. The file is retained as immutable on `main`.
- Starting with A030, all future work package receipts strictly adhere to the `A###-wp<major>-<minor>-<slug>.md` convention (`A030-wp4-3-time-travel-correctness.md`).

---

## 8. Receipt Gate Self-Validation
```
=== Validating Receipt A030-wp4-3-time-travel-correctness.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'fbb1985' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 61f7b73..fbb1985 (11 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A030-wp4-3-time-travel-correctness.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 122018061547)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 122018061916)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 122018061817)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 122018061521)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 122018061547)" verified against CI logs.

🎉 All receipt checks PASSED for A030-wp4-3-time-travel-correctness.md.
```

---

## 9. Handover Decision
- Decision: REQUIRED
- Rule(s): HO-R1
- Receipts since last handover: 3 (A028, A029, A030); work packages since: 1 (WP-4)
- Clean-boundary preconditions: met
- Next action: produce and publish Handover H005 (WP-4 Gate Closure and WP-5 Kickoff) per HO-R1
