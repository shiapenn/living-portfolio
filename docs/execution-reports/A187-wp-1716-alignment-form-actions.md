# A187 — wp-1716-alignment-form-actions

| Field | Value |
| --- | --- |
| Report ID | A187 |
| Date | 2026-11-27 |
| Author | A (Implementer) |
| Task ID | `WP-17.16` |
| Evidence SHA | `2689c1c44b7d09ab161be03a0dc86d555275bca5` |
| CI run | Pending PR creation (local `verify:fast`, `design:audit`, `--self-test`, `wp16n:verify` 11/11, `K22`–`K43` green) |

---

## 1. Scope

Delivered `WP-17.16` — Alignment and form-action standardisation (WP-17 visual exit gate, FINAL; closed decisions `H1`–`H8`, checks `K36`–`K43`):
- `[implemented]` **H1 (Header alignment):** Removed `align-items: center` from `.lp-page-header` in `packages/ui-admin/src/shell/workspace-shell.css:332`; set `align-items: stretch` on `.lp-page-header-dcomp` and `width: 100%; min-width: 0; align-self: stretch; text-align: start;` on `.lp-page-header-main` in `packages/ui-admin/src/components/page-header/page-header.css`.
- `[implemented]` **H2 (Bookings trailing cluster alignment):** Restricted `.lp-item:not(.lp-item-has-actions)` regular-width grid rule in `packages/ui-admin/src/components/item/item.css` to `:not(:has(> .lp-item-content))` and added `margin-inline-start: auto` on `.lp-item-status`, eliminating the `16px` (`S3`) empty second column shift on `Declined` rows.
- `[implemented]` **H3 (Item content-edge alignment & outward hover bleed):** Set horizontal padding to `0` on `.lp-item` across `item.css`, `dsys-foundations.css`, and `dghl-polish.css` so text and `::after` hairlines align flush with the content edge; rendered hover/pressed/selected fill on `.lp-item::before` with `inset: 0 calc(-1 * var(--lp-space-inset-item-x))` and `border-radius: var(--lp-radius-container)`.
- `[implemented]` **H4 (Page-level ActionBar standardisation):** Removed the regular-width auto-width override on `.lp-action-bar-page` in `packages/ui-admin/src/routes/gallery-samples.css` so page-level form buttons stack vertically at full container width with `S2` gap at every viewport; updated `docs/design/archetypes.md` and `docs/design/interaction.md`.
- `[implemented]` **H5 (Pager redesign & multi-page manifest):** Hidden when `totalPages <= 1`; single-row layout at all widths with `44x44` secondary tonal icon buttons (`chevron-left`/`chevron-right` `20px`, `aria-label="Previous page"` / `"Next page"`), tabular `text-2` summary (`Page X of Y · N total` at regular, `X / Y` at compact); wired `?page=` SSR in `apps/web/src/app.ts` and `apps/api/src/adapter/bundled-web.ts`; fixed `await res.json()` parsing in `apps/web/src/pages/admin/entries/list-script.ts`; added `entries-paged-first`, `entries-paged-middle`, `entries-paged-last` to `tests/e2e/wp17-manifest.ts` (25+ seeded entries).
- `[implemented]` **H6 (Credential & TOTP QR polish):** Moved Copy to a `44x44` secondary tonal icon-only button (`copy` `20px`, swaps to `check` for 2s + `aria-live="polite"` `"Copied"`, danger Notice on failure) trailing in `.lp-credential-header`; removed `.lp-credential-footer`; added borderless inner `.lp-credential-panel` (`surface-sunken`, `control` radius `8px`, padding `S3` `16px`); wrapped TOTP manual key 4-char groups in non-breaking spans; styled `#account-totp-qr` as a quiet-zone box (`16px` padding) flush on the content edge.
- `[implemented]` **H7 (Horizontal closed-world audit `HA1`–`HA5`, `K36`–`K40`):** Added generic manifest-wide horizontal alignment assertions across `320`/`1280`/`1920` in `tests/e2e/wp17-16-alignment-actions-audit.spec.ts`.
- `[implemented]` **H8 (L7 scanner self-test, `K43`):** Added `--self-test` mode to `scripts/design-audit` planting one literal per L7 property class in a temporary fixture and verifying all 13 categories report `count > 0`.

### Component statement (required when touching UI; D-J)

- `[implemented]` `PageHeader` (`.lp-page-header`, `.lp-page-header-main`): `data-c="PageHeader"`, variant `default` (registered in `docs/design/components.json`)
- `[implemented]` `Item` (`.lp-item`, `.lp-item::before`, `.lp-item-status`): `data-c="Item"`, variant `interactive` / `plain` (registered in `docs/design/components.json`)
- `[implemented]` `ActionBar` (`.lp-action-bar-page`): `data-c="ActionBar"`, variant `page` (registered in `docs/design/components.json`)
- `[implemented]` `Button` (`.lp-btn.lp-btn-secondary.lp-btn-icon`): `data-c="Button"`, variant `secondary` icon-only `44x44` (registered in `docs/design/components.json`)
- `[implemented]` `Credential` (`.lp-credential`, `.lp-credential-surface`, `.lp-credential-header`, `.lp-credential-panel`): `data-c="Credential"`, variant `single` / `list` (registered in `docs/design/components.json`)
- `[implemented]` `Entries Pagination` (`.lp-entries-pagination`): registered `lp-entries` class family with `Button` + `Text` primitives (no new component introduced)

