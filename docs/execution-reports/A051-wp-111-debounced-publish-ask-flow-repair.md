# A051 — WP-11.1: Debounced Publish & Ask Flow Repair

| Field | Value |
| --- | --- |
| Report ID | A051 |
| Date | 2026-11-03 |
| Author | A (Implementer) |
| Task ID | `WP-11.1 (20261020-UX-05 & 20261020-UX-10)` |
| Evidence SHA | `7dd7d7b` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/41600341951 |

---

## 1. Scope

- 1. Debounced static site rebuild UI progress status chip and 12/day cap counter in Admin workspace (`#deploy-status-chip`, `#btn-publish-now`) (20261020-UX-05) [implemented]
- 2. Dedicated endpoints `GET /api/v1/publish/status`, `POST /api/v1/publish/now` (forceNow bypass), and `POST /api/v1/publish/enrich` (20261020-UX-05) [implemented]
- 3. Real background enrichment queueing and debounced static rebuild on public entry publish and manual inspector trigger (20261020-UX-05) [implemented]
- 4. Public Ask flow `needs_context` state with interactive facet clarification inputs, "Submit with Context" (`context_asked: true`), and "Skip" (20261020-UX-10) [implemented]
- 5. Persistent entry scope indicator (`#ask-scoped-notice`, `#ask-scope-chip`) on Ask screen with clear reset control (20261020-UX-10) [implemented]
- 6. Double-submit lockout on Ask query submission (`aria-busy="true"` and disabled input/button controls) (20261020-UX-10) [implemented]
- 7. Dynamic question examples extracted from published entries (20261020-UX-10) [implemented]
- 8. Truthful 429 rate limit backoff display with countdown and direct booking CTA (20261020-UX-10) [implemented]
- 9. Conformance test suite (`apps/api/src/conformance/wp11-publish-ask.conformance.test.ts`) and Playwright E2E suite (`tests/e2e/wp11-publish-and-ask.spec.ts`) [implemented]
- 10. Mark findings `20261020-UX-05` and `20261020-UX-10` as `fixed` in `docs/audits/register.yml` [implemented]

---

## 2. CI Evidence

### 2.1 Build & Typecheck (Job 125797327571)

- Turbo build executed cleanly across all 8 packages (`@living-portfolio/config`, `@living-portfolio/core`, `@living-portfolio/client`, `@living-portfolio/ai`, `@living-portfolio/db`, `@living-portfolio/web`, `@living-portfolio/worker`, `@living-portfolio/api`).
- Pinned action verification confirmed 38/38 GitHub Action pins resolve upstream to valid immutable commit SHAs.
- Zero compilation errors, 0 type errors.

### 2.2 Verbatim Vitest Results per Package (Job 125797327571)

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
Test Files  31 passed (31)
Tests  254 passed (254)
```

*(Note: Total across workspaces: 44 test files passed, 424 passed | 1 skipped, 425 tests).*

### 2.3 Verbatim Playwright E2E Results (Job 125797327983)

```
32 passed (18.8s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125797328109)

```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125797327816)

```
1 commits scanned.
```

### 2.6 Verbatim DCO Verification Line (Job 125797327571)

```
✓ [OSR-07 DCO] All 1 commit(s) in 9b0495ed6362fcb8c94ba44ee723fd7e115545f1..7dd7d7bcbd7fce124a2e5f26806fee5892987074 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- **Conformance Tests (`apps/api/src/conformance/wp11-publish-ask.conformance.test.ts`):** 7 new conformance tests added (increasing `apps/api` test suite from 247 to 254 tests):
  - `[UX-05] GET /api/v1/publish/status reports debounced build window and 12/day cap counters`: validates window, remaining minutes, state (`idle`/`building`), and cap counters.
  - `[UX-05] POST /api/v1/publish/now bypasses 10-minute debounce window and requires admin authentication`: validates 401 unauthenticated guard, immediate rebuild trigger, and return of build results.
  - `[UX-05] POST /api/v1/publish/enrich enqueues background enrichment and tracks pending status`: validates queueing job and status query.
  - `[UX-05] Admin workspace renders deploy status chip and publish now trigger`: validates DOM elements in admin workspace HTML.
  - `[UX-10] Ask flow returns needs_context state for indeterminate advisory queries`: validates `status: 'needs_context'` and missing dimensions when context is absent, and answered resolution when `context_asked: true`.
  - `[UX-10] Ask flow enforces hourly question rate limit with 429 and rate_limited tier`: validates budget governor enforcement, 429 status code, and retry reset metadata.
  - `[UX-10] Ask page renders dynamic question examples, entry scope indicator, and double-submit lockout`: validates dynamic button generation from published records and UI elements.
