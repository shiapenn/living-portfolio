# A121 — wp16r-r3-remove-and-fix

| Field | Value |
| --- | --- |
| Report ID | A121 |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Task ID | `WP-16.R R3` |
| Evidence SHA | `83605506abb23b928448d3680105499e095ba4ec` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/43730897276 |

---

## 1. Scope

Executed `WP-16.R R3` (Minimal Visual Reset — remove non-journey elements, fix layout defects, and zero D-MIN style census budgets):

### Elements Removed (with reasons)
- [implemented] `#today-explanation` (What/When/How/Impact explainer) on Today (`apps/web/src/pages/admin/dashboard.ts`): removed per D-MIN #11 (no explainer cards).
- [implemented] Per-row `Actions` button/menu (`.lp-row-menu-btn`, `[role="menu"]`) on Entries list (`apps/web/src/pages/admin/entries/list.ts`, `list-script.ts`): removed per R3; clicking the entry row opens `/admin/entries/:id`.
- [implemented] `L0` / `.lp-structure-meter` dot meter in entry rows (`apps/web/src/pages/admin/entries/list.ts`, `list-script.ts`): removed per R3 / D-MIN #1.
- [implemented] Non-existent admin nav items and dead routes (`/admin/analytics`, `/admin/routing`, `/admin/safety`, `/admin/settings/account`, etc.) in `RAIL_GROUPS` (`apps/web/src/layouts/admin-shell.ts`): removed per D-MIN #12 and D-CONTRACT-6.
- [implemented] Automated answering card and Pending escalations card (`renderWorkspaceSafetyControls`) on the editor page (`apps/web/src/pages/admin/entries/editor.ts`, `apps/web/src/client/admin/editor-page.ts`): removed from the editor per D-MIN #12 (editor holds only list, editor, and optional structure panel).
- [implemented] Raw `JSON.stringify(...)` scope/constraint output on Answer rules (`apps/web/src/pages/admin/audit.ts`): removed per D-MIN #8 (never show raw JSON) and replaced with plain-sentence formatting.
- [implemented] Standalone `#theme-toggle` in the top header bar (`apps/web/src/layouts/admin-shell.ts`): removed from top bar and relocated into `#lp-account-menu` per D-MIN #3.

### Elements Added / Relocated (with reasons)
- [implemented] `#btn-killswitch` + `#ref-killswitch-badge` on Today (`apps/web/src/pages/admin/dashboard.ts`): relocated from editor page so automated-answering control remains accessible per UX-104 (reusing existing Inbox for escalations per UX-105).
- [implemented] `#theme-toggle` inside `#lp-account-menu` (`apps/web/src/layouts/admin-shell.ts`): relocated from top header bar per D-MIN #3.

### Defects Fixed
- [implemented] Fixed `#entries-empty-state` showing above non-empty lists by adding `[hidden] { display: none !important; }` in `apps/web/src/styles.ts`.
- [implemented] Fixed monospace font in `#inbox-reply-text` and replaced JS textarea height inline style with CSS `field-sizing: content` in `.lp-textarea` (`apps/web/src/styles.ts`).
- [implemented] Separated Send reply and Decline reason/button on `/admin/inbox/:id` using `.lp-stack-md` + `.lp-inbox-decline-row` (`apps/web/src/pages/admin/inbox.ts`, `styles.ts`).
- [implemented] Moved `data-banner="alpha-warning"` below `.lp-section-grid` on Settings and aligned admin headings to D-MIN sans sizes `24px`/`16px` (`apps/web/src/pages/admin/settings.ts`, `styles.ts`).
- [implemented] Eliminated the last inline style (`progressFill.style.width` -> `data-step="1..6"`) in `setup-script-part1.ts` and all remaining `13px` / non-scale `--space-3` / `--space-8` values in admin CSS (`apps/web/src/styles.ts`).
- [implemented] Shrank `docs/audits/style-census-budget.json` to `0` across all 6 metrics (`invalidRadii: 0`, `invalidControlHeights: 0`, `invalidFontSizes: 0`, `invalidSpacing: 0`, `inlineStyles: 0`, `multiSignatureRoles: 0`).

