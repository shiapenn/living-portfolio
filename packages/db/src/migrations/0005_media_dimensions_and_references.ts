/**
 * Migration 0005: Media asset dimensions (width, height) and derived-visibility media_references index (WP-18.3a)
 */

export const MIGRATION_0005_MEDIA_HARDENING_NAME = '0005_media_dimensions_and_references';

export const MIGRATION_0005_MEDIA_HARDENING_SQL = `
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS height INTEGER;

CREATE TABLE IF NOT EXISTS media_references (
  media_id UUID NOT NULL,
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  revision_id UUID NOT NULL REFERENCES entry_revisions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (media_id, revision_id)
);
CREATE INDEX IF NOT EXISTS idx_media_references_media_id ON media_references(media_id);
CREATE INDEX IF NOT EXISTS idx_media_references_entry_id ON media_references(entry_id);
`;
