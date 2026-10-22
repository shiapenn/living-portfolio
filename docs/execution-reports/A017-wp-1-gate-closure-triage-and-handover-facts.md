# A017 — WP-1 Gate Closure Triage and Handover Facts

| Field | Value |
| --- | --- |
| Report ID | A017 |
| Date | 2026-10-22 |
| Author | A (Implementer) |
| Task ID | `HO-1b` |
| Evidence SHA | `c7936d4` |
| CI run | 39751556569 |

---

## 1. Scope

Delivered Task `HO-1b` (Autonomous Triage Gate and Handover Facts Tooling) for Work Package 1 closure:
1. **Process Change & Header Hygiene:** Removed the `Verified By` field from receipt and handover document headers from A017 / H002 onward. Enforced via `scripts/receipt-check` and `scripts/handover-check`, rejecting any claim of external verification or sign-off outside §7 errata. Operators act strictly when `TRIAGE: HUMAN REQUIRED` is triggered `[implemented]`.
2. **Autonomous Triage Gate (`scripts/triage`):** Implemented `pnpm triage`, integrated into `scripts/audit-check` and `scripts/verify-all` with zero new workflow steps. Scans the latest two receipts and latest handover (`-all` scans entire history) for mechanical consistency: headers, sections 1–9, ancestors, files-touched diffs, verbatim CI logs with package prefixes, absence of external sign-off claims, §9 handover decision rules, and test regressions. Ends with exactly one authoritative verdict line: `TRIAGE: PROCEED`, `TRIAGE: FIX`, or `TRIAGE: HUMAN REQUIRED` with numbered questions `[implemented]`.
3. **Handover Facts Tooling (`scripts/handover-facts`):** Created `pnpm handover:facts` to output canonical register counts by status (`fixed`, `partial`, `open`), list open P0 findings with verbatim register titles, extract tool versions from `package.json`, report `origin/main` SHA, and cite latest CI baselines `[implemented]`.
4. **Handover Check Conformance Hardening (`scripts/handover-check`):** Extended `handover-check` to enforce for H002+ that every referenced finding title matches `docs/audits/register.yml` verbatim, header SHA matches §4, tool versions match `package.json`, and referenced repository paths exist on disk `[implemented]`.
5. **Gate Manifest (`docs/plans/gates.json`):** Formally codified Work Package 1 gate criteria, requiring completed task IDs `WP-1.1` through `WP-1.5` and 11 named Playwright verification tests `[implemented]`.
6. **CI Fast-Pass Hardening (`scripts/changed-scope`):** Hardened diff calculation with `--no-renames`, fail-closed error handling on missing, zero, or unresolvable base SHAs, strict exclusion of `sarif-baseline.json` from docs-only fast pass, and online execution for audit and receipt checkers `[implemented]`.
7. **Regression Conformance Tests (`20261021-AI-01`):** Added a local stub HTTP provider test to `provider-degradation.conformance.test.ts` and vendor-literal detection tests to `hardcode-check.conformance.test.ts` `[implemented]`.

---

## 2. CI Evidence

### 2.1 Provenance
All CI evidence blocks in §2.2–§2.6 are copied verbatim from the push workflow runs on commit `c7936d4460838719efadf2ac5222014673a5d027` (`c7936d4`) on `main`:
- Workflow Run `39751556569`: CI & Audit Conformance Gate
- Workflow Run `39751556973`: CodeQL Static Analysis
- Workflow Run `39751556660`: Secret Scan (gitleaks)

### 2.2 Verbatim Vitest Results per Package (Job 119733108058)
```
@living-portfolio/ai:test:  Test Files  1 passed (1)
@living-portfolio/ai:test:       Tests  7 passed (7)

@living-portfolio/core:test:  Test Files  1 passed (1)
@living-portfolio/core:test:       Tests  17 passed (17)

@living-portfolio/config:test:  Test Files  1 passed (1)
@living-portfolio/config:test:       Tests  5 passed (5)

@living-portfolio/worker:test:  Test Files  1 passed (1)
@living-portfolio/worker:test:       Tests  4 passed (4)

@living-portfolio/db:test:  Test Files  1 passed (1)
@living-portfolio/db:test:       Tests  2 passed (2)

@living-portfolio/web:test:  Test Files  1 passed (1)
@living-portfolio/web:test:       Tests  5 passed (5)

@living-portfolio/api:test:  Test Files  15 passed (15)
@living-portfolio/api:test:       Tests  105 passed (105)
```
*Total: 21 test files, 145 tests passed across 7 packages.*

