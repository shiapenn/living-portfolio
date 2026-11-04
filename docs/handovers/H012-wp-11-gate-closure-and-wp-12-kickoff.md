# H012 — WP-11 Gate closure and WP-12 kickoff

| Field | Value |
| --- | --- |
| Handover ID | `H012` |
| Date | 2026-11-04 |
| Author | A (Implementer) |
| Supersedes | H011 |
| Evidence SHA (on `main`) | `0980796c15d085e28fc6ab0271d313fde13981b3` |
| CI runs for that SHA | 41639073610 / 41639073441 / 41639073572 |
| Receipts covered | A001 to A055 |
| Phase closed | WP-11 Gate Closure (certified in docs/plans/gates.json) |
| Phase next | WP-12 (Milestone v0.1.0 GA: Visual Polish, Copy & General Availability) |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read `docs/handovers/H012-wp-11-gate-closure-and-wp-12-kickoff.md`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify H012`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4. Follow the execution protocol exactly: one task per PR, tests included, Rebase and merge, receipt as a file, no edits to earlier reports.

## 1. Mission and constitution

- **Objective:** The Living Portfolio is an open-source, self-hosted dynamic professional identity system providing proof-first claims, query-guided interactive answers, NDA-safe confidential redacting, and multi-tier AI responses without vendor or domain lock-in.
- **Non-negotiables:** Zero-hardcoded (no owner names, vendors, or sample clients in code; all values sourced from `@living-portfolio/config` or runtime data); decoupled (web and API separated by the versioned HTTP API `/api/v1`); self-hostable (every gate is a repo script runnable on any runner); honesty invariant (the UI never claims a status it has not measured); every receipt statement carries a status tag (`[implemented]`, `[partial]`, `[simulated]`, `[not-started]`).
- **Toolchain:** Node 22.x, pnpm 12.14.0, Vitest 3.0.7, Playwright 1.64.1, Turbo 2.4.4, TypeScript 5.7.3.
- **Authority:** A implements; L reviews and signs off gates; owner decides governance. Stop points: WP-1 closure (Gate 1b+), WP-2 closure (Gate 1c / G2 alpha), WP-3 closure (Gate 2 / Phase 2), WP-4 closure (Phase 3 / v0.2), WP-5 closure (Phase 4 / v0.3), WP-6 closure (Gate G2 Alpha Core), WP-7 closure (Gate G2 Finalization), WP-8 closure (Gate G3: Cloud Staging Readiness), WP-9 closure (Gate G4: Backup, Restore Drill, Observability & Hardening), WP-10 closure (Milestone v0.2 Algorithms & Quality Tuning), WP-11 closure (Milestone v0.2 UX & Structural Information Architecture), and prior to G5 public release.

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
  - WP-10: Milestone v0.2 Algorithms, Retrieval & Quality Tuning delivery (receipts A045 to A050, evidence `3b461be`).
  - WP-11: Milestone v0.2 UX & Structural Information Architecture delivery (receipts A051 to A055, evidence `0980796`):
    * WP-11.1 (`A051`): Debounced static site rebuild progress UI (10-minute window, 12/day cap) in admin workspace, real background enrichment queueing, and Ask flow repair with `needs_context` state and dynamic query-guided facet prompts (`20261020-UX-05`, `20261020-UX-10`).
    * WP-11.2 (`A052`): Navigation redesign retiring flat 8-item nav, removing admin link for anonymous visitors, fixing `/build/:slug` 404, deduplicating `/writing` & `/work`, and complete system-state coverage (`20261020-UX-13`, `20261020-UX-14`, `20261020-CP-05`).
    * WP-11.3 (`A053`): Accessibility mechanics (skip link `#main-content`, proper `<h1>` hierarchy on Home, theme toggle synchronization, contrast ratios ≥ 4.5:1, touch targets ≥ 44px, guarded localStorage, axe test suite) and structured view repair (`20261020-UX-15`, `20261020-UX-16`).
    * WP-11.4 (`A054`): Full CommonMark/GFM rendering engine with HTML sanitization, 3-tier design tokens, self-hosted fonts (`@font-face` Literata, Atkinson Hyperlegible Next, JetBrains Mono), Field/Button/Chip component layer, and responsive multi-pane layout (`F4`, `20261020-UI-01`, `UI-02`, `UI-03`, `UI-04`, `UI-06`, `UI-07`, `UI-10`).
    * WP-11.5 (`A055`): Copy harmonization matching headings to nav, canonical outcome labels, standardized action verbs, elimination of spec section numbers (`(§...)`), and zero hardcoded owner content (`20261020-CP-01`, `20261020-CP-02`, `20261020-CP-03`).
    * WP-11.6 (`H012`): Work Package 11 gate closure certification, gates manifest verification, and Handover Snapshot H012.
- **Current phase:** Handover Snapshot H012 (`HO-12`). **Definition of done:** `docs/handovers/H012-wp-11-gate-closure-and-wp-12-kickoff.md` supersedes H011, passes `handover-check`, and verifies on `main`.
- **Next phases:**
  - WP-12 (Milestone v0.1.0 GA: Visual Polish, Copy & General Availability): Strata continuous timeline, typography craft, error recovery copy, open-source governance file set, full documentation set, and v0.1.0 GA tag.

## 4. Active workspace

