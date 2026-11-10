# A087 — WP-14 entry lifecycle integrity gate closure

| Field | Value |
| --- | --- |
| Report ID | A087 |
| Date | 2026-11-10 |
| Author | A (Implementer) |
| Task ID | `WP-14` |
| Evidence SHA | c43b846 |
| CI run | local verify (`pnpm verify`) green |

---

## 1. Scope

Work Package 14 (Gate G14 Entry Lifecycle Integrity) full closure and certification per P004 and Audit Report §7.5.

All 8 tasks delivered across dedicated task branches, verified locally and in CI, and merged into `main` with merge commits:
- [implemented] **WP-14.0a (Editor Result Visibility, UX-43):** PR #95 (merge commit `881dbaf`, receipt A078). Inlined `#save-status` message container with `role="status"` and `aria-live="polite"` within viewport directly adjacent to action buttons; automatic focus relocation and list refresh upon Save draft, Publish, Unpublish, and Delete without requiring page scroll.
- [implemented] **WP-14.0 (Modular Client Bundling, Foundations):** PR #97 (merge commit `ce7dabc`, receipt A080). Bundled client modular architecture in `apps/web/package.json` (`dist/client/admin-entry.js`) with esbuild bundling pipeline and decoupled TypeScript entrypoint.
- [implemented] **WP-14.1 (`commitEntry` State Machine, UX-01, UX-02, UX-03, UX-04, CP-12):** PR #98 (merge commit `49f7ada`, receipt A081). Replaced 220+ lines of ad-hoc fetch handling in `renderer.ts` with formal `commitEntry(intent: 'save' | 'publish' | 'unlist' | 'unpublish')` state machine in `apps/web/src/client/commit-entry.ts`. Save draft retains existing visibility; Publish uses `PUT /entries/:id` for existing entries with token and NDA flag; Unlist and Unpublish are separate intents; surfaces specific 409/400 API error messages.
- [implemented] **WP-14.2 (State & Date Correctness, UX-10, UX-11, UX-22):** PR #99 (merge commit `e888a6f`, receipt A082). Rendered `#chip-current-state` displaying live Draft, Public, or Unlisted status; defaulted date field to today; validated dates with inline error without throwing RangeError; added temporal confidence selector (Exact, Range with end date, Estimated).
- [implemented] **WP-14.3 (Publish Dialog & Auto-Scan, UX-03, UX-13):** PR #100 (merge commit `69f24ff`, receipt A083). Auto-running pre-flight redaction scan upon opening publish modal with accessible dialog role, focus trap, and Escape handling; NDA acknowledgment gate; non-destructive mask preview; toast with "View page" and working "Unpublish" action.
- [implemented] **WP-14.4 (Draft Buffer & Autosave, UX-04, UX-43):** PR #101 (merge commit `27869bb`, receipt A084). Debounced IndexedDB writing buffer (`apps/web/src/client/draft-buffer.ts`) preventing writing loss; `#draft-restore-notice` on reopen; `beforeunload` guard when dirty; `#admin-offline-banner` indicating connectivity state.
- [implemented] **WP-14.5 (Calibration Defaults per Spec §11, UX-08):** PR #102 (merge commit `e1c179d`, receipt A085). Configured suggestion thresholds and routing calibration OFF by default on fresh instances; topology audit and scoped-constraint mining remain proposal-only; raised minimum-sample gate to 20 samples; replaced freeze checkbox with 4 mechanism switches displaying sample gate (min 20) and step limits (±0.05); mirrored spec `calibration:` block in `packages/config`.
- [implemented] **WP-14.6 (Quick Visual Repairs & CSS Check, UI-01, UI-03):** PR #103 (merge commit `f53656f`, receipt A086). Defined missing design tokens (`--surface-overlay`, `--surface-sunken`, `--radius-control`, `--radius-chip`, `--radius-card`, `--status-success-*`, `--status-warn-*`, `--status-danger-*`, `--role-challenge`); restored background opacity on redaction drawer and publish dialog; fixed invalid `flex-wrap:gap` declarations; added `scripts/verify-css-variables` verification gate to `pnpm verify`.

---

## 2. CI Evidence

Local verification via `pnpm verify` (14/14 steps passed):
- Step 1: Build & Typecheck (`turbo run build` across 8 packages) PASSED.
- Step 2: Environment Sync & Drift Check (OSR-03) PASSED.
- Step 3: OpenAPI Specification & Contract Drift Check (OSR-12) PASSED.
- Step 4: Frontend & Backend Decoupling Rules (OSR-13) PASSED.
- Step 5: Hard-Code Inventory Scan (OSR-01) PASSED.
- Step 6: Developer Certificate of Origin (OSR-07 dco) PASSED.
- Step 7: Documentation Identity & Registry Check (IAHP PROC-1) PASSED (124 docs).
- Step 8: Handover Protocol Conformance (IAHP HO-1) PASSED.
- Step 9: Audit Governance & Conformance Check (DR-AUD-001) PASSED.
- Step 10: CSS Custom Property Definition Check (WP-14.6, UI-01, UI-03) PASSED (0 undefined variables).
- Step 11: SARIF Static Analysis Baseline Gate PASSED.
- Step 12: Gitleaks Secret Scan PASSED (0 leaks).
- Step 13: GitHub Action SHA Pins Verification (CI fix 3a) PASSED (38 pins).
- Step 14: Unit, Conformance & P0 Regression Suites PASSED (365/365 tests in 43 files).

Playwright End-to-End Suite (`pnpm test:e2e`):
- PASSED (77/77 tests in 19 files, 100% green).

