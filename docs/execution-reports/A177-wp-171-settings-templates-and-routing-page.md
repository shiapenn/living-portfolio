# A177 — WP-17.1 settings templates and routing page

| Field | Value |
| --- | --- |
| Report ID | A177 |
| Date | 2026-11-25 |
| Author | A (Implementer) |
| Task ID | `WP-17.1` |
| Evidence SHA | `84bd133d4fda5f664d75cfb3ace4750399eb77b9` |
| CI run | 45546978226 |

---

## 1. Scope

- [implemented] Mounted `/admin/routing` to the `answering` settings module in both `apps/web/src/app.ts` and `apps/api/src/adapter/bundled-web.ts`.
- [implemented] Extended `SettingsModuleManifest` (`apps/web/src/settings/registry.ts`) with optional `explain` metadata (`what`, `when`, `how`, `impact`) and rendered the plain-language Explain block on `/admin/settings/answering` (`/admin/routing`).
- [implemented] Added confidence threshold consequence warning (`#tier1-warning`) and one-click `"Restore recommended"` (`#btn-restore-thresholds`) restoring `0.82 / 0.55 / 0.75`, plus configurable `replyTimeEstimate` and `publicConfidenceDisclosure` persisted via `PATCH /api/settings/routing` and `GET /api/settings`.
- [implemented] Added accessible `Overlay` confirmation dialog (`#answering-pause-dialog`) when pausing automatic answering, explaining what visitors see and updating `/admin/status`.
- [implemented] Added E2E test `tests/e2e/wp17-1-settings-routing.spec.ts` and verified `wp16-g/j/l` census (`totalViolations: 0`, `orphanTextCountAllStates: 0`, `unownedMarginCountAllStates: 0`).

### Component statement (required when touching UI; D-J)
- [implemented] `#answering-explain-section`: `FormSection` (`default`) + `Text` (`description`) from `docs/design/components.json`.
- [implemented] `#tier1-warning` & `#btn-restore-thresholds`: `Notice` (`warn`) + `ActionBar` (`item`) + `Button` (`secondary`).
- [implemented] `#setting-public-disclosure` & `#setting-reply-time`: `Choice` (`card`/`multiple`) + `Field` (`select`).
- [implemented] `#answering-pause-dialog`: `Overlay` (`dialog`) + `Text` (`body`) + `ActionBar` (`dialog`) + `Button` (`primary`, `secondary`). Zero new components added.

## 2. CI Evidence

- PR #275 code commit `84bd133d4fda5f664d75cfb3ace4750399eb77b9`:
  - `CI & Audit Conformance Gate` run `45546978226`: `success` (Typecheck/Unit/Audit + Build + Playwright Shards 1..4 all green).
  - `CodeQL Static Analysis` run `45546978196`: `success` (1m49s).
  - `Secret Scan (gitleaks)` run `45546978185`: `success` (6s).

## 3. Tests Added and Count Change

- [implemented] Added `tests/e2e/wp17-1-settings-routing.spec.ts` (1 Playwright E2E journey verifying `/admin/routing`, Explain block, zero jargon, threshold warning + Restore recommended, reply time persistence, and pause confirmation dialog updating `/admin/status`).

## 4. Files Touched

- `apps/api/src/adapter/bundled-web.ts`
- `apps/api/src/routes/settings.ts`
- `apps/web/src/app.ts`
- `apps/web/src/pages/admin/settings-script.ts`
- `apps/web/src/settings/modules/answering.ts`
- `apps/web/src/settings/registry.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A176-wp-16-closure-adr-023-backlog-reconciliation.md`
- `docs/plans/backlog.yml`
- `docs/plans/wp17-progress.md`
- `tests/e2e/wp17-1-settings-routing.spec.ts`

## 5. Register and Backlog Changes

- [implemented] `docs/plans/backlog.yml`: marked `WP-17.1` as `status: done`.
- [implemented] `docs/audits/register.yml`: transitioned `20261106-UX-16` to `status: fixed` (`regression_test: tests/e2e/wp17-1-settings-routing.spec.ts`).

## 6. Not Done (Tagged)

- [not-started] `WP-17.3`..`WP-17.8` — scheduled next in WP-17.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A177
=== Validating Receipt A177-wp-171-settings-templates-and-routing-page.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '84bd133d4fda5f664d75cfb3ace4750399eb77b9' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 3b6453d0a078016fbadc9e69add879c22b38efd8..84bd133d4fda5f664d75cfb3ace4750399eb77b9 (13 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A177-wp-171-settings-templates-and-routing-page.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A177-wp-171-settings-templates-and-routing-page.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 161; work packages since: 2
- Clean-boundary preconditions: met
- Next action: merge PR #275 via `--merge` and proceed with `WP-17.3` (`pnpm backlog:next`).
