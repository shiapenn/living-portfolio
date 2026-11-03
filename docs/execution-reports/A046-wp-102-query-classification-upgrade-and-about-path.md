# A046 — WP-10.2 Query Classification Upgrade and About Path

| Field | Value |
| --- | --- |
| Report ID | A046 |
| Date | 2026-11-03 |
| Author | A (Implementer) |
| Task ID | `WP-10.2 (M4)` |
| Evidence SHA | `f195156` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/41568820082 |

---

## 1. Scope

- 1. Upgrade visitor query classification from naive substring heuristics to provider-backed classification with graceful deterministic fallback (§10.3, Finding M4, Fix 4, Fix 15) [implemented]
- 2. Curate 24-case benchmark labeled dataset `packages/ai/src/classification/fixtures/query-classification-cases.json` covering lookup (7), advisory (7), about (6), and ambiguous (4) visitor queries (§10.3, §18) [implemented]
- 3. Deterministic query classifier `classifyQuerySync` and model provider classifier `classifyQuery` in `packages/ai/src/classification/classifier.ts` with strict default to `advisory` (`isAmbiguous: true`) for ungrounded or ambiguous queries per Spec §10.3 [implemented]
- 4. Implement dedicated About path in `/api/ask` (`queryClass === 'about'`) synthesized and extracted from About page records, site settings, and verified credentials with `/about` citations (§10.3) [implemented]
- 5. Verify `needs_context` state mechanics with missing hard facets on first-time advisory queries (§10.5, §12.6, G6), and clean pass-through when facets are provided or skipped (`context_asked: true`) [implemented]
- 6. Eliminate polynomial regular expression complexity in `packages/ai/src/classification/classifier.ts` to satisfy CodeQL static analysis and SARIF baseline gate with 0 alerts [implemented]
- 7. Finding `M4` marked `status: fixed` in `docs/audits/register.yml` and Spec section 10.3 marked `status: implemented` in `docs/audits/conformance.yml` [implemented]
- 8. Unit test coverage across all 24 classification fixtures in `packages/ai/src/ai.test.ts` and API conformance suite in `apps/api/src/conformance/m4-query-classification.conformance.test.ts` (4 tests) [implemented]

---

## 2. CI Evidence

### 2.1 Build & Typecheck (Job 125696703988)

- Turbo build executed cleanly across all 8 packages (`@living-portfolio/config`, `@living-portfolio/core`, `@living-portfolio/client`, `@living-portfolio/ai`, `@living-portfolio/db`, `@living-portfolio/web`, `@living-portfolio/worker`, `@living-portfolio/api`).
- Pinned action verification confirmed 38/38 GitHub Action pins resolve upstream to valid immutable commit SHAs.
- Zero compilation errors, 0 type errors.

### 2.2 Verbatim Vitest Results per Package (Job 125696703988)

```
Test Files  1 passed (1)
Tests  17 passed (17)
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  24 passed (24)
Test Files  1 passed (1)
Tests  28 passed (28)
Test Files  2 passed (2)
Tests  16 passed (16)
Test Files  5 passed (5)
Tests  54 passed (54)
Test Files  26 passed (26)
Tests  231 passed (231)
```

*(Note: Total across workspaces: 38 test files passed, 380 passed | 1 skipped, 381 tests).*

### 2.3 Verbatim Playwright E2E Results (Job 125696704226)

```
24 passed (15.5s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125696704032)

```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125696703860)

```
181 commits scanned.
no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 125696703988)

```
✓ [OSR-07 DCO] All 2 commit(s) in ae9fe7190bdc06ed651bd5090c7cf85004cdf5ef..f195156a32c1769c61c14fc97dafc3539da9364a carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- **Unit Tests (`packages/ai/src/ai.test.ts`):** 3 new tests added (increasing `@living-portfolio/ai` suite from 21 to 24 tests):
  - `classifies labeled benchmark query cases accurately (Fix 15, §10.3, §18)`: verifies classification across all 24 labeled cases in `query-classification-cases.json`.
  - `defaults ambiguous and borderline queries to advisory per §10.3 strictness rule`: verifies §10.3 ambiguity rule strictly assigning `advisory` with `isAmbiguous: true`.
  - `classifies queries via ModelProvider and falls back gracefully on provider errors`: verifies provider-backed classification and fallback to deterministic pattern matching.
- **Conformance Tests (`apps/api/src/conformance/m4-query-classification.conformance.test.ts`):** 4 new tests added (increasing `apps/api` test suite from 227 to 231 tests):
  - `routes about queries to dedicated About path with verified credentials and /about citations`: verifies synthesis from About passage and verified credentials with `/about` citations.
  - `routes advisory queries to needs_context when hard facets are missing`: verifies `needs_context` state return when hard facets are absent on first ask.
  - `proceeds to tier1 advisory delivery when context is supplied or skipped`: verifies smooth continuation when hard context is supplied or skipped via `context_asked: true`.
  - `routes lookup queries directly to factual search and synthesis`: verifies factual lookups without unnecessary applicability context prompts.
- **Browser Integration (Playwright):** 24 tests (unchanged from A045 count of 24).
- **Documentation & Process Conformance:** All 75 registered documents validated with zero sequence gaps or checksum drift via `node scripts/docs-check` (`IAHP PROC-1`).

---

## 4. Files Touched

Matches `git diff --name-only 7e0b932..f195156` (14 files):
- `apps/api/src/conformance/m4-query-classification.conformance.test.ts`
- `apps/api/src/routes/ask.ts`
- `docs/INDEX.md`
- `docs/audits/conformance.yml`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A045-wp-101-pre-delivery-entailment-verification-judge.md`
- `packages/ai/src/ai.test.ts`
- `packages/ai/src/classification/classifier.ts`
- `packages/ai/src/classification/fixtures/query-classification-cases.json`
- `packages/ai/src/classification/index.ts`
- `packages/ai/src/classification/types.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/providers/adapters/mock.ts`

---

## 5. Register and Backlog Changes

- `M4` marked `status: fixed` in `docs/audits/register.yml` (Query classification upgrade from substring heuristics to provider-backed classification with graceful deterministic fallback, About path, and needs_context state).
- Section `10.3` marked `status: implemented` in `docs/audits/conformance.yml`.
- Register totals: 66 fixed, 0 partial, 31 open (P0: 0, P1: 16, P2: 12, P3: 3; 97 total).

---

## 6. Not Done (Tagged)

- WP-10.3: Self-calibration routing calibration (sliding-window metrics, held-out validation, ECE, freeze guard, state rollback; Finding M5 [P2], Fix 16) [not-started]
- WP-10.4: Dynamic topology audit detector (M6 [P2]) & Scope-overlap staleness detector (M7 [P2]) [not-started]

---

## 7. Changes to Earlier Reports

- None. Historical receipts A001 through A045 and handovers H001 through H010 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A046-wp-102-query-classification-upgrade-and-about-path.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'f195156' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 7e0b932..f195156 (14 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A046-wp-102-query-classification-upgrade-and-about-path.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 125696703988)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 125696704226)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125696704032)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125696703860)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 125696703988)" verified against CI logs.

🎉 All receipt checks PASSED for A046-wp-102-query-classification-upgrade-and-about-path.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 2 (A045, A046); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-10.3 (Finding M5 [P2])
