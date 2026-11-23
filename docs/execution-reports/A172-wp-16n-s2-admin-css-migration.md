# A172 — wp-16n-s2-admin-css-migration

| Field | Value |
| --- | --- |
| Report ID | A172 |
| Date | 2026-11-23 |
| Author | A (Implementer) |
| Task ID | `WP-16.N S2` |
| Evidence SHA | `9241de2ede145db3c2692fbffee7b6a70afd0484` |
| CI run | 45143636369 |

---

## 1. Scope

Executed `WP-16.N S2` (Admin CSS migration out of `styles.ts` into modular `@living-portfolio/ui-admin` CSS bundles, route-group splitting, deletion of `styles.ts`, and >400-line web file splits):

- [implemented] Migrated all 5,644 lines of `apps/web/src/styles.ts` into modular per-component CSS files under `packages/ui-admin/src/` (`base`, `shell`, `primitives`, `components`, `patterns`, `templates`, `routes`), compiled into layered, content-hashed bundles (`admin.<hash>.css`, `admin-editor.<hash>.css`, `admin-gallery.<hash>.css`) with immutable caching.
- [implemented] Deleted `apps/web/src/styles.ts`; zero inlined admin CSS in any HTML response; `ADMIN_FULL_CSS` re-exported from `@living-portfolio/ui-admin` for backwards-compatible conformance assertions (compiled from CSS files, zero CSS-in-TS strings).
- [implemented] Updated `apps/web/src/layouts/admin-shell.ts` to load `core.<hash>.css`, `admin.<hash>.css`, route-group bundles (`admin-editor.<hash>.css` on editor/dev routes, `admin-gallery.<hash>.css` on `/admin/dev/*` and `/admin/_*` routes), and `accent.<hash>.css`.
- [implemented] Split `apps/web/src/app.ts` (into `routes/admin-dev-routes.ts` + `routes/public-routes.ts`), `apps/web/src/client/commit-entry.ts` (into `commit-entry-state.ts`, also removing 7 inline `style=` attributes), and `apps/web/src/primitives/foundations-gallery.ts` (into `foundations-gallery-components.ts` + `foundations-gallery-preview.ts`), all <= 400 lines.
- [implemented] Added shrinking-only `docs/design/file-size-exemptions.json` (enforced by `pnpm wp16n:verify`).
- [implemented] Updated `tests/e2e/wp16-r-style-census.spec.ts` to traverse nested `@layer` rules, `wp16-g-census.spec.ts` to read `packages/ui-admin/src/templates/dghl-polish.css`, and `staging-safeguards.conformance.test.ts` to check `/assets/css/admin.css`.
- [implemented] Verified admin pixel diff vs `2b64ea5` (252 sheets): 0/252 > 0.5% (237/252 exact 0px, max 0.0854%).

### Component statement (required when touching UI; D-J)

- [implemented] Added `.lp-undo-row` and `.lp-undo-btn` under `lp-undo` family in `docs/design/components.json` and `packages/ui-admin/src/components/feedback/feedback.css` to replace 7 inline `style=` attributes in `commit-entry-state.ts`; no new `data-c` component introduced.

## 2. CI Evidence

- PR #270 code commit `9241de2ede145db3c2692fbffee7b6a70afd0484`:
  - `CI & Audit Conformance Gate` run `45143636369`: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, 1m56s), `Build Shared Artifact` (`success`, 36s), `Playwright E2E Shards 1..4` (`success`, 1m3s..2m17s), `Playwright End-to-End Suite` (`success`, 3s).
  - `CodeQL Static Analysis` run `45143636085`: `success` (2m0s).
  - `Secret Scan (gitleaks)` run `45143636070`: `success` (6s).

## 3. Tests Added and Count Change

- [implemented] Extended `scripts/verify-ui-guards` to scan `packages/ui-admin/src/**/*.css` for token closure and literal guards.
- [implemented] Extended `scripts/wp16n-verify` to enforce shrinking-only `maxLines` caps on `docs/design/file-size-exemptions.json`.

## 4. Files Touched

