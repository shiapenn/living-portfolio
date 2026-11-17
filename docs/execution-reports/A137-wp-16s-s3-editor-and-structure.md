# A137 — WP-16.S S3 D-EDITOR-4 Editor and Full Structure Restoration

| Field | Value |
| --- | --- |
| Report ID | A137 |
| Date | 2026-11-17 |
| Author | A (Implementer) |
| Task ID | `WP-16.S S3` |
| Evidence SHA | `914e7fe3828321f6ce30ce8682f248f8ac64c045` |
| CI run | 44027407825 |

---

## 1. Scope

Executed `WP-16.S S3` (`D-EDITOR-4` editor simplification, push entries drawer, floating centred formatting bar, and full Structure restoration):
- [implemented] `editor-toolbar.ts`: implemented single `320px`-safe header row (`#ref-sidebar-toggle`, `#ref-view-switch` with `#ref-switch-edit` / `#ref-switch-settings`, `#ref-btn-history`, `#ref-btn-delete`, `#ref-btn-save`, `#ref-status-line`) and extracted `renderEditorFormattingBar()` (`#ref-format-bar`).
- [implemented] `editor.ts` & `editor-sections.ts`: split editor into `#ref-writing-view` (with floating centred `#ref-format-bar`) and `#ref-settings-view` (`Visibility` radio choice group + `#ref-btn-publish` inside `#ref-vis-section`, `Details` `#ref-details-section`, `Structure` `#ref-structure-section` with `#ref-structure-level`, `#ref-structure-next-step`, `#ref-facets-list`, `#ref-spans-list`, `#ref-claims-list`, `#ref-evidence-list`).
- [implemented] `editor-page.ts`: wired Edit/Settings view switch, `input[name="ref-visibility-choice"]` lifecycle & Undo handler, and full Structure API integration (`/api/structure/entries/:id/{facets,claims,evidence}`, `/api/structure/revisions/:revId/spans`, `POST /api/structure/{facets,claims,evidence,annotations}`).
- [implemented] `styles.ts`: floating centred `.lp-format-bar`, `240ms` push-panel `#ref-entries-drawer`, removed `.lp-editor-toolbar` hairline and `.lp-empty-state` / `.lp-chip` / `.lp-admin-header` borders.
- [implemented] Shrunk `docs/audits/dsys-census-budget.json`: `lineBudgetViolations` (`24 -> 16`, all other 11 checks at `0`).

### Structure Restoration Table (UX-150)

| Structure Feature | Endpoint / Store | DOM IDs | Failing-First Test |
| --- | --- | --- | --- |
| Level & next step | Client derived from counts | `#ref-structure-level`, `#ref-structure-next-step` | `tests/e2e/wp16-s3-editor-structure.spec.ts` |
| Tags / Facets | `GET /api/structure/entries/:id/facets`, `POST /api/structure/facets` | `#ref-facets-list`, `#ref-btn-add-facet` | `tests/e2e/wp16-s3-editor-structure.spec.ts` |
| Spans / Roles | `GET /api/structure/revisions/:revId/spans`, `POST /api/structure/annotations` | `#ref-spans-list`, `[data-accept-span]` | `tests/e2e/wp16-s3-editor-structure.spec.ts` |
| Claims | `GET /api/structure/entries/:id/claims`, `POST /api/structure/claims` | `#ref-claims-list`, `#ref-btn-add-claim` | `tests/e2e/wp16-s3-editor-structure.spec.ts` |
| Evidence | `GET /api/structure/entries/:id/evidence`, `POST /api/structure/evidence` | `#ref-evidence-list`, `#ref-btn-add-evidence` | `tests/e2e/wp16-s3-editor-structure.spec.ts` |

## 2. CI Evidence

