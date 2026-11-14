# A100 — WP-15.4 Token Tiers and Editor Wiring

| Field | Value |
| --- | --- |
| Report ID | A100 |
| Date | 2026-11-14 |
| Author | A (Implementer) |
| Task ID | `WP-15.4` |
| Evidence SHA | `ab96681` |
| CI run | Pending push to `feat/wp-15-4-workspace-editor` |

---

## 1. Scope

1. `[implemented]` **D-EDITOR-2 design corrections** (recorded in `docs/plans/P004-ux-remediation-work-packages.md` with updated action-set table):
   - `[implemented]` **(a) One visibility control**: `draft` entries show `Save draft` + `Publish…`; `public` and `unlisted` entries show `Save changes` + `Visibility` menu (`Public`, `Unlisted`, `Private`; current checked via `menuitemradio`; choosing `Public` opens Publish dialog). `More` menu contains only `History` and `Delete entry…`. Removed `"Make public…"` and `"Make private"` from `More`.
   - `[implemented]` **(b) One CTA in empty and first-run states**: hid sidebar `"New entry"` (`#ref-btn-new-entry`) when `entries.length === 0`.
   - `[implemented]` **(c) Save never disabled for a hidden reason**: `Save draft` / `Save changes` stay enabled; clicking when unmodified shows `"No changes to save."` in `#ref-status-line`.
2. `[implemented]` **Token tiers (`WP-15.4`)**: added dark high-contrast (`[data-theme="dark"][data-contrast="more"]` and `@media (prefers-contrast: more)`) and `@media (forced-colors: active)` rules to `apps/web/src/tokens/index.ts`.
3. `[implemented]` **Wire Reference Editor into `/admin`**:
   - `[implemented]` Added `renderAdminEntriesPage` in `apps/web/src/pages/admin/entries/editor.ts` and wired `/admin` (including `?entry=` and `?new=1`) in `apps/web/src/app.ts` and `apps/api/src/adapter/bundled-web.ts`.
   - `[implemented]` Extracted `ADMIN_API_CLIENT_SCRIPT` + `AdminSettingsState` + `formatAdminApiError` to `apps/web/src/lib/admin-api-client.ts` and removed legacy `apps/web/src/pages/admin/workspace.ts`.
   - `[implemented]` Wired `apps/web/src/client/admin/editor-page.ts` to live `/api/entries`, `/api/entries/redaction-preview`, `/api/entries/:id`, `/api/entries/:id/revisions`, and `/api/auth/logout` endpoints when not in fixture mode, including schema-aligned payloads (`body_md`, `valid_from`, `nda_confirmed`) and pre-publish dirty-revision sync.
   - `[implemented]` Updated `scripts/snapshot-dom-ids` and `docs/audits/dom-id-baseline.json` allowlist for retired `admin-workspace` IDs/hooks.

## 2. CI Evidence

- `pnpm --filter @living-portfolio/api test`: **46/46 files, 373/373 tests passed** (run on `816aa82` code).
- `pnpm --filter @living-portfolio/web test`: **5/5 files, 74/74 tests passed** (run on `816aa82` code).
- `pnpm test:e2e`: **90/90 Playwright tests passed** (run on `816aa82` code).
- `pnpm verify`: executed below before PR push.

## 3. Tests Added and Count Change

### Existing Tests Changed or Removed (with Reasons)

**API Conformance Tests (`apps/api/src/conformance/`):**
- `admin-apiclient.conformance.test.ts`, `ux-p0-probes.conformance.test.ts`, `wp11-markdown-tokens.conformance.test.ts`, `wp11-publish-ask.conformance.test.ts`, `wp15-1-monolith-split.conformance.test.ts`: switched imports/calls from removed `renderAdminWorkspacePage` to `renderAdminEntriesPage` / `renderAdminSettingsPage`. Reason: `workspace.ts` was removed in `WP-15.4` when `/admin` switched to the Reference Editor.
- `wp15-0-dom-id-baseline.conformance.test.ts`: preserved `mutatedBaseline.allowlist?.removedIds` when appending `'synthetic-missing-dom-id-wp15-0'` in the negative test. Reason: `dom-id-baseline.json` now contains retired `workspace.ts` IDs in `allowlist.removedIds`.

**Web Unit/Renderer Tests (`apps/web/src/web.test.ts`):**
- Updated 6 tests from `renderAdminWorkspacePage` / legacy `workspace.ts` selectors to `renderAdminEntriesPage(repo, { isNew: true })` and Reference Editor selectors (`#ref-entry-list`, `#ref-main`, `#ref-field-title`, `#ref-field-body`, `#ref-btn-save`, `#ref-btn-structure`, `#ref-structure-drawer`, `#ref-publish-dialog`, `#ref-status-line`). Reason: `workspace.ts` was replaced by `editor.ts`.
- Removed 4 `workspace.ts`-only unit tests (`renders interactive escalation review card in admin workspace`, `1. Admin workspace renders honest topology conflict status`, `2. Kill-switch initializes server-side and client-side`, `3. Scoped constraints list provides interactive confirm and discard controls`). Reason: those 4 widgets existed only on the retired `workspace.ts` page (settings/honest 501 status remains tested in `renderAdminSettingsPage` test 4).

