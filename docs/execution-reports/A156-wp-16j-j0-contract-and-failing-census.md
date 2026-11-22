# A156 — wp-16j-j0-contract-and-failing-census

| Field | Value |
| --- | --- |
| Report ID | A156 |
| Date | 2026-11-22 |
| Author | A (Implementer) |
| Task ID | `WP-16.J J0` |
| Evidence SHA | `97e177b717ece268f246e070df6374b3987f3e42` |
| CI run | 45008982570 |

---

## 1. Scope

Executed `WP-16.J J0` (D-J Contract, Design-Review Registry, Defect Registration & Failing-First Canaries):
- [implemented] Added `D-J` (`J1`–`J5`) to `docs/design/foundations.md`, `docs/plans/P004-ux-remediation-work-packages.md`, `docs/plans/execution-protocol.md`, and `scripts/docs-new`.
- [implemented] Created `docs/design/components.json` defining allowed `data-c` component names (`17` primitives/components with `variants`, `gallerySampleId`, `parent`/`children` rules, `classFamilies`, `variantOf`) and `allowedClassFamilies`.
- [implemented] Registered `20261106-UX-204`..`UX-208` (`J1`–`J5`, `status: open`) in `docs/audits/register.yml` and mapped them in `docs/plans/P004-ux-remediation-work-packages.md` and `docs/plans/gates.json`.
- [implemented] Added `checkActionBarJ2`, `checkOrphanTextAndMarginsJ3`, and `checkRestingIconButtonFillsJ5` to `tests/e2e/census-helpers.ts`, plus `tests/e2e/wp16-j-census.spec.ts` (`3` synthetic canaries + `5` defect verification tests + `Full Census`). Verified failing-first against `1def86d` (`Settings > Providers` fails `J3` orphan-text and `J1`, `editor-settings` fails `J2` full-width in-section ActionBar and `J3`, `#theme-toggle` fails `J5` dark-mode fill mismatch; `1590` total census issues across `42` states).

## 2. CI Evidence

- PR `#239` merged to `main` at `97e177b717ece268f246e070df6374b3987f3e42`.
- `PR #239` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, `1m21s`), `Playwright End-to-End Suite` (`success`, `5m10s`), `CodeQL Static Analysis` (`success`, `1m52s`), `Secret Scan (gitleaks)` (`success`, `12s`), `Detect Changed Scope` (`success`, `7s`).
- `main` push CI run `45008982570` triggered for `97e177b`.

## 3. Tests Added and Count Change

- Added `9` Playwright tests in `tests/e2e/wp16-j-census.spec.ts` (`3` synthetic canaries `J2`/`J3`/`J5`, `5` named defect tests `UX-204`..`UX-208`, `1` Full Census).

## 4. Files Touched

- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/design/components.json`
- `docs/design/foundations.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A155-wp-16i-i3-pixel-diff-and-closure.md`
- `docs/plans/P004-ux-remediation-work-packages.md`
- `docs/plans/execution-protocol.md`
- `docs/plans/gates.json`
- `scripts/docs-new`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp16-j-census.spec.ts`

## 5. Register and Backlog Changes

- Registered `20261106-UX-204`..`UX-208` as `status: open` in `docs/audits/register.yml` (`WP-16.J`).

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.J J1`: update `ActionBar` `level="item"` + `Item` usage, enforce `docs/design/components.json` in `scripts/verify-ui-guards`.
- `[not-started]` `WP-16.J J2`: migrate `Settings > Providers` Answering model (`FormSection` + `Item`), `Add tag`/`Add claim`/`Attach evidence`, loose value & full-width button audit, resting theme toggle fix (`J5`).
- `[not-started]` `WP-16.J J3`: census closure, pixel diff vs `WP-16.I` sheets, visual inspection & `~/Desktop/wp16j-contact-sheets.zip`, register update.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A156
=== Validating Receipt A156-wp-16j-j0-contract-and-failing-census.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '97e177b717ece268f246e070df6374b3987f3e42' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 1def86d67f6172497108cadcd96670756ae93d92..97e177b717ece268f246e070df6374b3987f3e42 (12 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A156-wp-16j-j0-contract-and-failing-census.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A156-wp-16j-j0-contract-and-failing-census.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 140 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.J J1`–`J3` remaining)
- Next action: execute `WP-16.J J1`.
