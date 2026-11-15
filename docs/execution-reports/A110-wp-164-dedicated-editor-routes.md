# A110 — WP-16.4 Dedicated editor routes, mobile collapse, and unsaved label

| Field | Value |
| --- | --- |
| Report ID | A110 |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Task ID | `WP-16.4` (PR #145) |
| Evidence SHA | `9f5ef52` |
| CI run | `43690197170` (CI & Audit Conformance Gate), `43690197154` (Secret Scan), `43690197169` (Staging Deploy) on `main` |

---

## 1. Scope

1. `[implemented]` **Dedicated Editor Routes (`/admin/entries/new`, `/admin/entries/:id`)**: Added `renderDedicatedEditorPage` in `apps/web/src/pages/admin/entries/editor.ts` (exported via `apps/web/src/renderer.ts`) and mounted `/admin/entries/new` and `/admin/entries/:id` in `apps/web/src/app.ts` and `apps/api/src/adapter/bundled-web.ts`. Removed the default-to-first-entry fallback on dedicated routes and return HTTP `404` when `:id` does not exist.
2. `[implemented]` **Unsaved Placeholder & Entry Count (`20261106-UX-93`)**: Added `New, unsaved` label and `Unsaved` badge for placeholder `id === 'new'` in `apps/web/src/strings/admin/editor.ts` and `editor.ts`, and excluded `id === 'new'` from `#ref-entries-count`.
3. `[implemented]` **Mobile Collapse Below 768 px (`20261106-UX-92`) & Navigation Guard**: Added `#ref-sidebar-toggle` (`Entries (n)`) and `@media (max-width: 767px)` ordering in `apps/web/src/styles.ts` so the editor main pane renders first and `#ref-entry-list` collapses until toggled; added link-click unsaved-change confirmation and dedicated-route `replaceState` in `apps/web/src/client/admin/editor-page.ts`.

---

## 2. CI Evidence

- `main` push CI & Audit Conformance Gate (`43690197170`): `success` (`Typecheck, Unit, Security Regression, DCO & Audit Gate` 2m30s; `Playwright End-to-End Suite` 1m58s).
- `main` push Secret Scan (`43690197154`): `success`.
- `main` push Staging Automated Continuous Deployment (`43690197169`): `success`.
- Local pre-push `pnpm verify` (all 15 gates) and `pnpm test:e2e` (`wp16-4-dedicated-editor-routes.spec.ts` 3/3 + prior 103/103 = 106/106): `local output` passed.

---

## 3. Tests Added and Count Change

- Added `tests/e2e/wp16-4-dedicated-editor-routes.spec.ts` (3 Playwright E2E tests: `/admin/entries/new` placeholder `New, unsaved`, excluded from `#ref-entries-count`, 320 px title `< 400 px` from top; `/admin/entries/:id` loads exact entry and returns 404 for unknown id; 320 px `Entries (n)` toggle expands entry list and unsaved-change guard blocks link navigation).
- Existing tests changed: Updated mock `client` in `apps/web/src/pages/admin/entries/editor.test.ts` (`requires admin session and excludes reference editor routes and fixture/theme params in production`) to include `entries.get` returning `entry-1` for `/admin/entries/entry-1`, because `/admin/entries/:id` now returns `404` when `:id` does not exist instead of defaulting to a placeholder/section page. 0 tests removed.

---

## 4. Files Touched

- `apps/api/src/adapter/bundled-web.ts`
- `apps/web/src/app.ts`
- `apps/web/src/client/admin/editor-page.ts`
- `apps/web/src/pages/admin/entries/editor.test.ts`
- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/strings/admin/editor.ts`
- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A109-wp-163-entries-list.md`
- `tests/e2e/wp16-4-dedicated-editor-routes.spec.ts`

---

## 5. Register and Backlog Changes

- `20261106-UX-92`: `open` -> `fixed` (`verified_by: tests/e2e/wp16-4-dedicated-editor-routes.spec.ts`).
- `20261106-UX-93`: `open` -> `fixed` (`verified_by: tests/e2e/wp16-4-dedicated-editor-routes.spec.ts`).

---

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.5`..`WP-16.7` (next task: `WP-16.5`).

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A110
=== Validating Receipt A110-wp-164-dedicated-editor-routes.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '9f5ef52' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 43cbbe8..9f5ef52 (13 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A110-wp-164-dedicated-editor-routes.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A110-wp-164-dedicated-editor-routes.md.
```

---

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 5 (A106, A107, A108, A109, A110); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task `WP-16.5`
