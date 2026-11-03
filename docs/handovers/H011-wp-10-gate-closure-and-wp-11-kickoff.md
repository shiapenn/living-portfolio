# H011 — WP-10 Gate closure and WP-11 kickoff

| Field | Value |
| --- | --- |
| Handover ID | `H011` |
| Date | 2026-11-03 |
| Author | A (Implementer) |
| Supersedes | H010 |
| Evidence SHA (on `main`) | `3b461be47dfd9aad0cb0b4d856738fda2a0d8639` |
| CI runs for that SHA | 41588081600 / 41588081541 / 41588081559 |
| Receipts covered | A001 to A050 |
| Phase closed | WP-10 Gate Closure (certified in docs/plans/gates.json) |
| Phase next | WP-11 (Milestone v0.2 UX & Structural Information Architecture) |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read `docs/handovers/H011-wp-10-gate-closure-and-wp-11-kickoff.md`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify H011`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4. Follow the execution protocol exactly: one task per PR, tests included, Rebase and merge, receipt as a file, no edits to earlier reports.

## 1. Mission and constitution

- **Objective:** The Living Portfolio is an open-source, self-hosted dynamic professional identity system providing proof-first claims, query-guided interactive answers, NDA-safe confidential redacting, and multi-tier AI responses without vendor or domain lock-in.
- **Non-negotiables:** Zero-hardcoded (no owner names, vendors, or sample clients in code; all values sourced from `@living-portfolio/config` or runtime data); decoupled (web and API separated by the versioned HTTP API `/api/v1`); self-hostable (every gate is a repo script runnable on any runner); honesty invariant (the UI never claims a status it has not measured); every receipt statement carries a status tag (`[implemented]`, `[partial]`, `[simulated]`, `[not-started]`).
- **Toolchain:** Node 22.x, pnpm 12.14.0, Vitest 3.0.7, Playwright 1.64.1, Turbo 2.4.4, TypeScript 5.7.3.
- **Authority:** A implements; L reviews and signs off gates; owner decides governance. Stop points: WP-1 closure (Gate 1b+), WP-2 closure (Gate 1c / G2 alpha), WP-3 closure (Gate 2 / Phase 2), WP-4 closure (Phase 3 / v0.2), WP-5 closure (Phase 4 / v0.3), WP-6 closure (Gate G2 Alpha Core), WP-7 closure (Gate G2 Finalization), WP-8 closure (Gate G3: Cloud Staging Readiness), WP-9 closure (Gate G4: Backup, Restore Drill, Observability & Hardening), WP-10 closure (Milestone v0.2 Algorithms & Quality Tuning), and prior to G5 public release.

## 2. Source-of-truth map

| Topic | Where | How to query |
| --- | --- | --- |
| Product spec | `docs/spec/The_Living_Portfolio_Open_Source_Spec.md` | Read by section number only |
| UX audit findings | `docs/audits/2026-10-20-ux-specification-audit/report.md` | Parts 2, 3, 3b by finding ID |
| Finding register | `docs/audits/register.yml` | `node scripts/handover-facts` |
| Work plan and tranches | `docs/plans/remediation-plan-AUD-2026-10-19.md`, `docs/plans/osr-001-open-source-release.md` | §1 & §2 |
| Task protocol | `docs/plans/execution-protocol.md` | Read in full |
| Latest receipts | `docs/execution-reports/` | `docs/INDEX.md` |

## 3. Phase ledger

- **Completed:**
  - Phase 0: Housekeeping, P0 conformance probes, and governance alignment (receipts A001 to A008, evidence `a37f734`).
  - WP-1: Gate 1b+ Core Controls delivery (receipts A009 to A017, evidence `c7936d4`).
  - WP-2: Gate 1c / G2 Alpha Persistence & Dual-Write delivery (receipts A018 to A022, evidence `295c09d`).
  - WP-3: Gate 2 / Phase 2 Pre-G4 Core Engine & Governance delivery (receipts A023 to A027, evidence `78f8cf6`).
  - WP-4: Phase 3 / v0.2 Structure Review Loop, Escalation, Booking & Time-Travel delivery (receipts A028 to A030, evidence `b5882ad`).
  - WP-5: Phase 4 / v0.3 Admin Operational Controls, Setup Wizard, Sub-Route Mounting & Redaction Drawer delivery (receipts A031 to A033, evidence `da00e60`).
  - WP-6: Gate G2 Alpha Core Closure & Release Packaging (receipt A034, evidence `2ee5a34`).
  - WP-7: Gate G2 Finalization: API Versioning & Web Decoupling (receipts A035 to A037, evidence `7eafe3e`).
  - WP-8: Gate G3 Cloud Staging Readiness delivery (receipts A038 to A040, evidence `1cc1a6b`).
  - WP-9: Gate G4 Operational Durability & Hardening delivery (receipts A041 to A044, evidence `5c88e03`).
  - WP-10: Milestone v0.2 Algorithms, Retrieval & Quality Tuning delivery (receipts A045 to A050, evidence `3b461be`):
    * WP-10.1 (`A045`): Pre-delivery verification entailment judge comparing generated answer statements against context, assertion stripping of ungrounded sentences, `citedScopes` matching and injection into response, and explicit fallback/time-travel reconstruction labeling (`M3`).
    * WP-10.2 (`A046`): Query classification upgrade replacing keyword heuristics with model-based intent routing, strict advisory default on ambiguity, About path routing citing `/about`, and `needs_context` prompt handling (`M4`).
    * WP-10.3 (`A047`): Self-calibration runtime layer with sliding-window feedback tracking, held-out validation, Expected Calibration Error (ECE < 0.05) threshold checking, bounded step clamping, freeze guard (`calibrationFrozen`), and atomic rollback endpoint (`M5`).
    * WP-10.4 (`A048`): Dynamic topology audit detector identifying disconnected nodes, unconfirmed relations, and conflicting claims without creating edges, owner-only write test enforcement, and scope-overlap staleness detector with recompute-on-accept trigger (`M6`, `M7`).
    * WP-10.5 (`A049`): Import planner budget enforcement (maxEntries, maxBytes, time caps), resumable checkpointed import jobs, core source connectors (GitHub, file-tree, Substack, Markdown, JSON feed) with declared permissions, and concrete notification adapters (email, webhook, Telegram, Slack) with dead-letter queue (`M9`).
    * WP-10.6 (`A050`): Labeled evaluation runner with golden benchmark dataset, baseline retrieval comparisons, structure ablation, provider chaos fault injection (timeout/429 fallback ladder), auth/injection security gates, and axe accessibility test suite (`M11`).
    * WP-10.7 (`H011`): Work Package 10 gate closure certification, gates manifest verification, and Handover Snapshot H011.
- **Current phase:** Handover Snapshot H011 (`HO-11`). **Definition of done:** `docs/handovers/H011-wp-10-gate-closure-and-wp-11-kickoff.md` supersedes H010, passes `handover-check`, and verifies on `main`.
- **Next phases:**
  - WP-11 (Milestone v0.2 UX & Structural Information Architecture): Debounced publishing UX, Ask flow repair, navigation redesign, accessibility mechanics, full CommonMark/GFM rendering, component design tokens, and copy cleanup.
  - WP-12 (Milestone v0.1.0 GA): Visual polish, Strata overhaul, string localization, open-source governance file set, full documentation set, and v0.1.0 GA tag.

## 4. Active workspace

- **Git:** `main` at `3b461be` (Evidence SHA `3b461be47dfd9aad0cb0b4d856738fda2a0d8639`); open PRs: none; working tree: clean; branches holding unmerged work: none.
- **Next task:** `WP-11.1`: Debounced static rebuild progress UI and Ask flow repair (`20261020-UX-05`, `20261020-UX-10`). Receipt number to use: `A051`.
- **Hot files (at most 7):**
  1. `docs/plans/execution-protocol.md`: Binding engineering protocol for tasks, PRs, and receipts.
  2. `docs/plans/remediation-plan-AUD-2026-10-19.md`: Milestone v0.2 UX & IA remediation specification.
  3. `docs/audits/register.yml`: Finding register tracking open, partial, and fixed items.
  4. `docs/plans/gates.json`: Stage gates manifest certifying WP-1 through WP-10 closure.
  5. `apps/web/src/app.ts`: Ask flow visitor interface and response rendering.
  6. `apps/worker/src/worker.ts`: Background job processing, static site rebuild, and enrichment queueing.
  7. `scripts/triage`: Autonomous triage gate evaluator.
- **Immediate next actions (ordered, at most 7):**
  1. Create feature branch for WP-11.1 from current `main`.
  2. Implement debounced static rebuild progress UI in admin workspace with 10-minute window and 12/day cap (`20261020-UX-05`).
  3. Wire real background enrichment enqueueing on entry publication and manual trigger (`20261020-UX-05`).
  4. Implement Ask flow `needs_context` state and dynamic query-guided facet prompts (`20261020-UX-10`).
  5. Preserve entry-scoped ask context on screen, prevent double submission, and handle 429 rate limits gracefully (`20261020-UX-10`).
  6. Author comprehensive conformance tests and update `docs/audits/register.yml` findings `20261020-UX-05` and `20261020-UX-10` to fixed.
  7. Run `pnpm verify` locally, open PR / push with DCO sign-offs, verify CI passes, and publish receipt `A051`.
- **Pending decisions:** None.

## 5. Findings and backlog snapshot

- **Register counts (from `node scripts/handover-facts`):** 71 fixed, 0 partial, 26 open (P0: 0, P1: 16, P2: 8, P3: 2; 97 total).
- **Open P0 findings:** None (0 open P0 findings; all critical security & architecture findings fixed).
- **Next five backlog items:**
  1. `20261020-UX-05`: Two meanings of "publish" are collapsed. Visibility change is instant; the static site rebuild is debounced (10 min, 12 per day) and has no UI. "Background enrichment queued" is shown but nothing enqueues (verified)
  2. `20261020-UX-10`: Ask flow gaps. No `needs_context` state; facets are two hard-coded inputs revealed by a keyword heuristic that duplicates the server classifier (`:652`). Entry-scoped asks lose their scope on screen. A 429 comes back as `tier: 'no_match'` and displays as "Not in records". Submit is not disabled while waiting (double submit burns the hourly limit). No streaming. Example questions are hard-coded, not from entries. Non-JSON errors fall to a misleading "Origin unreachable"
  3. `20261020-UX-13`: Anti-pattern A. See 2.2 for the full IA critique. Eight flat nav items incl. **Admin** for anonymous visitors; `/now /uses /book /about` mixed with primary destinations or unreachable; `/build/:slug` 404; `/writing` and `/work` duplicate each other and cross-link; "featured" is every entry; `/work` filters outcome only; Home makes five repo calls per entry
  4. `20261020-UX-14`: System-state coverage is thin. See 2.4
  5. `20261020-UX-15`: Accessibility mechanics. No skip link (`#main-content` exists, unreferenced). Home has no `<h1>` (verified). Theme toggle: with a dark OS and no saved choice, the first click sets "dark" (no visible change). Timeline bands are `<button onclick=location.href>` (navigation as buttons). Dimmed bands use `opacity:.35` *(contrast likely below 4.5:1, inferred)*. Controls with `min-height` 30 and 34px *(inferred below 44px)*. `localStorage` is unguarded. Static alpha banner uses `role="alert"`. No Playwright or axe

