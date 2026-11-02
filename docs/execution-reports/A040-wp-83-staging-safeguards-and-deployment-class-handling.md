# A040 — WP-8.3 Staging safeguards and deployment class handling

| Field | Value |
| --- | --- |
| Report ID | A040 |
| Date | 2026-11-02 |
| Author | A (Implementer) |
| Task ID | `WP-8.3 (OSR-19)` |
| Evidence SHA | `1cc1a6b` |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/41403988298 |

---

## 1. Scope

- 1. Inescapable persistent warning banner `"Staging: synthetic data only."` rendered with sticky positioning across public routes (`/home`, `/work`, `/writing`, `/build`, `/timeline`, `/ask`) and admin pages (`/admin`, `/admin/setup`, `/admin/login`) when `DEPLOYMENT_CLASS=staging` (§6.4 item 1) [implemented]
- 2. Search engine indexing prevention via `GET /robots.txt` (`User-agent: *\nDisallow: /\n`), `<meta name="robots" content="noindex, nofollow" />` in HTML header, and `X-Robots-Tag: noindex, nofollow` HTTP response header when `DEPLOYMENT_CLASS=staging` (§6.4 item 2) [implemented]
- 3. Disabled import and connector features on staging returning HTTP 403 with `{ "code": "STAGING_IMPORT_DISABLED", "error": "..." }` across `/api/v1/import`, `/api/v1/import/plan`, `/api/v1/import/batch`, `/api/import/plan`, and `/api/import/batch`, plus visual disabled banner notice in admin import UI (`/admin/import`) (§6.4 item 2) [implemented]
- 4. Synthetic seed isolation enforcing that `POST /api/v1/seed` is strictly rejected with HTTP 403 when `DEPLOYMENT_CLASS=production` (§6.4 item 3, OSR-04) [implemented]
- 5. Gate G4 production startup guard in `@living-portfolio/config` refusing configuration boot when `DEPLOYMENT_CLASS=production` unless `docs/releases/g4-signoff.md` exists (§6.4 item 5, OSR-19) [implemented]
- 6. Full staging safeguards conformance test suite in `apps/api/src/conformance/staging-safeguards.conformance.test.ts` (9 passing tests) [implemented]
- 7. Finding `OSR-19` updated to `status: fixed` in `docs/audits/register.yml` [implemented]

---

## 2. CI Evidence

### 2.1 Build & Typecheck (Job 125141778056)

- Turbo build executed across all 8 packages (`@living-portfolio/config`, `@living-portfolio/core`, `@living-portfolio/client`, `@living-portfolio/ai`, `@living-portfolio/db`, `@living-portfolio/web`, `@living-portfolio/worker`, `@living-portfolio/api`).
- Pinned action verification confirmed 29/29 GitHub Action pins resolve upstream to valid immutable commit SHAs.
- Zero compilation errors, 0 type errors.

### 2.2 Verbatim Vitest Results per Package (Job 125141778056)

```
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  5 passed (5)
Test Files  1 passed (1)
Tests  17 passed (17)
Test Files  1 passed (1)
Tests  17 passed (17)
Test Files  1 passed (1)
Tests  28 passed (28)
Test Files  2 passed (2)
Tests  12 passed (12)
Test Files  4 passed (4)
Tests  45 passed (45)
Test Files  21 passed (21)
Tests  176 passed (176)
```

*(Note: Total across workspaces computed from above: 32 test files passed, 305 tests passed).*

### 2.3 Verbatim Playwright E2E Results (Job 125141778771)

```
24 passed (15.2s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125141778069)

```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125141778717)

```
162 commits scanned.
no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 125141778056)

```
✓ [OSR-07 DCO] All 1 commit(s) in fe22943c1963d158f4d1341331e2e484ae5b435c..1cc1a6bb6a7159d28ff36e2b80ca57162c4bfa90 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

- Unit & Conformance (Vitest): 305 tests across 32 test files (net +9 tests and +1 test file over A039 count of 296 tests across 31 files from `apps/api/src/conformance/staging-safeguards.conformance.test.ts`).
- Staging Safeguards Conformance: All 9 tests in `apps/api/src/conformance/staging-safeguards.conformance.test.ts` pass, verifying:
  - Sticky `"Staging: synthetic data only."` banner across public routes and admin views
  - Absence of staging banner when `DEPLOYMENT_CLASS=development`
  - `GET /robots.txt` disallows all (`User-agent: *\nDisallow: /\n`) and emits `X-Robots-Tag: noindex, nofollow` on staging for web and api
  - Permissive `GET /robots.txt` and sitemap on development/production
  - `STAGING_IMPORT_DISABLED` 403 on all `/api/v1/import` and `/api/import` endpoints
  - Visual disabled notice in admin import UI page
  - Ban on `POST /api/v1/seed` in production mode (403)
  - Gate G4 sign-off record presence check refusing production boot
  - Successful production load when `g4-signoff.md` exists
- Documentation & Process Conformance: All 67 registered documents validated with zero sequence gaps or checksum drift via `node scripts/docs-check` (`IAHP PROC-1`).
- Browser Integration (Playwright): 24 tests (unchanged from A039 count of 24).

---

## 4. Files Touched

Matches `git diff 2e6a261..1cc1a6b`:
- `.env.example`
- `apps/api/src/app.ts`
- `apps/api/src/conformance/staging-safeguards.conformance.test.ts`
- `apps/api/src/routes/import.ts`
- `apps/web/src/app.ts`
- `apps/web/src/index.ts`
- `apps/web/src/renderer.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A039-wp-82-staging-provider-config-and-deploy-workflow.md`
- `packages/config/src/index.ts`

---

## 5. Register and Backlog Changes

- Finding `OSR-19` transitioned from `open` to `fixed`.
  - Regression test: `apps/api/src/conformance/staging-safeguards.conformance.test.ts`
  - Scope: Staging synthetic banner, crawler indexing prevention, disabled import routes, production demo seed ban, and Gate G4 startup guard.
- Status counts in `docs/audits/register.yml`:
  - Fixed: 59 (P0: 32, P1: 22, P2: 5)
  - Partial: 0
  - Open: 38 (P0: 0, P1: 19, P2: 16, P3: 3)
  - Total: 97 findings

---

## 6. Not Done (Tagged)

- WP-8.4: Gate G3 Closure & Handover Snapshot H009 [not-started]
- Work Package 9: Backup, Restore Drill, Observability & Hardening (Gate G4) [not-started]
- Work Package 10: Algorithms, Retrieval & Quality Tuning (Milestone v0.2) [not-started]
- Work Package 11: UX & Structural Information Architecture (Milestone v0.2 UX) [not-started]
- Work Package 12: Visual Polish, Copy & General Availability (Gate G5 / v0.1.0 GA) [not-started]

---

## 7. Changes to Earlier Reports

None. Historical reports A001 through A039 remain frozen and unchanged.

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A040-wp-83-staging-safeguards-and-deployment-class-handling.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '1cc1a6b' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 2e6a261..1cc1a6b (12 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A040-wp-83-staging-safeguards-and-deployment-class-handling.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 125141778056)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 125141778771)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 125141778069)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 125141778717)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 125141778056)" verified against CI logs.

🎉 All receipt checks PASSED for A040-wp-83-staging-safeguards-and-deployment-class-handling.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 3 (A038, A039, A040); work packages since: 0
- Clean-boundary preconditions: met
- Next action: execute WP-8.4 (Gate G3 Closure & Handover Snapshot H009)
