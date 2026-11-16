# A125 — WP-16.L L2 Tiptap Editor

| Field | Value |
| --- | --- |
| Report ID | A125 |
| Date | 2026-11-16 |
| Author | A (Implementer) |
| Task ID | `WP-16.L L2` |
| Evidence SHA | `5dbbcb52959bfb53b1df12b32c3edf9fbb6ffa42` |
| CI run | 43804987888 |

---

## 1. Scope

Implemented `WP-16.L` `L2` per `D-LAYOUT` #8–#9 and `D-EDITOR-3`:
- Built `apps/web/src/editor/block-registry.ts` and `apps/web/src/editor/markdown-bridge.ts` supporting `paragraph`, `heading` (1–3), `bulletList`, `orderedList`, `blockquote`, `codeBlock`, `horizontalRule`, `callout`, `table`, `directive` (including `:::columns`), and `link` with registered schema, editor view, Markdown serialiser, public renderer, and export rule.
- Built `apps/web/src/client/admin/tiptap-editor.ts` on `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, and `@tiptap/extension-link` with slash menu (`/`), formatting toolbar, Markdown shortcuts/paste, `Source` toggle, and `UX-106` unmodified-save preservation (`dirtyFromInitial`).
- Redesigned `/admin/entries/new` and `/admin/entries/:id` as the full-screen editor (`apps/web/src/pages/admin/entries/editor.ts`, `editor-toolbar.ts`) with sticky toolbar, closed left `#ref-entries-drawer`, closed right `#ref-inspector-pane` (`Captured, Tagged, Claimed, Grounded` text line, no step boxes/explainers/dashed containers), borderless `24 px` title, details popover with section mapping, Visibility menu, and `760 px` serif writing column.
- Wired `/admin/import` (`apps/web/src/client/admin/import-page.ts`) to mount the Tiptap component in `Source` mode by default.
- Zeroed all 16 metrics in `docs/audits/style-census-budget.json`.
- Bundle size check: `apps/web/dist/client/editor-page.js` gzipped size `137,548` bytes (`134.3 KB <= 150 KB` limit).
- Handover baseline note: `pnpm handover:verify H017` fails only for the known reviewed `WP-16.R` drift recorded in `P004` (`L` exception of 2026-11-16).

## 2. CI Evidence

- PR `#176` merged to `main` at `5dbbcb52959bfb53b1df12b32c3edf9fbb6ffa42`.
- `main` push CI run `43804987888` (`CI & Audit Conformance Gate`): `success` (`Typecheck, Unit, Security Regression, DCO & Audit Gate`, `Playwright End-to-End Suite`, `Detect Changed Scope`).
- `pnpm verify`: 15/15 gates passed.
- `pnpm test:e2e`: 117/117 Playwright E2E tests passed, including 0-violation census across 2,518–2,598 elements and 388 controls.

## 3. Tests Added and Count Change

- Added `apps/web/src/editor/roundtrip.test.ts` (3 tests: 100% lossless round-trip of all fixtures + `:::columns` directives + all seeded entries in `packages/db/src/seed.ts`, and registry completeness for public renderers/export rules).
- Added `tests/e2e/wp16-l2-tiptap-editor.spec.ts` (2 tests: Tiptap rich text, toolbar, slash menu, `Source` toggle, drawers, details popover, `UX-106` unmodified save, Esc focus return, `axe-core`, and `/admin/import` Source-mode default).
- Updated 11 legacy E2E specs and 2 WP-11.4 unit assertions for `D-LAYOUT` #8 and updated `docs/audits/dom-id-baseline.json`.
- `@living-portfolio/web` unit tests: 88 passed across 10 files. `@living-portfolio/api` unit/conformance tests: 380 passed across 47 files. E2E tests: 117 passed.

## 4. Files Touched

- `apps/api/src/conformance/wp11-markdown-tokens.conformance.test.ts`
- `apps/web/package.json`
- `apps/web/src/client/admin/editor-page.ts`
- `apps/web/src/client/admin/import-page.ts`
- `apps/web/src/client/admin/tiptap-editor.ts`
- `apps/web/src/editor/block-registry.ts`
- `apps/web/src/editor/markdown-bridge.ts`
- `apps/web/src/editor/roundtrip.test.ts`
- `apps/web/src/pages/admin/entries/editor-toolbar.ts`
- `apps/web/src/pages/admin/entries/editor.test.ts`
- `apps/web/src/pages/admin/entries/editor.ts`
- `apps/web/src/pages/admin/import.ts`
- `apps/web/src/patterns/structure-panel.ts`
- `apps/web/src/strings/admin/editor.ts`
- `apps/web/src/styles.ts`
- `docs/INDEX.md`
- `docs/audits/dom-id-baseline.json`
- `docs/audits/style-census-budget.json`
- `docs/doc-registry.json`
- `docs/execution-reports/A124-wp16l-l1-shell-pages-settings.md`
- `packages/core/package.json`
- `pnpm-lock.yaml`
- `tests/e2e/redaction.spec.ts`
- `tests/e2e/wp11-markdown-tokens-layout.spec.ts`
- `tests/e2e/wp11-navigation-and-states.spec.ts`
- `tests/e2e/wp14-7-hotfix.spec.ts`
- `tests/e2e/wp14-client-bundling.spec.ts`
- `tests/e2e/wp14-commit-entry.spec.ts`
- `tests/e2e/wp14-editor-feedback.spec.ts`
- `tests/e2e/wp14-publish-dialog.spec.ts`
- `tests/e2e/wp14-state-date.spec.ts`
- `tests/e2e/wp15-7-editor-reference-page.spec.ts`
- `tests/e2e/wp16-0-g15-defects-and-parity.spec.ts`
- `tests/e2e/wp16-4-dedicated-editor-routes.spec.ts`
- `tests/e2e/wp16-5-inspector-and-history.spec.ts`
- `tests/e2e/wp16-l1-shell-and-settings.spec.ts`
- `tests/e2e/wp16-l2-tiptap-editor.spec.ts`
- `tests/e2e/wp16-r-style-census.spec.ts`

## 5. Register and Backlog Changes

- Zeroed all 16 budgets in `docs/audits/style-census-budget.json` (`UX-109`–`UX-124` transitions to `fixed` scheduled in `L3` after contact-sheet capture).

## 6. Not Done (Tagged)

- `WP-16.L L3`: Contact-sheet capture of every admin page + every overlay state at 1280 and 320 px (light & dark) plus editor at 1920 px, zipped to `~/Desktop/wp16l-contact-sheets.zip`, and `UX-109`–`UX-124` register closure.
- `WP-18.2` / `WP-18.5`: Image, video, and nested Columns / drop-to-columns blocks on the registered block model.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation
```
$ pnpm receipt:check A125
=== Validating Receipt A125-wp-16l-l2-tiptap-editor.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '5dbbcb52959bfb53b1df12b32c3edf9fbb6ffa42' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 6a7b742ee8c7a7528b299e119d5feba4ca4d327c..5dbbcb52959bfb53b1df12b32c3edf9fbb6ffa42 (38 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A125-wp-16l-l2-tiptap-editor.md.
✓ [CI-LOG-CHECK] CI run 43804987888 verified on GitHub (conclusion: success).

🎉 All receipt checks PASSED for A125-wp-16l-l2-tiptap-editor.md.
```

## 9. Handover Decision
- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 3 (A123, A124, A125); work packages since: 0
- Clean-boundary preconditions: met
- Next action: continue with task `WP-16.L L3` (contact sheets and register closure).
