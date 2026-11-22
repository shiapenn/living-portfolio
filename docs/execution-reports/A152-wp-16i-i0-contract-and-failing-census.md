# A152 — wp-16i-i0-contract-and-failing-census

| Field | Value |
| --- | --- |
| Report ID | A152 |
| Date | 2026-11-22 |
| Author | A (Implementer) |
| Task ID | `WP-16.I I0` |
| Evidence SHA | `edab18784bdd81b19978e9024e232dd07037fdaa` |
| CI run | 44990936939 |

---

## 1. Scope

Executed `WP-16.I I0` (`D-I1` docs, `UX-194..203` registration, failing census v3 + canaries on `f8f2eef`):
- [implemented] `docs/design/foundations.md` & `docs/plans/P004-ux-remediation-work-packages.md`: recorded `D-I1` (`I1`–`I10`) and `WP-16.I` (`I0`–`I3`) execution sequence.
- [implemented] `docs/audits/register.yml` & `docs/plans/gates.json`: registered `20261106-UX-194` through `20261106-UX-203` (`status: open`) mapped to `WP-16`.
- [implemented] `tests/e2e/census-helpers.ts` & `tests/e2e/wp16-i-census.spec.ts`: added census v3 checks (`checkActionBarI1`, `checkStatusVocabularyI5`, `checkDockedPanelAndAdjacentLinesI7`, `checkItemGeometryI8`), `2` canaries verified against `WP-16.H` merge commit `f8f2eef` (catching docked-panel 4-sided borders and non-vocabulary `StatusLabel` strings `"accepted"` / `"Local only, quotes from your entries"`), and `10` failing-first defect tests (`UX-194`..`UX-203`).

## 2. CI Evidence

- PR `#231` merged to `main` at `edab18784bdd81b19978e9024e232dd07037fdaa`.
- `PR #231` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, `1m39s`), `Playwright End-to-End Suite` (`success`, `3m14s`), `CodeQL` (`success`, `1m57s`), `Secret Scan (gitleaks)` (`success`, `6s`), `Detect Changed Scope` (`success`, `11s`).
- `main` push CI run `44990936939` (`success`: `Typecheck, Unit, Security Regression, DCO & Audit Gate` `1m40s`, `Playwright End-to-End Suite` `3m45s`, `Detect Changed Scope` `5s`).

## 3. Tests Added and Count Change

- Added `tests/e2e/wp16-i-census.spec.ts` (`+12` Playwright tests: `2` canaries against `f8f2eef` + `10` failing-first defect tests `UX-194`..`UX-203`).

## 4. Files Touched

- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/design/foundations.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A151-wp-16h-h3-pixel-diff-and-closure.md`
- `docs/plans/P004-ux-remediation-work-packages.md`
- `docs/plans/gates.json`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp16-i-census.spec.ts`

## 5. Register and Backlog Changes

- `docs/audits/register.yml`: added `20261106-UX-194`..`20261106-UX-203` (`10` entries, `status: open`).
- `docs/plans/P004-ux-remediation-work-packages.md` & `docs/plans/gates.json`: mapped `UX-194`..`UX-203` to `WP-16`.

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.I I1`: `ActionBar` (`page` | `dialog` | `item`), `StatusLabel` vocabulary guard, `Item` geometry, edge-docked panel borders, `/admin/_gallery` completeness.
- `[not-started]` `WP-16.I I2`: page migrations across dialogs/sheets, editor Settings, answer rules, history, providers, status, setup, inbox, import, login, fixture-pattern.
- `[not-started]` `WP-16.I I3`: census v3 report, pixel diff vs `WP-16.H` sheets, visual inspection & register update.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A152
=== Validating Receipt A152-wp-16i-i0-contract-and-failing-census.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'edab18784bdd81b19978e9024e232dd07037fdaa' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 27b91bbc36738fd4c895e9d9e7385b5c27589202..edab18784bdd81b19978e9024e232dd07037fdaa (9 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A152-wp-16i-i0-contract-and-failing-census.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A152-wp-16i-i0-contract-and-failing-census.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 136 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.I I1`–`I3` remaining)
- Next action: execute `WP-16.I I1` primitives & gallery completeness.