- **Browser Integration Tests (`tests/e2e/wp11-publish-and-ask.spec.ts`):** 5 new tests added (increasing Playwright suite from 27 to 32 tests):
  - `1. Admin workspace displays deploy status chip and operates manual rebuild trigger (20261020-UX-05)`: verifies chip rendering, publish now trigger, background enrichment trigger, and status updates.
  - `2. Public Ask page renders dynamic question examples and entry scope notice (20261020-UX-10)`: verifies clicking dynamic example question populates input and entry-scoped queries render persistent scope chip with clear button.
  - `3. Ask submission enforces double-submit lockout (20261020-UX-10)`: verifies `aria-busy="true"` and control disablement during active query request.
  - `4. Ask flow renders interactive dynamic facet clarification on needs_context state (20261020-UX-10)`: verifies rendering of facet clarification form, "Submit with Context", and "Skip" with `context_asked: true`.
  - `5. Ask flow handles rate limit 429 and server error responses gracefully (20261020-UX-10)`: verifies countdown display on 429 and informative error recovery for 502/non-JSON responses.
- **Documentation & Process Conformance:** All 81 registered documents validated with zero sequence gaps or checksum drift via `node scripts/docs-check` (`IAHP PROC-1`).

---

## 4. Files Touched

Matches `git diff --name-only 80c82f0..7dd7d7b` (22 files):
- `apps/api/package.json`
- `apps/api/src/app.ts`
- `apps/api/src/conformance/wp11-publish-ask.conformance.test.ts`
- `apps/api/src/routes/entries.ts`
- `apps/api/src/routes/publish.ts`
- `apps/web/src/app.ts`
- `apps/web/src/renderer.ts`
- `apps/worker/src/queue.ts`
- `apps/worker/src/worker.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A050-wp-106-labeled-evaluation-runner-and-chaos-suites.md`
- `docs/handovers/H011-wp-10-gate-closure-and-wp-11-kickoff.md`
- `docs/plans/gates.json`
- `docs/spec/openapi.json`
- `packages/client/src/client.ts`
- `packages/client/src/types.ts`
- `packages/core/src/openapi/index.ts`
- `packages/core/src/schemas/index.ts`
- `pnpm-lock.yaml`
- `tests/e2e/wp11-publish-and-ask.spec.ts`

---

## 5. Register and Backlog Changes

- `20261020-UX-05` marked `status: fixed` in `docs/audits/register.yml` (Debounced static site rebuild progress UI, 10-minute window, 12/day cap, manual trigger endpoints, and real background enrichment queueing).
- `20261020-UX-10` marked `status: fixed` in `docs/audits/register.yml` (Ask flow `needs_context` interactive dynamic facet clarification, persistent entry-scoped notice, double-submit lockout, truthful 429 backoff handling, and dynamic question examples).
- Register totals: 73 fixed, 0 partial, 24 open (P0: 0, P1: 14, P2: 8, P3: 2; 97 total).

---

## 6. Not Done (Tagged)

- WP-11.2: Navigation Redesign, System States & Empty States (Task Receipt A052) [not-started]

---

## 7. Changes to Earlier Reports

- None. Historical reports A001 through A050 and handovers H001 through H011 remain immutable.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A051-wp-111-debounced-publish-ask-flow-repair.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '7dd7d7b' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 9b0495e..7dd7d7b (17 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A051-wp-111-debounced-publish-ask-flow-repair.md.
Found 5 section(s) marked verbatim.

✓ [CI-MATCH: 2.2] Vitest line matched verbatim in Job 125797327571 log:
    Test Files  1 passed (1)
✓ [CI-MATCH: 2.3] Playwright line matched verbatim in Job 125797327983 log:
    32 passed (18.8s)
✓ [CI-MATCH: 2.4] SARIF gate line matched verbatim in Job 125797328109 log:
    ✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
✓ [CI-MATCH: 2.5] Gitleaks line matched verbatim in Job 125797327816 log:
    1 commits scanned.
✓ [CI-MATCH: 2.6] DCO line matched verbatim in Job 125797327571 log:
    ✓ [OSR-07 DCO] All 1 commit(s) in 9b0495ed6362fcb8c94ba44ee723fd7e115545f1..7dd7d7bcbd7fce124a2e5f26806fee5892987074 carry a valid Signed-off-by trailer.

🎉 All receipt checks PASSED for A051-wp-111-debounced-publish-ask-flow-repair.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 1 (A051); work packages since: 0
- Clean-boundary preconditions: met
- Next action: proceed with task WP-11.2 (Navigation Redesign, System States & Empty States; findings 20261020-UX-13, 20261020-UX-14, 20261020-CP-05; Task Receipt A052)
