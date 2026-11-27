# A190 — WP-18.4 Editor Media And Public Rendering

| Field | Value |
| --- | --- |
| Report ID | A190 |
| Date | 2026-11-27 |
| Author | A (Implementer) |
| Task ID | `WP-18.4` |
| Evidence SHA | `214f8cac7df0b1122b38973be83eed73cb7095f2` |
| CI run | Pending PR CI (local `pnpm verify` 16/16, `wp16n:verify` 11/11, `design:audit`, `--self-test`, K22 872 pairs / 0 drift, HA1-HA5 0 violations, `wp18-4-editor-media.spec.ts` 2/2 green; 7/7 behavioural canaries proven failing on `8a9d6bd` in isolated worktree) |

---

## 1. Scope

Delivered `WP-18.4` — Images and video in editor + public Markdown rendering:
- `[implemented]` **1. Approved Screen Brief & Public Briefs (`docs/design/screen-brief.md`, `docs/design/public-media-brief.md`, `docs/plans/backlog.yml`):** Committed final `WP-18.4` Editor Media Dialog brief (without reorder), public `.pub-media` and `.pub-embed-gate` briefs using token references only (`L7 = 0`), and recorded deferred video `.vtt` captions track under `WP-20.3`.
- `[implemented]` **2. Config & CSP (`packages/config/src/media.ts`, `apps/api/src/app.ts`, `apps/web/src/app.ts`, `.env.example`):** Added `MEDIA_EMBED_ALLOWED_HOSTS` (default `youtube-nocookie.com,player.vimeo.com`), `parseEmbedAllowedHosts`, `isAllowedEmbedUrl`, `buildEmbedFrameSrc`, and CSP `frame-src` + `media-src 'self'` across API and Web apps.
- `[implemented]` **3. Unified Editor Media Dialog (`field.ts`, `action-bar.ts`, `icons.ts`, `editor-media-dialog.ts`, `editor-media.ts`, `tiptap-editor.ts`, `tiptap-nodes.ts`):** Added `Field[file]` variant styled as Secondary button, `ActionBar` `dangerTextAction` slot (`Insert`/`Save` -> `Cancel` -> `Remove`), `/image` and `/video` slash commands, toolbar buttons, paste/drop on editor surface (no dropzone inside dialog), atomic ProseMirror history grouping (`closeHistory`) for Remove + Undo, `aria-busy` + `>1s` `StatusLine` + danger `Notice` feedback.
- `[implemented]` **4. Public Rendering & Privacy (`markdown-media.ts`, `markdown.ts`, `entry.ts`, `public-shell.ts`, `media.css`):** Rendered `/api/media/:id` images in `.pub-media` with stored `width`/`height` and `loading="lazy"`, non-`/api/media/:id` Markdown images as plain link text (`0` existing seed/entry images affected), uploaded videos with `controls` + `preload="metadata"` + `aria-label`, and consent-gated `.pub-embed-gate` with zero pre-click requests.
- `[implemented]` **5. Manifest & Audits (`wp17-manifest.ts`, `wp17-14`, `wp17-16`, `wp18-4-editor-media.spec.ts`):** Added all 11 required manifest states (`39/39` states, `25/25` routes) with DOM markers and extended `K22` and `HA1`–`HA5` generically across open dialogs, editor blocks, and public media.

### Component statement (required when touching UI; D-J)

- `[implemented]` Zero new `data-c` components introduced (`docs/design/components.json` component count unchanged at `22`; added `file` variant to existing `Field`).
- `[implemented]` Existing registered components used in admin UI: `Overlay`, `Field` (`text`, `file`), `Choice` (`button`, `single`, `multiple`), `ActionBar` (`dialog`), `Button` (`primary`, `secondary`, `text`, `text-danger`, `quiet`), `Notice` (`danger`), `Text` (`caption`).
- `[implemented]` Public expressive-mode classes documented in `docs/design/public-media-brief.md`: `.pub-media`, `.pub-embed-gate` (strictly `--pub-*` / `--lp-core-*` tokens, `L7 = 0`).

## 2. CI Evidence

- **Behavioural Canaries on `8a9d6bd` in Isolated Git Worktree (`/tmp/lp-canary-8a9d6bd`, `local output`):** `7/7` tests in `apps/web/src/editor/wp18-4-media.test.ts` FAILED behaviourally (`0` module-missing errors):
  - `[1-PRIVACY-EXTERNAL-IMAGE]`: rendered `<img src="https://tracker.example.org/beacon.png">` instead of plain link text.
  - `[2-PUBLIC-IMAGE-DIMENSIONS]`: missing `class="pub-media"`, `width`/`height`, and `<figcaption>`.
  - `[3-PUBLIC-UPLOADED-VIDEO]`: rendered raw `<p>:::video{...}</p>` instead of `.pub-media` `<video>`.
  - `[4-PUBLIC-EMBED-GATE-AND-ALLOWLIST]`: missing `.pub-embed-gate`.
  - `[5-EDITOR-ROUNDTRIP-MEDIA]`: `paragraph` instead of `mediaImage`.
  - `[6-EDITOR-MEDIA-DIALOG-SYSTEM-MODE]`: `#ref-media-dialog` absent in editor SSR HTML.
  - `[7-CSP-FRAME-SRC-CONFIG]`: `MEDIA_EMBED_ALLOWED_HOSTS` undefined.
