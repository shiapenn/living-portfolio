# A181 — WP-17.10 exit gate fixes

| Field | Value |
| --- | --- |
| Report ID | A181 |
| Date | 2026-11-25 |
| Author | A (Implementer) |
| Task ID | `WP-17.10` |
| Evidence SHA | `2841a14314ef694f3ce5b19cfe75769951a54e2b` |
| CI run | 45568331006 |

---

## 1. Scope

- [implemented] **A1 (Tab panel headings & clean status dedupe):** Removed the repeated `"Contradictions"` section heading on `/admin/audit?status=contradictions` and replaced the repeated tab-name heading on `/admin/pages` with `"Content"`. Removed duplicate `"No contradictions found."` status output on clean state. Added rule (`R-024-3`) in `docs/adr/ADR-024-content-standard.md` / `docs/design/rules.md` and enforced in `tests/e2e/wp17-9-content-and-ink-census.spec.ts`.
- [implemented] **A2 (Contradictions states & extended J4):** Populated `entry_a_id`/`entry_a_title`/`entry_b_id`/`entry_b_title` on `TopologyReport` in `packages/core`, captured all 6 Contradictions states (`idle`, `running`, `clean`, `found` with 2 seeded contradictions, `error`, `resolved`) with `data-contradictions-state` harness markers, and extended `J4` in `tests/e2e/wp17-9-self-test-journeys.spec.ts` to execute `found -> supersede -> dismiss -> error -> retry -> clean`.
- [implemented] **A3 (Account):** Rendered per-section live-region notices directly under each failing control with `scrollIntoView` + `focus()` (`aria-live="polite"`); constrained `#account-totp-qr svg` to `<= 192px` via `--lp-size-grid-card-min` (`180px`); fixed token status markup to `.lp-status-indicator` with `--lp-space-inline-icon-text` (`8px >= 4px` painted ink gap enforced across 1280/320); labelled optional fields `"New username (optional)"` and `"New password (optional)"`.
- [implemented] **A4 (Answering & floor rule):** Restored threshold helpers stating recommended value + directional effect (`0.82 / 0.55 / 0.90`, matching server shipped defaults); renamed button back to `"Restore recommended"`; triggered `#tier1-warning` on any drift from recommended values; strengthened `backups.ts` age-key consequence helper; added the information floor rule to `docs/design/content.md` and `R-024-1`.
- [implemented] **A5 (Appearance):** Removed the static green `"Preview reflects your selected tokens."` `Notice` from `#appearance-live-preview`; disabled `#btn-save-settings-module` when AA contrast fails alongside `#appearance-aa-error`; captured all 4 built-in packs, AA reject, import ok, import error, and public contrast table.
- [implemented] **A6 (Closed Status Vocabulary):** Defined closed entity status vocabularies in `docs/design/content.md` (`R-024-6`) and enforced in census: Booking (`Pending`, `Confirmed`, `Declined`, `Cancelled`), Token (`Active`, `Revoked`), Rule (`Pending`, `Active`, `Discarded`), and Page Revisions (newest `Current`, older rows no status). Updated `PATCH /api/book/:id` to accept `'cancelled'`.
- [implemented] **A7 (Reconciled static prose word metric):** Defined exact counted prose roles/selectors in `docs/design/content.md`, fixed census undercounting (`.lp-form-section-desc` + static `[data-c="Text"]`), and reconciled Answering node dump at `fa0cf03` (144 words) vs `HEAD` (33 words, 0 exemptions).
- [implemented] **A8 (Unified ui-core date/time formatter):** Added `formatAdminDate`, `formatAdminDateTime`, and `ADMIN_DATETIME_FORMATTER_SCRIPT` in `packages/ui-core/src/format/datetime.ts` with unit tests (`datetime.test.ts`); replaced ISO date strings in `audit.ts`, `pages.ts`, `inbox.ts`, and `entries/history.ts`; banned `/\b\d{4}-\d{2}-\d{2}\b/` in rendered admin text (`R-024-2`).
- [implemented] **A9 (Global Item change & wp16-c exemption):** Documented the `wp16-c` 320px stacking exemption keyed strictly to adjacent `lp-item-title` + `lp-item-status` in `R-024-5` (`docs/design/rules.md`), and captured `Entries` and `Inbox` before (`fa0cf03`) and after (`WP-17.10`) sheets at `1280` and `320` light.
- [implemented] **A10 (Dialog viewport sheets):** Captured Pause dialog sheets with `fullPage: false` (viewport capture) and verified vertical centring within `<= 4px` at `320px` in the census.

## 2. CI Evidence

