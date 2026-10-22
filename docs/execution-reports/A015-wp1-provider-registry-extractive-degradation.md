# A015 — WP-1 Task 5: Config-Driven Provider Registry & Extractive Degradation

| Field | Value |
| --- | --- |
| Report ID | A015 |
| Date | 2026-10-22 |
| Author | A (Implementer) |
| Task ID | `WP-1.5` |
| Evidence SHA | `35685db` |
| CI run | `https://github.com/shiapenn/living-portfolio/actions/runs/39736922928` |
| Verified By | `L` |

---

## 1. Scope
Delivery of WP-1 Task 5 (`WP-1.5`) and CI workflow optimization remediation authorized by L:
1. **CI Workflow Optimizations (`5b9b786`):**
   - Implemented ruleset-safe docs-only fast-pass detection in `ci.yml` and `codeql.yml` so required checks finish in <15s without leaving status checks pending.
   - Added concurrency cancellation across `ci.yml`, `codeql.yml`, `deps.yml`, and `secrets.yml` on non-main branches (`cancel-in-progress: ${{ github.ref != 'refs/heads/main' }}`).
   - Streamlined `ci-and-audit-gate` to run offline receipt gate and docs conformance tests on docs changes while preserving DCO, action-pin, and audit checks.
   - Restricted `deps.yml` execution to package and lockfile changes.
2. **Config-Driven AI Provider Registry & Extractive Degradation Ladder (`b50f2aa`, `20261021-AI-01`, Spec §10.8, §13.5):**
   - Config-driven AI provider registry (`packages/ai/src/providers/registry.ts`) strictly sourced from `@living-portfolio/config` presets (`free-cloud`, `hobbyist-vps`, `local-only`) without hardcoded literals.
   - Robust extractive degradation ladder in `apps/api/src/routes/ask.ts` cascading across upstream provider failures and 429 rate limits down to deterministic extractive excerpts with Spec §10.8 fixed sentence.
   - Standard provider disclosure lines formatted and returned in API responses (`provider_disclosure` and `aiDisclosure`).
   - Conformance tests in `apps/api` and unit tests in `packages/ai` verifying provider registry resolution, ladder cascade, and disclosure lines.
   - Updated `20261021-AI-01` in `docs/audits/register.yml`.
3. **Web UI Provider Disclosure & Playwright E2E Coverage (`35685db`):**
   - Updated Ask status chip in `apps/web/src/renderer.ts` to use Spec §10.8 verbatim extractive fixed sentence.
   - Surfaced `.provider-disclosure` line in Ask result card supporting `provider_disclosure` and `aiDisclosure`.
   - Hardened `safePath` URL validation against script injection.
   - Added Playwright E2E browser tests in `tests/e2e/providers.spec.ts` covering unconfigured extractive degradation, provider disclosure lines, and synthesized responses.

---

## 2. CI Evidence

