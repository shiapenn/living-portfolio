# A189 — wp-183a-media-hardening

| Field | Value |
| --- | --- |
| Report ID | A189 |
| Date | 2026-11-27 |
| Author | A (Implementer) |
| Task ID | `WP-18.3a` |
| Evidence SHA | `6190c351d6537a4f70cb075f6a9f63365d1c2f4f` |
| CI run | Pending PR CI (local `pnpm verify` 16/16, `wp16n:verify` 11/11, `design:audit`, `--self-test`, and 12/12 `WP-18.3a` hardening conformance tests green; 12/12 behavioural canaries proven failing on `437f6b4` in isolated worktree) |

---

## 1. Scope

Delivered `WP-18.3a` — Media API Hardening (API-only slice before any UI; zero `data-c` components):
- `[implemented]` **1. Refcounted Content-Addressed Delete (`apps/api/src/routes/media.ts`):** `DELETE /media/:id` deletes the database row first and deletes the content-addressed storage object (`storage_key` / `sha256`) **only** when zero remaining rows share it; blocks deletion (`409 MEDIA_IN_USE`) if referenced by a published public entry.
- `[implemented]` **2. Lossless Image Metadata Stripping (`apps/api/src/media/image-process.ts`, `docs/design/content.md`):** Strips EXIF, GPS IFD, XMP, IPTC, and comment chunks from JPEG (`APP1`/`APP13`/`COM`), PNG (`eXIf`/`tEXt`/`zTXt`/`iTXt`/`tIME`), and WebP (`EXIF`/`XMP ` + clearing `VP8X` metadata flags) on upload **without re-encoding** pixel data. Documented the video metadata non-stripping limitation in `docs/design/content.md`.
- `[implemented]` **3. HTTP Byte-Range Serving (`apps/api/src/routes/media.ts`, `apps/api/src/media/storage.ts`, `apps/api/src/media/stream-upload.ts`):** `GET /media/:id` emits `Accept-Ranges: bytes` on `200`/`206`/`416`, serves valid `Range` (`bytes=start-end`, `bytes=start-`, `bytes=-suffix`) as `206 Partial Content` with `Content-Range`, and rejects invalid/unsatisfiable ranges with `416` + `Content-Range: bytes */<total>` across both `LocalVolumeMediaStorageAdapter` (positional file-descriptor slice) and `S3CompatibleMediaStorageAdapter` (SigV4 `HEAD` + `Range` `GET`).
- `[implemented]` **4. Image Dimensions, Migration `0005` & Corrupt Image Rejection (`packages/db/src/migrations/0005_media_dimensions_and_references.ts`, `apps/api/src/media/image-process.ts`):** Parses exact `width` and `height` for PNG, JPEG, GIF, and WebP at upload, persists them in `media_assets` (idempotent migration `0005_media_dimensions_and_references`), returns them in `POST /media` and `GET /media`, and rejects truncated/unparseable images with `415 UNPARSEABLE_IMAGE`.
- `[implemented]` **5. Pre-Buffer Streaming Size Limit (`apps/api/src/media/stream-upload.ts`, `apps/api/src/routes/media.ts`):** Enforces `Content-Length` pre-check (`0` chunks pulled) and chunked `ReadableStream` byte counting with in-stream magic-byte category detection (`MEDIA_MAX_IMAGE_BYTES` vs `MEDIA_MAX_VIDEO_BYTES`), cancelling the stream (`reader.cancel()`) and returning `413 FILE_TOO_LARGE` before buffering oversize bodies (`3/202` chunks = `131 KB` read vs `13.1 MB` buffered on `437f6b4`, `peakHeapDeltaKB=763`).
- `[implemented]` **6. Derived Visibility & Media-Reference Index (`packages/db/src/media-helpers.ts`, `packages/db/src/repository.ts`, `packages/db/src/postgres-repository.ts`, `apps/api/src/routes/media.ts`):** Removed `visibility` from upload form handling; maintained `media_references` index across `createEntry`, `createRevision`, `updateEntry`, and `deleteEntry`; an asset is publicly readable (`200`) iff referenced by the current revision of at least one published `public` entry, otherwise `401` anonymous; uncanonicalised `uri` stored as `/api/media/:id`.
- `[implemented]` **7. CodeQL Resolution & Fallback Secret Removal (`apps/api/src/auth/security.ts`, `packages/config/src/index.ts`):** Removed hardcoded `'lp-recovery-secret'` fallback from `computeRecoveryCodeHash`, `generateRecoveryCodes`, and `AuthManager.login`; enforced mandatory `SESSION_SECRET` (`>= 16` chars) in `AuthManager` when `DEPLOYMENT_CLASS=production`; enforced non-empty `MEDIA_S3_*` credentials when `MEDIA_STORAGE_BACKEND=s3`; verified `0` suppression comments and `0` SARIF baselined dismissals.