- PR `#279` (`feat/wp-17-10-exit-gate-fixes`) — CI run `45568331006` (re-running on head after aligning legacy E2E specs).
- `pnpm wp16n:verify`: 10/10 DoD checks passed.
- `pnpm verify:fast`: passed in 8.2s (381/381 API conformance tests + core/web/ui-core/ui-admin green).
- `tests/e2e/wp17-9-content-and-ink-census.spec.ts`: 2/2 passed (0 violations); `317f257` detached worktree canary failed both tests (18 violations + duplicate clean status).
- `tests/e2e/wp17-9-self-test-journeys.spec.ts`: 8/8 passed (J1–J8 including extended J4 and Cancelled booking status).
- `tests/e2e/wp16-c-component-census.spec.ts`, `wp16-g-census.spec.ts`, `wp16-i-census.spec.ts`: 34/34 passed with 0 violations.
- Contact sheet archive: `~/Desktop/wp17-10-contact-sheets.zip` (77 files, 5.3 MB).

## 3. Tests Added and Count Change

- Added `packages/ui-core/src/format/datetime.test.ts` (+3 unit tests; `@living-portfolio/ui-core` now 19/19 tests).
- Added interactive exit-gate invariant test in `tests/e2e/wp17-9-content-and-ink-census.spec.ts` (+1 E2E test; 2/2 total) and new census checks for A1, A3 dot-to-label gap (`>= 4px`), A5, A6, A7, A8, A10.
- Extended `J4` and `J8` in `tests/e2e/wp17-9-self-test-journeys.spec.ts` (8/8).

## 4. Files Touched

- `.changeset/wp17-10-exit-gate.md`
- `apps/api/src/routes/book.ts`
- `apps/web/src/pages/admin/audit.ts`
- `apps/web/src/pages/admin/bookings.ts`
- `apps/web/src/pages/admin/entries/history.ts`
- `apps/web/src/pages/admin/inbox.ts`
- `apps/web/src/pages/admin/pages.ts`
- `apps/web/src/pages/admin/settings-script.ts`
- `apps/web/src/primitives/chip.ts`
- `apps/web/src/settings/modules/account-script.ts`
- `apps/web/src/settings/modules/account.ts`
- `apps/web/src/settings/modules/answering.ts`
- `apps/web/src/settings/modules/appearance-script.ts`
- `apps/web/src/settings/modules/appearance.ts`
- `apps/web/src/settings/modules/backups.ts`
- `docs/INDEX.md`
- `docs/adr/ADR-024-content-standard.md`
- `docs/design/content.md`
- `docs/design/health-history.json`
- `docs/design/health.md`
- `docs/design/rules.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A180-wp-179-polish-states-and-content-standard.md`
- `docs/plans/backlog.yml`
- `docs/plans/wp17-progress.md`
- `packages/core/src/algorithms/topology.ts`
- `packages/core/src/types/index.ts`
- `packages/ui-admin/CHANGELOG.md`
- `packages/ui-admin/src/primitives/controls/controls.css`
- `packages/ui-core/CHANGELOG.md`
- `packages/ui-core/src/format/datetime.test.ts`
- `packages/ui-core/src/format/datetime.ts`
- `packages/ui-core/src/index.ts`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp17-4-account.spec.ts`
- `tests/e2e/wp17-6-bookings-ventures.spec.ts`
- `tests/e2e/wp17-8-appearance-v2.spec.ts`
- `tests/e2e/wp17-9-content-and-ink-census.spec.ts`
- `tests/e2e/wp17-9-self-test-journeys.spec.ts`
- `tests/e2e/wp17-contact-sheets.spec.ts`
- `tests/e2e/wp5-admin-settings.spec.ts`

## 5. Register and Backlog Changes

- Inserted `WP-17.10` (`depends_on: [WP-17.9]`, `gate: L-review`, `status: done`) in `docs/plans/backlog.yml` before `WP-18.3`.
- Updated `WP-18.3` `depends_on: [WP-17.10]`. `WP-18.1` and `WP-18.2` remain `done`; `WP-18.3` not started.
- Updated `docs/adr/ADR-024-content-standard.md`, `docs/design/content.md`, `docs/design/rules.md` (35 effective rules across 11 areas), `docs/design/health.md`, `docs/plans/wp17-progress.md`.

## 6. Not Done (Tagged)

None. All A1–A10 exit-gate fixes and contact sheets are complete.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```text
=== Validating Receipt A181-wp-1710-exit-gate-fixes.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '2841a14314ef694f3ce5b19cfe75769951a54e2b' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 39bf0cb6f943af20173b23364e50240399d7db22..2841a14314ef694f3ce5b19cfe75769951a54e2b (41 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A181-wp-1710-exit-gate-fixes.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A181-wp-1710-exit-gate-fixes.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 6; work packages since: 2
- Clean-boundary preconditions: met
- Next action: merge PR #279 via `--merge` and present WP-17.10 L-review report and `~/Desktop/wp17-10-contact-sheets.zip`.
