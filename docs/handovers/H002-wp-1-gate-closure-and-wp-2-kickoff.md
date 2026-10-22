# H002 — WP-1 Gate Closure and WP-2 Kickoff

| Field | Value |
| --- | --- |
| Handover ID | `H002` |
| Date | 2026-10-22 |
| Author | A (Implementer) |
| Supersedes | H001 |
| Evidence SHA (on `main`) | `1c3d429b7acf40fc923424a3e583cec7d9b179c0` |
| CI runs for that SHA | 39751556569 / 39751556973 / 39751556660 / 119733108290 |
| Receipts covered | A001 to A017 |
| Phase closed | WP-1 Gate Closure (certified in docs/plans/gates.json) |
| Phase next | WP-2 (Gate 1c / G2 alpha) |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read `docs/handovers/H002-wp-1-gate-closure-and-wp-2-kickoff.md`, then `docs/plans/execution-protocol.md`, and nothing else. Do not explore the repo. Run `pnpm handover:verify H002`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4. Follow the execution protocol exactly: one task per PR, tests included, Rebase and merge, receipt as a file, no edits to earlier reports.

## 1. Mission and constitution

- **Objective:** The Living Portfolio is an open-source, self-hosted dynamic professional identity system providing proof-first claims, query-guided interactive answers, NDA-safe confidential redacting, and multi-tier AI responses without vendor or domain lock-in.
- **Non-negotiables:** Zero-hardcoded (no owner names, vendors, or sample clients in code; all values sourced from `@living-portfolio/config` or runtime data); decoupled (web and API separated by the versioned HTTP API `/api/v1`); self-hostable (every gate is a repo script runnable on any runner); honesty invariant (the UI never claims a status it has not measured); every receipt statement carries a status tag (`[implemented]`, `[partial]`, `[simulated]`, `[not-started]`).
- **Toolchain:** Node 22.x, pnpm 12.14.0, Vitest 3.0.7, Playwright 1.64.1 (Chromium headless), Turbo 2.4.4, TypeScript 5.7.3.
- **Authority:** A implements; L reviews and signs off gates; owner decides governance. Stop points: WP-1 closure (Gate 1b+), WP-2 closure (Gate 2 / G2 alpha), and prior to G4/G5 public releases.

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
  - WP-1: Gate 1b+ Core Controls delivery (receipts A009 to A015, evidence `35685db`):
    * WP-1.1 (`A009`/`A010`): Playwright E2E harness and auth login flow.
    * WP-1.2 (`A011`): Admin `apiClient` enforcement with raw fetch prohibition.
    * WP-1.3 (`A012`): Scanner with exclusion list, NDA questionnaire, and 4-state outcome.
    * WP-1.4 (`A014`): Publish flow with signed redaction preview tokens in UI.
    * WP-1.5 (`A015`): Config-driven provider registry, extractive degradation ladder, and provider disclosures.
  - HO-1 / HO-1b: Gate closure tooling, triage gate, and handover facts (receipts A016 to A017, evidence `c7936d4`).
- **Current phase:** Handover Snapshot H002 (`HO-2`). **Definition of done:** `docs/handovers/H002-wp-1-gate-closure-and-wp-2-kickoff.md` supersedes H001, passes `handover-check`, and verifies on `main`.
- **Next phases:**
  - WP-2 (Gate 1c / G2 alpha): PostgreSQL 16 + pgvector container, migrations, pg-boss worker, ONNX embeddings, route trees, and HTTP decoupling.
  - WP-3 (Phase 2 / Pre-G4): Triage keyboard UX, structure review inspector, booking confirmation, time-travel site-wide mode, BudgetGovernor owner reserve.
  - WP-4 (Phase 3 / v0.2): Structural & IA refactoring, import triage, visitor ask states, axe accessibility.

## 4. Active workspace

- **Git:** `main` at `1c3d429` (Evidence SHA `1c3d429b7acf40fc923424a3e583cec7d9b179c0`); open PRs: none; working tree: clean; branches holding unmerged work: none.
- **Next task:** `WP-2.1`: Scaffold PostgreSQL service container, connection pool, and migration harness. Receipt number to use: `A018`.
- **Hot files (at most 7):**
  1. `docs/plans/execution-protocol.md`: Binding engineering protocol for tasks, PRs, and receipts.
  2. `docs/plans/remediation-plan-AUD-2026-10-19.md`: Phase sequencing and technical specifications.
  3. `docs/audits/register.yml`: Finding register tracking open, partial, and fixed items.
  4. `packages/db/src/repository.ts`: Database repository interface for persistence transition.
  5. `apps/api/src/conformance/p0-probes.conformance.test.ts`: Primary conformance regression suite.
  6. `scripts/verify-all`: Unified verification gate runner.
  7. `scripts/triage`: Autonomous triage gate evaluator.
- **Immediate next actions (ordered, at most 7):**
  1. Create feature branch `feat/wp2.1-postgres-scaffolding` from current `main`.
  2. Add PostgreSQL 16 + pgvector service container to `.github/workflows/ci.yml`.
  3. Implement database migration harness and schema definitions in `packages/db`.
  4. Add unit and integration tests asserting schema integrity and migrations idempotence.
  5. Run `pnpm verify` and `pnpm test` locally.
- **Pending decisions:** None.

## 5. Findings and backlog snapshot

