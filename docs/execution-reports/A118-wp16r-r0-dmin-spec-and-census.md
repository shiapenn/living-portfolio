# A118 — wp16r r0 dmin spec and census

| Field | Value |
| --- | --- |
| Report ID | A118 |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Task ID | `WP-16.R R0` |
| Evidence SHA | `ef2649af54e08df04f894a3ee562fd5a3b4d076e` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/43718700783 |

---

## 1. Scope

Executed `WP-16.R R0` (Minimal Visual Reset — specification, findings registration, and failing-first style-census harness):
- `[implemented]` Amended `docs/design/foundations.md` with `D-MIN: Minimal Visual Reset (Supersedes Conflicting D-FOUND-2, D-FOUND-3, D-FOUND-4)` covering all 12 closed design decisions and the Playwright style-census enforcement rule.
- `[implemented]` Amended `docs/plans/P004-ux-remediation-work-packages.md` and `docs/plans/gates.json` to include `WP-16.R` (`R0`–`R4`) and findings `UX-107`, `UX-108`.
- `[implemented]` Registered `20261106-UX-107` (P1, `open`: non-systematic radii/heights/type/spacing/borders/inline styles across admin) and `20261106-UX-108` (P1, `open`: non-journey elements and layout defects on Today/Entries/Editor/Inbox/Answer rules/Settings) in `docs/audits/register.yml`.
- `[implemented]` Wrote `tests/e2e/wp16-r-style-census.spec.ts` (Playwright census across every admin page x 2 themes x 1280 and 320 px), observed the initial failure against `0` budgets, and recorded the full-suite baseline in the shrinking-only `docs/audits/style-census-budget.json`.

## 2. CI Evidence

- PR #162 (`feat/wp-16-r0-d-min-spec-and-census` -> `main`, merge commit `ef2649af54e08df04f894a3ee562fd5a3b4d076e`):
  - `CI & Audit Conformance Gate` (`main` push run `43718700783`, wall-clock; GitHub `billable` field returns `0`):
    - `Detect Changed Scope`: `success` (`7s` / `0.12 min`)
    - `Typecheck, Unit, Security Regression, DCO & Audit Gate`: `success` (`2m31s` / `2.52 min`)
    - `Playwright End-to-End Suite`: `success` (`1m44s` / `1.73 min`)
  - `Secret Scan (gitleaks)` (`main` push run `43718700713`):
    - `Gitleaks Secret & Credential Scan`: `success` (`8s` / `0.13 min`)

## 3. Tests Added and Count Change

- Added `tests/e2e/wp16-r-style-census.spec.ts` (1 E2E test, `113` total E2E tests in CI).
- Failing-first baseline run failed as expected against `0` budgets; full-suite CI baseline recorded in `docs/audits/style-census-budget.json`:
  - `invalidRadii`: `482` (radii compliance `88.3%`, distinct radii `["8px","0px","999px","12px","2px","6px","4px"]`)
  - `invalidControlHeights`: `438` (control height compliance `0.0%`, distinct heights `[32, 44, 46]`)
  - `invalidFontSizes`: `432` (font size compliance `89.6%`, distinct sizes `[11, 12, 13, 14, 15, 16, 18, 20, 28, 32]`, `5` font families)
  - `invalidSpacing`: `3064`
  - `inlineStyles`: `540` (`86.9%` inline-style-free)
  - `multiSignatureRoles`: `4` (`stateLabel: 1, tab: 1, button: 3, iconButton: 3, input: 2, select: 2`)

## 4. Files Touched

- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A117-p0-editor-body-loading-fix-ux-106.md`
- `docs/design/foundations.md`
- `docs/plans/P004-ux-remediation-work-packages.md`
- `docs/plans/gates.json`
- `docs/audits/register.yml`
- `docs/audits/style-census-budget.json`
- `tests/e2e/wp16-r-style-census.spec.ts`

## 5. Register and Backlog Changes

- Added `20261106-UX-107` (P1, `open`) and `20261106-UX-108` (P1, `open`) in `docs/audits/register.yml`.
- Mapped `UX-107`, `UX-108` under `WP-16` / `WP-16.R` in `docs/plans/P004-ux-remediation-work-packages.md` and `docs/plans/gates.json`.

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.R R1`–`R4` (token/primitive reset, page migration, element removal/defect fixes, contact sheets and 0-violation census) remain open and are tracked in `UX-107` and `UX-108`.

## 7. Changes to Earlier Reports

- None.

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A118
=== Validating Receipt A118-wp16r-r0-dmin-spec-and-census.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'ef2649af54e08df04f894a3ee562fd5a3b4d076e' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 337d107..ef2649af54e08df04f894a3ee562fd5a3b4d076e (9 files verified).
✓ [HANDOVER-DECISION-CHECK] Section 9 matches triage output (RECOMMENDED, HO-R3).

All receipt checks PASSED.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 4 (A115, A116, A117, A118); work packages since: 2
- Clean-boundary preconditions: met
- Next action: continue with WP-16.R R1 (tokens and primitives)
