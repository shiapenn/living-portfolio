# A129 — WP-16.C C2 Page and Overlay Migrations

| Field | Value |
| --- | --- |
| Report ID | A129 |
| Date | 2026-11-16 |
| Author | A (Implementer) |
| Task ID | `WP-16.C C2` |
| Evidence SHA | `3f9288d8de7829846bf0335e83b6ae2b52781914` |
| CI run | 43852019211 |

---

## 1. Scope

Executed `WP-16.C` `C2` page and overlay migrations to `D-COMP` primitives:
- [implemented] Shell & IA (`apps/web/src/layouts/admin-shell.ts`, `apps/web/src/app.ts`): launcher `Configure` group populated from the settings registry (no Settings index item), `/admin/settings` redirects `302` to `/admin/settings/answering`, Account menu keeps only `Owner` header, theme choice, and `Sign out`, Site status menu includes status lines, confirmed automated-answering pause/resume, and `Rebuild site`, and overlays render as full-width bottom sheets under `640 px`.
- [implemented] Migrated `Today` (`dashboard.ts`), `Entries` & drawer (`entries/list.ts`, `entries/list-script.ts`, `entries/editor.ts`), `Inbox` & detail (`inbox.ts`), `Answer rules` (`audit.ts`), `History` (`entries/history.ts`), `Import` (`import.ts`, `import-script.ts`), `Login` (`login.ts`), `Setup` (`setup.ts`, `setup-script-part1.ts`), and `Settings` modules (`settings.ts`, `answering.ts`, `appearance.ts`, `backups.ts`, `notifications.ts`) to `PageHeader`, `Item`, `ActionBar`, `Choice`, `Stepper`, and `FormSection`.
- [implemented] Shrunk `docs/audits/dcomp-census-budget.json` to `0` violations across 7 of 8 `D-COMP` checks (`icons: 0`, `stacking: 0`, `overlays: 0`, `actionBar: 0`, `choice: 0`, `verticalRhythm: 0`, `tabs: 0`), leaving only the 12 editor title `14px !== 24px` checks for `C3`.

## 2. CI Evidence

- PR `#184` merged to `main` at `3f9288d8de7829846bf0335e83b6ae2b52781914`.
- `main` push CI run `43852019211` (`CI & Audit Conformance Gate`): `success` (`Detect Changed Scope`, `Typecheck, Unit, Security Regression, DCO & Audit Gate`, `Playwright End-to-End Suite`).
- `pnpm verify`: 15/15 gates passed.
- `pnpm test:e2e`: 120/120 Playwright E2E tests passed, with `0/16` violations on `wp16-r-style-census.spec.ts` and `0` violations on 7/8 `wp16-c-component-census.spec.ts` checks.

## 3. Tests Added and Count Change

- Updated `apps/web/src/pages/admin/dashboard.test.ts`, `apps/web/src/web.test.ts`, and 6 E2E specs (`wp16-0`, `wp16-1`, `wp16-3`, `wp16-c`, `wp16-l2`, `wp16-r`) for `D-COMP` contracts.
- Net test count change: 0 added, 0 removed (120 E2E tests total, 95 web unit tests total).

## 4. Files Touched

- `apps/web/src/app.ts`
- `apps/web/src/layouts/admin-shell.ts`
- `apps/web/src/pages/admin/audit.ts`
- `apps/web/src/pages/admin/dashboard.test.ts`
- `apps/web/src/pages/admin/dashboard.ts`
- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/pages/admin/entries/history.ts`
- `apps/web/src/pages/admin/entries/list-script.ts`
- `apps/web/src/pages/admin/entries/list.ts`
- `apps/web/src/pages/admin/import-script.ts`
- `apps/web/src/pages/admin/import.ts`
- `apps/web/src/pages/admin/inbox.ts`
- `apps/web/src/pages/admin/login.ts`
- `apps/web/src/pages/admin/settings.ts`
- `apps/web/src/pages/admin/setup-script-part1.ts`
- `apps/web/src/pages/admin/setup.ts`
- `apps/web/src/settings/modules/answering.ts`
- `apps/web/src/settings/modules/appearance.ts`
- `apps/web/src/settings/modules/backups.ts`
- `apps/web/src/settings/modules/notifications.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/audits/dcomp-census-budget.json`
- `docs/audits/dom-id-baseline.json`
- `docs/doc-registry.json`
- `docs/execution-reports/A128-wp-16c-c1-d-comp-primitives-and-gallery.md`
- `tests/e2e/wp16-0-g15-defects-and-parity.spec.ts`
- `tests/e2e/wp16-1-admin-shell-and-routes.spec.ts`
- `tests/e2e/wp16-3-entries-list.spec.ts`
- `tests/e2e/wp16-c-component-census.spec.ts`
- `tests/e2e/wp16-l2-tiptap-editor.spec.ts`
- `tests/e2e/wp16-r-style-census.spec.ts`

## 5. Register and Backlog Changes

- Added 5 retired Import DOM IDs (`import-source-toggle`, `import-tiptap-editor`, `step-tab-add`, `step-tab-plan`, `step-tab-triage`) to `allowlist.removedIds` in `docs/audits/dom-id-baseline.json`.

## 6. Not Done (Tagged)

- [not-started] `WP-16.C C3`–`C4`: Editor toolbar/title/mobile toolbars/Source, Providers parity with setup step 3, and final contact sheets.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A129
=== Validating Receipt A129-wp-16c-c2-page-and-overlay-migrations.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '3f9288d8de7829846bf0335e83b6ae2b52781914' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 497577f88d58ca0c4340d9aae5fa9d40f055bcff..3f9288d8de7829846bf0335e83b6ae2b52781914 (33 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A129-wp-16c-c2-page-and-overlay-migrations.md.
✓ [CI-LOG-CHECK] CI run 43852019211 verified on GitHub (conclusion: success).

🎉 All receipt checks PASSED for A129-wp-16c-c2-page-and-overlay-migrations.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 113 (per triage counter); work packages since: 0
- Clean-boundary preconditions: met (`WP-16.C` in progress; `H018` deferred until `WP-16.C` gate closure)
- Next action: proceed to `WP-16.C C3` (editor toolbar, title, mobile toolbars, Source, and Providers parity with setup step 3).
