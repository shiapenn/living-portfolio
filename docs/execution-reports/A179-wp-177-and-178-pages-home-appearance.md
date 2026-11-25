# A179 — WP-17.7 and 17.8 pages home appearance

| Field | Value |
| --- | --- |
| Report ID | A179 |
| Date | 2026-11-25 |
| Author | A (Implementer) |
| Task ID | `WP-17.7`, `WP-17.8` |
| Evidence SHA | `a8d2130729c8c4a457aa4e739fa35b4b37182656` |
| CI run | 45551672459 |

---

## 1. Scope

- [implemented] **WP-17.7 (Pages & Home settings)**:
  - [implemented] Added `/admin/pages` (`apps/web/src/pages/admin/pages.ts`) supporting `about`, `now`, `uses`, and `home` statement editing with immutable revision history (`GET /api/settings/pages`, `PUT /api/settings/pages/:slug` in `apps/api/src/routes/settings-wp17.ts`).
  - [implemented] Added `/admin/settings/home` (`apps/web/src/settings/modules/home.ts`, `GET/PATCH /api/settings/home`) with home statement, featured count (default 3), and recent count (default 10).
- [implemented] **WP-17.8 (Appearance v2, `gate: L-review`)**:
  - [implemented] Added typed `ThemePackV2` schema, WCAG AA contrast validation (`>= 4.5:1` text & on-accent, `>= 3.0:1` UI), 4 selectable built-in packs (`quiet-default`, `editorial-slate`, `warm-ink`, `high-contrast`), constrained customisation (accent seed, density proximity table, allowed radius scales, vetted self-hosted fonts), and cacheable `@layer user-theme` CSS generator (`theme.<hash>.css` with zero-cost fallback to `DEFAULT_ACCENT_CSS_FILENAME` when unchanged) in `packages/ui-core/src/theme/theme-pack.ts` + unit tests `theme-pack.test.ts` + `.changeset/wp17-appearance-v2.md`.
  - [implemented] Added `GET/PATCH /api/settings/appearance-v2` and `GET /api/settings/appearance-v2/export` in `apps/api/src/routes/settings-wp17.ts` storing both `admin` and `public` scopes via the settings registry; wired `/assets/css/theme.<hash>.css` (`Cache-Control: public, max-age=31536000, immutable`) and `/admin/theme` in `apps/web/src/app.ts` and `apps/api/src/adapter/bundled-web.ts`.
  - [implemented] Upgraded `apps/web/src/settings/modules/appearance.ts` + `appearance-script.ts` with scope switcher, selectable packs, constrained controls, live preview + real-time WCAG AA contrast readout, AA contrast rejection, and JSON pack import/export (rejecting arbitrary CSS). Zero restyle of public pages.
  - [implemented] Replaced internal jargon word `"facet"` -> `"topic"` on `/admin/structure`.
  - [implemented] Captured and inspected WP-17 contact sheets (`tests/e2e/wp17-contact-sheets.spec.ts`, delivered to `~/Desktop/wp17-contact-sheets.zip`).

### Component statement (required when touching UI; D-J)
- [implemented] `pages`: `Tabs` (`about`/`now`/`uses`/`home`), `FormSection`, `Field` (`textarea`), `List` (`plain`), `Item`, page-level `ActionBar` (`Save`, primary).
- [implemented] `settings-home`: `FormSection`, `Field` (`textarea`, `number`), page-level `ActionBar` (`Save`, primary).
- [implemented] `settings-appearance`: `FormSection` (3 sections: scope/pack, constrained customisation, import/export), `Field` (`select`, `input`, `textarea`), `Text` (`caption` live preview & AA readout), item-level `ActionBar` (`Import pack` secondary + `Export pack` text), page-level `ActionBar` (`Save`, primary). Zero new `data-c` components introduced; zero literals; zero inline `style=`.

## 2. CI Evidence

