# A148 — wp-16h-h0-contract-and-failing-census

| Field | Value |
| --- | --- |
| Report ID | A148 |
| Date | 2026-11-22 |
| Author | A (Implementer) |
| Task ID | `WP-16.H H0` |
| Evidence SHA | `f4888b0640c8ef0760836ae27ff0df9e10a1b5fd` |
| CI run | 44975964976 |

---

## 1. Scope

Executed `WP-16.H H0` (Contract Registration, `D-H` Amendments & G-Census v2 Failing-First Suite):
- [implemented] `docs/design/foundations.md` & `docs/plans/P004-ux-remediation-work-packages.md`: amended `D-G 7` (entries panel inner left edge `12px`, aligned to top bar icon left edge; Items inset `8px`), `D-G A6` (no drop shadow on edge-docked panels), and added `D-H` (`H1`–`H12`) and `WP-16.H` (`H0`–`H3`) execution sequence.
- [implemented] `docs/audits/register.yml` & `docs/plans/gates.json`: registered `20261106-UX-182`..`UX-193` (`status: open`) mapped to `WP-16`.
- [implemented] `tests/e2e/census-helpers.ts` & `tests/e2e/wp16-h-census.spec.ts`: added G-census v2 helpers (`checkContainmentAndOverlap` `C1`/`C2`, `checkControlsRadiusTextButtonsSrOnly` `C3`, `checkCenteringAndBars` `C4`), 3 canaries verified against WP-16.G commit `4c6cd70` (all 3 caught WP-16.G defects as required), and 12 failing-first defect tests (`UX-182`..`UX-193`).
- [implemented] `H1` button height regression root cause analysis: `.lp-btn` and `.lp-btn-sm` in `apps/web/src/styles.ts` hardcoded `height: 36px; min-height: 36px;` to satisfy `wp16-r` `36px` checks, causing `G1`/`G2` `size: 'sm'` buttons inside `Item` and `ActionBar` containers (`answer-rules`, `history`, `settings-providers`, `status`) to shrink to `36px` instead of using a responsive control-height token (`44px <640px`, `40px >=640px`).

## 2. CI Evidence

- PR `#223` merged to `main` at `f4888b0640c8ef0760836ae27ff0df9e10a1b5fd`.
- `PR #223` checks: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`), `Playwright End-to-End Suite` (`success`), `CodeQL` (`success`), `Secret Scan (gitleaks)` (`success`), `Detect Changed Scope` (`success`).
- `main` push CI run `44975964976` (`success`).

## 3. Tests Added and Count Change

- Added `tests/e2e/wp16-h-census.spec.ts` (`+15` Playwright tests: 3 G-census v2 canaries against `4c6cd70` + 12 failing-first defect tests `UX-182..UX-193`).

## 4. Files Touched

- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/design/foundations.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A147-wp-16g-g3-pixel-diff-and-closure.md`
- `docs/plans/P004-ux-remediation-work-packages.md`
- `docs/plans/gates.json`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/wp16-h-census.spec.ts`

## 5. Register and Backlog Changes

- `docs/audits/register.yml`: added `20261106-UX-182`..`UX-193` (`status: open`).

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.H H1`–`H3`: primitives & tokens, page migrations & full G-census v2 closure, and pixel-diff contact sheets.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A148
=== Validating Receipt A148-wp-16h-h0-contract-and-failing-census.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'f4888b0640c8ef0760836ae27ff0df9e10a1b5fd' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 4c6cd7084a9d2187987283634175ad3a3e1893bb..f4888b0640c8ef0760836ae27ff0df9e10a1b5fd (9 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A148-wp-16h-h0-contract-and-failing-census.md.
✓ [CI-LOG-CHECK] CI run 44975964976 verified on GitHub (conclusion: success).

🎉 All receipt checks PASSED for A148-wp-16h-h0-contract-and-failing-census.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 132 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.H H1`–`H3` remaining)
- Next action: execute `WP-16.H H1` primitives and tokens.
