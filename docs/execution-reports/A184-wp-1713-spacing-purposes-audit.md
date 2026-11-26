# A184 — WP-17.13 spacing ownership, text purposes, token integrity, design audit

| Field | Value |
| --- | --- |
| Report ID | A184 |
| Date | 2026-11-26 |
| Author | A (Implementer) |
| Task ID | `WP-17.13` |
| Evidence SHA | `b5bbfc94ce5db5a495894f62a127cea5787f53d9` |
| CI run | pending PR #282 CI |

---

## 1. Scope

- [implemented] **D1 (Spacing ownership):** Removed component outer margin rules (`dghl-polish.css:49` `margin: auto 0;`, `reset-and-typography.css:310` `margin-bottom: auto;`, plus 3 redundant margin overrides in `dfinal-system.css`; 5 margin rules removed total). Containers own spacing by relation via `--lp-space-proximity-1..5` (S1=4, S2=8, S3=16, S4=24, S5=40). Updated `FormSection` (`apps/web/src/primitives/form-section.ts`) so empty/hidden field wrappers do not create phantom gaps, grouped consequence + ActionBar inside `.lp-action-bar-group` (S2 gap inside, S4 above regardless of prior element, S3 to feedback), set Item padding-block to S3 and last-row -> ActionBar to S3, and removed the border-top divider above `Copy` in `Credential`.
- [implemented] **D2 (Text purposes):** Added closed `data-purpose` set (`title|label|value|helper|consequence|status|feedback|empty|meta|intro`) across `Text`, `Field`, `PageHeader`, `SectionHeader`, `FormSection`, `Item`, `List`, `StatusLabel`, `EmptyState`, `Notice`, and `StatusLine`. Banned section intros (`FormSection.description` and `Subsection.intro` removed); moved all operational consequences to `.lp-action-bar-group` directly above their `ActionBar` or deleted redundant copy (including Account page intro and `"Shown once when generated/created."`). Published full route -> text node -> purpose -> disposition table in `docs/design/content.md`.
- [implemented] **D3 (Type roles):** Merged `secondary` and `meta` into `secondary` (`13px` / `400` / `text-2`, contrast `7.04:1` light and `8.06:1` dark, both `>= 7:1`) and raised `mono` to `13px` in `packages/design-tokens/packs/admin.json`; removed unused `--lp-font-size-12` from admin component tokens; replaced all 51 admin `--lp-font-size-12` references with `--lp-font-size-13`; restricted `text-3` strictly to placeholders and disabled controls.
- [implemented] **D4 (Actions):** Enforced single-row `<= 2` item ActionBars at `320px` (`flex-wrap: nowrap`), removed `"Email requester"` button from Booking detail, and updated Account authenticator to show only `"Re-enrol app"` until enrolment begins, then reveal QR + manual key + 6-digit code + `"Confirm app"` and `"Cancel"`.
- [implemented] **D5 (Booking detail):** Moved `StatusLabel` to `PageHeader` (dropped Status row), added `List` `definition` variant (`data-c="List" data-variant="definition"`, no new `data-c`) with label above value `<640px` and `label | value` `>=640px` without per-row dividers across 3 groups (`Request`, `Context`, `Meta`), placed consequence `"Status changes here only. The visitor isn't notified."` directly above ActionBar (only when Confirm/Decline/Cancel available), and formatted History as one `secondary` line per entry (`"Pending · 26 Nov 2026, 15:21"`).
- [implemented] **D6 (Contradictions & links):** Never show `"Not run yet"` alongside a conflict count (`"Last checked {date}"`); tie-broke `"newer"` using `claim.recorded_at` only when entry dates match, disabling `Keep newer` with `"Same date. Edit an entry to resolve."` when timestamps are equal; rendered legend in `secondary` role; unified links to exact 2 accent styles (action no-underline and inline/citation underlined; zero grey underlined links).
- [implemented] **D7 (Token integrity & State Matrix):** Root-caused `cd6a3d1` dark before-sheets (hard-coded `<html data-theme="light">` + end-of-body theme script + 80–160ms CSS color transitions mid-interpolation). Omitted forced `data-theme="light"`, added synchronous `<head>` theme script before stylesheets, added `html[data-theme-switching] * { transition: none !important; }`, added `#gallery-state-matrix` (`apps/web/src/primitives/foundations-gallery-states.ts`) covering `Button`, `Link`, `Choice`, `Field`, `Tab`, `Item`, and moved pointer off-page + blurred focus before non-state contact sheets.
- [implemented] **D8 (Design audit protocol):** Authored `docs/design/audit-protocol.md` (`L062`), created `scripts/design-audit` (`pnpm design:audit`), wired it into `scripts/wp16n-verify` (`S5-DESIGN-AUDIT`), and added `tests/e2e/wp17-13-design-audit.spec.ts` (`K14`–`K21`).

### Component statement (required when touching UI; D-J)

- [implemented] `FormSection`, `Subsection`, `ActionBar` (`.lp-action-bar-group`), `List` (`variant="definition"`), `Item`, `Text` (`data-purpose`), `Field`, `PageHeader`, `SectionHeader`, `Credential`, `StatusLabel`, `Notice`, `StatusLine`, `EmptyState`: all registered in `docs/design/components.json` (zero new `data-c` components added; admin system mode preserved).

## 2. CI Evidence

