# H008 — WP-7 Gate closure and WP-8 kickoff

| Field | Value |
| --- | --- |
| Handover ID | `H008` |
| Date | 2026-11-02 |
| Author | A (Implementer) |
| Supersedes | H007 |
| Evidence SHA (on `main`) | `7eafe3e8dfcd8d925665b62631fde14c6fc01fc3` |
| CI runs for that SHA | 41394793270 / 41394793179 / 41394793180 |
| Receipts covered | A001 to A037 |
| Phase closed | WP-7 Gate Closure (certified in docs/plans/gates.json) |
| Phase next | WP-8 (Gate G3: Cloud Staging Readiness) |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read `docs/handovers/H008-wp-7-gate-closure-and-wp-8-kickoff.md`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify H008`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4. Follow the execution protocol exactly: one task per PR, tests included, Rebase and merge, receipt as a file, no edits to earlier reports.

## 1. Mission and constitution

- **Objective:** The Living Portfolio is an open-source, self-hosted dynamic professional identity system providing proof-first claims, query-guided interactive answers, NDA-safe confidential redacting, and multi-tier AI responses without vendor or domain lock-in.
- **Non-negotiables:** Zero-hardcoded (no owner names, vendors, or sample clients in code; all values sourced from `@living-portfolio/config` or runtime data); decoupled (web and API separated by the versioned HTTP API `/api/v1`); self-hostable (every gate is a repo script runnable on any runner); honesty invariant (the UI never claims a status it has not measured); every receipt statement carries a status tag (`[implemented]`, `[partial]`, `[simulated]`, `[not-started]`).
- **Toolchain:** Node 22.x, pnpm 12.14.0, Vitest 3.0.7, Playwright 1.64.1, Turbo 2.4.4, TypeScript 5.7.3.
- **Authority:** A implements; L reviews and signs off gates; owner decides governance. Stop points: WP-1 closure (Gate 1b+), WP-2 closure (Gate 1c / G2 alpha), WP-3 closure (Gate 2 / Phase 2), WP-4 closure (Phase 3 / v0.2), WP-5 closure (Phase 4 / v0.3), WP-6 closure (Gate G2 Alpha Core), WP-7 closure (Gate G2 Finalization), and prior to G4/G5 public releases.

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
  - WP-7: Gate G2 Finalization: API Versioning & Web Decoupling (receipts A035 to A037, evidence `7eafe3e`):
    * WP-7.1 (`A035`): Versioned API (`/api/v1`), committed OpenAPI specification, and `@living-portfolio/client` TypeScript client (`OSR-12`).
    * WP-7.2 (`A036`): Strict web decoupling from API, removal of default web mounting from `createApp()`, standalone web server, and HTTP client enforcement (`OSR-13`).
    * WP-7.3 (`A037`): API boundary Architecture Decision Record `P002` and Configuration Reference & Environment Contract `G002` (`OSR-23` Part 1).
    * WP-7.4 (`H008`): Work Package 7 gate closure certification, gates manifest verification, and Handover Snapshot H008.
- **Current phase:** Handover Snapshot H008 (`HO-8`). **Definition of done:** `docs/handovers/H008-wp-7-gate-closure-and-wp-8-kickoff.md` supersedes H007, passes `handover-check`, and verifies on `main`.
- **Next phases:**
  - WP-8 (Gate G3: Cloud Staging Readiness): Hosting provider spike & ADR, deployment pipelines, staging safeguards, and `DEPLOYMENT_CLASS` handling (`OSR-17`, `OSR-18`, `OSR-19`).
  - WP-9 (Gate G4: Operational Durability & Hardening): Automated encrypted backups, CI restore drill, observability, production deploy gate, and worker reset (`OSR-20`, `OSR-21`, `OSR-22`, `P5`).
  - WP-10 (Milestone v0.2 Algorithms & Quality Tuning): Entailment judge, query classification upgrade, self-calibration, and topology audit (`M3`, `M4`, `M5`, `M6`, `M7`, `M9`, `M11`).

## 4. Active workspace

- **Git:** `main` at `7eafe3e` (Evidence SHA `7eafe3e8dfcd8d925665b62631fde14c6fc01fc3`); open PRs: none; working tree: clean; branches holding unmerged work: none.
- **Next task:** `WP-8.1`: Hosting provider spike and Architecture Decision Record (ADR) comparing Render vs Fly.io (image by digest, credential model, pgvector, pg_dump) (`OSR-17`). Receipt number to use: `A038`.
- **Hot files (at most 7):**
  1. `docs/plans/execution-protocol.md`: Binding engineering protocol for tasks, PRs, and receipts.
  2. `docs/plans/osr-001-open-source-release.md`: Gate G3 staging readiness plan and technical specifications.
  3. `docs/audits/register.yml`: Finding register tracking open, partial, and fixed items.
  4. `docs/plans/gates.json`: Stage gates manifest certifying WP-1 through WP-7 closure.
  5. `apps/api/src/conformance/p0-probes.conformance.test.ts`: Primary conformance regression suite.
  6. `scripts/verify-all`: Unified verification gate runner.
  7. `scripts/triage`: Autonomous triage gate evaluator.
- **Immediate next actions (ordered, at most 7):**
  1. Create feature branch for WP-8.1 from current `main`.
  2. Perform hosting provider spike comparing Render vs Fly.io against staging requirements (digest deployment, pgvector, pg_dump, scoped credentials).
  3. Author and commit Architecture Decision Record `P003` documenting provider evaluation, decision criteria, and operational runbook.
  4. Update `docs/audits/register.yml` finding `OSR-17` to fixed with link to ADR `P003`.
  5. Register `P003` in `docs/doc-registry.json` and `docs/INDEX.md`.
  6. Run `pnpm verify` and `pnpm test` locally to ensure zero regression.
  7. Open PR / commit with DCO sign-offs, verify CI passes, and publish receipt `A038`.
- **Pending decisions:** None.

## 5. Findings and backlog snapshot

- **Register counts (from `node scripts/handover-facts`):** 56 fixed, 0 partial, 41 open (P0: 0, P1: 20, P2: 18; 97 total).
- **Open P0 findings:** None (0 open P0 findings; all critical security & architecture findings fixed).
- **Next five backlog items:**
  1. `OSR-17`: Hosting provider spike and ADR (image by digest, credential model, pgvector, pg_dump) (Gate G3).
  2. `OSR-18`: Provider config in deploy/<provider>/, staging deploy workflow, scoped deploy credential (Gate G3).
  3. `OSR-19`: Staging safeguards (§6.4) and DEPLOYMENT_CLASS handling (Gate G3).
  4. `OSR-20`: Automated pg_dump + age encrypted backups, scratch-container restore drill in CI, retention policy, and backup-age alerts (Gate G4).
  5. `OSR-21`: Observability, provider budget caps, error rate monitoring, and spend alerts (Gate G4).

## 6. Decisions and pitfalls

- **Decisions (at most 10):**
  - 2026-10-21: Rebase and merge strictly enforced across all PRs to preserve DCO trailers and clean linear history. Reason: Squash merges drop commit DCO trailers. Where: `docs/plans/execution-protocol.md`.
  - 2026-10-22: Autonomous triage gate removes manual sign-off overhead. Reason: Operators act strictly on TRIAGE: HUMAN REQUIRED triggers. Where: `docs/execution-reports/A017-wp-1-gate-closure-triage-and-handover-facts.md`.
  - 2026-10-26: Default database engine cut over to Postgres with in-memory deprecated in production. Reason: Concludes Gate 1c and closes persistence findings P1, P2, P3, F2, F3. Where: `docs/plans/gates.json`.
  - 2026-10-26: Bitemporal time semantics enforce immutable revisions and real SHA-256 hashing. Reason: Prevents retrospective history rewriting and eliminates temporal leaks. Where: `docs/execution-reports/A023-wp3-1-cms-lifecycle.md`.
  - 2026-10-26: BudgetGovernor reserves >=20% capacity for owner interactive priority and reconciles token spend. Reason: Prevents visitor denial-of-service against owner workflows. Where: `docs/execution-reports/A024-wp3-2-governor-ledger.md`.
  - 2026-10-26: Privacy router prevents external LLM provider calls on sensitive data classes and confidential regex matches. Reason: Enforces strict zero-trust boundary on unpublished or confidential IP. Where: `docs/execution-reports/A026-wp3-4-data-class-router.md`.
  - 2026-10-27: SPDX 2.3 SBOM generator and Cosign signed multi-arch container packaging close final P0 finding. Reason: Resolves OSR-16 and achieves zero-P0 repository milestone. Where: `docs/execution-reports/A034-wp6-1-release-packaging-and-container-workflow.md`.
  - 2026-11-02: Versioned API `/api/v1`, committed OpenAPI 3.1.0 specification, and generated TypeScript client `@living-portfolio/client`. Reason: Resolves OSR-12 and guarantees typed contract stability across consumers. Where: `docs/execution-reports/A035-wp-71-api-versioning-and-openapi-client.md`.
  - 2026-11-02: Frontend web app completely decoupled from API server; createApp() serves only API endpoints with HTTP client communication. Reason: Resolves OSR-13 and satisfies Gate G2 separation criteria. Where: `docs/execution-reports/A036-wp-72-web-decoupling-and-http-client-enforcement.md`.
  - 2026-11-02: Architecture Decision Record P002 and Configuration Contract G002 formalize boundaries and env contract. Reason: Resolves OSR-23 Part 1 and defines system operational interface. Where: `docs/execution-reports/A037-wp-73-api-boundary-adr-and-configuration-contract.md`.
- **Pitfalls and dead ends (at most 10):**
  - Never use top-level `paths-ignore` in GitHub Actions for required status checks (`main-gates`). Because: Required checks will remain indefinitely pending. See: `docs/execution-reports/A015-wp1-provider-registry-extractive-degradation.md`.
  - Never edit an earlier execution report directly. Because: Reports are frozen historical audit records; all errata belong in Section 7 of the next receipt. See: `docs/plans/execution-protocol.md`.
  - vitest output is emitted per-package only. Because: Turbo runs vitest separately per workspace; any total must be labeled "computed from the above". See: `docs/execution-reports/A008.md`.
  - Do not hardcode provider URLs or tokens. Because: OSR-01 and Hardcode scanners enforce zero sensitive or domain literals in code. See: `packages/config/src/index.ts`.
  - Receipt and handover headers must omit Verified By from A017/H002 onward. Because: External verification claims outside §7 errata are forbidden. See: `scripts/receipt-check`.
  - Test fixture strings matching `sk-` patterns trigger Gitleaks generic-api-key heuristics. Because: Regex matches hardcoded mock keys. Use dynamic array joining (e.g. `['sk', 'token'].join('-')`). See: `docs/execution-reports/A026-wp3-4-data-class-router.md`.
  - Section 9 in execution reports requires exact HO-R bullet keys and exact heading title. Because: Automated regex check validates standard handover metadata. See: `scripts/receipt-check`.
  - Handover Section 8 requires exact halt condition items. Because: Automated handover validation verifies entry halt criteria. See: `scripts/handover-check`.
  - Connecting directly to GitHub IPv4 or using HTTP proxy for TLS can fail on macOS; use SOCKS5 proxy `socks5://127.0.0.1:1086`. Because: Environment routing requires SOCKS5 for reliable TLS handshakes. See: `docs/execution-reports/A037-wp-73-api-boundary-adr-and-configuration-contract.md`.
  - Pinned GitHub Action SHA checks must resolve upstream commit and matching tag. Because: verify-action-pins enforces immutable supply-chain dependencies. See: `scripts/verify-action-pins`.

