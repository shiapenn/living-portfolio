# A088 — WP-14.pre-c CI cost control

| Field | Value |
| --- | --- |
| Report ID | A088 |
| Date | 2026-11-10 |
| Author | A (Implementer) |
| Task ID | `WP-14.pre-c` |
| Evidence SHA | 09f7fe7 |
| CI run | local verify (`pnpm verify`) green |

---

## 1. Scope

- [implemented] **Staging Build/Push Path Filtering & Platform Scoping (`.github/workflows/deploy-staging.yml`):** Restricted staging workflow triggers to changes in `apps/**`, `packages/**`, `docker/**`, `deploy/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, and `.github/workflows/deploy-staging.yml`. Configured Docker Buildx `platforms` to build `linux/amd64` only outside release tags (`linux/amd64,linux/arm64` on `refs/tags/v*` only), eliminating QEMU `arm64` emulation overhead on `main` pushes.
- [implemented] **CodeQL Docs-Only Job Skip & Weekly Schedule (`.github/workflows/codeql.yml`):** Added lightweight `detect-changes` job (`node scripts/changed-scope`) so that `analyze` (`CodeQL (JavaScript / TypeScript)`) is skipped at the job level (`0s`) on docs-only changes while still starting the workflow and reporting status, and retained the weekly scheduled run (`cron: "30 3 * * 1"`).
- [implemented] **CI E2E Job Skip on Docs-Only Changes (`.github/workflows/ci.yml`):** Added lightweight `detect-changes` job and configured `playwright-e2e` (`Playwright End-to-End Suite`) to skip at the job level on docs-only changes while `ci-and-audit-gate` continues running all audit, DCO, receipt, hardcode, and documentation conformance checks.
- [implemented] **PR Concurrency Cancellation & Gitleaks Preservation (`.github/workflows/ci.yml`, `codeql.yml`, `secrets.yml`, `deps.yml`):** Configured `concurrency` groups keyed by `${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}` with `cancel-in-progress: true` on pull requests. Preserved `scripts/gitleaks-checksums.json` and Gitleaks execution on every change including docs.
- [implemented] **Dependabot Configuration (`.github/dependabot.yml`):** Added `.github/dependabot.yml` with grouped minor/patch updates (`production-dependencies`, `development-dependencies`, `github-actions`), weekly Monday schedule (`04:00 UTC`), and low open-PR limits (`3` for `npm`, `2` for `github-actions`).
- [implemented] **Gate WP-14 Reopening, New Findings Registration & UI Contract Amendment (`docs/plans/gates.json`, `docs/audits/register.yml`, `docs/plans/P004-ux-remediation-work-packages.md`):** Reopened gate `WP-14` in `gates.json` (`closingReceipt: null`, `handover: null`, added `WP-14.7` to `requiredTaskIds`; recording the deviation that PRs #104 and #105 closed the gate and merged `H015` prior to owner walkthrough completion). Reopened `20261106-UX-04` (`status: partial`) and registered `20261106-UX-57` (P0), `20261106-UX-58` (P2), `20261106-UX-59` (P1), and `20261106-UX-60` (P2). Recorded the owner-approved UI Contract Amendment (`D-UI-1` to `D-UI-6` and `D-ORDER`) in `P004` §1.1 and §7.5–§7.7.

---

## 2. CI Evidence

Local verification (`pnpm verify`, 14/14 steps passed):
- Step 1: Build & Typecheck (`turbo run build` across 8 packages) PASSED.
- Step 2: Environment Sync & Drift Check (OSR-03) PASSED.
- Step 3: OpenAPI Specification & Contract Drift Check (OSR-12) PASSED.
- Step 4: Frontend & Backend Decoupling Rules (OSR-13) PASSED.
- Step 5: Hard-Code Inventory Scan (OSR-01) PASSED.
- Step 6: Developer Certificate of Origin (OSR-07 dco) PASSED.
- Step 7: Documentation Identity & Registry Check (IAHP PROC-1) PASSED.
- Step 8: Handover Protocol Conformance (IAHP HO-1) PASSED.
- Step 9: Audit Governance & Conformance Check (DR-AUD-001) PASSED.
- Step 10: CSS Custom Property Definition Check (WP-14.6, UI-01, UI-03) PASSED (0 undefined variables).
- Step 11: SARIF Static Analysis Baseline Gate PASSED.
- Step 12: Gitleaks Secret Scan PASSED (0 leaks).
- Step 13: GitHub Action SHA Pins Verification (CI fix 3a) PASSED (40 pins).
- Step 14: Unit, Conformance & P0 Regression Suites PASSED (365/365 tests in 43 files).

---

## 3. Tests Added and Count Change

- Existing conformance suites (`staging-deploy.conformance.test.ts`, `production-deploy.conformance.test.ts`, `changed-scope.conformance.test.ts`, `verify-action-pins`) verified against updated workflow definitions.
- Total unit & conformance count: 365 tests across 43 files.
- Total Playwright E2E count: 77 tests across 19 files.

---

## 4. Files Touched

- .github/dependabot.yml
- .github/workflows/ci.yml
- .github/workflows/codeql.yml
- .github/workflows/deploy-staging.yml
- .github/workflows/deps.yml
- .github/workflows/secrets.yml
- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A078-wp-140a-visible-editor-results.md
- docs/execution-reports/A087-wp-14-entry-lifecycle-integrity-gate-closure.md
- docs/handovers/H015-wp-14-entry-lifecycle-integrity-gate-closure.md
- docs/plans/P004-ux-remediation-work-packages.md
- docs/plans/gates.json

---

## 5. Register and Backlog Changes

Register counts: 116 fixed, 10 partial, 49 open (P0: 2, P1: 26, P2: 21; Total: 175).
- `20261106-UX-04`: fixed -> partial (reopened for `WP-14.7`: `#btn-undo-inline` in `#editor-status-line` is static and Undo after Save draft does not restore earlier text).
- `20261106-UX-57`: registered as `open` (P0, two Publish buttons side by side and potential private-detail check bypass; scheduled for `WP-14.7`).
- `20261106-UX-58`: registered as `open` (P2, pre-flight dialog headings read `"1"`, `"3"`, `"4"` when NDA section is hidden; scheduled for `WP-14.7`).
- `20261106-UX-59`: registered as `open` (P1, Unlisted public list exclusion and direct-link reachability verification; scheduled for `WP-14.7`).
- `20261106-UX-60`: registered as `open` (P2, toasts disappear after 6s without hover/focus pause or dismiss button and repeat inline message; scheduled for `WP-15.3` / `WP-15.7` under `D-UI-2`).

---

## 6. Not Done (Tagged)

- [not-started] `WP-14.7`: Entry lifecycle hotfix (server-enforced private-detail scan across all publish paths, single Publish button, working Undo in status line and toast for Unpublish and Save draft, dynamic dialog numbering, Unlisted public exclusion & direct-link E2E verification).
- [not-started] Gate G14 Closing Report (`A090`): To be authored after `WP-14.7` merges and throwaway PR timing proofs complete.

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A088
=== Validating Receipt A088-wp-14pre-c-ci-cost-control.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '09f7fe7' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff c43b846..09f7fe7 (14 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A088-wp-14pre-c-ci-cost-control.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A088-wp-14pre-c-ci-cost-control.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 14 (A075 through A088); work packages since: 0 (WP-14 reopened pending WP-14.7)
- Clean-boundary preconditions: not met (WP-14.7 hotfix pending before Gate G14 closure)
- Next action: Execute two throwaway PRs to prove CI cost control, then execute task `WP-14.7`
