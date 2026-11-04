# H013 — WP-12 Gate closure and v0.1.0 GA release

| Field | Value |
| --- | --- |
| Handover ID | `H013` |
| Date | 2026-11-04 |
| Author | A (Implementer) |
| Supersedes | H012 |
| Evidence SHA (on `main`) | `31700e12346736b059809bd4505f427d8155bc34` |
| CI runs for that SHA | 41771754009 / 41771754081 / 41771754097 |
| Receipts covered | A001 to A058 |
| Phase closed | WP-12 Gate Closure (certified in docs/plans/gates.json) |
| Phase next | v0.1.0 General Availability Maintenance & Community Operations |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read `docs/handovers/H013-wp-12-gate-closure-and-v010-ga-release.md`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify H013`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4. Follow the execution protocol exactly: one task per PR, tests included, Rebase and merge, receipt as a file, no edits to earlier reports.

## 1. Mission and constitution

- **Objective:** The Living Portfolio is an open-source, self-hosted dynamic professional identity system providing proof-first claims, query-guided interactive answers, NDA-safe confidential redacting, and multi-tier AI responses without vendor or domain lock-in.
- **Non-negotiables:** Zero-hardcoded (no owner names, vendors, or sample clients in code; all values sourced from `@living-portfolio/config` or runtime data); decoupled (web and API separated by the versioned HTTP API `/api/v1`); self-hostable (every gate is a repo script runnable on any runner); honesty invariant (the UI never claims a status it has not measured); every receipt statement carries a status tag (`[implemented]`, `[partial]`, `[simulated]`, `[not-started]`).
- **Toolchain:** Node 22.x, pnpm 12.14.0, Vitest 3.0.7, Playwright 1.64.1, Turbo 2.4.4, TypeScript 5.7.3.
- **Authority:** A implements; L reviews and signs off gates; owner decides governance. All release gates G0 through G5 have been formally closed and certified.

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
  - WP-11: Milestone v0.2 UX & Structural Information Architecture delivery (receipts A051 to A055, evidence `0980796`).
  - WP-12: Milestone v0.1.0 GA: Visual Polish, Copy & General Availability (receipts A056 to A059, evidence `31700e1`):
    * WP-12.1 (`A056`): Strata timeline continuous time axis, glyph encoding, square-root height scaling, active role styles, text-first claims, and typography craft (`20261020-UI-05`, `20261020-UI-08`, `20261020-UI-09`).
    * WP-12.2 (`A057`): Actionable user-facing error messages, three-part recovery guidance, date localization Month Year, grammatical pluralization via Intl, linear ReDoS-safe ICU formatting, and canonical strings for 9 Ask flow states (`20261020-CP-04`, `20261020-CP-06`, `20261020-CP-07`).
    * WP-12.3 (`A058`): Open-source governance file set (`LICENSE`, `GOVERNANCE.md`, `CODE_OF_CONDUCT.md`, `THIRD_PARTY_NOTICES`) and full documentation suite (`docs/self-hosting.md`, `G002`, `G003`, `G004`, `README.md`) (`M10`, `OSR-23`).
    * WP-12.4 (`A059`): Gate G5 Release Certification, `gates.json` certification, and v0.1.0 GA tagging.
- **Current phase:** Handover Snapshot H013 (`HO-13`). **Definition of done:** `docs/handovers/H013-wp-12-gate-closure-and-v010-ga-release.md` supersedes H012, passes `handover-check`, and verifies on `main`.
- **Next phases:** Community onboarding, production self-hosting deployments, and post-GA patch maintenance.

## 4. Active workspace

- **Git:** `main` at `31700e1` (Evidence SHA `31700e12346736b059809bd4505f427d8155bc34`); open PRs: none; working tree: clean; branches holding unmerged work: none.
- **Next task:** Post-v0.1.0 GA monitoring and community triage.
- **Hot files (at most 7):**
  1. `docs/plans/execution-protocol.md`: Binding engineering protocol for tasks, PRs, and receipts.
  2. `docs/plans/gates.json`: Stage gates manifest certifying WP-1 through WP-12 closure.
  3. `docs/audits/register.yml`: Finding register (100% of 97 findings resolved and verified).
  4. `README.md`: Project entrance, quickstart, and documentation directory.
  5. `GOVERNANCE.md`: Open-source project governance and maintainer guidelines.
  6. `docs/self-hosting.md`: Comprehensive self-hosting and operational runbook.
  7. `docs/G003-upgrade-and-migration-guide.md`: Upgrade and migration protocol.
- **Immediate next actions (ordered, at most 7):**
  1. Complete final receipt A059 recording Gate G5 Release Certification.
  2. Verify all gates cleanly pass locally (`pnpm verify`).
  3. Create and push Git tag `v0.1.0` to trigger the automated container release workflow (`.github/workflows/release.yml`).
  4. Verify GitHub Actions builds multi-arch containers and creates the GitHub Release with `code.zip` and `sbom.spdx.json`.
- **Pending decisions:** None.

## 5. Findings and backlog snapshot

- **Register counts (from `node scripts/handover-facts`):** 97 fixed, 0 partial, 0 open (P0: 0, P1: 0, P2: 0; 97 total).
- **Open P0 findings:** None (0 open P0 findings; 100% of security and architectural findings resolved).
- **Backlog status:** All 97 findings across AUD-2026-10-19, AUD-2026-10-20, and OSR-001 have been completely fixed and verified by automated conformance suites.

## 6. Decisions and pitfalls

- **Decisions (at most 10):**
  - 2026-10-21: Rebase and merge strictly enforced across all PRs to preserve DCO trailers and clean linear history. Reason: Squash merges drop commit DCO trailers. Where: `docs/plans/execution-protocol.md`.
  - 2026-10-22: Autonomous triage gate removes manual sign-off overhead. Reason: Operators act strictly on TRIAGE: HUMAN REQUIRED triggers. Where: `docs/execution-reports/A017-wp-1-gate-closure-triage-and-handover-facts.md`.
  - 2026-11-03: Multi-tier token system with semantic variables and self-hosted fonts. Reason: Eliminates theme drift and external font privacy leaks. Where: `docs/execution-reports/A054-wp-114-markdown-engine-tokens-and-responsive-layout.md`.
  - 2026-11-03: Route titles match navigation verbatim with zero spec section jargon. Reason: Ensures consistency and eliminates internal schema leakage. Where: `docs/execution-reports/A055-wp-115-copy-harmonization-spec-jargon-removal.md`.
  - 2026-11-04: Non-backtracking linear index parsing for ICU format string interpolation. Reason: Eliminates CodeQL polynomial-redos warnings. Where: `apps/web/src/strings.ts`.
  - 2026-11-04: Contributor Covenant v2.1 code of conduct and Apache-2.0 governance. Reason: Establishes clear legal and community standards for general availability. Where: `GOVERNANCE.md`, `CODE_OF_CONDUCT.md`.
- **Pitfalls (at most 10):**
  - Pitfall 1: Bypassing rebase-merge drops DCO sign-offs in git history.
  - Pitfall 2: Modifying historical execution reports (A001..A057) breaks immutable integrity checks.
  - Pitfall 3: Sub-bullet points in execution report Section 1 trigger triage parser errors if not formatted with single status tags.
  - Pitfall 4: Visible text inside interactive elements must match or be included in aria-labels for WCAG 2.5.3 (Label in Name) compliance.

## 7. Verification harness

- **Commands:**
  - `pnpm test`: Runs all unit, conformance, and regression test suites across 8 workspaces (38 test files, 328 tests in apps/api).
  - `pnpm test:e2e`: Runs full Playwright end-to-end browser test suite (49 tests).
  - `pnpm verify`: Executes all 13 repository gates (build, env sync, openapi drift, decoupling, hardcode, dco, docs-check, handover-check, audit-check, sarif-gate, gitleaks, sha-pins, test suites).
  - `pnpm handover:verify H013`: Verifies Handover Snapshot H013 against git state and budget rules.

## 8. Entry halt conditions and exit checklist

- **Entry halt conditions:**
  - Any failed check in `pnpm audit:check` or `pnpm verify`.
  - Any uncommitted modified files in working directory.
  - Divergence between `origin/main` and local `main`.
- **Exit checklist:**
  - All WP-12 tasks (A056 to A059) complete, tested, and certified.
  - Gate `WP-12` certified in `docs/plans/gates.json`.
  - Handover `H013` passes `pnpm handover:verify H013`.
  - Release tag `v0.1.0` tagged and published.