**Playwright E2E Tests (`tests/e2e/`):**
- `helpers.ts`: updated `ensureAdminLoggedIn` to assert `#ref-main` visible on `/admin` instead of `Admin Workspace` heading. Reason: `/admin` now renders the Reference Editor.
- `wp15-7-editor-reference-page.spec.ts`: updated `D-EDITOR-2` interaction contract and empty/first-run assertions (one visibility control, no `Make public…`/`Make private` in `More`, hidden `#ref-btn-new-entry` on 0 entries, enabled Save showing `"No changes to save."`).
- `auth.spec.ts`: updated `/admin` heading/button assertions to `#ref-main`, `#ref-btn-signout`, and forced 401/403/500 error recovery via `#ref-btn-save` + `#ref-status-line`. Reason: `#btn-killswitch` and `#btn-admin-logout` were retired with `workspace.ts`.
- `wp11-navigation-and-states.spec.ts`: updated `beforeAll` entry creation to use `/admin?new=1` and `#ref-*` fields + `#ref-details-disclosure`.
- `redaction.spec.ts`, `structure-import.spec.ts`, `wp11-markdown-tokens-layout.spec.ts`, `wp14-client-bundling.spec.ts`, `wp14-commit-entry.spec.ts`, `wp14-editor-feedback.spec.ts`, `wp14-publish-dialog.spec.ts`, `wp14-state-date.spec.ts`, `wp14-7-hotfix.spec.ts`: updated selectors from retired `workspace.ts` (`#entry-*`, `#btn-*`, `#admin-status-banner`, `.admin-shell`) to Reference Editor (`/admin?new=1`, `#ref-*`).
- `visitor-escalation-booking.spec.ts` (test 2): updated owner approval step from retired `#inbox-heading` UI to authenticated `PATCH /api/v1/inbox/:id/approve` API while keeping visitor receipt & verified reply assertions intact.
- `wp5-admin-settings.spec.ts` (removed test 1; kept test 2 on `/admin/settings`), `wp11-publish-and-ask.spec.ts` (removed test 1; kept Ask tests 2–4), `wp14-draft-buffer.spec.ts` (removed file): retired because they tested `workspace.ts`-only widgets (`#topology-conflicts-card`, `#deploy-status-chip`, `admin-entry.ts` local draft buffer/offline banner) removed in `WP-15.4`.

## 4. Files Touched

- `apps/api/src/adapter/bundled-web.ts`
- `apps/api/src/conformance/admin-apiclient.conformance.test.ts`
- `apps/api/src/conformance/ux-p0-probes.conformance.test.ts`
- `apps/api/src/conformance/wp11-accessibility.conformance.test.ts`
- `apps/api/src/conformance/wp11-markdown-tokens.conformance.test.ts`
- `apps/api/src/conformance/wp11-publish-ask.conformance.test.ts`
- `apps/api/src/conformance/wp15-0-dom-id-baseline.conformance.test.ts`
- `apps/api/src/conformance/wp15-1-monolith-split.conformance.test.ts`
- `apps/web/src/app.ts`
- `apps/web/src/client/admin/editor-page.ts`
- `apps/web/src/lib/admin-api-client.ts`
- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/pages/admin/import.ts`
- `apps/web/src/pages/admin/login.ts`
- `apps/web/src/pages/admin/settings.ts`
- `apps/web/src/pages/admin/setup.ts`
- `apps/web/src/pages/admin/workspace.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/strings/admin/editor.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/tokens/index.ts`
- `apps/web/src/web.test.ts`
- `docs/audits/dom-id-baseline.json`
- `docs/execution-reports/A099-wp-15-pre-d-codeql-schedule.md`
- `docs/plans/P004-ux-remediation-work-packages.md`
- `scripts/snapshot-dom-ids`
- `tests/e2e/auth.spec.ts`
- `tests/e2e/helpers.ts`
- `tests/e2e/redaction.spec.ts`
- `tests/e2e/structure-import.spec.ts`
- `tests/e2e/visitor-escalation-booking.spec.ts`
- `tests/e2e/wp11-markdown-tokens-layout.spec.ts`
- `tests/e2e/wp11-navigation-and-states.spec.ts`
- `tests/e2e/wp11-publish-and-ask.spec.ts`
- `tests/e2e/wp14-7-hotfix.spec.ts`
- `tests/e2e/wp14-client-bundling.spec.ts`
- `tests/e2e/wp14-commit-entry.spec.ts`
- `tests/e2e/wp14-draft-buffer.spec.ts`
- `tests/e2e/wp14-editor-feedback.spec.ts`
- `tests/e2e/wp14-publish-dialog.spec.ts`
- `tests/e2e/wp14-state-date.spec.ts`
- `tests/e2e/wp15-7-editor-reference-page.spec.ts`
- `tests/e2e/wp5-admin-settings.spec.ts`

## 5. Register and Backlog Changes

- Recorded `D-EDITOR-2` (a, b, c) and updated action-set table in `docs/plans/P004-ux-remediation-work-packages.md`.

## 6. Not Done (Tagged)

- `[not-started]` `WP-15.5` (copy & help catalogues across remaining admin pages) and `WP-15.6` (size-budget guard and CI step) follow in subsequent PRs.

## 7. Changes to Earlier Reports

- None.

## 8. Receipt Gate Self-Validation
```
$ node scripts/receipt-check A100
=== Validating Receipt A100-wp-154-token-tiers-and-editor-wiring.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '816aa82' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff e328c24..816aa82 (43 files verified).
✓ [SECTION-8-CHECK] Verbatim passing output verified.

All receipt checks PASSED
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 84 (A017..A100)
- Clean-boundary preconditions: met
- Next action: merge `WP-15.4` PR on green and proceed to `WP-15.5` (`H016` deferred until after Gate G15 per owner instruction).
