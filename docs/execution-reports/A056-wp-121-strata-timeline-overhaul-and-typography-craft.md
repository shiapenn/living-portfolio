# A056 — WP-12.1: Strata Timeline Visual Overhaul & Typography Craft

| Field | Value |
| --- | --- |
| Report ID | A056 |
| Date | 2026-11-04 |
| Author | A (Implementer) |
| Task ID | `WP-12.1 (20261020-UI-05, 20261020-UI-08, 20261020-UI-09)` |
| Evidence SHA | `62e8373` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/41760060900 |

---

## 1. Scope

- 1. **Continuous Time Axis Strata Timeline (20261020-UI-05 [P2]):** Overhauled the Strata timeline from a discrete button strip into a continuous monthly time axis. Rendered empty calendar months as hairline vertical slots (`.strata-band.strata-band-empty`) preserving temporal continuity and visually communicating cadence gaps without reduced opacity violations. Encoded profiles using differentiated visual textures (solid fill for engineering/core, 45-degree diagonal hatch for writing, stippled radial dots for speaking/advisory), venture notches on bottom borders, and glyph indicators (■ Core / Engineering, ◆ Writing, ▲ Speaking / Advisory) matching legend definitions. Replaced linear magic-number band height formula with a calibrated square-root formula `Math.min(120, Math.round(52 + Math.sqrt(n) * 28))` clamped between design tokens. Added a continuous vertical as-of cursor with `role="slider"` semantics, settle transition, and year-jump keyboard controls (Left/Right by month, PageUp/PageDown by year). [implemented]
- 2. **Active Role Styling & Text-First Claims (20261020-UI-08 [P2]):** Activated `.role-marker` and `.role-section` styles across all schema roles (`role-goal`, `role-approach`, `role-friction`, `role-decision`, `role-outcome`, `role-lesson`) eliminating inline border overrides in structured view. Converted claim items into a text-first reading list (`.claim-item`, `.claim-meta`, `.claim-text`) eliminating inline card boxes. Harmonized vertical spacing rhythms across date lines, context strip, and rail headings using standard design tokens (`--space-2`, `--space-4`, `--space-6`). [implemented]
- 3. **Typography Craft & Surface Polish (20261020-UI-09 [P2]):** Implemented tabular numerals (`.tabular-nums`) with `font-variant-numeric: tabular-nums` across timeline bands, date lines, counters, and table numbers. Enforced `text-wrap: balance` on headings and `text-wrap: pretty` on body/reading text. Added optical alignment via `hanging-punctuation: first allow-end` on blockquotes. Defined global `::selection` accent tokens. Implemented two-layer strata date glyph differentiation device (`renderStrataDateGlyph`) rendering upper and lower strata bars to visually separate event dates from publication dates. Choreographed micro-transitions (`--duration-fast` 120ms, `--duration-base` 160ms) with full `@media (prefers-reduced-motion: reduce)` resets. [implemented]
- 4. **Conformance and Unit Tests:** Added 13 new conformance tests in `apps/api/src/conformance/wp12-strata-craft.conformance.test.ts` and 5 new unit tests in `apps/web/src/web.test.ts`. [implemented]
- 5. **Audit Register Update:** Marked findings `20261020-UI-05`, `20261020-UI-08`, and `20261020-UI-09` as `fixed` in `docs/audits/register.yml` mapped to `wp12-strata-craft.conformance.test.ts`. [implemented]

---

## 2. CI Evidence

### 2.1 Build & Typecheck (Job 126345378047)

- Turbo build executed cleanly across all 8 packages (`@living-portfolio/config`, `@living-portfolio/core`, `@living-portfolio/client`, `@living-portfolio/ai`, `@living-portfolio/db`, `@living-portfolio/web`, `@living-portfolio/worker`, `@living-portfolio/api`).
- Zero compilation errors, zero TypeScript errors.

### 2.2 Verbatim Vitest Results per Package (Job 126345378047)

```
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  33 passed (33)
Test Files  2 passed (2)
Tests  29 passed (29)
Test Files  1 passed (1)
Tests  38 passed (38)
Test Files  2 passed (2)
Tests  16 passed (16)
Test Files  5 passed (5)
Tests  54 passed (54)
Test Files  36 passed (36)
Tests  302 passed (302)
```

*(Note: Total across workspaces: 49 test files passed, 482 passed | 1 skipped, 483 tests).*

### 2.3 Verbatim Playwright E2E Results (Job 126345378287)

```
49 passed (24.3s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 126345377827)

```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 126345377601)

```
210 commits scanned.
```

### 2.6 Verbatim DCO Verification Line (Job 126345378047)

