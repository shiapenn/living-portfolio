# A091 — WP-14.8 scan token binding and single-use

| Field | Value |
| --- | --- |
| Report ID | A091 |
| Date | 2026-11-13 |
| Author | A (Implementer) |
| Task ID | `WP-14.8` |
| Evidence SHA | deae4e4 |
| CI run | local verify (`pnpm verify` & `pnpm test:e2e`) green |

---

## 1. Scope

- [implemented] **Task 0 (a) Server Scan Approval Token Payload Verification (`apps/api/src/auth/security.ts`):** Confirmed and tested what `issueRedactionPreviewToken()` encodes inside `RedactionPreviewTokenPayload`: `jti` (16-byte random hex nonce for single-use identification), `entryId` (exact entry ID or `'draft'` for unsaved drafts), `bodyHash` (`sha256Hex(bodyMd)`), `scanHash` (`sha256Hex(JSON.stringify(warnings))`), `warningCount` (`warnings.length`), and `exp` (`Date.now() + ttlMs`, default 15 minutes), signed with HMAC-SHA256 (`base64url(payload).base64url(sig)`).
- [implemented] **Task 0 (b) Strict Binding Across Body, Entry ID, Expiry, and Unpublish -> Edit -> Publish (`20261106-UX-57`):** Removed the `isDraftMatch` wildcard fallback in `AuthManager.verifyRedactionPreviewToken()` (`apps/api/src/auth/security.ts` L621–626) which previously allowed a token minted for saved Entry A to be accepted on `POST /api/entries` (`expected.entryId === 'draft'`) or a `'draft'` token to be accepted on `PUT /api/entries/:id` for an existing entry. Updated `runRedactionCheck()` in `apps/web/src/renderer.ts` (L3434–3442) to pass `entryId` from `#entry-id` when scanning an existing entry. Verified by automated conformance test that a token minted for body A is rejected for body B, for a different entry (including saved-entry vs new-draft cross-use), after expiry (`Date.now() > payload.exp`), and after unpublish -> edit -> publish.
- [implemented] **Task 0 (c) Single-Use Non-Reusability After Consumption (`20261106-UX-57`):** Added `consumedPreviewTokens` tracking in `AuthManager` (`apps/api/src/auth/security.ts`) and two-phase verification (`consume: false` before NDA gate check, `consume: true` once all publish gates pass in `POST /api/entries`, `PUT /api/entries/:id`, and `POST /api/entries/:id/revisions` in `apps/api/src/routes/entries.ts`). Once a token is used to publish an entry, any subsequent attempt to reuse the same token is rejected with HTTP 400 (`Redaction preview token has already been used and cannot be reused`).

---

## 2. CI Evidence

- Failing conformance test committed first in `12833da` (`test(wp-14.8): add conformance test for scan approval token binding and single-use consumption`) before the fix in `deae4e4` (`fix(wp-14.8): enforce strict entryId binding and single-use consumption on verifyRedactionPreviewToken`).
- Local verification (`pnpm verify` & `pnpm test:e2e` — `local output`):
  - Unit & Conformance Suites: **368/368 passed** across 44 test files in `apps/api` (`computed from the above`: 367 baseline + 1 new conformance test in `apps/api/src/conformance/wp14-7-publish-scan-and-unlisted.conformance.test.ts`).
  - Playwright End-to-End Suite: **81/81 passed** across 20 files.

---

## 3. Tests Added and Count Change

- Added `WP-14.8 / Task 0: verifies scan approval token payload encoding (a), strict binding across body, entryId, expiry, and unpublish->edit->publish (b), and single-use non-reusability (c) (UX-57)` in `apps/api/src/conformance/wp14-7-publish-scan-and-unlisted.conformance.test.ts` (+1 conformance test: 367 -> 368 total unit/conformance tests in `apps/api`).

---

## 4. Files Touched

- apps/api/src/auth/security.ts
- apps/api/src/conformance/wp14-7-publish-scan-and-unlisted.conformance.test.ts
- apps/api/src/routes/entries.ts
- apps/web/src/renderer.ts
- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A090-wp-14-entry-lifecycle-integrity-gate-closure.md
- docs/handovers/H015-wp-14-entry-lifecycle-integrity-gate-closure.md
- docs/plans/P004-ux-remediation-work-packages.md
- docs/plans/gates.json
- scripts/audit-check
- scripts/handover-verify

---

## 5. Register and Backlog Changes

Register counts: 118 fixed, 11 partial, 55 open (P0: 1, P1: 31, P2: 23; Total: 184).
- `20261106-UX-57`: `fixed -> partial -> fixed` (reopened as `partial` during Task 0 / `WP-14.8` when testing cross-entry `'draft'` wildcard and token replay, and returned to `fixed` with `apps/api/src/conformance/wp14-7-publish-scan-and-unlisted.conformance.test.ts`).

---

## 6. Not Done (Tagged)

- [not-started] `WP-15.0`: DOM-id and string baseline snapshot (`scripts/snapshot-dom-ids`) and deferred `zod` 4 (`UX-53`) and `vitest` 4 (`UX-54`) migrations.

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A091
=== Validating Receipt A091-wp-148-scan-token-binding-and-single-use.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'deae4e4' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 70f5676..deae4e4 (13 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A091-wp-148-scan-token-binding-and-single-use.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A091-wp-148-scan-token-binding-and-single-use.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 1 (A091 since H015); work packages since: 0
- Clean-boundary preconditions: not met (WP-15 in progress)
- Next action: Proceed with `WP-15.0` (DOM-id baseline snapshot script and `UX-53`/`UX-54` dependency migrations)
