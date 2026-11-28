# A196 — WP-18.10 Corrective Slice

| Field | Value |
| --- | --- |
| Report ID | A196 |
| Date | 2026-11-28 |
| Author | A (Implementer) |
| Task ID | `WP-18.10` |
| Evidence SHA | `db9e91f8ee9807c7749f93adedb5a8ea9d074769` |
| CI run | Pending PR creation (local `verify:fast`, `design:audit`, `--self-test`, `wp16n:verify` 11/11, `K22`–`K27`, `K36`–`K43`, `K44`–`K54` green) |

---

## 1. Scope

Delivered `WP-18.10` — WP-18 corrective slice (zero new screens, zero new `data-c` components; variants only; closed decisions `V9`–`V16`, checks `K44`–`K54`):
- `[implemented]` **V9 (WP-18 reopened; WP-18.10 only):** Added `WP-18.10` in `docs/plans/backlog.yml` (`depends_on: [WP-18.9]`, `gate: L-review`), gated `WP-19.0` on `WP-18.10`.
- `[implemented]` **V10 (Import review):** Replaced hand-built `.triage-card` / `.lp-item-main` / `.lp-item-head` markup in `apps/web/src/pages/admin/import-script.ts` with `lpRenderItem` (`ITEM_CLIENT_SCRIPT` exported from `apps/web/src/primitives/item.ts`, `variant: 'review'`); stripped Markdown from excerpts with 2-line clamp (`.lp-item-body-clamp-2`, `--lp-line-clamp-2`); styled `Include` (`lp-btn-secondary`) and `Leave out` (`lp-btn-text`) auto-width at every viewport inside `.lp-action-bar-item` at `S3` (`--lp-space-stack-item-body-to-actionbar`); styled current item with a `2px` (`--lp-border-focus`) leading accent bar (`--accent`), `radius 0` (`--lp-radius-none`), positioned at `left: calc(-1 * var(--lp-space-inset-item-x))` in the hover-bleed zone with no ring; removed `Previous item` / `Next item` buttons while preserving `J`/`K` shortcuts; kept `"Include all high-confidence"` as an auto-width section action; restricted `.triage-keys-legend` to regular width (`__LP_BP_REGULAR__`) as one secondary line (`--text-2`).
- `[implemented]` **V11 (Storage rows):** Replaced hand-built `.lp-item-*` rows in `apps/web/src/settings/modules/storage.ts` with `lpRenderItem`; added `In use` and `Unused` to ADR-024 (`R-024-6`), `docs/design/content.md`, `apps/web/src/primitives/chip.ts`, and `tests/e2e/wp17-9-content-and-ink-census.spec.ts`; formatted meta as `"size · date"` via `ADMIN_DATETIME_FORMATTER_SCRIPT` (`@living-portfolio/ui-core`); replaced repeated per-row consequence text with one section helper (`#storage-media-helper`); styled `Delete` and `"Remove N unused files"` as danger-text (`lp-btn-text-danger`, `data-destructive="true"`) with ADR-025 confirmation dialogs (`renderDialog`), `"Remove N unused files"` `S4` (`24px`) below the list; also aligned `Revoke` (`account-script.ts`), `Discard` (`audit.ts`, `editor-sections.ts`) to danger-text.
- `[implemented]` **V12 (Dialog):** Top-anchored `.lp-modal-backdrop` (`align-items: flex-start; padding-top: var(--lp-space-proximity-5)`) and `.lp-overlay-dialog .lp-overlay-surface` (`top: var(--lp-space-proximity-5); transform: translateX(-50%)`) with zero vertical centring; strengthened `Choice` selected border (`--accent`) + tint (`--lp-color-fill-accent-tint-1`); updated alt placeholder to `"Describe the image"`; captured dialog sheets viewport-sized (`fullPage: false`) with full scrim, focus on `body`, and pointer off-page (`-100, -100`).
- `[implemented]` **V13 (Content):** Added `pluralize` and `ADMIN_PLURAL_HELPER_SCRIPT` in `packages/ui-core/src/format/plural.ts` (exported at `@living-portfolio/ui-core` and `@living-portfolio/ui-core/plural`); updated Import Done summary to `"Imported 1 entry as a private draft."` and link to `"Back to Today"`; fixed stray trailing quote after Evidence URLs in `apps/worker/src/worker.ts` (`urlRegex = /https?:\/\/[^\s)"'<>]+/g`) and `apps/web/src/pages/public/entry.ts`.
- `[implemented]` **V14 (Public media & fixtures):** Merged `public-entry-image`/`-video`/`-columns` into `public-entry-media` (one DOM marker each) and separated consent-gated embed onto `wp18-4-embed-showcase`; added real synthetic fixtures:
  - `[implemented]` `tests/e2e/fixtures/synthetic-diagram.png` (5,695 bytes <= 20 KB, 640x360 architecture diagram)
  - `[implemented]` `tests/e2e/fixtures/synthetic-clip.mp4` (5,553 bytes <= 100 KB, 320x180 H.264 playable 1s clip)
  Recorded deferred video `.vtt` captions as a WP-20 exit blocker in `WP-20.3` and recorded the WP-19 intake items in `WP-19.0`.
