# A166 — wp-16l-l1-button-grammar-and-list-variants

| Field | Value |
| --- | --- |
| Report ID | A166 |
| Date | 2026-11-23 |
| Author | A (Implementer) |
| Task ID | `WP-16.L L1` |
| Evidence SHA | `bd6cfbcee54a1af6b705e11a9d78d58fc573fba1` |
| CI run | 45101529029 |

---

## 1. Scope

Executed `WP-16.L L1` (Item-Level Button Grammar `D-L1`, `List` Variants `plain` and `interactive` `D-L2`, and List Relation Tokens `D-L3`):
- [implemented] Updated `apps/web/src/primitives/button.ts` to add `text-danger` variant and `destructive` flag on `Button` (`lp-btn-text-danger`, `data-destructive="true"`, `color: var(--lp-color-role-danger-fg)`).
- [implemented] Updated `apps/web/src/primitives/action-bar.ts` (`renderActionBar`) to enforce `D-L1` on `level="item"`: at most 2 buttons; 1 action renders as `secondary`; 2 actions render as `secondary` (affirmative) + `text` (negative, or `text-danger` when destructive); never `primary`.
- [implemented] Added `renderList` (`List` variants `plain` and `interactive`) in `apps/web/src/primitives/item.ts` and exported from `apps/web/src/primitives/index.ts`, plus `headerId`/`headerActionHtml`/`attributes` support in `apps/web/src/primitives/form-section.ts`.
- [implemented] Added list relation and inset tokens (`control-to-list`: `16px`, `heading-to-list-plain`: `16px`, `heading-to-list-interactive`: `16px`, `tint-clearance`: `8px`, `space.inset.item-x`: `8px`, `space.inset.item-y`: `12px`) in `packages/design-tokens/tokens.json` and regenerated token artifacts.
- [implemented] Updated `apps/web/src/styles.ts` for `.lp-list-plain` (`0px` horizontal inset, vertical padding absorption on first/last `Item`, `::before` and `.lp-item-chevron` hidden) and `.lp-list-interactive` (`8px` horizontal inset, `12px` top/bottom padding retained for tint clearance, `::before { top: 0; bottom: 0 }`).
- [implemented] Updated `/admin/_gallery` (`apps/web/src/pages/admin/gallery.ts` and `apps/web/src/primitives/foundations-gallery.ts`) to showcase `#gallery-btn-text-danger`, `#gallery-list-interactive`, `#gallery-list-plain`, and `#gallery-tokens-list`.

### Component statement (required when touching UI; D-J)

- [implemented] `Button` (`data-c="Button"`, variant `text-danger`): registered in `docs/design/components.json`; sample `#gallery-btn-text-danger` added in `/admin/_gallery`.
- [implemented] `ActionBar` (`data-c="ActionBar"`, variant `item`): existing registered component in `docs/design/components.json`; enforces `D-L1` item grammar.
- [implemented] `List` (`data-c="List"`, variants `plain`, `interactive`): registered in `docs/design/components.json` (`variantOf: "Item"`); samples `#gallery-list-interactive` and `#gallery-list-plain` added in `/admin/_gallery`.
- [implemented] `FormSection` (`data-c="FormSection"`, variant `default`) & `SectionHeader` (`data-c="SectionHeader"`, variant `default`): existing registered components in `docs/design/components.json`.

## 2. CI Evidence

- PR `#259` merged to `main` at `bd6cfbcee54a1af6b705e11a9d78d58fc573fba1`.
- `PR #259` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, `1m40s`), `Playwright End-to-End Suite` (`success`, `9m37s`), `CodeQL Static Analysis` (`success`, `1m57s`), `Secret Scan (gitleaks)` (`success`, `6s`), `Detect Changed Scope` (`success`, `10s`).
- `main` push CI run `45101529029` triggered for `bd6cfbc`.

## 3. Tests Added and Count Change

- Extended `apps/web/src/primitives/dcomp.test.ts` with unit assertions for `D-L1` item `ActionBar` grammar, `text-danger` button, and `D-L2` `renderList` (`plain` and `interactive`).
- Added `L1 gallery verification` Playwright test in `tests/e2e/wp16-l-census.spec.ts` (`9/9` tests passing in `2.9s` local output).

## 4. Files Touched

- `apps/web/src/pages/admin/gallery.ts`
- `apps/web/src/primitives/action-bar.ts`
- `apps/web/src/primitives/button.ts`
- `apps/web/src/primitives/dcomp.test.ts`
- `apps/web/src/primitives/form-section.ts`
- `apps/web/src/primitives/foundations-gallery.ts`
- `apps/web/src/primitives/index.ts`
- `apps/web/src/primitives/item.ts`
- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/design/tokens.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A165-wp-16l-l0-docs-audits-and-canaries.md`
- `packages/design-tokens/src/generated.ts`
- `packages/design-tokens/src/tokens.css`
- `packages/design-tokens/tokens.json`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp16-l-census.spec.ts`
- `tests/e2e/wp16-r-style-census.spec.ts`
- `tests/e2e/wp16-s-system-census.spec.ts`

## 5. Register and Backlog Changes

No status changes in `docs/audits/register.yml` in `L1`; `20261106-UX-213..UX-217` remain `open` pending `L2`–`L4`.

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.L L2`: page & list migrations (`today`, `overlay-entries-panel`, `settings-providers`, `status`, `history`, `answer-rules`, `inbox`, `editor-settings`, `entries-list`, `settings`, `fixture-pattern`).
- `[not-started]` `WP-16.L L3`: token restructure (`D-L5`), spacing taxonomy (`D-L4`), generator, guards, monotonic proximity test, performance measurement.
- `[not-started]` `WP-16.L L4`: census, pixel diff against `WP-16.K` sheets with intended changes listed, visual inspection, `~/Desktop/wp16l-contact-sheets.zip`, closure.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A166
=== Validating Receipt A166-wp-16l-l1-button-grammar-and-list-variants.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'bd6cfbcee54a1af6b705e11a9d78d58fc573fba1' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff e95e77c39bff1808fbf389ff1a9eb233b13831b2..bd6cfbcee54a1af6b705e11a9d78d58fc573fba1 (20 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A166-wp-16l-l1-button-grammar-and-list-variants.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A166-wp-16l-l1-button-grammar-and-list-variants.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 150 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.L L2`–`L4` remaining)
- Next action: execute `WP-16.L L2`.
