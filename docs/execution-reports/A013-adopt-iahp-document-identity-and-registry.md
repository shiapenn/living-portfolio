# A013 — Adopt IAHP Document Identity and Registry

| Field | Value |
| --- | --- |
| Report ID | A013 |
| Date | 2026-10-22 |
| Author | A (Implementer) / `shiapenn <11827148+shiapenn@users.noreply.github.com>` |
| Task ID | `PROC-1` |
| Evidence SHA | `af1f595` |
| CI run | [GitHub Actions Run 39718736354](https://github.com/shiapenn/living-portfolio/actions/runs/39718736354) / [CodeQL Run 39718736385](https://github.com/shiapenn/living-portfolio/actions/runs/39718736385) / [Secret Scan Run 39718736450](https://github.com/shiapenn/living-portfolio/actions/runs/39718736450) |
| Verified By | `null` (Awaiting auditor re-audit) |

---

## 1. Scope

### 1.1 PROC-1 Deliverables & Execution Context
Task `PROC-1` delivers Section 11 Step 1 of the Iterative Agent Handover Protocol (IAHP) before commencing WP-1 Task 4 (`WP-1.4`), establishing strict document identity, sequence governance, and nine-section receipt integrity across the repository:
- **`[implemented]`** **Document Identity Registry (`docs/doc-registry.json`):** Created a single machine-readable manifest tracking all 28 existing repository documents across classes `A` (Execution Reports & Receipts), `H` (Handover Snapshots), `P` (Plans & Protocols), `G` (Guides, References & Templates), and `L` (Grandfathered Legacy Documents).
- **`[implemented]`** **Grandfathered Legacy Documents:** Legacy documents (`A001` through `A012`, and `L001` through `L014`) are preserved unrenamed and unedited. Curated titles are registered in `docs/doc-registry.json` with immutable `sha256` checksums.
- **`[implemented]`** **Automated Document Scaffolder (`scripts/docs-new`):** Implemented CLI allocating sequential document IDs per class without gaps, validating title character budgets (<= 80 chars) and prohibited status words, slugifying kebab-case filenames, and generating template scaffolds.
- **`[implemented]`** **Document Identity Validator (`scripts/docs-check`):** Implemented static governance validator enforcing class sequence continuity, title budgets, H1 matches, frozen file checksum immutability, index synchronization, and complete catalog coverage.
- **`[implemented]`** **Index Catalog Generator (`scripts/docs-index`):** Implemented generator keeping `docs/INDEX.md` synchronized directly with `docs/doc-registry.json`.
- **`[implemented]`** **IAHP Protocol & Handover Scaffolds:** Committed IAHP protocol under `docs/plans/P001-iterative-agent-handover-protocol.md` and the companion template under `docs/templates/G001-handover-template.md`.
- **`[implemented]`** **Execution Protocol Alignment:** Updated `docs/plans/execution-protocol.md` (§1.2 and §1.7) to reference IAHP receipt naming (`A###-<slug>.md`), the 9-section receipt structure, and Phase Boundary Handover governance.
- **`[implemented]`** **Receipt Validator Hardening (`scripts/receipt-check`):** Hardened receipt checker to enforce mandatory Sections 1 through 9 on receipts starting at `A013`, strictly verifying §8 (`receipt:check` self-validation ending in passing line) and §9 (`Handover Decision` block schema).
- **`[implemented]`** **Repository Gates Integration:** Wired `docs-check` directly into `scripts/audit-check` and `scripts/verify-all`.
- **`[implemented]`** **Automated Conformance Test Suite:** Added 9 conformance fixture tests in `apps/api/src/conformance/docs-identity.conformance.test.ts` and 4 fixture tests in `apps/api/src/conformance/receipt-check.conformance.test.ts` covering duplicate IDs, over-long titles, heading mismatches, sequence gaps, frozen file edits, INDEX drift, and missing or malformed Sections 8 and 9.

### 1.2 Proposed Grandfathered Legacy Titles (Presented to L)
Per protocol Section 11 Step 1, the following curated legacy titles are recorded in the registry and presented to Lead Reviewer (L):
- `A001`: Historical Baseline and Retroactive Tagging
- `A002`: Post-Audit Honest Baseline and Gate 1a Report
- `A003`: Gate 1b+ Remediation and UX Audit Conformance Baseline
- `A004`: History Rewrite SHA Mapping and Gate 1b+ UX Baseline
- `A005`: Tranche 0 Closure, Test Count Corrections and Honest Baseline
- `A006`: Tranche 0 Hardening, CI Disclosures and Head Baseline
- `A007`: Tranche 0 Closure, SARIF Gate and Verbatim Register
- `A008`: WP-0 Housekeeping, Truthful Status and Staged Plan Backlog
- `A009`: WP-1 Task 1 Playwright Test Harness and Authentication Flow
- `A010`: WP-1.1b Errata, Hardening and Receipt-Check Gate
- `A011`: WP-1.2 Centralized Admin apiClient and Raw Fetch Prohibition
- `A012`: WP-1.3 Redaction Scanner, Exclusions, 4-State UI and NDA Question
- `L001`: Independent Technical Audit Report
- `L002`: Design Specification Audit Report
- `L003`: Hard-Code Inventory and Remediation Report
- `L004`: Design Audit Method
- `L005`: Audit Tracking and Conformance Register Overview
- `L006`: Clean Initial Commit and Credential Rotation Report
- `L007`: Governance and Release Gate Changelog
- `L008`: Audit Tracking Requirements Decision Record
- `L009`: Public Flip-Day Checklist
- `L010`: Engineering and Execution Protocol
- `L011`: Open-Source Release and Cloud Readiness Plan
- `L012`: Optimization and Remediation Plan
- `L013`: Self-Hosting and Branding Configuration Guide
- `L014`: The Living Portfolio Open Source Specification

---

## 2. CI Evidence

### 2.1 Provenance
- Merge Commit on `main`: [`af1f5953fd0f792b6282cf31ceba8e1ceedc4da1`](https://github.com/shiapenn/living-portfolio/commit/af1f5953fd0f792b6282cf31ceba8e1ceedc4da1) (`af1f595`)
- Pull Request: PR #10 (`feat/proc-1-document-identity-iahp`), rebase-merged into `main`.
- CI & Audit Conformance Push Run: [Run 39718736354](https://github.com/shiapenn/living-portfolio/actions/runs/39718736354)
- Playwright E2E Push Run: [Job 119627008127](https://github.com/shiapenn/living-portfolio/actions/runs/39718736354/job/119627008127)
- CodeQL Push Run: [Run 39718736385](https://github.com/shiapenn/living-portfolio/actions/runs/39718736385) (Job 119627008242)
- Secret Scan Push Run: [Run 39718736450](https://github.com/shiapenn/living-portfolio/actions/runs/39718736450) (Job 119627008074)

### 2.2 Verbatim Vitest Results per Package (Job 119627007840)
```
@living-portfolio/config:test:  Test Files  1 passed (1)
@living-portfolio/config:test:       Tests  5 passed (5)
@living-portfolio/core:test:  Test Files  1 passed (1)
@living-portfolio/core:test:       Tests  17 passed (17)
@living-portfolio/db:test:  Test Files  1 passed (1)
@living-portfolio/db:test:       Tests  5 passed (5)
@living-portfolio/worker:test:  Test Files  1 passed (1)
@living-portfolio/worker:test:       Tests  2 passed (2)
@living-portfolio/ai:test:  Test Files  1 passed (1)
@living-portfolio/ai:test:       Tests  4 passed (4)
@living-portfolio/web:test:  Test Files  1 passed (1)
@living-portfolio/web:test:       Tests  5 passed (5)
@living-portfolio/api:test:  Test Files  11 passed (11)
@living-portfolio/api:test:       Tests  71 passed (71)
```
Total tests across packages (computed from the above): 109 tests across 17 test files.

### 2.3 Verbatim Playwright E2E Results (Job 119627008127)
```
7 passed (7.4s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 119627008242)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Secret Scanner (Job 119627008074)
```
Gitleaks binary version: 8.30.1 (configured GITLEAKS_VERSION: 8.30.1)
3:47AM INF 37 commits scanned.
3:47AM INF no leaks found
✓ Gitleaks scan passed with 0 leaks.
```

### 2.6 Verbatim Developer Certificate of Origin Sign-Off (Job 119627007840)
```
✓ [OSR-07 DCO] All 1 commit(s) in e71b3862cf4f82dcf763e629458d350d514b7156..af1f5953fd0f792b6282cf31ceba8e1ceedc4da1 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

### 3.1 Tests Added (13 new tests in `@living-portfolio/api`)
1. `apps/api/src/conformance/docs-identity.conformance.test.ts` (9 tests):
   - `validates active repository documentation without error`
   - `detects duplicate document IDs`
   - `detects missing or over-long title (> 80 characters)`
   - `detects filename and H1 mismatch`
   - `detects a gap in a class sequence`
   - `detects an edited frozen file whose sha256 does not match`
   - `detects INDEX drift when docs/INDEX.md is out of sync with registry`
   - `detects unindexed markdown files in docs/`
   - `allocates new document IDs with sequential increment via docs:new`
2. `apps/api/src/conformance/receipt-check.conformance.test.ts` (4 new tests):
   - `fails when receipt >= A013 is missing Section 8 (receipt-gate self-validation)`
   - `fails when receipt >= A013 is missing Section 9 (handover decision)`
   - `fails when receipt >= A013 has malformed Section 8 or 9`
   - `passes when receipt >= A013 has all 9 sections properly formed`

### 3.2 Test Count Progression
- Prior baseline (`5929dd8` / A012): 96 unit/conformance tests (16 files) + 7 Playwright E2E tests = 103 total tests.
- Current baseline (`af1f595` / A013): 109 unit/conformance tests (17 files) + 7 Playwright E2E tests = 116 total tests.
- Net count change: +13 unit/conformance tests, +1 test file (`apps/api:test` moved from 58 to 71 tests across 11 test files).

---

## 4. Files Touched

Matches `git diff --name-only 5929dd8..af1f595` verbatim (16 files):
- `apps/api/src/conformance/docs-identity.conformance.test.ts`
- `apps/api/src/conformance/receipt-check.conformance.test.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A012.md`
- `docs/plans/P001-iterative-agent-handover-protocol.md`
- `docs/plans/execution-protocol.md`
- `docs/templates/G001-handover-template.md`
- `package.json`
- `scripts/audit-check`
- `scripts/docs-check`
- `scripts/docs-index`
- `scripts/docs-new`
- `scripts/receipt-check`
- `scripts/verify-all`

---

## 5. Register and Backlog Changes

- **No Register Status Changes:** Task `PROC-1` is an engineering governance protocol task and does not modify the status of audit findings in `docs/audits/register.yml`.
- Finding statuses remain as established in A012:
  - `20261020-UX-01`: `status: partial` (owner setup & login flow, locked on subsequent attempts; multi-step wizard, TOTP QR, and recovery codes pending).
  - `20261020-UX-02`: `status: fixed` (authenticated `apiClient` enforcement and CSRF protection).
  - `20261020-UX-03`: `status: partial` (redaction scanner, exclusions, 4-state UI, and NDA gate; preview token flow in UI pending).

---

## 6. Not Done (Tagged)

Work Package 1 (WP-1) task progression:
- **`[implemented]`** **Task 1 (`WP-1.1` & `WP-1.1b`):** Playwright E2E harness, adversarial redirect prevention, failure artifact preservation, and receipt validation gate.
- **`[implemented]`** **Task 2 (`WP-1.2`):** Centralized `apiClient` for all admin client requests with conformance test forbidding raw `fetch` calls, 401/403/500 recovery messages, and `res.ok` gate.
- **`[implemented]`** **Task 3 (`WP-1.3`):** Redaction scanner with owner exclusion list in settings (no Acme literal), NDA question, 4-state result (`checking`, `clean`, `needs review`, `could not check`), retry button, and server-side publish gate.
- **`[implemented]`** **Task `PROC-1` (Section 11 Step 1):** Adopt IAHP document identity registry (`docs/doc-registry.json`), generated index (`docs/INDEX.md`), management scripts (`scripts/docs-new`, `scripts/docs-check`, `scripts/docs-index`), receipt-check 9-section gate, and companion conformance test suite.
- **`[not-started]`** **Task 4 (`WP-1.4`):** Redaction preview and publish flow surfacing signed preview token in the UI (`20261020-UX-03`, `20261020-UX-04`). Includes WP-1.3 loose-ends cleanup (single data source for exclusions, example template, `hardcode-check` JSON expansion, in-memory redaction persistence documentation, one-sentence `nda_confirmed` definition, and dedicated `redaction.spec.ts`).
- **`[not-started]`** **Task 5 (`WP-1.5`):** Config-driven provider registry with graceful extractive degradation (`20261021-AI-01`).

*(Subsequent concerns—editor enhancements, timeline scrubbers, mobile responsiveness, and visual regression baselines—are deferred to later work packages per the staged roadmap: Work Package 2: Gate G2 Alpha, Work Package 3: Before Gate G4, Milestone v0.2: P1 Actions, Before Gate G5: P2 Actions & Open-Source Release Milestones).*

---

## 7. Changes to Earlier Reports

1. **`pnpm receipt:check A012` Validation Output:** Executed `pnpm receipt:check A012` and recorded output:
   ```
   === Validating Receipt A012.md ===
   ✓ [HEADER-CHECK] Mandatory headers verified (7/7 present).
   ✓ [ANCESTOR-CHECK] Evidence SHA '5929dd8' is an ancestor of HEAD.
   ✓ [FILES-TOUCHED] Matches git diff e2156fa..5929dd8 (17 files verified).
   Found 5 section(s) marked verbatim.
   ✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 119597627447)" verified against CI logs.
   ✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 119597627723)" verified against CI logs.
   ✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 119597627424)" verified against CI logs.
   ✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Secret Scanner (Job 119597627688)" verified against CI logs.
   ✓ [VERBATIM-CHECK] Section "2.6 Verbatim Developer Certificate of Origin Sign-Off (Job 119597627447)" verified against CI logs.
   🎉 All receipt checks PASSED for A012.md.
   ```
   Confirmed that A012 omitted §8 (`grep -c '^## 8\.' docs/execution-reports/A012.md` returns 0). Under the new rules established in `PROC-1`, all receipts from A013 onward strictly require Sections 8 and 9.
2. **Correction of `UX-01` Remaining Work Priority Mapping:** Receipts A010, A011, and A012 mapped `20261020-UX-01` remaining work (multi-step wizard UI, TOTP QR display, and recovery codes) to "P1-1/P1-2", which correspond to public navigation and venture cards. The remaining items are correctly mapped to **`P1-5`** (first-run walkthrough) and **`P1-8`** (wizard operational steps for providers, notifications, backups, and theme).
3. **Correction of Work Package Backlog References:** Receipts A010, A011, and A012 §6 referenced non-existent package designations "WP-2 through WP-5". These are replaced with the staged implementation plan's canonical package names from A007 §5:
   - Work Package 2: Gate G2 Alpha
   - Work Package 3: Before Gate G4
   - Milestone v0.2: P1 Actions
   - Before Gate G5: P2 Actions & Open-Source Release Milestones
4. **Clarification of Push Status Checks on `main`:** Receipt A012 §2.1 stated that "all 4 CI checks pass". In fact, `main` executes 5 required CI status checks: DCO sign-off, Gitleaks secret scan, CodeQL static analysis, Audit conformance check (`audit-check`), and Package test runner (`turbo run test`).

---

## 8. Receipt Gate Self-Validation

```
$ node scripts/receipt-check A013
=== Validating Receipt A013-adopt-iahp-document-identity-and-registry.md ===

✓ [HEADER-CHECK] Mandatory headers verified (7/7 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'af1f595' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff e71b386..af1f595 (14 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A013-adopt-iahp-document-identity-and-registry.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 119627007840)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 119627008127)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 119627008242)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Secret Scanner (Job 119627008074)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim Developer Certificate of Origin Sign-Off (Job 119627007840)" verified against CI logs.

🎉 All receipt checks PASSED for A013-adopt-iahp-document-identity-and-registry.md.
```

---

## 9. Handover Decision

- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 13 (A001 to A013); work packages since: 0
- Clean-boundary preconditions: met (merge commit `af1f595` green across all 3 push runs; clean working tree; no WIP commits)
- Next action: continue with task WP-1.4 (Publish flow with preview token in UI)
