# A165 — wp-16l-l0-docs-audits-and-canaries

| Field | Value |
| --- | --- |
| Report ID | A165 |
| Date | 2026-11-23 |
| Author | A (Implementer) |
| Task ID | `WP-16.L L0` |
| Evidence SHA | `e95e77c39bff1808fbf389ff1a9eb233b13831b2` |
| CI run | 45097516018 |

---

## 1. Scope

Executed `WP-16.L L0` (Contract `D-L1`..`D-L5`, Registry, Token & Spacing Audits, Canaries & Failing-First Checks against `3d312a9`):
- [implemented] Added `D-L` (`D-L1`..`D-L5`) to `docs/design/foundations.md` and `WP-16.L2` row to `docs/plans/P004-ux-remediation-work-packages.md`.
- [implemented] Registered `20261106-UX-213`..`20261106-UX-217` (`status: open`) in `docs/audits/register.yml` and mapped them in `P004` §7.2 and `docs/plans/gates.json`.
- [implemented] Updated `docs/design/components.json` to register `List` (`variants`: `plain`, `interactive`, `variantOf`: `Item`) and `text-danger` on `Button`.
- [implemented] Baseline Token Audit against `3d312a9` (`packages/design-tokens/tokens.json`): all `14` items in the `L5` checklist audited true (`46` numeral-named `--lp-size-<N>` tokens, `11` `--lp-space-<N>` tokens, `5` `--lp-z-<N>` tokens in component tier plus duplicates `size-14`/`font-size-14`, `size-400`/`layout-narrow-max`, `size-640`/`breakpoints.viewport.sm`, `size-32` duplicate, `size-48`/`space-48`; legacy aliases referencing `--lp-prim-*`; `31` reserved tokens with `9` reasons contradicting values; `--lp-z-base` unresolved alias `{primitive.zIndex.0}`; two token names for responsive `control-height` and `gutter`; duplicated surface aliases, `text-future`/`border-provisional`, `color.status.*`, and `color.role.goal..neutral`; `3` separate scrim definitions; `3` hard-coded shadow strings per theme + unused `e1-right` + duplicate `subtle-ring`; missing weight tokens in component tier; numeric `z.3..50` and `z.toast` below `z.modal`; `radius.pill = 4px`; unused motion easing tokens and `3` scattered `prefers-reduced-motion` blocks; `216` primitive tokens emitted to `:root` in `tokens.css` with `626` unique custom properties / `39,019` bytes raw / `6,025` bytes gzip).
- [implemented] Baseline Spacing Inventory against `3d312a9`: `886` spacing/position/dimension declarations and `43` `@media`/`@container` queries in `apps/web/src/styles.ts` plus `17` other front-end files; `791` unmapped references (`454` in `styles.ts`: `169` raw `--lp-space-0..64`, `233` legacy `--space-1..18`/`--gap-*`/`--gutter`, `58` numeral `--lp-size-<N>`; `2` unmapped `@media` conditions `1279px` and `var(--lp-size-1080)`; `335` across `17` other front-end files: `233` raw space + `102` numeral size).
- [implemented] Root-caused `Today` spacing (`apps/web/src/pages/admin/dashboard.ts`): Today wraps `Needs attention` and `Getting started` in raw `<section>` tags bypassing `FormSection` (`0px` layout gap between `SectionHeader` and `.lp-list`), while `.lp-list` absorbs `12px` top padding (`::before { top: -12px }`), causing `-12px` tint overlap with the `36px` `#btn-dismiss-today-checklist` button in `SectionHeader`.
- [implemented] Added `checkItemButtonGrammarL1`, `checkListVariantsAndTextEdgesL2`, and `checkListSpacingAndHeadersL3` to `tests/e2e/census-helpers.ts`, plus `tests/e2e/wp16-l-census.spec.ts` (`4` synthetic canaries passing + `4` live defect checks verified failing against `3d312a9`).

### Component statement (required when touching UI; D-J)

- [implemented] No production UI source files modified in `L0`. Extended `docs/design/components.json` variants with `List` (`plain`, `interactive`, `variantOf: "Item"`) and `Button` (`text-danger`).

## 2. CI Evidence

- PR `#257` merged to `main` at `e95e77c39bff1808fbf389ff1a9eb233b13831b2`.
- `PR #257` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, `1m40s`), `Playwright End-to-End Suite` (`success`, `9m32s`), `CodeQL Static Analysis` (`success`, `1m59s`), `Secret Scan (gitleaks)` (`success`, `6s`), `Detect Changed Scope` (`success`, `10s`).
- `main` push CI run `45097516018` triggered for `e95e77c`.

## 3. Tests Added and Count Change

- Added `8` Playwright tests in `tests/e2e/wp16-l-census.spec.ts` (`4` synthetic canaries `L1`/`L2`/`L3a`/`L3b` passing, `4` live defect checks `UX-213`, `UX-214`, `UX-215a`, `UX-215b` marked `test.fail()` against `3d312a9`; `8/8` passing in `2.9s` local output).

## 4. Files Touched

- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/design/components.json`
- `docs/design/foundations.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A164-wp-16k-k4-pixel-diff-and-closure.md`
- `docs/plans/P004-ux-remediation-work-packages.md`
- `docs/plans/gates.json`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp16-l-census.spec.ts`

## 5. Register and Backlog Changes

- `docs/audits/register.yml`: registered `20261106-UX-213`, `20261106-UX-214`, `20261106-UX-215`, `20261106-UX-216`, `20261106-UX-217` as `status: open` (`WP-16.L`).

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.L L1`: item-level button grammar (`D-L1`), `List` variants (`plain` and `interactive`), relation tokens.
- `[not-started]` `WP-16.L L2`: page & list migrations (`today`, `overlay-entries-panel`, `settings-providers`, `status`, `history`, `answer-rules`, `inbox`, `editor-settings`, `gallery`, `fixture-pattern`).
- `[not-started]` `WP-16.L L3`: token restructure (`D-L5`), spacing taxonomy (`D-L4`), generator, guards, monotonic proximity test, performance measurement.
- `[not-started]` `WP-16.L L4`: census, pixel diff against `WP-16.K` sheets with intended changes listed, visual inspection, `~/Desktop/wp16l-contact-sheets.zip`, closure.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A165
=== Validating Receipt A165-wp-16l-l0-docs-audits-and-canaries.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'e95e77c39bff1808fbf389ff1a9eb233b13831b2' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 3d312a952d36fc871fa4d2eb2f550a297ace36b3..e95e77c39bff1808fbf389ff1a9eb233b13831b2 (10 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A165-wp-16l-l0-docs-audits-and-canaries.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A165-wp-16l-l0-docs-audits-and-canaries.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 149 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.L L1`–`L4` remaining)
- Next action: execute `WP-16.L L1`.
