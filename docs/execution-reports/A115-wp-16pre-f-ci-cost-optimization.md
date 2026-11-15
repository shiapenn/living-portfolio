# A115 — WP-16.pre-f CI cost optimization

| Field | Value |
| --- | --- |
| Report ID | A115 |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Task ID | `WP-16.pre-f` (PR #155, PR #156) |
| Evidence SHA | `7636430` |
| CI run | `43714236276` (CI & Audit Conformance Gate), `43714236252` (Secret Scan) on `main` |

---

## 1. Scope

1. `[implemented]` **Triage authorization entries (`scripts/triage`, PR #155 `8689916`)**: Added `wp-16-pre-f` / `WP-16.pre-f` identifiers to `isAuthorizedInfraTask` (entries only, no logic change) in a separate PR first.
2. `[implemented]` **Staging deploy trigger restriction (`.github/workflows/deploy-staging.yml`, PR #156 `7636430`)**: Restricted `deploy-staging.yml` to `push.tags: ["v*"]` and `workflow_dispatch` only (removed `push.branches: [main]` and `paths`).
3. `[implemented]` **Backup and restore drill trigger restriction (`.github/workflows/backup-restore-drill.yml`, PR #156 `7636430`)**: Restricted `backup-restore-drill.yml` to a weekly schedule (`cron: '0 2 * * 0'`) and `workflow_dispatch` only (removed nightly cron and `push`/`pull_request` triggers). Gitleaks (`secrets.yml`) remains on every change; `scripts/gitleaks-checksums.json` and check scripts were not modified.

---

## 2. CI Evidence

*Note: All durations below are wall-clock minutes/seconds (the GitHub Actions `billable` field returns `0` for this repository).*

- `main` push CI & Audit Conformance Gate (`43714236276`): `success` — wall-clock job durations: `Detect Changed Scope` 14s (0.23m), `Typecheck, Unit, Security Regression, DCO & Audit Gate` 1m54s (1.90m), `Playwright End-to-End Suite` 2m25s (2.42m).
- `main` push Secret Scan (`43714236252`): `success` — wall-clock duration: 15s (0.25m).
- Staging Automated Continuous Deployment and Backup & Scratch Restore Drill did not trigger on push to `main` (`7636430`), confirming the cost-reduction trigger changes.
- Local pre-push `pnpm verify` (all 15 gates) and `pnpm --filter @living-portfolio/api exec vitest run src/conformance/backup-restore.conformance.test.ts src/conformance/staging-deploy.conformance.test.ts` (`25/25` passed): `local output` passed.

---

## 3. Tests Added and Count Change

- Existing tests updated (reason: workflow triggers intentionally changed from `push.branches: [main]` / nightly `0 2 * * *` to `v*` tags / weekly `0 2 * * 0` + `workflow_dispatch`):
  - `apps/api/src/conformance/staging-deploy.conformance.test.ts` (`is triggered by v* tags and manual dispatch`)
  - `apps/api/src/conformance/backup-restore.conformance.test.ts` (`cron: '0 2 * * 0'`, `workflow_dispatch:`, no `branches: [main]`)
- Existing tests removed: **None** (0 removed; total test count unchanged).

---

## 4. Files Touched

- `.github/workflows/backup-restore-drill.yml`
- `.github/workflows/deploy-staging.yml`
- `apps/api/src/conformance/backup-restore.conformance.test.ts`
- `apps/api/src/conformance/staging-deploy.conformance.test.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A114-wp-16-gate-g16-closure.md`
- `docs/handovers/H017-wp-16-admin-shell-entries-gate-closure.md`
- `docs/plans/gates.json`
- `scripts/triage`

---

## 5. Register and Backlog Changes

- None.

---

## 6. Not Done (Tagged)

- `[not-started]` `WP-16.pre-g` (Dependabot alert #5), P0 editor body check, and `WP-16.R` Minimal Visual Reset (`R0`–`R4`).

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A115 --offline
=== Validating Receipt A115-wp-16pre-f-ci-cost-optimization.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '7636430' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff dff335a..7636430 (10 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A115-wp-16pre-f-ci-cost-optimization.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A115-wp-16pre-f-ci-cost-optimization.md.
```

---

## 9. Handover Decision
- Decision: NOT REQUIRED
- Rule(s): HO-R0
- Receipts since last handover: 1 (A115); work packages since: 0
- Clean-boundary preconditions: met
- Next action: `WP-16.pre-g` (close Dependabot alert #5).