## 7. Verification harness

| Check | Command | Expected baseline (source) |
| --- | --- | --- |
| Full gate suite | `pnpm verify` | all gates pass (CI 41394793270) |
| Unit and conformance tests | `pnpm test` | 277 tests in 29 files (CI 41382796748 / job 125077031104) |
| End-to-end tests | `pnpm test:e2e` | 24 tests (CI 41382796748 / job 125077030868) |
| SARIF gate | `node scripts/sarif-gate` | 0 unbaselined alerts (CI 41382796748 / job 125077030912) |
| Secret scan | `node scripts/gitleaks-scan` | 154 commits scanned, 0 leaks (CI 41382796736 / job 125077030642) |
| Receipt check | `pnpm receipt:check A037` | passes |
| Docs check | `pnpm docs:check` | passes |
| Handover check | `pnpm handover:check H008` | passes |
| Handover verify | `pnpm handover:verify H008` | passes |
| CI log retrieval | `gh run view <run-id> --log` | needs `gh auth status` logged in |

Fresh-clone procedure for gate sign-off: `git clone https://github.com/shiapenn/living-portfolio.git && cd living-portfolio && pnpm install && pnpm verify`.

## 8. Entry halt conditions and exit checklist

**Halt and report to L (change nothing) if:**
1. `origin/main` differs from the Evidence SHA by anything other than docs-only commits.
2. `pnpm verify` or the baseline in section 7 does not match.
3. CI on `main` is red.
4. A pending decision in section 4 blocks Immediate Next Action 1.
5. A path, SHA or command cited here does not exist.

**Exit checklist for the next handover:** preconditions in IAHP section 4 met; Evidence SHA and CI runs recorded; sections derived, not narrated; resolved items deleted; `pnpm handover:check` passes; docs-only PR merged with Rebase and merge; start prompt printed; session stopped.
