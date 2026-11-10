# A077 — WP-14.pre dependency review audit corrections

| Field | Value |
| --- | --- |
| Report ID | A077 |
| Date | 2026-11-10 |
| Author | A (Implementer) |
| Task ID | `WP-14.pre-corrections` |
| Evidence SHA | 377e35e |
| CI run | local verify (`pnpm verify`) green |

---

## 1. Scope

- [implemented] Authoritative Dependabot Alert Audit: Replaced summary triage table with complete 23-alert table from `gh api repos/shiapenn/living-portfolio/dependabot/alerts --paginate` mapping alert numbers #1 through #23, packages, severities, states, and fixed-in versions.
- [implemented] Zod Advisory Verification & Conformance Guard: Quoted advisory `GHSA-mrhx-c7xc-m3w5` / `CVE-2023-54404` with published vulnerable range `< 4.6.6` (through 4.6.5) and patched version `4.6.6`. Documented grep commands proving zero `z.array`, `z.set`, or `z.tuple` schemas in use across `apps/` and `packages/`. Added conformance test `apps/api/src/conformance/zod-collection-guard.conformance.test.ts` to block introduction of collection schemas prior to Zod 4 migration.
- [implemented] UX-52 Register Reclassification: Reclassified `20261106-UX-52` to status `partial` with monitoring note ("retry added, unproven until a download failure is observed; monitor"). Confirmed PR #93 workflow diff preserved strict checksum comparison with `scripts/gitleaks-checksums.json` untouched.
- [implemented] Dependency Review Non-Gating Record: Recorded in receipts that GitHub Actions Dependency Review workflow is non-gating (`continue-on-error: true`, unsupported on this repository setup) and provides no authoritative gate evidence.
- [implemented] esbuild & Drizzle-Kit Investigation: Evaluated `drizzle-kit@0.31.11` against `pnpm why esbuild`. Confirmed that while `esbuild@0.19.12` is dropped, `esbuild@0.18.20` remains pinned by upstream `@esbuild-kit/core-utils@3.3.2`. Updated finding `20261106-UX-54`.

---

## 2. CI Evidence

Local verification via `pnpm verify`:
- Build & typecheck (`turbo run build`): PASSED across all 8 packages.
- Conformance gates (OSR-01, OSR-03, OSR-07, OSR-12, OSR-13, IAHP PROC-1, IAHP HO-1, DR-AUD-001): PASSED.
- Unit, conformance, & P0 regression suites: PASSED (362/362 tests in 42 files, including new `zod-collection-guard.conformance.test.ts`).
- Playwright E2E suite: PASSED (61/61 tests in 12 files).
- Gitleaks secret scan: PASSED (0 leaks).

Note: The GitHub Actions Dependency Review workflow (`.github/workflows/deps.yml`) is non-gating on this repository (unsupported on this private repository without GitHub Advanced Security; configured with `continue-on-error: true`). No compliance or gate evidence is cited from it.

---

## 3. Tests Added and Count Change

- Added conformance test file `apps/api/src/conformance/zod-collection-guard.conformance.test.ts` (2 tests, both passing):
  * Test 1: Static AST scan asserting zero `z.array(`, `z.set(`, or `z.tuple(` invocations in TypeScript sources across `apps/` and `packages/`.
  * Test 2: Runtime schema introspection traversing all exported schemas from `@living-portfolio/core` and `@living-portfolio/config` asserting no `ZodArray`, `ZodSet`, or `ZodTuple` definitions.
- Suite count: 362 tests across 42 files in `apps/api` (net +2 tests).

---

## 4. Files Touched

- apps/api/src/conformance/zod-collection-guard.conformance.test.ts
- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A075-wp-14pre-a-dependency-review-and-triage.md
- docs/execution-reports/A076-wp-14pre-b-ci-download-resilience.md
- docs/execution-reports/A077-wp-14pre-dependency-review-audit-corrections.md

---

## 5. Register and Backlog Changes

- Register counts: 108 fixed, 7 partial, 54 open (total 169 findings).
- Updated finding `20261106-UX-52` from `fixed` to `partial`.
- Updated finding `20261106-UX-53` with conformance test `apps/api/src/conformance/zod-collection-guard.conformance.test.ts`.
- Updated finding `20261106-UX-54` with drizzle-kit / esbuild 0.18 investigation findings.

---

## 6. Not Done (Tagged)

- [not-started] Zod 4 migration: Deferred to WP-15 under finding `20261106-UX-53`.
- [not-started] Vitest 4 migration: Deferred to WP-15 under finding `20261106-UX-54`.
- [not-started] WP-14.0a: Visible editor results (next task).

---

## 7. Changes to Earlier Reports

- Receipt A075 (`docs/execution-reports/A075-wp-14pre-a-dependency-review-and-triage.md`): Added explicit note in §2 that GitHub Actions Dependency Review is non-gating (`continue-on-error: true`) and cited as no gate evidence. Synchronized §5 register counts.
- Receipt A076 (`docs/execution-reports/A076-wp-14pre-b-ci-download-resilience.md`): Added explicit note in §2 that GitHub Actions Dependency Review is non-gating and cited as no gate evidence. Synchronized §5 register counts.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A077
=== Validating Receipt A077-wp-14pre-dependency-review-audit-corrections.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '377e35e' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff a14fcae..377e35e (7 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A077-wp-14pre-dependency-review-audit-corrections.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A077-wp-14pre-dependency-review-audit-corrections.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 3 (A075, A076, A077); work packages since: 0
- Clean-boundary preconditions: met
- Next action: start WP-14.0a on branch feat/wp-14-0a-visible-editor-results