- PR `#201` merged to `main` at `914e7fe3828321f6ce30ce8682f248f8ac64c045`.
- `PR #201` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`), `Playwright End-to-End Suite` (`success`), `CodeQL (JavaScript / TypeScript)` (`success`), `Secret Scan (gitleaks)` (`success`), `Detect Changed Scope` (`success`).
- `main` push CI run `44027407825`: `success` (`Typecheck, Unit, Security Regression, DCO & Audit Gate`, `Playwright End-to-End Suite`, `Detect Changed Scope`).
- Local full Playwright E2E suite after final commit `a43773d`: `125 passed` (0 failed, 0 skipped).

## 3. Tests Added and Count Change

- Added `tests/e2e/wp16-s3-editor-structure.spec.ts` (+2 E2E tests: Structure facet/claim/evidence persistence + accept suggested span role).
- Updated 14 existing E2E specs and 4 unit/conformance test files for `D-EDITOR-4` and `D-SYS #3`.

## 4. Files Touched

- `apps/api/src/conformance/ux-p0-probes.conformance.test.ts`
- `apps/api/src/conformance/wp11-markdown-tokens.conformance.test.ts`
- `apps/web/src/client/admin/editor-page.ts`
- `apps/web/src/pages/admin/entries/editor-sections.ts`
- `apps/web/src/pages/admin/entries/editor-toolbar.ts`
- `apps/web/src/pages/admin/entries/editor.test.ts`
- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/styles.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/audits/dom-id-baseline.json`
- `docs/audits/dsys-census-budget.json`
- `docs/doc-registry.json`
- `docs/execution-reports/A136-wp-16s-s2-page-migrations-and-status.md`
- `tests/e2e/redaction.spec.ts`
- `tests/e2e/structure-import.spec.ts`
- `tests/e2e/wp11-navigation-and-states.spec.ts`
- `tests/e2e/wp14-7-hotfix.spec.ts`
- `tests/e2e/wp14-commit-entry.spec.ts`
- `tests/e2e/wp14-editor-feedback.spec.ts`
- `tests/e2e/wp14-publish-dialog.spec.ts`
- `tests/e2e/wp14-state-date.spec.ts`
- `tests/e2e/wp15-3a-design-foundations.spec.ts`
- `tests/e2e/wp15-7-editor-reference-page.spec.ts`
- `tests/e2e/wp16-0-g15-defects-and-parity.spec.ts`
- `tests/e2e/wp16-5-inspector-and-history.spec.ts`
- `tests/e2e/wp16-l1-shell-and-settings.spec.ts`
- `tests/e2e/wp16-l2-tiptap-editor.spec.ts`
- `tests/e2e/wp16-s3-editor-structure.spec.ts`

## 5. Register and Backlog Changes

None in `S3` (register closure `UX-140`..`UX-156` lands in `S4`).

## 6. Not Done (Tagged)

- [not-started] `WP-16.S S4`: dead CSS/JS trim, contact sheets, `UX-140`..`UX-156` register closure.

## 7. Changes to Earlier Reports

Correction note (without editing `A130`): `A130` stated that editor Structure drawer content was kept; in fact, Structure content (level line, next step, facets, spans/roles, claims, evidence) had regressed to a single placeholder sentence under three tabs (`20261106-UX-150`). Restored in `WP-16.S S3` (`#ref-structure-section`).

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A137
=== Validating Receipt A137-wp-16s-s3-editor-and-structure.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '914e7fe3828321f6ce30ce8682f248f8ac64c045' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 8c4f04a28023d443496169eb7af7379b337d5ab9..914e7fe3828321f6ce30ce8682f248f8ac64c045 (29 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A137-wp-16s-s3-editor-and-structure.md.
✓ [CI-LOG-CHECK] CI run 44027407825 verified on GitHub (conclusion: success).

🎉 All receipt checks PASSED for A137-wp-16s-s3-editor-and-structure.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 121 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.S S4` remaining; handover deferred until `WP-16.S` closure)
- Next action: land `A137` receipt PR, then rebase and land `WP-16.S S4` (`feat/wp-16s-s4-contact-sheets-and-closure`).
