# A128 — WP-16.C C1 D-COMP Primitives and Gallery

| Field | Value |
| --- | --- |
| Report ID | A128 |
| Date | 2026-11-16 |
| Author | A (Implementer) |
| Task ID | `WP-16.C C1` |
| Evidence SHA | `497577f88d58ca0c4340d9aae5fa9d40f055bcff` |
| CI run | 43844893362 |

---

## 1. Scope

Executed `WP-16.C` `C1` primitives and gallery entries:
- [implemented] Fixed Icon sprite & `normalizeIconName` fallback bug (`apps/web/src/primitives/icons.ts`, `apps/web/src/primitives/button.ts`): added all 18 required `D-COMP` icons (`DCOMP_ICON_NAMES`), made `source` distinct from `code`, preserved `LUCIDE_ICON_NAMES` (16) for `WP-15.3a`, and threw on unknown icon IDs in dev/test instead of falling back to `x`.
- [implemented] Updated motion tokens (`100ms`, `160ms`, `240ms`, single easing `cubic-bezier(0.2, 0, 0, 1)`) and backdrop token (`--backdrop`) in `apps/web/src/tokens/index.ts`.
- [implemented] Implemented `PageHeader`, `Item` (`ListRow` delegates to `Item`), `ActionBar`, `Choice`, `Tabs` & `Stepper`, `Overlay`, and `FormSection` primitives in `apps/web/src/primitives/*` and `apps/web/src/styles.ts`.
- [implemented] Populated `/admin/_gallery` (`apps/web/src/pages/admin/gallery.ts`) with all `D-COMP` components in every applicable state and shrunk `docs/audits/dcomp-census-budget.json` (`iconViolations: 0`, `stackingViolations: 12`, `verticalRhythmViolations: 24`).

## 2. CI Evidence

- PR `#182` merged to `main` at `497577f88d58ca0c4340d9aae5fa9d40f055bcff`.
- `main` push CI run `43844893362` (`CI & Audit Conformance Gate`): `success` (`Detect Changed Scope`, `Typecheck, Unit, Security Regression, DCO & Audit Gate`, `Playwright End-to-End Suite`).
- `pnpm verify`: 15/15 gates passed.
- `pnpm test:e2e`: 120/120 Playwright E2E tests passed.

## 3. Tests Added and Count Change

- Added `apps/web/src/primitives/dcomp.test.ts` (+7 unit tests covering all 18 `D-COMP` icons, unknown icon throw, `PageHeader`, `Item`, `ActionBar`, `Choice`, `Tabs`/`Stepper`, `Overlay`, and `FormSection`).
- Net test count change: +7 unit tests added, 0 removed (95 web unit tests total, up from 88).

## 4. Files Touched

- `apps/web/src/pages/admin/gallery.ts`
- `apps/web/src/primitives/action-bar.ts`
- `apps/web/src/primitives/button.ts`
- `apps/web/src/primitives/choice.ts`
- `apps/web/src/primitives/dcomp.test.ts`
- `apps/web/src/primitives/form-section.ts`
- `apps/web/src/primitives/icons.ts`
- `apps/web/src/primitives/index.ts`
- `apps/web/src/primitives/item.ts`
- `apps/web/src/primitives/list-row.ts`
- `apps/web/src/primitives/overlay.ts`
- `apps/web/src/primitives/page-header.ts`
- `apps/web/src/primitives/tabs-stepper.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/tokens/index.ts`
- `docs/INDEX.md`
- `docs/audits/dcomp-census-budget.json`
- `docs/doc-registry.json`
- `docs/execution-reports/A127-wp-16c-c0-d-comp-foundations-and-census.md`

## 5. Register and Backlog Changes

None (`20261106-UX-126`..`UX-139` remain `open` until `C2`/`C3`/`C4` complete migration and verification).

## 6. Not Done (Tagged)

- [not-started] `WP-16.C C2`–`C4`: Page/overlay migrations, editor/Providers parity, and final contact sheets.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A128
=== Validating Receipt A128-wp-16c-c1-d-comp-primitives-and-gallery.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '497577f88d58ca0c4340d9aae5fa9d40f055bcff' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff cedb7fae93c511f995b64f6f64ed740d7c6492d4..497577f88d58ca0c4340d9aae5fa9d40f055bcff (19 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A128-wp-16c-c1-d-comp-primitives-and-gallery.md.
✓ [CI-LOG-CHECK] CI run 43844893362 verified on GitHub (conclusion: success).

🎉 All receipt checks PASSED for A128-wp-16c-c1-d-comp-primitives-and-gallery.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 112 (per triage counter); work packages since: 0
- Clean-boundary preconditions: met (`WP-16.C` in progress; `H018` deferred until `WP-16.C` gate closure)
- Next action: proceed to `WP-16.C C2` (migrate every page and overlay to `D-COMP` primitives).
