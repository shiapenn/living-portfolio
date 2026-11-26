# A186 — wp-1715-visual-system-pass

| Field | Value |
| --- | --- |
| Report ID | A186 |
| Date | 2026-11-26 |
| Author | A (Implementer) |
| Task ID | `WP-17.15` |
| Evidence SHA | `6739610890dec39bd58dcc3edba6a5ee692f5116` |
| CI run | pending PR CI |

---

## 1. Scope

- [implemented] **V1 (Shape language):** Added `12px` container radius token (`--lp-radius-container: 12px`, `--lp-radius-control: 8px`, `--lp-radius-full: 999px`, `--lp-radius-none: 0px`). Removed partial-border + radius on `.lp-item` (replaced `border-bottom` with 0-radius `::after` hairline) and `.lp-tab` (replaced inset box-shadow U-bowl with 0-radius `::after` 2px accent bar). Enforced across 100% of `WP17_MANIFEST` in `K28` (`2,224` elements, `50` indicators, `0` violations).
- [implemented] **V2 (Tabs redesigned):** 1px hairline baseline on `.lp-tabs[role="tablist"]`, transparent tab with weight-stable `500` (`14px`) in `text-2`, hover `text-1` with no fill, selected `text-1` + 0-radius 2px accent bar overlapping baseline, inset `-2px` focus ring with `8px` radius (never clipped), hit height `>= 44px`. Verified in `K32` (`21` tabs, `0` violations).
- [implemented] **V3 (Token ladders):** Added explicit semantic surface (`canvas`, `raised`, `sunken`, `overlay`), border (`hairline` 1.52:1 light / 1.49:1 dark, `control` 3.28:1 light / 3.25:1 dark replacing 4.36:1 / 5.29:1, `strong`), fill (`neutral-tint-1/2/3`, `accent-tint-1/2`), motion (`duration-0/fast/base`, `easing-standard`, `prefers-reduced-motion`), and icon stroke width (`--lp-icon-stroke-width: 1.75`) tokens in `packages/design-tokens/packs/admin.json`. Verified in `K29` (`0` violations both themes) and rendered in `#gallery-ladder-specimen`.
- [implemented] **V4 (Button hierarchy & distinct signatures):** Primary = accent fill; Secondary = `--lp-color-fill-neutral-tint-1` tonal fill with no outline (`border-color: transparent`); Text = accent text; Destructive = danger text (danger fill only inside `.lp-dialog-panel`); Field = 8px control radius + control border; Choice = 12px container radius + control border (off) / accent border + accent-tint-1 (selected); Tab = 0px radius + transparent. Primary page-level Save auto-width & left-aligned at `>= 480px`, full-width at compact. Verified in `K31` (`7/7` distinct signatures).
- [implemented] **V5 (PageHeader slots):** Wrapped title+description in `.lp-page-header-main`, placed primary page action trailing on title row at `>= 480px` (including `.lp-back-link ~ .lp-page-header-action`), and below description with `S4` (`24px`) above & below at compact (`< 480px`). Documented in `docs/design/archetypes.md` and verified in `K33` (`5` headers with actions, `0` violations).
- [implemented] **V6 (Status colour family):** Unified OKLCH status tokens (`--lp-color-status-success/warning/danger/info/neutral`: step 600 light >= 5.0:1, step 400 dark >= 6.0:1); Pending uses warning ramp; Notice banners share the same ramp tint/border steps.
- [implemented] **V7 (Typography refinement):** `tabular-nums` on meta/eyebrow/def-value/titles/status-label, `text-wrap: balance` on titles, `text-wrap: pretty` on body/descriptions, `max-width: var(--lp-measure-reading)` (`68ch`) on descriptions/consequences/helpers, and `--lp-font-letter-tight` (`-0.01em`) on page-title. Verified in `K34` (`0` violations).
- [implemented] **V8 (Item hover/pressed inset surfaces):** `.lp-item` uses `12px` container radius with `padding-inline: var(--lp-space-inset-item-x)` and hides `::after` hairline on hovered/active row and preceding row.
- [implemented] **L7 (Hard-coded value audit):** Added L7 scanner to `scripts/design-audit` (wired into `wp16n:verify`), added build-time breakpoint expansion (`__LP_BP_*__` from `BREAKPOINTS`) in `packages/ui-admin/src/bundle.ts`, tokenized all 167 literals down to `0` violations (with `2` dynamic JS runtime allowlist entries in `docs/design/hardcode-allowlist.json`, `<= 10`).

### Component statement (required when touching UI; D-J)

- [implemented] `Tabs`, `Item`, `Button`, `Choice`, `Field`, `PageHeader`, `Credential`, `Notice`, `StatusLabel`, `ActionBar`: all registered in `docs/design/components.json` (zero new `data-c` components added; admin system mode preserved).

## 2. CI Evidence

