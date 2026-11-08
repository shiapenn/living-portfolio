# A075 — WP-14.pre-a dependency review and triage

| Field | Value |
| --- | --- |
| Report ID | A075 |
| Date | 2026-11-08 |
| Author | A (Implementer) |
| Task ID | `WP-14.pre-a` |
| Evidence SHA | `HEAD` |
| CI run | local verify (`pnpm verify`) green |

---

## 1. Scope

- **`[implemented]` Dependency Review & Triage (23 Dependabot Alerts):** Queried GitHub Dependabot alerts via `gh api repos/shiapenn/living-portfolio/dependabot/alerts` and categorized all 23 active security alerts into runtime vs development-only dependencies across workspace packages.
- **`[implemented]` Runtime Dependency Upgrades:**
  * Upgraded `@hono/node-server` from 1.19.17 to `^2.1.3` (installed 2.1.6 in `apps/api` and `apps/web`), patching medium-severity vulnerability CVE-2026-118663 (GHSA-rmxm-3fg6-px4f: path double-decoding bypass). Verified all Hono server routes, static asset serving, and admin session middlewares.
  * Upgraded `drizzle-orm` from 0.39.3 to `^0.45.2` (installed 0.45.4 in `packages/db`), patching high-severity vulnerability CVE-2026-39356 (GHSA-qxg6-89mg-rqv8: SQL injection in improperly escaped SQL identifiers). Verified Postgres repository, schema, migrations, and dual-write tests.
- **`[implemented]` Reconcile Open Dependabot PRs:**
  * PR #82 (`@hono/node-server` 2.1.3): Closed as superseded by task branch `feat/wp-14-pre-a-dependency-review` after verifying all 360 unit tests and 61 E2E tests pass.
  * PR #85 (`drizzle-orm` 0.45.2): Closed as superseded by task branch `feat/wp-14-pre-a-dependency-review` after verifying database conformance and backup engine pass.
  * PR #83 (`zod` 4.6.6): Evaluated and closed unmerged due to breaking changes in Zod 4 (`z.record` 2-argument requirement throwing TS2554, and AST redesign removing `_def.typeName` which breaks OpenAPI serialization and violates OSR-12 contract drift check).
  * PR #84 (`vitest` 4.1.11): Evaluated and closed unmerged due to breaking changes in Vitest 4 (removal of ambient Node.js type definitions from global scope, breaking packages lacking explicit `@types/node` like `apps/web`). Vitest is a dev-only test runner not bundled in runtime.
- **`[implemented]` Finding Register Update:** Updated finding `20261106-UX-51` in `docs/audits/register.yml` to status `partial`.

---

## 2. CI Evidence

Local verification via `pnpm verify`:
- Build & typecheck (`turbo run build`): PASSED across all 8 packages.
- Conformance gates (OSR-01, OSR-03, OSR-07, OSR-12, OSR-13, IAHP PROC-1, IAHP HO-1, DR-AUD-001): PASSED.
- Unit, conformance, & P0 regression suites: PASSED (360/360 tests in 41 files).
- Playwright E2E suite: PASSED (61/61 tests in 12 files).
- Gitleaks secret scan: PASSED (0 leaks).

---

## 3. Tests Added and Count Change

- No new regression test files added; verified existing test suites pass cleanly with upgraded runtime dependencies:
  * 360 tests in 41 test files in `apps/api` pass.
  * 37 tests in 5 test files in `packages/db` pass.
  * 61 tests in 12 test files in Playwright Chromium pass.

---

## 4. Files Touched

- apps/api/package.json
- apps/web/package.json
- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A074-wp-1314-repair-web-merge-and-register-findings.md
- docs/execution-reports/A075-wp-14pre-a-dependency-review-and-triage.md
- docs/handovers/H014-wp-13-onboarding-and-authentication-gate-closure.md
- docs/plans/P004-ux-remediation-work-packages.md
- docs/plans/execution-protocol.md
- docs/plans/gates.json
- packages/db/package.json
- pnpm-lock.yaml

---

## 5. Register and Backlog Changes

- Updated finding `20261106-UX-51` in `docs/audits/register.yml` from `open` to `partial` with progress note for WP-14.pre-a.

---

## 6. Not Done (Tagged)

- **`[deferred]` Zod 4 migration:** Deferred to dedicated follow-up task due to breaking changes in `z.record` signature and OpenAPI document generation (`zodToOpenApi`).
- **`[deferred]` Vitest 4 migration:** Deferred to dedicated follow-up task due to breaking changes in ambient type exports affecting packages without explicit `@types/node`.
- **`[deferred]` WP-14.pre-b CI download resilience:** Next task on branch `feat/wp-14-pre-b-ci-download-resilience` (authorizing workflow edits for retry loops).

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

```
pnpm receipt:check A075
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5 (internal work package task)
- Receipts since last handover: 1 (A075); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-14.pre-b
