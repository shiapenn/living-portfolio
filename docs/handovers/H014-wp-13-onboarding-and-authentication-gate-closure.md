# H014 — WP-13 onboarding and authentication gate closure

| Field | Value |
| --- | --- |
| Handover ID | `H014` |
| Date | 2026-11-08 |
| Author | A (Implementer) |
| Supersedes | H013 |
| Evidence SHA (on `main`) | `5628357c24726731552ab7cbb680bc3a1a448a48` |
| CI runs for that SHA | 42464818468 / 42464818387 / 42464818382 (commit 5628357); 42471720311 / 42471720242 / 42471720243 (commit 14b0a01) |
| Receipts covered | A001 through A074 |
| Phase closed | WP-13 Gate Closure (certified in docs/plans/gates.json) |
| Phase next | WP-14 Entry Lifecycle Integrity & Pre-Task Dependency Review |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read `docs/handovers/H014-wp-13-onboarding-and-authentication-gate-closure.md`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify H014`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4. Follow the execution protocol exactly: one task per PR, tests included, merge commits, receipt as a file, no edits to earlier reports.

## 1. Mission and constitution

- **Objective:** The Living Portfolio is an open-source, self-hosted dynamic professional identity system providing proof-first claims, query-guided interactive answers, NDA-safe confidential redacting, and multi-tier AI responses without vendor or domain lock-in.
- **Non-negotiables:** Zero-hardcoded (no owner names, vendors, or sample clients in code; all values sourced from `@living-portfolio/config` or runtime data); decoupled (web and API separated by the versioned HTTP API `/api/v1`); self-hostable (every gate is a repo script runnable on any runner); honesty invariant (the UI never claims a status it has not measured); every receipt statement carries a status tag (`[implemented]`, `[partial]`, `[simulated]`, `[not-started]`).
- **Toolchain:** Node 22.x, pnpm 12.14.0, Vitest 3.0.7, Playwright 1.64.1, Turbo 2.4.4, TypeScript 5.7.3.
- **Authority:** A implements; L reviews and signs off gates; owner decides governance. Work Package 13 (Gate G13) is closed and certified in `docs/plans/gates.json`.

## 2. Source-of-truth map

| Topic | Where | How to query |
| --- | --- | --- |
| Product spec | `docs/spec/The_Living_Portfolio_Open_Source_Spec.md` | Read by section number only |
| UX audit findings | `docs/audits/2026-11-06-ux-specification-audit/report.md` | Parts 2, 3, 3b by finding ID (AUD-2026-11-06; 2026-10-20 path is earlier audit) |
| Finding register | `docs/audits/register.yml` | `node scripts/handover-facts` |
| Work plan and tranches | `docs/plans/P004-ux-remediation-work-packages.md` | §7 Work Packages table |
| Task protocol | `docs/plans/execution-protocol.md` | Read in full |
| Latest receipts | `docs/execution-reports/` | `docs/INDEX.md` |

## 3. Phase ledger

- **Completed:**
  - WP-1 through WP-12: Core controls, persistence, governance, algorithms, UX architecture, and v0.1.0 GA release (receipts A001 to A059, handover H013, evidence `31700e1`).
  - WP-13: Onboarding and authentication integrity (receipts A060 to A074; task branch head evidence `806e6c7`; WP-13 merge commit `5628357` on `main` with CI runs 42464818468 / 42464818387 / 42464818382; H014 merge commit `14b0a01` on `main` with CI runs 42471720311 / 42471720242 / 42471720243):
    * WP-13.0 (`A060`): Audit findings registration, gates WP-13..WP-20, and plan P004 intake.
    * WP-13.1 (`A061`): Real authenticator enrolment, SVG QR code, and confirmation route (`20261106-UX-26`).
    * WP-13.2 (`A062`): Session issuance and CSRF tokens from setup wizard (`20261106-UX-28`).
    * WP-13.3 (`A063`): Credentials screen, 64-bit entropy salted recovery codes, and confirmation gate (`20261106-UX-30`).
    * WP-13.4 (`A064`): Settings persistence across wizard step navigation and reload (`20261106-UX-27`).
    * WP-13.5 (`A065`): Wizard copy, states, zero-vendor scan, and single primary action per step (`20261106-UX-29`, `20261106-UX-33`, `20261106-CP-14`, `20261106-CP-15`).
    * WP-13.6 (`A066`): Login explainer, recovery code toggle, and admin shell header sign-out (`20261106-UX-31`, `20261106-UX-41`).
    * WP-13.7 (`A067`): Start-here onboarding runbook, deployment truth, and standalone admin guard (`20261106-UX-32`, `20261106-UX-05`).
    * WP-13.8 (`A068`): Recovery-code input normalisation, paste validation, and single-use burn (`20261106-UX-31`).
    * WP-13.9 (`A069`): Default install wizard controls, disabled test alert, and disk error mapping (`20261106-UX-33`, `20261106-UX-09`, `20261106-CP-01`).
    * WP-13.10 (`A070`): Honest Step 6 theme copy ("Your choice is saved...") and partial UX-27 registration (`20261106-UX-27`).
    * WP-13.11 (`A071`): Recovery code 64-bit entropy upgrade with random salt, timingSafeEqual comparison, and absolute backup data path resolution (`20261106-UX-46`).
    * WP-13.12 (`A072`): Legacy recovery notice removal from login, admin shell warning on legacy recovery sign-in, and code regeneration endpoint (`20261106-UX-46`, `20261106-UX-47`).
    * WP-13.13 (`A073`): Honest START-HERE runbook with `docker --version` pre-flight check, ephemeral in-memory trial warnings, and troubleshooting (`20261106-UX-32`, `20261106-UX-48`).
    * WP-13.14 (`A074`): Review/wp-13 web merge repair, receipt A073 Evidence SHA ancestry fix, and follow-up finding registrations (`20261106-UX-49`, `20261106-UX-50`, `20261106-UX-51`).
- **Current phase:** WP-14 Entry Lifecycle Integrity. **Definition of done:** Entry state machine operates per spec §2.1.2, editor result visibility, client bundling, draft autosave buffer, and calibration defaults.
- **Next phases:** WP-15 Foundations, WP-16 Monolith Split & Workspace Restructure, WP-17 Settings Maintenance & Account.

## 4. Active workspace

- **Git:** `main` at `5628357` (WP-13 closure Evidence SHA `5628357c24726731552ab7cbb680bc3a1a448a48` with CI runs 42464818468 / 42464818387 / 42464818382; current `main` HEAD is `14b0a01` with CI runs 42471720311 / 42471720242 / 42471720243); open PRs: none; working tree: clean; branches holding unmerged work: none.
- **Next task:** `WP-14.pre-a`: Dependency vulnerability review and Dependabot triage (UX-51). Receipt number to use: `A075`.
- **Hot files (at most 7):**
  1. `package.json`: Dependency manifests and workspace package specifications.
  2. `pnpm-lock.yaml`: Dependency lockfile for resolution updates.
  3. `.github/workflows/ci.yml`: CI workflow requiring CodeQL and Gitleaks download retry loops.
  4. `.github/workflows/codeql.yml`: CodeQL workflow requiring bundle download retry loop.
  5. `apps/web/src/renderer.ts`: Admin workspace editor result presentation (WP-14.0a).
  6. `docs/plans/gates.json`: Stage gates manifest certifying WP-13 closure.
  7. `docs/audits/register.yml`: Finding register.
- **Immediate next actions (ordered, at most 7):**
  1. Open task `WP-14.pre-a` on branch `feat/wp-14-pre-a-dependency-review` from `main` to triage the 23 alerts with `gh api repos/shiapenn/living-portfolio/dependabot/alerts`, separating runtime from dev-only. Reconcile open Dependabot PRs (#82, #83, #84, #85) one at a time, smallest risk first. For major bumps (vitest 3 to 4, zod 4), verify full test suite and E2E green and document breaking changes. Do not merge red PRs; fix on branch or close with reason. Never use rebase or squash. Open PR into `main`, merge with merge commit, author receipt A075 (UX-51).
  2. Open task `WP-14.pre-b` on branch `feat/wp-14-pre-b-ci-download-resilience` from `main` to add retry with backoff to CodeQL and Gitleaks download steps in `.github/workflows/ci.yml` and `.github/workflows/codeql.yml` (edits authorized for this task only). Do NOT change or bypass checksum checks, and do not edit `scripts/gitleaks-checksums.json`. Open PR into `main`, merge with merge commit, author receipt A076 (UX-52).
  3. Open task `WP-14.0a` on branch `feat/wp-14-0a-visible-editor-results` from `main` and write failing Playwright test asserting editor results (Save draft, Publish, Unpublish, Delete) are visible in the viewport without scrolling and announced to assistive tech (UX-43).
  4. Implement inline editor status line, polite toast notification, and list refresh; verify Playwright test passes; open PR into `main`, merge with merge commit, author receipt A077.
- **Pending decisions:** None.

## 5. Findings and backlog snapshot

- **Register counts (from `node scripts/handover-facts`):** 108 fixed, 5 partial, 54 open (P0: 6, P1: 31, P2: 17; Total: 167).
- **Open P0 findings (6):**
  - `20261106-UX-01`: Publishing an entry that already exists always sends POST /api/entries, returning 409 for existing slug with generic failure message
  - `20261106-UX-02`: Save draft on an existing entry hard-codes visibility: private, silently unpublishing a live page
  - `20261106-UX-03`: Visibility dropdown is never read by any handler, making Unlisted unreachable
  - `20261106-UX-04`: Undo unpublish omits preview token causing API rejection; undo draft save prints confirmation without restoring state
  - `20261106-UX-43`: Editor results written to banner at top of page away from action, with no auto-scroll, focus move, or list refresh
  - `20261106-UX-44`: Time travel drops entries revised after chosen date from list pages and timeline due to current-revision only filtering
- **Carry forward items:**
  - `20261106-UX-47`: Owner account recovery codes regeneration UI in Settings > Account
  - `20261106-UX-49`: Setup wizard dead end if browser closed between account creation and TOTP confirmation
  - `20261106-UX-50`: docs/START-HERE.md keeps unmeasured "< 15 min" figure retained to satisfy conformance check
  - `20261106-UX-51`: Dependency review: 23 vulnerabilities on main (2 critical, 7 high, 14 moderate) and 4 open Dependabot PRs
  - `20261106-UX-52`: CI flakiness from GitHub-hosted downloads: CodeQL bundle 504 and transient Gitleaks checksum mismatch
  - Partials (5): `20261106-UX-09` (read-only providers in setup; completes in WP-17.2), `20261106-UX-27` (wizard steps persisted except public theme deferred to WP-17.8), `20261106-UX-33` (live wizard controls that fail in a default install), `20261106-UX-41` (admin shell sign-out added, full account management deferred to WP-17.4), `20261106-CP-01` (engineering and test jargon in owner UI strings)

## 6. Decisions and pitfalls

- **Decisions (at most 10):**
  - 2026-11-08: Merge commit protocol strictly enforced for PRs targeting `review/wp-13` and `main` (`git merge --no-ff` or GitHub "Create a merge commit") to preserve immutable receipt Evidence SHA ancestry (owner approved exception to rebase). Where: `docs/plans/execution-protocol.md`.
  - 2026-11-07: Upgraded recovery codes to 64 bits of entropy (16 hex chars, `xxxx-xxxx-xxxx-xxxx`) with per-code 16-byte random salt and `timingSafeEqual` comparison. Where: `apps/api/src/auth/security.ts`.
  - 2026-11-08: START-HERE runbook documents Path B database truth as ephemeral in-memory trial (`InMemoryPortfolioRepository`) with bold data-loss warning. Where: `docs/START-HERE.md`.
  - 2026-11-07: Single primary action per wizard step with disabled test buttons and honest explanations. Where: `apps/web/src/renderer.ts`.
  - 2026-11-08: Historical commit SHA mapping in `scripts/historical-sha-map.json` maintains ancestry validation across rebased commits. Where: `scripts/historical-sha-map.json`.
- **Pitfalls and operational notes (at most 10):**
  - CI execution scope: CI workflows run only on pull requests targeting `main` and direct pushes to `main`; CI does not execute on `review/*` branches or PRs targeting them.
  - Path A verification: Path A (Docker Compose stack) was never executed in this program; local verification was performed in Node.js ephemeral trial mode without a Docker daemon.
  - A073 Evidence SHA ancestry: Evidence SHA for receipt A073 relies on `scripts/historical-sha-map.json` (`9221074` -> `253c744`); spot-check this mapping during WP-14.
  - Rebased history on main: Rebased linear copies of WP-13.0 to WP-13.12 exist on `main` from earlier PR #81 alongside the original commit graph merged via PR #87.
  - CodeQL scanning status: CodeQL workflow executed successfully on `main`, but GitHub code scanning is not enabled for the repository, so security findings are not retained in GitHub Security tab.
  - Staging deployment: Staging CD workflow automatically builds and pushes multi-arch container images to `ghcr.io` on every push to `main`.
  - Merge method discipline: Never use "Rebase and merge" or "Squash and merge" on `main`; commit rewriting invalidates receipt Evidence SHAs.

## 7. Verification harness

| Check | Command | Expected baseline (source) |
| --- | --- | --- |
| Full gate suite | `pnpm verify` | all gates pass (CI 42464818468 on 5628357; CI 42471720311 on 14b0a01) |
| Unit and conformance tests | `pnpm test` | 360 tests in 41 files pass in apps/api (CI 42464818468 on 5628357) |
| End-to-end tests | `pnpm test:e2e` | 61 tests pass in Chromium (CI 42464818468 on 5628357) |
| Receipt check | `pnpm receipt:check A074` | passes (A074 certified as WP-13 closing receipt in gates.json) |
| Docs check | `pnpm docs:check` | passes (112 registered documents) |
| Handover check | `pnpm handover:check H014` | passes |
| Handover verify | `pnpm handover:verify H014` | passes |
| CI log retrieval | `gh run view <run-id> --log` | needs `gh auth status` logged in |

Fresh-clone procedure for gate sign-off: clone repo, run `pnpm install && pnpm build && pnpm verify`.

## 8. Entry halt conditions and exit checklist

**Halt and report to L (change nothing) if:**
1. `origin/main` differs from the Evidence SHA by anything other than docs-only commits.
2. `pnpm verify` or the baseline in section 7 does not match.
3. CI on `main` is red.
4. A pending decision in section 4 blocks Immediate Next Action 1.
5. A path, SHA or command cited here does not exist.

**Exit checklist for the next handover:** preconditions in IAHP section 4 met; Evidence SHA and CI runs recorded; sections derived, not narrated; resolved items deleted; `pnpm handover:check` passes; docs-only PR merged with merge commit; start prompt printed; session stopped.
