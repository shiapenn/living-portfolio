# A124 — wp16l-l1-shell-pages-settings

| Field | Value |
| --- | --- |
| Report ID | A124 |
| Date | 2026-11-16 |
| Author | A (Implementer) |
| Task ID | `WP-16.L L1` |
| Evidence SHA | `6a7b742ee8c7a7528b299e119d5feba4ca4d327c` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/43798412084 |

---

## 1. Scope

Executed `WP-16.L L1` (Layout and Editor Reset — shell, launcher, page template, List row, Select, token fixes, settings split, non-editor pages, and section display):
- `[implemented]` Verified `pnpm handover:verify H017` at task start under L's recorded exception; failed only for the known `WP-16.R` + `L0` drift.
- `[implemented]` Replaced the admin sidebar rail with a `48 px` top-bar-only shell (`apps/web/src/layouts/admin-shell.ts`), registry-driven launcher (`#lp-launcher-btn` / `#lp-launcher-panel`, popover `>=768 px`, full-width sheet `<768 px`, `Esc`/arrow/focus return), site status dot menu, and account menu.
- `[implemented]` Implemented unified `720 px` `renderPageTemplate`, `renderListRow` (`apps/web/src/primitives/list-row.ts`), `Select` primitive (`16 px` chevron `12 px` from right, `36 px` right padding), and theme-token-only colours (`--surface-page: #FFFFFF` light, `--surface-input: #16232D` dark).
- `[implemented]` Implemented `D-SETTINGS-ARCH` registry, isolated settings service, `theme-packs.ts` contrast validation, and 5 plain-language settings modules (`/admin/settings/{answering,providers,appearance,notifications,backups}`) with unit tests in `apps/web/src/settings/registry.test.ts`.
- `[implemented]` Migrated Today, Entries, History (Markdown markers stripped), Inbox & detail (sans reply box), Answer rules, Import (numerals removed from tabs), Login, and Setup (cardless `360 px` column, `"Step 1 of 6 · Account"` + `2 px` progress line).
- `[implemented]` Added configuration-driven section mapping (`packages/core/src/sections/index.ts`) and displayed sections in the editor type picker (`optgroup`) and Publish dialog (`"Will appear in <Section> at <url>"`).
- `[implemented]` Shrank census budgets in `docs/audits/style-census-budget.json`: `h1PositionMismatch: 12->0`, `clippedText: 18->0`, `forbiddenTextMatches: 28->0`, `selectChevronMismatch: 36->0`, `columnWidthMismatch: 28->14`, `tabGapViolations: 16->12`, `siblingGapViolations: 24->4`, `nonTokenColors: 400->300`.

## 2. CI Evidence

- PR #174 (`feat/wp-16-l1-shell-pages-settings` -> `main`, merge commit `6a7b742ee8c7a7528b299e119d5feba4ca4d327c`):
  - `CI & Audit Conformance Gate` (`main` push run `43798412084`, wall-clock; GitHub `billable` field returns `0`):
    - `Detect Changed Scope`: `success` (`4s` / `0.07 min`)
    - `Typecheck, Unit, Security Regression, DCO & Audit Gate`: `success` (`2m30s` / `2.50 min`)
    - `Playwright End-to-End Suite`: `success` (`1m58s` / `1.97 min`)
  - `Secret Scan (gitleaks)` (`main` push run `43798412157`):
    - `Gitleaks Secret & Credential Scan`: `success`

## 3. Tests Added and Count Change

- Added `packages/core/src/sections/sections.test.ts` (4 tests), `apps/web/src/settings/registry.test.ts` (2 tests), and `tests/e2e/wp16-l1-shell-and-settings.spec.ts` (2 E2E tests).
- All `115` Playwright E2E tests, `85` web tests, `37` core tests, `380` API tests, and all `15` `pnpm verify` gates passed.

## 4. Files Touched