- `[implemented]` **V15 & V16 (Manifest states & idempotent seeding):** Added 7 new manifest states (`storage-delete-confirm`, `storage-error-in-use`, `today-storage-warning`, `quick-log-saved`, `quick-log-error`, `import-file-errors`, `editor-columns-inserted`) each with DOM markers and sheets; made `seedManifestFixtures` idempotent so every capture of a state produces identical content across all 4 viewports/themes.

### Component statement (required when touching UI; D-J)

- `[implemented]` `Item` (`.lp-item`, `.lp-item-review.is-selected::before`, `.lp-item-body-clamp-2`, `ITEM_CLIENT_SCRIPT`): `data-c="Item"`, variants `plain`, `interactive`, `review` (registered in `docs/design/components.json`)
- `[implemented]` `ActionBar` (`.lp-action-bar-item`, `.lp-action-bar-inline`, `.lp-action-bar-page`, `.lp-action-bar-dialog`): `data-c="ActionBar"`, levels `page`, `dialog`, `item` (registered in `docs/design/components.json`)
- `[implemented]` `Button` (`.lp-btn-text-danger`, `data-destructive="true"`): `data-c="Button"`, variant `text-danger` (registered in `docs/design/components.json`)
- `[implemented]` `StatusLabel` (`In use`, `Unused`): `data-c="StatusLabel"`, tones `ok`, `neutral` (registered in `docs/design/components.json`)
- `[implemented]` `Overlay` / `Dialog` (`.lp-modal-backdrop`, `.lp-overlay-dialog`): `data-c="Overlay"`, variant `dialog` top-anchored (registered in `docs/design/components.json`)
- `[implemented]` `Choice` (`.lp-choice.is-selected`): `data-c="Choice"`, variant `button` (registered in `docs/design/components.json`)
- `[implemented]` `BackLink` (`label: 'Back to Today'`): `data-c="BackLink"` (registered in `docs/design/components.json`)

## 2. CI Evidence

- `pnpm verify:fast` (local output): PASSED (8/8 checks; 21/21 `ui-core`, 2/2 `ui-admin`, 126/126 `web`, 15/15 `worker` unit tests)
- `pnpm design:audit` (local output): PASSED (0 violations across L0–L7, 51 manifest states, 0 hard-coded values in all 13 L7 categories)
- `node scripts/design-audit --self-test` (local output): PASSED (`missed: []`, all 13 L7 classes detected)
- `pnpm wp16n:verify` (local output): PASSED (11/11 DoD checks green)
- `pnpm docs:check` (local output): PASSED (286 documents validated)
- `tests/e2e/wp18-10-corrective-audit.spec.ts` (`K44`–`K54`, local output): 4/4 PASSED on HEAD (`0` violations); proven failing on `de379ba` worktree canary (`K44=2, K45=14, K46=5, K47=18, K48=24, K49=7, K50=3, K51=2, K52=6, K53=1, K54=10`)
- `tests/e2e/wp17-14-closed-world-audit.spec.ts` (`K22`–`K27`, local output): 5/5 PASSED (1,092 pairs measured, 0 unclassified, 0 drift, 50/50 states, 27/27 routes)
- `tests/e2e/wp17-16-alignment-actions-audit.spec.ts` (`K36`–`K43`, local output): 4/4 PASSED (`HA1=279, HA2=282, HA3=549, HA4=138, HA5=942`)
- Contact sheets: 223 sheets (1x manifest x 4 captures + 2x close-ups in both themes + `de379ba` before/after pairs + state matrix + `INDEX.md`) zipped to `~/Desktop/wp18-10-contact-sheets.zip`

## 3. Tests Added and Count Change

