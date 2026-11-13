# A089 — WP-14.7 entry lifecycle hotfix

| Field | Value |
| --- | --- |
| Report ID | A089 |
| Date | 2026-11-10 |
| Author | A (Implementer) |
| Task ID | `WP-14.7` |
| Evidence SHA | c436424 |
| CI run | local verify (`pnpm verify` & `pnpm test:e2e`) green |

---

## 1. Scope

- [implemented] **Server-Side Private-Detail Scan Enforcement & Single Publish Path (`20261106-UX-57`):** Stopped `POST /api/entries` (`apps/api/src/routes/entries.ts`) from minting a signed `redactionPreviewToken` when saving `private` or `unlisted` entries so only `POST /api/entries/redaction-preview` issues preview tokens for unpublished content. Enforced `verifyRedactionPreviewToken` and `nda_confirmed` across `POST /api/entries`, `PUT /api/entries/:id`, and `POST /api/entries/:id/revisions` (on public entries when confidential warnings exist or a token is supplied). Removed the duplicate `#btn-publish-entry` (`Publish`) button from `apps/web/src/renderer.ts` and removed silent background auto-scanning in `ensureRedactionToken()` (`apps/web/src/client/commit-entry.ts`) so `#btn-open-publish-dialog` (`Publish…`) is the single publish path. Ordered revision creation (`POST /api/entries/:id/revisions`) before `PUT /api/entries/:id` when transitioning a non-public entry with edited body text.
- [implemented] **Working Undo with Real 30s Countdown from Status Line and Toast (`20261106-UX-04`):** Replaced duplicate `#btn-undo-action` IDs with distinct `#btn-undo-status-line` (in `#editor-status-line`), `#btn-undo-toast` (in `#editor-toast`), and `#btn-undo-action-banner` (in `#admin-undo-banner`) bound via `document.querySelectorAll('[data-undo-action="true"]')`, with a live 1-second countdown interval (`30s` down to `1s`). Wired Undo after **Unpublish** to re-verify the unchanged snapshot body and restore `public` state via `commitEntry('publish')`, and wired Undo after **Save draft** with changed body text to restore `previousCommittedBody` via `POST /api/entries/:id/revisions` and in `#entry-body`.
- [implemented] **Dynamic Pre-Flight Dialog Step Numbering (`20261106-UX-58`):** Added `updatePublishDialogStepNumbers(ndaVisible: boolean)` in `apps/web/src/client/publish-dialog.ts` and step heading attributes (`data-dialog-step-heading`) in `apps/web/src/renderer.ts` so visible headings read `1. Private-Detail Check`, `2. Who Can See It`, `3. What Happens Next` when `#publish-nda-section` is hidden and `1. Private-Detail Check`, `2. Confidentiality & NDA Confirmation`, `3. Who Can See It`, `4. What Happens Next` when `#publish-nda-section` is visible.
- [implemented] **End-to-End `Unlisted` Verification (`20261106-UX-59`):** Verified via API conformance (`wp14-7-publish-scan-and-unlisted.conformance.test.ts`) and Playwright E2E (`tests/e2e/wp14-7-hotfix.spec.ts`) that `unlisted` entries stay out of public lists (`GET /api/entries`, `/`, `/work`) and open by direct link (`GET /work/:slug`, `GET /api/entries/:slug`).

---

## 2. CI Evidence

- Failing tests committed first in `1d2bebb` (`test(wp-14.7): add failing API conformance and E2E tests for publish scan, dialog numbering, undo, and unlisted`) before implementation in `c436424`.
- Local verification (`pnpm verify` & `pnpm test:e2e`):
  - Unit, Conformance & P0 Regression Suites: **367/367 passed** across 44 files (including 2 new tests in `apps/api/src/conformance/wp14-7-publish-scan-and-unlisted.conformance.test.ts`).
  - Playwright End-to-End Suite: **81/81 passed** across 20 files (including 4 new tests in `tests/e2e/wp14-7-hotfix.spec.ts`).

---

## 3. Tests Added and Count Change

- Added `apps/api/src/conformance/wp14-7-publish-scan-and-unlisted.conformance.test.ts` (+2 conformance tests: 365 -> 367).
- Added `tests/e2e/wp14-7-hotfix.spec.ts` (+4 Playwright E2E tests: 77 -> 81).

---

## 4. Files Touched

- apps/api/src/auth/security.ts
- apps/api/src/conformance/wp14-7-publish-scan-and-unlisted.conformance.test.ts
- apps/api/src/routes/entries.ts
- apps/web/src/client/admin-entry.ts
- apps/web/src/client/commit-entry.ts
- apps/web/src/client/publish-dialog.ts
- apps/web/src/renderer.ts
- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A088-wp-14pre-c-ci-cost-control.md
- tests/e2e/redaction.spec.ts
- tests/e2e/wp11-navigation-and-states.spec.ts
- tests/e2e/wp11-publish-and-ask.spec.ts
- tests/e2e/wp14-7-hotfix.spec.ts
- tests/e2e/wp14-commit-entry.spec.ts
- tests/e2e/wp14-editor-feedback.spec.ts
- tests/e2e/wp14-state-date.spec.ts

---

## 5. Register and Backlog Changes

Register counts: 120 fixed, 9 partial, 46 open (P0: 1, P1: 25, P2: 20; Total: 175).
- `20261106-UX-04`: partial -> fixed (`tests/e2e/wp14-7-hotfix.spec.ts`)
- `20261106-UX-57`: open -> fixed (`apps/api/src/conformance/wp14-7-publish-scan-and-unlisted.conformance.test.ts`)
- `20261106-UX-58`: open -> fixed (`tests/e2e/wp14-7-hotfix.spec.ts`)
- `20261106-UX-59`: open -> fixed (`tests/e2e/wp14-7-hotfix.spec.ts`)

---

## 6. Not Done (Tagged)

- [not-started] Gate G14 Closing Report (`A090`): To be authored after `WP-14.7` PR is merged into `main`.

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A089
=== Validating Receipt A089-wp-147-entry-lifecycle-hotfix.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'c436424' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff b4a577c..c436424 (15 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A089-wp-147-entry-lifecycle-hotfix.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A089-wp-147-entry-lifecycle-hotfix.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 15 (A075 through A089); work packages since: 0 (WP-14 closing report A090 next)
- Clean-boundary preconditions: not met (Gate G14 closing report A090 pending)
- Next action: Author Gate G14 closing report `A090` and await owner Gate G14 sign-off
