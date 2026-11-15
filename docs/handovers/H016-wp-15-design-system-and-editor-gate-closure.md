# H016 — WP-15 design system and editor gate closure

| Field | Value |
| --- | --- |
| Handover ID | `H016` |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Supersedes | H015 |
| Evidence SHA (on `main`) | `8dfd769b74415f60405c72cdedc57e777d993ee6` |
| CI runs for that SHA | 43679031378 / 43679031357 (`fc5c23f` PR #135 on `main`); 43604766331 / 43604766397 / 43604766410 (`bf1f135` `WP-15.6` on `main`); 43672136311 / 43672136380 (`dabe19b` PR #134 on `main`) |
| Receipts covered | A001 through A105 |
| Phase closed | WP-15 Gate Closure (certified in docs/plans/gates.json at A105) |
| Phase next | WP-16 Admin Shell, Entries & Inbox (starting with WP-16.0) |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read `docs/handovers/H016-wp-15-design-system-and-editor-gate-closure.md`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify H016`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4 (`WP-16.0`). Follow the execution protocol and standing merge rules in section 6: one task per PR, tests included, merge commits only (`gh pr merge --merge`), receipt as a file, no edits to earlier reports.

## 1. Mission and constitution

- **Objective:** The Living Portfolio is an open-source, self-hosted dynamic professional identity system providing proof-first claims, query-guided interactive answers, NDA-safe confidential redacting, and multi-tier AI responses without vendor or domain lock-in.
- **Non-negotiables:** Zero-hardcoded (no owner names, vendors, or sample clients in code; all values sourced from `@living-portfolio/config` or runtime data); decoupled (web and API separated by the versioned HTTP API `/api/v1`); self-hostable (every gate is a repo script runnable on any runner); honesty invariant (the UI never claims a status it has not measured); every receipt statement carries a status tag (`[implemented]`, `[partial]`, `[simulated]`, `[not-started]`).
- **Toolchain:** Node 22.x, pnpm 12.14.0, Vitest 3.0.7, Playwright 1.64.1, Turbo 2.4.4, TypeScript 5.7.3.
- **Authority:** A implements; L reviews and closes gates; owner decides governance. Work Package 15 (Gate G15) is closed on automated evidence at `A105` and certified in `docs/plans/gates.json`; hands-on owner acceptance is deferred to Milestone Gate `GFE` (`docs/plans/front-end-acceptance.md`).

## 2. Source-of-truth map

| Topic | Where | How to query |
| --- | --- | --- |
| Product spec | `docs/spec/The_Living_Portfolio_Open_Source_Spec.md` | Read by section number only |
| UX audit findings | `docs/audits/2026-11-06-ux-specification-audit/report.md` | Parts 2, 3, 3b by finding ID (`AUD-2026-11-06`) |
| Finding register | `docs/audits/register.yml` | `node scripts/handover-facts` and `node scripts/audit-check` |
| Work plan and tranches | `docs/plans/P004-ux-remediation-work-packages.md` | §1.1 UI Contract (`D-EDITOR-2`, `D-FOUND-1..6`); §7 Work Packages table |
| WP-15 capability parity | `docs/plans/P005-wp15-capability-parity.md` | Retired `workspace.ts` features and interim owner paths |
| Acceptance pack (`GFE`) | `docs/plans/front-end-acceptance.md` | Journeys `J1`–`J11` and milestone criteria for Gate `GFE` |
| Task protocol | `docs/plans/execution-protocol.md` | Read in full |
| Latest receipts | `docs/execution-reports/` | `docs/INDEX.md` |

## 3. Phase ledger

- **Completed:**
  - WP-1 through WP-14: Core controls, persistence, governance, algorithms, UX architecture, `v0.1.0` GA, onboarding/auth integrity (`H014`), and entry lifecycle integrity (`H015`, `475c2dd`).
  - WP-15: Foundations, monolith split, shared building blocks, design foundations, Reference Editor Page, token tiers, copy/help catalogues, and CI guard rails (receipts `A091` to `A105`; closed at `A105` on automated evidence):
    * `WP-15.0` (PR #121, merge `db89c96` [CI `43421425636` / Secret `43421425592` / CodeQL `43421425567` / Staging `43421425683` / Backup `43421425727`]): DOM-id baseline + `zod` 4 & `vitest` 4 migrations.
    * `WP-15.1` (PR #123, merge `25806d0` [CI `43422867750` / Secret `43422867687` / CodeQL `43422867672` / Staging `43422867739`]): mechanical split of `renderer.ts` under 300 lines.
    * `WP-15.2` (PR #124, merge `b3ea863` [CI `43425094591` / Secret `43425094543` / CodeQL `43425094697` / Staging `43425094629`]): shared controls/fields primitives + dev gallery.
    * `WP-15.3` (PR #125, merge `3bd9592` [CI `43427029923` / Secret `43427029943` / CodeQL `43427029927` / Staging `43427029949`]): shared feedback/container components.
    * `WP-15.3a` (PR #127 `caeae84` + PR #128, merge `7de8489` [CI `43568592254` / Secret `43568592176` / CodeQL `43568592167` / Staging `43568592203` / Backup `43576189626`]): Design Foundations (`D-FOUND-1..6`), SVG sprite, `/admin/dev/foundations` gallery.
    * `WP-15.7` (PR #126, merge `506a916` [CI `43596595511` / Secret `43596595523` / CodeQL `43596595484` / Staging `43596595537`]): Reference Editor Page (`pages/admin/entries/editor.ts`), Checkpoint 2 filmstrips, auth & dev-only gating.
    * `WP-15.pre-e` / `WP-15.pre-d` (PR #130 `00d05fc` [CI `43597780926` / Secret `43597780879` / CodeQL `43597780963`]; PR #129 `d715193` [CI `43598188317` / Secret `43598188375`]): triage allowlist + weekly CodeQL schedule.
    * `WP-15.4` (PR #131, merge `b8b440c` [CI `43602168235` / Secret `43602168164` / Staging `43602168214`]): token tiers, `D-EDITOR-2` wiring into `/admin`, and removal of `workspace.ts`.
    * `WP-15.5` (PR #132, merge `9257284` [CI `43603725121` / Secret `43603725064` / Staging `43603725030`]): copy and help catalogues.
    * `WP-15.6` (PR #133, merge `bf1f135` [CI `43604766331` / Secret `43604766397` / Staging `43604766410`]): UI contract, inline-style/hex/live-region/size-budget guards (`docs/audits/ui-guard-allowlist.json`).
    * Gate G15 Closure docs (PR #134 `dabe19b` [CI `43672136311` / Secret `43672136380`]; PR #135 `fc5c23f` [CI `43679031378` / Secret `43679031357`]; `A105`): sweep & contact-sheet findings, status normalisation, parity table, `UX-96..105`, `GFE` acceptance pack.
- **Current phase:** WP-16 Admin Shell, Entries & Inbox (ordered **`WP-16.0` -> `WP-16.1` -> `WP-16.2` -> `WP-16.3` -> `WP-16.4` -> `WP-16.5` -> `WP-16.6` -> `WP-16.7`**). **Definition of done:** `WP-16.0` restores safety/parity features (`UX-96`, `UX-104`, `UX-105`) and fixes editor/sweep defects (`UX-97..100`, `UX-102`, `UX-103`); `WP-16.1` swaps `setup`/`login`/`import`/`settings` shells and fixes `UX-101` (`320 px` settings overflow); `WP-16.2`–`WP-16.7` deliver Today, Entries list, dedicated editor routes (`UX-92`, `UX-93`), 5-tab Inspector, Inbox/Answer Rules, and retire the remaining monolith.
- **Next phases:** WP-17 Settings, Maintenance & Account; WP-18 Authoring Canvas & Import; WP-19 Public Frame & Time Travel -> **Milestone Gate `GFE` (Front-End Complete)** -> WP-20 Shape System, Locale Readiness, Polish & v0.2.0 Release.

## 4. Active workspace

- **Git:** `main` at `8dfd769` (preceded by PR #135 `fc5c23f`); open PRs: none; working tree: clean.
- **Next task:** `WP-16.0`: G15 defects & capability parity fixes (`UX-96`, `UX-97`, `UX-98`, `UX-99`, `UX-100`, `UX-102`, `UX-103`, `UX-104`, `UX-105`). Receipt number to use: `A106`.
- **Hot files (at most 7):**
  1. `apps/web/src/pages/admin/entries/editor.ts`: Reference Editor markup (fix `UX-98`, `UX-99`, `UX-102`, `UX-103`, restore `UX-104`, `UX-105`).
  2. `apps/web/src/client/admin/editor-page.ts`: Replace `setupMenu` with shared `Menu` primitive (`UX-97`), restore draft buffer/offline banner (`UX-96`), clear status line on dialog open (`UX-98`), render match details (`UX-99`).
  3. `apps/web/src/primitives/*` & `apps/web/src/components/*`: Shared `Menu`, `Dialog`, `StatusLine`, `Header` (`>= 44 px` brand hit area `UX-100`).
  4. `docs/audits/ui-guard-allowlist.json`: Shrinking-only UI guard allowlist (`inlineStyle`: 26 files, `hexColor`: 7 files, `liveRegion`: 16 files, `sizeBudgets: {}`).
  5. `docs/plans/P005-wp15-capability-parity.md`: Parity baseline for `WP-16.0`..`WP-18`.
  6. `docs/plans/front-end-acceptance.md`: Journeys `J1`–`J11` & Gate `GFE` criteria.
  7. `docs/plans/P004-ux-remediation-work-packages.md`: §7.7 WP-16 task table (`WP-16.0`..`WP-16.7`).
- **Immediate next actions (at most 7):**
  1. Open task `WP-16.0` on branch `feat/wp-16-0-g15-defects-and-parity` from `main`: write failing Playwright tests on the real `/admin` editor for `UX-96`..`UX-100`, `UX-102`..`UX-105`, implement fixes (draft buffer + `beforeunload` + offline banner, kill switch, escalation review card, shared `Menu` primitive, single active message place with dialogs, Publish match details, `>= 44 px` brand link, `<h1>` in empty/first-run, zero duplicate banner landmark), verify `pnpm verify` & `pnpm test:e2e`, open PR, merge with `--merge`.
  2. Open task `WP-16.1` (shell swap first, then full route registry): move `import` and `settings` into admin shell (fixing `/admin/settings` `320 px` overflow `UX-101`), `setup` and `login` into minimal auth shell, collapse setup stepper `< 768 px`, extend `verify-ui-guards`, and add the guarded route-table Playwright test.
  3. Open task `WP-16.2` (Today needs-attention page module) and `WP-16.3` (paginated Entries list page module).
  4. Open task `WP-16.4` (dedicated `/admin/entries/new` and `/admin/entries/:id` routes, mobile `Entries (n)` collapse `UX-92`, `New, unsaved` uncounted placeholder `UX-93`).
  5. Open task `WP-16.5` (5-tab Inspector module) and `WP-16.6` (Inbox and Answer Rules modules).
  6. Open task `WP-16.7` (retire monolith, update `gates.json`, stop for Gate `G16` review).
- **Pending decisions:** None (owner approved `D-EDITOR-2`, Gate `G15` closure on automated evidence, and deferred hands-on acceptance to Milestone Gate `GFE`).

## 5. Findings and backlog snapshot

- **Register counts (from `node scripts/handover-facts`):** 128 fixed, 46 partial, 46 open (P0: 1, P1: 26, P2: 19; Total: 220).
- **Open P0 findings (4 non-fixed P0 items):**
  - `20261106-UX-44` (`status: open`): Time travel drops entries revised after chosen date from list pages and timeline due to current-revision only filtering (`WP-19.5`).
  - `20261106-UX-09` (`status: partial`): Setup wizard step 3 Model Providers is read-only (`WP-17.2`).
  - `20261106-UX-27` (`status: partial`): Live public theme application (`WP-17.8`, `WP-20.1`).
  - `20261106-UX-43` (`status: partial`): Editor status line consolidated in Reference Editor; remaining legacy/module feedback (`WP-16`, `WP-17`).
- **New Gate G15 findings (`UX-96`..`UX-105`, all `status: open`):**
  - `UX-96` (P1, `WP-16.0`): Draft buffer, restore prompt, `beforeunload` guard, and offline banner lost with `workspace.ts`.
  - `UX-97` (P1, `WP-16.0`): Editor uses custom `setupMenu` (`Enter` keeps focus on trigger, `ArrowDown` no-op); replace with shared `Menu`.
  - `UX-98` (P1, `WP-16.0`): Two message places active when Publish dialog opens over saved status line.
  - `UX-99` (P1, `WP-16.0`): Publish dialog does not list matched private details (type, masked snippet, position, text link).
  - `UX-100` (P2, `WP-16.0`): `a.lp-admin-header-brand` is `24 px` high at `320 px` (`< 44 px`).
  - `UX-101` (P1, `WP-16.1`): `/admin/settings` overflows by `44 px` (`scrollWidth: 364`) at `320 px`.
  - `UX-102` (P2, `WP-16.0`): Empty & first-run states have no `<h1>`.
  - `UX-103` (P2, `WP-16.0`): Duplicate `banner` landmark on `.lp-admin-header` when overlays are open.
  - `UX-104` (P1, `WP-16.0`): Automated-answering kill switch removed from `/admin` workspace.
  - `UX-105` (P1, `WP-16.0`): Escalation review/approval card removed from `/admin` workspace (API-only until `WP-16.0`/`WP-16.6`).
- **Dependabot (`gh api repos/shiapenn/living-portfolio/dependabot/alerts --paginate`):** `27` closed (`critical: 2, high: 7, medium: 17, low: 1`), `1` open (`medium`: Alert #5 `vitest >= 2.1.0 < 4.1.11`, manifest `package.json`; `UX-51`, `UX-54` remain `partial` in `WP-16`).
- **Next five backlog items:** `WP-16.0`, `WP-16.1`, `WP-16.2`, `WP-16.3`, `WP-16.4`.

## 6. Decisions and pitfalls

- **Decisions and standing merge rules (at most 10):**
  - 2026-11-13: **Standing PR, Merge & Gate Rules:** One task = one branch = one PR into `main` = one receipt. Merge with a merge commit only (`gh pr merge <id> --merge`; never rebase/squash). Stop at every gate for owner review before closing the gate in `docs/plans/gates.json` or writing the handover.
  - 2026-11-14: **D-EDITOR-2 (Owner-Approved):** (a) One visibility control (`Public`/`Unlisted`: `Save changes` + `Visibility` menu; `Draft`: `Save draft` + `Publish…`; `More` holds only `History` and `Delete entry…`); (b) One CTA in empty & first-run states (hide sidebar `New entry` when `entries.length === 0`); (c) Save never disabled for hidden reason (`Save draft`/`Save changes` stay enabled and show `"No changes to save."` in status line).
  - 2026-11-15: **Interim Gate Closure & Gate `GFE` Policy (Owner-Approved):** Interim gates (`G15`–`G19`) close on CI, journey tests, sweep results, and contact-sheet review; hands-on owner acceptance across `J1`–`J11` is deferred to Milestone Gate `GFE` (`docs/plans/front-end-acceptance.md`) after `WP-19` and before `WP-20`.
- **Pitfalls and operational notes (at most 10):**
  - `docs/audits/ui-guard-allowlist.json`: Shrinking-only allowlist (`inlineStyle`: 26 files, `hexColor`: 7 files, `liveRegion`: 16 files, `sizeBudgets: {}`). Never add files or increase counts; remove files as pages migrate in `WP-16..WP-19`.
  - Port `4000` everywhere: `START-HERE.md` Path B uses `PORT=4000 ENABLE_BUNDLED_WEB=true pnpm --filter @living-portfolio/api dev`.
  - Real-route testing: Test `WP-16.0` fixes on `/admin` (not only `?fixture=` URLs).
- **Accepted technical debt (do not fix unprompted):**
  - Legacy `inlineStyle` / `hexColor` / `liveRegion` allowlist entries for unmigrated pages (`setup`, `login`, `import`, `settings`, public pages) until their scheduled WPs (`WP-16.1`, `WP-17`, `WP-18`, `WP-19`).

## 7. Verification harness

| Check | Command | Expected baseline (source) |
| --- | --- | --- |
| Full gate suite | `pnpm verify` | all 15 gates pass (PR #135 `fc5c23f` CI `43679031378`; `WP-15.6` `bf1f135` CI `43604766331`) |
| Unit and conformance tests | `pnpm test` | passes in CI `43604766331` (`bf1f135`) |
| End-to-end tests | `pnpm test:e2e` | passes in Chromium (`WP-15.6` `bf1f135` CI `43604766331`) |
| Audit & WP mapping check | `pnpm audit:check` | passes (`[AUD-WP-MAP]` verified across all 123 `20261106-*` findings) |
| Receipt check | `pnpm receipt:check A105` | passes (`A105` certified as WP-15 closing receipt in `gates.json`) |
| Docs check | `pnpm docs:check` | passes (147 registered documents including `H016`) |
| Handover check | `pnpm handover:check H016` | passes |
| Handover verify | `pnpm handover:verify H016` | passes |

## 8. Entry halt conditions and exit checklist

**Halt and report to L (change nothing) if:**
1. `origin/main` differs from the Evidence SHA by anything other than docs-only commits (plus `scripts/audit-check` and `scripts/handover-verify`).
2. `pnpm verify` or the baseline in section 7 does not match.
3. CI on `main` is red.
4. A pending decision in section 4 blocks Immediate Next Action 1.
5. A path, SHA or command cited here does not exist.

**Exit checklist for the next handover:** preconditions in IAHP section 4 met; Evidence SHA and CI runs recorded; sections derived, not narrated; resolved items deleted; `pnpm handover:check` passes; docs-only PR merged with merge commit; start prompt printed; session stopped.
