# A178 — WP-17.3 to 17.6 settings and governance modules

| Field | Value |
| --- | --- |
| Report ID | A178 |
| Date | 2026-11-25 |
| Author | A (Implementer) |
| Task ID | `WP-17.3`, `WP-17.4`, `WP-17.5`, `WP-17.6` |
| Evidence SHA | `0d066552fe77cf1ff381cf1977527ae8cda7169d` |
| CI run | 45549332627 |

---

## 1. Scope

- [implemented] **WP-17.3 (Backups, Export & Visibility)**: Upgraded `apps/web/src/settings/modules/backups.ts` with honest backup/drill availability copy, Explain block, and named archive export (`Content-Disposition` filename in `apps/api/src/routes/settings.ts`); added `apps/web/src/settings/modules/visibility.ts` (`PATCH /api/settings/visibility` in `apps/api/src/routes/settings-wp17.ts`) and dynamic `/robots.txt` in `apps/web/src/app.ts` and `apps/api/src/app.ts`; marked `20261106-UX-33`, `20261106-UX-34`, `20261106-UX-42` fixed.
- [implemented] **WP-17.4 (Account)**: Added `apps/web/src/settings/modules/account.ts` and `apps/web/src/settings/modules/account-script.ts` mounted at `/admin/settings/account` and `/admin/account`, backed by modular `apps/api/src/auth/account-routes.ts` (password change, TOTP 2FA setup/confirm/disable, recovery code regeneration, active session revocation); marked `20261106-UX-41`, `20261106-UX-47`, `20261106-UX-49` fixed.
- [implemented] **WP-17.5 (Audit Contradictions, Calibration & Structure)**: Added Contradictions view at `/admin/audit?status=contradictions` (preserving `/admin/audit` 3-tab baseline), `/admin/calibration` (parameter history & rollback), and `/admin/structure` (entry profiles & redaction exclusions).
- [implemented] **WP-17.6 (Bookings & Ventures)**: Added `/admin/bookings` (`PATCH /api/book/:id` Confirm/Decline/Cancel) and `/admin/ventures` (`PATCH /api/structure/ventures/:id` Add Venture, status, featured toggle).
- [implemented] **Launcher scroll fix**: Constrained `.lp-launcher-panel` max-height with `overflow-y: auto` using design tokens in `packages/ui-admin/src/shell/layout-templates.css` with changeset `.changeset/wp17-launcher-scroll.md`.

### Component statement (required when touching UI; D-J)
- [implemented] `settings-backups`, `settings-visibility`, `settings-account`, `audit-contradictions`, `calibration`, `structure`, `bookings`, `ventures`: composed strictly from registered `data-c` components (`FormSection`, `Field`, `Choice`, `ActionBar`, `Button`, `List` [`plain`], `Item`, `Text`, `EmptyState`, `StatusLine`, `Tabs`). Zero new components introduced; zero literals; zero inline `style=`.

## 2. CI Evidence

- PR #276 code commit `0d066552fe77cf1ff381cf1977527ae8cda7169d`:
  - `CI & Audit Conformance Gate` run `45549332627`: `success` (Typecheck/Unit/Audit + Build + Playwright Shards 1..4 all green).
  - `CodeQL Static Analysis` run `45549332531`: `success`.
  - `Secret Scan (gitleaks)` run `45549332533`: `success`.

## 3. Tests Added and Count Change

- [implemented] Added `tests/e2e/wp17-3-backups-visibility.spec.ts` (1 Playwright E2E test).
- [implemented] Added `tests/e2e/wp17-4-account.spec.ts` (1 Playwright E2E test).
- [implemented] Added `tests/e2e/wp17-5-audit-calibration-structure.spec.ts` (1 Playwright E2E test).
- [implemented] Added `tests/e2e/wp17-6-bookings-ventures.spec.ts` (1 Playwright E2E test).

## 4. Files Touched

- `.changeset/wp17-launcher-scroll.md`
- `apps/api/src/adapter/bundled-web.ts`
- `apps/api/src/app.ts`
- `apps/api/src/auth/account-routes.ts`
- `apps/api/src/auth/security.ts`
- `apps/api/src/routes/book.ts`
- `apps/api/src/routes/settings-wp17.ts`
- `apps/api/src/routes/settings.ts`
- `apps/api/src/routes/structure.ts`
- `apps/web/src/app.ts`
- `apps/web/src/layouts/admin-shell.ts`
- `apps/web/src/pages/admin/audit.ts`
- `apps/web/src/pages/admin/bookings.ts`
- `apps/web/src/pages/admin/calibration.ts`
- `apps/web/src/pages/admin/settings-script.ts`
- `apps/web/src/pages/admin/structure.ts`
- `apps/web/src/pages/admin/ventures.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/settings/index.ts`
- `apps/web/src/settings/modules/account-script.ts`
- `apps/web/src/settings/modules/account.ts`
- `apps/web/src/settings/modules/backups.ts`
- `apps/web/src/settings/modules/visibility.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A177-wp-171-settings-templates-and-routing-page.md`
- `docs/plans/backlog.yml`
- `docs/plans/wp17-progress.md`
- `packages/ui-admin/CHANGELOG.md`
- `packages/ui-admin/src/shell/layout-templates.css`
- `tests/e2e/states-manifest.ts`
- `tests/e2e/wp17-3-backups-visibility.spec.ts`
- `tests/e2e/wp17-4-account.spec.ts`
- `tests/e2e/wp17-5-audit-calibration-structure.spec.ts`
- `tests/e2e/wp17-6-bookings-ventures.spec.ts`

## 5. Register and Backlog Changes

- [implemented] `docs/plans/backlog.yml`: marked `WP-17.3`, `WP-17.4`, `WP-17.5`, `WP-17.6` as `status: done`.
- [implemented] `docs/audits/register.yml`: transitioned `20261106-UX-33`, `UX-34`, `UX-41`, `UX-42`, `UX-47`, `UX-49` to `status: fixed`.

## 6. Not Done (Tagged)

- [not-started] `WP-17.7` (Pages & Home) and `WP-17.8` (Appearance v2) — prepared on stacked branch for PR #277.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A178
=== Validating Receipt A178-wp-173-to-176-settings-and-governance-modules.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '0d066552fe77cf1ff381cf1977527ae8cda7169d' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 84bd133d4fda5f664d75cfb3ace4750399eb77b9..0d066552fe77cf1ff381cf1977527ae8cda7169d (36 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A178-wp-173-to-176-settings-and-governance-modules.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A178-wp-173-to-176-settings-and-governance-modules.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 162; work packages since: 2
- Clean-boundary preconditions: met
- Next action: merge PR #276 via `--merge` and open PR #277 for `WP-17.7` and `WP-17.8`.