- **Unit & Conformance (`pnpm --filter @living-portfolio/web test`, `local output`):** `14/14` files, `111/111` tests PASSED (`7/7` `wp18-4-media.test.ts`).
- **Design & Governance Audits (`local output`):** `pnpm design:audit` `0` violations across `L0–L7`; `node scripts/design-audit --self-test` PASSED (`13/13` categories); `pnpm wp16n:verify` `11/11` checks green.
- **Playwright Closed-World, Alignment & Journey Audits (`local output`):**
  - `K22` / `K27`: `25/25` routes, `39/39` states, `872` pairs measured, `0` unclassified, `0` drift.
  - `K36–K40` (`HA1–HA5`): `0` violations (`HA1: 229`, `HA2: 312`, `HA3: 1638`, `HA4: 90`, `HA5: 1926`).
  - `K23–K26`, `K28–K34`, `K41–K43`: all passed with `0` violations.
  - `wp18-4-editor-media.spec.ts`: `2/2` passed (toolbar, `/image` slash, paste, drop, alt required, decorative, edit, remove + undo, video embed allowlist, public embed gate zero-request click-through, keyboard Tab/Enter/Escape/focus return, reduced motion).

## 3. Tests Added and Count Change

- Added `apps/web/src/editor/wp18-4-media.test.ts` (`+7` unit/conformance tests).
- Added `tests/e2e/wp18-4-editor-media.spec.ts` (`+2` Playwright journey suites covering J1–J6).
- Added `11` states to `tests/e2e/wp17-manifest.ts` (`28` -> `39` states, `25/25` unique routes).

## 4. Files Touched

- `.env.example`
- `apps/api/src/app.ts`
- `apps/web/src/app.ts`
- `apps/web/src/client/admin/editor-media-helpers.ts`
- `apps/web/src/client/admin/editor-media.ts`
- `apps/web/src/client/admin/editor-page.ts`
- `apps/web/src/client/admin/tiptap-editor.ts`
- `apps/web/src/client/admin/tiptap-nodes.ts`
- `apps/web/src/editor/block-registry.ts`
- `apps/web/src/editor/markdown-bridge.ts`
- `apps/web/src/editor/wp18-4-media.test.ts`
- `apps/web/src/layouts/public-shell.ts`
- `apps/web/src/lib/html.ts`
- `apps/web/src/markdown-media.ts`
- `apps/web/src/markdown.ts`
- `apps/web/src/pages/admin/entries/editor-media-dialog.ts`
- `apps/web/src/pages/admin/entries/editor-sections.ts`
- `apps/web/src/pages/admin/entries/editor-toolbar.ts`
- `apps/web/src/pages/public/entry.ts`
- `apps/web/src/primitives/action-bar.ts`
- `apps/web/src/primitives/field.ts`
- `apps/web/src/primitives/icons.ts`
- `docs/INDEX.md`
- `docs/design/components.json`
- `docs/design/health-history.json`
- `docs/design/health.md`
- `docs/design/public-media-brief.md`
- `docs/design/screen-brief.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A189-wp-183a-media-hardening.md`
- `docs/plans/backlog.yml`
- `packages/config/src/index.ts`
- `packages/config/src/media.ts`
- `packages/ui-admin/src/primitives/field/field.css`
- `packages/ui-admin/src/routes/editor-dfinal.css`
- `packages/ui-admin/src/routes/gallery-samples.css`
- `packages/ui-admin/src/templates/dfinal-system.css`
- `packages/ui-public/src/bundle.ts`
- `packages/ui-public/src/components/media/media.css`
- `playwright.config.ts`
- `tests/e2e/wp17-14-closed-world-audit.spec.ts`
- `tests/e2e/wp17-16-alignment-actions-audit.spec.ts`
- `tests/e2e/wp17-manifest.ts`
- `tests/e2e/wp18-4-editor-media.spec.ts`

## 5. Register and Backlog Changes

- Marked `WP-18.4` (`status: done`) in `docs/plans/backlog.yml` and recorded deferred video `.vtt` captions track under `WP-20.3`.
- Registered `L065` (`docs/design/public-media-brief.md`) and `A190` (`docs/execution-reports/A190-wp-184-editor-media-and-public-rendering.md`) in `docs/doc-registry.json` and regenerated `docs/INDEX.md`.

## 6. Not Done (Tagged)

- `[not-started]` Video `.vtt` captions track — explicitly deferred to `WP-20.3` per scope.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A190
=== Validating Receipt A190-wp-184-editor-media-and-public-rendering.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '214f8cac7df0b1122b38973be83eed73cb7095f2' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 6190c351d6537a4f70cb075f6a9f63365d1c2f4f..214f8cac7df0b1122b38973be83eed73cb7095f2 (44 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A190-wp-184-editor-media-and-public-rendering.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A190-wp-184-editor-media-and-public-rendering.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 174 (A190); work packages since: 2
- Clean-boundary preconditions: met
- Next action: merge `WP-18.4` PR on 10/10 green checks, then proceed immediately to `WP-18.5`.
