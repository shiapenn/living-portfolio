# A014 — WP-1 Task 4: Redaction Preview Token Publish Flow & Loose Ends

| Field | Value |
| --- | --- |
| Report ID | A014 |
| Date | 2026-10-22 |
| Author | A (Implementer) |
| Task ID | `WP-1.4` |
| Evidence SHA | `2c0676a` |
| CI run | `https://github.com/shiapenn/living-portfolio/actions/runs/39727128175` |
| Verified By | `L` |

---

## 1. Scope
Delivery of WP-1 Task 4 (`WP-1.4`) and loose-ends remediation from WP-1.3:
1. **Receipt-Check Line-for-Line Hardening & Dual-Direction Diffs (`d0d0465`):**
   - Hardened `scripts/receipt-check` to match vitest summary lines line-for-line with `@living-portfolio/<pkg>:test:` prefix in normalized logs, eliminating cross-package count permutations.
   - Enforced dual-direction git diff file verification (failing on missing or extra files).
   - Updated Class L document registry metadata: living documents designated `active` without SHA-256; frozen audit reports and decision records retain SHA-256.
   - Updated `L002` title to "UX and Specification Audit Report" and amended P001 Section 3.
2. **WP-1.3 Loose-Ends Remediation (`ec702f3`):**
   - (i) Removed duplicated `packages/ai/data/redaction-exclusions.json`.
   - (ii) Shipped `data/redaction-exclusions.example.json` with illustrative sample entries; default active exclusions list `data/redaction-exclusions.json` set to empty `[]`. Added conformance test asserting default active list is empty.
   - (iii) Extended `scripts/hardcode-check` to scan JSON files under `data/` and `packages/*/data/` (excluding `.example.json`), backed by planted sample conformance test.
   - (iv) Documented in-memory persistence of `PATCH /api/settings/redaction` tagged `[partial]`.
   - (v) Defined `nda_confirmed` in one sentence and specified publish gate behavior citing Spec §4.3 and §15.
   - (vi) Moved redaction and NDA E2E tests into dedicated `tests/e2e/redaction.spec.ts`.
3. **WP-1.4 Publish Flow with Preview Token in UI (`c25003d`):**
   - Surfaced signed `redactionPreviewToken` in the admin workspace UI badge and hidden input upon running preview check.
   - Implemented token invalidation upon body editing with status notification, blocking publish until preview re-check.
   - Enforced client-side and server-side publish gates requiring valid, signed preview token.
   - Added Playwright coverage verifying end-to-end token flow, publish blocked without token, token invalidation on body edit, and successful publication with token.

---

## 2. CI Evidence

