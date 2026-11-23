# A167 — wp-16l-l2-page-and-list-migrations

| Field | Value |
| --- | --- |
| Report ID | A167 |
| Date | 2026-11-23 |
| Author | A (Implementer) |
| Task ID | `WP-16.L L2` |
| Evidence SHA | `b4378449a858a1084b038bec7ed9c3222580d437` |
| CI run | 45105113596 |

---

## 1. Scope

Executed `WP-16.L L2` (Page and List Migrations across `D-L1`, `D-L2`, and `D-L3`):
- [implemented] Migrated all 13 admin list instances across `Today` (`apps/web/src/pages/admin/dashboard.ts`), `Entries panel` (`apps/web/src/pages/admin/entries/editor.ts`), `Settings > Providers` (`apps/web/src/settings/modules/providers.ts`), `Status` (`apps/web/src/pages/admin/status.ts`), `Entry History` (`apps/web/src/pages/admin/entries/history.ts`), `Answer rules` (`apps/web/src/pages/admin/audit.ts`), `Inbox` (`apps/web/src/pages/admin/inbox.ts`), `Editor settings` (`apps/web/src/pages/admin/entries/editor-sections.ts`), `Entries list` (`apps/web/src/pages/admin/entries/list.ts`), `Settings index` (`apps/web/src/pages/admin/settings.ts`), and `Pattern fixture` (`apps/web/src/pages/admin/fixture.ts`) to `renderList` with explicit `variant: 'plain' | 'interactive'` (`D-L2`, `20261106-UX-214`).
- [implemented] Fixed `Today` spacing (`Needs attention` and `Getting started` checklist, dismiss button overlap) by replacing raw `<section>` elements with `renderFormSection` + `renderSectionHeader` (`D-L3` / `K2` amendment, `20261106-UX-215`).
- [implemented] Enforced `D-L1` item-level button grammar (`20261106-UX-213`) across `Answer rules` (`Confirm rule` secondary + `Discard` text button), `Editor settings > Suggested roles` (`Undo` and `Restore` single actions secondary; `Accept` secondary + `Ignore` text button), and `Claims` / `Evidence` inline forms (`Add` secondary + `Cancel` text button).
- [implemented] Updated `.lp-editor-drawer-header-stack` gap to `var(--lp-space-stack-control-to-list)` (`16px`) and activated live `20261106-UX-213..UX-215` verification plus the full 42-state `L1`/`L2`/`L3` census in `tests/e2e/wp16-l-census.spec.ts`.

### Component statement (required when touching UI; D-J)

- [implemented] `List` (`data-c="List"`, variants `plain`, `interactive`): registered in `docs/design/components.json` (`variantOf: "Item"`); used across all 13 admin list instances.
- [implemented] `FormSection` (`data-c="FormSection"`, variant `default`) & `SectionHeader` (`data-c="SectionHeader"`, variant `default`): existing registered components in `docs/design/components.json`; used on `Today` (`#today-needs-attention` and `#today-checklist-card`).
- [implemented] `ActionBar` (`data-c="ActionBar"`, variant `item`) & `Button` (`data-c="Button"`, variants `secondary`, `text`): existing registered components in `docs/design/components.json`.

## 2. CI Evidence

- PR `#260` merged to `main` at `b4378449a858a1084b038bec7ed9c3222580d437`.
- `PR #260` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, `1m28s`), `Playwright End-to-End Suite` (`success`, `8m26s`), `CodeQL Static Analysis` (`success`, `2m19s`), `Secret Scan (gitleaks)` (`success`, `6s`), `Detect Changed Scope` (`success`, `6s`).
- `main` push CI run `45105113596` triggered for `b437844`.

## 3. Tests Added and Count Change

- Removed `test.fail` markers from `20261106-UX-213`, `20261106-UX-214`, `20261106-UX-215a`, and `20261106-UX-215b` in `tests/e2e/wp16-l-census.spec.ts` and added `Full 42-state census: L1 button grammar, L2 list variants & text-left-edge sets, and L3 list spacing across all states` (`10/10` tests passing).

## 4. Files Touched

- `apps/web/src/client/admin/editor-page.ts`
- `apps/web/src/pages/admin/audit.ts`
- `apps/web/src/pages/admin/dashboard.ts`
- `apps/web/src/pages/admin/entries/editor-sections.ts`
- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/pages/admin/entries/history.ts`
- `apps/web/src/pages/admin/entries/list.ts`
- `apps/web/src/pages/admin/fixture.ts`
- `apps/web/src/pages/admin/inbox.ts`
- `apps/web/src/pages/admin/settings.ts`
- `apps/web/src/pages/admin/status.ts`
- `apps/web/src/settings/modules/providers.ts`
- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A166-wp-16l-l1-button-grammar-and-list-variants.md`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp16-l-census.spec.ts`

## 5. Register and Backlog Changes

No status changes in `docs/audits/register.yml` in `L2`; `20261106-UX-213..UX-217` remain `open` pending `L3`–`L4`.

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.L L3`: token restructure (`D-L5`), spacing taxonomy (`D-L4`), generator, guards, monotonic proximity test, performance measurement.
- `[not-started]` `WP-16.L L4`: census, pixel diff against `WP-16.K` sheets with intended changes listed, visual inspection, `~/Desktop/wp16l-contact-sheets.zip`, closure.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A167
=== Validating Receipt A167-wp-16l-l2-page-and-list-migrations.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'b4378449a858a1084b038bec7ed9c3222580d437' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff bd6cfbcee54a1af6b705e11a9d78d58fc573fba1..b4378449a858a1084b038bec7ed9c3222580d437 (18 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A167-wp-16l-l2-page-and-list-migrations.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A167-wp-16l-l2-page-and-list-migrations.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 151 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.L L3`–`L4` remaining)
- Next action: execute `WP-16.L L3`.
