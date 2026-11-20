# A144 — wp-16g-g0-contract-and-failing-census

| Field | Value |
| --- | --- |
| Report ID | A144 |
| Date | 2026-11-20 |
| Author | A (Implementer) |
| Task ID | `WP-16.G G0` |
| Evidence SHA | `705bc3056d2ccf6ec35c466f2592f531972e7fc5` |
| CI run | 44707495240 |

---

## 1. Scope

Executed `WP-16.G G0` (Measurement Integrity & Contract Registration):
- [implemented] `docs/design/foundations.md` & `docs/plans/P004-ux-remediation-work-packages.md`: added `D-G` (`A1`–`A6`, `B7`–`B14`, `C15`–`C19`), `WP-16.G` (`G0`–`G3`), and `WP-17.9` (`Appearance v2`, recorded only).
- [implemented] `docs/audits/register.yml` & `docs/plans/gates.json`: registered `20261106-UX-170`..`UX-181` (`status: open`) mapped to `WP-16`.
- [implemented] `tests/e2e/states-manifest.ts`, `tests/e2e/census-helpers.ts`, `tests/e2e/wp16-g-census.spec.ts`, `apps/web/src/strings/en.ts`: added per-state `marker` verification, `data-rel` hook-based relation checks (all 21 relations, no zero-pair or logged mode), `data-c` single-implementation & `BackLink === "Back"` guards, `@media` container-query guard, overlay `1px` outline & directional shadow checks, `>=16px` page edge padding check, 6 passing canaries, and 12 failing-first defect tests + full `STATES` census.

## 2. CI Evidence

- PR `#215` merged to `main` at `705bc3056d2ccf6ec35c466f2592f531972e7fc5`.
- `PR #215` checks: `CI & Audit Conformance Gate` (`success`), `Playwright End-to-End Suite` (`success`), `CodeQL (JavaScript / TypeScript)` (`success`), `Gitleaks Secret & Credential Scan` (`success`), `Detect Changed Scope` (`success`).
- `main` push CI run `44707495240` (validated after completion).

## 3. Tests Added and Count Change

- Added `tests/e2e/wp16-g-census.spec.ts` (`+19` Playwright tests: 6 passing canaries + 12 failing-first defect tests `UX-170..UX-181` + 1 failing-first full `STATES` census).

## 4. Files Touched

- `apps/web/src/strings/en.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/design/foundations.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A143-wp-16f-f4-contact-sheets-and-closure.md`
- `docs/plans/P004-ux-remediation-work-packages.md`
- `docs/plans/gates.json`
- `tests/e2e/census-helpers.ts`
- `tests/e2e/states-manifest.ts`
- `tests/e2e/wp16-g-census.spec.ts`

## 5. Register and Backlog Changes

- `docs/audits/register.yml`: added `20261106-UX-170`..`UX-181` (`status: open`).

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.G G1`–`G3`: primitives/patterns container queries & fixes, page migrations (including Setup Step 3 `UX-09`), and pixel-diff contact sheets.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A144
=== Validating Receipt A144-wp-16g-g0-contract-and-failing-census.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '705bc3056d2ccf6ec35c466f2592f531972e7fc5' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 41100960501099fe010408adb9c341c1ddbed10f..705bc3056d2ccf6ec35c466f2592f531972e7fc5 (11 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A144-wp-16g-g0-contract-and-failing-census.md.
✓ [CI-LOG-CHECK] CI run 44707495240 verified on GitHub (conclusion: success).

🎉 All receipt checks PASSED for A144-wp-16g-g0-contract-and-failing-census.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 128 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.G G1`–`G3` remaining)
- Next action: execute `WP-16.G G1` primitives and patterns.
