# A082 — WP-14.2 state and date correctness

| Field | Value |
| --- | --- |
| Report ID | A082 |
| Date | 2026-11-10 |
| Author | A (Implementer) |
| Task ID | `WP-14.2` |
| Evidence SHA | e72b4ad |
| CI run | local verify (`pnpm verify`) green |

---

## 1. Scope

- [implemented] Persistent State Chip (UX-10): Rendered `#chip-current-state` beside editor mode heading reflecting Draft (`State: PRIVATE (Draft)`), Public (`State: PUBLIC`), and Unlisted (`State: UNLISTED`) across all authoring and lifecycle actions.
- [implemented] Client-Side Date Defaulting & Validation Without Throwing (UX-11): Removed baked-in date string `value="2026-10-19"` from markup. Defaulted date to today dynamically on client (`new Date().toISOString().slice(0, 10)`). Added inline error container `#entry-date-error` validating on `blur` and during `commitEntry`, preventing unhandled `RangeError: Invalid time value` exceptions.
- [implemented] Temporal Confidence Control (UX-22): Added `<select id="entry-temporal-level">` supporting `exact`, `range`, and `estimated`. Selecting `range` dynamically displays `#range-end-container` with `#entry-date-range-end`. Passed `temporal_level` and `valid_from_range_end` across all entry and revision write paths.
- [implemented] Re-selection Synchronization: Selecting an entry in the list restores its saved `temporal_level`, `valid_from_range_end`, and `valid_from` without errors.
- [implemented] E2E Verification Suite: Authored `tests/e2e/wp14-state-date.spec.ts` verifying state chip transitions (Draft, Public, Unlisted), today's date defaulting, inline error on clearing without throwing, and persistence of Estimated and Range dates.

---

## 2. CI Evidence

Local verification via `pnpm verify`:
- Build & typecheck (`turbo run build`): PASSED across all 8 packages.
- Conformance gates (OSR-01, OSR-03, OSR-07, OSR-12, OSR-13, IAHP PROC-1, IAHP HO-1, DR-AUD-001): PASSED.
- Unit, conformance, & P0 regression suites: PASSED (362/362 tests in 42 files).
- Playwright E2E suite: PASSED (71/71 tests in 16 files, including new `wp14-state-date.spec.ts`).
- Gitleaks secret scan: PASSED (0 leaks).

Note: The GitHub Actions Dependency Review workflow (`.github/workflows/deps.yml`) is non-gating on this repository (`continue-on-error: true`).

---

## 3. Tests Added and Count Change

- Added E2E regression test `tests/e2e/wp14-state-date.spec.ts` (3 tests, net +3 E2E tests, total 71 E2E tests across 16 files).
- Unit and conformance test suites: 362 tests across 42 files in `apps/api` (unchanged).

---

## 4. Files Touched

- apps/web/src/client/admin-entry.ts
- apps/web/src/client/commit-entry.ts
- apps/web/src/renderer.ts
- docs/INDEX.md
- docs/doc-registry.json
- docs/execution-reports/A081-wp-141-commitentry-state-machine.md
- tests/e2e/wp14-state-date.spec.ts

---

## 5. Register and Backlog Changes

- Register counts: 109 fixed, 7 partial, 53 open (total 169 findings, unchanged pending Gate G14 register update).
- Closes technical debt for UX-10, UX-11, and UX-22.

---

## 6. Not Done (Tagged)

- [not-started] WP-14.3 Publish dialog: Pre-flight checklist with auto-scan, NDA step, and single publish action (UX-03, UX-13).
- [not-started] WP-14.4 Draft buffer & autosave: Local draft caching and unsaved exit guard (2.1.3).
- [not-started] WP-14.5 Calibration defaults: Mechanism switches and minimum-sample gates (UX-08).
- [not-started] WP-14.6 Quick visual repairs: Tokens, CSS variables check, flex-wrap gap fix (UI-01, UI-03).

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A082
=== Validating Receipt A082-wp-142-state-and-date-correctness.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'e72b4ad' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 10b163d..e72b4ad (7 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A082-wp-142-state-and-date-correctness.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A082-wp-142-state-and-date-correctness.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 8 (A075, A076, A077, A078, A079, A080, A081, A082); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-14.3