### 2.1 Provenance
- Merge Commit on `main`: [`2c0676a47731fc35f7362b937954b79f92caee63`](https://github.com/shiapenn/living-portfolio/commit/2c0676a47731fc35f7362b937954b79f92caee63) (`2c0676a`)
- Pull Request: PR #12 (`feat/wp1.4-publish-flow-preview-token`), rebase-merged into `main`.
- CI & Audit Conformance Push Run: [Run 39727128175](https://github.com/shiapenn/living-portfolio/actions/runs/39727128175) (Job `119653505962`)
- Playwright E2E Push Run: [Job 119653506205](https://github.com/shiapenn/living-portfolio/actions/runs/39727128175/job/119653506205)
- CodeQL Push Run: [Run 39727128027](https://github.com/shiapenn/living-portfolio/actions/runs/39727128027) (Job `119653505529`)
- Secret Scan Push Run: [Run 39727128167](https://github.com/shiapenn/living-portfolio/actions/runs/39727128167) (Job `119653505960`)

### 2.2 Verbatim Vitest Results per Package (Job 119653505962)
```
@living-portfolio/config:test:  Test Files  1 passed (1)
@living-portfolio/config:test:  Tests  5 passed (5)
@living-portfolio/ai:test:  Test Files  1 passed (1)
@living-portfolio/ai:test:  Tests  5 passed (5)
@living-portfolio/core:test:  Test Files  1 passed (1)
@living-portfolio/core:test:  Tests  17 passed (17)
@living-portfolio/db:test:  Test Files  1 passed (1)
@living-portfolio/db:test:  Tests  2 passed (2)
@living-portfolio/worker:test:  Test Files  1 passed (1)
@living-portfolio/worker:test:  Tests  4 passed (4)
@living-portfolio/web:test:  Test Files  1 passed (1)
@living-portfolio/web:test:  Tests  5 passed (5)
@living-portfolio/api:test:  Test Files  11 passed (11)
@living-portfolio/api:test:  Tests  76 passed (76)
```
Total tests across packages (computed from the above): 114 tests across 17 test files.

### 2.3 Verbatim Playwright E2E Results (Job 119653506205)
```
  8 passed (9.0s)
```

### 2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 119653505529)
```
✓ [SARIF-GATE] Baseline verified: 0 rule(s) mapped to valid register findings.
[SARIF-GATE] Alerts parsed from SARIF: total = 0, baselined = 0, unbaselined = 0
✓ [SARIF-GATE] Gate PASSED: All 0 CodeQL alert(s) across 1 file(s) are baselined against approved register findings.
```

### 2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 119653505960)
```
Gitleaks binary version: 8.30.1 (configured GITLEAKS_VERSION: 8.30.1)
5:17AM INF 48 commits scanned.
5:17AM INF no leaks found
```

### 2.6 Verbatim DCO Verification Line (Job 119653505962)
```
✓ [OSR-07 DCO] All 3 commit(s) in bb6f0edeca75ad00d7c356418f7842b01afe7f41..2c0676a47731fc35f7362b937954b79f92caee63 carry a valid Signed-off-by trailer.
```

---

## 3. Tests Added and Count Change

### 3.1 Unit and Conformance Tests (+5 tests, 109 -> 114)
1. `apps/api/src/conformance/hardcode-check.conformance.test.ts` (+2 tests):
   - `flags planted sample names (Acme Corp, secret-project-alpha) in JSON under data/ and packages/*/data/ (WP-1.3 loose end iii)`
   - `excludes *.example.json from sample data checks`
2. `apps/api/src/conformance/receipt-check.conformance.test.ts` (+2 tests):
   - `fails validation when vitest package test counts are permuted across packages`
   - `fails validation when files touched lists extra or missing files relative to git diff`
3. `apps/api/src/conformance/redaction-scanner.conformance.test.ts` (+1 test):
   - `asserts that shipped default exclusion list is empty [] (WP-1.3 loose end ii)`

### 3.2 End-to-End Playwright Tests (+1 test, 7 -> 8)
- `tests/e2e/auth.spec.ts`: 6 tests covering owner setup wizard, setup lockdown, open redirect sanitization, TOTP login, CSRF token validation, and admin apiClient error handling.
- `tests/e2e/redaction.spec.ts` (+2 tests, moved & expanded):
  - `1. Four-state redaction preview, exclusion matching, retry button, and NDA confirmation gate (UX-03, WP-1 Task 3)`
  - `2. Signed preview token flows end to end, surfaces in UI, invalidates on body edit, and gates publication (UX-03, UX-04, WP-1 Task 4)`

---

## 4. Files Touched
The following 21 files match git diff `af1f595..2c0676a`:
- `.gitignore`
- `apps/api/src/conformance/docs-identity.conformance.test.ts`
- `apps/api/src/conformance/hardcode-check.conformance.test.ts`
- `apps/api/src/conformance/receipt-check.conformance.test.ts`
- `apps/api/src/conformance/redaction-scanner.conformance.test.ts`
- `apps/api/src/routes/entries.ts`
- `apps/api/src/routes/settings.ts`
- `apps/web/src/renderer.ts`
- `data/redaction-exclusions.example.json`
- `data/redaction-exclusions.json`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A013-adopt-iahp-document-identity-and-registry.md`
- `docs/plans/P001-iterative-agent-handover-protocol.md`
- `packages/ai/src/ai.test.ts`
- `packages/ai/src/extraction/index.ts`
- `scripts/hardcode-check`
- `scripts/receipt-check`
- `tests/e2e/auth.spec.ts`
- `tests/e2e/helpers.ts`
- `tests/e2e/redaction.spec.ts`

*Note on intermediate commits:* The git range `af1f595..2c0676a` spans the previous Evidence SHA (`af1f595`), docs PR #11 (`d59499c` delivering A013 receipt and doc-identity conformance updates), commit `bb6f0ed` (transient network retry logic in receipt-check), and PR #12 (`2c0676a` delivering WP-1.4, WP-1.3 loose-ends cleanup, and protocol hardening). All 21 files touched across this range are listed above and verified verbatim by `scripts/receipt-check`.

---

## 5. Register and Backlog Changes
- `20261020-UX-03` (`P0-3` / `S2`): Status remains `[partial]`. Preview token now flows through UI, client and server gates enforced, owner exclusion list supported, and body-edit invalidation verified. Requires remaining WP-1 tasks (provider registry and degradation) to complete full audit criteria.
- `20261020-UX-04`: Status remains `[partial]`. Preview token now wired to publish flow and UI.
- No other register findings changed.

---

## 6. Not Done (Tagged)
- `[partial]` `PATCH /api/settings/redaction` persistence: Persists in process memory (`RuntimeSettingsState`). Persistent disk/Postgres storage will be delivered in the Postgres persistence task (Findings M1 / M8).
- `[not-started]` **Task 5 (`WP-1.5`):** Config-driven provider registry with extractive degradation ladder and provider disclosure lines (`20261021-AI-01`, `S4`, Spec §10.8, §13.5).
- `[not-started]` **WP-1 Gate Close (`A016`):** Gate summary, fresh-clone browser verification path, definition-of-done verification.
- `[not-started]` **HO-1 Handover Protocol Execution (`A017`):** Record L's sign-off, build `handover-check` / `handover-verify`, deliver initial handover artifact `H001`.

---

## 7. Changes to Earlier Reports

### 7.1 Corrections to A013 Errata
1. **§2.2 Permuted counts in A013:**
   - In CI job `119627007840`, the true vitest counts were: `@living-portfolio/ai`: 5 tests (1 file), `@living-portfolio/db`: 2 tests (1 file), `@living-portfolio/worker`: 4 tests (1 file) (config: 5, core: 17, web: 5, api: 71; total 109 across 17 files).
   - In A013, the counts were permuted as ai: 4, db: 5, worker: 2 due to loose substring containment matching in `receipt-check`.
   - Remediated in `scripts/receipt-check` by enforcing strict line-for-line matching including package prefix, backed by fixture conformance test.
2. **§4 and §8 Base disagreement in A013:**
   - A013 §4 listed 16 files against base `5929dd8`, while §8 verified 14 against `e71b386`.
   - Corrected: Every receipt now references exactly one base SHA (the prior receipt's Evidence SHA), lists exactly the files verified by `receipt-check`, and documents intermediate commits in an explanatory note.
   - Remediated `receipt-check` to enforce bidirectional diff checks (failing on missing or extra files).
3. **`docs/audits/register.yml` in A013 §4 diff:**
   - `docs/audits/register.yml` was touched in intermediate docs PR #9 (`e71b386`) which added the history entry for `20261020-UX-03`. PR #10 (`af1f595`) itself made no register changes.
4. **CI check names required on `main` (Ruleset UI names):**
   - Ruleset `main-gates` requires exactly 4 checks:
     1. `Typecheck, Unit, Security Regression, DCO & Audit Gate` (DCO, audit-check, typecheck, tests are sub-steps)
     2. `Gitleaks Secret & Credential Scan`
     3. `CodeQL (JavaScript / TypeScript)`
     4. `Playwright End-to-End Suite`
   - Corrects earlier references in A010-A012 to "4" or "5" CI checks: there are 4 required status checks on `main` under the ruleset, while pull requests additionally run the non-required `Supply-Chain & License Dependency Review`.
5. **Handover Decision in A013:**
   - With 13 receipts and no prior handover, Rule HO-R3 applied (RECOMMENDED), not HO-R5.
   - L's decision: Handover deferred to WP-1 close (A017). Tripwire: Any further provenance error in A014 or A015 triggers HO-R4.
6. **Class L Document Registry Living vs Frozen Table:**
   - Reports and decision records are frozen (SHA-256 enforced); living documents (plans, protocols, specs, guides, checklists, changelogs) have status `active` with no SHA requirement.

| Document ID | Path | Title | Status |
| --- | --- | --- | --- |
| `L001` | `docs/audits/2026-10-19-independent-technical-audit/report.md` | Independent Technical Audit Report | `frozen` |
| `L002` | `docs/audits/2026-10-20-ux-specification-audit/report.md` | UX and Specification Audit Report | `frozen` |
| `L003` | `docs/audits/hardcode-inventory.md` | Hard-Code Inventory and Remediation Report | `frozen` |
| `L004` | `docs/audits/methods/design-audit-method.md` | Design Audit Method | `active` |
| `L005` | `docs/audits/README.md` | Audit Tracking and Conformance Register Overview | `active` |
| `L006` | `docs/execution-reports/OSR-05-clean-tree-and-rotation.md` | Clean Initial Commit and Credential Rotation Report | `frozen` |
| `L007` | `docs/governance/CHANGELOG.md` | Governance and Release Gate Changelog | `active` |
| `L008` | `docs/governance/DR-AUD-001.md` | Audit Tracking Requirements Decision Record | `frozen` |
| `L009` | `docs/governance/flip-day-checklist.md` | Public Flip-Day Checklist | `active` |
| `L010` | `docs/plans/execution-protocol.md` | Engineering and Execution Protocol | `active` |
| `L011` | `docs/plans/osr-001-open-source-release.md` | Open-Source Release and Cloud Readiness Plan | `active` |
| `L012` | `docs/plans/remediation-plan-AUD-2026-10-19.md` | Optimization and Remediation Plan | `active` |
| `L013` | `docs/self-hosting.md` | Self-Hosting and Branding Configuration Guide | `active` |
| `L014` | `docs/spec/The_Living_Portfolio_Open_Source_Spec.md` | The Living Portfolio Open Source Specification | `active` |

*Confirmation:* `docs/plans/execution-protocol.md` (`L010`) is confirmed living (`active`). `L002` title is updated to "UX and Specification Audit Report".

---

## 8. Receipt Gate Self-Validation
```
$ node scripts/receipt-check A014
=== Validating Receipt A014-wp1-publish-flow-preview-token.md ===

✓ [HEADER-CHECK] Mandatory headers verified (7/7 present).
✓ [ANCESTOR-CHECK] Evidence SHA '2c0676a' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff af1f595..2c0676a (21 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A014-wp1-publish-flow-preview-token.md.
Found 5 section(s) marked verbatim.
✓ [VERBATIM-CHECK] Section "2.2 Verbatim Vitest Results per Package (Job 119653505962)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.3 Verbatim Playwright E2E Results (Job 119653506205)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.4 Verbatim SARIF Static Analysis Baseline Gate (Job 119653505529)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.5 Verbatim Gitleaks Commit Count & Secret Scan Output (Job 119653505960)" verified against CI logs.
✓ [VERBATIM-CHECK] Section "2.6 Verbatim DCO Verification Line (Job 119653505962)" verified against CI logs.

🎉 All receipt checks PASSED for A014-wp1-publish-flow-preview-token.md.
```

---

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 14 (A001–A014); work packages since: 1 (WP-0 completed, WP-1 in progress)
- Clean-boundary preconditions: met (all CI jobs green, working tree clean, all gates passing)
- Next action: Handover deferred to WP-1 gate close (A017) per Lead Reviewer (L) directive. Tripwire: Any further provenance error in A014 or A015 triggers immediate HO-R4 handover. Proceed with Task 5 (`WP-1.5`, config-driven provider registry with extractive degradation and disclosure line).
