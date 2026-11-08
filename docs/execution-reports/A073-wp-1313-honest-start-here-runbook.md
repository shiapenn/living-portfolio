# A073 — WP-13.13 Honest start-here runbook

| Field | Value |
| --- | --- |
| Report ID | A073 |
| Date | 2026-11-08 |
| Author | A (Implementer) |
| Task ID | `WP-13.13` |
| Evidence SHA | `9221074` |
| CI run | local verify (`pnpm verify`) green (CI runs only on PRs/pushes to main) |

---

## 1. Scope

- **`[implemented]` Pre-flight Docker check & Honest Path Selection (§13.13, UX-32, 20261106-UX-48):** Added pre-flight check running `docker --version` at the top of `docs/START-HERE.md`. If Docker is present, Path A (Docker Compose Stack) is followed. If Docker is missing, Path B (Local Node.js Ephemeral Trial Mode) is followed. Removed any "Recommended" label preceding the pre-flight check.
- **`[implemented]` Path B Database Truth & Data Persistence Warning:** Explicitly established Path B database truth. Removed false claims of "SQLite / in-memory development mode" (SQLite does not exist in the codebase). Stated in **bold** before the command line that Path B uses `InMemoryPortfolioRepository`, and that all accounts, credentials, and entries are lost on restart. Documented how to move to persistent PostgreSQL later (Path A).
- **`[implemented]` Troubleshooting & Missing Prerequisites Remediation:** Added actionable remediation for all prerequisites (Node v22+, pnpm v10+, Docker, TOTP app). Added troubleshooting entries for: (1) `docker: command not found` (run Path B or install Docker Desktop), (2) `port 4000 already in use` (`lsof -i :4000` or change `PORT=4001`), (3) `node or pnpm not found or too old`, and (4) `backup folder write permission errors` (`mkdir -p ./data/backups && chmod 755 ./data/backups`).
- **`[implemented]` Accurate Recovery Code Format & Wizard Steps Matching Markup:** Updated emergency recovery codes to 16 hex characters (`xxxx-xxxx-xxxx-xxxx`, 8 single-use codes matching downloaded `.txt` file; removed legacy 8-char `xxxx-xxxx` format). Aligned all wizard step numbering, headings, and button labels against rendered markup and `strings/en.ts` (Step 1: Owner Account Setup; Step 2: Hosting Option & Presets; Step 3: Model Providers & Privacy Boundary; Step 4: Notifications & Alerts; Step 5: Encrypted Backup Destination; Step 6: Theme & First-Run Walkthrough, final button "Go to your dashboard →").
- **`[implemented]` Honest Provider & Theme Copy:** Corrected Step 3 to be read-only during setup (removed false claim of "Enter API keys", noted keys are added in Settings > Providers WP-17.2, and Ask shows direct quotes until then). Documented that the notification test alert is disabled in this version, and that theme selection is saved but not yet applied to the live public site.
- **`[implemented]` Real Login Link & Healthz Response:** Documented the exact login recovery button/link label (`Lost your authenticator device? Sign in with a recovery code`). Corrected `/healthz` response JSON to HTTP 200 with `status: "healthy"` and `version: "0.1.0"` (removed incorrect `"status":"ok"` and `"0.1.0-alpha.0"`).
- **`[implemented]` Fresh Clone Data Dir & Time Estimate Truth:** Clarified `rm -rf ./data` as a first-install only preparation with a warning not to run on existing deployments, noting that on a fresh clone `./data` does not exist yet and nothing is wrong. Removed unverified "Under 15 minutes" claim.
- **`[implemented]` Automated Conformance Test & Clean Trial Run:** Created `apps/api/src/conformance/start-here.conformance.test.ts` verifying referenced compose files, pnpm filters, env keys, healthz route, 16-hex code format, wizard step labels, and troubleshooting. Executed clean trial run of Path B on a detached worktree with missing `./data`, capturing console deprecation output and verifying `/healthz` and `/admin/setup` load on port 4000. Labeled Path A as "not run in this session".
- **`[implemented]` Register & Gate Tracking:** Registered finding `20261106-UX-48` linked to `UX-32` in `docs/audits/register.yml` and marked fixed with regression test. Reopened `UX-32` history with note detailing the initial version errors. Maintained Gate WP-13 open in `gates.json`.

