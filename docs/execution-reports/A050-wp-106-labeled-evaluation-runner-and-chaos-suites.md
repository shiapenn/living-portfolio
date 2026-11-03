# A050 — WP-10.6 Labeled Evaluation Runner and Chaos Suites

| Field | Value |
| --- | --- |
| Report ID | A050 |
| Date | 2026-11-03 |
| Author | A (Implementer) |
| Task ID | `WP-10.6 (M11)` |
| Evidence SHA | `80c82f0` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/41586819068 |

---

## 1. Scope

- 1. Implement model-quality evaluation harness and labeled benchmark runner `runEvaluation` with versioned reference dataset in `@living-portfolio/ai` (`packages/ai/src/evaluation/index.ts`, Spec §18.2, Fix 26) [implemented]
- 2. Compute annotation quality metrics (precision, recall, F1, inter-annotator agreement / Cohen's Kappa) for roles, facets, claims, and outcome status (§18.2) [implemented]
- 3. Implement baseline comparison evaluating full pipeline against plain chunk-level retrieval without structure and general model without retrieval (§18.2) [implemented]
- 4. Implement structure ablation testing role-aware boost, structured gate, claim retrieval, and structured view independently, proving every structural feature beats un-structured baseline (§18.2) [implemented]
- 5. Evaluate calibration reliability curves, Expected Calibration Error (ECE < 0.05), and time-travel leakage (zero post-cutoff anachronisms) (§18.1, §18.2) [implemented]
- 6. Evaluate preset trade-offs (free-cloud, reliable-low-cost, private-local) and zero-cost extractive fallback mode (§18.2) [implemented]
- 7. Expose evaluation runner in `apps/api/src/routes/settings.ts` (`GET /api/settings/evaluation` preserving 501 `SIMULATED(M1)` default backward compatibility, executing live evaluation report on `?live=true`, and `POST /api/settings/evaluation/run`) [implemented]
- 8. Add provider-chain chaos, degradation ladder step-down, and security auth/prompt-injection tests in `apps/api/src/conformance/m11-evaluation-chaos.conformance.test.ts` (§18.1, Fix 25) [implemented]
- 9. Add accessibility (axe) test suite in `tests/e2e/wp10-accessibility.spec.ts` verifying ARIA landmarks, page headings, skip link, accessible form controls, minimum touch targets, and keyboard navigation across views (§18.1) [implemented]
- 10. Mark finding `M11` as `status: fixed` in `docs/audits/register.yml` and update Spec sections 18.1 and 18.2 to `status: implemented` in `docs/audits/conformance.yml` [implemented]

---

## 2. CI Evidence

### 2.1 Build & Typecheck (Job 125754140294)

- Turbo build executed cleanly across all 8 packages (`@living-portfolio/config`, `@living-portfolio/core`, `@living-portfolio/client`, `@living-portfolio/ai`, `@living-portfolio/db`, `@living-portfolio/web`, `@living-portfolio/worker`, `@living-portfolio/api`).
- Pinned action verification confirmed 38/38 GitHub Action pins resolve upstream to valid immutable commit SHAs.
- Zero compilation errors, 0 type errors.

### 2.2 Verbatim Vitest Results per Package (Job 125754140294)

```
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  33 passed (33)
Test Files  2 passed (2)
Tests  29 passed (29)
Test Files  1 passed (1)
Tests  28 passed (28)
Test Files  2 passed (2)
Tests  16 passed (16)
Test Files  5 passed (5)
Tests  54 passed (54)
Test Files  30 passed (30)
Tests  247 passed (247)
```

*(Note: Total across workspaces: 43 test files passed, 417 passed | 1 skipped, 418 tests).*

### 2.3 Verbatim Playwright E2E Results (Job 125754139974)

```
27 passed (11.7s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125754140445)

```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125754139761)

```
189 commits scanned.
```

### 2.6 Verbatim DCO Verification Line (Job 125754140294)

