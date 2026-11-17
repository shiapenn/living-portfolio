# A133 — WP-16.pre-i CodeQL Alerts and Public Hygiene

| Field | Value |
| --- | --- |
| Report ID | A133 |
| Date | 2026-11-17 |
| Author | A (Implementer) |
| Task ID | `WP-16.pre-i` |
| Evidence SHA | `a771cf21729ef87c522688f18dea2b471ac2c288` |
| CI run | 44015761382 |

---

## 1. Scope

Executed `WP-16.pre-i` (CodeQL alerts fix) and public-repo hygiene + ruleset/CodeQL diagnosis:
- [implemented] Fixed all 3 unbaselined CodeQL alerts in `apps/web/src/strings/strings.test.ts` (`js/bad-tag-filter` and two `js/incomplete-multi-character-sanitization` alerts) without baselining or editing `scripts/sarif-gate`: replaced `.replace(/<style...>/g, '').replace(/<script...>/g, '')` with `extractOutsideBlocks` (`indexOf`-based block extraction), added `HTML_TAG_PATTERN = /<[a-z!/]/i` assertion across all catalogue strings, and added negative fixtures for `"<SCRIPT>alert(1)</SCRIPT>"` and `"<style>body{color:red}</style>"`.
- [implemented] Verified `CodeQL (JavaScript / TypeScript)` manually via `gh workflow run codeql.yml --ref feat/wp-16-pre-i-codeql-alerts` (run `44015155308`): `Run SARIF Gate` passed with 0 alerts.
- [implemented] **Ruleset & `codeql.yml` diagnosis:** Read-only inspection of `gh api repos/shiapenn/living-portfolio/rulesets` (`id: 25530940`, `main-gates`) and `.github/workflows/codeql.yml` confirmed `codeql.yml` had only `schedule` and `workflow_dispatch` triggers (no `pull_request` trigger), so `CodeQL (JavaScript / TypeScript)` never reported on PRs. Owner temporarily removed `CodeQL (JavaScript / TypeScript)` from `main-gates` required checks, unblocking `PR #191` (`A132`) merge at `50fcab4`.
- [implemented] **Public-repo hygiene audit (read-only):**
  - Full-history `node scripts/gitleaks-scan`: 497 commits scanned (~8.14 MB), 0 leaks found.
  - Workflow fork-safety: 0 `pull_request_target` triggers across all 8 workflows; deployment secrets (`RENDER_*`, `PRODUCTION_*`, `STAGING_*`) used only in `deploy-production.yml` and `deploy-staging.yml`; all other workflows use `GITHUB_TOKEN` only with explicit `permissions:`.
  - Licence: `LICENSE` exists at repository root (Apache License, Version 2.0, January 2004).
  - Personal data in tracked files (for owner's decision; unchanged): `~/Desktop/wp16r-contact-sheets.zip` path in `A122`, `@shiapeng` in `CODEOWNERS` and `wp11-copy-harmonization.conformance.test.ts`, and `shiapenn <11827148+shiapenn@users.noreply.github.com>` in `A004`–`A013`.

## 2. CI Evidence

- PR `#192` merged to `main` at `a771cf21729ef87c522688f18dea2b471ac2c288`.
- `main` push CI run `44015761382` (`CI & Audit Conformance Gate`): `success`.
- Manual `CodeQL Static Analysis` run `44015155308` on `feat/wp-16-pre-i-codeql-alerts`: `success` (`Run SARIF Gate` passed).

## 3. Tests Added and Count Change

- Updated `apps/web/src/strings/strings.test.ts` with `HTML_TAG_PATTERN` check and negative fixtures for `<SCRIPT>` and `<style` (0 net test count change; 5/5 tests in `strings.test.ts` pass).

## 4. Files Touched

- `apps/web/src/strings/strings.test.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A132-wp-16s-s0-d-sys-foundations-and-census.md`

## 5. Register and Backlog Changes

None.

## 6. Not Done (Tagged)

- [not-started] `WP-16.pre-h`: Add `pull_request` trigger to `.github/workflows/codeql.yml` (after `scripts/triage` identifier PR).
- [not-started] `WP-16.S S1`–`S4`: Resume system simplification pass.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A133
=== Validating Receipt A133-wp-16pre-i-codeql-alerts-and-public-hygiene.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'a771cf21729ef87c522688f18dea2b471ac2c288' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 46746e5ce0ade483a803fe2a8834eb52626dc9b1..a771cf21729ef87c522688f18dea2b471ac2c288 (4 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A133-wp-16pre-i-codeql-alerts-and-public-hygiene.md.
✓ [CI-LOG-CHECK] CI run 44015761382 verified on GitHub (conclusion: success).

🎉 All receipt checks PASSED for A133-wp-16pre-i-codeql-alerts-and-public-hygiene.md.
```

## 9. Handover Decision
- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 117 (per triage counter); work packages since: 0
- Clean-boundary preconditions: not met (`WP-16.pre-h` and `WP-16.S` remaining; handover deferred until `WP-16.S` closure)
- Next action: land `A133` docs PR, then execute `WP-16.pre-h` (`scripts/triage` identifier PR + `codeql.yml` PR).
