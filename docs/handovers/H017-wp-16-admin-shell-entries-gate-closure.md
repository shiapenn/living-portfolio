# H017 — WP-16 admin shell, entries, and inbox gate closure

| Field | Value |
| --- | --- |
| Handover ID | `H017` |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Supersedes | H016 |
| Evidence SHA (on `main`) | `dff335adc6f66982a3b8a988b7bd43153bb70db7` |
| CI runs for that SHA | 43697789273 (CI & Audit Conformance Gate), 43697789279 (Secret Scan), 43697789292 (Staging Deploy) on `main` |
| Receipts covered | A001 through A114 |
| Phase closed | WP-16 Gate G16 Closure (certified in docs/plans/gates.json at A114) |
| Phase next | WP-17 Settings, Maintenance & Account (starting with WP-17.1) |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read `docs/handovers/H017-wp-16-admin-shell-entries-gate-closure.md`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify H017`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4 (`WP-17.1`). Follow the execution protocol and standing merge rules in section 6: one task per PR, tests included, merge commits only (`gh pr merge --merge`), receipt as a file, no edits to earlier reports.

## 1. Mission and constitution

- **Objective:** The Living Portfolio is an open-source, self-hosted dynamic professional identity system providing proof-first claims, query-guided interactive answers, NDA-safe confidential redacting, and multi-tier AI responses without vendor or domain lock-in.
- **Non-negotiables:** Zero-hardcoded (no owner names, vendors, or sample clients in code; all values sourced from `@living-portfolio/config` or runtime data); decoupled (web and API separated by the versioned HTTP API `/api/v1`); self-hostable (every gate is a repo script runnable on any runner); honesty invariant (the UI never claims a status it has not measured); every receipt statement carries a status tag (`[implemented]`, `[partial]`, `[simulated]`, `[not-started]`).
- **Toolchain:** Node 22.x, pnpm 12.14.0, Vitest 4.1.12, Playwright 1.64.1, Turbo 2.4.4, TypeScript 5.7.3.
- **Authority:** A implements; L reviews and closes gates; owner decides governance. Work Package 16 (Gate G16) is closed on automated evidence at `A114` and certified in `docs/plans/gates.json`; hands-on owner acceptance is deferred to Milestone Gate `GFE` (`docs/plans/front-end-acceptance.md`).

## 2. Source-of-truth map

| Topic | Where | How to query |
| --- | --- | --- |
| Product spec | `docs/spec/The_Living_Portfolio_Open_Source_Spec.md` | Read by section number only |
| UX audit findings | `docs/audits/2026-11-06-ux-specification-audit/report.md` | Parts 2, 3, 3b by finding ID (`AUD-2026-11-06`) |
| Finding register | `docs/audits/register.yml` | `node scripts/handover-facts` and `node scripts/audit-check` |
| Work plan and tranches | `docs/plans/P004-ux-remediation-work-packages.md` | §7 Work Packages table (`WP-17.1`..`WP-17.8`) |
| Acceptance pack (`GFE`) | `docs/plans/front-end-acceptance.md` | Journeys `J1`–`J11` and milestone criteria for Gate `GFE` |
| Task protocol | `docs/plans/execution-protocol.md` | Read in full |
| Latest receipts | `docs/execution-reports/` | `docs/INDEX.md` |

## 3. Phase ledger

- **Completed:**
  - WP-1 through WP-15: Core controls, persistence, governance, algorithms, design system, and Reference Editor (`H016`, `8dfd769`).
  - WP-16: Admin Shell, Entries & Inbox (receipts `A106`–`A114`; closed at `A114` on automated evidence + end-of-WP-16 sweep):
    * `WP-16.0` (PR #137 `3e16e36`, Receipt `A106` PR #138 `8ac403b`): G15 defects & parity (`UX-96..100`, `UX-102..105`).
    * `WP-16.1` (PR #139 `0ae9c76`, Receipt `A107` PR #140 `04560dc`): Admin & Auth Shells (`UX-06`, `UX-39`, `UX-91`, `UX-94`, `UX-101`).
    * `WP-16.2` (PR #141 `2a1a23d`, Receipt `A108` PR #142 `c5e79b0`): Today dashboard (`/admin/today`, `PATCH /api/settings/dashboard`).
    * `WP-16.3` (PR #143 `43cbbe8`, Receipt `A109` PR #144 `6e646bb`): Paginated Entries list (`/admin/entries`).
    * `WP-16.4` (PR #145 `9f5ef52`, Receipt `A110` PR #146 `7f0c7c8`): Dedicated editor routes (`/admin/entries/new`, `/admin/entries/:id`, `UX-92`, `UX-93`).
    * `WP-16.5` (PR #147 `a0d8e67`, Receipt `A111` PR #148 `951c366`): 5-tab Inspector module & entry history restore (`/admin/entries/:id/history`, `UX-37`).
    * `WP-16.6` (PR #149 `1950654`, Receipt `A112` PR #150 `6709e75`): Inbox (`/admin/inbox`, `/admin/inbox/:id`) & Answer Rules (`/admin/audit`, `POST /api/audit/scoped-constraints`).
    * `WP-16.7` & Sweep Fixes (PR #151 `49fdad6`, Receipt `A113` PR #152 `6565338`; PR #153 `dff335a`, Receipt `A114`): Retired monolith (`/admin` renders Today only), resolved all sweep contrast/overflow/heading-order/target findings.
- **Next phases:** WP-17 Settings, Maintenance & Account (`WP-17.1`..`WP-17.8`); WP-18 Authoring Canvas & Import; WP-19 Public Frame & Time Travel -> **Milestone Gate `GFE`** -> WP-20.

## 4. Active workspace

- **Git:** `main` at `dff335a` (PR #153); open PRs: none; working tree: clean.
- **Next task:** `WP-17.1`: Settings templates & Routing page (`/admin/settings`, `/admin/routing`, `UX-17`, `UX-41`, `UX-42`). Receipt number to use: `A115`.
- **Hot files (at most 5):**
  1. `apps/web/src/pages/admin/settings.ts` & `apps/web/src/pages/admin/settings-script.ts`: Legacy settings page to migrate into `WP-17` dedicated routes.
  2. `apps/web/src/layouts/admin-shell.ts`: Admin Shell navigation rail & shared top bar.
  3. `docs/audits/ui-guard-allowlist.json`: Shrinking-only UI guard allowlist.
  4. `docs/plans/P004-ux-remediation-work-packages.md`: §7.8 `WP-17` task table (`WP-17.1`..`WP-17.8`).
  5. `docs/plans/front-end-acceptance.md`: Journeys `J1`–`J11` & Gate `GFE` criteria.
- **Immediate next actions (at most 5):**
  1. Open task `WP-17.1` on branch `feat/wp-17-1-settings-and-routing` from `main`: implement Settings templates & Routing page, verify `pnpm verify` & `pnpm test:e2e`, open PR, merge with `--merge`, record receipt `A115`.
  2. Continue `WP-17.2` through `WP-17.8` in order (`P004` §7.8), one PR + one receipt per task.
- **Pending decisions:** None (interim gates `G15`–`G19` close on automated evidence + sweep; hands-on acceptance deferred to Milestone Gate `GFE`).

## 5. Findings and backlog snapshot

- **Register counts (from `node scripts/handover-facts`):** 145 fixed, 45 partial, 30 open (P0: 1, P1: 13, P2: 16; Total: 220).
- **Open P0 findings (4 non-fixed P0 items):**
  - `20261106-UX-44` (`status: open`): Time travel drops entries revised after chosen date from list pages and timeline (`WP-19.5`).
  - `20261106-UX-09` (`status: partial`): Setup wizard step 3 Model Providers is read-only (`WP-17.2`).
  - `20261106-UX-27` (`status: partial`): Live public theme application (`WP-17.8`, `WP-20.1`).
  - `20261106-UX-43` (`status: partial`): Editor status line consolidated; remaining settings/module feedback (`WP-17`).
- **Next five backlog items:** `WP-17.1`, `WP-17.2`, `WP-17.3`, `WP-17.4`, `WP-17.5`.

## 6. Decisions and pitfalls

- **Standing PR, Merge & Gate Rules:** One task = one branch = one PR into `main` = one receipt. Merge with a merge commit only (`gh pr merge <id> --merge`; never rebase/squash). Interim gates (`G15`–`G19`) close on CI, journey tests, sweep results, and contact-sheet review; Milestone Gate `GFE` requires owner walkthrough.
- **UI Guard Allowlist (`docs/audits/ui-guard-allowlist.json`):** Shrinking-only; never add files or increase counts; remove files as pages migrate in `WP-17`–`WP-19`.

## 7. Verification harness

| Check | Command | Expected baseline (source) |
| --- | --- | --- |
| Full gate suite | `pnpm verify` | all 15 gates pass (`dff335a` CI `43697789273`) |
| End-to-end tests | `pnpm test:e2e` | 111/111 pass in Chromium (`dff335a` CI `43697789273`) |
| Audit check | `pnpm audit:check` | passes (`[AUD-WP-MAP]` verified) |
| Handover verify | `pnpm handover:verify H017` | passes |

## 8. Entry halt conditions and exit checklist

**Halt and report to L (change nothing) if:**
1. `origin/main` differs from the Evidence SHA by anything other than docs-only commits (plus `scripts/audit-check` and `scripts/handover-verify`).
2. `pnpm verify` or the baseline in section 7 does not match.
3. CI on `main` is red.
4. A pending decision in section 4 blocks Immediate Next Action 1.
5. A path, SHA or command cited here does not exist.

**Exit checklist for the next handover:** preconditions in IAHP section 4 met; Evidence SHA and CI runs recorded; sections derived, not narrated; resolved items deleted; `pnpm handover:check` passes; docs-only PR merged with merge commit; start prompt printed; session stopped.
