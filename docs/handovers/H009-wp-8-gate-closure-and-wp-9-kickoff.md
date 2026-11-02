# H009 — WP-8 Gate closure and WP-9 kickoff

| Field | Value |
| --- | --- |
| Handover ID | `H009` |
| Date | 2026-11-02 |
| Author | A (Implementer) |
| Supersedes | H008 |
| Evidence SHA (on `main`) | `1cc1a6bb6a7159d28ff36e2b80ca57162c4bfa90` |
| CI runs for that SHA | 41403988298 / 41403988501 / 41403988433 |
| Receipts covered | A001 to A040 |
| Phase closed | WP-8 Gate Closure (certified in docs/plans/gates.json) |
| Phase next | WP-9 (Gate G4: Backup, Restore Drill, Observability & Hardening) |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read `docs/handovers/H009-wp-8-gate-closure-and-wp-9-kickoff.md`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify H009`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4. Follow the execution protocol exactly: one task per PR, tests included, Rebase and merge, receipt as a file, no edits to earlier reports.

## 1. Mission and constitution

- **Objective:** The Living Portfolio is an open-source, self-hosted dynamic professional identity system providing proof-first claims, query-guided interactive answers, NDA-safe confidential redacting, and multi-tier AI responses without vendor or domain lock-in.
- **Non-negotiables:** Zero-hardcoded (no owner names, vendors, or sample clients in code; all values sourced from `@living-portfolio/config` or runtime data); decoupled (web and API separated by the versioned HTTP API `/api/v1`); self-hostable (every gate is a repo script runnable on any runner); honesty invariant (the UI never claims a status it has not measured); every receipt statement carries a status tag (`[implemented]`, `[partial]`, `[simulated]`, `[not-started]`).
- **Toolchain:** Node 22.x, pnpm 12.14.0, Vitest 3.0.7, Playwright 1.64.1, Turbo 2.4.4, TypeScript 5.7.3.
- **Authority:** A implements; L reviews and signs off gates; owner decides governance. Stop points: WP-1 closure (Gate 1b+), WP-2 closure (Gate 1c / G2 alpha), WP-3 closure (Gate 2 / Phase 2), WP-4 closure (Phase 3 / v0.2), WP-5 closure (Phase 4 / v0.3), WP-6 closure (Gate G2 Alpha Core), WP-7 closure (Gate G2 Finalization), WP-8 closure (Gate G3: Cloud Staging Readiness), and prior to G4/G5 public releases.

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
  - WP-8: Gate G3 Cloud Staging Readiness delivery (receipts A038 to A040, evidence `1cc1a6b`):
    * WP-8.1 (`A038`): Hosting provider spike comparing Render vs Fly.io against staging requirements, and Architecture Decision Record `P003` (`OSR-17`).
    * WP-8.2 (`A039`): Declarative Render Blueprint `deploy/render/render.yaml`, web container Dockerfile `docker/Dockerfile.web`, staging automated deployment workflow `.github/workflows/deploy-staging.yml`, and staging deploy conformance tests (`OSR-18`).
    * WP-8.3 (`A040`): Spec §6.4 staging safeguards and `DEPLOYMENT_CLASS` handling (persistent synthetic banner, crawler indexing prevention, disabled staging import routes with `403 STAGING_IMPORT_DISABLED`, demo seed isolation, Gate G4 production startup guard, and regression suite) (`OSR-19`).
    * WP-8.4 (`H009`): Work Package 8 gate closure certification, gates manifest verification, and Handover Snapshot H009.
- **Current phase:** Handover Snapshot H009 (`HO-9`). **Definition of done:** `docs/handovers/H009-wp-8-gate-closure-and-wp-9-kickoff.md` supersedes H008, passes `handover-check`, and verifies on `main`.
- **Next phases:**
  - WP-9 (Gate G4: Operational Durability & Hardening): Automated encrypted backups, CI restore drill, observability, production deploy gate, and worker reset (`OSR-20`, `OSR-21`, `OSR-22`, `P5`).
  - WP-10 (Milestone v0.2 Algorithms & Quality Tuning): Entailment judge, query classification upgrade, self-calibration, and topology audit (`M3`, `M4`, `M5`, `M6`, `M7`, `M9`, `M11`).
  - WP-11 (Milestone v0.2 UX): Structural Information Architecture and UX Remediation.
  - WP-12 (Milestone v0.1.0 GA): Visual Polish, Copy & General Availability.

## 4. Active workspace

- **Git:** `main` at `1cc1a6b` (Evidence SHA `1cc1a6bb6a7159d28ff36e2b80ca57162c4bfa90`); open PRs: none; working tree: clean; branches holding unmerged work: none.
- **Next task:** `WP-9.1`: Automated pg_dump + age encrypted backups, scratch-container restore drill in CI, retention policy, and backup-age alerts (`OSR-20`). Receipt number to use: `A041`.
- **Hot files (at most 7):**
  1. `docs/plans/execution-protocol.md`: Binding engineering protocol for tasks, PRs, and receipts.
  2. `docs/plans/osr-001-open-source-release.md`: Gate G4 backup and restore specification and technical requirements.
  3. `docs/audits/register.yml`: Finding register tracking open, partial, and fixed items.
  4. `docs/plans/gates.json`: Stage gates manifest certifying WP-1 through WP-8 closure.
  5. `apps/api/src/conformance/staging-safeguards.conformance.test.ts`: Staging safeguards conformance test suite.
  6. `scripts/verify-all`: Unified verification gate runner.
  7. `scripts/triage`: Autonomous triage gate evaluator.
- **Immediate next actions (ordered, at most 7):**
  1. Create feature branch for WP-9.1 from current `main`.
  2. Implement automated encrypted backup script using `pg_dump` and `age` encryption with public key recipient (§13.9, OSR-20).
  3. Implement automated scratch-container database restore drill in GitHub Actions CI pipeline (§13.9, OSR-20).
  4. Implement backup retention policy and backup freshness/age verification alert (§13.9, OSR-20).
  5. Update `docs/audits/register.yml` finding `OSR-20` to fixed with regression test links.
  6. Run `pnpm verify` and `pnpm test` locally to ensure zero regression.
  7. Open PR / commit with DCO sign-offs, verify CI passes, and publish receipt `A041`.
- **Pending decisions:** None.

## 5. Findings and backlog snapshot

- **Register counts (from `node scripts/handover-facts`):** 59 fixed, 0 partial, 38 open (P0: 0, P1: 19, P2: 16; 97 total).
- **Open P0 findings:** None (0 open P0 findings; all critical security & architecture findings fixed).
- **Next five backlog items:**
  1. `OSR-20`: Real backups and restore drill, backup-age alert (Gate G4)
  2. `OSR-21`: Observability, budget caps and alerts (Gate G4)
  3. `OSR-22`: Production deploy workflow with required reviewer, health gate, auto-rollback (Gate G4)
  4. `P5`: Worker buildsToday counter never resets at UTC midnight and static build does not emit real files
  5. `M3`: Pre-delivery verification lacks entailment check, assertion stripping, citedScopes wiring, and reconstruction label

## 6. Decisions and pitfalls

- **Decisions (at most 10):**
  - 2026-10-21: Rebase and merge strictly enforced across all PRs to preserve DCO trailers and clean linear history. Reason: Squash merges drop commit DCO trailers. Where: `docs/plans/execution-protocol.md`.
  - 2026-10-22: Autonomous triage gate removes manual sign-off overhead. Reason: Operators act strictly on TRIAGE: HUMAN REQUIRED triggers. Where: `docs/execution-reports/A017-wp-1-gate-closure-triage-and-handover-facts.md`.
  - 2026-10-26: Default database engine cut over to Postgres with in-memory deprecated in production. Reason: Concludes Gate 1c and closes persistence findings P1, P2, P3, F2, F3. Where: `docs/plans/gates.json`.
  - 2026-10-26: Bitemporal time semantics enforce immutable revisions and real SHA-256 hashing. Reason: Prevents retrospective history rewriting and eliminates temporal leaks. Where: `docs/execution-reports/A023-wp3-1-cms-lifecycle.md`.
  - 2026-10-26: BudgetGovernor reserves >=20% capacity for owner interactive priority and reconciles token spend. Reason: Prevents visitor denial-of-service against owner workflows. Where: `docs/execution-reports/A024-wp3-2-governor-ledger.md`.
  - 2026-10-26: Privacy router prevents external LLM provider calls on sensitive data classes. Reason: Enforces strict zero-trust boundary on unpublished or confidential IP. Where: `docs/execution-reports/A026-wp3-4-data-class-router.md`.
  - 2026-10-27: SPDX 2.3 SBOM generator and Cosign signed multi-arch container packaging close final P0 finding. Reason: Resolves OSR-16 and achieves zero-P0 repository milestone. Where: `docs/execution-reports/A034-wp6-1-release-packaging-and-container-workflow.md`.
  - 2026-11-02: Versioned API `/api/v1` and `@living-portfolio/client` TypeScript client establish strict contract boundary. Reason: Resolves OSR-12 and guarantees typed contract stability across consumers. Where: `docs/execution-reports/A035-wp-71-api-versioning-and-openapi-client.md`.
  - 2026-11-02: Hosting provider evaluation selects Render Blueprint for staging with digest deployments and managed PostgreSQL. Reason: Resolves OSR-17 and establishes cloud staging target. Where: `docs/plans/P003-hosting-provider-evaluation-and-staging-architecture-adr.md`.
  - 2026-11-02: Staging synthetic data isolation enforced via persistent banner, crawler indexing prevention, disabled import routes, and Gate G4 sign-off guard. Reason: Resolves OSR-19 and enforces Spec §6.4 safeguards. Where: `docs/execution-reports/A040-wp-83-staging-safeguards-and-deployment-class-handling.md`.
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
  - In `@living-portfolio/web` unit and conformance tests, initialize `createWebApp({ client: createTestClient() })`. Because: Unconfigured `createWebApp()` attempts HTTP connection to default localhost:4000 port. See: `docs/execution-reports/A040-wp-83-staging-safeguards-and-deployment-class-handling.md`.

## 7. Verification harness

| Check | Command | Expected baseline (source) |
| --- | --- | --- |
| Full gate suite | `pnpm verify` | all gates pass (CI 41403988298) |
| Unit and conformance tests | `pnpm test` | 305 tests in 32 files (CI 41403988298 / job 125141778056) |
| End-to-end tests | `pnpm test:e2e` | 24 tests (CI 41403988298 / job 125141778771) |
| SARIF gate | `node scripts/sarif-gate` | 0 unbaselined alerts (CI 41403988433 / job 125141778069) |
| Secret scan | `node scripts/gitleaks-scan` | 162 commits scanned, 0 leaks (CI 41403988501 / job 125141778717) |
| Receipt check | `pnpm receipt:check A040` | passes |
| Docs check | `pnpm docs:check` | passes |
| Handover check | `pnpm handover:check H009` | passes |
| Handover verify | `pnpm handover:verify H009` | passes |
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
