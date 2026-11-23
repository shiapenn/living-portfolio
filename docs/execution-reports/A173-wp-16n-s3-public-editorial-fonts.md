# A173 — wp-16n-s3-public-editorial-fonts

| Field | Value |
| --- | --- |
| Report ID | A173 |
| Date | 2026-11-23 |
| Author | A (Implementer) |
| Task ID | `WP-16.N S3` |
| Evidence SHA | `b07d1921b96367f4b799d41654ed3c86496e7ffe` |
| CI run | 45150165566 |

---

## 1. Scope

Executed `WP-16.N S3` (Quiet Editorial neutral public pack, self-hosted WOFF2 variable fonts, CJK typography + Chinese sample entry, zero inline `style=` across admin and public, extended `STATES.public` census, and interim contact sheets):

- [implemented] Bundled self-hosted Latin variable WOFF2 fonts in `packages/ui-core/assets/fonts/` (`atkinson-hyperlegible-next-latin.woff2` 34,024 B + `literata-latin.woff2` 39,260 B = 73,284 B total, under 100 KB budget), added `packages/ui-core/src/fonts/fonts.ts` with `font-display: swap`, metric-adjusted fallback faces (`size-adjust`, `ascent-override`, `descent-override`), and preloaded both faces on public routes with `Cache-Control: public, max-age=31536000, immutable`.
- [implemented] Updated `packages/design-tokens/packs/public.json` to strictly chroma-neutral neutrals (OKLCH chroma `0.0000 <= 0.01`, enforced by `packages/design-tokens/src/rules.test.ts`), added CJK fallback stacks (`PingFang SC`, `Noto Sans CJK SC`, `Source Han Sans SC`; `Songti SC`, `Noto Serif CJK SC`, `Source Han Serif SC`) and `font.line-zh: 1.7`.
- [implemented] Rewrote `packages/ui-public/src/components/shell/shell.css` for Quiet Editorial (neutral) with `:lang(zh)` rules (line-height 1.7, zero letter-spacing, no synthetic italics, CJK quotes), single accent for links/active nav/focus/selection only, eyebrows in `text-2`, and `data-band-tier="1..5"` timeline band sizing.
- [implemented] Eliminated all remaining inline `style=` attributes across `apps/web/src` (`235 -> 0`) and runtime `cursor.style.left` mutation, emptied `inlineStyle` in `docs/audits/ui-guard-allowlist.json`, and removed 10 newly-unused public-only tokens from `packages/design-tokens/packs/admin.json`.
- [implemented] Extended `STATES.public` to 16 routes/states (including `pub-work-entry-zh` Chinese sample, `pub-work-entry-structured`, `pub-timeline-asof`, `pub-ask-status`, `pub-404`), verified real WOFF2 fonts (`Literata` + `Atkinson Hyperlegible Next`) load on 96/96 sheets, and packaged `~/Desktop/wp16n-public-sheets.zip` (8.9 MB).

### Component statement (required when touching UI; D-J)

- [implemented] Added public utility classes (`pub-row`, `pub-row-between`, `pub-header-rule`, `pub-section`, `pub-zh-sample`, `pub-empty`) in `packages/ui-public/src/components/shell/shell.css` to replace public inline styles; replaced `lp-truncate` with registered `lp-item-title` in `apps/web/src/client/admin-entry.ts`; no new admin `data-c` component introduced.

## 2. CI Evidence

- PR #271 code commit `b07d1921b96367f4b799d41654ed3c86496e7ffe`:
  - `CI & Audit Conformance Gate` run `45150165566`: `Typecheck, Unit, Security Regression, DCO & Audit Gate` (`success`, 1m56s), `Build Shared Artifact` (`success`, 28s), `Playwright E2E Shards 1..4` (`success`, 57s..1m55s), `Playwright End-to-End Suite` (`success`, 2s).
  - `CodeQL Static Analysis` run `45150165352`: `success` (1m46s).
  - `Secret Scan (gitleaks)` run `45150165343`: `success` (10s).

## 3. Tests Added and Count Change

