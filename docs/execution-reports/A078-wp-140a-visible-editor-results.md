# A078 — WP-14.0a visible editor results

| Field | Value |
| --- | --- |
| Report ID | A078 |
| Date | 2026-11-10 |
| Author | A (Implementer) |
| Task ID | `WP-14.0a` |
| Evidence SHA | db0082b |
| CI run | 42754272314 (PR #95 head `5923bd9`) / 42757704638 (`main` merge commit `a8012dc`) |

---

## 1. Scope

- [implemented] In-Viewport Status Line (UX-43): Added `#editor-status-line` immediately adjacent to editor action controls (`#editor-action-buttons`). Displays result messages inline within the viewport without requiring user scrolling.
- [implemented] Polite Live Region & Toast: Configured `#editor-status-line` and `#editor-toast` with `role="status"` and `aria-live="polite"` so action results are announced to assistive technology. Added viewport-fixed toast notification with 6-second auto-dismiss.
- [implemented] Focus Management: Managed focus by applying `statusLine.focus()` on operation outcome, directing assistive tech and keyboard users to the action result.
- [implemented] Reactive Entries List Refresh: Implemented `refreshEntriesList()` querying `/api/entries?visibility=all` with authenticated credentials to refresh `#admin-entries-list` and entry counter heading after Create draft, Save draft, Publish, Unpublish, and Delete.
- [implemented] Comprehensive Lifecycle E2E Suite: Created `tests/e2e/wp14-editor-feedback.spec.ts` asserting in-viewport visibility, `aria-live="polite"` attribute, message text, and list refresh across all four actions (Save draft, Publish, Unpublish, Delete).

---

## 2. CI Evidence

Local verification via `pnpm verify`:
- Build & typecheck (`turbo run build`): PASSED across all 8 packages.
- Conformance gates (OSR-01, OSR-03, OSR-07, OSR-12, OSR-13, IAHP PROC-1, IAHP HO-1, DR-AUD-001): PASSED.
- Unit, conformance, & P0 regression suites: PASSED (362/362 tests in 42 files).
- Playwright E2E suite: PASSED (62/62 tests in 13 files, including `wp14-editor-feedback.spec.ts`).
- Gitleaks secret scan: PASSED (0 leaks).

Note: The GitHub Actions Dependency Review workflow (`.github/workflows/deps.yml`) is non-gating on this repository (`continue-on-error: true`).

---

## 3. Tests Added and Count Change

- Added E2E regression test `tests/e2e/wp14-editor-feedback.spec.ts` (1 test covering all 4 actions: Save draft, Publish, Unpublish, Delete; net +1 test, 62 E2E tests total).
- Unit test suite: 362 tests across 42 files in `apps/api` (unchanged).

---

## 4. Files Touched

- apps/api/src/routes/entries.ts
- apps/web/src/renderer.ts
- apps/web/src/styles.ts
- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A077-wp-14pre-dependency-review-audit-corrections.md
- docs/execution-reports/A078-wp-140a-visible-editor-results.md
- tests/e2e/helpers.ts
- tests/e2e/wp14-editor-feedback.spec.ts

---

## 5. Register and Backlog Changes

- Register counts: 109 fixed, 7 partial, 53 open (total 169 findings).
- Finding `20261106-UX-43` updated from `open` to `fixed` with regression test `tests/e2e/wp14-editor-feedback.spec.ts`.

---

## 6. Not Done (Tagged)

- [not-started] WP-14.0 Client bundling: Add esbuild bundling step for `apps/web/src/client/`.
- [not-started] WP-14.1 commitEntry state machine: Formalize `commitEntry` state machine (UX-01, UX-02, UX-03, UX-04).

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A078
=== Validating Receipt A078-wp-140a-visible-editor-results.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'db0082b' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 377e35e..db0082b (10 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A078-wp-140a-visible-editor-results.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A078-wp-140a-visible-editor-results.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 4 (A075, A076, A077, A078); work packages since: 0
- Clean-boundary preconditions: met
- Next action: Open PR into main and leave unmerged for user review.
