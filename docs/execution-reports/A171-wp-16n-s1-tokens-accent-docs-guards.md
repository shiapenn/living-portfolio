# A171 — wp-16n-s1-tokens-accent-docs-guards

| Field | Value |
| --- | --- |
| Report ID | A171 |
| Date | 2026-11-23 |
| Author | A (Implementer) |
| Task ID | `WP-16.N S1` |
| Evidence SHA | `1620661792d61edc7027ac81a01dd1aece3e1cd1` |
| CI run | 45134264647 |

---

## 1. Scope

Executed `WP-16.N S1` (Token cleanup, accent seed runtime wiring, per-pack generated docs & prose/drift guards, CI cancel fix, `wp16n:verify` aggregator):

- [implemented] Deleted 7 value-duplicate tokens without distinct purpose (`size.layout-medium-max`, `size.layout-nav-compact`, `size.layout-inspector-compact`, `size.layout-rail-width`, `motion.duration-item`, `border.banner-rule`, `space.stack.section`).
- [implemented] Reclassified 5 theme-invariant semantic tokens (`color.border.subtle-ring`, `elevation.e1-blur`, `elevation.e2-blur`, `elevation.e0`, `opacity.disabled`) to component tier; enforced semantic = theme-switched in `packages/design-tokens/src/rules.test.ts`.
- [implemented] Moved 13 single-use dimensions (`card-min-h`, `grid-field-min`, `overlay-sample-max`, `form-compact-max`, `progress-track-w`, `textarea-compact-min-h`, `textarea-min-h`, `menu-min-w`, `popover-min-w`, `popover-max-w`, `notch-width`, `col-min-xs`, `card-max-w`) into component-local `--_*` custom properties built from scale tokens.
- [implemented] Removed reduced-motion hack token `motion.duration-instant` (`0.01ms`) from `core.json` and `admin.json`; enforced `elevation.e1-up` uses `calc(-1 * {component.elevation.e1-offset-y})`.
- [implemented] Documented all remaining intentional component aliases in `governance.aliases` with `aliasOf` and `reason`; enforced zero undocumented duplicates in `rules.test.ts`.
- [implemented] Tuned `generateAccentRamp` OKLCH curve in `packages/ui-core/src/accent/accent.ts` so all 6 admin accent steps fall within delta-E 2000 <= 2.0 (max 0.93), dropping all overrides from `packs/core.json`.
- [implemented] Added `user-theme` cascade layer, served `/assets/css/accent.<hash>.css` with immutable caching on admin and public shells, mapped both packs' accent semantics to `var(--lp-core-accent-*, <fallback>)`. Admin pixel diff vs `2b64ea5` (252 sheets): 0.0000% on rendered content.
- [implemented] Generated tables-only docs for all packs (`docs/design/tokens.md`, `tokens-core.md`, `tokens-admin.md`, `tokens-public.md`); added prose-value guard and full per-pack drift guard in `scripts/verify-design-boundaries` and `drift.test.ts`.
- [implemented] Fixed `.github/workflows/ci.yml` `playwright-e2e` job `if:` condition to include `!cancelled()`, resolving the cause of failed job `137528473871` on cancelled duplicate PR runs.
- [implemented] Added `scripts/wp16n-verify` (`pnpm wp16n:verify`) and `docs/plans/wp16n-progress.md`.

### Component statement (required when touching UI; D-J)

- [implemented] No new `data-c` component introduced; admin and public shells load `/assets/css/accent.<hash>.css` in `@layer user-theme` with zero visual change on admin.

## 2. CI Evidence

- PR #269 code commit `1620661792d61edc7027ac81a01dd1aece3e1cd1`:
  - `CI & Audit Conformance Gate` run `45134264647`: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, 1m47s), `Build Shared Artifact` (`success`, 37s), `Playwright E2E Shards 1..4` (`success`, 1m0s..1m52s), `Playwright End-to-End Suite` (`success`, 5s).
  - `CodeQL Static Analysis` run `45134264592`: `success` (1m44s).
  - `Secret Scan (gitleaks)` run `45134264627`: `success` (4s).
  - `Dependency Review` run `45134264615`: `success` (5s).