- `pnpm design:audit`: PASSED (0 violations across L0–L6; L0=42, L3=1, L5=1, L6=112).
- `pnpm ds:health --check`: PASSED (Public CSS 4129 B gzip, Fonts 73284 B, Admin CSS 20856 B gzip, Editor JS 139207 B gzip).
- `pnpm wp16n:verify`: PASSED (11/11 DoD checks green, including `S5-DESIGN-AUDIT`).
- `pnpm verify:fast`: PASSED (8/8 checks green; 13/13 web unit test files, 104/104 tests).
- `tests/e2e/wp17-13-design-audit.spec.ts` (`K14`–`K21`): **8/8 PASSED** on PR head; **8/8 FAILED** on detached `e29cc38` canary worktree.
- Regression E2E suites: `wp17-12-hierarchy-workflow-census.spec.ts` (8/8), `wp17-11-feedback-credential-item.spec.ts` (5/5), `wp17-9-self-test-journeys.spec.ts` (8/8), `wp17-9-content-and-ink-census.spec.ts` (6/6 across 132 route×viewport×theme combinations, 1,854 text nodes, 0 violations), `auth.spec.ts` (19/19).
- Contact sheet archive: `~/Desktop/wp17-13-contact-sheets.zip` (92 PNGs incl. 9 `e29cc38` before-sheets + `INDEX.md`, 7.0 MB).

## 3. Tests Added and Count Change

- Added `tests/e2e/wp17-13-design-audit.spec.ts` (+8 independent E2E tests covering `K14`–`K21`).
- Added `scripts/design-audit` (`pnpm design:audit`) wired into `scripts/wp16n-verify`.

## 4. Files Touched

- `.changeset/wp17-13-spacing-purposes-audit.md`
- `apps/web/src/components/containers.ts`
- `apps/web/src/components/feedback.ts`
- `apps/web/src/layouts/admin-shell.ts`
- `apps/web/src/pages/admin/audit.ts`
- `apps/web/src/pages/admin/bookings.ts`
- `apps/web/src/pages/admin/calibration.ts`
- `apps/web/src/pages/admin/entries/editor-sections.ts`
- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/pages/admin/fixture.ts`
- `apps/web/src/pages/admin/gallery.ts`
- `apps/web/src/pages/admin/settings.ts`
- `apps/web/src/pages/admin/structure.ts`
- `apps/web/src/primitives/chip.ts`
- `apps/web/src/primitives/dcomp.test.ts`
- `apps/web/src/primitives/field.ts`
- `apps/web/src/primitives/form-section.ts`
- `apps/web/src/primitives/foundations-gallery-states.ts`
- `apps/web/src/primitives/foundations-gallery.ts`
- `apps/web/src/primitives/item.ts`
- `apps/web/src/primitives/page-header.ts`
- `apps/web/src/primitives/section-header.ts`
- `apps/web/src/primitives/text.ts`
- `apps/web/src/settings/modules/account-script.ts`
- `apps/web/src/settings/modules/account.ts`
- `apps/web/src/settings/modules/answering.ts`
- `apps/web/src/settings/modules/appearance.ts`
- `apps/web/src/settings/modules/backups.ts`
- `apps/web/src/settings/modules/visibility.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/design/README.md`
- `docs/design/audit-protocol.md`
- `docs/design/content.md`
- `docs/design/health-history.json`
- `docs/design/health.md`
- `docs/design/tokens-admin.md`
- `docs/design/tokens.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A183-wp-1712-hierarchy-and-workflow-pass.md`
- `docs/plans/backlog.yml`
- `package.json`
- `packages/core/src/algorithms/topology.ts`
- `packages/core/src/types/index.ts`
- `packages/design-tokens/packs/admin.json`
- `packages/design-tokens/src/generated.ts`
- `packages/design-tokens/src/tokens.css`
- `packages/design-tokens/tokens.json`
- `packages/ui-admin/src/base/reset-and-typography.css`
- `packages/ui-admin/src/components/choice/choice.css`
- `packages/ui-admin/src/components/credential/credential.css`
- `packages/ui-admin/src/components/feedback/feedback.css`
- `packages/ui-admin/src/components/item/item.css`
- `packages/ui-admin/src/primitives/field/field.css`
- `packages/ui-admin/src/routes/editor-c3.css`
- `packages/ui-admin/src/routes/editor-dfinal.css`
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
- `scripts/design-audit`
- `scripts/wp16n-verify`
- `tests/e2e/wp17-12-hierarchy-workflow-census.spec.ts`
- `tests/e2e/wp17-13-design-audit.spec.ts`
- `tests/e2e/wp17-contact-sheets.spec.ts`

## 5. Register and Backlog Changes

- Added `WP-17.13` in `docs/plans/backlog.yml` before `WP-18.3` (`gate: L-review`, `WP-18.3` depends on `WP-17.13`, `status: done`). Did NOT start `WP-18` / `WP-18.3`.
- Registered `docs/design/audit-protocol.md` (`L062`) and `A184` in `docs/doc-registry.json` and `docs/INDEX.md`.

## 6. Not Done (Tagged)

None.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A184
=== Validating Receipt A184-wp-1713-spacing-purposes-audit.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'b5bbfc94ce5db5a495894f62a127cea5787f53d9' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 4a78c71f6db9ce98962be6c0d1af412503e66b71..b5bbfc94ce5db5a495894f62a127cea5787f53d9 (71 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A184-wp-1713-spacing-purposes-audit.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A184-wp-1713-spacing-purposes-audit.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 168; WP-17 exit gate awaiting L-review
- Clean-boundary preconditions: met
- Next action: await L-review of `~/Desktop/wp17-13-contact-sheets.zip` before starting `WP-18.3`.
