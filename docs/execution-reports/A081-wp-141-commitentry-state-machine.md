# A081 — WP-14.1 commitEntry state machine

| Field | Value |
| --- | --- |
| Report ID | A081 |
| Date | 2026-11-10 |
| Author | A (Implementer) |
| Task ID | `WP-14.1` |
| Evidence SHA | 10b163d |
| CI run | local verify (`pnpm verify`) green |

---

## 1. Scope

- [implemented] `commitEntry` state machine: Created `apps/web/src/client/commit-entry.ts` formalizing `commitEntry(intent: 'save' | 'publish' | 'unlist' | 'unpublish')` per Spec §2.1.2.
- [implemented] Save preserves visibility (UX-02): `commitEntry('save')` preserves current visibility rather than hardcoding `'private'`, preventing silent unpublication of published entries.
- [implemented] Publish of saved entry (UX-01): `commitEntry('publish')` routes saved entries through `PUT /api/entries/:id` with signed redaction token and NDA confirmation, avoiding 409 duplicate slug errors.
- [implemented] Unlist intent (UX-03): Added explicit `unlist` intent updating entry visibility to `unlisted` without requiring a public redaction token.
- [implemented] Unpublish with Undo (UX-04): `commitEntry('unpublish')` displays an Undo (30s) notification and banner. Clicking Undo re-enters `commitEntry('publish')` with a signed preview token, restoring public visibility.
- [implemented] Conflict error mapping (CP-12): Maps HTTP 409 slug conflicts and HTTP 400 validation failures to specific messages from the API payload.
- [implemented] Stale token invalidation: Body input events clear `activeEntryState.previewToken` and the `#entry-preview-token` input, guarding against stale-token publishing.
- [implemented] Scripted journey E2E suite: Authored `tests/e2e/wp14-commit-entry.spec.ts` verifying the scripted lifecycle journey (new -> save -> publish -> edit -> save stays public -> unpublish -> undo restores public -> unlist), 409 duplicate slug mapping, and stale-token invalidation.

---

## 2. CI Evidence

Local verification via `pnpm verify`:
- Build & typecheck (`turbo run build`): PASSED across all 8 packages.
- Conformance gates (OSR-01, OSR-03, OSR-07, OSR-12, OSR-13, IAHP PROC-1, IAHP HO-1, DR-AUD-001): PASSED.
- Unit, conformance, & P0 regression suites: PASSED (362/362 tests in 42 files).
- Playwright E2E suite: PASSED (68/68 tests in 15 files, including new `wp14-commit-entry.spec.ts`).
- Gitleaks secret scan: PASSED (0 leaks).

Note: The GitHub Actions Dependency Review workflow (`.github/workflows/deps.yml`) is non-gating on this repository (`continue-on-error: true`).

---

## 3. Tests Added and Count Change

- Added E2E regression test `tests/e2e/wp14-commit-entry.spec.ts` (3 tests, net +3 E2E tests, total 68 E2E tests across 15 files).
- Unit and conformance test suites: 362 tests across 42 files in `apps/api` (unchanged).

---

## 4. Files Touched

- apps/web/src/client/admin-entry.ts
- apps/web/src/client/commit-entry.ts
- apps/web/src/renderer.ts
- docs/INDEX.md
- docs/doc-registry.json
- docs/execution-reports/A080-wp-140-client-bundling-and-entry-handler-migration.md
- tests/e2e/wp14-commit-entry.spec.ts

---

## 5. Register and Backlog Changes

- Register counts: 109 fixed, 7 partial, 53 open (total 169 findings, unchanged pending Gate G14 register update).
- Closes technical debt for UX-01, UX-02, UX-03, UX-04, and CP-12.

---

## 6. Not Done (Tagged)

- [not-started] WP-14.2 State and date correctness: Render state chip and date handling (UX-10, UX-11, UX-22).
- [not-started] WP-14.3 Publish dialog: Pre-flight checklist with auto-scan, NDA step, and single publish action (UX-03, UX-13).
- [not-started] WP-14.4 Draft buffer & autosave: Local draft caching and unsaved exit guard (2.1.3).
- [not-started] WP-14.5 Calibration defaults: Mechanism switches and minimum-sample gates (UX-08).
- [not-started] WP-14.6 Quick visual repairs: Tokens, CSS variables check, flex-wrap gap fix (UI-01, UI-03).

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A081
=== Validating Receipt A081-wp-141-commitentry-state-machine.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA verified.
✓ [FILES-TOUCHED] Matches git diff.
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified.

🎉 All receipt checks PASSED for A081-wp-141-commitentry-state-machine.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 7 (A075, A076, A077, A078, A079, A080, A081); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-14.2