## 2. CI Evidence

- **Behavioural Canaries on `437f6b4` in Isolated Git Worktree (`local output`):** `12/12` behavioural tests FAILED (`0` module-missing errors):
  - `[1-REFCOUNT]`: `expected false to be true` (`storage.exists(row2.storage_key)` after deleting `row1`)
  - `[2-METADATA-JPEG]`: `expected true to be false` (stored JPEG contained `Exif\0\0` + fake GPS tag)
  - `[2-METADATA-PNG-WEBP]`: `expected true to be false` (stored PNG/WebP contained `eXIf`/`iTXt`/`EXIF`/`XMP ` GPS tags)
  - `[3-RANGE-LOCAL]`: `expected null to be 'bytes'` (`Accept-Ranges` missing; Range returned `200`)
  - `[3-RANGE-S3]`: `expected 200 to be 206` (S3 Range request ignored)
  - `[4a-MIGRATION-0005]`: `expected undefined to be defined` (migration `0005` absent)
  - `[4b-DIMENSIONS]`: `expected undefined to be 12` (`width`/`height` missing; corrupt images accepted as `201`)
  - `[5a-STREAM-LIMIT]`: `chunksPulled=202/202 bytesEnqueued=13107441 streamCancelled=false` (buffered full `13.1 MB` stream)
  - `[5b-CONTENT-LENGTH-PRECHECK]`: `expected 400 to be 413`
  - `[6a-DERIVED-VISIBILITY-LIFECYCLE]`: `expected 401 to be 200` (asset referenced by published public entry stayed `401`)
  - `[6b-UPLOAD-FORM-VISIBILITY-REMOVED]`: `expected 200 to be 401` (`visibility=public` on unreferenced upload leaked publicly)
  - `[7-NO-FALLBACK-SECRET]`: `expected [Function] to throw an error` (`computeRecoveryCodeHash` fell back to `'lp-recovery-secret'`)
- **Per-Item Verification Counts on `WP-18.3a` (`local output`):**
  1. Delete refcount: `1` test (`5` assertions: upload x2, delete 1, `storage.exists=true`, `GET other=200`, delete 2 -> `storage.exists=false`).
  2. Image metadata stripping: `2` tests (`13` assertions across JPEG EXIF/GPS/XMP/COM, PNG `eXIf`/`iTXt`/`tEXt`, WebP `VP8X`/`EXIF`/`XMP `, lossless bitstream equality, and `content.md` video note).
  3. Range `206`/`416`: `2` tests (`20` assertions across Local + S3 adapters, `Accept-Ranges: bytes`, closed/suffix ranges, and `4` invalid `416` range forms).
  4. Dimensions + migration `0005` + `415`: `2` tests (`17` assertions: migration `0005` DDL, PNG `12x7`, JPEG `19x11`, GIF `23x13`, WebP `17x9`, `GET /media` list dimensions, and `4` corrupt image `415` rejections).
  5. Pre-buffer streaming size limit: `2` tests (`7` assertions; stream proof: `status=413 chunksPulled=3/202 bytesEnqueued=131276 streamCancelled=true peakHeapDeltaKB=763`; `Content-Length` precheck `chunksPulled=0`).
  6. Derived visibility & reference index: `2` tests (`15` assertions: unreferenced `401`, draft-referenced `401`, published-referenced `200`, unpublished `401`, revision-removed `401`, upload-form `visibility=public` ignored `401`).
  7. CodeQL & fallback secret hygiene: `1` test (`8` assertions: `3` recovery-key throws, `1` production `AuthManager` throw, `1` S3 config throw, `0` `'lp-recovery-secret'` occurrences, `0` SARIF baselined alerts, `0` suppression comments across all `.ts` files).