### 2.3 Verbatim Playwright E2E Results (Job 119733108290)
```
11 passed (7.0s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 119733109189)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 119733108481)
```
8:56AM INF 78 commits scanned.
8:56AM INF no leaks found
✓ Gitleaks scan passed with 0 leaks.
```

### 2.6 Verbatim DCO Verification Line (Job 119733108058)
```
✓ [OSR-07 DCO] All 9 commit(s) in 0c24f60746a32752f49410010d89d02a8cdac537..c7936d4460838719efadf2ac5222014673a5d027 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

### Tests Added
Added 16 new conformance tests across 5 test suites in `apps/api/src/conformance/`:
- `changed-scope.conformance.test.ts` (+4 tests):
  1. `fails closed when base SHA is missing or cannot be resolved`
  2. `fails closed when commit range contains unknown commits`
  3. `treats sarif-baseline.json modification as non-docs change`
  4. `identifies application code changes as requiring full CI`
- `triage.conformance.test.ts` (+5 tests):
  1. `emits TRIAGE: PROCEED when receipts and handover pass all mechanical checks`
  2. `emits TRIAGE: FIX when receipt or handover has format or count errors`
  3. `emits TRIAGE: HUMAN REQUIRED when governance, security, or workflow files are touched`
  4. `emits TRIAGE: HUMAN REQUIRED when failure persists after two fix attempts`
  5. `validates triage output structure and single-line conclusion format`
- `handover.conformance.test.ts` (+4 tests):
  1. `fails validation when finding title does not match register.yml verbatim`
  2. `fails validation when header Evidence SHA differs from Section 4`
  3. `fails validation when reported tool version differs from package.json`
  4. `fails validation when referenced repository path does not exist on disk`
- `provider-degradation.conformance.test.ts` (+1 test):
  1. `local-stub HTTP provider degrades cleanly with extractive fallback and disclosure lines (20261021-AI-01)`
- `hardcode-check.conformance.test.ts` (+2 tests):
  1. `detects vendor literal Acme Corp when present in source code`
  2. `passes cleanly when no unbaselined vendor literals are detected`

### Count Change
- Unit & Conformance Suites: increased from 129 tests across 19 files (in A016) to 145 tests across 21 test files (+16 tests, +2 test files in `@living-portfolio/api`).
- Playwright E2E Suite: unchanged at 11 passed (11 passed, 7.0s).

---

## 4. Files Touched

Verified against previous Evidence SHA `162e0ea` (`git diff --name-only 162e0ea..c7936d4`). Note: includes 4 documentation files from A016 documentation commit `0c24f60` that landed on `main` before the `HO-1b` feature branch, plus the 16 implementation files of `HO-1b`:
- `.github/workflows/ci.yml`
- `.github/workflows/codeql.yml`
- `apps/api/src/conformance/changed-scope.conformance.test.ts`
- `apps/api/src/conformance/handover.conformance.test.ts`
- `apps/api/src/conformance/hardcode-check.conformance.test.ts`
- `apps/api/src/conformance/provider-degradation.conformance.test.ts`
- `apps/api/src/conformance/triage.conformance.test.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A016-wp1-gate-1b-closure-and-handover-tooling.md`
- `docs/handovers/H001-wp1-gate-1b-closure-and-wp2-kickoff.md`
- `docs/plans/gates.json`
- `package.json`
- `scripts/audit-check`
- `scripts/changed-scope`
- `scripts/docs-new`
- `scripts/handover-check`
- `scripts/handover-facts`
- `scripts/receipt-check`
- `scripts/triage`

---

