# A183 — WP-17.12 hierarchy and workflow pass

| Field | Value |
| --- | --- |
| Report ID | A183 |
| Date | 2026-11-26 |
| Author | A (Implementer) |
| Task ID | `WP-17.12` |
| Evidence SHA | `53905f177c28f4ccc80c1027f1bf1d8deeb6f0bd` |
| CI run | pending PR #281 CI |

---

## 1. Scope

- [implemented] **A1 (Credential):** Updated `Credential` (`packages/ui-admin/src/components/credential/credential.css`, `apps/web/src/components/credential.ts`) to 1 column at compact (<480px) / 2 columns at regular with `white-space: nowrap` (zero mid-code wraps at 320/1280/1920), moved Copy / Copy all inside `.lp-credential-surface` footer with S3 internal/notice gaps and S4 to next content, and removed the warning Notice from TOTP manual key in favour of helper `"Enter this key if you can't scan the code."` directly under the QR code.
- [implemented] **A2 (State panel anatomy):** Normalised Contradictions state panel (`apps/web/src/pages/admin/audit.ts`) to fixed 5-part order (status headline -> `Last checked` meta -> ActionBar -> error Notice / `Resolved` StatusLine -> results) with pixel-identical ActionBar top across all 6 states (`idle`, `running`, `clean`, `found`, `error`, `resolved`).
- [implemented] **A3 (Contradiction item):** Added 12-word panel intro, topic / `"Possible contradiction"` title + `"{N}% likely conflict"` trailing value (no status), two claim blocks side-by-side at >=640px / stacked with `"vs"` divider below, `Older · {date}` / `Newer · {date}` / `Same date` eyebrows from entry published/updated date, `From {Entry title}` edit links, and `StatusLine` `"Resolved"` confirmation. Documented API limitation (no `keep_older` direction).
- [implemented] **A4 (Bookings list + detail):** Rebuilt `/admin/bookings` list (topic + status + chevron to detail, row 2 date+timezone strong slot, row 3 requester name, row 4 `Received {date}`, email moved to detail) and added new `/admin/bookings/:id` detail route with all 6 Book form fields, `mailto:` link, status history, Confirm/Decline/Cancel + `"Email requester"` (`Re: {topic}`), and honest visitor-behaviour helper.
- [implemented] **A5 & A6 (Item fixes & text roles):** Trailing chevron stays on row 1 when status is omitted; added `titleVariant: "content"` (unclamped) for Inbox questions, Answer Rules, and Contradictions; Active tokens hide status and show Created/Last-used dates; documented label-free value text roles in `docs/design/content.md` and amended `R-024-5`.
- [implemented] **B1–B5 (Rhythm, type, mobile inputs):** Measured `cd6a3d1` baseline (31/31 mobile inputs <16px, 18 type combos, spacing spread), published `docs/design/rhythm-type.md`, normalised spacing to S1–S5 (4/8/16/24/40) and 8 closed type roles (`24/700`, `18/600`, `16/500`, `14/500 text-2`, `14/400 text-1`, `12/500 text-2`, `12/400 text-3`, `12/400 mono`) in `packs/admin.json` & `dfinal-system.css`, raised compact inputs to 16px, and added Type Specimen to `/admin/_gallery`.
- [implemented] **Part C (Screen brief gate & C2 sweep):** Authored `docs/design/screen-brief.md` with retroactive briefs for WP-17.9–17.12, added Screen Brief section to `.github/pull_request_template.md`, added decision-completeness assertions to `J4`/`J8`, and fixed 12 first-day owner sweep issues (including Entries human profile labels + Updated dates and Inbox detail spacing classes).

### Component statement (required when touching UI; D-J)

- [implemented] Credential (`#account-recovery-output`, `#account-token-created`, `#account-totp-manual-cred`): `data-c="Credential"`, variants `single` and `list` (registered in `docs/design/components.json`)
- [implemented] List & detail items (Contradictions, Bookings list/detail, Inbox, Audit rules, Entries, Active tokens): `data-c="Item"`, Item v2 + `titleVariant="content"` + row-1 trailing chevron when status omitted (registered in `docs/design/components.json`)
- [implemented] Booking detail navigation: `data-c="BackLink"`, `data-c="FormSection"`, `data-c="ActionBar"`, `data-c="StatusLabel"`, `data-c="StatusLine"` (registered in `docs/design/components.json`)

## 2. CI Evidence

