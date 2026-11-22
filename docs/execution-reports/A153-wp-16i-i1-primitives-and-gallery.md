# A153 — wp-16i-i1-primitives-and-gallery

| Field | Value |
| --- | --- |
| Report ID | A153 |
| Date | 2026-11-22 |
| Author | A (Implementer) |
| Task ID | `WP-16.I I1` |
| Evidence SHA | `608117a3972c7d865e3dc8bba7a28582d10e8f48` |
| CI run | 44993300128 |

---

## 1. Scope

Executed `WP-16.I I1` (ActionBar levels, StatusLabel vocabulary, Item geometry, edge-docked panel, gallery completeness):
- [implemented] `apps/web/src/primitives/action-bar.ts` & `apps/web/src/styles.ts` (`I1`): added `ActionBarLevel = 'page' | 'dialog' | 'item'`, `data-level` attribute, `lp-action-bar-page|dialog|item` CSS classes (`page` full width stacked; `dialog` full width at every viewport; `item` compact `min-width: 96px` row at `>=400px`, stacked full width `<400px`, text button centred in stack and left-aligned in Item).
- [implemented] `apps/web/src/primitives/chip.ts` (`I5`): exported `STATUS_VOCABULARY` (`Active`, `Idle`, `Pending`, `Connected`, `Error`, `Not set up`, `Accepted`, `Ignored`, `Suggested`, `Latest`, `Paused`, `Draft`, `Public`, `Unlisted`, `Key invalid`, `Unreachable`).
- [implemented] `apps/web/src/styles.ts` (`I7`, `I8`): set `.lp-list, .lp-item-list` horizontal padding to `0` and `.lp-item::before` to `inset: 0` so Item tint, hairline, and selected state match the list column with `8px` content inset; set `.lp-editor-drawer, .lp-editor-drawer-left` to `border: 0; border-right: 1px solid var(--border-overlay); box-shadow: none;`.
- [implemented] `apps/web/src/pages/admin/gallery.ts`, `gallery-canary.ts`, `apps/web/src/app.ts`, `apps/web/src/primitives/overlay.ts`, `apps/web/src/primitives/primitives.test.ts` (`I10`): added gallery samples for `SegmentedControl`, `Tag` (with remove), `StatusLabel` (`STATUS_VOCABULARY`), `Notice` (warning & error), `Select`, `Stepper`, `ActionBar` (`page` | `dialog` | `item`), `Subsection`, and static `Overlay` samples (`popover`, `edge-docked panel`, `dialog`); split `gallery-canary.ts` to keep `gallery.ts` within the `400`-line budget; added unit registry test checking every emitted `data-c` appears in `/admin/_gallery`.
- [implemented] `tests/e2e/wp16-i-census.spec.ts`, `wp16-c-component-census.spec.ts`, `wp16-s-system-census.spec.ts`: promoted `UX-200`, `UX-201`, `UX-203` to passing and aligned `wp16-c`/`wp16-s` census assertions with `D-I1 I1` and gallery samples.

## 2. CI Evidence

- PR `#233` merged to `main` at `608117a3972c7d865e3dc8bba7a28582d10e8f48`.
- `PR #233` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, `1m44s`), `Playwright End-to-End Suite` (`success`, `3m42s`), `CodeQL` (`success`, `1m48s`), `Secret Scan (gitleaks)` (`success`, `6s`), `Detect Changed Scope` (`success`, `6s`).
- `main` push CI run `44993300128`: `Playwright End-to-End Suite` (`success`, `4m29s`) and `Detect Changed Scope` (`success`, `4s`); `Typecheck, Unit, Security Regression, DCO & Audit Gate` failed in `@living-portfolio/db#test` (parallel Postgres container race, unrelated to `WP-16.I I1`; `packages/db` untouched).

## 3. Tests Added and Count Change

- Added `+2` unit tests in `apps/web/src/primitives/primitives.test.ts` (`I1` ActionBar `data-level`, `I10` `data-c` gallery completeness registry; `101/101` web tests passing).
- Promoted `3` tests (`UX-200`, `UX-201`, `UX-203`) in `tests/e2e/wp16-i-census.spec.ts` to passing.

## 4. Files Touched

- `apps/web/src/app.ts`
- `apps/web/src/pages/admin/gallery-canary.ts`
- `apps/web/src/pages/admin/gallery.ts`
- `apps/web/src/primitives/action-bar.ts`
- `apps/web/src/primitives/chip.ts`
- `apps/web/src/primitives/index.ts`
- `apps/web/src/primitives/overlay.ts`
- `apps/web/src/primitives/primitives.test.ts`
- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A152-wp-16i-i0-contract-and-failing-census.md`
- `tests/e2e/wp16-c-component-census.spec.ts`
- `tests/e2e/wp16-i-census.spec.ts`
- `tests/e2e/wp16-s-system-census.spec.ts`

## 5. Register and Backlog Changes

- None (`20261106-UX-194`..`UX-203` updated to `partial` `"awaiting L review"` in `WP-16.I I3`).

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.I I2`: page migrations across dialogs/sheets, editor Settings, answer rules, history, providers, status, setup, inbox, import, login, fixture-pattern.
- `[not-started]` `WP-16.I I3`: census v3 report, pixel diff vs `WP-16.H` sheets, visual inspection & register update.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A153
=== Validating Receipt A153-wp-16i-i1-primitives-and-gallery.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '608117a3972c7d865e3dc8bba7a28582d10e8f48' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff edab18784bdd81b19978e9024e232dd07037fdaa..608117a3972c7d865e3dc8bba7a28582d10e8f48 (15 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A153-wp-16i-i1-primitives-and-gallery.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A153-wp-16i-i1-primitives-and-gallery.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 137 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.I I2`–`I3` remaining)
- Next action: execute `WP-16.I I2` page migrations.
