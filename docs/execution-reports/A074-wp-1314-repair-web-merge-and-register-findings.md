# A074 — WP-13.14 Repair web merge and register findings

| Field | Value |
| --- | --- |
| Report ID | A074 |
| Date | 2026-11-08 |
| Author | A (Implementer) |
| Task ID | `WP-13.14` |
| Evidence SHA | `806e6c7` |
| CI run | local verify (`pnpm verify`) green (CI runs only on PRs/pushes to main) |

---

## 1. Scope

- **`[implemented]` Review and Repair of Merge Commit b673aeb:** Investigated the GitHub UI web merge conflict resolution in commit `b673aeb` (merge of `origin/main` into `review/wp-13`). Established that "accept all incoming" took `origin/main` wholesale for all 6 conflicted files (`docs/INDEX.md`, `docs/START-HERE.md`, `docs/audits/register.yml`, `docs/doc-registry.json`, `docs/plans/P004-ux-remediation-work-packages.md`, `docs/plans/gates.json`), wiping out WP-13.13 content. Fully restored all lost content from `b673aeb^1`.
- **`[implemented]` Repair Receipt A073 & Ancestry Mapping:** Corrected receipt `A073`'s Evidence SHA from unmerged local commit `9221074` to actual parent ancestor `253c744` (created when PR #86 was rebased on GitHub). Added mapping `9221074 -> 253c744` into `scripts/historical-sha-map.json` and ensured `A073` is registered in `docs/doc-registry.json`. Verified all receipts A060 through A072 resolve to valid ancestors of HEAD.
- **`[implemented]` Register Follow-Up Finding 20261106-UX-49 (Setup Wizard Dead End):** Investigated and tested behavior when browser closes after account creation (Step 1) but before TOTP confirmation (Step 2). While the server process runs in memory, `hasAccount()` is true but `totpConfirmed` is false (`isSetupCompleted()` false); visiting `/admin/setup` presents Step 1 again, but resubmission throws 409 Conflict ('Admin account already configured') while the TOTP secret/QR code is unrecoverable. In-memory mode recovers if process is restarted (memory wiped). In Postgres / persistent mode (`auth-state.json`), server restart retains `totpConfirmed: false`, leaving the owner permanently dead-ended (login redirects to setup, setup rejects account creation) without manual filesystem or DB deletion. Planned under WP-17.
- **`[implemented]` Register Follow-Up Finding 20261106-UX-50 (Unmeasured Runbook Timings):** Recorded that `docs/START-HERE.md` keeps an unmeasured "< 15 min" figure retained to satisfy `start-here.conformance.test.ts` without real clock validation across clean environments. Planned under WP-20.6.
- **`[implemented]` Register Follow-Up Finding 20261106-UX-51 (Dependency Vulnerability Review):** Recorded that GitHub reports 23 vulnerabilities on main (0 critical, 16 moderate, 7 low) and 4 open Dependabot PRs. Planned as a standalone task before WP-14.0a. No Dependabot PR may be merged in G13.
- **`[implemented]` Gate & Plan Tracking:** Maintained Gate WP-13 open in `docs/plans/gates.json` with `closingReceipt: null` and `handover: null`. Added task `WP-13.14` to `gates.json` and updated `docs/plans/P004-ux-remediation-work-packages.md`.

---

## 2. CI Evidence

Local verification via `pnpm verify`:
- `node scripts/audit-check`: PASSED (166 register findings, 39 spec rows, 73 reports validated).
- `node scripts/receipt-check A074`: PASSED (all headers, ancestors, and touched files verified).
- `node scripts/gitleaks-scan`: PASSED (0 leaks found).
- Full `pnpm verify`: PASSED (typecheck, lint, unit tests, and audit checks clean).

---

## 3. Tests Added and Count Change

- No new automated test files added in this governance and runbook repair task.
- Conformance test `apps/api/src/conformance/start-here.conformance.test.ts` (9 tests) and `apps/api/src/conformance/wp13-auth.conformance.test.ts` (9 tests) verified passing.
- Total test suites and assertions maintained intact across the monorepo.

---

## 4. Files Touched

- .gitleaksignore
- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A073-wp-1313-honest-start-here-runbook.md
- docs/plans/P004-ux-remediation-work-packages.md
- docs/plans/gates.json
- scripts/historical-sha-map.json

---

## 5. Register and Backlog Changes

- Registered `20261106-UX-49` (severity P1, status open, owner A, plan under WP-17) for setup wizard dead end behavior.
- Registered `20261106-UX-50` (severity P2, status open, owner A, plan under WP-20.6) for unmeasured `< 15 min` figure in START-HERE.md.
- Registered `20261106-UX-51` (severity P1, status open, owner A, plan before WP-14.0a) for dependency review and Dependabot PR reconciliation.
- Added task `WP-13.14` to `docs/plans/gates.json` under `WP-13.requiredTaskIds`.
- Updated `docs/plans/P004-ux-remediation-work-packages.md` recording task WP-13.14, follow-up findings under WP-17, WP-20.6, and Pre-WP-14.0a.

---

## 6. Not Done (Tagged)

- Findings `20261106-UX-49`, `20261106-UX-50`, and `20261106-UX-51` are registered open as planned follow-ups, not fixed in this task. [not-started]
- Handover H014 not authored; awaiting owner sign-off at Gate G13. [not-started]
- Gate WP-13 remains open in `docs/plans/gates.json`. [not-started]

---

## 7. Changes to Earlier Reports

- Receipt A073 (`docs/execution-reports/A073-wp-1313-honest-start-here-runbook.md`): Updated Evidence SHA from `9221074` to `253c744` and added `9221074 -> 253c744` mapping to `scripts/historical-sha-map.json`.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A074
=== Validating Receipt A074-wp-1314-repair-web-merge-and-register-findings.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA verified as ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 253c744..HEAD (8 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A074-wp-1314-repair-web-merge-and-register-findings.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A074-wp-1314-repair-web-merge-and-register-findings.md.
```

---

## 9. Handover Decision

- Decision: REQUIRED (HO-R1)
- Rule(s): HO-R1
- Receipts since last handover: 16 (A059 through A074); work packages since: 1 (WP-13)
- Clean-boundary preconditions: Work Package 13 repair complete; Gate WP-13 remains open awaiting owner sign-off at Gate G13 before authoring handover document H014.
- Next action: Gate G13 sign-off. Do not merge anything and do not write H014 until owner sign-off.
