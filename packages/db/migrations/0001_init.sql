-- QRXP Schema Migration 0001: Initial Core & Operational Tables (§9, §19)
-- Forward-only migration with pgvector extension and schema_info version check

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Schema Info & Versioning Table
CREATE TABLE IF NOT EXISTS schema_info (
  qrxp_schema_version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Ventures Table
CREATE TABLE IF NOT EXISTS ventures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  links JSONB,
  started_at TIMESTAMPTZ,
  facets JSONB
);

-- 3. Entries Table
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  profile TEXT NOT NULL DEFAULT 'case-study',
  view TEXT NOT NULL DEFAULT 'article',
  visibility TEXT NOT NULL DEFAULT 'private',
  venture_id UUID REFERENCES ventures(id),
  current_revision_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Entry Revisions Table
CREATE TABLE IF NOT EXISTS entry_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  body_md TEXT NOT NULL,
  body_hash TEXT NOT NULL,
  written_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  temporal_level TEXT NOT NULL DEFAULT 'estimated',
  valid_from_range_end TIMESTAMPTZ,
  is_hindsight BOOLEAN NOT NULL DEFAULT false
);

-- 5. Spans Table
CREATE TABLE IF NOT EXISTS spans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID NOT NULL REFERENCES entry_revisions(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  start_off INTEGER NOT NULL,
  end_off INTEGER NOT NULL,
  text_exact TEXT NOT NULL,
  prefix TEXT,
  suffix TEXT,
  token_count INTEGER NOT NULL
);

-- 6. Annotations Table
CREATE TABLE IF NOT EXISTS annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  span_id UUID NOT NULL REFERENCES spans(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  profile TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  confidence REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Facets Table
CREATE TABLE IF NOT EXISTS facets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  revision_id UUID REFERENCES entry_revisions(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  confidence REAL,
  source_span_id UUID REFERENCES spans(id)
);

-- 8. Claims Table
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id UUID NOT NULL REFERENCES entry_revisions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  kind TEXT NOT NULL,
  outcome_status TEXT,
  scope JSONB,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  temporal_level TEXT,
  is_hindsight BOOLEAN NOT NULL DEFAULT false,
  source_span_id UUID REFERENCES spans(id),
  source TEXT NOT NULL,
  status TEXT NOT NULL
);

-- 9. Relations Table
CREATE TABLE IF NOT EXISTS relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  src_claim UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  dst_claim UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  scope JSONB,
  status TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_from TIMESTAMPTZ
);

-- 10. Evidence Table
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  span_id UUID REFERENCES spans(id),
  claim_id UUID REFERENCES claims(id),
  kind TEXT NOT NULL,
  url TEXT,
  media_id UUID,
  verification JSONB,
  verified_at TIMESTAMPTZ
);

-- 11. Media Assets Table
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  mime_type TEXT NOT NULL,
  uri TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  ocr_text TEXT,
  transcript JSONB,
  duration_sec INTEGER
);

-- 12. Embedding Sets Table
CREATE TABLE IF NOT EXISTS embedding_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT NOT NULL,
  model_version TEXT NOT NULL,
  dim INTEGER NOT NULL,
  status TEXT NOT NULL
);

-- 13. Chunk Vectors Table (pgvector)
CREATE TABLE IF NOT EXISTS chunk_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id UUID NOT NULL REFERENCES spans(id) ON DELETE CASCADE,
  embedding_set_id UUID NOT NULL REFERENCES embedding_sets(id),
  vector vector(384) NOT NULL,
  text_snippet TEXT NOT NULL
);

-- 14. Correction Log Table
CREATE TABLE IF NOT EXISTS correction_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT,
  role TEXT,
  domain TEXT,
  machine_confidence REAL,
  owner_action TEXT NOT NULL,
  edit_distance REAL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Escalations Table
CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  query_class TEXT NOT NULL,
  facets JSONB,
  draft TEXT,
  final TEXT,
  draft_edit_distance REAL,
  citation_clicks INTEGER DEFAULT 0,
  booked BOOLEAN DEFAULT false,
  status TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. Calibration Changes Table
CREATE TABLE IF NOT EXISTS calibration_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parameter TEXT NOT NULL,
  old_value REAL NOT NULL,
  new_value REAL NOT NULL,
  evidence_count INTEGER NOT NULL,
  applied_by TEXT NOT NULL,
  reversible BOOLEAN NOT NULL DEFAULT true,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. Topology Reports Table
CREATE TABLE IF NOT EXISTS topology_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_a UUID NOT NULL REFERENCES claims(id),
  claim_b UUID NOT NULL REFERENCES claims(id),
  confidence REAL NOT NULL,
  overlap JSONB,
  status TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 18. Scoped Constraints Table
CREATE TABLE IF NOT EXISTS scoped_constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constraint JSONB NOT NULL,
  scope JSONB NOT NULL,
  source_escalation UUID REFERENCES escalations(id),
  source_quote TEXT,
  status TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance and query patterns
CREATE INDEX IF NOT EXISTS idx_entries_slug ON entries(slug);
CREATE INDEX IF NOT EXISTS idx_entries_visibility ON entries(visibility);
CREATE INDEX IF NOT EXISTS idx_entries_venture ON entries(venture_id);
CREATE INDEX IF NOT EXISTS idx_entry_revisions_entry_id ON entry_revisions(entry_id);
CREATE INDEX IF NOT EXISTS idx_spans_revision_id ON spans(revision_id);
CREATE INDEX IF NOT EXISTS idx_annotations_span_id ON annotations(span_id);
CREATE INDEX IF NOT EXISTS idx_facets_entry_id ON facets(entry_id);
CREATE INDEX IF NOT EXISTS idx_claims_revision_id ON claims(revision_id);
CREATE INDEX IF NOT EXISTS idx_relations_src_dst ON relations(src_claim, dst_claim);
CREATE INDEX IF NOT EXISTS idx_chunk_vectors_chunk ON chunk_vectors(chunk_id);
CREATE INDEX IF NOT EXISTS idx_chunk_vectors_set ON chunk_vectors(embedding_set_id);
