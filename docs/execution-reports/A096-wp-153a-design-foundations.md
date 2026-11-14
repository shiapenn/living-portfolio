# A096 — WP-15.3a Design Foundations

| Field | Value |
| --- | --- |
| Report ID | A096 |
| Date | 2026-11-14 |
| Author | A (Implementer) |
| Task ID | `WP-15.3a` |
| Evidence SHA | `4f285d9` |
| CI run | `feat/wp-15-3a-design-foundations` (pending PR CI; local `pnpm verify` 14/14 + `pnpm test:e2e` 84/84 passed) |

---

## 1. Scope

WP-15.3a implements the Design Foundations (`D-FOUND-1` through `D-FOUND-6`) and incorporates all Checkpoint 1 review amendments (items 1–11):
- [implemented] `docs/design/foundations.md` (`L017`, status `active`): codifies `D-FOUND-1` (Icons & Lucide `ISC` licence, target-mode `moon`/`sun` theme toggle), `D-FOUND-2` (Shape, 4 radius tokens, borderless `Badge` vs bordered `Chip`, no nested 4-sided bordered boxes), `D-FOUND-3` (4 px spacing scale, 260 px list + 720 px max main grid, `>= 768 px` admin navigation vs `< 768 px` compact header `<= 64 px` and `>= 44 px` touch targets), `D-FOUND-4` (type scale roles, reading face on auto-growing writing surface, 6 colour roles + boundary/focus probes displaying computed `X.X:1` contrast ratios meeting `>= 4.5:1` text and `>= 3.0:1` UI/focus contrast), `D-FOUND-5` (interactive states including loading spinner at full text contrast and disabled hover/focus reason tooltip), and `D-FOUND-6` (Notice and StatusLine link-style actions, tone icon vertical alignment, single active message per specimen, non-directional copy, hairline Disclosure with 1-col/2-col field grid, single-CTA EmptyState with embedded first-run guide).
- [implemented] Self-hosted inline SVG icon sprite (`apps/web/src/primitives/icons.ts`, `#lp-icon-sprite`, 16 icons) on a 24 px grid at sizes `{16, 20, 24}` px only, replacing all text glyphs (`×`, `▾`, `◐`).
- [implemented] Updated primitives and containers (`Badge`, `Chip`, `Button`, `IconButton`, `Field`, `PageNotice`, `StatusLine`, `Disclosure`, `Menu`, `Dialog`, `Drawer`, `EmptyState`) and design tokens (`apps/web/src/tokens/index.ts`, `apps/web/src/styles.ts`).
- [implemented] Mounted session-protected dev-only `/admin/dev/foundations` (`apps/web/src/primitives/foundations-gallery.ts`, excluded when `NODE_ENV=production`) rendering computed contrast ratios, token/radius/elevation/border/surface/spacing specimens, full icon sprite inventory, captioned icon-button states, open `Menu`, open `Dialog`, closed/open `Disclosure` with real `Details` fields, separate message specimens, auto-growing textarea, and the 6-state workspace alignment preview in light and dark themes.
- [implemented] Automated computed-style and DOM conformance suite (`tests/e2e/wp15-3a-design-foundations.spec.ts` and `apps/web/src/primitives/foundations.test.ts`).

## 2. CI Evidence

- `pnpm --filter @living-portfolio/web test`: 74/74 passed (`foundations.test.ts`: 8/8, `primitives.test.ts`: 6/6, `components.test.ts`: 6/6, `web.test.ts`: 54/54).
- `pnpm verify`: 14/14 gates passed.
- `pnpm test:e2e`: 84/84 Playwright E2E tests passed (including `wp15-3a-design-foundations.spec.ts`).

## 3. Tests Added and Count Change

- Count change: `apps/web` 74 unit tests (+8 from 66 in `A095`); E2E 84 tests (+1 from 83 in `A095`).
- Added `apps/web/src/primitives/foundations.test.ts` (8 unit tests, including admin session auth redirect and `NODE_ENV=production` `404` exclusion).
- Added `tests/e2e/wp15-3a-design-foundations.spec.ts` (1 Playwright computed-style, contrast, interaction, and axe conformance suite + optional `CAPTURE_SCREENSHOTS=1` screenshot runner).

## 4. Files Touched

- `apps/web/src/app.ts`
- `apps/web/src/components/containers.ts`
- `apps/web/src/components/feedback.ts`
- `apps/web/src/components/index.ts`
- `apps/web/src/primitives/button.ts`
- `apps/web/src/primitives/chip.ts`
- `apps/web/src/primitives/field.ts`
- `apps/web/src/primitives/foundations-gallery.ts`
- `apps/web/src/primitives/foundations.test.ts`
- `apps/web/src/primitives/gallery.ts`
- `apps/web/src/primitives/icons.ts`
- `apps/web/src/primitives/index.ts`
- `apps/web/src/primitives/primitives.test.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/tokens/index.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/design/foundations.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A095-wp-153-shared-feedback-and-container-components.md`
- `docs/execution-reports/A096-wp-153a-design-foundations.md`
- `docs/plans/P004-ux-remediation-work-packages.md`
- `docs/plans/gates.json`
- `tests/e2e/wp15-3a-design-foundations.spec.ts`

## 5. Register and Backlog Changes

- `20261106-UX-70`, `20261106-UX-71`, `20261106-UX-79`: `status: partial` with note `"fixed (gallery); confirm in editor at 15.7"`.
- `20261106-UX-72` through `20261106-UX-77` and `20261106-UX-80`: `status: partial` (foundations tokens, primitives/containers, and `/admin/dev/foundations` conformance verified in `WP-15.3a`; reference editor page integration in `WP-15.7`).
- `20261106-UX-81` through `20261106-UX-90`: registered `status: open` (none fixed) covering Checkpoint 1 review items 1–10, mapped to `WP-15.3a` and `WP-15.7` in `docs/audits/register.yml`, `docs/plans/P004-ux-remediation-work-packages.md`, and `docs/plans/gates.json`.

## 6. Not Done (Tagged)

None.

## 7. Changes to Earlier Reports

- None.

## 8. Receipt Gate Self-Validation

```
pnpm receipt:check A096
```
All receipt checks PASSED.

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 6 (A091, A092, A093, A094, A095, A096); work packages since: 0
- Clean-boundary preconditions: met
- Next action: leave WP-15.3a PR unmerged and stop at Checkpoint 1 for L's visual review of `/admin/dev/foundations` screenshots.
