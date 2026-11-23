# Living Portfolio Engineering & Execution Protocol

This protocol establishes the binding operational procedure for all implementation tasks, test suites, pull requests, evidence verification, and execution reports across the Living Portfolio project.

---

## 1. Standing Procedure

### 1.1 Task Sequencing and Order
- **Sequential Execution:** Perform only the next task in the agreed sequence within each work package.
- **Order Modification:** If a change to task order is deemed necessary or advantageous, declare the justification explicitly in the execution receipt and obtain formal sign-off from L before proceeding. Do not reorder unilaterally.
- **WP-1 Tasks Structure:**
  1. Playwright test harness & authentication flow (`WP-1.1`, done)
  2. All admin fetches through `apiClient` with a lint or test forbidding raw `fetch` (`WP-1.2`)
  3. Scanner with owner exclusion list, NDA question, and four-state result (`WP-1.3`)
  4. Publish flow with redaction preview token in the UI (`WP-1.4`)
  5. Config-driven provider registry with extractive degradation (`WP-1.5`)
  *(Note: Markdown editor, timeline view controls, mobile responsive drawers, and visual regression belong to subsequent work packages).*

### 1.2 Per-Task Workflow
- **Branching:** Create an isolated feature branch for each task from current `main` (e.g., `feat/<task-id>-<description>`).
- **Implementation & Tests:** Every task ships with its own tests. Any capability, behavior, or error state a user sees must be backed by a Playwright end-to-end browser test. Conformance and unit suites cover underlying runtime invariants.
- **Local Verification:** Before submitting changes, run `pnpm verify` and `pnpm receipt:check` locally to confirm all static, security, secret, and conformance gates pass.
- **Pull Request:** Open a pull request titled with the Task ID (e.g., `WP-1.2: Enforce apiClient across admin workspace and forbid raw fetch`).
- **Merge Strategy:** Wait for all required CI status checks to complete green. Merge strictly via **Merge commit** (`git merge --no-ff` or GitHub "Create a merge commit"). Rebase and squash merges are strictly forbidden for branches targeting `review/wp-13` or `main` because execution receipts cite immutable commit SHAs (`Evidence SHA`) that must remain direct topological ancestors of HEAD without being rewritten (owner exception approved).
- **Main Evidence & Receipts:** After merging to `main`, wait for the push workflow runs on `main` to complete green. Author the task receipt (`docs/execution-reports/A###-<slug>.md` allocated via `pnpm docs:new A "<Title>"`) citing the commit SHA on `main` (`Evidence SHA`) and the corresponding push CI runs. The receipt must contain all nine mandatory sections defined in [IAHP](P001-iterative-agent-handover-protocol.md), including §8 (`receipt:check` self-validation) and §9 (Handover Decision). Every receipt that touches UI must also include a **Component statement** (`D-J` / `J4`): for each new or changed UI element, list the registered `data-c` component and variant from `docs/design/components.json`. If no existing component or variant can express it, do not build a one-off; stop and report to L for approval first. Submit and land the receipt via a docs-only PR before merging the subsequent task.
- **Combined Step PR & Multi-Step Commits (2026-11-23 Amendment):** A work-package step may land as one PR containing its receipt (code, tests, and receipt in one PR; docs-only PRs stay separate). Steps within a work package are commits within a PR, not separate PRs, unless a step needs an independent revert. When a receipt lands in the same PR as its code, the receipt's `Evidence SHA` cites the preceding code commit in that PR (which is an ancestor of the PR head and preserved by merge commit) and the green CI run for that commit.
- **Pipelining:** You may start the next task's development branch immediately after pushing, but do not merge it into `main` until the prior task's receipt is fully merged.

### 1.3 Commit Hygiene & Traceability
- **Single Concern per Commit:** Each commit must address a single discrete concern.
- **DCO Sign-off:** Every commit must carry a valid Developer Certificate of Origin `Signed-off-by: Full Name <email@domain>` trailer (`OSR-07 dco`).
- **No Force Pushes to Main & No Bypass:** Branch protections and gate validations must never be bypassed or force-pushed.
- **Report Immutability:** Never edit an earlier execution report. Historical reports are immutable records. Any corrections, discrepancies, or errata must be formally documented in Section 7 ("Changes to Earlier Reports") of the subsequent receipt.

