# A180 — WP-17.9 polish states and content standard

| Field | Value |
| --- | --- |
| Report ID | A180 |
| Date | 2026-11-25 |
| Author | A (Implementer) |
| Task ID | `WP-17.9` |
| Evidence SHA | `39bf0cb6f943af20173b23364e50240399d7db22` |
| CI run | 45561042710 |

---

## 1. Scope

- [implemented] **Backlog & WP-18.1/18.2 confirmation**: Inserted `WP-17.9` (`gate: L-review`) into `docs/plans/backlog.yml` before `WP-18.3` (`WP-18.3` now depends on `WP-17.9`). Confirmed `WP-18.1` (Authoring canvas layout) and `WP-18.2` (Tiptap/ProseMirror editor engine with 100% Markdown round-trip) are both `status: done` (delivered in `WP-16.L L2`).
- [implemented] **ADR-024 & Content Standard**: Authored `docs/adr/ADR-024-content-standard.md` (recording the 2026-11-25 superseding owner decision retiring Explain blocks from audit report §6 rule 2), `docs/design/content.md`, and regenerated `docs/design/decisions.md` (24 ADRs), `docs/design/rules.md` (34 rules), `docs/design/health.md`, `docs/doc-registry.json`, and `docs/INDEX.md`. Rewrote all admin copy to obey per-role word caps, banned-pattern rules, and `<= 60` static prose words per default route (0 exemptions needed).
- [implemented] **F1–F6 & D1–D6 fixes**:
  - [implemented] **F1 Structure**: Mapped `RoleProfile.roles` objects to `r.label` and omitted `"Roles:"` when empty on Freeform (`apps/web/src/pages/admin/structure.ts`).
  - [implemented] **F2 & D2/D3 Audit & Contradictions**: Renamed `/admin/audit` title to `"Audit"` with all 4 tabs (`Pending`, `Active`, `Discarded`, `Contradictions`) in one tablist (note: audit report §6.2 originally proposed splitting rules to `/admin/rules` and conflicts to `/admin/health`; kept unified `/admin/audit` + `/admin/audit?status=contradictions` per D2). Implemented all 6 D3 Contradictions states (`idle`, `running`, `clean`, `found`, `error`, `resolved`) with `data-contradictions-state`, `aria-live="polite"`, and `aria-busy`, backed by `POST /api/audit/topology-conflicts/detect` and `POST /api/audit/topology-conflicts/:id/resolve` (last-checked timestamp recorded client-side on run; API does not persist a server-side last-checked timestamp yet).
  - [implemented] **F3 & D1/D6 Pages & Tabs**: Removed `Home statement` tab from `/admin/pages` (single source in Settings > Home per D6); Pages now has 3 short tabs (`About`, `Now`, `Uses`). Updated `.lp-tabs` / `.lp-tab` for horizontal scroll-snap, edge fade, `>= 44px` (`--lp-size-hit-area`) targets, active scroll-into-view, and URL fallback to first tab.
  - [implemented] **F5 & D4 EmptyState**: Removed raised surface and padding indent from `.lp-empty-state` (`background: transparent; padding: 0; border-radius: 0`), made `EmptyStateProps.title` optional for concise 1-sentence `<= 12`-word empty states, and replaced bare `"No X yet"` lines across Calibration, Backups, Pages, Bookings, Ventures, Audit, and Account.
  - [implemented] **F6 & D5 Item anatomy**: Unified `.lp-item` and `.lp-item-content` grid (`1fr auto`) across `1280px` and `320px` so status (dot + label + chevron) stays on row 1 at both widths, fixed Account token status dot + full-width alignment in `account-script.ts` and `overlay-mobile.css`.
- [implemented] **F7 Appearance v2**: Replaced dual-hex override with single accent seed (`#setting-theme-accent-seed`) deriving light/dark OKLCH ramps (`deriveAccentPairFromSeed`), replaced text-only preview with real composed preview (`Choice`, `Notice`, `Text`, `ActionBar` + `Button` variants styled via `/assets/css/theme-preview.css`), added WCAG contrast pair `Table` for public scope, and added `#appearance-aa-error` `Notice` naming failing pair(s) and exact ratio(s).
- [implemented] **F8 Painted-ink census, canaries, J1–J8 journeys & contact sheets**: Added `tests/e2e/wp17-9-content-and-ink-census.spec.ts` (proven failing on `main` HEAD `fa0cf03` worktree, passing with 0 violations on PR head), `tests/e2e/wp17-9-self-test-journeys.spec.ts` (`J1–J8`), and deterministic contact sheets (`~/Desktop/wp17-9-contact-sheets.zip`).

### Component statement (required when touching UI; D-J)
- [implemented] Zero new `data-c` components added (registry remains at 21). Appearance live preview uses registered `Choice`, `Notice`, `Text`, `ActionBar`, and `Button` (`secondary` + `text`); public contrast display uses registered `Table`. Changeset recorded in `.changeset/wp17-9-polish-contracts.md`.

## 2. CI Evidence