- Added `packages/ui-core/src/format/plural.test.ts` (+2 unit tests)
- Added `tests/e2e/wp18-10-corrective-audit.spec.ts` (+4 Playwright E2E test blocks covering `K44`–`K54`)
- Updated `tests/e2e/wp17-manifest.ts` (merged 3 duplicate public states into `public-entry-media`, added 7 new states, idempotent seeding with real PNG/MP4 fixtures)
- Updated `tests/e2e/structure-import.spec.ts`, `tests/e2e/wp18-6-import-polish.spec.ts`, `tests/e2e/wp18-9-storage.spec.ts`, `apps/web/src/web.test.ts` for `V10`, `V11`, `V13`

## 4. Files Touched

- `apps/web/src/client/admin/import-page.ts`
- `apps/web/src/pages/admin/audit.ts`
- `apps/web/src/pages/admin/dashboard.ts`
- `apps/web/src/pages/admin/entries/editor-media-dialog.ts`
- `apps/web/src/pages/admin/entries/editor-sections.ts`
- `apps/web/src/pages/admin/entries/list-script.ts`
- `apps/web/src/pages/admin/import-script.ts`
- `apps/web/src/pages/admin/import.ts`
- `apps/web/src/pages/admin/quick-log.ts`
- `apps/web/src/pages/public/entry.ts`
- `apps/web/src/primitives/action-bar.ts`
- `apps/web/src/primitives/back-link.ts`
- `apps/web/src/primitives/chip.ts`
- `apps/web/src/primitives/index.ts`
- `apps/web/src/primitives/item.ts`
- `apps/web/src/settings/modules/account-script.ts`
- `apps/web/src/settings/modules/storage.ts`
- `apps/web/src/web.test.ts`
- `apps/worker/src/worker.ts`
- `docs/adr/ADR-024-content-standard.md`
- `docs/design/content.md`
- `docs/design/health-history.json`
- `docs/design/health.md`
- `docs/design/rules.md`
- `docs/execution-reports/A195-wp-189-settings-storage-module.md`
- `docs/plans/backlog.yml`
- `packages/ui-admin/src/components/choice/choice.css`
- `packages/ui-admin/src/components/feedback/feedback.css`
- `packages/ui-admin/src/components/item/item.css`
- `packages/ui-admin/src/components/overlay/overlay.css`
- `packages/ui-admin/src/routes/gallery-samples.css`
- `packages/ui-admin/src/shell/admin-shell-legacy.css`
- `packages/ui-core/package.json`
- `packages/ui-core/src/format/plural.test.ts`
- `packages/ui-core/src/format/plural.ts`
- `packages/ui-core/src/index.ts`
- `tests/e2e/fixtures/synthetic-clip.mp4`
- `tests/e2e/fixtures/synthetic-diagram.png`
- `tests/e2e/structure-import.spec.ts`
- `tests/e2e/wp17-9-content-and-ink-census.spec.ts`
- `tests/e2e/wp17-contact-sheets.spec.ts`
- `tests/e2e/wp17-manifest.ts`
- `tests/e2e/wp18-10-corrective-audit.spec.ts`
- `tests/e2e/wp18-6-import-polish.spec.ts`
- `tests/e2e/wp18-9-storage.spec.ts`

## 5. Register and Backlog Changes

- Added `WP-18.10` (`gate: L-review`, `status: done`) in `docs/plans/backlog.yml` after `WP-18.9` and added `WP-18.10` to `WP-19.0` `depends_on`.
- Added WP-19 intake defects (meta line +8px stray left edge, heading->input gap ~2px, public HA coverage) to `WP-19.0` acceptance.
- Recorded deferred video `.vtt` captions track as a WP-20 exit blocker in `WP-20.3` acceptance.
- Added `Media Asset` (`In use`, `Unused`) to ADR-024 `R-024-6`, `docs/design/content.md`, and regenerated `docs/design/rules.md` and `docs/design/health.md`.

## 6. Not Done (Tagged)

None. All `WP-18.10` closed decisions (`V9`–`V16`) and checks (`K44`–`K54`) are complete and verified. `WP-19.0` has not been started.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A196
=== Validating Receipt A196-wp-1810-corrective-slice.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'db9e91f8ee9807c7749f93adedb5a8ea9d074769' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 5222f5b57b2b903a1f3c4bc87ec9816523f63117..db9e91f8ee9807c7749f93adedb5a8ea9d074769 (45 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A196-wp-1810-corrective-slice.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A196-wp-1810-corrective-slice.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 180 (A196); work packages since: 1 (WP-18.10)
- Clean-boundary preconditions: met
- Next action: STOP after PR merge and delivery of `~/Desktop/wp18-10-contact-sheets.zip`; await L-review of `WP-18.10` before starting `WP-19.0`.
