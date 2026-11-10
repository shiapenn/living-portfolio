# A075 — WP-14.pre-a dependency review and triage

| Field | Value |
| --- | --- |
| Report ID | A075 |
| Date | 2026-11-08 |
| Author | A (Implementer) |
| Task ID | `WP-14.pre-a` |
| Evidence SHA | 22a26bb |
| CI run | local verify (`pnpm verify`) green |

---

## 1. Scope

- [implemented] Dependency Review & Triage (23 Dependabot Alerts): Queried GitHub Dependabot alerts via `gh api repos/shiapenn/living-portfolio/dependabot/alerts` and categorized all 23 active security alerts into runtime vs development-only dependencies across workspace packages.
- [implemented] Runtime Dependency Upgrades: Upgraded `@hono/node-server` from 1.19.17 to `^2.1.3` (installed 2.1.6 in `apps/api` and `apps/web`), patching CVE-2026-118663. Upgraded `drizzle-orm` from 0.39.3 to `^0.45.2` (installed 0.45.4 in `packages/db`), patching CVE-2026-39356. Verified Postgres repository, schema, migrations, dual-write tests, and server routes.
- [implemented] Reconcile Open Dependabot PRs: PR #82 (@hono/node-server 2.1.3) and PR #85 (drizzle-orm 0.45.2) closed as superseded by task branch feat/wp-14-pre-a-dependency-review. PR #83 (zod 4.6.6) closed unmerged due to breaking changes (TS2554 on z.record, OpenAPI AST breakage violating OSR-12). PR #84 (vitest 4.1.11) closed unmerged due to breaking changes (ambient types drop in apps/web; dev-only runner).
- [implemented] Finding Register Update: Updated finding `20261106-UX-51` in `docs/audits/register.yml` to status `partial`.

---

## 2. CI Evidence

Local verification via `pnpm verify`:
- Build & typecheck (`turbo run build`): PASSED across all 8 packages.
- Conformance gates (OSR-01, OSR-03, OSR-07, OSR-12, OSR-13, IAHP PROC-1, IAHP HO-1, DR-AUD-001): PASSED.
- Unit, conformance, & P0 regression suites: PASSED (360/360 tests in 41 files).
- Playwright E2E suite: PASSED (61/61 tests in 12 files).
- Gitleaks secret scan: PASSED (0 leaks).

Note: The GitHub Actions Dependency Review workflow (`.github/workflows/deps.yml`) is non-gating on this repository (unsupported on this private repository without GitHub Advanced Security; configured with `continue-on-error: true`). No compliance or gate evidence is cited from it.

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

- Register counts: 108 fixed, 7 partial, 54 open (total 169 findings).
- Updated finding `20261106-UX-51` in `docs/audits/register.yml` from `open` to `partial` with progress note for WP-14.pre-a.

---

## 6. Not Done (Tagged)

- [not-started] Zod 4 migration: Deferred to dedicated follow-up task due to breaking changes in `z.record` signature and OpenAPI document generation (`zodToOpenApi`).
- [not-started] Vitest 4 migration: Deferred to dedicated follow-up task due to breaking changes in ambient type exports affecting packages without explicit `@types/node`.
- [not-started] WP-14.pre-b CI download resilience: Next task on branch `feat/wp-14-pre-b-ci-download-resilience` (authorizing workflow edits for retry loops).

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A075
=== Validating Receipt A075-wp-14pre-a-dependency-review-and-triage.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '22a26bb' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 806e6c7..22a26bb (13 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A075-wp-14pre-a-dependency-review-and-triage.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A075-wp-14pre-a-dependency-review-and-triage.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 1
- Clean-boundary preconditions: met
- Next action: continue with task WP-14.pre-b
