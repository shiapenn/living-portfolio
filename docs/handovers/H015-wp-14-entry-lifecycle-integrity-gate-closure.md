# H015 — WP-14 entry lifecycle integrity gate closure

| Field | Value |
| --- | --- |
| Handover ID | `H015` |
| Date | 2026-11-10 |
| Author | A (Implementer) |
| Supersedes | H014 |
| Evidence SHA (on `main`) | `4cda311dac33ce012cbc3cc6b83d64a430b1db53` |
| CI runs for that SHA | 42774989134 / 42774989302 / 42774989419 (commit 4cda311); 42774767695 / 42774767821 / 42774767690 (PR #104 head a397993) |
| Receipts covered | A001 through A087 |
| Phase closed | WP-14 Gate Closure (certified in docs/plans/gates.json) |
| Phase next | WP-15 Foundations, Monolith Split, Shared Building Blocks & Reference Editor Page |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read `docs/handovers/H015-wp-14-entry-lifecycle-integrity-gate-closure.md`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify H015`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4. Follow the execution protocol and standing merge rules in section 6: one task per PR, tests included, merge commits only (`gh pr merge --merge`), receipt as a file, no edits to earlier reports.

## 1. Mission and constitution

- **Objective:** The Living Portfolio is an open-source, self-hosted dynamic professional identity system providing proof-first claims, query-guided interactive answers, NDA-safe confidential redacting, and multi-tier AI responses without vendor or domain lock-in.
- **Non-negotiables:** Zero-hardcoded (no owner names, vendors, or sample clients in code; all values sourced from `@living-portfolio/config` or runtime data); decoupled (web and API separated by the versioned HTTP API `/api/v1`); self-hostable (every gate is a repo script runnable on any runner); honesty invariant (the UI never claims a status it has not measured); every receipt statement carries a status tag (`[implemented]`, `[partial]`, `[simulated]`, `[not-started]`).
- **Toolchain:** Node 22.x, pnpm 12.14.0, Vitest 3.0.7, Playwright 1.64.1, Turbo 2.4.4, TypeScript 5.7.3.
- **Authority:** A implements; L reviews and closes gates; owner decides governance. Work Package 14 (Gate G14) is closed and certified in `docs/plans/gates.json`.

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
  - WP-13: Onboarding and authentication integrity (receipts A060 to A074, handover H014, WP-13 merge commit `5628357` on `main` with CI runs 42464818468 / 42464818387 / 42464818382).
  - WP-14: Entry lifecycle integrity and pre-task dependency/CI hardening (receipts A075 to A087; Gate G14 closure merge commit `4cda311` on `main` with CI runs 42774989134 / 42774989302 / 42774989419):
    * WP-14.pre-a (`A075`, PR #92): Dependency vulnerability review and Dependabot triage (`20261106-UX-51` partial; task evidence `036fc20`; PR head `09c521b` [CI 42485334140 / 42485334075 / 42485334161]; merge commit `9b03835` [CI 42489721052 / 42489721076 / 42489721149]).
    * WP-14.pre-b (`A076`, PR #93; docs corrections `A077` in PR #94 and `A079` in PR #96): CodeQL and Gitleaks download retry loops with exponential backoff, plus `UX-53` and `UX-54` registrations and `zod-collection-guard.conformance.test.ts` (`20261106-UX-52` partial; task evidence `a14fcae` / `377e35e` / `7976977`; PR heads `a405215` [CI 42491664853] / `ea91ecd` [CI 42751211377] / `efcb7bc` [CI 42759187778]; merge commits `166cb9f` [CI 42491949409] / `91b64c6` [CI 42751542743] / `728d91d` [CI 42760339473]).
    * WP-14.0a (`A078`, PR #95; error-case test added in `A079`, PR #96): Editor results visible in viewport (`#editor-status-line`, `#editor-toast`), focus move, and entries list refresh (`20261106-UX-43`; task evidence `db0082b`; PR #95 head `5923bd9` [CI 42754272314 / 42754272821 / 42754272143]; merge commit `a8012dc` [CI 42757704638 / 42757704639 / 42757704871]).
    * WP-14.0 (`A080`, PR #97): Client bundling via esbuild (`apps/web/src/client/admin-entry.ts` -> `dist/client/admin-entry.js`) with CSP nonce support (task evidence `0d02302`; PR head `a83f8b8` [CI 42761791832 / 42761791634 / 42761791795]; merge commit `ce7dabc` [CI 42762569511 / 42762569791 / 42762569493]).
    * WP-14.1 (`A081`, PR #98): Formal `commitEntry` state machine (`save`, `publish`, `unlist`, `unpublish`), preserving public state on Save draft, updating saved entries via `PUT`, undo with token, and specific 409/400 error mapping (`20261106-UX-01`..`UX-04`, `CP-12`; task evidence `10b163d`; PR head `eda1ae3` [CI 42764148268 / 42764148403 / 42764148480]; merge commit `49f7ada` [CI 42764794917 / 42764795130 / 42764794961]).
    * WP-14.2 (`A082`, PR #99): Live `#chip-current-state` (Draft / Public / Unlisted), client date default to today, inline date validation without `RangeError`, and temporal confidence selector (`20261106-UX-10`, `UX-11`, `UX-22`; task evidence `e72b4ad`; PR head `5442aa8` [CI 42765534227 / 42765534543 / 42765534131]; merge commit `e888a6f` [CI 42765865414 / 42765865538 / 42765865350]).
    * WP-14.3 (`A083`, PR #100): Accessible `#publish-dialog` with auto-run redaction scan, conditional NDA gate, Public/Unlisted choice, focus trap/return, and toast Unpublish action (`20261106-UX-03`, `UX-13`; task evidence `20b53d7`; PR head `1eb4d55` [CI 42766924603 / 42766924758 / 42766924628]; merge commit `69f24ff` [CI 42767199408 / 42767199518 / 42767199367]).
    * WP-14.4 (`A084`, PR #101): Debounced IndexedDB draft buffer (`apps/web/src/client/draft-buffer.ts`), restore prompt on reload, `beforeunload` dirty guard, and offline banner (task evidence `0c77e5d`; PR head `20b72a1` [CI 42768300516 / 42768300753 / 42768300643]; merge commit `27869bb` [CI 42768634328 / 42768634307 / 42768634516]).
    * WP-14.5 (`A085`, PR #102): Spec §11 calibration defaults (parameter mechanisms off by default, proposal mechanisms proposal-only, 20-sample minimum gate, `±0.05` step limit, 4 mechanism switches) (`20261106-UX-08`; task evidence `cf13ed1`; PR head `79a0d7e` [CI 42771249482 / 42771249484 / 42771249164]; merge commit `e1c179d` [CI 42771576334 / 42771576294 / 42771576375]).
    * WP-14.6 (`A086`, PR #103): Missing CSS custom properties defined, drawer/dialog background opacity restored, `flex-wrap:gap` typos fixed, and `scripts/verify-css-variables` gate added (`20261106-UI-01` partial, `20261106-UI-03` partial; task evidence `1759ab2`; PR head `d2e48d1` [CI 42773514952 / 42773514806 / 42773514680]; merge commit `f53656f` [CI 42773887782 / 42773887402 / 42773887735]).
    * Gate G14 Closure (`A087`, PR #104): Gate G14 summary receipt and `gates.json` update (task evidence `c43b846`; PR head `a397993` [CI 42774767695 / 42774767821 / 42774767690]; merge commit `4cda311` [CI 42774989134 / 42774989302 / 42774989419]).
- **Current phase:** WP-15 Foundations, Monolith Split, Shared Building Blocks & Reference Editor Page. **Definition of done:** DOM-id and string baseline snapshot script (`WP-15.0`) + deferred dependency migrations (`UX-53`, `UX-54`), mechanical renderer split under 300 lines (`WP-15.1`), shared building blocks in one place (`WP-15.2` controls/fields, `WP-15.3` feedback/containers including `StatusLine` and persistent dismissible notice), complete token tiers (`WP-15.4`), copy and help catalogues (`WP-15.5`), CI guard rails (`WP-15.6`), and Editor rebuilt as the reference page (`WP-15.7`).
- **Next phases:** WP-16 Admin Shell, Entries & Inbox; WP-17 Settings, Maintenance & Account; WP-18 Authoring Canvas & Import; WP-19 Public Frame & Time Travel; WP-20 Shape System, Locale Readiness, Polish & v0.2.0 Release.

## 4. Active workspace

- **Git:** `main` at `4cda311` (Gate G14 Evidence SHA `4cda311dac33ce012cbc3cc6b83d64a430b1db53` with CI runs 42774989134 / 42774989302 / 42774989419; PR #104 head `a397993` with CI runs 42774767695 / 42774767821 / 42774767690); open PRs: none; working tree: clean; branches holding unmerged work: none.
- **Next task:** `WP-15.0`: Baseline for safe refactoring (`snapshot-dom-ids` script under `scripts/` recording every rendered element `id`, `data-testid`, `data-*` hook, and user-visible string asserted by existing tests, plus `UX-53` and `UX-54` migrations). Receipt number to use: `A091`.
- **Hot files (at most 7):**
  1. `scripts/verify-css-variables`: Existing verification gate in `scripts/` (new `snapshot-dom-ids` script to be added alongside it in `WP-15.0`).
  2. `apps/web/src/renderer.ts`: 5,625-line SSR renderer to baseline in `WP-15.0` and split mechanically first in `WP-15.1` while preserving the compatibility barrel for `apps/api/src/adapter/bundled-web.ts`.
  3. `apps/web/src/tokens/index.ts`: Design token definitions to complete in `WP-15.4` after the monolith split and shared building blocks.
  4. `apps/web/src/styles.ts`: Stylesheet rules and state styles (`WP-15.2`, `WP-15.3`, `WP-15.4`, `WP-15.7`).
  5. `apps/web/src/client/admin-entry.ts`: Client entry module and `showEditorFeedback()` to separate inline status vs toast live-region announcements (`WP-15.3`, `WP-15.7`, `UX-56`, `UX-60`) and remove owner-facing jargon (`WP-15.5`, `UX-55`).
  6. `apps/web/src/strings/en.ts`: String and help catalogue home (`WP-15.5`).
  7. `docs/plans/P004-ux-remediation-work-packages.md`: §1.1 UI Contract (`D-UI-1..D-UI-6`, `D-CONTRACT-1..D-CONTRACT-5`, `D-ORDER`) and §7.6 WP-15 task table.
- **Immediate next actions (ordered, at most 7):**
  1. Open task `WP-15.0` on branch `feat/wp-15-0-dom-id-baseline` from `main`: create the `snapshot-dom-ids` script under `scripts/` that renders every page with fixture data and records every element `id`, `data-testid`, and `data-*` hook plus the list of user-visible strings asserted by existing tests; commit the baseline snapshot; wire into `pnpm verify` so deleting an ID without an allowlist entry fails CI; complete deferred `zod` 4 (`UX-53`) and `vitest` 4 (`UX-54`) migrations; verify locally with `pnpm verify` and `pnpm test:e2e`, open PR into `main`, wait for green CI, and merge with `gh pr merge --merge`.
  2. Open task `WP-15.1` on branch `feat/wp-15-1-monolith-split` from `main`: split `apps/web/src/renderer.ts` mechanically into per-page modules keeping the compatibility barrel in `apps/web/src/renderer.ts` under 300 lines with no behavioural or styling changes (`D-ORDER`, `D-CONTRACT-3`).
  3. Open task `WP-15.2` on branch `feat/wp-15-2-shared-primitives-gallery` from `main`: implement shared building blocks part 1 (`Button` primary/secondary/danger/quiet, `IconButton` with label, `Chip`, `Badge`, `StatusDot`, `Switch`, `Field`) and development-only gallery route with axe and target-size tests (`D-CONTRACT-2`, `D-CONTRACT-5`, `UI-03`, `UX-23`, `UX-38`).
  4. Open task `WP-15.3` on branch `feat/wp-15-3-feedback-and-containers` from `main`: implement shared building blocks part 2 (`StatusLine`, persistent dismissible notice for pages without an inline status region per `D-CONTRACT-4`, `Toast`, `Dialog`, `Drawer`, `Disclosure`, `Tabs`, `Table`, `EmptyState`) (`D-CONTRACT-2`, `D-CONTRACT-4`, `UX-13`, `UX-14`, `UX-15`, `UX-25`, `UX-56` part, `UX-60` part).
  5. Execute `WP-15.4` (complete token tiers in Audit Report §2.2.1 applied to shared building blocks and split modules; `UI-01`), `WP-15.5` (copy and help catalogues in `strings/*`, removing `"L0"`, `"Enrichment pipeline queued"`, and `"revisions purged"` jargon per `D-CONTRACT-1`, `UX-55`, and `CP-01`), `WP-15.6` (CI guard rails in `pnpm verify`), and `WP-15.7` (Editor rebuilt as Reference Page under `D-UI-1..D-UI-6` and `D-CONTRACT-1..D-CONTRACT-5`; `UX-12` part, `UX-37` part, `UX-55`, `UX-56`, `UX-60`).
- **Pending decisions:** None (all architectural decisions D-01..D-10 closed in Audit Report §8).

## 5. Findings and backlog snapshot

- **Register counts (from `node scripts/handover-facts`):** 120 fixed, 9 partial, 46 open (P0: 1, P1: 25, P2: 20; Total: 175).
- **Open P0 findings (1):**
  - `20261106-UX-44`: Time travel drops entries revised after chosen date from list pages and timeline due to current-revision only filtering
  *(Note: `node scripts/handover-facts` lists 3 non-fixed P0 items because `20261106-UX-09` and `20261106-UX-27` have `severity: P0` with `status: partial`; both are listed in the 9 partial findings below.)*
- **All 9 `status: partial` findings (with reason and target WP):**
  - `20261106-UX-09`: Setup wizard step 3 Model Providers is a read-only table with no API-key field, live validation, or storage choice
  - `20261106-UX-27`: Wizard steps 2 to 6 persist nothing: hosting preset, domain, notifications, backup destination, age key, and theme are dropped
  - `20261106-UX-33`: Unconfigured capabilities show live buttons that return 501 instead of honest disabled explanation
  - `20261106-UX-41`: No account management screens to change username/password, re-enrol authenticator, manage API tokens, or sign out
  - `20261106-CP-01`: Engineering and test suite jargon leaks into owner UI strings (SIMULATED finding M6, 501, honesty invariant, Tier 1 Floor)
  - `20261106-UX-51`: Dependency review: 23 vulnerabilities on main (2 critical, 7 high, 14 moderate) and 4 open Dependabot PRs
  - `20261106-UX-52`: CI flakiness from GitHub-hosted downloads: CodeQL bundle 504 and transient Gitleaks checksum mismatch
  - `20261106-UI-01`: Eight CSS variables referenced without definition; 684 inline style attributes; redaction drawer has missing background
  - `20261106-UI-03`: Lack of visual distinction between badge, chip, button, switch, tab, and card controls due to missing radius tokens
  *(Partial reasons and target WPs for all 9: `UX-09` wizard step 3 made honestly read-only in WP-13.9 -> live validation/key storage in **WP-17.2**; `UX-27` wizard steps 2–6 persisted in WP-13.4/13.10 -> live public theme application in **WP-17.8** and **WP-20.1**; `UX-33` live wizard controls that fail in a default install disabled with plain explanation in WP-13.5/13.9 -> notification/backup settings screens in **WP-17.2** and **WP-17.3**; `UX-41` admin header Sign out added in WP-13.6 -> full account management in **WP-17.4**; `CP-01` wizard 501 jargon removed in WP-13.9 -> full copy catalogue and sweep in **WP-15.5** and **WP-20.4**; `UX-51` runtime alerts `@hono/node-server` & `drizzle-orm` patched and PRs #82–#85 reconciled in WP-14.pre-a -> major `zod` 4 [`UX-53`] & `vitest` 4 [`UX-54`] migrations in **WP-15.0**; `UX-52` download retry with backoff added in WP-14.pre-b -> unproven until failure observed, monitor across **WP-15..WP-20**; `UI-01` missing CSS variables defined and `verify-css-variables` gate added in WP-14.6 -> full token tiers and inline style guard in **WP-15.4** and **WP-15.6**; `UI-03` missing radius tokens defined in WP-14.6 -> UI primitives and reference editor page styling in **WP-15.2** and **WP-15.7**.)*
- **Carry-forward open findings and migrations:**
  - `20261106-UX-47`: Owner account recovery codes regeneration UI in Settings > Account
  - `20261106-UX-49`: Setup wizard dead end if browser closed between account creation and TOTP confirmation
  - `20261106-UX-50`: docs/START-HERE.md keeps unmeasured "< 15 min" figure retained to satisfy conformance check
  - `20261106-UX-53`: Zod 4 migration blocked by z.record signature change and OpenAPI AST reflection drift
  - `20261106-UX-54`: Vitest 4, Tinypool, and esbuild dev-only migrations deferred to WP-15
  - `20261106-UX-55`: Owner-facing jargon in editor messages ("L0", "Enrichment pipeline queued", "N revisions purged")
  - `20261106-UX-56`: Duplicate editor feedback in inline status line and toast with double live-region announcement
  - `20261106-UX-60`: Toasts disappear after a few seconds without hover/focus pause or dismiss button and repeat the inline status message
  *(Target WPs for carry-forward open items: `UX-47` & `UX-49` -> **WP-17.4**; `UX-50` -> **WP-20.6**; `UX-53` & `UX-54` -> **WP-15.0**; `UX-55` -> **WP-15.5** & **WP-15.7**; `UX-56` & `UX-60` -> **WP-15.3** & **WP-15.7**.)*
- **Next five backlog items:** `WP-15.0`, `WP-15.1`, `WP-15.2`, `WP-15.3`, `WP-15.4`.

## 6. Decisions and pitfalls

- **Decisions and standing merge rules (at most 10):**
  - 2026-11-10: **Standing PR & Merge Rules:** One task = one branch = one PR into `main` = one receipt. Always merge with a merge commit (`gh pr merge <id> --merge`; never rebase, never squash) after full GitHub Actions CI is green so every receipt's `Evidence SHA` remains an ancestor of `main`. Never merge a red PR or a Dependabot PR directly.
  - 2026-11-10: **Standing Gate Stop Rule:** At the end of a Work Package, stop and report for owner gate review before closing the gate in `docs/plans/gates.json` or writing the handover. Do not mark a gate closed on `main` prior to owner gate confirmation (process deviation recorded in `A087` §1).
  - 2026-11-10: **Editor Feedback & Live Regions (`UX-56`):** Audit Report §8 closes D-01..D-10 and delegates feedback architecture to §5.4.1, §6.4, and §7.6 (`WP-15.3` / `UX-15`). Inline status (`#editor-status-line`) and viewport toast (`#editor-toast`) serve distinct purposes, and only one may be an active ARIA live region (`aria-live="polite"`) so screen readers announce once.
  - 2026-11-10: **Editor Copy Jargon (`UX-55`):** Replace internal terms (`"Published ... at L0"`, `"Enrichment pipeline queued"`, `"N revisions purged"`) with plain owner-facing copy per Audit Report §2.3.3 (`"'{title}' is live. View page →"`) in `WP-15.5` and `WP-16.4`.
  - 2026-11-10: **Client Bundling Architecture (`WP-14.0`):** Client-side interactivity lives in typed modules under `apps/web/src/client/` bundled by `esbuild` (`apps/web/package.json` `build:client` script) into `/static/client/admin-entry.js` and served with the layout CSP nonce.
  - 2026-11-10: **Zod 3 Collection Guard (`UX-53`):** `apps/api/src/conformance/zod-collection-guard.conformance.test.ts` fails if any `z.array`, `z.set`, or `z.tuple` schema is introduced before the Zod 4 migration (`GHSA-mrhx-c7xc-m3w5` / `CVE-2023-54404`).
- **Pitfalls and operational notes (at most 10):**
  - Compatibility barrel for `bundled-web.ts`: `apps/api/src/adapter/bundled-web.ts` imports `renderAdmin*` and public page render functions from `@living-portfolio/web`; when splitting `apps/web/src/renderer.ts` in `WP-15.1`, keep re-exporting all existing function names from `apps/web/src/renderer.ts`.
  - Preserve test hooks (`WP-15.0`): Existing conformance and Playwright suites assert specific element `id`s, `data-*` attributes, and strings (for example `tests/e2e/redaction.spec.ts` asserts `Published "..." at L0` and `tests/e2e/wp11-publish-and-ask.spec.ts` asserts `Enrichment pipeline queued`); when `WP-15.5` updates those strings, update the matching tests in the same PR.
  - CSS variable gate (`WP-14.6`): `scripts/verify-css-variables` runs in `pnpm verify` Step 10 and fails on any `var(--x)` referenced in `apps/web/src/` without a `:root` definition in `tokens/index.ts` or `styles.ts`.
  - Dependency Review workflow: GitHub Dependency Review is non-gating on this repository configuration (unsupported runner / graph warning); rely on `gh api repos/shiapenn/living-portfolio/dependabot/alerts --paginate` and `pnpm verify`.
  - Path A vs Path B: Path A (Docker Compose) was not run in this environment; Path B (`PORT=4000 ENABLE_BUNDLED_WEB=true pnpm --filter @living-portfolio/api dev`) runs on port `4000` with ephemeral in-memory storage, while Playwright starts `pnpm dev:full` on port `3000` (web) + `4000` (API).
  - Historical SHA map: `scripts/historical-sha-map.json` maps `9221074` -> `253c744` for receipt `A073`; do not remove it.
- **Accepted technical debt (do not fix unprompted):**
  - Inline `style=` attributes in legacy files (to be guarded with an allowlist in `WP-15.6` and eliminated as pages are rebuilt in `WP-16..WP-19`).

## 7. Verification harness

| Check | Command | Expected baseline (source) |
| --- | --- | --- |
| Full gate suite | `pnpm verify` | all 14 gates pass (CI 42774989134 on 4cda311) |
| Unit and conformance tests | `pnpm test` | 365 tests in 43 files pass in apps/api (CI 42774989134 on 4cda311) |
| End-to-end tests | `pnpm test:e2e` | 77 tests in 19 files pass in Chromium (CI 42774989134 on 4cda311) |
| CSS variable check | `node scripts/verify-css-variables` | passes with 0 undefined variables |
| Receipt check | `pnpm receipt:check A087` | passes (A087 certified as WP-14 closing receipt in gates.json) |
| Docs check | `pnpm docs:check` | passes (126 registered documents) |
| Handover check | `pnpm handover:check H015` | passes |
| Handover verify | `pnpm handover:verify H015` | passes |
| CI log retrieval | `gh run view <run-id> --log` | needs `gh auth status` logged in |

Fresh-clone procedure for gate closure: clone repo, run `cp .env.example .env && pnpm install && pnpm build && pnpm verify`, and for manual Path B walkthrough run `PORT=4000 ENABLE_BUNDLED_WEB=true pnpm --filter @living-portfolio/api dev` on `http://localhost:4000/admin` (`A087` §10).

## 8. Entry halt conditions and exit checklist

**Halt and report to L (change nothing) if:**
1. `origin/main` differs from the Evidence SHA by anything other than docs-only commits.
2. `pnpm verify` or the baseline in section 7 does not match.
3. CI on `main` is red.
4. A pending decision in section 4 blocks Immediate Next Action 1.
5. A path, SHA or command cited here does not exist.

**Exit checklist for the next handover:** preconditions in IAHP section 4 met; Evidence SHA and CI runs recorded; sections derived, not narrated; resolved items deleted; `pnpm handover:check` passes; docs-only PR merged with merge commit; start prompt printed; session stopped.