## 5. Register and Backlog Changes

### Register Changes
- Current status counts in `docs/audits/register.yml`: 27 fixed, 3 partial, 67 open (97 total).
- Work Package 1 gate formally closed in `docs/plans/gates.json`, certifying completion of `WP-1.1` through `WP-1.5` and 11 Playwright verification tests.

---

## 6. Not Done (Tagged)

- `A018` / `HO-2`: Author second handover snapshot `H002` derived from `scripts/handover-facts`, superseding `H001` `[not-started]`.
- `WP-2` / `Fix 7` (`P1`, `P2`): PostgreSQL 16 + pgvector persistence repository `[not-started]`.
- `WP-2` / `Fix 8` (`P3`, `F1`–`F3`): `pg-boss` background worker migration `[not-started]`.
- `WP-2` / `Fix 10` (`P2`, `P3`): PostgreSQL integration test lane in CI `[not-started]`.
- `WP-2` / `OSR-12`..`OSR-16`: Real component lanes `[not-started]`.
- `WP-2` / `20261020-UX-04`: Redaction review inspector and claim extraction editor `[not-started]`.
- `WP-2` / `20261020-UX-07`: Markdown preview fidelity and structured text rendering `[not-started]`.

---

## 7. Changes to Earlier Reports

1. **A014 & A015 Header Claims:** Headers in `A014` and `A015` stated `Verified By: L`. This was an erroneous claim as no human review step occurred. Per instructions, legacy reports remain unedited; `receipt-check` enforces that all receipts from A017 onward forbid the `Verified By` header row and reject claims of human verification or approval outside §7 errata.
2. **A015 §9 Receipts Count:** `A015` §9 stated "receipts since last handover: 1". Because no prior handover had been published at the time of A015, the actual count of receipts since project inception was 15 (`A001` through `A015`).
3. **A015 §1 Fast-Pass Timing:** `A015` §1 claimed docs-only fast-pass checks complete in under 15s. In practice, GitHub Actions runner setup, checkout, and workflow startup overhead results in runs completing between 28s and 44s.
4. **`nda_confirmed` Gate Definition and Enforcement Rule:**
   - Spec §4.3 (line 221): `Before publishing, a redaction preview highlights personal names, client names, secrets, and anything matching exclusion rules, and asks whether any of it is under NDA`.
   - Spec §15 (lines 1150–1151): `...the redaction preview (§4.3) is a required human step for public content. Third-party content: journals and documents can contain other people's information; the preview and the owner's confirmation are the consent mechanism...`.
   - Gate Rule: Confirmation is required strictly when confidential matches exist. Attempting to publish an entry with unconfirmed confidential matches returns HTTP 400 Bad Request. Entries with 0 confidential matches publish directly without requiring NDA confirmation.
5. **Status Counts Reconciliation in Register and H001:** `H001` reported counts as 26 fixed, 0 partial, 71 open. True counts in `docs/audits/register.yml` are 27 fixed, 3 partial, 67 open (97 total). The partial findings are `20261020-UX-01`, `20261020-UX-03`, and `20261020-UX-09`, while `20261021-AI-01` is fixed.
6. **Finding `20261021-AI-01` Conformance Regression Tests:** Added missing regression tests: local-stub HTTP provider test in `provider-degradation.conformance.test.ts` and vendor-literal detection in `hardcode-check.conformance.test.ts`.

---

## 8. Receipt Gate Self-Validation
```
=== Validating Receipt A017-wp-1-gate-closure-triage-and-handover-facts.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'c7936d4' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 162e0ea..c7936d4 (20 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A017-wp-1-gate-closure-triage-and-handover-facts.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 119733108058)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 119733108290)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 119733109189)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 119733108481)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 119733108058)" verified against CI logs.

🎉 All receipt checks PASSED for A017-wp-1-gate-closure-triage-and-handover-facts.md.
```

---

## 9. Handover Decision
- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 1 (A017 since H001); work packages since: 0
- Clean-boundary preconditions: met
- Next action: Task A018 (write H002 from handover-facts superseding H001)
