# G001 — Handover template

| Field | Value |
| --- | --- |
| Doc ID | `G001` |
| Class | G (guide, reference and template) |
| Used by | [IAHP protocol](../plans/P001-iterative-agent-handover-protocol.md) section 5. Instantiated only through `pnpm docs:new H "<Title>"` |

Everything below the line is the template. Replace each `{{placeholder}}`, delete every `<!-- guidance -->` comment, and keep the whole result within 300 lines and 32 KB.

---

# {{H_ID}} — {{Title: scope of the phase just closed and what comes next}}

| Field | Value |
| --- | --- |
| Handover ID | `{{H_ID}}` |
| Date | {{YYYY-MM-DD}} |
| Author | {{agent identity from git config}} |
| Supersedes | {{previous H ID or none}} |
| Evidence SHA (on `main`) | `{{40-char SHA}}` |
| CI runs for that SHA | {{CI run ID}} / {{CodeQL run ID}} / {{Secret scan run ID}} / {{Playwright job, if separate}} |
| Receipts covered | {{A### to A###}} |
| Phase closed | {{phase or gate name}} (L sign-off: {{receipt ID or date}}) |
| Phase next | {{phase or gate name}} |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read `{{path of this file}}`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify {{H_ID}}`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4. Follow the execution protocol exactly: one task per PR, tests included, Rebase and merge, receipt as a file, no edits to earlier reports.

## 1. Mission and constitution

<!-- guidance: digest only; link, do not copy -->
- **Objective:** {{one paragraph: what the product does and for whom}}
- **Non-negotiables:** zero-hardcoded (no owner names, vendors or sample clients in code; config or data files only); decoupled (web and API separated by the versioned HTTP API); self-hostable (every gate is a repo script runnable on any runner); honesty invariant (the UI never claims a status it has not measured); every receipt statement carries a status tag.
- **Toolchain:** {{Node version}}, {{pnpm version}}, {{test runners}}, {{browser for e2e}}.
- **Authority:** A implements; L reviews and signs off gates; owner decides governance. Stop points: {{list gates where A must wait}}.

## 2. Source-of-truth map

| Topic | Where | How to query |
| --- | --- | --- |
| Product spec | `docs/spec/The_Living_Portfolio_Open_Source_Spec.md` | Read by section number only |
| UX audit findings | `docs/audits/2026-10-20-ux-specification-audit/report.md` | Parts 2, 3, 3b by finding ID |
| Finding register | `docs/audits/register.yml` | {{command to list open findings}} |
| Work plan and tranches | `docs/plans/remediation-plan-AUD-2026-10-19.md`, `docs/plans/osr-001-open-source-release.md` | {{anchor or section}} |
| Task protocol | `docs/plans/execution-protocol.md` | Read in full |
| Latest receipts | `docs/execution-reports/` | `docs/INDEX.md` |

## 3. Phase ledger

<!-- guidance: one line per completed phase; no micro-state -->
- **Completed:**
  - {{phase}}: {{one line}} (receipts {{A### to A###}}, evidence `{{short SHA}}`)
- **Current phase:** {{name}}. **Definition of done:** {{exact criteria and gate checklist reference}}.
- **Next phases:** {{one line each, at most three}}

## 4. Active workspace

- **Git:** `main` at `{{short SHA}}`; open PRs: {{none | list}}; working tree: clean; branches holding unmerged work: {{none}}.
- **Next task:** `{{task ID}}`: {{one-line scope}}. Receipt number to use: `{{A###}}`.
- **Hot files (at most 7):**
  1. `{{path}}` ({{lines or symbol}}): {{why}}
- **Immediate next actions (ordered, at most 7):**
  1. {{exact first command or edit, executable without searching}}
  2. {{...}}
- **Pending decisions:** {{ID}}: {{question}}. Owner: {{L | owner}}. Blocks: {{what}}. (Write "none" if none.)

## 5. Findings and backlog snapshot

- **Register counts (CI or local, labelled):** {{command and its output: open, partial, fixed by severity}}
- **Open P0 findings:** {{IDs with one-line titles}}
- **Next five backlog items:** {{plan keys in order}}

## 6. Decisions and pitfalls

<!-- guidance: keep only what is still valid; each entry names the file, symbol, SHA or rule it concerns -->
- **Decisions (at most 10):**
  - {{YYYY-MM-DD}}: {{decision}}. Reason: {{one line}}. Where: `{{path or receipt}}`.
- **Pitfalls and dead ends (at most 10):**
  - {{what not to do}}. Because: {{one line}}. See: `{{path, receipt or SHA}}`.
- **Accepted technical debt (do not fix unprompted):** {{items with finding or plan key}}

## 7. Verification harness

| Check | Command | Expected baseline (source) |
| --- | --- | --- |
| Full gate suite | `pnpm verify` | all gates pass ({{CI run}}) |
| Unit and conformance tests | {{command}} | {{N tests in N files}} (CI {{run ID}}) |
| End-to-end tests | {{command}} | {{N tests}} (CI {{run ID}}) |
| Receipt check | `pnpm receipt:check {{last A###}}` | passes |
| Docs check | `pnpm docs:check` | passes |
| Handover verify | `pnpm handover:verify {{H_ID}}` | passes |
| CI log retrieval | `gh run view <run-id> --log` | needs `gh auth status` logged in |

Fresh-clone procedure for gate sign-off: {{exact commands for L}}.

## 8. Entry halt conditions and exit checklist

**Halt and report to L (change nothing) if:**
1. `origin/main` differs from the Evidence SHA by anything other than docs-only commits.
2. `pnpm verify` or the baseline in section 7 does not match.
3. CI on `main` is red.
4. A pending decision in section 4 blocks Immediate Next Action 1.
5. A path, SHA or command cited here does not exist.

**Exit checklist for the next handover:** preconditions in IAHP section 4 met; Evidence SHA and CI runs recorded; sections derived, not narrated; resolved items deleted; `pnpm handover:check` passes; docs-only PR merged with Rebase and merge; start prompt printed; session stopped.
