# A134 — WP-16.pre-h CodeQL Pull Request Trigger

| Field | Value |
| --- | --- |
| Report ID | A134 |
| Date | 2026-11-17 |
| Author | A (Implementer) |
| Task ID | `WP-16.pre-h` |
| Evidence SHA | `d5d6becf5daac655c99724cb9c2b7b4ab8bd7919` |
| CI run | 44018799228 |

---

## 1. Scope

Executed `WP-16.pre-h` (CodeQL `pull_request` trigger):
- [implemented] Added `pull_request:` trigger (without path filters) to `.github/workflows/codeql.yml`, keeping the weekly `schedule` and `workflow_dispatch` triggers, with a comment explaining that this is free because the repository is public and exists so the required check always reports.
- [implemented] Verified on `PR #195` (`feat/wp-16-pre-h-codeql-pr-trigger`) that the check named `CodeQL (JavaScript / TypeScript)` ran and passed (`1m35s`, SARIF gate passed).
- [implemented] No other workflow was modified; staging deploy stays on tags and dispatch; Playwright job-level skip stays.

## 2. CI Evidence

- Prep `scripts/triage` identifier PR `#194` merged to `main` at `55ed605`.
- `WP-16.pre-h` PR `#195` merged to `main` at `d5d6becf5daac655c99724cb9c2b7b4ab8bd7919`.
- `PR #195` checks: `CodeQL (JavaScript / TypeScript)` (`success`), `CI & Audit Conformance Gate` run `44017331921` (`success` after rerun of transient `@living-portfolio/db` `pg_extension_name_index` race), `Playwright End-to-End Suite` (`success`), `Detect Changed Scope` (`success`), `Secret Scan` (`success`).
- `main` push CI run `44018799228` (`CI & Audit Conformance Gate`): triggered on merge commit `d5d6becf5daac655c99724cb9c2b7b4ab8bd7919`.

## 3. Tests Added and Count Change

- No test count change (workflow configuration change only).

## 4. Files Touched

- `.github/workflows/codeql.yml`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A133-wp-16pre-i-codeql-alerts-and-public-hygiene.md`
- `scripts/triage`

## 5. Register and Backlog Changes

None.

## 6. Not Done (Tagged)

- [not-started] `WP-16.S S1`–`S4`: Resume system simplification pass (`feat/wp-16s-s1-foundations`).

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A134
=== Validating Receipt A134-wp-16pre-h-codeql-pr-trigger.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'd5d6becf5daac655c99724cb9c2b7b4ab8bd7919' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff a771cf21729ef87c522688f18dea2b471ac2c288..d5d6becf5daac655c99724cb9c2b7b4ab8bd7919 (5 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A134-wp-16pre-h-codeql-pr-trigger.md.
✓ [CI-LOG-CHECK] CI run 44018799228 verified on GitHub (conclusion: success).

🎉 All receipt checks PASSED for A134-wp-16pre-h-codeql-pr-trigger.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 118 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.S` S1–S4 remaining; handover deferred until `WP-16.S` closure)
- Next action: land `A134` docs-only PR (proving `CodeQL (JavaScript / TypeScript)` reports and passes on docs-only PRs), then resume `WP-16.S S1` (`feat/wp-16s-s1-foundations`).


