# A080 — WP-14.0 client bundling and entry handler migration

| Field | Value |
| --- | --- |
| Report ID | A080 |
| Date | 2026-11-10 |
| Author | A (Implementer) |
| Task ID | `WP-14.0` |
| Evidence SHA | 0d02302 |
| CI run | local verify (`pnpm verify`) green |

---

## 1. Scope

- [implemented] Client Bundling Pipeline: Added esbuild client bundle step in `apps/web/package.json` (`build:client` script targeting `src/client/admin-entry.ts` into `dist/client/admin-entry.js`).
- [implemented] Modular Client Entry Handler: Created typed ESM module `apps/web/src/client/admin-entry.ts` handling draft creation, save, unpublish, deletion, inline feedback, and list refresh.
- [implemented] Asset Route & CSP Nonce Support: Mounted `/assets/client/:filename` route in `apps/web/src/app.ts` serving compiled bundles. Extended `renderLayout` with `options.clientScript` support attaching CSP nonce.
- [implemented] Workspace Migration: Replaced inline entry-handler script block in `renderAdminWorkspacePage` with modular client bundle asset.
- [implemented] E2E Verification Suite: Authored `tests/e2e/wp14-client-bundling.spec.ts` asserting bundle asset HTTP 200 delivery, javascript MIME type, CSP compliance, and operational authoring handlers.

---

## 2. CI Evidence

Local verification via `pnpm verify`:
- Build & typecheck (`turbo run build`): PASSED across all 8 packages.
- Conformance gates (OSR-01, OSR-03, OSR-07, OSR-12, OSR-13, IAHP PROC-1, IAHP HO-1, DR-AUD-001): PASSED.
- Unit, conformance, & P0 regression suites: PASSED (362/362 tests in 42 files).
- Playwright E2E suite: PASSED (65/65 tests in 14 files, including new `wp14-client-bundling.spec.ts`).
- Gitleaks secret scan: PASSED (0 leaks).

Note: The GitHub Actions Dependency Review workflow (`.github/workflows/deps.yml`) is non-gating on this repository (`continue-on-error: true`).

---

## 3. Tests Added and Count Change

- Added E2E regression test `tests/e2e/wp14-client-bundling.spec.ts` (2 tests, net +2 E2E tests, total 65 E2E tests across 14 files).
- Unit and conformance test suites: 362 tests across 42 files in `apps/api` (unchanged).

---

## 4. Files Touched

- apps/web/package.json
- apps/web/src/app.ts
- apps/web/src/client/admin-entry.ts
- apps/web/src/renderer.ts
- docs/INDEX.md
- docs/doc-registry.json
- docs/execution-reports/A079-wp-140a-feedback-corrections-and-error-coverage.md
- pnpm-lock.yaml
- tests/e2e/wp14-client-bundling.spec.ts

---

## 5. Register and Backlog Changes

- Register counts: 109 fixed, 7 partial, 53 open (total 169 findings, unchanged).
- Prerequisite for `commitEntry` state machine (WP-14.1) completed.

---

## 6. Not Done (Tagged)

- [not-started] WP-14.1 commitEntry state machine: Formalize `commitEntry` state machine (UX-01, UX-02, UX-03, UX-04).
- [not-started] WP-14.2 State and date correctness: Render state chip and date handling (UX-10, UX-11, UX-22).

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A080
=== Validating Receipt A080-wp-140-client-bundling-and-entry-handler-migration.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '0d02302' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 7976977..0d02302 (9 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A080-wp-140-client-bundling-and-entry-handler-migration.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A080-wp-140-client-bundling-and-entry-handler-migration.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 6 (A075, A076, A077, A078, A079, A080); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-14.1
