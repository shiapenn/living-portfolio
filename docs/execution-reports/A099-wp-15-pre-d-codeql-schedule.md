# A099 — WP-15.pre-d CodeQL Weekly Schedule and Manual Dispatch

| Field | Value |
| --- | --- |
| Report ID | A099 |
| Date | 2026-11-14 |
| Author | A (Implementer) |
| Task ID | `WP-15.pre-d` |
| Evidence SHA | `e328c24` |
| CI run | `chore/wp-15-pre-d-codeql-schedule` (local `pnpm verify` 14/14 passed; PR #129 checks pending) |

---

## 1. Scope

WP-15.pre-d reduces GitHub Actions minutes by running `.github/workflows/codeql.yml` on a weekly schedule (`cron: "30 3 * * 1"`) and manual dispatch (`workflow_dispatch`) only, rather than on every `push` and `pull_request`:
- Confirmed via `gh api repos/shiapenn/living-portfolio/code-scanning/alerts` (`HTTP 403: Code scanning is not enabled for this repository`) and CodeQL run `43589907422` logs (`upload: never`, `Upload SARIF to GitHub Code Scanning` skipped, warning: `Code scanning is not enabled for this repository`) that SARIF results are not uploaded or stored in GitHub Code Scanning on this private repository (GitHub Code Scanning on private repos requires paid GitHub Advanced Security / Code Security).
- [implemented] Updated `.github/workflows/codeql.yml` to trigger on `schedule` and `workflow_dispatch` only, removing `push`, `pull_request`, and the redundant `detect-changes` job.
- Preserved `.github/workflows/secrets.yml` (Gitleaks on every push/PR), `scripts/gitleaks-checksums.json`, all check scripts, and all required audit/doc gates.

**Protected-file authorisation (quoted):**
> "PR #129 (CodeQL weekly schedule): triage gate [9/14] asks for human confirmation because .github/workflows/codeql.yml is protected. I authorised this edit for WP-15.pre-d in my earlier message."

## 2. CI Evidence

- `pnpm receipt:check A099`: PASSED.
- `pnpm triage`: PASSED (`TRIAGE: PROCEED`).

## 3. Tests Added and Count Change

- No test count change (workflow-only change authorised for `WP-15.pre-d`).

## 4. Files Touched

- `.github/workflows/codeql.yml`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A098-wp-15pre-e-triage-allowlist.md`
- `docs/execution-reports/A099-wp-15-pre-d-codeql-schedule.md`

## 5. Register and Backlog Changes

- None.

## 6. Not Done (Tagged)

None.

## 7. Changes to Earlier Reports

- None.

## 8. Receipt Gate Self-Validation

```
pnpm receipt:check A099
```
All receipt checks PASSED.

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 9 (A091, A092, A093, A094, A095, A096, A097, A098, A099); work packages since: 0
- Clean-boundary preconditions: met
- Next action: Merge `chore/wp-15-pre-d-codeql-schedule` (PR #129) into `main` on green CI.
