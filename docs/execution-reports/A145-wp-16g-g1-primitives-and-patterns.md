# A145 — wp-16g-g1-primitives-and-patterns

| Field | Value |
| --- | --- |
| Report ID | A145 |
| Date | 2026-11-20 |
| Author | A (Implementer) |
| Task ID | `WP-16.G G1` |
| Evidence SHA | `6c04789b6e1bbb02986a2c951bc611e321eccccb` |
| CI run | 44710762737 |

---

## 1. Scope

Executed `WP-16.G G1` (Container-Responsive Primitives, Geometry, Overlays & Fixture Page):
- [implemented] `apps/web/src/tokens/index.ts`: added `--border-overlay`, `--shadow-e1`, `--shadow-e1-up`, `--shadow-e1-right`, and `--shadow-e2` tokens.
- [implemented] `apps/web/src/primitives/`: added `data-c` and `data-rel` measurement hooks across `back-link.ts`, `tabs-stepper.ts`, `field.ts`, `action-bar.ts`, `tag.ts`, `segmented-control.ts` (`iconOnlyBelow640`), `form-section.ts` (`renderSubsection`), `page-header.ts`, `button.ts` (`variant: 'text'`), `chip.ts` (`StatusLabel`), `choice.ts` (`variant: 'segmented'`), `item.ts`, and `index.ts`.
- [implemented] `apps/web/src/styles.ts`: added `@container` `<400px` `Item` stacking, full-width `Item` hairline/hover/selected geometry (`12px 8px`), `Segments`, `Subsection`, vertically centred `Select` chevron (`12px` from right), `.lp-btn-text`, disabled button weight `600` + `text-3`, `Segmented` 4px inset thumb + `<640px` icon mode, symmetric `Tag` + `36px` remove hit target, overlay `1px` outline + directional `e1`/`e2` shadows, sticky editor header (`top: 48px`), and `.lp-outline-mode`.
- [implemented] `apps/web/src/pages/admin/gallery.ts`, `apps/web/src/app.ts`, `apps/web/src/pages/admin/fixture.ts`: added gallery anatomy captions & `?outline=1` toggle, rebuilt Fixture on `renderPageTemplate` with `Subsection`, `Segments`, and `pageLevel` `ActionBar`.
- [implemented] `tests/e2e/wp16-g-census.spec.ts` & `tests/e2e/wp16-s-system-census.spec.ts`: enabled `UX-174`, `UX-175`, `UX-177`, `UX-179`, and `UX-180` defect tests; updated `lineBudget` to permit overlay `1px` outline.

## 2. CI Evidence

- PR `#217` merged to `main` at `6c04789b6e1bbb02986a2c951bc611e321eccccb`.
- PR `#217` checks: `CI & Audit Conformance Gate` (`success`), `Playwright End-to-End Suite` (`success`), `CodeQL (JavaScript / TypeScript)` (`success`), `Gitleaks Secret & Credential Scan` (`success`), `Detect Changed Scope` (`success`).
- `main` push CI run `44710762737`.

## 3. Tests Added and Count Change

- Re-enabled 5 existing failing-first defect tests in `tests/e2e/wp16-g-census.spec.ts` (`UX-174`, `UX-175`, `UX-177`, `UX-179`, `UX-180`); all 19 tests in `wp16-g-census.spec.ts` pass.
- Verified locally: `@living-portfolio/web` unit tests (`99/99` passed), `node scripts/verify-ui-guards` (`0` violations), `wp16-f-fixture.spec.ts`, `wp16-r-style-census.spec.ts` (`0` violations), and `wp16-s-system-census.spec.ts`.

## 4. Files Touched

- `apps/web/src/app.ts`
- `apps/web/src/pages/admin/fixture.ts`
- `apps/web/src/pages/admin/gallery.ts`
- `apps/web/src/primitives/action-bar.ts`
- `apps/web/src/primitives/back-link.ts`
- `apps/web/src/primitives/button.ts`
- `apps/web/src/primitives/chip.ts`
- `apps/web/src/primitives/choice.ts`
- `apps/web/src/primitives/field.ts`
- `apps/web/src/primitives/form-section.ts`
- `apps/web/src/primitives/index.ts`
- `apps/web/src/primitives/item.ts`
- `apps/web/src/primitives/page-header.ts`
- `apps/web/src/primitives/segmented-control.ts`
- `apps/web/src/primitives/tabs-stepper.ts`
- `apps/web/src/primitives/tag.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/tokens/index.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A144-wp-16g-g0-contract-and-failing-census.md`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp16-g-census.spec.ts`
- `tests/e2e/wp16-s-system-census.spec.ts`

## 5. Register and Backlog Changes

None (visual register items `20261106-UX-157`..`UX-181` remain untouched until `G3` sets them to `partial` `"awaiting L review"`).

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.G G2`–`G3`: page & flow migrations (Setup Step 3 `UX-09`, Editor Settings, Status, Login, Settings page-level ActionBars) and pixel-diff contact sheets.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A145
=== Validating Receipt A145-wp-16g-g1-primitives-and-patterns.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '6c04789b6e1bbb02986a2c951bc611e321eccccb' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 705bc3056d2ccf6ec35c466f2592f531972e7fc5..6c04789b6e1bbb02986a2c951bc611e321eccccb (24 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A145-wp-16g-g1-primitives-and-patterns.md.

🎉 All receipt checks PASSED for A145-wp-16g-g1-primitives-and-patterns.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 129 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.G G2`–`G3` remaining)
- Next action: execute `WP-16.G G2` pages and flows.
