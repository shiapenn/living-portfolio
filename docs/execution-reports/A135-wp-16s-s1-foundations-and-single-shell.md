# A135 — WP-16.S S1 Design Foundations and Single Admin Shell

| Field | Value |
| --- | --- |
| Report ID | A135 |
| Date | 2026-11-17 |
| Author | A (Implementer) |
| Task ID | `WP-16.S S1` |
| Evidence SHA | `94f42da540ec3555b8bb643e472d176b9c735711` |
| CI run | 44021062921 |

---

## 1. Scope

Executed `WP-16.S S1` (Foundations, single admin shell, component consolidation, margin/line cleanup):
- [implemented] Added `Stack`, `Row`, `BackLink`, and `SectionHeader` primitives (`apps/web/src/primitives/layout.ts`, `back-link.ts`, `section-header.ts`) and semantic control surface tokens (`--surface-control*` in `apps/web/src/tokens/index.ts`).
- [implemented] Unified all admin pages (including login and setup) under a single `renderAdminShell` (`authenticated?: boolean`, `template?: 'standard' | 'narrow' | 'editor'`), deleting `renderAuthShell`; top bar now shows `"Admin"`, launcher, theme toggle, and account menu (`Owner` + `Sign out` only); removed status dot popover (`D-SYS #10`).
- [implemented] Deleted `renderListRow` (`list-row.ts`), migrated callers to `renderItem`; consolidated `renderTabs` into `primitives/tabs-stepper.ts`; unified `.lp-icon-btn` as borderless filled control (`D-SYS #16`).
- [implemented] Removed all 83 non-0/non-auto margins in component CSS (`apps/web/src/styles.ts`) and cleared `"componentMargin"` from `docs/audits/ui-guard-allowlist.json` (`verify-ui-guards`: 0 violations).
- [implemented] Shrunk `docs/audits/dsys-census-budget.json`: `actionBarFullWidth` (`34 -> 0`), `itemHoverAndPadding` (`80 -> 0`), `topBarLabel` (`48 -> 0`), `iconButtonFilled` (`408 -> 0`), `emptyInFlow` (`20 -> 8`), `upperGap` (`8 -> 4`), `lineBudget` (`296 -> 180`).

## 2. CI Evidence

- PR `#197` merged to `main` at `94f42da540ec3555b8bb643e472d176b9c735711`.
- `PR #197` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`), `Playwright End-to-End Suite` (`success`), `CodeQL (JavaScript / TypeScript)` (`success`), `Secret Scan (gitleaks)` (`success`), `Detect Changed Scope` (`success`).
- `main` push CI run `44021062921`: triggered on `94f42da540ec3555b8bb643e472d176b9c735711`.

## 3. Tests Added and Count Change

- Updated unit and E2E tests for `D-SYS` S1 (`95/95` in `@living-portfolio/web`, `381/381` in `@living-portfolio/api`, all Playwright census & conformance suites passing). Net test count change: `0`.

## 4. Files Touched

- `apps/web/src/components/components.test.ts`
- `apps/web/src/components/containers.ts`
- `apps/web/src/components/index.ts`
- `apps/web/src/layouts/admin-shell.ts`
- `apps/web/src/pages/admin/entries/editor-sections.ts`
- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/pages/admin/entries/list.ts`
- `apps/web/src/pages/admin/gallery.ts`
- `apps/web/src/pages/admin/login.ts`
- `apps/web/src/pages/admin/settings.ts`
- `apps/web/src/pages/admin/setup.ts`
- `apps/web/src/patterns/structure-panel.ts`
- `apps/web/src/primitives/back-link.ts`
- `apps/web/src/primitives/button.ts`
- `apps/web/src/primitives/dcomp.test.ts`
- `apps/web/src/primitives/form-section.ts`
- `apps/web/src/primitives/foundations.test.ts`
- `apps/web/src/primitives/gallery.ts`
- `apps/web/src/primitives/icons.ts`
- `apps/web/src/primitives/index.ts`
- `apps/web/src/primitives/layout.ts`
- `apps/web/src/primitives/list-row.ts`
- `apps/web/src/primitives/overlay.ts`
- `apps/web/src/primitives/page-header.ts`
- `apps/web/src/primitives/primitives.test.ts`
- `apps/web/src/primitives/section-header.ts`
- `apps/web/src/primitives/tabs-stepper.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/tokens/index.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/audits/dom-id-baseline.json`
- `docs/audits/dsys-census-budget.json`
- `docs/audits/ui-guard-allowlist.json`
- `docs/doc-registry.json`
- `docs/execution-reports/A134-wp-16pre-h-codeql-pr-trigger.md`
- `tests/e2e/auth.spec.ts`
- `tests/e2e/structure-import.spec.ts`
- `tests/e2e/wp16-0-g15-defects-and-parity.spec.ts`
- `tests/e2e/wp16-1-admin-shell-and-routes.spec.ts`
- `tests/e2e/wp16-5-inspector-and-history.spec.ts`
- `tests/e2e/wp16-c-component-census.spec.ts`
- `tests/e2e/wp16-r-style-census.spec.ts`

## 5. Register and Backlog Changes

None.

## 6. Not Done (Tagged)

- [not-started] `WP-16.S S2`–`S4`: Migrate pages & overlays, `D-EDITOR-4` + full `Structure` restoration, contact sheets & closure.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A135
=== Validating Receipt A135-wp-16s-s1-foundations-and-single-shell.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '94f42da540ec3555b8bb643e472d176b9c735711' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff d5d6becf5daac655c99724cb9c2b7b4ab8bd7919..94f42da540ec3555b8bb643e472d176b9c735711 (44 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A135-wp-16s-s1-foundations-and-single-shell.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A135-wp-16s-s1-foundations-and-single-shell.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 119 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.S` S2–S4 remaining; handover deferred until `WP-16.S` closure)
- Next action: land `A135` receipt PR, then proceed with `WP-16.S S2` (`feat/wp-16s-s2-pages-and-overlays`).
