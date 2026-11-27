/**
 * Migration 0004: Media assets metadata columns for storage keys, hashes, size, visibility, and timestamps (WP-18.3, D-STORAGE)
 */

export const MIGRATION_0004_MEDIA_ASSETS_NAME = '0004_media_assets_metadata';

export const MIGRATION_0004_MEDIA_ASSETS_SQL = `
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS storage_key TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS original_filename TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS size_bytes BIGINT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS sha256 TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'private';
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_media_assets_sha256 ON media_assets(sha256);
CREATE INDEX IF NOT EXISTS idx_media_assets_entry_id ON media_assets(entry_id);
`;
