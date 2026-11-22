# A149 — wp-16h-h1-primitives-and-tokens

| Field | Value |
| --- | --- |
| Report ID | A149 |
| Date | 2026-11-22 |
| Author | A (Implementer) |
| Task ID | `WP-16.H H1` |
| Evidence SHA | `2eb0a72e364866e0ad02f92f2a1eef064d83f7fc` |
| CI run | 44977761810 |

---

## 1. Scope

Executed `WP-16.H H1` (Primitives & Tokens):
- [implemented] `apps/web/src/tokens/index.ts` & `apps/web/src/styles.ts` (`H1` control-height token): added `--control-height: 44px` (`<640px`) and `40px` (`>=640px`), applied to `.lp-btn`, `.lp-btn-sm`, `.lp-input`, `.lp-select`, `.lp-segmented-control`, `.lp-choice-variant-segmented .lp-choice-list`, and `.lp-btn-text`; Item and Dialog action buttons span full width below `400px` (`@container (max-width: 399px)`) and `min-width: 160px` otherwise.
- [implemented] `apps/web/src/styles.ts` (`H4` tag symmetric ink): `.lp-tag:has(.lp-tag-remove)` / `.lp-tag.lp-tag-removable` use `padding: 0 4px 0 8px` and `.lp-tag-remove` uses `padding: 0 4px` with uniform `28px` height (`8px` left text inset, `8px` right remove glyph ink inset).
- [implemented] `apps/web/src/styles.ts` (`H5`, `H6` bars): `.lp-admin-header` set to `60px` height with `12px` inset on all four sides and `36px` icon buttons; `.lp-editor-header-row` set to `56px` height, `12px` horizontal inset, `1fr auto 1fr` centred toggle, and `.lp-editor-toolbar-sticky` set to `top: 60px`.
- [implemented] `apps/web/src/tokens/index.ts` & `apps/web/src/styles.ts` (`H7`, `H8`, `H10`): restricted radii to `--r1: 4px` and `--r2: 8px`; deleted `.lp-recovery-link` CSS and usage in `apps/web/src/pages/admin/login.ts` with `.lp-btn.lp-btn-text` transparent at rest; added `.lp-sr-only` `1px` visually-hidden clip rule with zero margin.
- [implemented] `tests/e2e/wp16-h-census.spec.ts`, `tests/e2e/wp16-r-style-census.spec.ts`, `tests/e2e/wp16-g-census.spec.ts`, `tests/e2e/wp15-3a-design-foundations.spec.ts`, `tests/e2e/census-helpers.ts`: verified `UX-182`, `UX-185`, `UX-186`, `UX-187`, `UX-188`, `UX-189` passing without `test.fail`, updated control-height & `r2=8px` assertions, and converted H0 live-DOM canaries to synthetic broken-DOM canaries.

## 2. CI Evidence

- PR `#225` merged to `main` at `2eb0a72e364866e0ad02f92f2a1eef064d83f7fc`.
- `PR #225` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`), `Playwright End-to-End Suite` (`success`), `CodeQL` (`success`), `Secret Scan (gitleaks)` (`success`), `Detect Changed Scope` (`success`).
- `main` push CI run `44977761810` (`success`).

## 3. Tests Added and Count Change

- Updated `tests/e2e/wp16-h-census.spec.ts` (`6` failing-first defect tests promoted to passing: `UX-182`, `UX-185`, `UX-186`, `UX-187`, `UX-188`, `UX-189`; net test count unchanged).

## 4. Files Touched

- `apps/web/src/pages/admin/login.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/tokens/index.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A148-wp-16h-h0-contract-and-failing-census.md`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp15-3a-design-foundations.spec.ts`
- `tests/e2e/wp16-g-census.spec.ts`
- `tests/e2e/wp16-h-census.spec.ts`
- `tests/e2e/wp16-r-style-census.spec.ts`

## 5. Register and Backlog Changes

- None (visual register items remain `status: open` / `partial` until H3 closure).

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.H H2`–`H3`: page migrations & full G-census v2 closure, and pixel-diff contact sheets.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A149
=== Validating Receipt A149-wp-16h-h1-primitives-and-tokens.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '2eb0a72e364866e0ad02f92f2a1eef064d83f7fc' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff f4888b0640c8ef0760836ae27ff0df9e10a1b5fd..2eb0a72e364866e0ad02f92f2a1eef064d83f7fc (11 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A149-wp-16h-h1-primitives-and-tokens.md.
✓ [CI-LOG-CHECK] CI run 44977761810 verified on GitHub (conclusion: success).

🎉 All receipt checks PASSED for A149-wp-16h-h1-primitives-and-tokens.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 133 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.H H2`–`H3` remaining)
- Next action: execute `WP-16.H H2` page migrations and full G-census v2 closure.