- `apps/api/src/conformance/staging-safeguards.conformance.test.ts`
- `apps/web/src/app.ts`
- `apps/web/src/client/commit-entry-state.ts`
- `apps/web/src/client/commit-entry.ts`
- `apps/web/src/index.ts`
- `apps/web/src/layouts/admin-shell.ts`
- `apps/web/src/primitives/foundations-gallery-components.ts`
- `apps/web/src/primitives/foundations-gallery-preview.ts`
- `apps/web/src/primitives/foundations-gallery.ts`
- `apps/web/src/primitives/gallery.ts`
- `apps/web/src/routes/admin-dev-routes.ts`
- `apps/web/src/routes/public-routes.ts`
- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/audits/ui-guard-allowlist.json`
- `docs/design/components.json`
- `docs/design/file-size-exemptions.json`
- `docs/doc-registry.json`
- `docs/execution-reports/A171-wp-16n-s1-tokens-accent-docs-guards.md`
- `docs/plans/wp16n-progress.md`
- `packages/ui-admin/src/base/reset-and-typography.css`
- `packages/ui-admin/src/bundle.ts`
- `packages/ui-admin/src/components/action-bar/action-bar.css`
- `packages/ui-admin/src/components/choice/choice.css`
- `packages/ui-admin/src/components/feedback/feedback.css`
- `packages/ui-admin/src/components/form-section/form-section.css`
- `packages/ui-admin/src/components/item/item.css`
- `packages/ui-admin/src/components/overlay/overlay.css`
- `packages/ui-admin/src/components/page-header/page-header.css`
- `packages/ui-admin/src/components/tabs-stepper/tabs-stepper.css`
- `packages/ui-admin/src/index.ts`
- `packages/ui-admin/src/patterns/dsys-foundations.css`
- `packages/ui-admin/src/primitives/button/button.css`
- `packages/ui-admin/src/primitives/controls/controls.css`
- `packages/ui-admin/src/primitives/field/field.css`
- `packages/ui-admin/src/routes/editor-c3-fixes.css`
- `packages/ui-admin/src/routes/editor-c3.css`
- `packages/ui-admin/src/routes/editor-dfinal.css`
- `packages/ui-admin/src/routes/editor-fullscreen.css`
- `packages/ui-admin/src/routes/editor-reference.css`
- `packages/ui-admin/src/routes/gallery-canary-overrides.css`
- `packages/ui-admin/src/routes/gallery-canary.css`
- `packages/ui-admin/src/routes/gallery-foundations.css`
- `packages/ui-admin/src/routes/gallery-samples.css`
- `packages/ui-admin/src/shell/admin-header.css`
- `packages/ui-admin/src/shell/admin-shell-legacy.css`
- `packages/ui-admin/src/shell/layout-templates.css`
- `packages/ui-admin/src/shell/overlay-mobile.css`
- `packages/ui-admin/src/shell/workspace-shell.css`
- `packages/ui-admin/src/templates/dfinal-system.css`
- `packages/ui-admin/src/templates/dghl-polish.css`
- `scripts/verify-ui-guards`
- `scripts/wp16n-verify`
- `tests/e2e/wp16-g-census.spec.ts`
- `tests/e2e/wp16-r-style-census.spec.ts`

## 5. Register and Backlog Changes

- [implemented] Updated `docs/plans/wp16n-progress.md` with S1 merged (`b532ef3`) and S2 evidence; shrunk `docs/audits/ui-guard-allowlist.json` (split `commit-entry.ts` liveRegion 15 -> 12 + 3, removed 7 inline styles).

## 6. Not Done (Tagged)

- [not-started] S3 (public fonts, neutral editorial pack, CJK, 0 inline `style=`, `STATES.public`, interim zip), S4 (governance ADRs/rules/health/ds:impact/changesets), S5 (performance & closure). Continuing in stacked slices.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A172
=== Validating Receipt A172-wp-16n-s2-admin-css-migration.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '9241de2ede145db3c2692fbffee7b6a70afd0484' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 1620661792d61edc7027ac81a01dd1aece3e1cd1..9241de2ede145db3c2692fbffee7b6a70afd0484 (55 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A172-wp-16n-s2-admin-css-migration.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A172-wp-16n-s2-admin-css-migration.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 156 (per triage counter); work packages since: 2
- Clean-boundary preconditions: met
- Next action: merge PR #270 and continue WP-16.N Slice S3 on `feat/wp-16n-s3-public`.
