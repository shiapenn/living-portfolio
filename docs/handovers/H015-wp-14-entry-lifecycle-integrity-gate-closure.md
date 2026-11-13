# H015 — WP-14 entry lifecycle integrity gate closure

| Field | Value |
| --- | --- |
| Handover ID | `H015` |
| Date | 2026-11-13 |
| Author | A (Implementer) |
| Supersedes | H014 |
| Evidence SHA (on `main`) | `475c2ddf2951722dab23ab103ef9e2c041bd1393` |
| CI runs for that SHA | 43398224356 / 43398224228 / 43398224144 (commit `475c2dd` on `main`); 43398026139 / 43398026030 / 43398026018 (PR #118 head `62f895c`); 43394080468 / 43394080555 / 43394080590 / 43394080514 (`WP-14.7` merge `4dc9b32` on `main`) |
| Receipts covered | A001 through A090 |
| Phase closed | WP-14 Gate Closure (certified in docs/plans/gates.json at A090) |
| Phase next | WP-15 Foundations, Monolith Split, Shared Building Blocks & Reference Editor Page |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read `docs/handovers/H015-wp-14-entry-lifecycle-integrity-gate-closure.md`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify H015`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4. Follow the execution protocol and standing merge rules in section 6: one task per PR, tests included, merge commits only (`gh pr merge --merge`), receipt as a file, no edits to earlier reports.

## 1. Mission and constitution

- **Objective:** The Living Portfolio is an open-source, self-hosted dynamic professional identity system providing proof-first claims, query-guided interactive answers, NDA-safe confidential redacting, and multi-tier AI responses without vendor or domain lock-in.
- **Non-negotiables:** Zero-hardcoded (no owner names, vendors, or sample clients in code; all values sourced from `@living-portfolio/config` or runtime data); decoupled (web and API separated by the versioned HTTP API `/api/v1`); self-hostable (every gate is a repo script runnable on any runner); honesty invariant (the UI never claims a status it has not measured); every receipt statement carries a status tag (`[implemented]`, `[partial]`, `[simulated]`, `[not-started]`).
- **Toolchain:** Node 22.x, pnpm 12.14.0, Vitest 3.0.7, Playwright 1.64.1, Turbo 2.4.4, TypeScript 5.7.3.
- **Authority:** A implements; L reviews and closes gates; owner decides governance. Work Package 14 (Gate G14) is closed for correctness at `A090` and certified in `docs/plans/gates.json`.

## 2. Source-of-truth map

| Topic | Where | How to query |
| --- | --- | --- |
| Product spec | `docs/spec/The_Living_Portfolio_Open_Source_Spec.md` | Read by section number only |
| UX audit findings | `docs/audits/2026-11-06-ux-specification-audit/report.md` | Parts 2, 3, 3b by finding ID (AUD-2026-11-06; 2026-10-20 path is earlier audit) |
| Finding register | `docs/audits/register.yml` | `node scripts/handover-facts` and `node scripts/audit-check` |
| Work plan and tranches | `docs/plans/P004-ux-remediation-work-packages.md` | §1.1 UI Contract & Owner Decisions; §7 Work Packages table |
| Task protocol | `docs/plans/execution-protocol.md` | Read in full |
| Latest receipts | `docs/execution-reports/` | `docs/INDEX.md` |

## 3. Phase ledger

- **Completed:**
  - WP-1 through WP-12: Core controls, persistence, governance, algorithms, UX architecture, and v0.1.0 GA release (receipts A001 to A059, handover H013, evidence `31700e1`).
  - WP-13: Onboarding and authentication integrity (receipts A060 to A074, handover H014, WP-13 merge commit `5628357` on `main` [CI 42464818468 / 42464818387 / 42464818382]; H014 merge commit `14b0a01` on `main` [CI 42471720311 / 42471720242 / 42471720243]). *(Correction note on H014 §3: H014 §3 "Next phases" was corrected in PR #117 [`7284aa5`] because it had mislabeled `WP-16` as "Monolith Split & Workspace Restructure" and `WP-17` as "Visual Craft, Polish & v0.2.0 Release", whereas `P004` §7.2 and `gates.json` place the mechanical monolith split in `WP-15.1` under `WP-15` ["Foundations, Monolith Split, Shared Building Blocks & Reference Editor Page"], `WP-16` is "Admin Shell, Entries & Inbox", and `WP-17` is "Settings, Maintenance & Account".)*
  - WP-14: Entry lifecycle integrity, dependency/CI hardening, and hotfix verification (receipts A075 to A090; Gate G14 closing report merge commit `475c2dd` on `main` [CI 43398224356 / 43398224228 / 43398224144]):
    * WP-14.pre-a (`A075`, PR #92): Dependency vulnerability review and Dependabot triage (`20261106-UX-51` partial; task evidence `036fc20`; PR head `09c521b` [CI 42485334140 / 42485334075 / 42485334161]; merge commit `9b03835` [CI 42489721052 / 42489721076 / 42489721149]).
    * WP-14.pre-b (`A076`, PR #93; docs corrections `A077` in PR #94 and `A079` in PR #96): CodeQL and Gitleaks download retry loops with exponential backoff, `UX-53` and `UX-54` registrations, and `zod-collection-guard.conformance.test.ts` (`20261106-UX-52` partial; task evidence `a14fcae` / `377e35e` / `7976977`; PR heads `a405215` [CI 42491664853] / `ea91ecd` [CI 42751211377] / `efcb7bc` [CI 42759187778]; merge commits `166cb9f` [CI 42491949409] / `91b64c6` [CI 42751542743] / `728d91d` [CI 42760339473]).
    * WP-14.pre-c (`A088`, PR #106; Dependabot config PR #114): Docs-only PR skips for Playwright/CodeQL, single-arch staging builds on `main`, and monthly Dependabot schedule with 1 PR limit per ecosystem and `zod`/`vitest` major ignores (task evidence `09f7fe7` / `eca2164`; PR heads `50a93a9` [CI 43387771115] / `eca2164` [CI 43394936936]; merge commits `b4a577c` [CI 43388204215] / `200efbe` [CI 43395324060]).
    * WP-14.0a (`A078`, PR #95; error-case test in `A079`, PR #96): Editor results visible in viewport (`#editor-status-line`, `#editor-toast`), focus move, and entries list refresh (`20261106-UX-43` partial; task evidence `db0082b`; PR #95 head `5923bd9` [CI 42754272314 / 42754272821 / 42754272143]; merge commit `a8012dc` [CI 42757704638 / 42757704639 / 42757704871]).
    * WP-14.0 (`A080`, PR #97): Client bundling via esbuild (`apps/web/src/client/admin-entry.ts` -> `dist/client/admin-entry.js`) with CSP nonce support (task evidence `0d02302`; PR head `a83f8b8` [CI 42761791832 / 42761791634 / 42761791795]; merge commit `ce7dabc` [CI 42762569511 / 42762569791 / 42762569493]).
    * WP-14.1 (`A081`, PR #98): Formal `commitEntry` state machine (`save`, `publish`, `unlist`, `unpublish`), preserving public state on Save draft, updating saved entries via `PUT`, and specific 409/400 error mapping (`20261106-UX-01`..`UX-03`, `CP-12`; task evidence `10b163d`; PR head `eda1ae3` [CI 42764148268 / 42764148403 / 42764148480]; merge commit `49f7ada` [CI 42764794917 / 42764795130 / 42764794961]).
    * WP-14.2 (`A082`, PR #99): Live `#chip-current-state` (Draft / Public / Unlisted), client date default to today, inline date validation without `RangeError`, and temporal confidence selector (`20261106-UX-10`, `UX-11`, `UX-22`; task evidence `e72b4ad`; PR head `5442aa8` [CI 42765534227 / 42765534543 / 42765534131]; merge commit `e888a6f` [CI 42765865414 / 42765865538 / 42765865350]).
    * WP-14.3 (`A083`, PR #100): Accessible `#publish-confirm-dialog` with auto-run redaction scan, conditional NDA gate, Public/Unlisted choice, focus trap/return, and toast Unpublish action (`20261106-UX-03`, `UX-13`; task evidence `20b53d7`; PR head `1eb4d55` [CI 42766924603 / 42766924758 / 42766924628]; merge commit `69f24ff` [CI 42767199408 / 42767199518 / 42767199367]).
    * WP-14.4 (`A084`, PR #101): Debounced IndexedDB draft buffer (`apps/web/src/client/draft-buffer.ts`), restore prompt on reload, `beforeunload` dirty guard, and offline banner (task evidence `0c77e5d`; PR head `20b72a1` [CI 42768300516 / 42768300753 / 42768300643]; merge commit `27869bb` [CI 42768634328 / 42768634307 / 42768634516]).
    * WP-14.5 (`A085`, PR #102): Spec §11 calibration defaults (parameter mechanisms off by default, proposal mechanisms proposal-only, 20-sample minimum gate, `±0.05` step limit, 4 mechanism switches) (`20261106-UX-08`; task evidence `cf13ed1`; PR head `79a0d7e` [CI 42771249482 / 42771249484 / 42771249164]; merge commit `e1c179d` [CI 42771576334 / 42771576294 / 42771576375]).
    * WP-14.6 (`A086`, PR #103): Missing CSS custom properties defined, drawer/dialog background opacity restored, `flex-wrap:gap` typos fixed, and `scripts/verify-css-variables` gate added (`20261106-UI-01` partial, `20261106-UI-03` partial; task evidence `1759ab2`; PR head `d2e48d1` [CI 42773514952 / 42773514806 / 42773514680]; merge commit `f53656f` [CI 42773887782 / 42773887402 / 42773887735]).
    * WP-14.7 (`A089`, PR #113; earlier premature closure `A087` in PR #104 [`4cda311`]): Removed duplicate `#btn-publish-entry`, enforced server-side `verifyScanApprovalToken` and `nda_confirmed` on every transition to `public`, wired working `Undo` buttons in `#editor-status-line` and `#editor-toast` with 1s countdown for Unpublish and Save draft, returned `currentRevision` on `GET /api/entries/:slug`, dynamically numbered `#publish-confirm-dialog` headings (`1, 2, 3` vs `1, 2, 3, 4`), and verified `unlisted` visibility (`20261106-UX-04`, `UX-57`, `UX-58`, `UX-59` fixed; task evidence `c436424`; PR head `b7a9d5d` [CI 43391622918 / 43391622934 / 43391622971]; merge commit `4dc9b32` [CI 43394080468 / 43394080555 / 43394080590 / 43394080514]).
    * Gate G14 Closure (`A090`, PR #118; UI contract PR #117 [`7284aa5`, CI 43396878063]): Gate G14 closing report and acceptance script (task evidence `70f5676`; PR #118 head `62f895c` [CI 43398026139 / 43398026030 / 43398026018]; merge commit `475c2dd` [CI 43398224356 / 43398224228 / 43398224144]).
- **Current phase:** WP-15 Foundations, Monolith Split, Shared Building Blocks & Reference Editor Page (reordered per `D-ORDER`: **`WP-15.0` -> `WP-15.1` -> `WP-15.2` -> `WP-15.3` -> `WP-15.7` -> `WP-15.4` -> `WP-15.5` -> `WP-15.6`**). **Definition of done:** DOM-id and string baseline snapshot script (`WP-15.0`) + deferred dependency migrations (`UX-53`, `UX-54`), mechanical renderer split under 300 lines (`WP-15.1`), shared building blocks (`WP-15.2` controls/fields, `WP-15.3` feedback/containers), Reference Editor Page rebuilt to `D-WORKSPACE`, `D-EDITOR`, `D-FEEDBACK`, and `D-HELP` with interaction contract tests across `draft`, `unlisted`, `public`, `error`, `empty`, and `first-run` states (`WP-15.7`), and token tiers (`WP-15.4`), copy/help catalogues (`WP-15.5`), and CI guard rails (`WP-15.6`) applied to that real page.
- **Next phases:** WP-16 Admin Shell, Entries & Inbox; WP-17 Settings, Maintenance & Account; WP-18 Authoring Canvas & Import; WP-19 Public Frame & Time Travel; WP-20 Shape System, Locale Readiness, Polish & v0.2.0 Release.

## 4. Active workspace

- **Git:** `main` at `475c2dd` (Gate G14 Evidence SHA `475c2ddf2951722dab23ab103ef9e2c041bd1393` with CI runs 43398224356 / 43398224228 / 43398224144; PR #118 head `62f895c` with CI runs 43398026139 / 43398026030 / 43398026018; `WP-14.7` code merge `4dc9b32` with CI runs 43394080468 / 43394080555 / 43394080590 / 43394080514); open PRs: none; working tree: clean; branches holding unmerged work: none.
- **Next task:** `WP-15.0`: Baseline for safe refactoring (`snapshot-dom-ids` script under `scripts/` recording every rendered element `id`, `data-testid`, `data-*` hook, and user-visible string asserted by existing tests, plus `UX-53` and `UX-54` migrations). Receipt number to use: `A091`.
- **Hot files (at most 7):**
  1. `scripts/audit-check`: Audit register validator including `[AUD-WP-MAP]` (verifying every `20261106-*` finding maps to one WP or explicit `(part)` mappings with reasons in `docs/audits/register.yml`).
  2. `apps/web/src/renderer.ts`: 5,625-line SSR renderer to baseline in `WP-15.0`, split mechanically in `WP-15.1`, and rebuild the reference editor page in `WP-15.7`.
  3. `apps/web/src/client/admin-entry.ts`: Client entry module and `showEditorFeedback()` (writes `#editor-status-line`, `#editor-toast`, and `#admin-status-banner`; to be consolidated to `#editor-status-line` only in `WP-15.3` and `WP-15.7` per `D-FEEDBACK`).
  4. `apps/web/src/client/commit-entry.ts`: Editor action dispatcher, `showUndoBanner()`, and `clearPreviewToken()` (to clear scan state and hide NDA/token clutter in `WP-15.7` per `D-EDITOR`).
  5. `apps/web/src/tokens/index.ts`: Design token definitions to complete in `WP-15.4` and apply to the real reference editor page.
  6. `apps/web/src/strings/en.ts`: String and help catalogue home (`WP-15.5`).
  7. `docs/plans/P004-ux-remediation-work-packages.md`: §1.1 UI Contract (`D-UI-1..6`, `D-CONTRACT-1..7`, `D-WORKSPACE`, `D-EDITOR`, `D-FEEDBACK`, `D-HELP`, `D-ORDER`) and §7.6 WP-15 task table.
- **Immediate next actions (ordered per `D-ORDER`, at most 7):**
  1. Open task `WP-15.0` on branch `feat/wp-15-0-dom-id-baseline` from `main`: create `snapshot-dom-ids` under `scripts/` recording every rendered `id`, `data-testid`, `data-*` hook, and user-visible string asserted by tests; commit the baseline snapshot; wire into `pnpm verify`; complete deferred `zod` 4 (`UX-53`) and `vitest` 4 (`UX-54`) migrations; run `pnpm verify` and `pnpm test:e2e`, open PR into `main`, and merge with `gh pr merge --merge`.
  2. Open task `WP-15.1` on branch `feat/wp-15-1-monolith-split` from `main`: split `apps/web/src/renderer.ts` mechanically into per-page modules keeping the compatibility barrel in `apps/web/src/renderer.ts` under 300 lines with no behavioural or styling changes (`D-ORDER`, `D-CONTRACT-3`).
  3. Open task `WP-15.2` on branch `feat/wp-15-2-shared-primitives-gallery` from `main`: implement shared building blocks part 1 (`Button` primary/secondary/danger/quiet, `IconButton` with label, `Chip`, `Badge`, `StatusDot`, `Switch`, `Field` with full-width non-truncated `select`) and dev-only gallery route (`D-CONTRACT-2`, `D-CONTRACT-5`, `D-CONTRACT-6`, `UI-03`, `UX-23`, `UX-38`, `UX-67` part).
  4. Open task `WP-15.3` on branch `feat/wp-15-3-feedback-and-containers` from `main`: implement shared building blocks part 2 (`StatusLine` as the single editor feedback region, persistent dismissible notice for non-editor pages per `D-CONTRACT-4` & `D-CONTRACT-7`, `Dialog`, `Drawer`, `Disclosure`, `Tabs`, `Table`, `EmptyState`) (`D-FEEDBACK`, `UX-13`..`UX-15`, `UX-25`, `UX-43` part, `UX-56` part, `UX-60` part).
  5. Open task `WP-15.7` on branch `feat/wp-15-7-editor-reference-page` from `main`: rebuild the Editor as the **Reference Page** to `D-WORKSPACE`, `D-EDITOR`, `D-FEEDBACK`, and `D-HELP` (separate admin frame without public nav/footer; state-driven action bar per entry state; visibility only inside `Publish…` dialog; scan/NDA only inside dialog; one feedback place `#editor-status-line`; mode radio tabs; collapsible details; bug fixes `UX-61`..`UX-69`) and add the **interaction contract test** asserting across `draft`, `unlisted`, `public`, `error`, `empty`, and `first-run` states the exact visible action set and that only one message place is active.
  6. Open task `WP-15.4` on branch `feat/wp-15-4-token-tiers` and task `WP-15.5` on branch `feat/wp-15-5-copy-and-help-catalogues` from `main`: apply complete token tiers (`UI-01`) and `strings/en.ts` + `help/en.ts` catalogues (`D-HELP`, `D-CONTRACT-1`, `UX-55`, `UX-66`, `CP-01`) directly to the shared building blocks and the live `WP-15.7` reference editor page.
  7. Open task `WP-15.6` on branch `feat/wp-15-6-ci-guard-rails` from `main`: wire `pnpm verify` CI guard rails (no raw hex/px/ms outside `tokens/*`, no inline `style=` in rebuilt modules, no multiple primary buttons per region, no internal jargon in `strings/*`, and `snapshot-dom-ids` diff clean) (`UI-01`, `UX-29` part, `CP-01` part), then stop for Gate G15 review.
- **Pending decisions:** None (`D-WORKSPACE`, `D-EDITOR`, `D-FEEDBACK`, `D-HELP`, `D-UI-1..6`, `D-CONTRACT-1..7`, and `D-ORDER` are owner-approved in `P004` §1.1).

## 5. Findings and backlog snapshot

- **Register counts (from `node scripts/handover-facts`):** 118 fixed, 11 partial, 55 open (P0: 1, P1: 31, P2: 23; Total: 184).
- **Open P0 findings (1):**
  - `20261106-UX-44`: Time travel drops entries revised after chosen date from list pages and timeline due to current-revision only filtering
  *(Note: `node scripts/handover-facts` lists 4 non-fixed P0 items because `20261106-UX-09`, `20261106-UX-27`, and `20261106-UX-43` have `severity: P0` with `status: partial`; all 3 are in the 11 partial findings below.)*
- **All 11 `status: partial` findings (with reason and target WP):**
  - `20261106-UX-09`: Setup wizard step 3 Model Providers is a read-only table with no API-key field, live validation, or storage choice
  - `20261106-UX-27`: Wizard steps 2 to 6 persist nothing: hosting preset, domain, notifications, backup destination, age key, and theme are dropped
  - `20261106-UX-29`: Competing end-of-step actions with multiple primary buttons across account creation and final wizard step
  - `20261106-UX-33`: Unconfigured capabilities show live buttons that return 501 instead of honest disabled explanation
  - `20261106-UX-41`: No account management screens to change username/password, re-enrol authenticator, manage API tokens, or sign out
  - `20261106-UX-43`: Editor results written to banner at top of page away from action, with no auto-scroll, focus move, or list refresh
  - `20261106-CP-01`: Engineering and test suite jargon leaks into owner UI strings (SIMULATED finding M6, 501, honesty invariant, Tier 1 Floor)
  - `20261106-UX-51`: Dependency review: 23 vulnerabilities on main (2 critical, 7 high, 14 moderate) and 4 open Dependabot PRs
  - `20261106-UX-52`: CI flakiness from GitHub-hosted downloads: CodeQL bundle 504 and transient Gitleaks checksum mismatch
  - `20261106-UI-01`: Eight CSS variables referenced without definition; 684 inline style attributes; redaction drawer has missing background
  - `20261106-UI-03`: Lack of visual distinction between badge, chip, button, switch, tab, and card controls due to missing radius tokens
  *(Partial reasons and target WPs: `UX-09` wizard step 3 honest read-only in WP-13.9 -> live validation/key storage in **WP-17.2**; `UX-27` wizard steps 2–6 persisted in WP-13.4/13.10 -> live public theme application in **WP-17.8** and **WP-20.1**; `UX-29` wizard single primary button fixed in WP-13.5 -> editor competing primary actions (`Publish Now` vs `Publish…` vs `Save draft`) in **WP-15.6** and **WP-15.7**; `UX-33` wizard 501 buttons disabled in WP-13.5/13.9 -> settings screens in **WP-17.2** and **WP-17.3**; `UX-41` header Sign out added in WP-13.6 -> full account management in **WP-17.4**; `UX-43` `#editor-status-line` added in WP-14.0a -> still writes duplicate message to `#admin-status-banner` and `#editor-toast`, to be consolidated to `#editor-status-line` only in **WP-15.3** and **WP-15.7**; `CP-01` wizard 501 jargon removed in WP-13.9 -> editor/conflicts jargon removal and CI guard in **WP-15.5**, **WP-15.6**, and **WP-20.4**; `UX-51` runtime alerts patched in WP-14.pre-a -> `zod` 4 [`UX-53`] & `vitest` 4 [`UX-54`] migrations in **WP-15.0**; `UX-52` download retry added in WP-14.pre-b -> monitor across **WP-15..WP-20**; `UI-01` missing CSS variables defined in WP-14.6 -> token tiers and inline style guard in **WP-15.4** and **WP-15.6**; `UI-03` radius tokens defined in WP-14.6 -> shared primitives and reference editor page in **WP-15.2** and **WP-15.7**.)*
- **Carry-forward open findings and editor interface findings (`UX-47`, `UX-49`, `UX-50`, `UX-53..56`, `UX-60..69`):**
  - `20261106-UX-47`: Owner account recovery codes regeneration UI in Settings > Account
  - `20261106-UX-49`: Setup wizard dead end if browser closed between account creation and TOTP confirmation
  - `20261106-UX-50`: docs/START-HERE.md keeps unmeasured "< 15 min" figure retained to satisfy conformance check
  - `20261106-UX-53`: Zod 4 migration blocked by z.record signature change and OpenAPI AST reflection drift
  - `20261106-UX-54`: Vitest 4, Tinypool, and esbuild dev-only migrations deferred to WP-15
  - `20261106-UX-55`: Owner-facing jargon in editor messages ("L0", "Enrichment pipeline queued", "N revisions purged")
  - `20261106-UX-56`: Duplicate editor feedback in inline status line and toast with double live-region announcement
  - `20261106-UX-60`: Toasts disappear after a few seconds without hover/focus pause or dismiss button and repeat the inline status message
  - `20261106-UX-61`: Admin workspace renders inside public site header navigation and footer including "unofficial fork" notice
  - `20261106-UX-62`: Site-wide actions mixed with entry actions on editor screen, duplicate "Publish" naming ("Publish Now" vs "Publish…"), and "Deploy: Building..." contradicting "Static rebuild: Idle"
  - `20261106-UX-63`: Six editor action buttons across two rows; Unlist and Unpublish both shown on unlisted entry; Delete adjacent to Unpublish; "Check for private details" duplicates dialog scan
  - `20261106-UX-64`: Entry visibility controlled by both a Visibility select dropdown and a separate Unlist button
  - `20261106-UX-65`: NDA confirmation panel, inline scan result, and raw "Signed preview token" permanently visible in editor and not cleanly cleared across edits and actions
  - `20261106-UX-66`: Developer copy in editor workspace UI: Body label "min 60vh editor workspace", Inspector "never a percentage score" and "Unlocks: ...", and "501 Not Implemented" / "SIMULATED finding M6" in Conflicts
  - `20261106-UX-67`: Editor workspace bugs: "Entries (0)" with one entry listed, "Inspector: Inspector: New Draft" on saved unlisted entry, "1 words" grammar, and truncated select values ("Case stu", "Exact (de")
  - `20261106-UX-68`: First-Run walkthrough shown with existing entry and steps run together on one line; empty Inbox, Conflicts, and three permanent status chips consume editor space
  - `20261106-UX-69`: Authoring mode buttons (Paste / Freeform, Guided Mode, Quick Log) look like action buttons with no selected state, and five metadata fields are crammed above the body
- **Next five backlog items:** `WP-15.0`, `WP-15.1`, `WP-15.2`, `WP-15.3`, `WP-15.7`.

## 6. Decisions and pitfalls

- **Decisions and standing merge rules (at most 10):**
  - 2026-11-13: **Standing PR, Merge & Gate Rules:** One task = one branch = one PR into `main` = one receipt. Merge with a merge commit only (`gh pr merge <id> --merge`; never rebase/squash). Stop at every gate for owner review before closing the gate in `docs/plans/gates.json` or writing the handover.
  - 2026-11-13: **D-WORKSPACE (Owner-Approved):** Admin uses its own frame (workspace navigation + Sign out), never the public site header (`Portfolio / Work / Writing / Ask / Search / RSS`) or public footer (`unofficial fork`). Site-wide build/deploy controls (`Publish Now`, `Deploy: ...`) live in Settings/Publishing (`WP-17.1`), not the entry editor, and use one status word (`Idle`, `Building`, `Live`, `Failed`).
  - 2026-11-13: **D-EDITOR (Owner-Approved):** State-driven action bar: **Draft** (`Save draft` primary, `Publish…` secondary, `Delete` in overflow/separated); **Unlisted** (`Save changes` primary, `Make public…` secondary, `Revert to draft` secondary, `Delete` in overflow); **Public** (`Save changes` primary, `Change visibility…` secondary, `Unpublish` secondary, `Delete` in overflow). Visibility is chosen only in `Publish…` / `Change visibility…` dialog; scan and NDA live only inside `Publish…` dialog and never show a raw token; authoring mode is a radio tab group with `aria-selected`; Title + Body stay primary while Type/Dates/Confidence/Summary/Tags collapse into a Details drawer/disclosure; Inbox/Conflicts move to top-level nav with count badges; First-Run banner shows only when `entries.length === 0` or until dismissed.
  - 2026-11-13: **D-FEEDBACK & D-CONTRACT-7 (Owner-Approved):** One feedback place per page: the editor uses only the inline status line (`#editor-status-line`, `role="status" aria-live="polite"`) next to the action buttons (with `Undo` when applicable) and removes `#admin-status-banner` and `#editor-toast` for editor actions. Pages without an inline status area use a persistent dismissible notice, never a timed toast (`D-CONTRACT-7`).
  - 2026-11-13: **D-HELP & D-CONTRACT-6 (Owner-Approved):** Every owner-facing string is plain language (`D-CONTRACT-1`). Help uses a 3-tier progressive model: Tier 1 short hint, Tier 2 `?` popover (`What this is` / `Why it matters` / `Example`), Tier 3 inline message on action/problem. Any control that cannot work in the current install (`501`) is not rendered (`D-CONTRACT-6`).
  - 2026-11-13: **D-ORDER (Reordered WP-15):** Execute `WP-15.0` -> `WP-15.1` -> `WP-15.2` -> `WP-15.3` -> **`WP-15.7` (Reference Editor Page with interaction contract test)** -> **`WP-15.4`..`WP-15.6` applied to that real page**.
- **Pitfalls and operational notes (at most 10):**
  - Three duplicate message places in editor (`UX-43`, `UX-56`, `UX-60`): Currently `showEditorFeedback()` in `apps/web/src/client/admin-entry.ts` (L74–101) and `apps/web/src/renderer.ts` (L2704–2727) plus `showUndoBanner()` in `apps/web/src/client/commit-entry.ts` (L176–240) write the same message into `#admin-status-banner` / `#admin-undo-banner`, `#editor-status-line`, and `#editor-toast` (`showPublishSuccessToast()` in `publish-dialog.ts` L154–176 also writes `#editor-toast`). In `WP-15.3` and `WP-15.7`, consolidate editor feedback strictly to `#editor-status-line`.
  - Redaction scan state leak (`UX-65`): In `apps/web/src/client/commit-entry.ts` L61–72, `clearPreviewToken('invalidated')` replaces `#redaction-preview-box` with an invalidated banner rather than hiding it, and `commitEntry('unlist' | 'save')` never clears `#redaction-preview-box` or `#preview-token-badge`. Move scan and NDA entirely inside `#publish-confirm-dialog` in `WP-15.7`.
  - Compatibility barrel (`WP-15.1`): `apps/api/src/adapter/bundled-web.ts` imports render functions from `@living-portfolio/web`; keep re-exporting all existing function names from `apps/web/src/renderer.ts`.
  - Audit WP mapping check (`scripts/audit-check`): `[AUD-WP-MAP]` enforces that every `20261106-*` finding in `docs/audits/register.yml` maps to one WP in `P004` §7.2 and `gates.json`, or lists explicit `(part)` mappings with reasons in `register.yml`.
  - Preserve test hooks (`WP-15.0`): Update matching Playwright/conformance expectations in the same PR when `WP-15.7` and `WP-15.5` replace legacy editor controls and jargon strings.
- **Accepted technical debt (do not fix unprompted):**
  - Inline `style=` attributes in non-editor legacy pages (guarded in `WP-15.6` and eliminated as pages are rebuilt in `WP-16..WP-19`).

## 7. Verification harness

| Check | Command | Expected baseline (source) |
| --- | --- | --- |
| Full gate suite | `pnpm verify` | all 14 gates pass (CI 43394080468 on 4dc9b32; CI 43398224356 on 475c2dd) |
| Unit and conformance tests | `pnpm test` | 367 tests in 44 files pass in apps/api (CI 43394080468 on 4dc9b32) |
| End-to-end tests | `pnpm test:e2e` | 81 tests in 20 files pass in Chromium (CI 43394080468 on 4dc9b32) |
| Audit & WP mapping check | `pnpm audit:check` | passes (`[AUD-WP-MAP]` verified across all 87 `20261106-*` findings) |
| CSS variable check | `node scripts/verify-css-variables` | passes with 0 undefined variables |
| Receipt check | `pnpm receipt:check A090` | passes (A090 certified as WP-14 closing receipt in gates.json) |
| Docs check | `pnpm docs:check` | passes (129 registered documents) |
| Handover check | `pnpm handover:check H015` | passes |
| Handover verify | `pnpm handover:verify H015` | passes |

Fresh-clone procedure for gate closure: clone repo, run `cp .env.example .env && pnpm install && pnpm build && pnpm verify`, and for manual Path B walkthrough run `PORT=4000 ENABLE_BUNDLED_WEB=true pnpm --filter @living-portfolio/api dev` on `http://localhost:4000/admin/setup` (`A090` §10).

## 8. Entry halt conditions and exit checklist

**Halt and report to L (change nothing) if:**
1. `origin/main` differs from the Evidence SHA by anything other than docs-only commits (plus `scripts/audit-check` and `scripts/handover-verify`).
2. `pnpm verify` or the baseline in section 7 does not match.
3. CI on `main` is red.
4. A pending decision in section 4 blocks Immediate Next Action 1.
5. A path, SHA or command cited here does not exist.

**Exit checklist for the next handover:** preconditions in IAHP section 4 met; Evidence SHA and CI runs recorded; sections derived, not narrated; resolved items deleted; `pnpm handover:check` passes; docs-only PR merged with merge commit; start prompt printed; session stopped.
