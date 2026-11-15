# A103 — g15-register-new-findings

| Field | Value |
| --- | --- |
| Report ID | A103 |
| Date | 2026-11-15 |
| Author | A (Implementer) |
| Task ID | `G15-review` (owner contact-sheet review findings registration) |
| Evidence SHA | `f812906` |
| CI run | Pending push to `docs/g15-register-new-findings` |

---

## 1. Scope

Registered five findings from the owner's Gate G15 contact-sheet review in `docs/audits/register.yml` (`status: open`, none fixed yet; Gate G15 remains open) and planned them in `docs/plans/P004-ux-remediation-work-packages.md`:

1. `[implemented]` `20261106-UX-91` (keeps `20261106-UX-61` `partial`; `D-WORKSPACE`) → `WP-16.1` first task (shell swap only, content untouched: `import`/`settings` use admin shell; `setup`/`login` use minimal auth shell; remove duplicated "Back to Workspace" buttons; same theme icon everywhere; extend `verify-ui-guards` with deadline allowlist).
2. `[implemented]` `20261106-UX-92` → `WP-16.4` (below 768 px, collapse Entries list into `Entries (n)` selector/drawer with editor first; test 20 entries at 320 px: editor title visible within 400 px of top).
3. `[implemented]` `20261106-UX-93` → `WP-16.4` (label unsaved new entry placeholder clearly e.g. `New, unsaved` and exclude from entry count; test abandon, reload, save).
4. `[implemented]` `20261106-UX-94` → `WP-16.1` (320 px legacy pages public header 3-row wrap and setup wizard step label collision/clipping; resolved by shell swap + setup stepper collapsing to `Step 1 of 6: Account` below 768 px).
5. `[implemented]` `20261106-UX-95` → `WP-17.1` and `WP-17.8` (`D-CONTRACT-1` & `D-HELP`: replace raw hex inputs and internal/spec jargon in `/admin/settings`).

---

## 2. CI Evidence

- `pnpm verify`: pending execution.

---

## 3. Tests Added and Count Change

- Added: **None** (0 tests added; documentation and register update only).
- Existing tests changed or removed: **None** (0 existing tests modified or removed).

---

## 4. Files Touched

- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/doc-registry.json`
- `docs/execution-reports/A102-wp-156-ui-contract-and-budget-guards.md`
- `docs/plans/P004-ux-remediation-work-packages.md`
- `docs/plans/gates.json`

---

## 5. Register and Backlog Changes

- Updated `20261106-UX-61` in `docs/audits/register.yml` to `status: partial` (noting `/admin` uses the slim admin header while `setup`, `login`, `import`, `settings` still use the public header).
- Appended `20261106-UX-91`..`20261106-UX-95` (`status: open`) in `docs/audits/register.yml` and mapped them into `WP-16.1`, `WP-16.4`, `WP-17.1`, and `WP-17.8` in `docs/plans/P004-ux-remediation-work-packages.md`.

---

## 6. Not Done (Tagged)

- `[not-started]` Fixing `20261106-UX-91`..`20261106-UX-95` (explicitly deferred to `WP-16`/`WP-17` per owner instruction; Gate G15 remains open).
- `[not-started]` Closing Gate G15 in `docs/plans/gates.json` and writing `H016` (held per owner instruction).

---

## 7. Changes to Earlier Reports

- None.

---

## 8. Receipt Gate Self-Validation
```
$ node scripts/receipt-check A103
=== Validating Receipt A103-g15-register-new-findings.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'f812906' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff db36680..f812906 (6 files verified).
✓ [SECTION-8-CHECK] Verbatim passing output verified.

All receipt checks PASSED
```

---

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 87 (A017..A103)
- Clean-boundary preconditions: met
- Next action: complete Gate G15 reporting items and stop at Gate G15.