## 6. Decisions and pitfalls

- **Decisions (at most 10):**
  - 2026-10-21: Rebase and merge strictly enforced across all PRs to preserve DCO trailers and clean linear history. Reason: Squash merges drop commit DCO trailers. Where: `docs/plans/execution-protocol.md`.
  - 2026-10-22: Autonomous triage gate removes manual sign-off overhead. Reason: Operators act strictly on TRIAGE: HUMAN REQUIRED triggers. Where: `docs/execution-reports/A017-wp-1-gate-closure-triage-and-handover-facts.md`.
  - 2026-10-26: Default database engine cut over to Postgres with in-memory deprecated in production. Reason: Concludes Gate 1c and closes persistence findings P1, P2, P3, F2, F3. Where: `docs/plans/gates.json`.
  - 2026-10-26: Bitemporal time semantics enforce immutable revisions and real SHA-256 hashing. Reason: Prevents retrospective history rewriting and eliminates temporal leaks. Where: `docs/execution-reports/A023-wp3-1-cms-lifecycle.md`.
  - 2026-11-02: Age authenticated encryption and companion sidecar for database dumps. Reason: Meets §13.9 operational durability and automated CI restore drill. Where: `docs/execution-reports/A041-wp-91-real-backups-and-restore-drill.md`.
  - 2026-11-02: Pino structured logging and sliding-window error spike alert. Reason: Meets §13.5 and §13.9 observability requirements without proprietary agent dependencies. Where: `docs/execution-reports/A042-wp-92-observability-budget-caps-and-spend-alerts.md`.
  - 2026-11-02: Declarative auto-rollback deploy script with required reviewer gating. Reason: Ensures zero-downtime verifiable production deployment. Where: `docs/execution-reports/A043-wp-93-production-deploy-and-auto-rollback.md`.
  - 2026-11-02: Pre-delivery verification entailment judge and claim stripping. Reason: Prevents LLM hallucinations from being served to visitors. Where: `docs/execution-reports/A045-wp-101-pre-delivery-entailment-verification-judge.md`.
  - 2026-11-03: Provider-based query classification with strict advisory default. Reason: Eliminates brittle substring heuristics and supports about queries. Where: `docs/execution-reports/A046-wp-102-query-classification-upgrade-and-about-path.md`.
  - 2026-11-03: Self-calibration layer with held-out ECE validation and freeze guard. Reason: Prevents drift or overconfidence in dynamic routing parameters. Where: `docs/execution-reports/A047-wp-103-self-calibration-routing-calibration-rollback.md`.
