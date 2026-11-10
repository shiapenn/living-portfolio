# A079 — WP-14.0a feedback corrections and error coverage

| Field | Value |
| --- | --- |
| Report ID | A079 |
| Date | 2026-11-10 |
| Author | A (Implementer) |
| Task ID | `WP-14.corrections` |
| Evidence SHA | 7976977 |
| CI run | local verify (`pnpm verify`) green |

---

## 1. Scope

- [implemented] Playwright Error Case Test: Added test case in `tests/e2e/wp14-editor-feedback.spec.ts` asserting that an empty title on Save draft results in an inline error status line in `#editor-status-line` inside the viewport without scrolling, with polite assistive technology announcement (`role="status"` / `aria-live="polite"`).
- [implemented] Zod Advisory Quoting: Quoted published Zod security advisory `GHSA-mrhx-c7xc-m3w5` / `CVE-2023-54404` exactly ("Zod can exhaust memory while validating oversized constrained collections", vulnerable range `< 4.6.6`, first patched version `4.6.6`) in `docs/audits/register.yml` under finding `20261106-UX-53`.
- [implemented] Documentation Port Reconciliation: Confirmed Path B runs via `PORT=4000 ENABLE_BUNDLED_WEB=true pnpm --filter @living-portfolio/api dev` on port 4000 as defined in `docs/START-HERE.md`; corrected legacy port 3000 reverse proxy examples in `docs/self-hosting.md` to reference port 4000. Removed section comment leak in `apps/web/src/renderer.ts`.
- [implemented] Dependency and Evidence Audit: Confirmed finding `20261106-UX-52` remains status `partial` (monitoring retry loops); receipts A075–A078 record Dependency Review is non-gating (`continue-on-error: true`); `esbuild` 0.18/0.19 resolution evaluated against `drizzle-kit@0.31.11` showing `@esbuild-kit/core-utils@3.3.2` pins `esbuild: ~0.18.20`; receipts A075 through A078 pass `pnpm receipt:check`.

---

## 2. CI Evidence

Local verification via `pnpm verify`:
- Build & typecheck (`turbo run build`): PASSED across all 8 packages.
- Conformance gates (OSR-01, OSR-03, OSR-07, OSR-12, OSR-13, IAHP PROC-1, IAHP HO-1, DR-AUD-001): PASSED.
- Unit, conformance, & P0 regression suites: PASSED (362/362 tests in 42 files).
- Playwright E2E suite: PASSED (63/63 tests in 13 files, including updated `wp14-editor-feedback.spec.ts` with 2 tests).
- Gitleaks secret scan: PASSED (0 leaks).

Note: The GitHub Actions Dependency Review workflow (`.github/workflows/deps.yml`) is non-gating on this repository (`continue-on-error: true`).

---

## 3. Tests Added and Count Change

- Added E2E error case test to `tests/e2e/wp14-editor-feedback.spec.ts`: "Error case: attempting to Save draft with an empty title displays in-viewport error and polite announcement" (net +1 test, total 63 E2E tests across 13 files).
- Unit and conformance test suites: 362 tests across 42 files in `apps/api` (unchanged).

---

## 4. Files Touched

- apps/web/src/renderer.ts
- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A078-wp-140a-visible-editor-results.md
- docs/self-hosting.md
- tests/e2e/wp14-editor-feedback.spec.ts

---

## 5. Register and Backlog Changes

- Register counts: 109 fixed, 7 partial, 53 open (total 169 findings).
- Finding `20261106-UX-53` updated with exact published advisory identifiers and range.

---

## 6. Not Done (Tagged)

- [not-started] WP-14.0 Client bundling: Add esbuild bundling step for `apps/web/src/client/`.
- [not-started] WP-14.1 commitEntry state machine: Formalize `commitEntry` state machine (UX-01, UX-02, UX-03, UX-04).

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A079
=== Validating Receipt A079-wp-140a-feedback-corrections-and-error-coverage.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '7976977' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff a8012dc..7976977 (7 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A079-wp-140a-feedback-corrections-and-error-coverage.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A079-wp-140a-feedback-corrections-and-error-coverage.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 5 (A075, A076, A077, A078, A079); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task WP-14.0