- **CodeQL 3-Alert Resolution Diff (`752d3aa` + `6190c35`):**
  - Resolved `js/hardcoded-credentials` on `TEST_ADMIN_TOKEN` and `S3CompatibleMediaStorageAdapter` test fixtures via runtime `randomBytes(...)` generation, removed `'auto'` fallback in `S3CompatibleMediaStorageAdapter.signRequest` (`region = this.cfg.region` validated in constructor), and removed `'lp-recovery-secret'` fallback in `apps/api/src/auth/security.ts`.
- `pnpm verify` (`local output`): PASSED (`16/16` repository gates, `49/49` API test files, `402/402` API tests).
- `pnpm wp16n:verify` + `node scripts/design-audit --self-test` (`local output`): PASSED (`11/11` DoD checks, `13/13` L7 self-test categories).

## 3. Tests Added and Count Change

- Added `apps/api/src/conformance/wp18-3a-media-hardening.conformance.test.ts` (`+12` tests across items `1`–`7`).
- Updated `apps/api/src/conformance/wp18-3-media-api.conformance.test.ts` CSRF test to verify derived visibility via published entry reference.
- API test count increased from `390` to `402` (`+12`, computed from the above).

## 4. Files Touched

- `apps/api/src/auth/security.ts`
- `apps/api/src/conformance/wp18-3-media-api.conformance.test.ts`
- `apps/api/src/conformance/wp18-3a-media-hardening.conformance.test.ts`
- `apps/api/src/media/image-process.ts`
- `apps/api/src/media/storage.ts`
- `apps/api/src/media/stream-upload.ts`
- `apps/api/src/routes/media.ts`
- `docs/design/content.md`
- `docs/execution-reports/A188-wp-183-media-api.md`
- `docs/plans/backlog.yml`
- `packages/config/src/index.ts`
- `packages/core/src/types/media.ts`
- `packages/db/src/dual-write-repository.ts`
- `packages/db/src/media-helpers.ts`
- `packages/db/src/migrate.ts`
- `packages/db/src/migrations/0005_media_dimensions_and_references.ts`
- `packages/db/src/postgres-repository.ts`
- `packages/db/src/repository.ts`
- `packages/db/src/schema/index.ts`

## 5. Register and Backlog Changes

- Added `WP-18.3a` (`status: done`) in `docs/plans/backlog.yml` and updated `WP-18.4` `depends_on: [WP-18.3a]`.
- Registered `A189` (`docs/execution-reports/A189-wp-183a-media-hardening.md`) in `docs/doc-registry.json` and regenerated `docs/INDEX.md`.

## 6. Not Done (Tagged)

None. All `WP-18.3a` hardening items (`1`–`8`) are complete and verified.

## 7. Changes to Earlier Reports

None.

## 8. Receipt Gate Self-Validation

```
$ pnpm receipt:check A189
=== Validating Receipt A189-wp-183a-media-hardening.md ===

✓ [HEADER-CHECK] Mandatory headers verified (6/6 present).
✓ [ANCESTOR-CHECK] Evidence SHA '6190c351d6537a4f70cb075f6a9f63365d1c2f4f' is an ancestor of HEAD.
✓ [FILES-TOUCHED] Matches git diff 752d3aa378c5bf6c50b2d85aa83e8e8e64aa27f4..6190c351d6537a4f70cb075f6a9f63365d1c2f4f (19 files verified).
✓ [SECTIONS-CHECK] Mandatory sections 1 through 9 verified for A189-wp-183a-media-hardening.md.
Found 0 section(s) marked verbatim.

🎉 All receipt checks PASSED for A189-wp-183a-media-hardening.md.
```

## 9. Handover Decision

- Decision: RECOMMENDED
- Rule(s): HO-R3
- Receipts since last handover: 173 (A189); work packages since: 1
- Clean-boundary preconditions: met
- Next action: merge `WP-18.3a` PR on 10/10 green checks, then proceed immediately to `WP-18.4`.
