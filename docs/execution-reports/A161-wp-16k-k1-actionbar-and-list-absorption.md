# A161 — wp-16k-k1-actionbar-and-list-absorption

| Field | Value |
| --- | --- |
| Report ID | A161 |
| Date | 2026-11-22 |
| Author | A (Implementer) |
| Task ID | `WP-16.K K1` |
| Evidence SHA | `313bdcfeaf1afffd1b6eedeb4d8eadf74942fc1e` |
| CI run | 45023661578 |

---

## 1. Scope

Executed `WP-16.K K1` (Item-level ActionBar always compact + List vertical padding absorption):
- [implemented] Removed the `@container (max-width: 399px)` full-width branch for `.lp-action-bar-item` and `.lp-item-actions .lp-action-bar`, and removed `.lp-item-actions .lp-btn` from the dialog `@container (max-width: 399px)` rule in `apps/web/src/styles.ts`. All item-level `ActionBar`s now remain compact (`width: auto`, `min-width: 96px`, left-aligned `flex-wrap: wrap` row, `gap: 8px`) at every viewport (`item:subsection:full` dropped from `36` to `0`; `item:subsection:compact` `108`, `item:item:compact` `126`, `item:page:compact` `6`).
- [implemented] Implemented `List` vertical padding absorption in `.lp-list` / `.lp-item-list` (`apps/web/src/styles.ts`): `--item-pad-y: 12px` absorbed on `:first-child` (`padding-top: 0`) and `:last-child` (`padding-bottom: 0`), with `::before` hover/selected tint extending into the absorbed `12px` margin (`top`/`bottom: calc(-1 * var(--item-pad-y, 12px))`).
- [implemented] Added `id="provider-role-fallback"` in `apps/web/src/settings/modules/providers.ts` and verified `Answering model` and `Fallback behaviour` painted gaps match (`19.4px` heading-to-first, `42px` vs `41px` last-to-next).
- [implemented] Updated `tests/e2e/wp16-c-component-census.spec.ts` 320px stacking selector (`.lp-action-bar:not(.lp-action-bar-item)`) to reflect `D-K1`, and promoted `UX-209 (K1)` & `UX-210 (K2)` in `tests/e2e/wp16-k-census.spec.ts`.

### Component statement (required when touching UI; D-J)

- [implemented] `ActionBar` (`level="item"`): `data-c="ActionBar"`, variant `item` (registered in `docs/design/components.json`); updated CSS in `apps/web/src/styles.ts` and gallery label in `apps/web/src/pages/admin/gallery.ts`.
- [implemented] `Item` inside `List` (`.lp-list` / `.lp-item-list`): `data-c="Item"`, variants `default` / `has-actions` / `selected` / `trailing-status` (registered in `docs/design/components.json`); updated vertical padding absorption in `apps/web/src/styles.ts`.
- [implemented] `FormSection` (`#provider-role-fallback`): `data-c="FormSection"`, variant `default` (registered in `docs/design/components.json`); added `id` attribute in `apps/web/src/settings/modules/providers.ts`.

## 2. CI Evidence

- PR `#249` merged to `main` at `313bdcfeaf1afffd1b6eedeb4d8eadf74942fc1e`.
- `PR #249` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, `1m37s` on rerun after transient `@living-portfolio/db#test` Postgres race), `Playwright End-to-End Suite` (`success`, `7m39s` on rerun after transient `overlay-slash-menu` flake), `CodeQL Static Analysis` (`success`, `2m1s`), `Secret Scan (gitleaks)` (`success`, `6s`), `Detect Changed Scope` (`success`, `6s`).
- `main` push CI run `45023661578` triggered for `313bdcf`.

## 3. Tests Added and Count Change

- Promoted `20261106-UX-209 (K1)` and `20261106-UX-210 (K2)` in `tests/e2e/wp16-k-census.spec.ts` and added `K1 Full 42-state ActionBar census` (`7/7` passing in `1.6m` locally).
- Updated `tests/e2e/wp16-c-component-census.spec.ts` 320px stacking selector for `D-K1`.

## 4. Files Touched

- `apps/web/src/pages/admin/gallery.ts`
- `apps/web/src/primitives/action-bar.ts`
- `apps/web/src/settings/modules/providers.ts`
- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A160-wp-16k-k0-docs-and-canaries.md`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp16-c-component-census.spec.ts`
- `tests/e2e/wp16-k-census.spec.ts`

## 5. Register and Backlog Changes

None (register status updates deferred to `K4` closure).

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.K K2`: re-audit all lists + legacy migration to `0` orphan text and `0` unowned margins.
- `[not-started]` `WP-16.K K3`: full three-tier tokenization (`packages/design-tokens/tokens.json`, generator, drift test, guards, front-end migration, census reads tokens, gallery tokens view).
- `[not-started]` `WP-16.K K4`: pixel diff (`K1`+`K2` vs `WP-16.J`, `K3` vs `K2` = `0`), visual inspection, `~/Desktop/wp16k-contact-sheets.zip`, closure.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A161
=== Validating Receipt A161-wp-16k-k1-actionbar-and-list-absorption.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '313bdcfeaf1afffd1b6eedeb4d8eadf74942fc1e' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 484dcbdb53f5da2f47218afdf749041eb00de614..313bdcfeaf1afffd1b6eedeb4d8eadf74942fc1e (10 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A161-wp-16k-k1-actionbar-and-list-absorption.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A161-wp-16k-k1-actionbar-and-list-absorption.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 145 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.K K2`–`K4` remaining)
- Next action: execute `WP-16.K K2`.
