# A111 — WP-16.5 Inspector module and entry history restore

| Field | Value |
| --- | --- |
| Report ID | A111 |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Task ID | `WP-16.5` (PR #147) |
| Evidence SHA | `a0d8e67` |
| CI run | `43692220172` (CI & Audit Conformance Gate), `43692220196` (Secret Scan), `43692220409` (Staging Deploy) on `main` |

---

## 1. Scope

1. `[implemented]` **Inspector Strings & Pattern (`apps/web/src/strings/admin/inspector.ts`, `apps/web/src/patterns/structure-panel.ts`)**: Created `renderStructureInspectorPanel` with a 4-step level bar (`Captured`..`Grounded`), next-step prompt from `gapQuestions`, 5 accessible arrow-key tabs (`Structure`, `Context`, `Evidence`, `Answerability`, `History`), per-tab explainers, dashed `Suggested` items, and a link to `/admin/entries/:id/history`.
2. `[implemented]` **Entry-Scoped Inspector Mount**: Mounted `#ref-inspector-pane` in `apps/web/src/pages/admin/entries/editor.ts`, wired `initTabs` in `apps/web/src/client/admin/editor-page.ts`, added responsive 3-column & wrapping `.lp-tablist` styles in `apps/web/src/styles.ts`, and loaded entry-scoped inspector data in `renderDedicatedEditorPage`.
3. `[implemented]` **History & Restore (`/admin/entries/:id/history`)**: Created `apps/web/src/pages/admin/entries/history.ts` (exported from `apps/web/src/renderer.ts`), mounted in `apps/web/src/app.ts` and `apps/api/src/adapter/bundled-web.ts`, listing immutable revisions and restoring an earlier revision by appending a new revision via `POST /api/entries/:id/revisions`.

---

## 2. CI Evidence

- `main` push CI & Audit Conformance Gate (`43692220172`): `success` (`Typecheck, Unit, Security Regression, DCO & Audit Gate` 2m21s; `Playwright End-to-End Suite` 1m59s).
- `main` push Secret Scan (`43692220196`): `success`.
- `main` push Staging Automated Continuous Deployment (`43692220409`): `success`.
- Local pre-push `pnpm verify` (all 15 gates) and `pnpm test:e2e` (`wp16-5-inspector-and-history.spec.ts` 2/2 + prior 106/106 = 108/108): `local output` passed.

---

## 3. Tests Added and Count Change

- Added `tests/e2e/wp16-5-inspector-and-history.spec.ts` (2 Playwright E2E tests: right-hand inspector pane 4-step level bar, next-step prompt, 5 arrow-key tabs with explainers, and history link; `/admin/entries/:id/history` revision list and restore as new revision).
- Existing tests changed or removed: **None** (0 changed, 0 removed).

---

## 4. Files Touched

- `apps/api/src/adapter/bundled-web.ts`
- `apps/web/src/app.ts`
- `apps/web/src/client/admin/editor-page.ts`
- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/pages/admin/entries/history.ts`
- `apps/web/src/patterns/structure-panel.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/strings/admin/inspector.ts`
- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A110-wp-164-dedicated-editor-routes.md`
- `tests/e2e/wp16-5-inspector-and-history.spec.ts`

---

## 5. Register and Backlog Changes

- `20261106-UX-37`: `partial` -> `fixed` (`verified_by: tests/e2e/wp16-5-inspector-and-history.spec.ts`).

---

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.6`..`WP-16.7` (next task: `WP-16.6`).

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A111
=== Validating Receipt A111-wp-165-inspector-module.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'a0d8e67' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 9f5ef52..a0d8e67 (14 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A111-wp-165-inspector-module.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A111-wp-165-inspector-module.md.
```

---

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 6 (A106, A107, A108, A109, A110, A111); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task `WP-16.6`
