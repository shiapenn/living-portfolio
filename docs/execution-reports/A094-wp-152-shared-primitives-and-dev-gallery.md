# A094 — WP-15.2 shared primitives and dev gallery

| Field | Value |
| --- | --- |
| Report ID | A094 |
| Date | 2026-11-13 |
| Author | A (Implementer) |
| Task ID | `WP-15.2` |
| Evidence SHA | `904584e` |
| CI run | `feat/wp-15-2-shared-primitives-gallery` (pending PR CI; local `pnpm verify` 14/14 + `pnpm test:e2e` 82/82 passed) |

---

## 1. Scope

WP-15.2 establishes the shared UI control and form-field primitives under `apps/web/src/primitives/*` and a development-only gallery route:
- [implemented] `Button` (`primary`, `secondary`, `danger`, `quiet`; `sm`/`md`; `disabled`, `loading` with `aria-busy="true"`), `IconButton` (required `aria-label`, `>= 44x44` target size).
- [implemented] `Chip` (`confirmed` vs dashed `suggested`; native `<button>` when interactive, `<span>` with `cursor: default` when static), `Badge`, `StatusDot` (always paired with visible label).
- [implemented] `Switch` (`role="switch"`, `aria-checked`, optional description).
- [implemented] `Field` (`input`, `textarea`, `select`, `checkbox`, `radio` with linked `<label>`, help text, and `role="alert"` error linkage).
- [implemented] Development-only gallery route `/admin/dev/primitives` (`NODE_ENV !== 'production'`), verified with `@axe-core/playwright`, target size, computed `cursor`, and `role` checks.

## 2. CI Evidence

- `pnpm --filter @living-portfolio/web test`: 60/60 passed (`primitives.test.ts`: 6/6, `web.test.ts`: 54/54).
- `pnpm verify`: 14/14 gates passed.
- `pnpm test:e2e`: 82/82 Playwright E2E tests passed (including `wp15-2-primitives-gallery.spec.ts`).

## 3. Tests Added and Count Change

- Added `apps/web/src/primitives/primitives.test.ts` (6 unit tests).
- Added `tests/e2e/wp15-2-primitives-gallery.spec.ts` (1 Playwright + axe test).
- Count change: `apps/web` +6 tests (54 -> 60); E2E +1 test (81 -> 82).

## 4. Files Touched

- `apps/web/src/app.ts`
- `apps/web/src/primitives/button.ts`
- `apps/web/src/primitives/chip.ts`
- `apps/web/src/primitives/field.ts`
- `apps/web/src/primitives/gallery.ts`
- `apps/web/src/primitives/index.ts`
- `apps/web/src/primitives/primitives.test.ts`
- `apps/web/src/primitives/switch.ts`
- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A093-wp-151-renderer-monolith-mechanical-split.md`
- `docs/execution-reports/A094-wp-152-shared-primitives-and-dev-gallery.md`
- `tests/e2e/wp15-2-primitives-gallery.spec.ts`

## 5. Register and Backlog Changes

- `20261106-UX-38`: updated `open` -> `fixed` (verified by `apps/web/src/primitives/primitives.test.ts`).
- `20261106-UX-23`: updated `open` -> `partial` (all shared primitives enforce `>= 40x40` target size; legacy pages adopt primitives in `WP-15.7` and `WP-16`).

## 6. Not Done (Tagged)

None.

## 7. Changes to Earlier Reports

- None.

## 8. Receipt Gate Self-Validation

```
pnpm receipt:check A094
```
All receipt checks PASSED.

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 4 (A091, A092, A093, A094); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with WP-15.3 (feedback & containers).