- `pnpm ds:health --check`: PASSED (Public CSS 4129 B gzip, Fonts 73284 B, Admin CSS 20502 B gzip, Editor JS 139207 B gzip).
- `pnpm wp16n:verify`: PASSED (10/10 DoD checks green).
- `pnpm verify:fast`: PASSED in 11.4s (47/47 API conformance files, 381/381 tests; 13/13 web files, 104/104 tests).
- `tests/e2e/wp17-12-hierarchy-workflow-census.spec.ts` (K6–K13): 8/8 PASSED on PR head; **8/8 FAILED** on detached `cd6a3d1` canary worktree.
- `tests/e2e/wp17-9-content-and-ink-census.spec.ts` (6/6), `wp17-9-self-test-journeys.spec.ts` (8/8), `wp16-c/g/h/s` (0 violations across 306 D-G captures).
- Contact sheet archive: `~/Desktop/wp17-12-contact-sheets.zip` (89 PNGs + `INDEX.md`, 6.6 MB).

## 3. Tests Added and Count Change

- Added `tests/e2e/wp17-12-hierarchy-workflow-census.spec.ts` (+8 independent E2E tests covering K6–K13).
- Extended `tests/e2e/wp17-9-self-test-journeys.spec.ts` with Part C decision-completeness assertions for Contradictions resolve, Bookings confirm, and Inbox reply.

## 4. Files Touched

- `.changeset/wp17-12-hierarchy-workflow.md`
- `.github/pull_request_template.md`
- `apps/api/src/adapter/bundled-web.ts`
- `apps/api/src/routes/audit.ts`
- `apps/api/src/routes/book.ts`
- `apps/web/src/components/credential.ts`
- `apps/web/src/pages/admin/audit.ts`
- `apps/web/src/pages/admin/bookings.ts`
- `apps/web/src/pages/admin/entries/list.ts`
- `apps/web/src/pages/admin/gallery.ts`
- `apps/web/src/pages/admin/inbox.ts`
- `apps/web/src/primitives/form-section.ts`
- `apps/web/src/primitives/foundations-gallery.ts`
- `apps/web/src/primitives/item.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/settings/modules/account-script.ts`
- `apps/web/src/settings/modules/account.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/adr/ADR-024-content-standard.md`
- `docs/design/README.md`
- `docs/design/content.md`
- `docs/design/health-history.json`
- `docs/design/health.md`
- `docs/design/rhythm-type.md`
- `docs/design/rules.md`
- `docs/design/screen-brief.md`
- `docs/design/tokens-admin.md`
- `docs/design/tokens.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A182-wp-1711-feedback-model-credential-item-accent.md`
- `docs/plans/backlog.yml`
- `docs/plans/wp17-progress.md`
- `packages/core/src/algorithms/topology.ts`
- `packages/core/src/types/index.ts`
- `packages/design-tokens/packs/admin.json`
- `packages/design-tokens/src/generated.ts`
- `packages/design-tokens/src/tokens.css`
- `packages/design-tokens/tokens.json`
- `packages/ui-admin/src/components/credential/credential.css`
- `packages/ui-admin/src/components/item/item.css`
- `packages/ui-admin/src/templates/dfinal-system.css`
- `tests/e2e/wp16-c-component-census.spec.ts`
- `tests/e2e/wp17-12-hierarchy-workflow-census.spec.ts`
- `tests/e2e/wp17-9-content-and-ink-census.spec.ts`
- `tests/e2e/wp17-9-self-test-journeys.spec.ts`
- `tests/e2e/wp17-contact-sheets.spec.ts`

## 5. Register and Backlog Changes

- Added `WP-17.12` in `docs/plans/backlog.yml` before `WP-18.3` (`gate: L-review`, `WP-18.3` depends on `WP-17.12`). Did NOT start `WP-18` / `WP-18.3`.
- Registered `docs/design/rhythm-type.md` (`L060`), `docs/design/screen-brief.md` (`L061`), and `A183` in `docs/doc-registry.json` and `docs/INDEX.md`.

## 6. Not Done (Tagged)

None.

## 7. Changes to Earlier Reports

- Amended `R-024-5` in `docs/adr/ADR-024-content-standard.md` / `docs/design/rules.md` for A5 (trailing chevron stays on row 1 when status is omitted; `content` title variant unclamped; Active tokens single-status).

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A183
=== Validating Receipt A183-wp-1712-hierarchy-and-workflow-pass.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '53905f177c28f4ccc80c1027f1bf1d8deeb6f0bd' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 1d1979e573c74067a47d7230b5477e39cc1b8481..53905f177c28f4ccc80c1027f1bf1d8deeb6f0bd (47 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A183-wp-1712-hierarchy-and-workflow-pass.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A183-wp-1712-hierarchy-and-workflow-pass.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 167; WP-17 exit gate awaiting L-review
- Clean-boundary preconditions: met
- Next action: await L-review of `~/Desktop/wp17-12-contact-sheets.zip` before starting `WP-18.3`.