### 2.1 Provenance
- Merge Commit on `main`: [`35685db2cd9f2789c64da1171825c67123a6ebfd`](https://github.com/shiapenn/living-portfolio/commit/35685db2cd9f2789c64da1171825c67123a6ebfd) (`35685db`)
- Pull Request: PR #14 (`feat/wp1.5-provider-registry-extractive-degradation`), rebase-merged into `main`.
- CI & Audit Conformance Push Run: [Run 39736922928](https://github.com/shiapenn/living-portfolio/actions/runs/39736922928) (Job `119684677279`)
- Playwright E2E Push Run: [Job 119684677503](https://github.com/shiapenn/living-portfolio/actions/runs/39736922928/job/119684677503)
- CodeQL Push Run: [Run 39736922863](https://github.com/shiapenn/living-portfolio/actions/runs/39736922863) (Job `119684676950`)
- Secret Scan Push Run: [Run 39736922866](https://github.com/shiapenn/living-portfolio/actions/runs/39736922866) (Job `119684676802`)

### 2.2 Verbatim Vitest Results per Package (Job 119684677279)
```
@living-portfolio/config:test:  Test Files  1 passed (1)
@living-portfolio/config:test:  Tests  5 passed (5)
@living-portfolio/ai:test:  Test Files  1 passed (1)
@living-portfolio/ai:test:  Tests  7 passed (7)
@living-portfolio/core:test:  Test Files  1 passed (1)
@living-portfolio/core:test:  Tests  17 passed (17)
@living-portfolio/worker:test:  Test Files  1 passed (1)
@living-portfolio/worker:test:  Tests  4 passed (4)
@living-portfolio/db:test:  Test Files  1 passed (1)
@living-portfolio/db:test:  Tests  2 passed (2)
@living-portfolio/web:test:  Test Files  1 passed (1)
@living-portfolio/web:test:  Tests  5 passed (5)
@living-portfolio/api:test:  Test Files  12 passed (12)
@living-portfolio/api:test:  Tests  79 passed (79)
```
Total tests across packages (computed from the above): 119 tests across 18 test files.

### 2.3 Verbatim Playwright E2E Results (Job 119684677503)
```
  11 passed (10.3s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 119684676950)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 119684676802)
```
Gitleaks binary version: 8.30.1 (configured GITLEAKS_VERSION: 8.30.1)
6:54AM INF 56 commits scanned.
6:54AM INF no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 119684677279)
```
✓ [OSR-07 DCO] All 3 commit(s) in 3a8c38842089b381ab19d0704c986dfaa533d8a7..35685db2cd9f2789c64da1171825c67123a6ebfd carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

### 3.1 Unit and Conformance Tests (+5 tests, 114 -> 119)
1. `packages/ai/src/ai.test.ts` (+2 tests):
   - `resolves configured model providers strictly from configuration schemas and presets (§10.8, §13.5)`
   - `formats standard provider disclosure lines in compliance with Spec §10.8 and §13.5`
2. `apps/api/src/conformance/provider-degradation.conformance.test.ts` (+3 tests):
   - `cascades from failing primary provider to secondary fallback provider along the degradation ladder`
   - `records 429 on budget governor and degrades to fallback provider or extractive excerpts`
   - `verifies that unconfigured provider mode gracefully serves extractive answers without errors`

### 3.2 End-to-End Playwright Tests (+3 tests, 8 -> 11)
- `tests/e2e/auth.spec.ts`: 6 tests covering owner setup wizard, setup lockdown, open redirect sanitization, TOTP login, CSRF token validation, and admin apiClient error handling.
- `tests/e2e/redaction.spec.ts`: 2 tests covering four-state redaction preview, exclusion matching, retry button, NDA confirmation gate, and preview token publication gate.
- `tests/e2e/providers.spec.ts` (+3 tests):
  - `1. Ask page displays query input and example question buttons`
  - `2. Live unconfigured Ask degrades to extractive mode with disclosure and citations`
  - `3. Synthesized answer displays provider disclosure line in the UI (Spec §13.5)`

---

## 4. Files Touched
The following 16 files match git diff `2c0676a..35685db`:
- `.github/workflows/ci.yml`
- `.github/workflows/codeql.yml`
- `.github/workflows/deps.yml`
- `.github/workflows/secrets.yml`
- `apps/api/src/app.ts`
- `apps/api/src/conformance/provider-degradation.conformance.test.ts`
- `apps/api/src/routes/ask.ts`
- `apps/web/src/renderer.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A014-wp1-publish-flow-preview-token.md`
- `packages/ai/src/ai.test.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/providers/registry.ts`
- `tests/e2e/providers.spec.ts`

*Note on base:* The git range `2c0676a..35685db` spans the previous Evidence SHA (`2c0676a`), docs PR #13 (`3a8c388` delivering receipt A014 and updating index/registry), and PR #14 (`35685db` delivering WP-1.5 and CI workflow optimizations). All 16 files touched across this range are listed above and verified verbatim by `scripts/receipt-check`.

---

## 5. Register and Backlog Changes
- `20261021-AI-01`: Status confirmed `fixed`. Added history entry for WP-1.5 documenting config-driven provider registry, extractive degradation ladder, and provider disclosure lines. Pointed regression test binding to `apps/api/src/conformance/provider-degradation.conformance.test.ts`.
- `20261020-UX-03`: Status remains `[partial]` pending persistent database storage of admin settings.
- `20261020-UX-04`: Status remains `open` pending the complete Editor lifecycle implementation (WP-2 / WP-3).
- `20261020-CP-07`: Status remains `open` (extractive and no_match fixed sentences delivered in renderer.ts; remaining CP-07 strings tracked for subsequent packages).

---

## 6. Not Done (Tagged)
- `[partial]` `PATCH /api/settings/redaction` persistence: In-memory persistence active; database persistence deferred to Postgres persistence package.
- `[not-started]` **WP-1 Gate Close (`A016`):** Comprehensive Gate 1b+ summary, fresh-clone verification path, definition-of-done checklist.

---

## 7. Changes to Earlier Reports
- None.

---

## 8. Receipt Gate Self-Validation
```
=== Validating Receipt A015-wp1-provider-registry-extractive-degradation.md ===

✓ [HEADER-CHECK] Mandatory headers verified (7/7 present).
✓ [ANCESTOR-CHECK] Evidence SHA '35685db' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 2c0676a..35685db (16 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A015-wp1-provider-registry-extractive-degradation.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 119684677279)" (14 lines) verified against CI job 119684677279 logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 119684677503)" (1 lines) verified against CI job 119684677503 logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 119684676950)" (3 lines) verified against CI job 119684676950 logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 119684676802)" (3 lines) verified against CI job 119684676802 logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 119684677279)" (1 lines) verified against CI job 119684677279 logs.

🎉 All receipt checks PASSED for A015-wp1-provider-registry-extractive-degradation.md.
```

---

## 9. Handover Decision
- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 1 (A015); work packages since: 0
- Clean-boundary preconditions: met
- Next action: Proceed with WP-1 Gate Close (`A016`)
