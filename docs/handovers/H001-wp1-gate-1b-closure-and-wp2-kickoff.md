# H001 — WP-1 Gate 1b+ Closure and WP-2 Kickoff

| Field | Value |
| --- | --- |
| Handover ID | `H001` |
| Date | 2026-10-22 |
| Author | A (Implementer) |
| Supersedes | none |
| Evidence SHA (on `main`) | `162e0ea2dc49e7c775bbe5895d890f4084064660` |
| CI runs for that SHA | 39740935577 / 39740935538 / 39740935579 / 119697703361 |
| Receipts covered | A001 to A016 |
| Phase closed | WP-1 Gate 1b+ Closure (L sign-off: pending gate review) |
| Phase next | WP-2 (Gate 1c / G2 alpha) |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read `docs/handovers/H001-wp1-gate-1b-closure-and-wp2-kickoff.md`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify H001`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4. Follow the execution protocol exactly: one task per PR, tests included, Rebase and merge, receipt as a file, no edits to earlier reports.

## 1. Mission and constitution

- **Objective:** The Living Portfolio is an open-source, self-hosted dynamic professional identity system providing proof-first claims, query-guided interactive answers, NDA-safe confidential redacting, and multi-tier AI responses without vendor or domain lock-in.
- **Non-negotiables:** Zero-hardcoded (no owner names, vendors, or sample clients in code; all values sourced from `@living-portfolio/config` or runtime data); decoupled (web and API separated by the versioned HTTP API `/api/v1`); self-hostable (every gate is a repo script runnable on any runner); honesty invariant (the UI never claims a status it has not measured); every receipt statement carries a status tag (`[implemented]`, `[partial]`, `[simulated]`, `[not-started]`).
- **Toolchain:** Node 22.x, pnpm 12.14.0, Vitest 3.0.7, Playwright 1.64.1 (Chromium headless).
- **Authority:** A implements; L reviews and signs off gates; owner decides governance. Stop points: WP-1 closure (Gate 1b+), WP-2 closure (Gate 2 / G2 alpha), and prior to G4/G5 public releases.

## 2. Source-of-truth map

| Topic | Where | How to query |
| --- | --- | --- |
| Product spec | `docs/spec/The_Living_Portfolio_Open_Source_Spec.md` | Read by section number only |
| UX audit findings | `docs/audits/2026-10-20-ux-specification-audit/report.md` | Parts 2, 3, 3b by finding ID |
| Finding register | `docs/audits/register.yml` | `node scripts/audit-check` |
| Work plan and tranches | `docs/plans/remediation-plan-AUD-2026-10-19.md`, `docs/plans/osr-001-open-source-release.md` | §1 & §2 |
| Task protocol | `docs/plans/execution-protocol.md` | Read in full |
| Latest receipts | `docs/execution-reports/` | `docs/INDEX.md` |

## 3. Phase ledger

- **Completed:**
  - Phase 0: Housekeeping, P0 conformance probes, and governance alignment (receipts A001 to A008, evidence `a37f734`).
  - WP-1: Gate 1b+ Core Controls delivery (receipts A009 to A015, evidence `35685db`):
    * WP-1.1 (`A009`/`A010`): Playwright E2E harness and auth login flow.
    * WP-1.2 (`A011`): Admin `apiClient` enforcement with raw fetch prohibition.
    * WP-1.3 (`A012`): Scanner with exclusion list, NDA questionnaire, and 4-state outcome.
    * WP-1.4 (`A014`): Publish flow with signed redaction preview tokens in UI.
    * WP-1.5 (`A015`): Config-driven provider registry, extractive degradation ladder, and provider disclosures.
- **Current phase:** WP-1 Gate Closure & Handover Tooling (`HO-1`). **Definition of done:** `scripts/handover-check`, `scripts/handover-verify`, first handover `H001`, and all verification gates passing.
- **Next phases:**
  - WP-2 (Gate 1c / G2 alpha): PostgreSQL 16 + pgvector container, migrations, pg-boss worker, ONNX embeddings, route trees, and HTTP decoupling.
  - WP-3 (Phase 2 / Pre-G4): Triage keyboard UX, structure review inspector, booking confirmation, time-travel site-wide mode, BudgetGovernor owner reserve.
  - WP-4 (Phase 3 / v0.2): Structural & IA refactoring, import triage, visitor ask states, axe accessibility.

## 4. Active workspace

- **Git:** `main` at `07a5ef7` (Evidence SHA `35685db`); open PRs: none; working tree: clean; branches holding unmerged work: none.
- **Next task:** `WP-2.1`: Scaffold PostgreSQL service container, connection pool, and migration harness. Receipt number to use: `A017`.
- **Hot files (at most 7):**
  1. `docs/plans/execution-protocol.md`: Binding engineering protocol for tasks, PRs, and receipts.
  2. `docs/plans/remediation-plan-AUD-2026-10-19.md`: Phase sequencing and technical specifications.
  3. `docs/audits/register.yml`: Finding register tracking open, partial, and fixed items.
  4. `packages/db/src/repository.ts`: Database repository interface for persistence transition.
  5. `apps/api/src/conformance/p0-probes.conformance.test.ts`: Primary conformance regression suite.
  6. `scripts/verify-all`: Unified verification gate runner.
- **Immediate next actions (ordered, at most 7):**
  1. Present Gate 1b+ closure summary and `H001` to L for review and formal sign-off.
  2. Upon L sign-off, create branch `feat/wp2.1-postgres-scaffolding` from current `main`.
  3. Add PostgreSQL 16 + pgvector service container to `.github/workflows/ci.yml`.
  4. Implement database migration harness and schema definitions in `packages/db`.
  5. Add unit and integration tests asserting schema integrity and migrations idempotence.
  6. Run `pnpm verify` and `pnpm test` locally.
- **Pending decisions:** None.

## 5. Findings and backlog snapshot

- **Register counts (local output):** 26 fixed, 0 partial, 71 open (97 total).
- **Open P0 findings:**
  - `20261020-UX-04`: Redaction review inspector and claim extraction editor.
  - `20261020-UX-07`: Markdown preview fidelity and structured text rendering.
  - `20261020-UX-08`: Structure review inspector and claim association controls.
  - `20261020-UX-10`: Booking confirmation and appointment calendar.
  - `20261020-UX-11`: Time-travel site-wide mode and bitemporal slider.
- **Next five backlog items:**
  1. Fix 7: PostgreSQL + pgvector persistence layer (`P1`, `P2`, Gate 1c).
  2. Fix 8: `pg-boss` background worker migration (`P3`, `F1`–`F3`, Gate 1c).
  3. Fix 10: PostgreSQL integration tests in CI (`P2`, `P3`, Gate 1c).
  4. OSR-12..OSR-16: Real component lanes (PostgreSQL, ONNX runtime, HTTP decoupling).
  5. UX P0-4: Redaction review inspector (`20261020-UX-04`).

## 6. Decisions and pitfalls

- **Decisions (at most 10):**
  - 2026-10-21: Rebase and merge strictly enforced across all PRs to preserve DCO trailers and clean linear history. Reason: Squash merges drop commit DCO trailers. Where: `docs/plans/execution-protocol.md`.
  - 2026-10-21: Step-level `docs_only` fast-pass used instead of workflow `paths-ignore`. Reason: Required status checks stay pending forever if workflows are ignored. Where: `docs/execution-reports/A015-wp1-provider-registry-extractive-degradation.md`.
  - 2026-10-22: Single Evidence SHA base per receipt and exact file count matching git diff. Reason: Prevent receipt discrepancies. Where: `docs/execution-reports/A014-wp1-publish-flow-preview-token.md`.
  - 2026-10-22: Config-driven provider registry with extractive fallback. Reason: Comply with zero hardcoded credentials and ensure offline degradation. Where: `docs/execution-reports/A015-wp1-provider-registry-extractive-degradation.md`.
- **Pitfalls and dead ends (at most 10):**
  - Never use top-level `paths-ignore` in GitHub Actions for required status checks (`main-gates`). Because: Required checks will remain indefinitely pending. See: `docs/execution-reports/A015-wp1-provider-registry-extractive-degradation.md`.
  - Never edit an earlier execution report directly. Because: Reports are frozen historical audit records; all errata belong in Section 7 of the next receipt. See: `docs/plans/execution-protocol.md`.
  - vitest output is emitted per-package only. Because: Turbo runs vitest separately per workspace; any total must be labeled "computed from the above". See: `docs/execution-reports/A008.md`.
  - Do not hardcode provider URLs or tokens. Because: OSR-01 and Hardcode scanners enforce zero sensitive or domain literals in code. See: `packages/config/src/index.ts`.
- **Accepted technical debt (do not fix unprompted):**
  - `SIMULATED(...)` route markers returning 501 until their respective work package arrives (`apps/api/src/routes/`).
  - In-memory mock repositories until PostgreSQL migration in WP-2 (`packages/db/src/repository.ts`).

## 7. Verification harness

| Check | Command | Expected baseline (source) |
| --- | --- | --- |
| Full gate suite | `pnpm verify` | all gates pass (CI 39740935577) |
| Unit and conformance tests | `pnpm test` | 129 tests in 19 files (CI 39740935577) |
| End-to-end tests | `pnpm test:e2e` | 11 tests (CI 39740935577 / job 119697703361) |
| SARIF gate | `node scripts/sarif-gate` | 0 unbaselined alerts (CI 39740935538) |
| Secret scan | `node scripts/gitleaks-scan` | 61 commits scanned, 0 leaks (CI 39740935579) |
| Receipt check | `pnpm receipt:check A016` | passes |
| Docs check | `pnpm docs:check` | passes |
| Handover check | `pnpm handover:check H001` | passes |
| Handover verify | `pnpm handover:verify H001` | passes |
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