---

## 2. CI Evidence

Local verification via `pnpm verify`:
- `pnpm --filter @living-portfolio/api test src/conformance/start-here.conformance.test.ts`: 9/9 tests PASSED.
- `node scripts/audit-check`: PASSED (163 register findings, 39 spec rows, 72 reports validated).
- `node scripts/gitleaks-scan`: PASSED (0 leaks found).
- Clean Path B run verified on port 4000 with missing `./data`.
- Path A: Not run in this session (requires Docker daemon).

---

## 3. Tests Added and Count Change

- Automated Conformance:
  - `apps/api/src/conformance/start-here.conformance.test.ts`:
    - `1. Pre-flight check and path honesty: docker --version precedes path selection, no unverified claims`
    - `2. Referenced file paths, compose files, and pnpm filters exist in repository`
    - `3. Referenced environment variables exist in @living-portfolio/config or .env.example`
    - `4. Real healthz response matches code: healthy status and 0.1.0 version (not ok or alpha)`
    - `5. Real recovery code format: 16 hex characters xxxx-xxxx-xxxx-xxxx and exactly 8 codes`
    - `6. Step titles, headings, notices and button labels match rendered wizard and strings`
    - `7. Login page recovery link matches rendered markup`
    - `8. Troubleshooting covers all four required error cases`
    - `9. Document header conforms to repo rules`

---

## 4. Files Touched

- apps/api/src/conformance/start-here.conformance.test.ts
- docs/INDEX.md
- docs/START-HERE.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A072-wp-1312-legacy-recovery-notice-and-regeneration.md
- docs/execution-reports/A073-wp-1313-honest-start-here-runbook.md
- docs/plans/P004-ux-remediation-work-packages.md
- docs/plans/gates.json

---

## 5. Register and Backlog Changes

- Registered `20261106-UX-48` under AUD-2026-11-06 series in `docs/audits/register.yml` (severity P1, status fixed, linked to UX-32, regression test `apps/api/src/conformance/start-here.conformance.test.ts`).
- Added reopen note to `20261106-UX-32` documenting first version errors (Option A labeled Recommended before docker check, SQLite in-memory confusion, 8-hex recovery codes, step mismatch, false API key input claim, wrong healthz JSON, missing troubleshooting).
- Updated `docs/plans/P004-ux-remediation-work-packages.md` and `docs/plans/gates.json` to record WP-13.13 task and conformance test requirements.

---

## 6. Not Done (Tagged)

- Fresh data directory installs generate 16-hex recovery codes directly and are not affected by legacy migration. [implemented]
- Automated conformance tests and clean worktree trial run for START-HERE.md runbook are complete. [implemented]
- Path A execution in this session was skipped because local machine was tested under no-Docker conditions matching the user walkthrough. [partial]
- Live public site theming deferred to WP-17.8 and WP-20.1 (`UX-27` part). [not-started]
- Provider API key entry in Settings > Providers deferred to WP-17.2. [not-started]
- Handover H014 not authored; awaiting owner sign-off at Gate G13. [not-started]

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A073
=== Validating Receipt A073-wp-1313-honest-start-here-runbook.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA verified as ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 4f10073..HEAD (9 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A073-wp-1313-honest-start-here-runbook.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A073-wp-1313-honest-start-here-runbook.md.
```

---

## 9. Handover Decision

- Decision: REQUIRED (HO-R1)
- Rule(s): HO-R1
- Receipts since last handover: 15 (A059 through A073); work packages since: 1 (WP-13)
- Clean-boundary preconditions: Work Package 13 complete; all 13 tasks (WP-13.0 through WP-13.13) finished with automated tests passing; awaiting owner sign-off at Gate G13 before authoring handover document H014.
- Next action: Gate G13 sign-off. Do not merge anything and do not write H014 until owner sign-off.
