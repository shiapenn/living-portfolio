# A085 — WP-14.5 calibration defaults and mechanism gates

| Field | Value |
| --- | --- |
| Report ID | A085 |
| Date | 2026-11-10 |
| Author | A (Implementer) |
| Task ID | `WP-14.5` |
| Evidence SHA | cf13ed1 |
| CI run | local verify (`pnpm verify`) green |

---

## 1. Scope

- [implemented] Calibration Defaults per Spec §11: Configured suggestion thresholds and routing calibration to ship OFF by default on fresh instances; topology audit and scoped-constraint mining ship ON as proposal-only.
- [implemented] Spec Calibration Configuration Block: Added `calibration:` schema in `packages/config/src/index.ts` reflecting spec Section 11 & Section 13 defaults.
- [implemented] Minimum Sample Size Gate Raised to 20: Raised the minimum sample gate from legacy 5 to 20 in `packages/core` and `apps/api/src/routes/calibration.ts`; enforced that parameter adjustment POST /api/calibration/apply rejects changes with evidence below 20 with `INSUFFICIENT_SAMPLE_SIZE`.
- [implemented] Mechanism Switches in Settings UI: Replaced the single "Freeze Calibration" checkbox in `apps/web/src/renderer.ts` with four separate switches for suggestion thresholds, routing calibration, topology audit, and scoped-constraint mining.
- [implemented] Gate and Step Limit Displays: Each mechanism displays its minimum-sample gate (min 20 samples) and step limit (±0.05) or proposal-only badge.
- [implemented] Runtime Settings & Persistence: Wired mechanism states into `RuntimeSettingsState` and settings PATCH `/api/settings/routing`, allowing independent toggling and persistence.
- [implemented] Conformance & E2E Suites: Added `apps/api/src/conformance/calibration-defaults.conformance.test.ts` (3 tests) and `tests/e2e/wp14-calibration-defaults.spec.ts` (1 serial test).

---

## 2. CI Evidence

Local verification via `pnpm verify`:
- Build & typecheck (`turbo run build`): PASSED across all 8 packages.
- Conformance gates (OSR-01, OSR-03, OSR-07, OSR-12, OSR-13, IAHP PROC-1, IAHP HO-1, DR-AUD-001): PASSED.
- Unit, conformance, & P0 regression suites: PASSED (365/365 tests in 43 files).
- Playwright E2E suite: PASSED (77/77 tests in 19 files, including new `wp14-calibration-defaults.spec.ts`).
- Gitleaks secret scan: PASSED (0 leaks).

Note: The GitHub Actions Dependency Review workflow (`.github/workflows/deps.yml`) is non-gating on this repository (`continue-on-error: true`).

---

## 3. Tests Added and Count Change

- Added API conformance test `apps/api/src/conformance/calibration-defaults.conformance.test.ts` (3 tests, net +3 in `apps/api`, total 365 tests across 43 files).
- Added E2E regression test `tests/e2e/wp14-calibration-defaults.spec.ts` (1 test, net +1 E2E test, total 77 E2E tests across 19 files).

---

## 4. Files Touched

- apps/api/src/app.ts
- apps/api/src/conformance/calibration-defaults.conformance.test.ts
- apps/api/src/routes/calibration.ts
- apps/api/src/routes/settings.ts
- apps/web/src/renderer.ts
- docs/execution-reports/A084-wp-144-local-autosave-and-writing-buffer.md
- packages/config/src/index.ts
- packages/core/src/algorithms/calibration.ts
- tests/e2e/wp14-calibration-defaults.spec.ts

---

## 5. Register and Backlog Changes

- Register counts: 109 fixed, 7 partial, 53 open (total 169 findings, unchanged pending Gate G14 register update).
- Directly addresses UX-08 (`20261106-UX-08`) per Spec §11.

---

## 6. Not Done (Tagged)

- [not-started] WP-14.6 Quick visual repairs: Tokens, CSS variables check, flex-wrap gap fix (UI-01, UI-03).
- [not-started] Gate G14: Update `gates.json`, mark UX-01..UX-04, UX-08, UX-10, UX-11, UX-22 as fixed, produce closing receipt A087.

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A085
=== Validating Receipt A085-wp-145-calibration-defaults-and-mechanism-gates.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'cf13ed1' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 0c77e5d..cf13ed1 (9 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A085-wp-145-calibration-defaults-and-mechanism-gates.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A085-wp-145-calibration-defaults-and-mechanism-gates.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 11 (A075, A076, A077, A078, A079, A080, A081, A082, A083, A084, A085); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-14.6