- **Register counts (local output):** 27 fixed, 3 partial, 67 open (97 total).
- **Open P0 findings:**
  - `P2`: Drizzle schema has no Postgres connection, migrations, schema_info boot check, or PostgresRepository
  - `P3`: Worker has no process entrypoint, no pg-boss queue registration, and does not persist ONNX embeddings
  - `F1`: apps/web renderer was not mounted by createApp() in apps/api (only in server.ts) and lacked sub-routes
  - `F2`: docker-compose.hobbyist.yml references missing docker/Dockerfile.api and docker/Dockerfile.worker
  - `F3`: /healthz is wired to a constant async () => true callback without checking DB, queue, disk, or backup age
  - `OSR-16`: Dockerfiles, compose stack, quickstart test in CI; release workflow with signed multi-arch images & SBOM (Gate G2)
  - `20261020-UX-01`: Owner has no way to sign in or set up. A browser at `/admin` gets raw JSON 401. `setupWizardCompleted` is hard-coded `true`. If `ADMIN_API_TOKEN` is unset, a published default token (`lp_pat_default_test_admin_token_001`) grants admin; it worked in my run
  - `20261020-UX-03`: Redaction preview is optional, and a failed request renders green "✓ No confidential secrets…". In my test the scanner flagged an email but not an `sk-…` key or "NDA". `POST /api/entries` publishes public with no token (verified: secret served at `/work/leaky-1`)
  - `20261020-UX-04`: Truncated CMS lifecycle (Anti-pattern C). One action, "Publish as is", creates a *public* entry. No draft/save, no edit of existing entries, no revision list, no visibility control, no unpublish, no delete (API exists for all). Empty body is replaced with a stub and published (`:1097`). Slug is manual. Admin list links to `/work/…` which 404s for private entries. No undo or confirm
  - `20261020-UX-06`: The structure loop (the Spec's core value) is read-only. Inspector is bound to `entries[0]`. No accept/change/ignore, no facet confirm, no outcome picker, no evidence attach, no answerability preview, no tabs. Gap questions are a bullet list you cannot answer
  - `20261020-UX-07`: Onboarding and alternative authoring paths are missing: first-run walkthrough, import upload and planner, confidence-sorted triage with `J K A R D S`, guided mode with per-role prompts, quick log (no route or API at all)
  - `20261020-UX-08`: Escalation loop is open at both ends. Owner list is read-only (no approve, edit or reject). Visitor side captures no contact, so an approved reply cannot be delivered; the 24-hour promise has no receipt or status page. The draft is a static template string (`ask.ts:175`, repo finding `G7`)
  - `20261020-UX-09`: Admin operations are static, fabricated or absent. The topology-conflict card is hard-coded text while the API returns an honest 501. Scoped constraints list lacks confirm and discard. Kill-switch UI starts from a local `answeringEnabled = true`, ignoring server state. Calibration, routing floors, theme, providers, notifications and backups have no screens. `health.ts` and `settings.ts` return invented "passed" and "verified" statuses
  - `20261020-UX-11`: Booking is an `alert()`; no endpoint, no storage, no contact field, facets not carried (Tier 3 dead end)
  - `20261020-UX-12`: Time-travel does not travel. The as-of date is not carried to entries (links go to `/work/slug`, which shows the latest revision), to Ask, or to nav. Default date is a fixed `2026-10-19`, so "Apply" without edits excludes recent entries (verified). Band click hard-codes day 28. Keyboard hint promises arrows, Page Up/Down and Enter, but no handler exists. All-filtered result has no empty state
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
  - 2026-10-22: Autonomous triage gate removes manual sign-off overhead. Reason: Operators act strictly on TRIAGE: HUMAN REQUIRED triggers. Where: `docs/execution-reports/A017-wp-1-gate-closure-triage-and-handover-facts.md`.
- **Pitfalls and dead ends (at most 10):**
  - Never use top-level `paths-ignore` in GitHub Actions for required status checks (`main-gates`). Because: Required checks will remain indefinitely pending. See: `docs/execution-reports/A015-wp1-provider-registry-extractive-degradation.md`.
  - Never edit an earlier execution report directly. Because: Reports are frozen historical audit records; all errata belong in Section 7 of the next receipt. See: `docs/plans/execution-protocol.md`.
  - vitest output is emitted per-package only. Because: Turbo runs vitest separately per workspace; any total must be labeled "computed from the above". See: `docs/execution-reports/A008.md`.
  - Do not hardcode provider URLs or tokens. Because: OSR-01 and Hardcode scanners enforce zero sensitive or domain literals in code. See: `packages/config/src/index.ts`.
  - Receipt and handover headers must omit Verified By from A017/H002 onward. Because: External verification claims outside §7 errata are forbidden. See: `scripts/receipt-check`.
- **Accepted technical debt (do not fix unprompted):**
  - `SIMULATED(...)` route markers returning 501 until their respective work package arrives (`apps/api/src/routes/`).
  - In-memory mock repositories until PostgreSQL migration in WP-2 (`packages/db/src/repository.ts`).

## 7. Verification harness

| Check | Command | Expected baseline (source) |
| --- | --- | --- |
| Full gate suite | `pnpm verify` | all gates pass (CI 39751556569) |
| Unit and conformance tests | `pnpm test` | 145 tests in 21 files (CI 39751556569 / job 119733108058) |
| End-to-end tests | `pnpm test:e2e` | 11 tests (CI 39751556569 / job 119733108290) |
| SARIF gate | `node scripts/sarif-gate` | 0 unbaselined alerts (CI 39751556973) |
| Secret scan | `node scripts/gitleaks-scan` | 78 commits scanned, 0 leaks (CI 39751556660) |
| Receipt check | `pnpm receipt:check A017` | passes |
| Docs check | `pnpm docs:check` | passes |
| Handover check | `pnpm handover:check H002` | passes |
| Handover verify | `pnpm handover:verify H002` | passes |
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
