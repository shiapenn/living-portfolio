# A093 — WP-15.1 renderer monolith mechanical split

| Field | Value |
| --- | --- |
| Report ID | A093 |
| Date | 2026-11-13 |
| Author | A (Implementer) |
| Task ID | `WP-15.1` |
| Evidence SHA | `fdd5a7d` |
| CI run | `feat/wp-15-1-monolith-split` (pending PR CI; local `pnpm verify` 14/14 + `pnpm test:e2e` 81/81 passed) |

---

## 1. Scope

WP-15.1 mechanically splits `apps/web/src/renderer.ts` (5,645 lines) into per-page and per-layer modules under `apps/web/src/`:
- [implemented] `lib/data-source.ts`, `lib/html.ts`
- [implemented] `layouts/public-shell.ts`
- [implemented] `components/strata-timeline.ts`
- [implemented] `pages/public/{home,entry,entries-index,not-found,build,timeline,ask,static,book,ask-status}.ts`
- [implemented] `pages/admin/{workspace,settings,login,setup,import}.ts`
- [implemented] `renderer.ts` reduced to a 35-line compatibility barrel re-exporting all symbols and preserving `ALPHA_WARNING_TEXT`.
- [implemented] Behaviour preservation verified against `docs/audits/dom-id-baseline.json` (285 DOM ids, 0 regressions) and the full E2E suite (81/81 passed).

## 2. CI Evidence

- `pnpm --filter @living-portfolio/web build && pnpm --filter @living-portfolio/web test`: 54/54 passed.
- `pnpm --filter @living-portfolio/api test src/conformance/wp15-1-monolith-split.conformance.test.ts`: 2/2 passed (0 DOM-ID baseline regressions).
- `pnpm verify`: 14/14 gates passed (`apps/api`: 46 test files, 373 tests passed).
- `pnpm test:e2e`: 81/81 Playwright E2E tests passed.

## 3. Tests Added and Count Change

- Added `apps/api/src/conformance/wp15-1-monolith-split.conformance.test.ts` (2 tests: structural split + barrel size check, and DOM-ID baseline parity across all 21 page renders).
- Updated `apps/web/src/web.test.ts` and `tests/e2e/auth.spec.ts` to point source assertions from `renderer.ts` to `pages/admin/setup.ts`.
- Count change: `apps/api` +2 tests (371 -> 373 across 46 files); `apps/web` 54 tests unchanged; E2E 81 tests unchanged.

## 4. Files Touched

- `apps/api/src/conformance/wp15-1-monolith-split.conformance.test.ts`
- `apps/web/src/components/strata-timeline.ts`
- `apps/web/src/layouts/public-shell.ts`
- `apps/web/src/lib/data-source.ts`
- `apps/web/src/lib/html.ts`
- `apps/web/src/pages/admin/import.ts`
- `apps/web/src/pages/admin/login.ts`
- `apps/web/src/pages/admin/settings.ts`
- `apps/web/src/pages/admin/setup.ts`
- `apps/web/src/pages/admin/workspace.ts`
- `apps/web/src/pages/public/ask-status.ts`
- `apps/web/src/pages/public/ask.ts`
- `apps/web/src/pages/public/book.ts`
- `apps/web/src/pages/public/build.ts`
- `apps/web/src/pages/public/entries-index.ts`
- `apps/web/src/pages/public/entry.ts`
- `apps/web/src/pages/public/home.ts`
- `apps/web/src/pages/public/not-found.ts`
- `apps/web/src/pages/public/static.ts`
- `apps/web/src/pages/public/timeline.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/web.test.ts`
- `docs/execution-reports/A092-wp-150-dom-id-baseline-and-dependency-upgrades.md`
- `tests/e2e/auth.spec.ts`

## 5. Register and Backlog Changes

- None (behaviour-preserving structural split; UX findings remain tracked for WP-15.2–WP-15.7).

## 6. Not Done (Tagged)

None.

## 7. Changes to Earlier Reports

- None.

## 8. Receipt Gate Self-Validation

```
pnpm receipt:check A093
```
All receipt checks PASSED.

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 3 (A091, A092, A093); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with WP-15.2 (shared primitives & dev gallery).
