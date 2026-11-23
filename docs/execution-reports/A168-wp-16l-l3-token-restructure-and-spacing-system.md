# A168 — wp-16l-l3-token-restructure-and-spacing-system

| Field | Value |
| --- | --- |
| Report ID | A168 |
| Date | 2026-11-23 |
| Author | A (Implementer) |
| Task ID | `WP-16.L L3` |
| Evidence SHA | `051cd53ac9af543239d26eac3b5f885e1540a1a0` |
| CI run | 45111590633 |

---

## 1. Scope

Executed `WP-16.L L3` (`D-L4` Spacing System & `D-L5` Token Restructure, Generator, Guards, Performance):
- [implemented] Restructured `packages/design-tokens/tokens.json` and `packages/design-tokens/tokens.schema.json`:
  - [implemented] Removed `"reserved"` concept (`0` reserved, arithmetic closure `defined = used = 227`, `0` unused).
  - [implemented] Replaced all numeral-named `--lp-size-<N>`, `--lp-space-<N>`, `--lp-z-<N>`, and legacy `--space-<N>` tokens across `apps/web/src/styles.ts` and `17` other front-end files with semantic/component/stack/inline/inset tokens (`0` unmapped items, down from `791`).
  - [implemented] Implemented `D-L4` spacing taxonomy (`--lp-space-stack-*`, `--lp-space-inline-*`, `--lp-space-inset-*`) and added monotonic proximity test in `packages/design-tokens/src/drift.test.ts`.
  - [implemented] Fixed unresolved alias `--lp-z-base` (`{primitive.zIndex.0}` -> `0`) and made `packages/design-tokens/generate.mjs` fail on any unresolved `{...}` reference.
  - [implemented] Implemented single-name responsive tokens (`--lp-size-control-height` at `640px`, `--lp-space-inset-page-gutter` at `768px`) from `tokens.responsive` and `tokens.breakpoints`; replaced the 2 unmapped `@media` queries in `apps/web/src/styles.ts`.
  - [implemented] Cleaned semantic surfaces (`l0`, `l1`, `l2`, control states, unified `--lp-color-surface-scrim`), removed `text-future`, `border-provisional`, `color.status.*` duplicates, renamed passage roles to `--lp-color-passage-goal..neutral`, structured elevation tokens (deleted `e1-right` and duplicate `elevation.subtle-ring`), ordered named z-index layers (`base < raised < sticky < overlay < popover < modal < toast < skip` with `toast > modal`), deleted `radius.pill=4px`, wired motion easing tokens, and consolidated `prefers-reduced-motion` into one block.
  - [implemented] Omitted `--lp-prim-*` from shipped `tokens.css` and resolved non-theme primitive references at build time (`tokens.css`: `39,019` -> `17,875` bytes raw, `6,025` -> `3,742` bytes gzip; emitted custom properties `626` -> `271`; gallery style-recalc `1.12ms`).
  - [implemented] Regenerated `docs/design/tokens.md` with Architecture section and `"How to choose a token"` decision list.
  - [implemented] Strengthened `scripts/verify-ui-guards` to forbid numeral-named tokens, raw space scale in component CSS, unused tokens, reserved list, unresolved aliases, and emitted `--lp-prim-*`.

### Component statement (required when touching UI; D-J)

- [implemented] No new component or variant added. All token and CSS updates apply to existing registered components in `docs/design/components.json` (`Overlay` unified scrim `--lp-color-surface-scrim`, `Button`, `Item`, `List`, `FormSection`, `Field`, `Tag`, `Choice`, `Tabs`, `Stepper`, `EdgePanel`, `Notice`, `StatusLabel`).

## 2. CI Evidence

- PR `#261` merged to `main` at `051cd53ac9af543239d26eac3b5f885e1540a1a0`.
- `PR #261` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, `1m45s`), `Playwright End-to-End Suite` (`success`, `7m7s`), `CodeQL Static Analysis` (`success`, `2m10s`), `Secret Scan (gitleaks)` (`success`, `6s`), `Detect Changed Scope` (`success`, `5s`).
- `main` push CI run `45111590633` triggered for `051cd53`.

## 3. Tests Added and Count Change

- Added `D-L4 monotonic proximity` and `D-L5 token architecture` tests in `packages/design-tokens/src/drift.test.ts` (`4/4` tests passing).
- Added `20261106-UX-216 & 20261106-UX-217` gallery style-recalc and scrim/z-base/no-primitives E2E test in `tests/e2e/wp16-l-census.spec.ts` (`11/11` tests passing).

## 4. Files Touched

- `apps/api/src/conformance/wp11-markdown-tokens.conformance.test.ts`
- `apps/api/src/conformance/wp12-strata-craft.conformance.test.ts`
- `apps/web/src/client/admin-entry.ts`
- `apps/web/src/client/commit-entry.ts`
- `apps/web/src/client/draft-buffer.ts`
- `apps/web/src/client/publish-dialog.ts`
- `apps/web/src/components/entry-card.ts`
- `apps/web/src/components/slots.ts`
- `apps/web/src/components/strata-timeline.ts`
- `apps/web/src/layouts/public-shell.ts`
- `apps/web/src/pages/public/ask-status.ts`
- `apps/web/src/pages/public/ask.ts`
- `apps/web/src/pages/public/book.ts`
- `apps/web/src/pages/public/build.ts`
- `apps/web/src/pages/public/entries-index.ts`
- `apps/web/src/pages/public/entry.ts`
- `apps/web/src/pages/public/home.ts`
- `apps/web/src/pages/public/not-found.ts`
- `apps/web/src/pages/public/timeline.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/tokens/index.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/design/tokens.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A167-wp-16l-l2-page-and-list-migrations.md`
- `packages/design-tokens/generate.mjs`
- `packages/design-tokens/src/drift.test.ts`
- `packages/design-tokens/src/generated.ts`
- `packages/design-tokens/src/index.ts`
- `packages/design-tokens/src/tokens.css`
- `packages/design-tokens/tokens.json`
- `packages/design-tokens/tokens.schema.json`
- `scripts/verify-ui-guards`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp16-h-census.spec.ts`
- `tests/e2e/wp16-l-census.spec.ts`
- `tests/e2e/wp16-r-style-census.spec.ts`

## 5. Register and Backlog Changes

No status changes in `docs/audits/register.yml` in `L3`; `20261106-UX-213..UX-217` transition to `partial` in `L4`.

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.L L4`: census, pixel diff against `WP-16.K` sheets, visual self-inspection, `~/Desktop/wp16l-contact-sheets.zip`, register closure.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A168
=== Validating Receipt A168-wp-16l-l3-token-restructure-and-spacing-system.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '051cd53ac9af543239d26eac3b5f885e1540a1a0' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff b4378449a858a1084b038bec7ed9c3222580d437..051cd53ac9af543239d26eac3b5f885e1540a1a0 (38 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A168-wp-16l-l3-token-restructure-and-spacing-system.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A168-wp-16l-l3-token-restructure-and-spacing-system.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 152 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.L L4` remaining)
- Next action: execute `WP-16.L L4`.
