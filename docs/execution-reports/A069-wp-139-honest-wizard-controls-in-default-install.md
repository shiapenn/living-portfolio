# A069 — WP-13.9 Honest wizard controls in default install

| Field | Value |
| --- | --- |
| Report ID | A069 |
| Date | 2026-11-07 |
| Author | A (Implementer) |
| Task ID | `WP-13.9` |
| Evidence SHA | `6e36374` |
| CI run | local (vitest 13/13 passing, playwright 17/17 passing) |

---

## 1. Scope

Remediate setup wizard controls so no live wizard control fails in a default install, addressing owner walkthrough feedback per UX-33, UX-09, and CP-01:
- 1. **Step 3 (Providers):** Keep table read-only; remove button-like styling and hover interactions from data-class badges; add visible explanatory sentence: `"Keys are added later in Settings > Providers; until then Ask shows direct quotes from entries."` Register finding `20261106-UX-09` as `partial`, to be completed in WP-17.2. [implemented]
- 2. **Step 4 (Notifications):** Disable `"Test Delivery Notification"` button with visible plain reason `"Test alerts aren't available in this version yet."` Prevent user typing into the target input from enabling the button. Eliminate 501 / `"Not Implemented"` / HTTP wording across UI and API endpoints. Full delivery adapter deferred to WP-17.2. [implemented]
- 3. **Step 5 (Backups):** Move default backup directory under application data directory (`./data/backups` or `process.env.BACKUP_DIR` / `process.env.DATA_DIR`), set from configuration, not code. In `POST /api/settings/backups/run-drill`, map `EACCES`, `ENOENT`, and `ENOSPC` errors to honest plain explanation: `"The app can't write to that folder. Choose another folder or fix its permissions."` Log raw stack/errno server-side only. Default drill with `./data/backups` succeeds out of the box (`✓ Backup created & restore verification drill succeeded!`). [implemented]
- 4. **Step 6 (Theme):** Add visible explanation: `"Applied to your public site after setup. Change it any time in Theme."` Live preview and dynamic public compilation belong to WP-17.8 and WP-20.1. [implemented]
- 5. **E2E & Conformance Verification:** Add one Playwright test per wizard step (Steps 1 through 6) asserting visible state, plus a suite check ensuring no wizard step displays an enabled control whose only result is an error. [implemented]

---

## 2. CI Evidence

- `pnpm --filter @living-portfolio/api test src/conformance/wp13-auth.conformance.test.ts`: 13 passing tests.
- `pnpm --filter @living-portfolio/web test`: 54 passing tests.
- `npx playwright test tests/e2e/auth.spec.ts`: 17 passing tests.
- `node scripts/audit-check`: All governance checks PASSED with `TRIAGE: PROCEED`.

---

## 3. Tests Added and Count Change

- `apps/api/src/conformance/wp13-auth.conformance.test.ts`:
  - `Step 3: Providers table is read-only, badges lack button styles, and keys sentence is present`
  - `Step 4: Notifications test button is disabled with visible plain explanation and no HTTP wording`
  - `Step 5: Default backup directory is under app data dir, and EACCES/ENOENT/ENOSPC map to plain message`
  - `Step 6: Theme choice explains post-setup application`
- `tests/e2e/auth.spec.ts`:
  - `1. First-run setup wizard: Step 1 Owner Account Setup & Credentials (UX-26, UX-30)`
  - `2. First-run setup wizard: Step 2 Hosting options visible state (UX-27)`
  - `3. First-run setup wizard: Step 3 Model Providers read-only visible state (UX-09)`
  - `4. First-run setup wizard: Step 4 Notifications test disabled with visible reason (UX-33)`
  - `5. First-run setup wizard: Step 5 Backups default directory and error mapping (UX-33, CP-01)`
  - `6. First-run setup wizard: Step 6 Theme selection visible state and post-setup copy`
  - `7. First-run setup wizard: No wizard step shows an enabled control whose only result is an error`

---

## 4. Files Touched

Matches git diff `0064a20..6e36374`:
- `apps/api/src/conformance/wp13-auth.conformance.test.ts`
- `apps/api/src/routes/settings.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/strings/en.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A068-wp-138-recovery-code-sign-in-and-normalisation.md`
- `docs/plans/gates.json`
- `tests/e2e/auth.spec.ts`

---

## 5. Register and Backlog Changes

- `20261106-UX-09`: Status updated to `partial`. Step 3 stays read-only; button-like badge styling removed; explainer sentence added. Full provider configuration and live API key validation scheduled for WP-17.2.
- `20261106-UX-33`: Status updated to `partial`. Notification test button disabled with visible reason; backup default directory moved under app data path; disk write errors cleanly mapped without HTTP or stack trace leaks. Live notification adapters and backup management scheduled for WP-17.2 / WP-17.3.
- `20261106-CP-01`: Status updated to `partial`. Wizard controls eliminated 501 / "Not Implemented" and HTTP jargon. Full copy sweep scheduled for WP-20.4.

---

## 6. Not Done (Tagged)

None. All deliverables for WP-13.9 are complete. Live notification channel delivery adapters belong to WP-17.2, and dynamic theme compilation belongs to WP-17.8 and WP-20.1.

---

## 7. Changes to Earlier Reports

- `A068`: Section 9 updated handover decision from `NOT REQUIRED` to `RECOMMENDED` (`HO-R3`) in compliance with autonomous triage rules (10 receipts since last handover).

---

## 8. Receipt Gate Self-Validation

```
=== Validating Receipt A069-wp-139-honest-wizard-controls-in-default-install.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '6e36374' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff b66db2f..6e36374 (8 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A069-wp-139-honest-wizard-controls-in-default-install.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A069-wp-139-honest-wizard-controls-in-default-install.md.
```

---

## 9. Handover Decision

- Decision: REQUIRED (HO-R1)
- Rule(s): HO-R1
- Receipts since last handover: 11 (A059 through A069); work packages since: 1 (WP-13)
- Clean-boundary preconditions: Work Package 13 complete; awaiting user sign-off at Gate G13 before authoring handover document H014.
- Next action: Stop at Gate G13, present closing verification and GitHub fresh-clone check to owner. Author H014 only after explicit owner sign-off.