- PR #277 code commit `a8d2130729c8c4a457aa4e739fa35b4b37182656`:
  - `CI & Audit Conformance Gate` run `45551672459`: `success` (Typecheck/Unit/Audit + Build + Playwright Shards 1..4 all green).
  - `CodeQL Static Analysis` run `45551672449`: `success`.
  - `Secret Scan (gitleaks)` run `45551672331`: `success`.
  - `Dependency Review` run `45551672393`: `success`.

## 3. Tests Added and Count Change

- [implemented] Added `packages/ui-core/src/theme/theme-pack.test.ts` (5 Vitest unit tests; `ui-core` now 16/16 passing).
- [implemented] Added `tests/e2e/wp17-7-pages-home.spec.ts` (1 Playwright E2E test).
- [implemented] Added `tests/e2e/wp17-8-appearance-v2.spec.ts` (1 Playwright E2E test).
- [implemented] Added `tests/e2e/wp17-contact-sheets.spec.ts` (gated contact-sheet capture spec).

## 4. Files Touched

- `.changeset/wp17-appearance-v2.md`
- `apps/api/package.json`
- `apps/api/src/adapter/bundled-web.ts`
- `apps/api/src/routes/settings-wp17.ts`
- `apps/api/src/routes/settings.ts`
- `apps/web/src/app.ts`
- `apps/web/src/layouts/admin-shell.ts`
- `apps/web/src/pages/admin/pages.ts`
- `apps/web/src/pages/admin/settings-script.ts`
- `apps/web/src/pages/admin/settings.ts`
- `apps/web/src/pages/admin/structure.ts`
- `apps/web/src/renderer.ts`
- `apps/web/src/settings/index.ts`
- `apps/web/src/settings/modules/appearance-script.ts`
- `apps/web/src/settings/modules/appearance.ts`
- `apps/web/src/settings/modules/home.ts`
- `docs/INDEX.md`
- `docs/audits/register.yml`
- `docs/design/health-history.json`
- `docs/design/health.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A178-wp-173-to-176-settings-and-governance-modules.md`
- `docs/plans/backlog.yml`
- `docs/plans/wp17-progress.md`
- `packages/ui-core/CHANGELOG.md`
- `packages/ui-core/src/index.ts`
- `packages/ui-core/src/theme/theme-pack.test.ts`
- `packages/ui-core/src/theme/theme-pack.ts`
- `pnpm-lock.yaml`
- `tests/e2e/states-manifest.ts`
- `tests/e2e/wp17-7-pages-home.spec.ts`
- `tests/e2e/wp17-8-appearance-v2.spec.ts`
- `tests/e2e/wp17-contact-sheets.spec.ts`

## 5. Register and Backlog Changes

- [implemented] `docs/plans/backlog.yml`: marked `WP-17.7` and `WP-17.8` as `status: done` (`WP-17.8` contact sheets delivered for `L-review`).
- [implemented] `docs/audits/register.yml`: transitioned `20261106-UX-95` to `status: fixed` (`regression_test: tests/e2e/wp17-8-appearance-v2.spec.ts`).

## 6. Not Done (Tagged)

- [not-started] `WP-18` (Media API, block editor media, Storage settings) and `WP-19` (`WP-19.0` design framework unification + Public frame) — out of scope for WP-17; do not start until owner review.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A179
=== Validating Receipt A179-wp-177-and-178-pages-home-appearance.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'a8d2130729c8c4a457aa4e739fa35b4b37182656' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 0d066552fe77cf1ff381cf1977527ae8cda7169d..a8d2130729c8c4a457aa4e739fa35b4b37182656 (33 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A179-wp-177-and-178-pages-home-appearance.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A179-wp-177-and-178-pages-home-appearance.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 163; work packages since: 2
- Clean-boundary preconditions: met
- Next action: merge PR #277 via `--merge` and report WP-17 completion + `L-review` contact sheets to owner.