## 2. CI Evidence

- `pnpm verify:fast`: PASSED (8/8 checks, 381/381 unit tests across `api`, `web`, `ui-admin`)
- `pnpm design:audit`: PASSED (0 violations across L0–L7, 28 manifest states)
- `node scripts/design-audit --self-test`: PASSED (all 13 L7 categories detected, `missed: []`)
- `pnpm wp16n:verify`: PASSED (11/11 DoD checks green)
- `tests/e2e/wp17-16-alignment-actions-audit.spec.ts` (`K36`–`K43`): 4/4 PASSED (0 violations; proven failing on `48ffbee` with K36=40, K41=60, K42=30)
- `tests/e2e/wp17-14-closed-world-audit.spec.ts` (`K22`–`K27`): 6/6 PASSED (716 pairs measured, 0 unclassified, 0 drift)
- `tests/e2e/wp17-15-visual-system-audit.spec.ts` (`K28`–`K34`): 6/6 PASSED
- Contact sheets: 154 sheets (1x manifest + 2x close-ups + `48ffbee` before-sheets) zipped to `~/Desktop/wp17-16-contact-sheets.zip`

## 3. Tests Added and Count Change

- Added `tests/e2e/wp17-16-alignment-actions-audit.spec.ts` (+4 Playwright E2E test blocks covering `K36`–`K43`)
- Added 3 paged manifest states (`entries-paged-first`, `entries-paged-middle`, `entries-paged-last`) in `tests/e2e/wp17-manifest.ts` (25 -> 28 states)
- Updated `apps/web/src/pages/admin/entries/list.test.ts` for new `H5` summary separator (`·`)

## 4. Files Touched

- `apps/api/src/adapter/bundled-web.ts`
- `apps/web/src/app.ts`
- `apps/web/src/components/credential.ts`
- `apps/web/src/pages/admin/entries/list-script.ts`
- `apps/web/src/pages/admin/entries/list.test.ts`
- `apps/web/src/pages/admin/entries/list.ts`
- `apps/web/src/pages/admin/gallery.ts`
- `apps/web/src/strings/admin/entries-list.ts`
- `docs/design/archetypes.md`
- `docs/design/health-history.json`
- `docs/design/health.md`
- `docs/design/interaction.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A186-wp-1715-visual-system-pass.md`
- `docs/execution-reports/A187-wp-1716-alignment-form-actions.md`
- `docs/INDEX.md`
- `docs/plans/backlog.yml`
- `packages/ui-admin/src/components/credential/credential.css`
- `packages/ui-admin/src/components/item/item.css`
- `packages/ui-admin/src/components/page-header/page-header.css`
- `packages/ui-admin/src/patterns/dsys-foundations.css`
- `packages/ui-admin/src/primitives/controls/controls.css`
- `packages/ui-admin/src/routes/gallery-samples.css`
- `packages/ui-admin/src/shell/workspace-shell.css`
- `packages/ui-admin/src/templates/dghl-polish.css`
- `scripts/design-audit`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp16-s-system-census.spec.ts`
- `tests/e2e/wp17-12-hierarchy-workflow-census.spec.ts`
- `tests/e2e/wp17-14-closed-world-audit.spec.ts`
- `tests/e2e/wp17-16-alignment-actions-audit.spec.ts`
- `tests/e2e/wp17-9-content-and-ink-census.spec.ts`
- `tests/e2e/wp17-contact-sheets.spec.ts`
- `tests/e2e/wp17-manifest.ts`

## 5. Register and Backlog Changes

- Inserted `WP-17.16` in `docs/plans/backlog.yml` before `WP-18.3` (`depends_on: [WP-17.15]`, `status: done`) and updated `WP-18.3` `depends_on: [WP-17.16]`.

## 6. Not Done (Tagged)

None. All `WP-17.16` closed decisions (`H1`–`H8`) and checks (`K36`–`K43`) are complete and verified.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A187
=== Validating Receipt A187-wp-1716-alignment-form-actions.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '2689c1c44b7d09ab161be03a0dc86d555275bca5' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 712f760cc6b26367923ed867262b6edc9f21d6dc..2689c1c44b7d09ab161be03a0dc86d555275bca5 (34 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A187-wp-1716-alignment-form-actions.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A187-wp-1716-alignment-form-actions.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 171 (A187); work packages since: 1 (WP-17.16)
- Clean-boundary preconditions: met
- Next action: await L-review of `WP-17.16` contact sheets (`~/Desktop/wp17-16-contact-sheets.zip`) or proceed to API-only `WP-18.3` after merge.
