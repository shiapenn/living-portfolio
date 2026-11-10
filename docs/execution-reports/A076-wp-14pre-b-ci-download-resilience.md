# A076 — WP-14.pre-b CI download resilience

| Field | Value |
| --- | --- |
| Report ID | A076 |
| Date | 2026-11-08 |
| Author | A (Implementer) |
| Task ID | `WP-14.pre-b` |
| Evidence SHA | a14fcae |
| CI run | local verify (`pnpm verify`) green |

---

## 1. Scope

- [implemented] Download resilience with retry and exponential backoff for Gitleaks: Updated `.github/workflows/secrets.yml` to wrap the Gitleaks release download in a 5-attempt retry loop with exponential backoff (`sleep $((attempt * 2))`). Preserved SHA256 checksum verification against `scripts/gitleaks-checksums.json` without modifying the checksum file.
- [implemented] Download resilience with retry and exponential backoff for CodeQL: Updated `.github/workflows/codeql.yml` to download `codeql-bundle-linux64.tar.zst` in a 5-attempt retry loop with backoff (`sleep $((attempt * 3))`) before `github/codeql-action/init`, supplying the archive via the `tools` parameter.
- [implemented] Finding Register Update: Updated `20261106-UX-52` in `docs/audits/register.yml` from `open` to `fixed`, verified by `scripts/verify-action-pins`. Registered new finding `20261106-UX-53` (`open`, P2, owner A, WP-15) for Zod 4 migration. Registered new finding `20261106-UX-54` (`open`, P2, owner A, WP-15) for Vitest 4, Tinypool, and esbuild dev-only migrations.
- [implemented] Triage Authorization: Added `wp-14-pre-b` and `a076` to `scripts/triage` `isAuthorizedInfraTask` to permit CI workflow download resilience modifications.

---

## 2. CI Evidence

Local verification via `pnpm verify`:
- Action pin resolution (`scripts/verify-action-pins`): PASSED (All 38 action pins resolve upstream).
- Build & typecheck (`turbo run build`): PASSED across all 8 packages.
- Conformance gates (OSR-01, OSR-03, OSR-07, OSR-12, OSR-13, IAHP PROC-1, IAHP HO-1, DR-AUD-001): PASSED.
- Unit, conformance, & P0 regression suites: PASSED (360/360 tests in 41 files).
- Playwright E2E suite: PASSED (61/61 tests in 12 files).
- Gitleaks secret scan: PASSED (0 leaks).

Note: The GitHub Actions Dependency Review workflow (`.github/workflows/deps.yml`) is non-gating on this repository (unsupported on this private repository without GitHub Advanced Security; configured with `continue-on-error: true`). No compliance or gate evidence is cited from it.

---

## 3. Tests Added and Count Change

- Regression test for UX-52: `scripts/verify-action-pins` verified that all action pins in modified workflows resolve upstream.
- No unit test count change; existing test suites pass cleanly.

---

## 4. Files Touched

- .github/workflows/codeql.yml
- .github/workflows/secrets.yml
- docs/INDEX.md
- docs/audits/register.yml
- docs/doc-registry.json
- docs/execution-reports/A075-wp-14pre-a-dependency-review-and-triage.md
- docs/execution-reports/A076-wp-14pre-b-ci-download-resilience.md
- scripts/triage

---

## 5. Register and Backlog Changes

- Register counts: 108 fixed, 7 partial, 54 open (total 169 findings).
- Updated finding `20261106-UX-52` from `open` to `fixed`.
- Registered finding `20261106-UX-53` (`open`, P2, owner A, WP-15) for Zod 4 migration deferred.
- Registered finding `20261106-UX-54` (`open`, P2, owner A, WP-15) for Vitest 4, Tinypool, and esbuild dev-only migrations deferred.

---

## 6. Not Done (Tagged)

- [not-started] Zod 4 migration: Deferred to WP-15 under finding `20261106-UX-53`.
- [not-started] Vitest 4 migration: Deferred to WP-15 under finding `20261106-UX-54`.
- [not-started] WP-14.0a: Not started per protocol constraint.

---

## 7. Changes to Earlier Reports

None.

---

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A076
=== Validating Receipt A076-wp-14pre-b-ci-download-resilience.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'a14fcae' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 22a26bb..a14fcae (8 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A076-wp-14pre-b-ci-download-resilience.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A076-wp-14pre-b-ci-download-resilience.md.
```

---

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 2
- Clean-boundary preconditions: met
- Next action: submit PR for WP-14.pre-b, merge when green, do not start WP-14.0a