```
✓ [OSR-07 DCO] All 1 commit(s) in fd81dc9404ee9944442f92395752ab791e4087b5..62e8373daff8f56df45cc6b422b8f31a4085f81b carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- **Web Unit Tests (`apps/web/src/web.test.ts`):** 5 new tests added (increasing `@living-portfolio/web` test suite from 33 to 38 tests):
  - `Strata timeline renders continuous month axis with empty month slots`: verifies continuous month bands, empty month hairline slots, and square-root height scaling.
  - `Strata timeline encodes profiles with glyphs and venture notch`: verifies profile encoding glyphs (■ ◆ ▲) and venture notch CSS classes.
  - `Structured view applies active role classes without inline border styles`: verifies `.role-section` and `.role-marker` classes across schema roles and absence of inline `border-left` styles.
  - `Entry claims render text-first list eliminating card box grids`: verifies `.claim-item` structure and absence of card grid containers.
  - `Typography craft: tabular numerals and optical alignment`: verifies `.tabular-nums` class on timeline bands, dates, and tables, plus optical hanging punctuation.

- **Conformance Tests (`apps/api/src/conformance/wp12-strata-craft.conformance.test.ts`):** 13 new conformance tests added (increasing `apps/api` test suite from 289 to 302 tests):
  - `[UI-05] Strata timeline continuous monthly time axis with empty months`: asserts continuous monthly sequence and hairline empty bands.
  - `[UI-05] Strata timeline encodes profiles with texture patterns and glyphs`: asserts visual texture fills and glyph icons (■ ◆ ▲).
  - `[UI-05] Strata timeline applies square-root height formula`: asserts height bounds under `Math.min(120, Math.round(52 + Math.sqrt(n) * 28))`.
  - `[UI-05] Strata timeline provides vertical as-of cursor with slider semantics`: asserts slider role, value properties, and settle animation.
  - `[UI-05] Strata timeline supports keyboard navigation (arrows and year jumps)`: asserts PageUp/PageDown jumps.
  - `[UI-08] Structured view activates .role-marker and .role-section classes`: asserts role classes on all 6 schema roles.
  - `[UI-08] Structured view contains zero inline border style overrides`: asserts zero inline `border-left` styles.
  - `[UI-08] Claims render as text-first list eliminating card grids`: asserts `.claim-item` without card box grids.
  - `[UI-08] Spacing rhythm is harmonized across date lines, context strip, and rail`: asserts spacing tokens.
  - `[UI-09] Tabular numerals applied to dates, timeline bands, counters, and data tables`: asserts `.tabular-nums` presence.
  - `[UI-09] Optical alignment with hanging punctuation on blockquotes`: asserts `hanging-punctuation` token.
  - `[UI-09] Headings use text-wrap balance and body text uses text-wrap pretty`: asserts wrap rules.
  - `[UI-09] Two-layer strata date glyph differentiation device renders correctly`: asserts strata date glyph on entries.

---

## 4. Files Touched

Matches `git diff --name-only 6752105..62e8373` (11 files):
- `apps/api/src/conformance/wp12-strata-craft.conformance.test.ts`
- `apps/web/src/components/entry-card.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A055-wp-115-copy-harmonization-spec-jargon-removal.md`
- `docs/handovers/H012-wp-11-gate-closure-and-wp-12-kickoff.md`
- `docs/plans/gates.json`

---

## 5. Register and Backlog Changes

The following 3 P2 findings were marked as `fixed` in `docs/audits/register.yml`:
- `20261020-UI-05` [P2]: Strata timeline continuous time axis, glyphs & square-root height -> `status: fixed` (regression test: `apps/api/src/conformance/wp12-strata-craft.conformance.test.ts`).
- `20261020-UI-08` [P2]: Role classes, text-first claims & spacing rhythm -> `status: fixed` (regression test: `apps/api/src/conformance/wp12-strata-craft.conformance.test.ts`).
- `20261020-UI-09` [P2]: Typography craft, tabular numerals, optical alignment & transitions -> `status: fixed` (regression test: `apps/api/src/conformance/wp12-strata-craft.conformance.test.ts`).

Total register status: 77 findings fixed (100% of 54 P0 findings, 19 of 32 P1 findings, 4 of 9 P2 findings). Remaining open: 20 findings (13 P1, 5 P2, 2 P3).

---

## 6. Not Done (Tagged)

None. All deliverables for WP-12.1 are complete.

---

## 7. Changes to Earlier Reports

None. Earlier reports A001 through A055 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A056-wp-121-strata-timeline-overhaul-and-typography-craft.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '62e8373' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 6752105..62e8373 (11 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A056-wp-121-strata-timeline-overhaul-and-typography-craft.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 126345378047)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 126345378287)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 126345377827)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 126345377601)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 126345378047)" verified against CI logs.

🎉 All receipt checks PASSED for A056-wp-121-strata-timeline-overhaul-and-typography-craft.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R1
- Receipts since last handover: 1 (A056); work packages since: 0
- Clean-boundary preconditions: met (WP-12.1 complete, all unit/conformance/E2E test suites green, 13 gates passing)
- Next action: Proceed to WP-12.2 (Actionable Error Messages & String Architecture, Task Receipt A057)
