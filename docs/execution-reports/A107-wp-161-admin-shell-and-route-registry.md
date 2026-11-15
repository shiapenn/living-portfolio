# A107 — WP-16.1 Admin shell, auth shell, route registry, and settings 320px fix

| Field | Value |
| --- | --- |
| Report ID | A107 |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Task ID | `WP-16.1` (PR #139) |
| Evidence SHA | `0ae9c76` |
| CI run | `43686352093` (CI & Audit Conformance Gate), `43686352098` (Secret Scan), `43686352096` (Staging Deploy) on `main` |

---

## 1. Scope

1. `[implemented]` **Admin & Auth Shells (`UX-06`, `UX-39`, `UX-91`)**: Created `apps/web/src/layouts/admin-shell.ts` exporting `renderAdminShell` (collapsible `#lp-admin-rail` with `Write`/`Respond`/`Govern`/`Configure` groups, top bar with `#lp-status-popover-btn`/`#lp-status-popover` legend + drill-down link, `#theme-toggle` SVG icon with `aria-pressed`, `#lp-account-menu-btn`/`#lp-account-menu` with `#btn-admin-logout` via `apiClient`) and `renderAuthShell` (brand + SVG theme toggle icon only; zero public nav/footer/rail).
2. `[implemented]` **Legacy Page Shell Swap & Stepper/Overflow Fixes (`UX-94`, `UX-101`)**: Swapped `/admin/setup` and `/admin/login` to `renderAuthShell` and `/admin/import` and `/admin/settings` to `renderAdminShell`; removed duplicated `"← Back to Workspace"` buttons; updated `#wizard-step-chip` to `"Step 1 of 6: Account"` and collapsed `.wizard-step-labels` below `768 px`; fixed `/admin/settings` `minmax(min(100%, 340px),1fr)` grid, wrapped settings tables in `.lp-table-scroll`, and made admin header compact at `320 px` (`0` horizontal overflow).
3. `[implemented]` **§6.4 Admin Route Registry**: Created `apps/web/src/pages/admin/section-page.ts` (`renderAdminSectionPage`) and registered and guarded `/admin/entries`, `/admin/entries/new`, `/admin/entries/:id`, `/admin/entries/:id/history`, `/admin/quick-log`, `/quick-log`, `/admin/pages`, `/admin/inbox`, `/admin/inbox/:id`, `/admin/bookings`, `/admin/audit`, `/admin/calibration`, `/admin/structure`, `/admin/routing`, `/admin/theme`, and `/admin/settings/:section` in both `apps/web/src/app.ts` and `apps/api/src/adapter/bundled-web.ts` (preserving `404` for `/admin/entries/editor` in production).

---

## 2. CI Evidence

- `main` push CI & Audit Conformance Gate (`43686352093`): `success` (`Typecheck, Unit, Security Regression, DCO & Audit Gate` 1m52s; `Playwright End-to-End Suite` 1m34s).
- `main` push Secret Scan (`43686352098`): `success`.
- `main` push Staging Automated Continuous Deployment (`43686352096`): `success`.
- Local pre-push `pnpm verify` (all 15 gates) and `pnpm test:e2e` (99 passed, 0 failed): `local output` passed.

---

## 3. Tests Added and Count Change

- Added `tests/e2e/wp16-1-admin-shell-and-routes.spec.ts` (4 Playwright E2E tests covering unauthenticated redirects across all §6.4 routes, minimal auth shell on `/admin/setup` and `/admin/login`, admin shell + `0` overflow at `320 px` + `#lp-status-popover` + `#lp-account-menu` on `/admin/settings` and `/admin/import`, and authenticated rendering across all §6.4 routes).
- Existing tests changed (3 unit/E2E assertions updated for WP-16.1 behavior, 0 removed):
  - `apps/web/src/web.test.ts`: updated `"← Back to Workspace"` assertion to `not.toContain('← Back to Workspace')` (still asserting `href="/admin"` rail link; `UX-91`), updated `'Step 1 of 6 · First-Run Wizard'` to `'Step 1 of 6: Account'` (`UX-94`), and updated `return renderLayout` regex to `return render(?:Layout|AuthShell)`.
  - `tests/e2e/auth.spec.ts`: updated `return renderLayout` regex in test 14 to `return render(?:Layout|AuthShell)`.
  - `tests/e2e/wp5-admin-settings.spec.ts`: updated `a.btn[href="/admin"]` selector to `#lp-admin-rail a[href="/admin"]` (`UX-91`).
  - `apps/web/src/pages/admin/entries/editor.test.ts`: updated production check so `/admin/entries/editor?fixture=draft&theme=dark` still returns `404` while newly registered §6.4 routes `/admin/entries/new` and `/admin/entries/:id` return `200` and ignore `?theme=dark` / fixture overrides.

---

## 4. Files Touched

- `apps/api/src/adapter/bundled-web.ts`
- `apps/web/src/app.ts`
- `apps/web/src/layouts/admin-shell.ts`
- `apps/web/src/pages/admin/entries/editor.test.ts`
- `apps/web/src/pages/admin/import.ts`
- `apps/web/src/pages/admin/login.ts`
- `apps/web/src/pages/admin/section-page.ts`
- `apps/web/src/pages/admin/settings.ts`
- `apps/web/src/pages/admin/setup.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A106-wp-160-g15-defects-and-capability-parity-fixes.md`
- `tests/e2e/auth.spec.ts`
- `tests/e2e/wp16-1-admin-shell-and-routes.spec.ts`
- `tests/e2e/wp5-admin-settings.spec.ts`

---

## 5. Register and Backlog Changes

- Transitioned 5 findings in `docs/audits/register.yml` from `open` to `fixed` with `regression_test: tests/e2e/wp16-1-admin-shell-and-routes.spec.ts`:
  - `20261106-UX-06`, `20261106-UX-39`, `20261106-UX-91`, `20261106-UX-94`, `20261106-UX-101`.

---

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.2`..`WP-16.7` (next task: `WP-16.2`).

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A107
=== Validating Receipt A107-wp-161-admin-shell-and-route-registry.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '0ae9c76' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 3e16e36..0ae9c76 (19 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A107-wp-161-admin-shell-and-route-registry.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A107-wp-161-admin-shell-and-route-registry.md.
```

---

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 2 (A106, A107); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task `WP-16.2`
