# Public Flip-Day Checklist (`OSR-10`, §2.3)

Perform in one session in exact order after Remediation Gates 1a and 1b are complete and auditor re-verification is recorded. Freeze merges until Step 7 is verified.

- [ ] **Step 1:** Confirm `verified_by` entries in [`docs/audits/register.yml`](../audits/register.yml) for all Phase 1a (`S1`–`S6`) and Phase 1b (`G1`–`G7`) findings.
- [ ] **Step 2:** Run `pnpm hardcode:check` (`node scripts/hardcode-check`) and `gitleaks` on the working tree to confirm zero secrets, local paths, usernames, or tool-specific state files.
- [ ] **Step 3:** Confirm [`README.md`](../../README.md) alpha warning, [`KNOWN_ISSUES.md`](../../KNOWN_ISSUES.md), [`SECURITY.md`](../../SECURITY.md), and [`TRADEMARKS.md`](../../TRADEMARKS.md) are present and verified by `pnpm audit:check`.
- [ ] **Step 4:** Verify exported GitHub ruleset definitions in [`docs/governance/rulesets/main-branch-ruleset.json`](rulesets/main-branch-ruleset.json) and [`docs/governance/rulesets/release-tag-ruleset.json`](rulesets/release-tag-ruleset.json) (`bypass_actors: []`).
- [ ] **Step 5:** Change repository visibility from Private to Public.
- [ ] **Step 6:** Import and activate both ruleset JSON files on GitHub immediately (`gh api repos/:owner/:repo/rulesets --input docs/governance/rulesets/main-branch-ruleset.json`).
- [ ] **Step 7 (Verify enforcement):**
  - Attempt a direct push to `main` and confirm it is rejected (`GH013: Repository rule violations found`).
  - Confirm a PR without required status checks (`typecheck`, `lint`, `unit`, `contract`, `integration`, `security-regression`, `migration`, `build-images`, `secret-scan`, `dependency-review`, `audit-check`, `dco`) cannot merge.
  - Confirm a test fork PR runs `pull_request` workflows with read-only permissions and zero secrets exposed.
- [ ] **Step 8:** Enable GitHub native secret scanning, push protection, private vulnerability reporting, and Dependabot alerts/updates.
- [ ] **Step 9:** Set default GitHub Actions workflow permissions to read-only, restrict allowed actions to SHA-pinned actions, and require maintainer approval for outside-collaborator workflow runs.
- [ ] **Step 10:** Record the public flip timestamp and verification results in [`docs/governance/CHANGELOG.md`](CHANGELOG.md). Do not publish releases or container images until Gate G2 (`v0.1.0-alpha.1`).
