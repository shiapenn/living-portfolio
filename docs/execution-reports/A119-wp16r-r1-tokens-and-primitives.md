# A119 — wp16r r1 tokens and primitives

| Field | Value |
| --- | --- |
| Report ID | A119 |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Task ID | `WP-16.R R1` |
| Evidence SHA | `670cc83b92c70594250413d3a21bfe8bce27dbfb` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/43721972164 |

---

## 1. Scope

Executed `WP-16.R R1` (Minimal Visual Reset — tokens and primitives):
- [implemented] Updated `apps/web/src/tokens/index.ts` and `apps/web/src/styles.ts` for D-MIN radii (`4px` controls/containers/chips, `8px` overlays, `999px` on `6px` status dots only), `36px` control height with `@media (pointer: coarse)` `44px` hit-area expansion, `6px` state dot + plain text (`400`), plain-text counts, single-row underline tabs (`2px`), spacing scale `{4, 8, 16, 24, 40, 64}`, and type scale `{12, 14, 16, 24}` with weights `400`/`600`.
- [implemented] Deleted duplicate component modules `apps/web/src/components/button.ts`, `apps/web/src/components/chip.ts`, and `apps/web/src/components/field.ts`; re-exported canonical primitives from `apps/web/src/components/index.ts` and updated `dashboard.ts` and `list.ts` to use `primitives/index.js`.
- [implemented] Shrank `docs/audits/style-census-budget.json` (`invalidRadii` `482 -> 8`, `invalidControlHeights` `438 -> 70`, `invalidFontSizes` `432 -> 340`, `invalidSpacing` `3064 -> 1400`, `multiSignatureRoles` `4 -> 3`).

## 2. CI Evidence

- PR #164 (`feat/wp-16-r1-tokens-and-primitives` -> `main`, merge commit `670cc83b92c70594250413d3a21bfe8bce27dbfb`):
  - `CI & Audit Conformance Gate` (`main` push run `43721972164`, wall-clock; GitHub `billable` field returns `0`):
    - `Detect Changed Scope`: `success` (`6s` / `0.10 min`)
    - `Typecheck, Unit, Security Regression, DCO & Audit Gate`: `success` (`2m24s` / `2.40 min`)
    - `Playwright End-to-End Suite`: `success` (`2m29s` / `2.48 min`)
  - `Secret Scan (gitleaks)` (`main` push run `43721972196`):
    - `Gitleaks Secret & Credential Scan`: `success` (`8s` / `0.13 min`)

## 3. Tests Added and Count Change

- Updated `apps/web/src/web.test.ts`, `apps/api/src/conformance/wp11-markdown-tokens.conformance.test.ts`, `tests/e2e/wp15-2-primitives-gallery.spec.ts`, `tests/e2e/wp15-3a-design-foundations.spec.ts`, and `tests/e2e/wp15-7-editor-reference-page.spec.ts` to enforce D-MIN tokens, `36px` control heights, `4px`/`8px` radii, and unified primitives.
- All `113` Playwright E2E tests and all unit/conformance gates passed.

## 4. Files Touched

- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A118-wp16r-r0-dmin-spec-and-census.md`
- `apps/api/src/conformance/wp11-markdown-tokens.conformance.test.ts`
- `apps/web/src/components/button.ts` (deleted)
- `apps/web/src/components/chip.ts` (deleted)
- `apps/web/src/components/field.ts` (deleted)
- `apps/web/src/components/index.ts`
- `apps/web/src/pages/admin/dashboard.ts`
- `apps/web/src/pages/admin/entries/list.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/tokens/index.ts`
- `apps/web/src/web.test.ts`
- `docs/audits/style-census-budget.json`
- `tests/e2e/wp15-2-primitives-gallery.spec.ts`
- `tests/e2e/wp15-3a-design-foundations.spec.ts`
- `tests/e2e/wp15-7-editor-reference-page.spec.ts`

## 5. Register and Backlog Changes

- None (`20261106-UX-107` and `20261106-UX-108` remain `open` pending R2–R4).

## 6. Not Done (Tagged)

- [not-started] `WP-16.R R2`–`R4` (page migration to sidebar shell, element removal/defect fixes, contact sheets and 0-violation census) remain open.

## 7. Changes to Earlier Reports

- None.

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A119
=== Validating Receipt A119-wp16r-r1-tokens-and-primitives.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '670cc83b92c70594250413d3a21bfe8bce27dbfb' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff ef2649a..670cc83b92c70594250413d3a21bfe8bce27dbfb (17 files verified).
✓ [HANDOVER-DECISION-CHECK] Section 9 matches triage output (RECOMMENDED, HO-R3).

All receipt checks PASSED.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 5 (A115, A116, A117, A118, A119); work packages since: 2
- Clean-boundary preconditions: met
- Next action: continue with WP-16.R R2 (migrate all admin pages to primitives and sidebar shell)
