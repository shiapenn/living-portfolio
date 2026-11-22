# A158 — wp-16j-j2-pages-and-theme-toggle

| Field | Value |
| --- | --- |
| Report ID | A158 |
| Date | 2026-11-22 |
| Author | A (Implementer) |
| Task ID | `WP-16.J J2` |
| Evidence SHA | `f717dc5290cd65e20372d4d893fb50e030255730` |
| CI run | 45014775655 |

---

## 1. Scope

Executed `WP-16.J J2` (Providers Answering Item, In-Section ActionBar & Theme Toggle Fix):
- [implemented] `Settings > Providers` (`apps/web/src/settings/modules/providers.ts`, `J1`): replaced loose `<p>` elements in `FormSection` `"Answering model"` with a `<div class="lp-list">` containing one `Item` (`title` = configured value `"Local only"` or `"<Provider> · <model>"`, `subtitle` = description line, `actions` = `item`-level `ActionBar` with `Change`, and `StatusLabel` in trailing slot only for external providers).
- [implemented] Configured-value audit (`J1`): audited `settings/modules/*` (`backups.ts` shows `"Current target: Local volume..."` inside `FormSection` `description`, `notifications.ts` / `answering.ts` / `appearance.ts` use `Field` inputs / `Choice`); only `providers.ts` had loose `<p>` text outside an `Item`/`Field`.
- [implemented] Editor Settings (`apps/web/src/pages/admin/entries/editor-sections.ts`, `J2`) & full-width in-section button audit: converted `Add tag` (`#ref-btn-add-facet`), `Add claim` (`#ref-btn-open-claim` + `#ref-btn-add-claim`/`#ref-btn-cancel-claim`), and `Attach evidence` (`#ref-btn-open-evidence` + `#ref-btn-add-evidence`/`#ref-btn-cancel-evidence`) from `level: 'page'` to `level: 'item'` (`compact`, auto width `min 96`, left-aligned row >=400px); audited `import.ts` (step-level primary bars), `inbox.ts` (`#inbox-btn-reply` page-level bar), `setup.ts` (step-level primary bars).
- [implemented] `J3` orphan-text & unowned-margins: added `data-c="Stepper"` to `renderLevel` (`apps/web/src/primitives/level.ts`) and `data-c="Button"` to `#ref-structure-next-step`; skipped `margin: 0 auto` horizontal centering in `checkOrphanTextAndMarginsJ3` (`tests/e2e/census-helpers.ts`).
- [implemented] `J5` theme toggle: fixed `#theme-toggle.lp-icon-btn[aria-pressed="true"]` in `apps/web/src/styles.ts` to use `var(--surface-control)` / `var(--text)` (matching `#lp-launcher-btn` and `#lp-account-menu-btn` in both light and dark modes) and updated `setTheme` in `tests/e2e/census-helpers.ts` to sync `#theme-toggle` attributes and move mouse to `(0, 0)`.

### Component statement (required when touching UI; D-J)

- [implemented] `Settings > Providers` Answering model row: `data-c="FormSection"` (variant `default`) > `data-c="Item"` (variants `default` / `trailing-status`) > `data-c="ActionBar"` (variant `item`) + `data-c="StatusLabel"` (external provider only); all registered in `docs/design/components.json`.
- [implemented] Editor Settings `Add tag`, `Add claim`, `Attach evidence`: `data-c="Subsection"` (variant `default`) > `data-c="ActionBar"` (variant `item`); registered in `docs/design/components.json`.
- [implemented] Editor Settings `Structure` level & next-step: `data-c="Stepper"` + `data-c="Button"` (variant `text`); registered in `docs/design/components.json`.
- [implemented] Top bar theme toggle `#theme-toggle`: `data-c="Button"` / `.lp-icon-btn` resting fill `var(--surface-control)`; registered in `docs/design/components.json`.

## 2. CI Evidence

- PR `#243` merged to `main` at `f717dc5290cd65e20372d4d893fb50e030255730`.
- `PR #243` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, `1m24s`), `Playwright End-to-End Suite` (`success`, `6m3s`), `CodeQL Static Analysis` (`success`, `1m51s`), `Secret Scan (gitleaks)` (`success`, `7s`), `Detect Changed Scope` (`success`, `13s`).
- `main` push CI run `45014775655` triggered for `f717dc5`.

## 3. Tests Added and Count Change

- Promoted `20261106-UX-204`, `UX-205`, `UX-206`, and `UX-208` in `tests/e2e/wp16-j-census.spec.ts` to passing (`8/8` canaries & defect tests passing).
- Verified `wp16-i-census.spec.ts` (`13/13`), `wp16-h-census.spec.ts` (`16/16`), `wp5-admin-settings.spec.ts` (`5/5`), `verify-ui-guards` (`108` files, `0` violations), and web unit tests (`101/101`).

## 4. Files Touched

- `apps/web/src/pages/admin/entries/editor-sections.ts`
- `apps/web/src/primitives/level.ts`
- `apps/web/src/settings/modules/providers.ts`
- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A157-wp-16j-j1-actionbar-and-registry-guards.md`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp16-i-census.spec.ts`
- `tests/e2e/wp16-j-census.spec.ts`

## 5. Register and Backlog Changes

- None (`20261106-UX-204`..`UX-208` updated to `partial` `"awaiting L review"` in `WP-16.J J3`).

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.J J3`: full census closure report, pixel diff vs `WP-16.I` sheets, visual inspection & `~/Desktop/wp16j-contact-sheets.zip`, register update.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A158
=== Validating Receipt A158-wp-16j-j2-pages-and-theme-toggle.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'f717dc5290cd65e20372d4d893fb50e030255730' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 7b16d6043ef33f4b119383f12d37c608406643ae..f717dc5290cd65e20372d4d893fb50e030255730 (10 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A158-wp-16j-j2-pages-and-theme-toggle.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A158-wp-16j-j2-pages-and-theme-toggle.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 142 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.J J3` remaining)
- Next action: execute `WP-16.J J3`.
