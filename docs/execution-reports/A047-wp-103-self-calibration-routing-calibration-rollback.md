# A047 — WP-10.3 Self-Calibration Routing Calibration Rollback

| Field | Value |
| --- | --- |
| Report ID | A047 |
| Date | 2026-11-03 |
| Author | A (Implementer) |
| Task ID | `WP-10.3 (M5)` |
| Evidence SHA | `78ef8b7` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/41575298074 |

---

## 1. Scope

- 1. Implement self-calibration routing calibration engine with sliding-window metrics, held-out validation, Expected Calibration Error (ECE), and stateful rollback per Spec §11 (Finding M5, Fix 16) [implemented]
- 2. Define domain types `CalibrationMechanism`, `MechanismFlags`, `SlidingWindowConfig`, `RoutingInteractionLog`, `ReliabilityBin`, `CalibrationQualityReport`, and `ValidationResult` in `packages/core/src/types/index.ts` [implemented]
- 3. Implement `CalibrationEngine` in `packages/core/src/algorithms/calibration.ts` [implemented]:
  - `DEFAULT_MECHANISM_FLAGS`: parameter-changing mechanisms (`suggestion_thresholds`, `routing_calibration`) default to `false` (off); proposal mechanisms (`topology_audit`, `scoped_constraint_mining`) default to `true` (on) per Spec §11 [implemented]
  - `filterLogsByWindow`: sliding window filtering by `windowDays` (default 30) and `maxWindowSize` (default 500) [implemented]
  - `computeECE`: Expected Calibration Error, Maximum Calibration Error (MCE), Brier score, and reliability curve bins ($M=10$) [implemented]
  - `validateHeldOut`: empirical validation evaluating proposed adjustments against held-out samples, rejecting auto-apply if ECE degrades by > 0.05 [implemented]
  - `proposeThresholdAdjustment`: honors `calibrationFrozen`, mechanism flags, sliding window, cold start guard, and held-out validation [implemented]
  - `proposeRoutingAdjustment`: evaluates draft edit ratios, citation click-through rate, booking conversion, and scoped constraint rates; computes bounded domain-specific adjustments to `w1..w3` and `temporal_decay` (§11) [implemented]
  - `applyRollback`: restores live parameter state and records non-reversible inverse change record [implemented]
- 4. Update calibration API routes in `apps/api/src/routes/calibration.ts` [implemented]:
  - Canonical `GET /`: returns live parameters, mechanism flags, window configuration, and ECE reliability report [implemented]
  - `GET /parameters`: returns 501 `SIMULATED(M1)` for backward compatibility (or 200 with `?live=true`) [implemented]
  - `GET /proposals`: gathers interaction logs, evaluates sliding window and enabled mechanisms, reports freeze state [implemented]
  - Guarded `POST /apply` and `POST /`: validates `calibrationFrozen` (409 Conflict), clamps step size to `maxStep` (400 Bad Request on delta > 0.05), persists change record, and updates live runtime state (`tier1_floor`, `facet_known_threshold`) [implemented]
  - Stateful `POST /rollback/:id`: verifies reversible, restores state in runtime and repository, and returns 200 [implemented]
- 5. Conformance and unit test suites: 7 unit tests in `packages/core/src/algorithms/algorithms.test.ts` and 4 conformance tests in `apps/api/src/conformance/m5-self-calibration.conformance.test.ts` [implemented]
- 6. Mark finding `M5` as `status: fixed` in `docs/audits/register.yml` and update Spec section 11 conformance notes in `docs/audits/conformance.yml` [implemented]

---

## 2. CI Evidence

### 2.1 Build & Typecheck (Job 125717274332)

- Turbo build executed cleanly across all 8 packages (`@living-portfolio/config`, `@living-portfolio/core`, `@living-portfolio/client`, `@living-portfolio/ai`, `@living-portfolio/db`, `@living-portfolio/web`, `@living-portfolio/worker`, `@living-portfolio/api`).
- Pinned action verification confirmed 38/38 GitHub Action pins resolve upstream to valid immutable commit SHAs.
- Zero compilation errors, 0 type errors.

### 2.2 Verbatim Vitest Results per Package (Job 125717274332)

```
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  24 passed (24)
Test Files  1 passed (1)
Tests  24 passed (24)
Test Files  1 passed (1)
Tests  28 passed (28)
Test Files  2 passed (2)
Tests  16 passed (16)
Test Files  5 passed (5)
Tests  54 passed (54)
Test Files  27 passed (27)
Tests  235 passed (235)
```

*(Note: Total across workspaces: 39 test files passed, 391 passed | 1 skipped, 392 tests).*

### 2.3 Verbatim Playwright E2E Results (Job 125717274039)

```
24 passed (16.5s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125717273828)

```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125717273858)