- [implemented] Added public neutral OKLCH chroma (`<= 0.01`) test in `packages/design-tokens/src/rules.test.ts`.
- [implemented] Extended `tests/e2e/wp16-m-public-census.spec.ts` to assert real loaded WOFF2 faces (`Literata` + `Atkinson Hyperlegible Next`), `:lang(zh)` computed rules, zero inline `style=` on rendered DOM, and accent CSS loading across all 96 sheets (16 states × 3 viewports × 2 themes).

## 4. Files Touched

- `apps/api/src/conformance/staging-safeguards.conformance.test.ts`
- `apps/api/src/conformance/wp11-accessibility.conformance.test.ts`
- `apps/api/src/conformance/wp11-copy-harmonization.conformance.test.ts`
- `apps/api/src/conformance/wp11-markdown-tokens.conformance.test.ts`
- `apps/api/src/conformance/wp11-nav-states.conformance.test.ts`
- `apps/api/src/conformance/wp12-strata-craft.conformance.test.ts`
- `apps/web/src/app.ts`
- `apps/web/src/client/admin-entry.ts`
- `apps/web/src/client/draft-buffer.ts`
- `apps/web/src/client/publish-dialog.ts`
- `apps/web/src/components/entry-card.ts`
- `apps/web/src/components/slots.ts`
- `apps/web/src/components/strata-timeline-script.ts`
- `apps/web/src/components/strata-timeline.ts`
- `apps/web/src/layouts/public-shell.ts`
- `apps/web/src/pages/public/ask-status.ts`
- `apps/web/src/pages/public/ask.ts`
- `apps/web/src/pages/public/book.ts`
- `apps/web/src/pages/public/build.ts`
- `apps/web/src/pages/public/entries-index.ts`
- `apps/web/src/pages/public/entry.ts`
- `apps/web/src/pages/public/home.ts`
- `apps/web/src/pages/public/not-found.ts`
- `apps/web/src/pages/public/timeline.ts`
- `apps/web/src/routes/public-routes.ts`
- `apps/web/src/web.test.ts`
- `docs/INDEX.md`
- `docs/audits/ui-guard-allowlist.json`
- `docs/design/tokens-admin.md`
- `docs/design/tokens-public.md`
- `docs/design/tokens.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A172-wp-16n-s2-admin-css-migration.md`
- `docs/plans/wp16n-progress.md`
- `packages/design-tokens/packs/admin.json`
- `packages/design-tokens/packs/public.json`
- `packages/design-tokens/src/drift.test.ts`
- `packages/design-tokens/src/generated.ts`
- `packages/design-tokens/src/public.css`
- `packages/design-tokens/src/rules.test.ts`
- `packages/design-tokens/src/tokens.css`
- `packages/design-tokens/tokens.json`
- `packages/ui-core/assets/fonts/atkinson-hyperlegible-next-latin.woff2`
- `packages/ui-core/assets/fonts/literata-latin.woff2`
- `packages/ui-core/src/fonts/fonts.ts`
- `packages/ui-core/src/index.ts`
- `packages/ui-core/src/primitives/accessibility/accessibility.css`
- `packages/ui-public/src/bundle.ts`
- `packages/ui-public/src/components/shell/shell.css`
- `tests/e2e/public-states-manifest.ts`
- `tests/e2e/wp11-markdown-tokens-layout.spec.ts`
- `tests/e2e/wp16-m-public-census.spec.ts`

## 5. Register and Backlog Changes

- Updated `docs/plans/wp16n-progress.md` to record S2 merged (`55cc5e8`) and S3 verification evidence. No `register.yml` or `backlog.yml` status changes in S3.

## 6. Not Done (Tagged)

- [not-started] S4 (governance ADRs/rules/health/ds:impact/changesets), S5 (performance & closure). Continuing in stacked slices.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A173
✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA 'b07d1921b96367f4b799d41654ed3c86496e7ffe' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 9241de2ede145db3c2692fbffee7b6a70afd0484..b07d1921b96367f4b799d41654ed3c86496e7ffe (52 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A173-wp-16n-s3-public-editorial-fonts.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A173-wp-16n-s3-public-editorial-fonts.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 157; work packages since: 2
- Clean-boundary preconditions: met
- Next action: merge PR #271 via `--merge` and proceed with Slice S4 on `feat/wp-16n-s4-governance`.