## 3. Tests Added and Count Change

- [implemented] Extended `packages/design-tokens/src/rules.test.ts` (semantic theme-switched, zero undocumented duplicates, no `duration-instant`, `elevation.e1-up` offset variable) and `drift.test.ts` (all 8 generated files).
- [implemented] Updated `packages/ui-core/src/accent/accent.test.ts` to assert zero overrides required (all steps delta-E 2000 <= 2.0).

## 4. Files Touched

- `.github/workflows/ci.yml`
- `apps/api/src/conformance/wp12-strata-craft.conformance.test.ts`
- `apps/web/src/app.ts`
- `apps/web/src/client/admin-entry.ts`
- `apps/web/src/layouts/admin-shell.ts`
- `apps/web/src/layouts/public-shell.ts`
- `apps/web/src/pages/public/ask-status.ts`
- `apps/web/src/pages/public/ask.ts`
- `apps/web/src/pages/public/book.ts`
- `apps/web/src/pages/public/entry.ts`
- `apps/web/src/pages/public/not-found.ts`
- `apps/web/src/primitives/foundations-gallery.ts`
- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/design/accent-contract.md`
- `docs/design/foundations.md`
- `docs/design/tokens-admin.md`
- `docs/design/tokens-core.md`
- `docs/design/tokens-public.md`
- `docs/design/tokens.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A170-wp-16n-n1-slice-direction-and-accent-seed.md`
- `docs/plans/wp16n-progress.md`
- `package.json`
- `packages/design-tokens/generate.mjs`
- `packages/design-tokens/packs/admin.json`
- `packages/design-tokens/packs/core.json`
- `packages/design-tokens/packs/public.json`
- `packages/design-tokens/src/drift.test.ts`
- `packages/design-tokens/src/generated.ts`
- `packages/design-tokens/src/index.ts`
- `packages/design-tokens/src/public.css`
- `packages/design-tokens/src/rules.test.ts`
- `packages/design-tokens/src/tokens.css`
- `packages/design-tokens/tokens.json`
- `packages/ui-admin/src/admin.test.ts`
- `packages/ui-admin/src/bundle.ts`
- `packages/ui-core/src/accent/accent.test.ts`
- `packages/ui-core/src/accent/accent.ts`
- `packages/ui-core/src/accent/default-accent.ts`
- `packages/ui-core/src/core.test.ts`
- `packages/ui-core/src/index.ts`
- `packages/ui-core/src/layers.css`
- `packages/ui-public/src/bundle.ts`
- `packages/ui-public/src/public.test.ts`
- `scripts/verify-design-boundaries`
- `scripts/verify-ui-guards`
- `scripts/wp16n-verify`

## 5. Register and Backlog Changes

- [implemented] Added `docs/plans/wp16n-progress.md` tracker; no changes to `docs/audits/register.yml`.

## 6. Not Done (Tagged)

- [not-started] S2 (admin CSS migration out of `styles.ts`, 400-line splits), S3 (public fonts/neutral editorial/inline styles), S4 (governance ADRs/rules/health), S5 (performance & closure). Continuing in stacked slices.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A171
=== Validating Receipt A171-wp-16n-s1-tokens-accent-docs-guards.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '1620661792d61edc7027ac81a01dd1aece3e1cd1' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff abb53953d1607a5a6857690f32e76953087f1e72..1620661792d61edc7027ac81a01dd1aece3e1cd1 (48 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A171-wp-16n-s1-tokens-accent-docs-guards.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A171-wp-16n-s1-tokens-accent-docs-guards.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 155 (per triage counter); work packages since: 2
- Clean-boundary preconditions: met
- Next action: merge PR #269 and continue WP-16.N Slice S2 on `feat/wp-16n-s2-admin-css`.