```
183 commits scanned.
no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 125717274332)

```
✓ [OSR-07 DCO] All 1 commit(s) in a7a8dc352c366bd7a71db68c61d28a98df1cee15..78ef8b7365c843face56deb3136ff02ff3154b72 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- **Unit Tests (`packages/core/src/algorithms/algorithms.test.ts`):** 7 new unit tests added (increasing `@living-portfolio/core` suite from 17 to 24 tests):
  - `filters logs by sliding window (windowDays and maxWindowSize)`: verifies timestamp window filtering and max sample cap truncation.
  - `computes Expected Calibration Error (ECE) and reliability curve bins ($M=10$)`: verifies ECE, MCE, Brier score, and empirical calibration bins.
  - `performs empirical held-out validation`: verifies candidate parameter evaluation against held-out validation partition and ECE degradation threshold.
  - `respects per-mechanism enable/disable flags and freeze guard`: verifies proposal suppression when `suggestion_thresholds` is false or calibration is frozen.
  - `proposes bounded adjustment and supports exact rollback`: verifies threshold proposal clamped within step size and reversible rollback producing opposite delta.
  - `proposes routing parameter adjustments from interaction feedback (§11)`: verifies adjustment proposals to `w1..w3` and `temporal_decay` based on edit ratios and citation CTR.
  - `enforces max step clamping on proposed adjustments`: verifies maxStep bounding logic on parameter increments.
- **Conformance Tests (`apps/api/src/conformance/m5-self-calibration.conformance.test.ts`):** 4 new tests added (increasing `apps/api` test suite from 231 to 235 tests):
  - `GET /api/calibration returns live status, mechanisms, window config, and ECE report`: verifies live parameters, mechanism flags, window config, and reliability report.
  - `POST /api/calibration/apply applies bounded adjustment and updates live runtime state`: verifies step clamping, change record generation, and live runtime threshold updates.
  - `POST /api/calibration/apply rejects apply when calibration is frozen (409 Conflict)`: verifies freeze guard returning 409 Conflict with `CALIBRATION_FROZEN`.
  - `POST /api/calibration/rollback/:id restores previous state in runtime and repo`: verifies reversible rollback, restoring original runtime parameter values.
- **Browser Integration (Playwright):** 24 tests (unchanged from A046 count of 24).
- **Documentation & Process Conformance:** All 76 registered documents validated with zero sequence gaps or checksum drift via `node scripts/docs-check` (`IAHP PROC-1`).

---

## 4. Files Touched

Matches `git diff --name-only f195156..78ef8b7` (12 files):
- `apps/api/src/app.ts`
- `apps/api/src/conformance/m5-self-calibration.conformance.test.ts`
- `apps/api/src/conformance/simulated-501.test.ts`
- `apps/api/src/routes/calibration.ts`
- `docs/INDEX.md`
- `docs/audits/conformance.yml`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A046-wp-102-query-classification-upgrade-and-about-path.md`
- `packages/core/src/algorithms/algorithms.test.ts`
- `packages/core/src/algorithms/calibration.ts`
- `packages/core/src/types/index.ts`

---

## 5. Register and Backlog Changes

- `M5` marked `status: fixed` in `docs/audits/register.yml` (Self-calibration routing calibration: sliding-window metrics, held-out validation, Expected Calibration Error, freeze guard, bounded max-step clamping on /apply, and stateful rollback restoring live parameter state).
- Section `11` conformance notes updated in `docs/audits/conformance.yml`.
- Register totals: 67 fixed, 0 partial, 30 open (P0: 0, P1: 16, P2: 11, P3: 3; 97 total).

---

## 6. Not Done (Tagged)

- WP-10.4: Dynamic topology audit detector (M6 [P2]) & Scope-overlap staleness detector (M7 [P2]) [not-started]
- WP-10.5: Import planner budget enforcement, resumable jobs, core connectors, and concrete notification adapters (M9 [P2]) [not-started]

---

## 7. Changes to Earlier Reports

- None. Historical receipts A001 through A046 and handovers H001 through H010 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A047-wp-103-self-calibration-routing-calibration-rollback.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '78ef8b7' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff f195156..78ef8b7 (12 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A047-wp-103-self-calibration-routing-calibration-rollback.md.
Found 5 section(s) marked verbatim.

✓ [CI-MATCH: 2.2] Vitest line matched verbatim in Job 125717274332 log:
    Test Files  1 passed (1)
✓ [CI-MATCH: 2.3] Playwright line matched verbatim in Job 125717274039 log:
    24 passed (16.5s)
✓ [CI-MATCH: 2.4] SARIF gate line matched verbatim in Job 125717273828 log:
    ✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
✓ [CI-MATCH: 2.5] Gitleaks line matched verbatim in Job 125717273858 log:
    183 commits scanned.
✓ [CI-MATCH: 2.6] DCO line matched verbatim in Job 125717274332 log:
    ✓ [OSR-07 DCO] All 1 commit(s) in a7a8dc352c366bd7a71db68c61d28a98df1cee15..78ef8b7365c843face56deb3136ff02ff3154b72 carry a valid Signed-off-by trailer.

🎉 All receipt checks PASSED for A047-wp-103-self-calibration-routing-calibration-rollback.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 2 (A046, A047); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-10.4 (M6 & M7 [P2])