- `pnpm verify:fast`: PASSED (8/8 checks; 305 tokens defined/used, 126 files checked, 104/104 web unit tests, 7/7 design-tokens tests, 2/2 ui-admin tests).
- `pnpm design:audit`: PASSED (`0` violations across L0–L7; L7 reduced from `167` on `25e95c6` to `0`, allowlist `2/10`).
- `pnpm ds:health --check`: PASSED (Public CSS 4129 B gzip, Admin CSS 22229 B gzip, Editor JS 139207 B gzip).
- `pnpm wp16n:verify`: PASSED (`11/11` DoD checks green).
- `tests/e2e/wp17-15-visual-system-audit.spec.ts` (`K28`–`K34`) + `tests/e2e/wp17-14-closed-world-audit.spec.ts` (`K22`–`K27`): **12/12 PASSED** on PR head.
- Failing-first canary on `25e95c6`: **7/7 FAILED** (`K28`: `50` partial-border+radius / U-bowl violations; `K29`: control contrast `4.36` light / `5.29` dark, missing V3 tokens; `K30/L7`: `167` hard-coded violations; `K31`: duplicate signatures across Secondary/Field/Choice; `K32`: `22` tab weight/focus violations; `K33`: PageHeader compact/regular slot violations; `K34`: typography violations).
- Contact sheet archive: `~/Desktop/wp17-15-contact-sheets.zip` (`138` PNGs incl. `100` 1x manifest sheets, `18` `25e95c6` before-sheets, `20` K35 2x close-ups + State Matrix + Ladder Specimen in both themes + `INDEX.md`, `12 MB`).

## 3. Tests Added and Count Change

- Added `tests/e2e/wp17-15-visual-system-audit.spec.ts` (+7 manifest-driven E2E checks covering `K28`–`K34`).
- Extended `scripts/design-audit` with L7 hard-coded value audit (`K30`).
- Extended `tests/e2e/wp17-contact-sheets.spec.ts` with K35 `deviceScaleFactor: 2` close-ups and `25e95c6` before-sheets.

## 4. Files Touched

- `apps/web/src/primitives/foundations-gallery-states.ts`
- `apps/web/src/primitives/page-header.ts`
- `apps/web/src/web.test.ts`
- `docs/design/archetypes.md`
- `docs/design/hardcode-allowlist.json`
- `docs/design/health-history.json`
- `docs/design/health.md`
- `docs/design/interaction.md`
- `docs/design/tokens-admin.md`
- `docs/design/tokens.md`
- `docs/execution-reports/A185-wp-1714-archetypes-closed-world-audit.md`
- `docs/plans/backlog.yml`
- `packages/design-tokens/packs/admin.json`
- `packages/design-tokens/src/generated.ts`
- `packages/design-tokens/src/tokens.css`
- `packages/design-tokens/tokens.json`
- `packages/ui-admin/src/base/reset-and-typography.css`
- `packages/ui-admin/src/bundle.ts`
- `packages/ui-admin/src/components/action-bar/action-bar.css`
- `packages/ui-admin/src/components/choice/choice.css`
- `packages/ui-admin/src/components/credential/credential.css`
- `packages/ui-admin/src/components/feedback/feedback.css`
- `packages/ui-admin/src/components/form-section/form-section.css`
- `packages/ui-admin/src/components/item/item.css`
- `packages/ui-admin/src/components/overlay/overlay.css`
- `packages/ui-admin/src/components/page-header/page-header.css`
- `packages/ui-admin/src/components/tabs-stepper/tabs-stepper.css`
- `packages/ui-admin/src/patterns/dsys-foundations.css`
- `packages/ui-admin/src/primitives/controls/controls.css`
- `packages/ui-admin/src/primitives/field/field.css`
- `packages/ui-admin/src/routes/editor-c3-fixes.css`
- `packages/ui-admin/src/routes/editor-c3.css`
- `packages/ui-admin/src/routes/editor-dfinal.css`
- `packages/ui-admin/src/routes/editor-fullscreen.css`
- `packages/ui-admin/src/routes/editor-reference.css`
- `packages/ui-admin/src/routes/gallery-foundations.css`
- `packages/ui-admin/src/routes/gallery-samples.css`
- `packages/ui-admin/src/shell/admin-header.css`
- `packages/ui-admin/src/shell/admin-shell-legacy.css`
- `packages/ui-admin/src/shell/layout-templates.css`
- `packages/ui-admin/src/shell/overlay-mobile.css`
- `packages/ui-admin/src/shell/workspace-shell.css`
- `packages/ui-admin/src/templates/dfinal-system.css`
- `packages/ui-admin/src/templates/dghl-polish.css`
- `scripts/design-audit`
- `tests/e2e/wp17-14-closed-world-audit.spec.ts`
- `tests/e2e/wp17-15-visual-system-audit.spec.ts`
- `tests/e2e/wp17-contact-sheets.spec.ts`

## 5. Register and Backlog Changes

- Registered `A186` (`docs/execution-reports/A186-wp-1715-visual-system-pass.md`) in `docs/doc-registry.json` and regenerated `docs/INDEX.md`.
- Inserted `WP-17.15` (`status: done`) before `WP-18.3` in `docs/plans/backlog.yml` and updated `WP-18.3` `depends_on: [WP-17.15]`.
- Added `docs/design/hardcode-allowlist.json` (`2` shrinking-only entries, `maxEntries: 10`).

## 6. Not Done (Tagged)

None.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A186
=== Validating Receipt A186-wp-1715-visual-system-pass.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '6739610890dec39bd58dcc3edba6a5ee692f5116' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 23f9201f47c55047e65284d143013078e47148ee..6739610890dec39bd58dcc3edba6a5ee692f5116 (48 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A186-wp-1715-visual-system-pass.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A186-wp-1715-visual-system-pass.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 170 (A017..A186); work packages since: 1
- Clean-boundary preconditions: met
- Next action: merge WP-17.15, deliver zip, and check WP-18.3 API-only boundary
