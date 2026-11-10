# A083 — WP-14.3 publish dialog

| Field | Value |
| --- | --- |
| Report ID | A083 |
| Date | 2026-11-10 |
| Author | A (Implementer) |
| Task ID | `WP-14.3` |
| Evidence SHA | 20b53d7 |
| CI run | local verify (`pnpm verify`) green |

---

## 1. Scope

- [implemented] Modal Publish Pre-Flight Dialog: Added `#publish-dialog` with `role="dialog"`, `aria-modal="true"`, and full focus trapping (Tab/Shift-Tab cycle, Escape close, and focus restoration to `#btn-open-publish-dialog`).
- [implemented] Automatic Pre-Flight Scan: Opening the dialog auto-runs the private details check (`POST /api/entries/redaction-preview`) without requiring a manual prior check. Displays "✓ Nothing found (0 confidential findings)" for clean content, or finding summary with link to detailed drawer.
- [implemented] Conditional NDA Confirmation Gate: The NDA confirmation checkbox (`#publish-dialog-nda`) is rendered only when matches exist. Attempting to publish with flagged findings without NDA confirmation blocks publication with an inline alert.
- [implemented] Visibility Choice & Next Steps Checklist: Pre-flight checklist displays Public/Unlisted choice and what happens next (static rebuild queued, enrichment pipeline queued, RSS/sitemap updated, exact entry URL).
- [implemented] Success Toast with Working Unpublish: Upon publication, dialog closes and toast provides a "View page" link and working "Unpublish" action (`#btn-toast-unpublish`).
- [implemented] E2E Verification Suite: Authored `tests/e2e/wp14-publish-dialog.spec.ts` testing auto-scan, focus trap & return, working toast Unpublish, and blocking of sensitive matches until confirmed.

---

## 2. CI Evidence

Local verification via `pnpm verify`:
- Build & typecheck (`turbo run build`): PASSED across all 8 packages.
- Conformance gates (OSR-01, OSR-03, OSR-07, OSR-12, OSR-13, IAHP PROC-1, IAHP HO-1, DR-AUD-001): PASSED.
- Unit, conformance, & P0 regression suites: PASSED (362/362 tests in 42 files).
- Playwright E2E suite: PASSED (73/73 tests in 17 files, including new `wp14-publish-dialog.spec.ts`).
- Gitleaks secret scan: PASSED (0 leaks).

Note: The GitHub Actions Dependency Review workflow (`.github/workflows/deps.yml`) is non-gating on this repository (`continue-on-error: true`).

---

## 3. Tests Added and Count Change

- Added E2E regression test `tests/e2e/wp14-publish-dialog.spec.ts` (2 tests, net +2 E2E tests, total 73 E2E tests across 17 files).
- Unit and conformance test suites: 362 tests across 42 files in `apps/api` (unchanged).

---

## 4. Files Touched

- apps/web/src/client/admin-entry.ts
- apps/web/src/client/publish-dialog.ts
- apps/web/src/renderer.ts
- docs/INDEX.md
- docs/doc-registry.json
- docs/execution-reports/A082-wp-142-state-and-date-correctness.md
- tests/e2e/wp14-publish-dialog.spec.ts

---

## 5. Register and Backlog Changes

- Register counts: 109 fixed, 7 partial, 53 open (total 169 findings, unchanged pending Gate G14 register update).
- Addresses findings UX-03 (part) and UX-13 (part).

---

## 6. Not Done (Tagged)

- [not-started] WP-14.4 Draft buffer & autosave: Local draft caching and unsaved exit guard (2.1.3).
- [not-started] WP-14.5 Calibration defaults: Mechanism switches and minimum-sample gates (UX-08).
- [not-started] WP-14.6 Quick visual repairs: Tokens, CSS variables check, flex-wrap gap fix (UI-01, UI-03).

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A083
=== Validating Receipt A083-wp-143-publish-dialog.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '20b53d7' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff e72b4ad..20b53d7 (7 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A083-wp-143-publish-dialog.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A083-wp-143-publish-dialog.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 9 (A075, A076, A077, A078, A079, A080, A081, A082, A083); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-14.4