### 1.4 Evidence Integrity & Provenance
- **Verbatim CI Output:** Any log block labeled "verbatim" or attributed to CI must be copied directly from the named GitHub Actions job log without modification.
- **Provenance Labeling:** Any output generated on a local machine must be explicitly labeled as `local output`.
- **Derived Totals:** Any computed or aggregated metrics (such as total tests across multiple package runners) must be explicitly labeled as `"computed from the above"`.
- **Exhaustive File Lists:** The "Files touched" section in receipts must match `git diff --name-only <prevEvidenceSha>..<currentEvidenceSha>` exactly, with no omissions or extraneous entries.

### 1.5 Finding and Register Governance
- **Status Progression:** A finding's status in `docs/audits/register.yml` may only be transitioned to `fixed` when every acceptance criterion stipulated in the audit roadmap has been completely satisfied and verified by automated tests. Otherwise, mark `partial`.
- **Accurate ID Mapping:** Bind changes to the exact audit finding IDs:
  - `20261020-UX-01`: Owner sign-in, setup wizard, lockdown, and authentication flow.
  - `20261020-UX-02`: CSRF token enforcement, session storage, and authenticated API client communication.
  - `20261020-UX-03`: Redaction preview confirmation tokens and publication gate.
- **Register Diffs:** Include any modifications to `register.yml` directly in the receipt's register changes section.

### 1.6 Prohibition of Hardcoded Literals
- **No Sensitive or Domain Literals:** Source code and non-fixture tests must contain no hardcoded owner names, domain names, vendor keys, or fictional sample client names.
- **Configuration & Schemas:** All domain values, origin URLs, and provider settings must be sourced from configuration schemas (`@living-portfolio/config`), environment variables, or explicit runtime data files.

### 1.7 Gate Sign-Offs & Stop Points
- **Work Package Gates:** Work proceeds autonomously between tasks within an active work package without awaiting review.
- **Self-Selecting Backlog (`D-M7`, 2026-11-23):** After finishing a package, select the next unblocked item via `pnpm backlog:next` (`docs/plans/backlog.yml`). A visual package ends with its contact-sheets zip and the agent continues with the next unblocked item that does not depend on the review; stop only at owner gates (`Gate GFE`, `owner-direction`) or when nothing is unblocked. Owner feedback on sheets arrives as defects and is handled first. (For `WP-16.M` specifically: stop after `M6`.)
- **Package Completion Stop Points:** At the conclusion of Work Package 1 (Gate 1b+ Closure) and Work Package 2 (Gate 2), the agent must halt and wait for L's formal review and sign-off before commencing work on the subsequent package.
- **Closing Receipt & Handover:** The final receipt of a work package must include a comprehensive gate summary and the reproducible fresh-clone verification command for L. Handover evaluations are governed by [IAHP](P001-iterative-agent-handover-protocol.md) Section 4.

---

## Revision History

| Date | Change |
| --- | --- |
| 2026-10-21 | Initial execution protocol |
| 2026-10-22 | PROC-1: Adopt Document Identity and IAHP nine-section receipt structure |
| 2026-11-08 | Amend Merge Strategy: PRs into review/wp-13 and main use merge commits to preserve receipt Evidence SHA ancestry (owner approved exception to rebase) |
| 2026-11-16 | H017 baseline superseded by WP-16.R, merged PR #162 to #171 (A115 to A122); baseline for WP-16.L is fe3cd51; verified by L on 2026-11-16. |
| 2026-11-22 | D-J (J4 Design-Review Gate): receipts touching UI require a Component statement referencing `docs/design/components.json`; new components require L approval before implementation. |
| 2026-11-23 | WP-16.M Protocol Amendment: a work-package step may land as one PR containing its receipt (code, tests, receipt in one PR; docs-only PRs stay separate); steps within a package are commits, not separate PRs, unless a step needs an independent revert. |
