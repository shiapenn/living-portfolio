# A193 — WP-18.7 Real File Import And Backup Media Inclusion

| Field | Value |
| --- | --- |
| Report ID | A193 |
| Date | 2026-11-27 |
| Author | A (Implementer) |
| Task ID | WP-18.7 |
| Evidence SHA | `e43a6e6096b9e76b714688eb4d4a284da76f6ae0` |
| CI run | https://github.com/shiapenn/living-portfolio/pull/291 |

## 1. Scope

- [implemented] Added pure-TypeScript zero-native-dependency file parsers in `apps/api/src/import/file-parsers.ts` supporting `.md`, `.txt`, `.html` (zero network fetches, external images degraded to plain link text), `.docx` (text + `word/media/*` images), `.pdf` (`%PDF-` validation + stream text extraction), and `.zip` (zip-slip & decompression bomb guards, nested documents + images).
- [implemented] Added `POST /api/import/files` (`apps/api/src/routes/import-files.ts`), wired into `apps/api/src/routes/import.ts` and `apps/api/src/app.ts`, uploading embedded images via the Media API pipeline (`sniffMediaBytes`, `stripImageMetadata`, `parseImageDimensions`, `storage.put`, `repo.saveMedia`) and reporting per-file errors without failing valid files in the batch.
- [implemented] Wired the existing `Field[file]` variant (`#import-files-input`) into `/admin/import` (`apps/web/src/pages/admin/import.ts` + `apps/web/src/client/admin/import-page.ts`, zero new `data-c` components).
- [implemented] Added media archive export/restore in `packages/db/src/backup/media-archive.ts`, `packages/db/src/backup/engine.ts`, and `packages/db/src/backup/types.ts` so encrypted backups include `media_assets` and content-addressed media binaries and `runRestoreDrill` restores them into a fresh repo + fresh media directory serving HTTP `200`.

## 2. CI Evidence

- Canary on previous commit `3db1fd2` (worktree `/tmp/lp-canary-3db1fd2`): `5/5` behavioural failures (`404` on `/api/import/files` across `.md`/`.txt`/`.html`/`.docx`/`.pdf`/`.zip` and per-file errors).
- `apps/api/src/conformance/wp18-7-real-file-import.conformance.test.ts`: `5/5` passed.
- `apps/api/src/conformance/backup-restore.conformance.test.ts`: `11/11` passed.
- `pnpm --filter @living-portfolio/db test` & `pnpm --filter @living-portfolio/web test` (`120/120`): passed.
- `pnpm design:audit`: `0` violations across `L0–L7` (43 manifest states); `pnpm wp16n:verify`: `11/11` checks green.
- `tests/e2e/wp17-14-closed-world-audit.spec.ts`: `5/5` passed (`25/25` routes, `43/43` states, `950` pairs measured, `0` unclassified, `0` drift).
- `tests/e2e/wp17-16-alignment-actions-audit.spec.ts`: `4/4` passed (`HA1: 259, HA2: 276, HA3: 861, HA4: 102, HA5: 1191`, `0` violations).
- `tests/e2e/wp18-7-real-file-import.spec.ts`: `1/1` passed.

## 3. Tests Added and Count Change

- Added `apps/api/src/conformance/wp18-7-real-file-import.conformance.test.ts` (+5 conformance tests).
- Added `tests/e2e/wp18-7-real-file-import.spec.ts` (+1 E2E test).

## 4. Files Touched

- `apps/api/src/app.ts`
- `apps/api/src/conformance/wp18-7-real-file-import.conformance.test.ts`
- `apps/api/src/import/file-parsers.ts`
- `apps/api/src/routes/import-files.ts`
- `apps/api/src/routes/import.ts`
- `apps/web/src/client/admin/import-page.ts`
- `apps/web/src/pages/admin/import-script.ts`
- `apps/web/src/pages/admin/import.ts`
- `docs/INDEX.md`
- `docs/design/health-history.json`
- `docs/design/health.md`
- `docs/doc-registry.json`
- `docs/execution-reports/A192-wp-186-import-stepper-polish.md`
- `docs/execution-reports/A193-wp-187-real-file-import-and-backup-media.md`
- `docs/plans/backlog.yml`
- `packages/db/src/backup/engine.ts`
- `packages/db/src/backup/media-archive.ts`
- `packages/db/src/backup/types.ts`
- `packages/ui-admin/src/primitives/field/field.css`
- `tests/e2e/wp16-r-style-census.spec.ts`
- `tests/e2e/wp18-7-real-file-import.spec.ts`

## 5. Register and Backlog Changes

- `docs/plans/backlog.yml`: marked `WP-18.7` `status: done`.

## 6. Not Done (Tagged)

None.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```text
=== Validating Receipt A193-wp-187-real-file-import-and-backup-media.md ===
✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '711e2f0bbc8ab1f7286edd34b725e6cf444d2b5c' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff f8fe3bf22393e3868319bd3f89ccaed7580f01c5..711e2f0bbc8ab1f7286edd34b725e6cf444d2b5c (14 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A193-wp-187-real-file-import-and-backup-media.md.
🎉 All receipt checks PASSED for A193-wp-187-real-file-import-and-backup-media.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 177 (A193)
- Clean-boundary preconditions: WP-18.7 PR checks green and merged cleanly to main.
- Next action: Proceed to WP-18.8 (Quick Log capture route).
