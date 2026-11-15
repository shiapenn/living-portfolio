# A113 — WP-16.7 Retire monolith and route /admin to Today

| Field | Value |
| --- | --- |
| Report ID | A113 |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Task ID | `WP-16.7` (PR #151) |
| Evidence SHA | `49fdad6` |
| CI run | `43696245332` (CI & Audit Conformance Gate), `43696245300` (Secret Scan), `43696245317` (Staging Deploy) on `main` |

---

## 1. Scope

1. `[implemented]` **Route `/admin` to Today (`apps/web/src/app.ts`, `apps/api/src/adapter/bundled-web.ts`)**: Switched `GET /admin` from `renderAdminEntriesPage` (the old combined editor monolith) to `renderAdminDashboardPage` (Today), sharing `renderTodayHandler` with `/admin/today`.
2. `[implemented]` **Admin Shell Rail & Legacy Recovery Notice (`apps/web/src/layouts/admin-shell.ts`, `apps/web/src/pages/admin/dashboard.ts`)**: Replaced the `Workspace` rail link with `Today` (`/admin`), highlighted `Today` on both `/admin` and `/admin/today`, and rendered `#admin-legacy-recovery-notice` inside `renderAdminShell` when `legacyRecoveryUsed` is true.
3. `[implemented]` **Dedicated Editor Delete Redirect (`apps/web/src/client/admin/editor-page.ts`)**: Redirects dedicated editor deletions (`/admin/entries/:id`) to `/admin/entries` instead of `/admin`.

---

## 2. CI Evidence

- `main` push CI & Audit Conformance Gate (`43696245332`): `success` (`Typecheck, Unit, Security Regression, DCO & Audit Gate` 2m8s; `Playwright End-to-End Suite` 2m8s).
- `main` push Secret Scan (`43696245300`): `success`.
- `main` push Staging Automated Continuous Deployment (`43696245317`): `success`.
- Local pre-push `pnpm verify` (all 15 gates) and `pnpm test:e2e` (`111/111` passed): `local output` passed.

---

## 3. Tests Added and Count Change

- Added `tests/e2e/wp16-7-retire-monolith.spec.ts` (1 Playwright E2E test verifying `/admin` renders Today without `#ref-field-title`/`#ref-entry-list` and verifying `/admin/entries`, `/admin/entries/new`, `/admin/import`, `/admin/settings` still work).
- Existing tests changed (reason: `/admin` now renders Today inside Admin Shell instead of the retired editor monolith, so editor tests point to `/admin/entries/new` and shell tests check `main` / `#lp-account-menu-btn` -> `#btn-admin-logout`):
  - `apps/web/src/web.test.ts` (line 959: check `id="main-content"` and `Today` on `/admin`)
  - `tests/e2e/helpers.ts` (`ensureAdminLoggedIn` asserts `main` visible on `/admin` instead of `#ref-main`)
  - `tests/e2e/auth.spec.ts` (asserts `main` visible on `/admin` and signs out via `#lp-account-menu-btn` -> `#btn-admin-logout`; test 12 navigates to `/admin/entries/new` for `#ref-btn-save`)
  - `tests/e2e/wp14-editor-feedback.spec.ts`, `tests/e2e/wp14-7-hotfix.spec.ts`, `tests/e2e/wp14-client-bundling.spec.ts`, `tests/e2e/wp14-commit-entry.spec.ts`, `tests/e2e/wp14-publish-dialog.spec.ts`, `tests/e2e/wp14-state-date.spec.ts`, `tests/e2e/redaction.spec.ts`, `tests/e2e/structure-import.spec.ts`, `tests/e2e/wp11-navigation-and-states.spec.ts`, `tests/e2e/wp11-markdown-tokens-layout.spec.ts`, `tests/e2e/wp16-0-g15-defects-and-parity.spec.ts` (navigated editor-specific tests to `/admin/entries/new` and checked `/admin/entries/:id` / `/admin/entries` URLs)
  - `tests/e2e/wp16-1-admin-shell-and-routes.spec.ts` (included `/admin` in `shellRoutes` check now that `/admin` uses Admin Shell)
- Existing tests removed: **None** (0 removed).

---

## 4. Files Touched

- `apps/api/src/adapter/bundled-web.ts`
- `apps/web/src/app.ts`
- `apps/web/src/client/admin/editor-page.ts`
- `apps/web/src/layouts/admin-shell.ts`
- `apps/web/src/pages/admin/dashboard.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A112-wp-166-inbox-and-audit-rules.md`
- `tests/e2e/auth.spec.ts`
- `tests/e2e/helpers.ts`
- `tests/e2e/redaction.spec.ts`
- `tests/e2e/structure-import.spec.ts`
- `tests/e2e/wp11-markdown-tokens-layout.spec.ts`
- `tests/e2e/wp11-navigation-and-states.spec.ts`
- `tests/e2e/wp14-7-hotfix.spec.ts`
- `tests/e2e/wp14-client-bundling.spec.ts`
- `tests/e2e/wp14-commit-entry.spec.ts`
- `tests/e2e/wp14-editor-feedback.spec.ts`
- `tests/e2e/wp14-publish-dialog.spec.ts`
- `tests/e2e/wp14-state-date.spec.ts`
- `tests/e2e/wp16-0-g15-defects-and-parity.spec.ts`
- `tests/e2e/wp16-1-admin-shell-and-routes.spec.ts`
- `tests/e2e/wp16-7-retire-monolith.spec.ts`

---

## 5. Register and Backlog Changes

- None.

---

## 6. Not Done (Tagged)

- `[partial]` End-of-WP-16 sweep remediation (Axe light/dark `color-contrast`, `/admin/entries` `heading-order`, `/admin/audit` 320 px overflow, `/admin/settings` checkbox target sizing) before Gate `G16` closure.

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A113
=== Validating Receipt A113-wp-167-retire-monolith.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '49fdad6' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 1950654..49fdad6 (24 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A113-wp-167-retire-monolith.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A113-wp-167-retire-monolith.md.
```

---

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 8 (A106..A113); work packages since: 0
- Clean-boundary preconditions: met
- Next action: resolve end-of-WP-16 sweep defects, re-run sweep & contact sheets, close Gate `G16` (`A114`), and write `H017`.