- **Pitfalls and dead ends (at most 10):**
  - Never use squash merges or merge commits; always use rebase and merge. Because: Squash commits drop author DCO trailers and break linear history. See: `docs/plans/execution-protocol.md`.
  - Never hardcode owner identities, emails, or vendor names in code or test mocks. Because: Violates zero-hardcoded non-negotiable and breaks hardcode-check. See: `scripts/verify-all`.
  - Do not edit historical receipts A001 through A049. Because: Receipts are immutable audit records sealed with Evidence SHAs. See: `scripts/receipt-check`.
  - Do not modify files in `.github/workflows/` without explicit authorization. Because: scripts/triage classifies them as protected files requiring triage authorization. See: `scripts/triage`.
  - Always run `pnpm build` across packages before running Playwright E2E suites. Because: Playwright imports package outputs from `dist/` rather than source TypeScript. See: `tests/e2e/`.
  - In AnswerCache, pass `visitorFacets` as the 3rd argument to `get()`, not claim IDs. Because: Passing claim IDs causes type errors in facet serialization. See: `packages/ai/src/cache/answer-cache.ts`.
  - Do not create E2E test files that run alphabetically before `auth.spec.ts` if they execute admin setup. Because: They consume the setup wizard prematurely and break auth tests. See: `tests/e2e/wp10-accessibility.spec.ts`.