- PR #278 code commit `39bf0cb6f943af20173b23364e50240399d7db22`:
  - `CI & Audit Conformance Gate` run `45561042710`: `success` (Typecheck/Unit/Audit + Build + Playwright Shards 1..4 all green).
  - `CodeQL Static Analysis` run `45561042692`: `success`.
  - `Secret Scan (gitleaks)` run `45561042886`: `success`.

## 3. Tests Added and Count Change

- [implemented] Added `tests/e2e/wp17-9-content-and-ink-census.spec.ts` (1 comprehensive painted-ink & ADR-024 content census across 80 route/viewport/theme combinations).
- [implemented] Added `tests/e2e/wp17-9-self-test-journeys.spec.ts` (8 scripted first-day-owner journeys `J1–J8`).
- [implemented] Upgraded `tests/e2e/wp17-contact-sheets.spec.ts` with deterministic fixtures, harness marker strips, and `INDEX.md` assertion map.

## 4. Files Touched

- `.changeset/wp17-9-polish-contracts.md`
- `apps/api/src/routes/settings-wp17.ts`
- `apps/web/src/app.ts`
- `apps/web/src/components/containers.ts`
- `apps/web/src/layouts/admin-shell.ts`
- `apps/web/src/pages/admin/audit.ts`
- `apps/web/src/pages/admin/bookings.ts`
- `apps/web/src/pages/admin/calibration.ts`
- `apps/web/src/pages/admin/pages.ts`
- `apps/web/src/pages/admin/settings-script.ts`
- `apps/web/src/pages/admin/settings.ts`
- `apps/web/src/pages/admin/structure.ts`
- `apps/web/src/pages/admin/ventures.ts`
- `apps/web/src/settings/modules/account-script.ts`
- `apps/web/src/settings/modules/account.ts`
- `apps/web/src/settings/modules/answering.ts`
- `apps/web/src/settings/modules/appearance-script.ts`
- `apps/web/src/settings/modules/appearance.ts`
- `apps/web/src/settings/modules/backups.ts`
- `apps/web/src/settings/modules/home.ts`
- `apps/web/src/settings/modules/notifications.ts`
- `apps/web/src/settings/modules/providers.ts`
- `apps/web/src/settings/modules/visibility.ts`
- `apps/web/src/strings/admin/inbox.ts`
- `docs/INDEX.md`
- `docs/adr/ADR-024-content-standard.md`
- `docs/design/content.md`
- `docs/design/decisions.md`
- `docs/design/health-history.json`
- `docs/design/health.md`
- `docs/design/rules.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A179-wp-177-and-178-pages-home-appearance.md`
- `docs/plans/backlog.yml`
- `docs/plans/wp17-progress.md`
- `packages/ui-admin/CHANGELOG.md`
- `packages/ui-admin/src/components/feedback/feedback.css`
- `packages/ui-admin/src/components/item/item.css`
- `packages/ui-admin/src/components/tabs-stepper/tabs-stepper.css`
- `packages/ui-admin/src/shell/overlay-mobile.css`
- `packages/ui-admin/src/templates/dfinal-system.css`
- `packages/ui-admin/src/templates/dghl-polish.css`
- `packages/ui-core/CHANGELOG.md`
- `packages/ui-core/src/index.ts`
- `packages/ui-core/src/theme/theme-pack.ts`
- `tests/e2e/states-manifest.ts`
- `tests/e2e/wp15-3a-design-foundations.spec.ts`
- `tests/e2e/wp16-6-inbox-and-audit-rules.spec.ts`
- `tests/e2e/wp16-c-component-census.spec.ts`
- `tests/e2e/wp17-1-settings-routing.spec.ts`
- `tests/e2e/wp17-3-backups-visibility.spec.ts`
- `tests/e2e/wp17-4-account.spec.ts`
- `tests/e2e/wp17-5-audit-calibration-structure.spec.ts`
- `tests/e2e/wp17-8-appearance-v2.spec.ts`
- `tests/e2e/wp17-9-content-and-ink-census.spec.ts`
- `tests/e2e/wp17-9-self-test-journeys.spec.ts`
- `tests/e2e/wp17-contact-sheets.spec.ts`

## 5. Register and Backlog Changes

- [implemented] `docs/plans/backlog.yml`: inserted `WP-17.9` (`gate: L-review`, `status: done` with contact sheets delivered) before `WP-18.3`; updated `WP-18.3` `depends_on: [WP-17.9]`.

## 6. Not Done (Tagged)

- [not-started] `WP-18.3`+ and `WP-19` — out of scope for WP-17 exit gate; stopped per instructions.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A180
=== Validating Receipt A180-wp-179-polish-states-and-content-standard.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '39bf0cb6f943af20173b23364e50240399d7db22' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff a8d2130729c8c4a457aa4e739fa35b4b37182656..39bf0cb6f943af20173b23364e50240399d7db22 (57 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A180-wp-179-polish-states-and-content-standard.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A180-wp-179-polish-states-and-content-standard.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 164; work packages since: 2
- Clean-boundary preconditions: met
- Next action: merge PR #278 via `--merge` and present WP-17.9 L-review report and `~/Desktop/wp17-9-contact-sheets.zip`.