```
✓ [OSR-07 DCO] All 1 commit(s) in b733eea777f61c2ad25d7f6872c3cad858301e4a..80c82f04ad87ac14ef66f2d9fa1c6c73695781ac carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- **Unit Tests (`packages/ai/src/evaluation.test.ts`):** 5 new tests added (increasing `packages/ai` test suite from 24 to 29 tests):
  - `loads versioned golden evaluation dataset with documents and queries (§18.2)`: verifies v1.0.0 schema, document roles/facets/claims, and query expectations.
  - `computes annotation quality metrics with precision, recall, F1, and inter-annotator agreement`: verifies precision/recall/F1 >= 0.85 and Cohen's Kappa >= 0.8.
  - `runs baseline comparison proving structured pipeline outperforms plain chunk retrieval and general model`: verifies correctness/citation accuracy order (full pipeline > plain chunk retrieval > general model) and lowest inapplicability error rate.
  - `proves all individual structural features beat the un-structured baseline via structure ablation (§18.2)`: verifies role boost, gate, claim retrieval, and structured view all achieve positive lift and beat the plain baseline.
  - `evaluates calibration curves, ECE, time-travel leakage, and zero-cost extractive mode (§18.1, §18.2)`: verifies ECE < 0.05, zero post-cutoff anachronism leakage, free preset cost = $0, and extractive mode makes 0 model calls.
- **Conformance Tests (`apps/api/src/conformance/m11-evaluation-chaos.conformance.test.ts`):** 4 new conformance tests added (increasing `apps/api` test suite from 243 to 247 tests):
  - `GET /api/settings/evaluation preserves 501 SIMULATED(M1) by default, and runs live evaluation with ?live=true (§18.2, Fix 26)`: verifies 501 preservation without query flag, and live evaluation execution with 200 response.
  - `POST /api/settings/evaluation/run executes model-quality benchmark harness (§18.2, Fix 26)`: verifies POST runner execution and ablation results.
  - `Provider chaos tests verify degradation ladder: primary timeout/429 falls back to secondary and extractive mode (§18.1)`: verifies governor error recording and fallback step-down.
  - `Security gate tests verify auth requirement and prompt-injection resistance (§18.1, Fix 25)`: verifies 401 unauth guard on admin routes and safe handling of prompt-injection payloads in Ask queries.
- **Browser Integration (`tests/e2e/wp10-accessibility.spec.ts`):** 3 new tests added (increasing Playwright suite from 24 to 27 tests):
  - `Visitor pages expose standard ARIA landmarks, page headings, and skip link mechanics`.
  - `Admin workspace maintains accessible form controls, labeled buttons, and minimum touch targets`.
  - `Timeline and Work views support keyboard navigation without mouse dependence`.
- **Documentation & Process Conformance:** All 79 registered documents validated with zero sequence gaps or checksum drift via `node scripts/docs-check` (`IAHP PROC-1`).

---

## 4. Files Touched

Matches `git diff --name-only 6d5a6fc..80c82f0` (11 files):
- `apps/api/src/conformance/m11-evaluation-chaos.conformance.test.ts`
- `apps/api/src/routes/settings.ts`
- `docs/INDEX.md`
- `docs/audits/conformance.yml`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A049-wp-105-import-planner-budgets-and-core-connectors.md`
- `packages/ai/src/evaluation.test.ts`
- `packages/ai/src/evaluation/index.ts`
- `packages/ai/src/index.ts`
- `tests/e2e/wp10-accessibility.spec.ts`

---

## 5. Register and Backlog Changes

- `M11` marked `status: fixed` in `docs/audits/register.yml` (Labeled evaluation runner, structure ablation, baseline comparison, calibration ECE, time-travel leakage, provider chaos, axe accessibility tests, and CI supply chain decoupling checks [§18.1, §18.2, Fix 25, Fix 26]).
- Section `18.1` marked `status: implemented` in `docs/audits/conformance.yml`.
- Section `18.2` marked `status: implemented` in `docs/audits/conformance.yml`.
- Register totals: 71 fixed, 0 partial, 26 open (P0: 0, P1: 16, P2: 8, P3: 2; 97 total).

---

## 6. Not Done (Tagged)

- WP-10.7: Work Package 10 Gate Closure & Handover Snapshot H011 [not-started]

---

## 7. Changes to Earlier Reports

- None. Historical reports A001 through A049 and handovers H001 through H010 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A050-wp-106-labeled-evaluation-runner-and-chaos-suites.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '80c82f0' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 6d5a6fc..80c82f0 (11 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A050-wp-106-labeled-evaluation-runner-and-chaos-suites.md.
Found 5 section(s) marked verbatim.

✓ [CI-MATCH: 2.2] Vitest line matched verbatim in Job 125754140294 log:
    Test Files  1 passed (1)
✓ [CI-MATCH: 2.3] Playwright line matched verbatim in Job 125754139974 log:
    27 passed (11.7s)
✓ [CI-MATCH: 2.4] SARIF gate line matched verbatim in Job 125754140445 log:
    ✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
✓ [CI-MATCH: 2.5] Gitleaks line matched verbatim in Job 125754139761 log:
    189 commits scanned.
✓ [CI-MATCH: 2.6] DCO line matched verbatim in Job 125754140294 log:
    ✓ [OSR-07 DCO] All 1 commit(s) in b733eea777f61c2ad25d7f6872c3cad858301e4a..80c82f04ad87ac14ef66f2d9fa1c6c73695781ac carry a valid Signed-off-by trailer.

🎉 All receipt checks PASSED for A050-wp-106-labeled-evaluation-runner-and-chaos-suites.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 6 (A045 to A050); work packages since: 0
- Clean-boundary preconditions: met
- Next action: execute task WP-10.7 (Work Package 10 Gate Closure & Handover Snapshot H011)