- **Accepted technical debt (do not fix unprompted):**
  - Internal schema jargon in visitor UI (`20261020-CP-02`, scheduled for WP-11.5).
  - Single-tier CSS tokens and non-standard typography sizing (`20261020-UI-02`, scheduled for WP-11.4).
  - Flat 8-item navigation and missing skip link (`20261020-UX-13`, `20261020-UX-15`, scheduled for WP-11.2 and WP-11.3).

## 7. Verification harness

| Check | Command | Expected baseline (source) |
| --- | --- | --- |
| Full gate suite | `pnpm verify` | all gates pass (CI 41588081600) |
| Unit and conformance tests | `pnpm test` | 417 tests in 43 files (CI 41588081600) |
| End-to-end tests | `pnpm test:e2e` | 27 tests in 11.7s (CI 41588081600) |
| SARIF static analysis | `pnpm sarif:check` | 0 unbaselined alerts across 1 file (CI 41588081541) |
| Secret scan | `pnpm secret:scan` | 189 commits scanned, 0 leaks (CI 41588081559) |
| Receipt check | `pnpm receipt:check A050` | passes |
| Docs check | `pnpm docs:check` | passes |
| Handover verify | `pnpm handover:verify H011` | passes |
| CI log retrieval | `gh run view <run-id> --log` | needs `gh auth status` logged in |

Fresh-clone procedure for gate sign-off: `git clone https://github.com/shiapenn/living-portfolio.git && cd living-portfolio && git checkout main && pnpm install && pnpm verify && pnpm handover:verify H011`.

## 8. Entry halt conditions and exit checklist

**Halt and report to L (change nothing) if:**
1. `origin/main` differs from the Evidence SHA by anything other than docs-only commits.
2. `pnpm verify` or the baseline in section 7 does not match.
3. CI on `main` is red.
4. A pending decision in section 4 blocks Immediate Next Action 1.
5. A path, SHA or command cited here does not exist.

**Exit checklist for the next handover:** preconditions in IAHP section 4 met; Evidence SHA and CI runs recorded; sections derived, not narrated; resolved items deleted; `pnpm handover:check` passes; docs-only PR merged with Rebase and merge; start prompt printed; session stopped.