## 2. CI Evidence

- PR #168 (`feat/wp-16-r3-remove-and-fix` -> `main`, merge commit `83605506abb23b928448d3680105499e095ba4ec`):
  - `CI & Audit Conformance Gate` (`main` push run `43730897276`, wall-clock; GitHub `billable` field returns `0`):
    - `Detect Changed Scope`: `success` (`6s` / `0.10 min`)
    - `Typecheck, Unit, Security Regression, DCO & Audit Gate`: `success` (`2m22s` / `2.37 min`)
    - `Playwright End-to-End Suite`: `success` (`2m4s` / `2.07 min`)
  - `Secret Scan (gitleaks)` (`main` push run `43730897287`):
    - `Gitleaks Secret & Credential Scan`: `success` (`10s` / `0.17 min`)

## 3. Tests Added and Count Change

- Updated unit tests (`apps/web/src/pages/admin/dashboard.test.ts`, `apps/web/src/pages/admin/entries/list.test.ts`) and E2E specs (`tests/e2e/wp15-7-editor-reference-page.spec.ts`, `tests/e2e/wp16-0-g15-defects-and-parity.spec.ts`, `tests/e2e/wp16-1-admin-shell-and-routes.spec.ts`, `tests/e2e/wp16-2-today-dashboard.spec.ts`, `tests/e2e/wp16-3-entries-list.spec.ts`) to assert the R3 removals/relocations and row-click navigation.
- Verified `pnpm verify` (15/15 gates) and `pnpm test:e2e` (113/113 Playwright tests) passed, with `wp16-r-style-census.spec.ts` reporting `0` across all 6 violation metrics.

## 4. Files Touched

- `apps/web/src/client/admin/editor-page.ts`
- `apps/web/src/layouts/admin-shell.ts`
- `apps/web/src/pages/admin/audit.ts`
- `apps/web/src/pages/admin/dashboard.test.ts`
- `apps/web/src/pages/admin/dashboard.ts`
- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/pages/admin/entries/list-script.ts`
- `apps/web/src/pages/admin/entries/list.test.ts`
- `apps/web/src/pages/admin/entries/list.ts`
- `apps/web/src/pages/admin/inbox.ts`
- `apps/web/src/pages/admin/settings.ts`
- `apps/web/src/pages/admin/setup-script-part1.ts`
- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/audits/style-census-budget.json`
- `docs/doc-registry.json`
- `docs/execution-reports/A120-wp16r-r2-migrate-admin-pages.md`
- `tests/e2e/wp15-7-editor-reference-page.spec.ts`
- `tests/e2e/wp16-0-g15-defects-and-parity.spec.ts`
- `tests/e2e/wp16-1-admin-shell-and-routes.spec.ts`
- `tests/e2e/wp16-2-today-dashboard.spec.ts`
- `tests/e2e/wp16-3-entries-list.spec.ts`

## 5. Register and Backlog Changes

- Transitioned `20261106-UX-107` and `20261106-UX-108` from `open` to `fixed` in `docs/audits/register.yml` (`verified_by: tests/e2e/wp16-r-style-census.spec.ts`).

## 6. Not Done (Tagged)

- [not-started] `WP-16.R R4` (contact sheets of every admin page at 1280 and 320 px light/dark zipped to `~/Desktop/wp16r-contact-sheets.zip` and final census report) remains open.

## 7. Changes to Earlier Reports

- None.

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A121
=== Validating Receipt A121-wp16r-r3-remove-and-fix.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '83605506abb23b928448d3680105499e095ba4ec' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 0ccfa64fb0989f7e02554e1f4c999e5819171cc7..83605506abb23b928448d3680105499e095ba4ec (23 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A121-wp16r-r3-remove-and-fix.md.

🎉 All receipt checks PASSED for A121-wp16r-r3-remove-and-fix.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 7 (A115, A116, A117, A118, A119, A120, A121); work packages since: 2
- Clean-boundary preconditions: met
- Next action: continue with WP-16.R R4 (contact sheets and final census report)
