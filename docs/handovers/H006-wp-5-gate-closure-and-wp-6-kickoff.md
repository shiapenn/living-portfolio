# H006 — WP-5 Gate Closure and WP-6 Kickoff

| Field | Value |
| --- | --- |
| Handover ID | `H006` |
| Date | 2026-10-27 |
| Author | A (Implementer) |
| Supersedes | H005 |
| Evidence SHA (on `main`) | `da00e606b633fbb6bdf70032c3048ce9ebf29f18` |
| CI runs for that SHA | 40475888979 / 40475889067 / 40475889126 |
| Receipts covered | A001 to A033 |
| Phase closed | WP-5 Gate Closure (certified in docs/plans/gates.json) |
| Phase next | WP-6 (Phase 4 / v0.1.0: Packaging, Release Workflow, and Cloud Readiness) |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read `docs/handovers/H006-wp-5-gate-closure-and-wp-6-kickoff.md`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify H006`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4. Follow the execution protocol exactly: one task per PR, tests included, Rebase and merge, receipt as a file, no edits to earlier reports.

## 1. Mission and constitution

- **Objective:** The Living Portfolio is an open-source, self-hosted dynamic professional identity system providing proof-first claims, query-guided interactive answers, NDA-safe confidential redacting, and multi-tier AI responses without vendor or domain lock-in.
- **Non-negotiables:** Zero-hardcoded (no owner names, vendors, or sample clients in code; all values sourced from `@living-portfolio/config` or runtime data); decoupled (web and API separated by the versioned HTTP API `/api/v1`); self-hostable (every gate is a repo script runnable on any runner); honesty invariant (the UI never claims a status it has not measured); every receipt statement carries a status tag (`[implemented]`, `[partial]`, `[simulated]`, `[not-started]`).
- **Toolchain:** Node 22.x, pnpm 12.14.0, Vitest 3.0.7, Playwright 1.64.1, Turbo 2.4.4, TypeScript 5.7.3.
- **Authority:** A implements; L reviews and signs off gates; owner decides governance. Stop points: WP-1 closure (Gate 1b+), WP-2 closure (Gate 1c / G2 alpha), WP-3 closure (Gate 2 / Phase 2), WP-4 closure (Phase 3 / v0.2), WP-5 closure (Phase 4 / v0.3), and prior to G4/G5 public releases.

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
  - WP-5: Phase 4 / v0.3 Admin Operational Controls, Setup Wizard, Sub-Route Mounting & Redaction Drawer delivery (receipts A031 to A033, evidence `da00e60`):
    * WP-5.1 (`A031`): Admin settings screens, operational calibration, and kill-switch sync (`20261020-UX-09`).
    * WP-5.2 (`A032`): Owner setup wizard lockdown, token revocation persistence across reboots, and login rate limiting (`20261020-UX-01`).
    * WP-5.3 (`A033`): Web sub-route mounting in `createApp()`, root HTML content negotiation, and multi-pass redaction review drawer (`F1`, `20261020-UX-03`).
    * WP-5.4 (`H006`): Work Package 5 gate closure certification, gates manifest verification, and Handover Snapshot H006.
- **Current phase:** Handover Snapshot H006 (`HO-6`). **Definition of done:** `docs/handovers/H006-wp-5-gate-closure-and-wp-6-kickoff.md` supersedes H005, passes `handover-check`, and verifies on `main`.
- **Next phases:**
  - WP-6 (Phase 4 / v0.1.0): Release packaging, signed container workflows, SBOM generation, and Gate G2/G3 milestones.

## 4. Active workspace

- **Git:** `main` at `da00e60` (Evidence SHA `da00e606b633fbb6bdf70032c3048ce9ebf29f18`); open PRs: none; working tree: clean; branches holding unmerged work: none.
- **Next task:** `WP-6.1`: Release packaging, container workflow, and SBOM generation (`OSR-16`). Receipt number to use: `A034`.
- **Hot files (at most 7):**
  1. `docs/plans/execution-protocol.md`: Binding engineering protocol for tasks, PRs, and receipts.
  2. `docs/plans/remediation-plan-AUD-2026-10-19.md`: Phase sequencing and technical specifications.
  3. `docs/audits/register.yml`: Finding register tracking open, partial, and fixed items.
  4. `docs/plans/gates.json`: Stage gates manifest certifying WP-1 through WP-5 closure.
  5. `apps/api/src/conformance/p0-probes.conformance.test.ts`: Primary conformance regression suite.
  6. `scripts/verify-all`: Unified verification gate runner.
  7. `scripts/triage`: Autonomous triage gate evaluator.
- **Immediate next actions (ordered, at most 7):**
  1. Create feature branch for WP-6.1 from current `main`.
  2. Implement release packaging, container build stack, and SBOM generation (`OSR-16`).
  3. Add integration and quickstart validation tests.
  4. Run `pnpm verify` and `pnpm test` locally.
  5. Open pull request with DCO sign-offs and verify all CI checks pass green.
  6. Publish receipt `A034` and evaluate next handover step.
- **Pending decisions:** None.

## 5. Findings and backlog snapshot

- **Register counts (local output):** 53 fixed, 0 partial, 44 open (97 total).
- **Open P0 findings:**
  - `OSR-16`: Dockerfiles, compose stack, quickstart test in CI; release workflow with signed multi-arch images & SBOM (Gate G2)
- **Next five backlog items:**
  1. OSR-16: Dockerfiles, compose stack, quickstart test in CI; release workflow with signed multi-arch images & SBOM (Gate G2).
  2. OSR-12: Versioned API (/api/v1), committed OpenAPI, generated client (Gate G2).
  3. OSR-13: Decouple web from API; remove web mounting from createApp(); optional static export (Gate G2).
  4. 20261020-UX-05: Static site rebuild debouncing UI and background queue transparency.
  5. 20261020-UX-10: Ask flow gaps: needs_context state, streaming response, and scope retention.

## 6. Decisions and pitfalls

- **Decisions (at most 10):**
  - 2026-10-21: Rebase and merge strictly enforced across all PRs to preserve DCO trailers and clean linear history. Reason: Squash merges drop commit DCO trailers. Where: `docs/plans/execution-protocol.md`.
  - 2026-10-22: Autonomous triage gate removes manual sign-off overhead. Reason: Operators act strictly on TRIAGE: HUMAN REQUIRED triggers. Where: `docs/execution-reports/A017-wp-1-gate-closure-triage-and-handover-facts.md`.
  - 2026-10-23: DualWritePortfolioRepository used for safe production migration with shadow metrics. Reason: Guarantees bit-for-bit parity and zero downtime across database engines. Where: `docs/execution-reports/A021-wp2-4-dual-write-verification.md`.
  - 2026-10-26: Default database engine cut over to Postgres with in-memory deprecated in production. Reason: Concludes Gate 1c and closes persistence findings P1, P2, P3, F2, F3. Where: `docs/plans/gates.json`.
  - 2026-10-26: Bitemporal time semantics enforce immutable revisions and real SHA-256 hashing. Reason: Prevents retrospective history rewriting and eliminates temporal leaks. Where: `docs/execution-reports/A023-wp3-1-cms-lifecycle.md`.
  - 2026-10-26: BudgetGovernor reserves >=20% capacity for owner interactive priority and reconciles token spend. Reason: Prevents visitor denial-of-service against owner workflows. Where: `docs/execution-reports/A024-wp3-2-governor-ledger.md`.
  - 2026-10-26: Privacy router prevents external LLM provider calls on sensitive data classes and confidential regex matches. Reason: Enforces strict zero-trust boundary on unpublished or confidential IP. Where: `docs/execution-reports/A026-wp3-4-data-class-router.md`.
  - 2026-10-27: Five-tab Structure Inspector and J K A R D S keyboard triage decouple review from authoring. Reason: Resolves UX-06 and UX-07 with instant reactivity and accessibility. Where: `docs/execution-reports/A028-wp-41-structure-review-loop-and-import-planner.md`.
  - 2026-10-27: Dynamic month-end date computation and cross-route temporal carryover close time-travel leaks. Reason: Guarantees temporal bisimulation consistency across all visitor routes (`20261020-UX-12`). Where: `docs/execution-reports/A030-wp4-3-time-travel-correctness.md`.
  - 2026-10-27: Multi-pass entity extraction and linear character masking (`[^[\]]*`) eliminate ReDoS while grouping findings into secrets, NDA markers, and entity categories. Reason: Resolves `20261020-UX-03` with interactive preview drawer. Where: `docs/execution-reports/A033-wp5-3-web-mounting-and-redaction-drawer.md`.
- **Pitfalls and dead ends (at most 10):**
  - Never use top-level `paths-ignore` in GitHub Actions for required status checks (`main-gates`). Because: Required checks will remain indefinitely pending. See: `docs/execution-reports/A015-wp1-provider-registry-extractive-degradation.md`.
  - Never edit an earlier execution report directly. Because: Reports are frozen historical audit records; all errata belong in Section 7 of the next receipt. See: `docs/plans/execution-protocol.md`.
  - vitest output is emitted per-package only. Because: Turbo runs vitest separately per workspace; any total must be labeled "computed from the above". See: `docs/execution-reports/A008.md`.
  - Do not hardcode provider URLs or tokens. Because: OSR-01 and Hardcode scanners enforce zero sensitive or domain literals in code. See: `packages/config/src/index.ts`.
  - Receipt and handover headers must omit Verified By from A017/H002 onward. Because: External verification claims outside §7 errata are forbidden. See: `scripts/receipt-check`.
  - Test fixture strings matching `sk-` patterns trigger Gitleaks generic-api-key heuristics. Because: Regex matches hardcoded mock keys. Use dynamic array joining (e.g. `['sk', 'token'].join('-')`). See: `docs/execution-reports/A026-wp3-4-data-class-router.md`.
  - Section 9 in execution reports requires exact HO-R bullet keys and exact heading title. Because: Automated regex check validates standard handover metadata. See: `scripts/receipt-check`.
  - Handover Section 8 requires exact halt condition items. Because: Automated handover validation verifies entry halt criteria. See: `scripts/handover-check`.
  - Sarif gate baseline file must not be modified in place during test execution. Because: Parallel triage tests scan git working tree for unbaselined protected files. See: `scripts/sarif-gate`.
  - Masking regexes replacing redactions must avoid nested quantifiers or optional subpatterns on bracket characters. Because: CodeQL flags polynomial ReDoS on overlapping whitespace/bracket patterns. See: `docs/execution-reports/A033-wp5-3-web-mounting-and-redaction-drawer.md`.

## 7. Verification harness

| Check | Command | Expected baseline (source) |
| --- | --- | --- |
| Full gate suite | `pnpm verify` | all gates pass (CI 40475888979) |
| Unit and conformance tests | `pnpm test` | 258 tests in 26 files (CI 40474359812 / job 122088811169) |
| End-to-end tests | `pnpm test:e2e` | 24 tests (CI 40474359812 / job 122088811388) |
| SARIF gate | `node scripts/sarif-gate` | 0 unbaselined alerts (CI 40474359689 / job 122088810385) |
| Secret scan | `node scripts/gitleaks-scan` | 143 commits scanned, 0 leaks (CI 40474359675 / job 122088810549) |
| Receipt check | `pnpm receipt:check A033` | passes |
| Docs check | `pnpm docs:check` | passes |
| Handover check | `pnpm handover:check H006` | passes |
| Handover verify | `pnpm handover:verify H006` | passes |
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