GitHub Actions CI Status:
- All task PRs (#95, #97, #98, #99, #100, #101, #102, #103) passed full GitHub Actions CI matrices prior to merge.

---

## 3. Tests Added and Count Change

Net test additions across WP-14:
- `tests/e2e/wp14-editor-feedback.spec.ts` (1 test)
- `tests/e2e/wp14-client-bundling.spec.ts` (1 test)
- `tests/e2e/wp14-commit-entry.spec.ts` (1 test)
- `tests/e2e/wp14-state-date.spec.ts` (1 test)
- `tests/e2e/wp14-publish-dialog.spec.ts` (1 test)
- `tests/e2e/wp14-draft-buffer.spec.ts` (1 test)
- `tests/e2e/wp14-calibration-defaults.spec.ts` (1 test)
- `apps/api/src/conformance/calibration-defaults.conformance.test.ts` (3 tests)
- `scripts/verify-css-variables` conformance gate script

Current test totals:
- Unit & Conformance tests: 365 tests across 43 files.
- Playwright E2E tests: 77 tests across 19 files.

---

## 4. Files Touched

- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A086-wp-146-quick-visual-repairs-and-css-check.md
- docs/plans/gates.json

---

## 5. Register and Backlog Changes

Register counts (from `docs/audits/register.yml` verified by `node scripts/handover-facts`):
- Fixed: 117
- Partial: 9
- Open: 43 (P0: 1, P1: 24, P2: 18)
- Total: 169

Remediated Findings:
- `20261106-UX-01`: open -> fixed (WP-14.1, PR #98)
- `20261106-UX-02`: open -> fixed (WP-14.1, PR #98)
- `20261106-UX-03`: open -> fixed (WP-14.1 & WP-14.3, PR #98, PR #100)
- `20261106-UX-04`: open -> fixed (WP-14.1 & WP-14.4, PR #98, PR #101)
- `20261106-UX-08`: open -> fixed (WP-14.5, PR #102)
- `20261106-UX-10`: open -> fixed (WP-14.2, PR #99)
- `20261106-UX-11`: open -> fixed (WP-14.2, PR #99)
- `20261106-UX-22`: open -> fixed (WP-14.2, PR #99)
- `20261106-UI-01`: open -> partial (WP-14.6, PR #103)
- `20261106-UI-03`: open -> partial (WP-14.6, PR #103)

Only 1 open P0 finding remains across the entire repository: `20261106-UX-44` (Time travel revision filtering, scheduled for WP-19).

---

## 6. Not Done (Tagged)

- [not-started] Handover H015: Scheduled to be authored upon user signoff of Gate G14.
- [not-started] WP-15 Foundations & Token System (Milestone v0.2 / Gate G15): DOM-id baseline, complete token tiers, UI primitives gallery, dialog/drawer/toast components, mechanical renderer split, copy and help catalogues.

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A087
=== Validating Receipt A087-wp-14-entry-lifecycle-integrity-gate-closure.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'c43b846' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 1759ab2..c43b846 (5 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A087-wp-14-entry-lifecycle-integrity-gate-closure.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A087-wp-14-entry-lifecycle-integrity-gate-closure.md.
```

---

## 9. Handover Decision

- Decision: REQUIRED
- Rule(s): HO-R1
- Receipts since last handover: 13 (A075, A076, A077, A078, A079, A080, A081, A082, A083, A084, A085, A086, A087); work packages since: 1 (WP-14)
- Clean-boundary preconditions: met
- Next action: Handover H015 upon user signoff of Gate G14

---

## 10. Manual Acceptance Script (Path B on Port 4000 from Fresh Clone)

To verify the complete WP-14 lifecycle on a fresh machine without Docker:

```bash
# 1. Fresh clone
git clone https://github.com/shiapenn/living-portfolio.git test-lp-wp14
cd test-lp-wp14

# 2. Setup environment and install dependencies
cp .env.example .env
pnpm install
pnpm build

# 3. Start single-process server on port 4000 (Path B)
PORT=4000 ENABLE_BUNDLED_WEB=true pnpm --filter @living-portfolio/api dev
```

### Verification Checklist:
1. Navigate to `http://localhost:4000/admin`.
2. If first-run, complete the 6-step setup wizard; you are redirected to `/admin` authenticated with session and CSRF cookie.
3. In the entry editor:
   - Notice `#chip-current-state` renders "Draft" state chip.
   - Notice the date field automatically defaults to today's date (`YYYY-MM-DD`).
   - Notice the temporal confidence selector provides Exact, Range (with range end date), and Estimated options.
4. Test Save Draft:
   - Enter title and draft body text.
   - Click "Save draft".
   - Notice the result is reported in an inline status message adjacent to the action button within the viewport (no page scrolling needed).
   - `#chip-current-state` remains "Draft" (existing state preserved).
5. Test Publish Dialog & Scan:
   - Click "Publish".
   - An accessible modal dialog appears with pre-flight redaction scan results.
   - Confirming publish updates `#chip-current-state` to "Public" and surfaces toast with "View page" and "Unpublish".
6. Test Autosave Buffer:
   - Make uncommitted edits. Notice the beforeunload guard warns on navigation.
   - Reopen editor: `#draft-restore-notice` offers one-click restore of unsaved draft buffer.
7. Test Settings & Calibration:
   - Navigate to Settings -> Routing / Calibration.
   - Confirm suggestion thresholds and routing calibration default to OFF.
   - Confirm 4 distinct mechanism switches show the 20-sample minimum gate and step limits.
