# A191 — WP-18.5 Columns Container Directive

| Field | Value |
| --- | --- |
| Report ID | A191 |
| Date | 2026-11-27 |
| Author | A (Implementer) |
| Task ID | WP-18.5 |
| Evidence SHA | `4c8e6ffccb6c94193add9331064b5d8359d1af06` |
| CI run | https://github.com/shiapenn/living-portfolio/pull/289 |

## 1. Scope

- [implemented] Added linear `O(n)` `:::columns{cols=2..4}` and nested `:::column` parser/renderer helpers in `apps/web/src/editor/columns-parser.ts`.
- [implemented] Registered `columns` and `column` blocks in `apps/web/src/editor/block-registry.ts` and upgraded `apps/web/src/editor/markdown-bridge.ts` for structured AST parsing and 100% lossless Markdown round-trip (including nested columns).
- [implemented] Added `ColumnsNode` and `ColumnNode` in `apps/web/src/client/admin/tiptap-nodes.ts`, `/columns`, `/columns3`, `/columns4` slash commands, and drop-to-columns cursor targeting in `apps/web/src/client/admin/tiptap-editor.ts` (zero new `data-c` components, zero drag handles).
- [implemented] Added public `.pub-columns` / `.pub-column` responsive grid rendering in `apps/web/src/markdown.ts` and `packages/ui-public/src/components/media/media.css` (`L7 = 0`, single-column collapse at `320px`, 2/3/4 columns at desktop, DOM reading order preserved).
- [implemented] Added `public-entry-columns` to `WP17_MANIFEST` (`40/40` states, `25/25` routes) and updated `docs/design/public-media-brief.md` (§3).

## 2. CI Evidence

- Canary on previous commit `c444a14` (worktree `/tmp/lp-canary-c444a14`): `6/6` behavioural failures (`0` module-missing errors).
- `pnpm --filter @living-portfolio/web test`: `15/15` files, `117/117` tests passed.
- `pnpm design:audit`: `0` violations across `L0–L7` (40 manifest states); `node scripts/design-audit --self-test`: `13/13` categories detected.
- `pnpm wp16n:verify`: `11/11` checks green.
- `tests/e2e/wp17-14-closed-world-audit.spec.ts`: `5/5` passed (`25/25` routes, `40/40` states, `890` pairs measured, `0` unclassified, `0` drift).
- `tests/e2e/wp17-16-alignment-actions-audit.spec.ts`: `4/4` passed (`HA1: 238, HA2: 258, HA3: 834, HA4: 90, HA5: 1134`, `0` violations).
- `tests/e2e/wp18-5-columns.spec.ts`: `2/2` passed.

## 3. Tests Added and Count Change

- Added `apps/web/src/editor/wp18-5-columns.test.ts` (+6 unit tests; `apps/web` total `111 -> 117`).
- Added `tests/e2e/wp18-5-columns.spec.ts` (+2 E2E tests).
- Added `public-entry-columns` to `tests/e2e/wp17-manifest.ts` (`39 -> 40` states).

## 4. Files Touched

- `apps/web/src/client/admin/tiptap-editor.ts`
- `apps/web/src/client/admin/tiptap-nodes.ts`
- `apps/web/src/editor/block-registry.ts`
- `apps/web/src/editor/columns-parser.ts`
- `apps/web/src/editor/markdown-bridge.ts`
- `apps/web/src/editor/wp18-5-columns.test.ts`
- `apps/web/src/markdown.ts`
- `docs/design/health-history.json`
- `docs/design/health.md`
- `docs/design/public-media-brief.md`
- `docs/execution-reports/A190-wp-184-editor-media-and-public-rendering.md`
- `docs/plans/backlog.yml`
- `packages/ui-admin/src/routes/editor-dfinal.css`
- `packages/ui-public/src/components/media/media.css`
- `tests/e2e/wp17-14-closed-world-audit.spec.ts`
- `tests/e2e/wp17-manifest.ts`
- `tests/e2e/wp18-5-columns.spec.ts`

## 5. Register and Backlog Changes

- `docs/plans/backlog.yml`: marked `WP-18.5` `status: done`.

## 6. Not Done (Tagged)

None.

## 7. Changes to Earlier Reports

- None.

## 8. Receipt Gate Self-Validation

```text
=== Validating Receipt A191-wp-185-columns-container-directive.md ===
✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '4c8e6ffccb6c94193add9331064b5d8359d1af06' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 4ee586f871f8bb91891eea0acadec91dbcc03420..4c8e6ffccb6c94193add9331064b5d8359d1af06 (17 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A191-wp-185-columns-container-directive.md.
🎉 All receipt checks PASSED for A191-wp-185-columns-container-directive.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 175 (A191)
- Clean-boundary preconditions: WP-18.5 PR checks green and merged cleanly to main.
- Next action: Proceed to WP-18.6 (Import stepper polish).
