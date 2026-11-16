# A123 — wp16l-l0-foundations-and-census

| Field | Value |
| --- | --- |
| Report ID | A123 |
| Date | 2026-11-16 |
| Author | A (Implementer) |
| Task ID | `WP-16.L L0` |
| Evidence SHA | `cc7a68267aacdef42d800fb61b1e7f3f985645f2` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/43794961670 |

---

## 1. Scope

Executed `WP-16.L L0` (Layout and Editor Reset — foundations, P004 reconciliation, defect registration, and extended failing-first census):
- `[implemented]` Recorded L's baseline supersession decision in `docs/plans/P004-ux-remediation-work-packages.md` and `docs/plans/execution-protocol.md` (H017 baseline superseded by WP-16.R PR #162 to #171, A115 to A122; baseline for WP-16.L is `fe3cd51`).
- `[implemented]` Amended `docs/design/foundations.md` with `D-LAYOUT` (rules 1–13), `D-EDITOR-3`, `D-SETTINGS-ARCH`, and `D-STORAGE`.
- `[implemented]` Reconciled `docs/plans/P004-ux-remediation-work-packages.md` and `docs/plans/gates.json`: added `WP-16.L` (`L0`–`L3`), marked `WP-17.1`..`17.3`, `WP-17.8` partially/shell-covered by `L1`, marked `WP-18.1` and `WP-18.2` covered by `L2` (amending `D-05` fallback), amended `WP-18.3`, `18.4`, `18.5`, `18.7`, and added `WP-18.9` (`Settings > Storage`).
- `[implemented]` Registered 17 defects (`20261106-UX-109`..`20261106-UX-124` under `WP-16.L`; `20261106-UX-125` under `WP-18.9`) in `docs/audits/register.yml`.
- `[implemented]` Documented existing type-to-section mapping from code and spec: Spec (`L241–246, L399, L1095`: `/work` structured profile, `/writing` chronological all entries, `/build` ventures/dev-log; `profiles: [case-study, decision-record, design-project, freeform]`); Core (`packages/core/src/profiles/index.ts`: `case-study`, `decision-record`, `design-project`, `research-note`, `how-to`, `freeform`, fallback `case-study`); Web (`entries-index.ts` L20, `entry-card.ts` L67, `app.ts` L405–408: `freeform` -> `/writing/<slug>`, all non-`freeform` -> `/work/<slug>`, `/writing/:slug` 301-redirects non-`freeform` to `/work/:slug`); unmapped under `D-LAYOUT` #13 (defaulting to `Writing`): `research-note`, `how-to`, and any unknown profile.
- `[implemented]` Extended `tests/e2e/wp16-r-style-census.spec.ts` with layout (`h1PositionMismatch`, `columnWidthMismatch`, `tabGapViolations`, `siblingGapViolations`), colour (`nonTokenColors`, `excessBackgroundColors`), overflow/clipping (`parentBoxOverflows`, `clippedText`), text (`forbiddenTextMatches`), and Select (`selectChevronMismatch`) checks; observed failing-first against `0` budgets (`local output`), then recorded full-suite CI baseline in `docs/audits/style-census-budget.json`.

## 2. CI Evidence

- PR #172 (`feat/wp-16-l0-foundations-and-census` -> `main`, merge commit `cc7a68267aacdef42d800fb61b1e7f3f985645f2`):
  - `CI & Audit Conformance Gate` (`main` push run `43794961670`, wall-clock; GitHub `billable` field returns `0`):
    - `Detect Changed Scope`: `success` (`6s` / `0.10 min`)
    - `Typecheck, Unit, Security Regression, DCO & Audit Gate`: `success` (`2m14s` / `2.23 min`)
    - `Playwright End-to-End Suite`: `success` (`2m27s` / `2.45 min`)
  - `Secret Scan (gitleaks)` (`main` push run `43794961649`):
    - `Gitleaks Secret & Credential Scan`: `success`

## 3. Tests Added and Count Change

- Extended `tests/e2e/wp16-r-style-census.spec.ts` (113 E2E tests total in CI).
- Failing-first local run against `0` budgets failed at `h1PositionMismatch: 12 > 0`; full-suite CI baseline recorded in `docs/audits/style-census-budget.json`:
  - `h1PositionMismatch: 12`, `columnWidthMismatch: 28`, `tabGapViolations: 16`, `siblingGapViolations: 24`, `nonTokenColors: 400` (observed `130`/`282` in CI), `excessBackgroundColors: 26`, `parentBoxOverflows: 8`, `clippedText: 18`, `forbiddenTextMatches: 28`, `selectChevronMismatch: 36`.

## 4. Files Touched

- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/audits/style-census-budget.json`
- `docs/design/foundations.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A122-wp16r-r4-contact-sheets-and-census.md`
- `docs/plans/P004-ux-remediation-work-packages.md`
- `docs/plans/execution-protocol.md`
- `docs/plans/gates.json`
- `tests/e2e/wp16-r-style-census.spec.ts`

## 5. Register and Backlog Changes

- Added `20261106-UX-109`..`20261106-UX-124` (`open`, mapped to `WP-16` / `WP-16.L`) and `20261106-UX-125` (`open`, mapped to `WP-18` / `WP-18.9`) in `docs/audits/register.yml`, `P004`, and `gates.json`.

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.L L1`–`L3` (shell/pages/settings split, Tiptap editor, contact sheets) remain open.

## 7. Changes to Earlier Reports

- None.

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A123
=== Validating Receipt A123-wp16l-l0-foundations-and-census.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'cc7a68267aacdef42d800fb61b1e7f3f985645f2' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff db1b4e895af628ecd4b28a4d5ef64c73fdcfc2f6..cc7a68267aacdef42d800fb61b1e7f3f985645f2 (10 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A123-wp16l-l0-foundations-and-census.md.

🎉 All receipt checks PASSED for A123-wp16l-l0-foundations-and-census.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 9 (A115..A123); work packages since: 2
- Clean-boundary preconditions: met
- Next action: continue with WP-16.L L1 (shell, launcher, page template, List row, Select, token fixes, settings split, non-editor pages, section display)