- **Git:** `main` at `0980796` (Evidence SHA `0980796c15d085e28fc6ab0271d313fde13981b3`); open PRs: none; working tree: clean; branches holding unmerged work: none.
- **Next task:** `WP-12.1`: Strata timeline visual overhaul, typography craft, tabular numerals, optical alignment (`20261020-UI-05`, `20261020-UI-08`, `20261020-UI-09`). Receipt number to use: `A056`.
- **Hot files (at most 7):**
  1. `docs/plans/execution-protocol.md`: Binding engineering protocol for tasks, PRs, and receipts.
  2. `docs/plans/remediation-plan-AUD-2026-10-19.md`: General Availability remediation specification.
  3. `docs/audits/register.yml`: Finding register tracking open, partial, and fixed items.
  4. `docs/plans/gates.json`: Stage gates manifest certifying WP-1 through WP-11 closure.
  5. `apps/web/src/renderer.ts`: Strata timeline rendering, optical alignment, and typography tokens.
  6. `apps/web/src/styles.ts`: Strata visual presentation, tabular numerals, and role marker styling.
  7. `scripts/triage`: Autonomous triage gate evaluator.
- **Immediate next actions (ordered, at most 7):**
  1. Create feature branch for WP-12.1 from current `main`.
  2. Overhaul Strata timeline into true continuous time axis with encoding glyphs (■ ◆ ▲) and optical alignment (`20261020-UI-05`).
  3. Implement role marker classes (`.role-marker`, `.role-goal` to `.role-lesson`) with active role styling (`20261020-UI-08`).
  4. Refine typography craft, tabular numerals for dates/metrics, and vertical rhythm (`20261020-UI-09`).
  5. Author comprehensive conformance tests and update `docs/audits/register.yml` findings to fixed.
  6. Run `pnpm verify` locally, open PR / push with DCO sign-offs, verify CI passes, and publish receipt `A056`.
- **Pending decisions:** None.

## 5. Findings and backlog snapshot

- **Register counts (from `node scripts/handover-facts`):** 89 fixed, 0 partial, 8 open (P0: 0, P1: 0, P2: 6; 97 total).
- **Open P0 findings:** None (0 open P0 findings; all critical security & architecture findings fixed).
- **Next five backlog items:**
  1. `20261020-UI-05`: The strata timeline, the Spec's one bold element, is a row of equal-width button-like year blocks (`#timeline-scrubber button`, `styles.ts:168`). It does not show density, gaps, duration, or concurrent ventures. It is not continuous time, just a selector for a list below
  2. `20261020-UI-08`: The role classes `.role-marker` and `.role-goal` to `.role-lesson` are defined and colored in `styles.ts:25-72`, but **never applied** to any element in `renderer.ts`. The structured view renders roles as plain `<div>` elements with raw inline styles (`border-left: 2px solid #ccc`). No visual role distinction shipped
  3. `20261020-UI-09`: No surface craft beyond rules and a single accent: no optical alignment, tabular numerals, or consistent spacing rhythm
  4. `20261020-CP-04`: **Errors do not say what failed, why, or what to do.** "Origin unreachable" (infrastructure term); developer strings such as "Unauthorized: admin authentication required" and "Validation failed" with raw Zod issues; `Invalid query` has no UI branch, so the Ask card renders blank (the code looks up `tierLabels[undefined]`, `renderer.ts:744`); admin fetches show nothing on failure
  5. `20261020-CP-06`: **No string architecture.** All text is inline in TypeScript; `lang="en"` is fixed; dates formatted ad-hoc ("2026-10-15", "October 2026", "2026-10-15T00:00:00Z"); plurals hard-coded ("1 entries", "1 years"); ICU message format nowhere used

## 6. Decisions and pitfalls

- **Decisions (at most 10):**
  - 2026-10-21: Rebase and merge strictly enforced across all PRs to preserve DCO trailers and clean linear history. Reason: Squash merges drop commit DCO trailers. Where: `docs/plans/execution-protocol.md`.
  - 2026-10-22: Autonomous triage gate removes manual sign-off overhead. Reason: Operators act strictly on TRIAGE: HUMAN REQUIRED triggers. Where: `docs/execution-reports/A017-wp-1-gate-closure-triage-and-handover-facts.md`.
  - 2026-11-03: Multi-tier token system with semantic variables and self-hosted fonts. Reason: Eliminates theme drift and external font privacy leaks. Where: `docs/execution-reports/A054-wp-114-markdown-engine-tokens-and-responsive-layout.md`.
  - 2026-11-03: Route titles match navigation verbatim with zero spec section jargon. Reason: Ensures consistency and eliminates internal schema leakage. Where: `docs/execution-reports/A055-wp-115-copy-harmonization-spec-jargon-removal.md`.
- **Pitfalls (at most 10):**
  - Pitfall 1: Bypassing rebase-merge drops DCO sign-offs in git history.
  - Pitfall 2: Modifying historical execution reports (A001..A054) breaks immutable integrity checks.
  - Pitfall 3: Regex replacement of HTML script tags in tests triggers CodeQL bad-tag-filter alerts.

## 7. Verification harness

- **Commands:**
  - `pnpm test`: Runs all unit, conformance, and regression test suites across 8 workspaces.
  - `pnpm test:e2e`: Runs full Playwright end-to-end browser test suite (49 tests).
  - `pnpm audit:check`: Validates audit register integrity, receipt formats, and document identity.
  - `pnpm hardcode:check`: Scans repository for unlisted hardcoded names or credentials.
  - `pnpm handover:verify H012`: Verifies Handover Snapshot H012 against git state and budget rules.

## 8. Entry halt conditions and exit checklist

- **Entry halt conditions:**
  - Any failed check in `pnpm audit:check`.
  - Any uncommitted modified files in working directory.
  - Divergence between `origin/main` and local `main`.
- **Exit checklist:**
  - All WP-11 tasks (A051 to A055) complete, tested, and certified.
  - Gate `WP-11` certified in `docs/plans/gates.json`.
  - Handover `H012` passes `pnpm handover:verify H012`.
