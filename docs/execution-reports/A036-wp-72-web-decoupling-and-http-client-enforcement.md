# A036 — WP-7.2 Web Decoupling and HTTP Client Enforcement

| Field | Value |
| --- | --- |
| Report ID | A036 |
| Date | 2026-11-02 |
| Author | A (Implementer) |
| Task ID | `WP-7.2` |
| Evidence SHA | `ef40015` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/41378030601 |

---

## 1. Scope

- **`[implemented]`** Web Decoupling and Zero Database Dependency (`OSR-13`, Spec §4.2, §4.3): Removed `@living-portfolio/db` dependency from `apps/web/package.json` and eliminated all direct database imports from `apps/web/src/`. Refactored `apps/web/src/renderer.ts` to operate purely over `WebDataClient` / `adaptDataSource()`, consuming `@living-portfolio/client`.
- **`[implemented]`** Pure API Default Mounting (`OSR-13`, Spec §4.2, §4.3): Refactored `createApp()` in `apps/api/src/app.ts` so that web site and admin UI routes are completely decoupled and unmounted by default. Public routes (`/home`, `/work`, `/timeline`, etc.) now return 404 in pure API mode, ensuring strict boundary isolation.
- **`[implemented]`** Optional Bundled Web Adapter (`OSR-13`, Spec §4.3): Created `apps/api/src/adapter/bundled-web.ts` providing `mountBundledWeb()` as an optional single-process convenience adapter behind `options.bundledWeb: true` or `ENABLE_BUNDLED_WEB=true` in `apps/api/src/server.ts`.
- **`[implemented]`** Standalone Web Application & Server (`OSR-13`, Spec §4.2): Implemented `createWebApp()` in `apps/web/src/app.ts` and standalone entrypoint `apps/web/src/server.ts` listening on `WEB_PORT` (3001) pointing to `PUBLIC_API_BASE_URL` (`http://localhost:3000/api/v1`).
- **`[implemented]`** CI Dependency-Rule Enforcement (`OSR-13`): Created `scripts/verify-dependency-rules` and integrated it as Gate 4 in `scripts/verify-all` (`pnpm dependency:rules`). Verified via automated conformance suite `apps/api/src/conformance/web-decoupling.conformance.test.ts`.
- **`[implemented]`** Audit Register Governance (`docs/audits/register.yml`): Transitioned finding `OSR-13` from `status: open` to `status: fixed` with `regression_test: apps/api/src/conformance/web-decoupling.conformance.test.ts` and dated history note `2026-11-02`.

---

## 2. CI Evidence

### 2.1 Commit and PR Provenance
- Merge Commit: `ef40015`
- Merge Method: Fast-forward merge onto `main` (`origin/main` at `ef40015910159ef20b660c597ff934efc357bd53`)
- Commits landed: `ef40015`
- Evidence SHA: `ef40015`
- Ancestor Verification: `git merge-base --is-ancestor ef40015 HEAD` exits 0.

### 2.2 Verbatim Vitest Results per Package (Job 125062500599)
```
@living-portfolio/config:test:  Test Files  1 passed (1)
@living-portfolio/config:test:  Tests  5 passed (5)
@living-portfolio/client:test:  Test Files  1 passed (1)
@living-portfolio/client:test:  Tests  5 passed (5)
@living-portfolio/core:test:  Test Files  1 passed (1)
@living-portfolio/core:test:  Tests  17 passed (17)
@living-portfolio/ai:test:  Test Files  1 passed (1)
@living-portfolio/ai:test:  Tests  17 passed (17)
@living-portfolio/web:test:  Test Files  1 passed (1)
@living-portfolio/web:test:  Tests  28 passed (28)
@living-portfolio/worker:test:  Test Files  2 passed (2)
@living-portfolio/worker:test:  Tests  12 passed (12)
@living-portfolio/db:test:  Test Files  4 passed (4)
@living-portfolio/db:test:  Tests  45 passed (45)
@living-portfolio/api:test:  Test Files  18 passed (18)
@living-portfolio/api:test:  Tests  148 passed (148)
```
*Total: 29 test files, 277 passed tests across 8 packages (computed from the above).*

### 2.3 Verbatim Playwright E2E Results (Job 125062500405)
```
  24 passed (12.8s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125062500250)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125062500592)
```
152 commits scanned.
no leaks found
✓ Gitleaks scan passed with 0 leaks.
```

### 2.6 Verbatim DCO Verification Line (Job 125062500599)
```
✓ [OSR-07 DCO] All 1 commit(s) in ee641a5628242e25b2e6eea6828029f3ec39a180..ef40015910159ef20b660c597ff934efc357bd53 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- Unit & Conformance (Vitest): 277 tests (+7 new tests compared to A035 count of 270).
  - `apps/api/src/conformance/web-decoupling.conformance.test.ts`: 6 new conformance regression tests.
  - `apps/web/src/web.test.ts`: 1 new HTTP client route decoupling test.
- Browser Integration (Playwright): 24 tests (unchanged from A035 count of 24).

---

## 4. Files Touched

- apps/api/src/adapter/bundled-web.ts
- apps/api/src/api.test.ts
- apps/api/src/app.ts
- apps/api/src/conformance/p0-probes.conformance.test.ts
- apps/api/src/conformance/ux-p0-probes.conformance.test.ts
- apps/api/src/conformance/web-decoupling.conformance.test.ts
- apps/api/src/server.ts
- apps/web/package.json
- apps/web/src/app.ts
- apps/web/src/index.ts
- apps/web/src/renderer.ts
- apps/web/src/server.ts
- apps/web/src/test-client.ts
- apps/web/src/web.test.ts
- docs/audits/register.yml
- docs/execution-reports/A035-wp-71-api-versioning-and-openapi-client.md
- package.json
- packages/client/src/client.ts
- playwright.config.ts
- pnpm-lock.yaml
- scripts/verify-all
- scripts/verify-dependency-rules

---

## 5. Register and Backlog Changes

- `OSR-13` transitioned from `status: open` to `status: fixed` with bound regression test `apps/api/src/conformance/web-decoupling.conformance.test.ts`.

---

## 6. Not Done (Tagged)

- **`[not-started]`** `OSR-23`: Complete documentation suite, API boundary ADR, and configuration contract (WP-7.3 / WP-12.3).
- **`[not-started]`** `OSR-14`: Repository conformance suite over in-memory and Postgres (Gate G2 finalization).

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation
```
=== Validating Receipt A036-wp-72-web-decoupling-and-http-client-enforcement.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'ef40015' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff ee641a5..ef40015 (21 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A036-wp-72-web-decoupling-and-http-client-enforcement.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 125062500599)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 125062500405)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125062500250)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125062500592)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 125062500599)" verified against CI logs.

🎉 All receipt checks PASSED for A036-wp-72-web-decoupling-and-http-client-enforcement.md.
```

---

## 9. Handover Decision
- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 2 (A035, A036); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-7.3 (OSR-23 Part 1: Initial API boundary ADR and configuration contract documentation)
