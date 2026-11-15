# A106 — WP-16.0 G15 defects and capability parity fixes

| Field | Value |
| --- | --- |
| Report ID | A106 |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Task ID | `WP-16.0` (PR #137) |
| Evidence SHA | `3e16e36` |
| CI run | `43683419504` (CI & Audit Conformance Gate), `43683419489` (Secret Scan), `43683419492` (Staging Deploy) on `main` |

---

## 1. Scope

1. `[implemented]` **Draft buffer, unsaved-changes guard, and offline banner (`UX-96`)**: Restored `lp_draft_buffer_active` local autosave, reload restore notice (`#draft-restore-notice`) with `#btn-discard-draft-buffer`, `beforeunload` dirty guard, and `#admin-offline-banner` on `/admin` in `apps/web/src/client/admin/editor-page.ts` and `apps/web/src/pages/admin/entries/editor-sections.ts`.
2. `[implemented]` **Shared Menu controller (`UX-97`)**: Replaced custom `setupMenu` in `editor-page.ts` with shared `attachMenuController` in `apps/web/src/client/containers.ts` (`Enter`/`ArrowDown` on trigger focuses first menuitem; `ArrowUp`/`ArrowDown`/`Home`/`End`/`Escape`/`Tab` supported).
3. `[implemented]` **Single active message place with dialogs (`UX-98`)**: Added `ModalHooks` (`onOpen`/`onClose`) to `attachModalController` and `.lp-status-line[hidden]` rule in `apps/web/src/styles.ts` so `#ref-status-line` is hidden while `#ref-publish-dialog` or `#ref-delete-dialog` is open.
4. `[implemented]` **Publish dialog matched details (`UX-99`)**: Added `#ref-publish-matches` inside `#ref-publish-dialog` listing each match's type, masked snippet, position, and a `Jump to match` button that closes the dialog and focuses/selects in `#ref-field-body`.
5. `[implemented]` **Mobile brand target & landmarks & empty-state `<h1>` (`UX-100`, `UX-102`, `UX-103`)**: Set `a.lp-admin-header-brand` `min-height: 44px` at `320 px`; added `headingTag?: 'h1' | 'h2' | 'h3'` to `renderEmptyState` (used as `h1` for empty/first-run in `editor.ts`); replaced `<header>`/`<footer>` inside `renderDialog`/`renderDrawer` with `<div>` to eliminate duplicate `banner` landmarks when overlays are open.
6. `[implemented]` **Automated-answering kill switch & escalation review card (`UX-104`, `UX-105`)**: Restored `#btn-killswitch` (wired to `PATCH /api/settings/routing` and hydrated from `runtimeState.automatedAnsweringEnabled` in `bundled-web.ts`) and `#ref-escalations-card` (wired to `PATCH /api/inbox/:id/approve` and `/reject`) on `/admin`.

---

## 2. CI Evidence

- `main` push CI & Audit Conformance Gate (`43683419504`): `success` (`Typecheck, Unit, Security Regression, DCO & Audit Gate` 2m24s; `Playwright End-to-End Suite` 2m15s).
- `main` push Secret Scan (`43683419489`): `success`.
- `main` push Staging Automated Continuous Deployment (`43683419492`): `success`.
- Local pre-push `pnpm verify` (all 15 gates) and `pnpm test:e2e` (95 passed, 0 failed): `local output` passed.

---

## 3. Tests Added and Count Change

- Added `tests/e2e/wp16-0-g15-defects-and-parity.spec.ts` (5 Playwright E2E tests on real `/admin` and overlays covering `UX-96`..`UX-100` and `UX-102`..`UX-105`).
- Existing tests changed or removed: **None** (0 changed, 0 removed).

---

## 4. Files Touched

- `apps/api/src/adapter/bundled-web.ts`
- `apps/web/src/client/admin/editor-page.ts`
- `apps/web/src/client/containers.ts`
- `apps/web/src/components/containers.ts`
- `apps/web/src/pages/admin/entries/editor-sections.ts`
- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/strings/admin/editor.ts`
- `apps/web/src/styles.ts`
- `docs/audits/register.yml`
- `docs/execution-reports/A105-g15-parity-acceptance-and-closure.md`
- `docs/handovers/H016-wp-15-design-system-and-editor-gate-closure.md`
- `packages/db/src/seed.ts`
- `tests/e2e/wp16-0-g15-defects-and-parity.spec.ts`

---

## 5. Register and Backlog Changes

- Transitioned 9 findings in `docs/audits/register.yml` from `open` to `fixed` with `regression_test: tests/e2e/wp16-0-g15-defects-and-parity.spec.ts`:
  - `20261106-UX-96`, `20261106-UX-97`, `20261106-UX-98`, `20261106-UX-99`, `20261106-UX-100`, `20261106-UX-102`, `20261106-UX-103`, `20261106-UX-104`, `20261106-UX-105`.
- `20261106-UX-101` remains `open` for `WP-16.1`.

---

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.1`..`WP-16.7` (next task: `WP-16.1`).

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A106
=== Validating Receipt A106-wp-160-g15-defects-and-capability-parity-fixes.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '3e16e36' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 1f555ac..3e16e36 (13 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A106-wp-160-g15-defects-and-capability-parity-fixes.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A106-wp-160-g15-defects-and-capability-parity-fixes.md.
```

---

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 1 (A106); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task `WP-16.1`
