# A175 — wp-16n-s5-performance-closure

| Field | Value |
| --- | --- |
| Report ID | A175 |
| Date | 2026-11-23 |
| Author | A (Implementer) |
| Task ID | `WP-16.N S5` |
| Evidence SHA | `2c6b315ef4a90eb7a87a5bee6253b0ce8fae9d27` |
| CI run | 45155874409 |

---

## 1. Scope

Executed `WP-16.N S5` (HTTP delivery headers, D-N4 performance and rendering budgets, final contact sheets archive, and `WP-16.N` closure):

- [implemented] Added `apps/web/src/middleware/delivery.ts` (wired in `apps/web/src/app.ts`) implementing weak `ETag` (`W/"<sha256-16>"`) + conditional `304 Not Modified` for `GET` HTML responses, Brotli (`br`) / gzip response compression for compressible payloads >= 1 KB, `Vary: Accept-Encoding`, and preservation of `Cache-Control: public, max-age=31536000, immutable` on hashed assets.
- [implemented] Added unit tests in `apps/web/src/middleware/delivery.test.ts` (3 tests) and E2E performance & rendering budget test `tests/e2e/wp16-n-perf-budget.spec.ts` verifying every D-N4 budget across 11 public routes + admin login/editor/gallery: Public CSS `5,022 B` (`4.9 KB`) <= `15 KB`, Public JS `715–1,485 B` <= `10 KB`, Public WOFF2 fonts `73,284 B` (`71.6 KB`, 2 preloaded) <= `100 KB`, Public route total `80,584–85,233 B` (`78.7–83.2 KB`) <= `150 KB`, Admin entry CSS `22,986 B` (`22.4 KB`) <= `30 KB`, Admin editor JS `139,207 B` (`135.9 KB`) <= `150 KB`, Simulated 4G vitals `CLS = 0` (`<= 0.02`) & `LCP = 204 ms` (`<= 2000 ms`), CDP rendering cost (public home recalc `6.96 ms` / layout `25.42 ms`; admin gallery recalc `3.36 ms` / layout `2.63 ms`), and worst CSS selector depth (`core = 1`, `public = 2`, `adminComponents = 2`).
- [implemented] Packaged final contact sheets archive `~/Desktop/wp16n-contact-sheets.zip` (`12 MB`) containing all 96 public contact sheets + `index.html` + `fonts.json` (including Chinese sample `pub-work-entry-zh`), admin proof sheets, and `budget-report.json`.
- [implemented] Extended `scripts/wp16n-verify` with `S5-DELIVERY-HEADERS` (10/10 DoD checks green) and closed `WP-16.N` (`status: done`) in `docs/plans/backlog.yml` (unblocking `WP-17.1` without starting `WP-17`).

### Component statement (required when touching UI; D-J)

- [implemented] No new UI components or classes added in S5.

## 2. CI Evidence

- PR #273 code commit `2c6b315ef4a90eb7a87a5bee6253b0ce8fae9d27`:
  - `CI & Audit Conformance Gate` run `45155874409`: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, 2m15s), `Build Shared Artifact` (`success`, 38s), `Playwright E2E Shards 1..4` (`success`, 1m7s..1m51s), `Playwright End-to-End Suite` (`success`, 2s).
  - `CodeQL Static Analysis` run `45155874371`: `success` (1m55s).
  - `Secret Scan (gitleaks)` run `45155874235`: `success` (4s).

## 3. Tests Added and Count Change

- [implemented] Added 3 unit tests in `apps/web/src/middleware/delivery.test.ts` (web test suite now 104 tests across 13 files).
- [implemented] Added 1 Playwright E2E performance & rendering budget spec in `tests/e2e/wp16-n-perf-budget.spec.ts`.

## 4. Files Touched

- `apps/web/src/app.ts`
- `apps/web/src/middleware/delivery.test.ts`
- `apps/web/src/middleware/delivery.ts`
- `docs/INDEX.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A174-wp-16n-s4-governance-adrs-health.md`
- `docs/plans/backlog.yml`
- `docs/plans/wp16n-progress.md`
- `scripts/wp16n-verify`
- `tests/e2e/wp16-n-perf-budget.spec.ts`

## 5. Register and Backlog Changes

- [implemented] Marked `WP-16.M` and `WP-16.N` as `status: done` in `docs/plans/backlog.yml` and updated `docs/plans/wp16n-progress.md` with all 6 D-N5 DoD criteria met.

## 6. Not Done (Tagged)

- [not-started] `WP-17` (Settings & Appearance v2), `P-4` (time-travel component), and `P-5` (three-column public layout) — explicitly out of scope for `WP-16.N` and recorded in `docs/plans/backlog.yml`.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A175
=== Validating Receipt A175-wp-16n-s5-performance-closure.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '2c6b315ef4a90eb7a87a5bee6253b0ce8fae9d27' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 27bf96a4378551d0e977b04067f674a39b6ddebe..2c6b315ef4a90eb7a87a5bee6253b0ce8fae9d27 (10 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A175-wp-16n-s5-performance-closure.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A175-wp-16n-s5-performance-closure.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 159; work packages since: 2
- Clean-boundary preconditions: met
- Next action: merge PR #273 via `--merge`, pull `main`, verify `pnpm wp16n:verify` exits `0` on `main`, and deliver final WP-16.N report (do not start WP-17).
