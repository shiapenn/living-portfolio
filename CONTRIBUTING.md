# Contributing Guide (`CONTRIBUTING.md`)

Thank you for contributing to **The Living Portfolio**. Every contribution is governed by the [Apache-2.0 License](LICENSE), the [Developer Certificate of Origin 1.1](DCO), [`DR-AUD-001`](docs/governance/DR-AUD-001.md), and [`OSR-001`](docs/plans/osr-001-open-source-release.md).

---

## 1. Developer Certificate of Origin (DCO) Sign-Off (`OSR-06`, `OSR-07`)

We do **not** require a Contributor License Agreement (CLA). Instead, every commit **MUST** carry a `Signed-off-by` trailer certifying the [Developer Certificate of Origin 1.1](DCO):

```bash
git commit -s -m "feat(api): description of change"
```

Which appends:

```text
Signed-off-by: Your Full Name <your.email@example.com>
```

- **Sign-off meaning:** The `Signed-off-by` line is made by the human who takes responsibility for the change. Agent-authored commits **MUST** be reviewed and signed off by the responsible human maintainer before merging.
- **Automated enforcement:** Both the local `.githooks/commit-msg` hook and the required CI check (`pnpm dco:check` / `dco` job) reject commits missing a valid `Signed-off-by` trailer.

---

## 2. Private-Phase Controls (Gates G0 to G1 — `OSR-08`)

While the repository is in its private pre-flip phase (G0 -> G1), GitHub branch protection rulesets are not enforced by the platform on free private repositories. The following compensating controls **MUST** be followed:

1. **Pull Requests by Convention:** All work happens on feature or `agent/*` branches and merges through a Pull Request. Direct commits to `main` are prohibited (`git log` is audited before each gate).
2. **Agent Identity & Branch Convention:** Automated implementer agents work under a dedicated identity or repository-scoped fine-grained token and push strictly to `agent/<task-or-finding-id>` branches.
3. **Local Pre-Commit Hooks:** Activate repository hooks immediately after cloning:
   ```bash
   git config core.hooksPath .githooks
   ```
   - `.githooks/pre-commit` runs the hard-code/secret scan (`node scripts/hardcode-check`) and audit governance check (`node scripts/audit-check`).
   - `.githooks/commit-msg` enforces the DCO `Signed-off-by:` trailer.
4. **CI is Authoritative:** The maintainer merges a PR only after all required CI checks (`typecheck`, `unit`, `audit-check`, `hardcode-check`, `dco`) are green.

---

## 3. Maintainer Merge Checklist (`OSR-08`)

Before merging any Pull Request:

- [ ] Every commit in the PR carries a valid `Signed-off-by: Name <email>` trailer (`pnpm dco:check`).
- [ ] Linked finding IDs (`S*`, `G*`, `B*`, `P*`, `F*`, `M*`) or task IDs (`OSR-*`) in [`docs/audits/register.yml`](docs/audits/register.yml) are cited in the PR description.
- [ ] Any finding moved to `fixed` has an existing, passing regression test named in `regression_test` (`AUD-14`), and `verified_by` remains `null` until the independent auditor re-verifies (`D.4`).
- [ ] If paths listed in [`CODEOWNERS`](CODEOWNERS) are touched, the `security-review` checklist in the PR template is completed.
- [ ] `pnpm build && pnpm test && pnpm audit:check` passes with zero errors.