- `apps/api/src/adapter/bundled-web.ts`
- `apps/api/src/api.test.ts`
- `apps/api/src/conformance/ux-p0-probes.conformance.test.ts`
- `apps/api/src/conformance/wp11-markdown-tokens.conformance.test.ts`
- `apps/web/src/app.ts`
- `apps/web/src/client/admin/editor-page.ts`
- `apps/web/src/components/index.ts`
- `apps/web/src/layouts/admin-shell.ts`
- `apps/web/src/pages/admin/audit.ts`
- `apps/web/src/pages/admin/dashboard.ts`
- `apps/web/src/pages/admin/entries/editor-sections.ts`
- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/pages/admin/entries/history.ts`
- `apps/web/src/pages/admin/entries/list.ts`
- `apps/web/src/pages/admin/import.ts`
- `apps/web/src/pages/admin/inbox.ts`
- `apps/web/src/pages/admin/login.ts`
- `apps/web/src/pages/admin/settings-script.ts`
- `apps/web/src/pages/admin/settings.ts`
- `apps/web/src/pages/admin/setup.ts`
- `apps/web/src/primitives/field.ts`
- `apps/web/src/primitives/icons.ts`
- `apps/web/src/primitives/index.ts`
- `apps/web/src/primitives/list-row.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/settings/index.ts`
- `apps/web/src/settings/modules/answering.ts`
- `apps/web/src/settings/modules/appearance.ts`
- `apps/web/src/settings/modules/backups.ts`
- `apps/web/src/settings/modules/notifications.ts`
- `apps/web/src/settings/modules/providers.ts`
- `apps/web/src/settings/registry.test.ts`
- `apps/web/src/settings/registry.ts`
- `apps/web/src/settings/service.ts`
- `apps/web/src/settings/theme-packs.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/tokens/index.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/audits/dom-id-baseline.json`
- `docs/audits/style-census-budget.json`
- `docs/doc-registry.json`
- `docs/execution-reports/A123-wp16l-l0-foundations-and-census.md`
- `packages/core/src/index.ts`
- `packages/core/src/sections/index.ts`
- `packages/core/src/sections/sections.test.ts`
- `tests/e2e/wp11-markdown-tokens-layout.spec.ts`
- `tests/e2e/wp14-calibration-defaults.spec.ts`
- `tests/e2e/wp15-3a-design-foundations.spec.ts`
- `tests/e2e/wp15-7-editor-reference-page.spec.ts`
- `tests/e2e/wp16-0-g15-defects-and-parity.spec.ts`
- `tests/e2e/wp16-1-admin-shell-and-routes.spec.ts`
- `tests/e2e/wp16-2-today-dashboard.spec.ts`
- `tests/e2e/wp16-6-inbox-and-audit-rules.spec.ts`
- `tests/e2e/wp16-l1-shell-and-settings.spec.ts`
- `tests/e2e/wp16-r-style-census.spec.ts`
- `tests/e2e/wp5-admin-settings.spec.ts`

## 5. Register and Backlog Changes

- None (`UX-109`..`UX-124` remain `open` until `L2` and `L3` complete all census budgets at `0`).

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.L L2` (Tiptap editor, block registry, round-trip gate) and `L3` (contact sheets & 0-violation census report).

## 7. Changes to Earlier Reports

- None.

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A124
=== Validating Receipt A124-wp16l-l1-shell-pages-settings.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '6a7b742ee8c7a7528b299e119d5feba4ca4d327c' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff cc7a68267aacdef42d800fb61b1e7f3f985645f2..6a7b742ee8c7a7528b299e119d5feba4ca4d327c (57 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A124-wp16l-l1-shell-pages-settings.md.

🎉 All receipt checks PASSED for A124-wp16l-l1-shell-pages-settings.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 10 (A115..A124); work packages since: 2
- Clean-boundary preconditions: met
- Next action: continue with WP-16.L L2 (full-screen Tiptap editor, block registry, and 100% Markdown round-trip gate)
