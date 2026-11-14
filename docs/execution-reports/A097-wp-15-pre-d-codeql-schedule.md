# A097 — WP-15.pre-d CodeQL Weekly Schedule and Manual Dispatch

| Field | Value |
| --- | --- |
| Report ID | A097 |
| Date | 2026-11-14 |
| Author | A (Implementer) |
| Task ID | `WP-15.pre-d` |
| Evidence SHA | `ae468e4` |
| CI run | `chore/wp-15-pre-d-codeql-schedule` (local `pnpm verify` 14/14 passed; PR checks green before merge) |

---

## 1. Scope

WP-15.pre-d reduces GitHub Actions minutes by running `.github/workflows/codeql.yml` on a weekly schedule (`cron: "30 3 * * 1"`) and manual dispatch (`workflow_dispatch`) only, rather than on every `push` and `pull_request`:
- Confirmed via `gh api repos/shiapenn/living-portfolio/code-scanning/alerts` (`HTTP 403: Code scanning is not enabled for this repository`) and CodeQL run `43589907422` logs (`upload: never`, `Upload SARIF to GitHub Code Scanning` skipped, warning: `Code scanning is not enabled for this repository`) that SARIF results are not uploaded or stored in GitHub Code Scanning on this private repository (GitHub Code Scanning on private repos requires paid GitHub Advanced Security / Code Security).
- Updated `.github/workflows/codeql.yml` to trigger on `schedule` and `workflow_dispatch` only, removing `push`, `pull_request`, and the redundant `detect-changes` job.
- Preserved `.github/workflows/secrets.yml` (Gitleaks on every push/PR), `scripts/gitleaks-checksums.json`, all check scripts, and all required audit/doc gates.

## 2. CI Evidence

- `pnpm receipt:check A097`: PASSED.
- `pnpm verify`: 14/14 gates passed.

## 3. Tests Added and Count Change

- No test count change (workflow-only change authorised for `WP-15.pre-d`).

## 4. Files Touched

- `.github/workflows/codeql.yml`
- `docs/INDEX.md`
- `docs/doc-registry.json`

## 5. Register and Backlog Changes

- None.

## 6. Not Done (Tagged)

- None.

## 7. Deviations and Rule Compliance

- Owner explicitly authorised editing `.github/workflows/codeql.yml` for `WP-15.pre-d` only, without touching `scripts/gitleaks-checksums.json` or any check script.

## 8. Open Risks

- Weekly CodeQL runs continue to execute `node scripts/sarif-gate` and upload `codeql-sarif` workflow artifacts; GitHub Code Scanning UI remains disabled unless GitHub Code Security is enabled or the repository is made public.

## 9. Next Step

- Merge `chore/wp-15-pre-d-codeql-schedule` into `main` with a merge commit on green CI.
