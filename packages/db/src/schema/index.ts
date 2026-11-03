import {
  pgTable,
  uuid,
  text,
  jsonb,
  timestamp,
  boolean,
  integer,
  real,
  customType,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Custom pgvector type for vector embeddings
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(384)'; // default dimension, can be specified
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

export const schemaInfo = pgTable('schema_info', {
  qrxp_schema_version: text('qrxp_schema_version').primaryKey(),
  applied_at: timestamp('applied_at', { withTimezone: true }).defaultNow().notNull(),
});

export const ventures = pgTable('ventures', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  status: text('status').notNull(), // idea | building | live | maintained | sunset
  links: jsonb('links'),
  started_at: timestamp('started_at', { withTimezone: true }),
  facets: jsonb('facets'),
});

export const entries = pgTable('entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull().default('Untitled'),
  profile: text('profile').notNull().default('case-study'),
  view: text('view').notNull().default('article'), // article | structured
  visibility: text('visibility').notNull().default('private'), // private | unlisted | public
  venture_id: uuid('venture_id').references(() => ventures.id),
  current_revision_id: uuid('current_revision_id'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const entryRevisions = pgTable('entry_revisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  entry_id: uuid('entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  body_md: text('body_md').notNull(),
  body_hash: text('body_hash').notNull(),
  written_at: timestamp('written_at', { withTimezone: true }).defaultNow().notNull(), // transaction time
  valid_from: timestamp('valid_from', { withTimezone: true }), // event time start
  valid_to: timestamp('valid_to', { withTimezone: true }), // event time end
  temporal_level: text('temporal_level').notNull().default('estimated'), // exact | range | estimated
  valid_from_range_end: timestamp('valid_from_range_end', { withTimezone: true }),
  is_hindsight: boolean('is_hindsight').notNull().default(false),
});

export const spans = pgTable('spans', {
  id: uuid('id').primaryKey().defaultRandom(),
  revision_id: uuid('revision_id').notNull().references(() => entryRevisions.id, { onDelete: 'cascade' }),
  ordinal: integer('ordinal').notNull(),
  start_off: integer('start_off').notNull(),
  end_off: integer('end_off').notNull(),
  text_exact: text('text_exact').notNull(),
  prefix: text('prefix'),
  suffix: text('suffix'),
  token_count: integer('token_count').notNull(),
});

export const annotations = pgTable('annotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  span_id: uuid('span_id').notNull().references(() => spans.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  profile: text('profile').notNull(),
  source: text('source').notNull(), // machine | owner
  status: text('status').notNull(), // suggested | accepted | rejected
  confidence: real('confidence'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const facets = pgTable('facets', {
  id: uuid('id').primaryKey().defaultRandom(),
  entry_id: uuid('entry_id').notNull().references(() => entries.id, { onDelete: 'cascade' }),
  revision_id: uuid('revision_id').references(() => entryRevisions.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  value: jsonb('value').notNull(),
  source: text('source').notNull(), // machine | owner
  status: text('status').notNull(), // suggested | confirmed | rejected
  confidence: real('confidence'),
  source_span_id: uuid('source_span_id').references(() => spans.id),
});

export const claims = pgTable('claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  revision_id: uuid('revision_id').notNull().references(() => entryRevisions.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  kind: text('kind').notNull(), // lesson | decision | outcome | finding | fact
  outcome_status: text('outcome_status'), // worked | partly | failed | unresolved | unknown
  scope: jsonb('scope'),
  valid_from: timestamp('valid_from', { withTimezone: true }),
  valid_to: timestamp('valid_to', { withTimezone: true }),
  recorded_at: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  temporal_level: text('temporal_level'),
  is_hindsight: boolean('is_hindsight').notNull().default(false),
  source_span_id: uuid('source_span_id').references(() => spans.id),
  source: text('source').notNull(), // machine | owner
  status: text('status').notNull(), // suggested | accepted | rejected
});

export const relations = pgTable('relations', {
  id: uuid('id').primaryKey().defaultRandom(),
  src_claim: uuid('src_claim').notNull().references(() => claims.id, { onDelete: 'cascade' }),
  dst_claim: uuid('dst_claim').notNull().references(() => claims.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // supports | refines | contradicts | supersedes | depends_on
  scope: jsonb('scope'),
  status: text('status').notNull(), // proposed | accepted | dismissed
  recorded_at: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
  valid_from: timestamp('valid_from', { withTimezone: true }),
});

export const evidence = pgTable('evidence', {
  id: uuid('id').primaryKey().defaultRandom(),
  entry_id: uuid('entry_id').references(() => entries.id, { onDelete: 'cascade' }),
  span_id: uuid('span_id').references(() => spans.id),
  claim_id: uuid('claim_id').references(() => claims.id),
  kind: text('kind').notNull(), // url | commit | file | media | product
  url: text('url'),
  media_id: uuid('media_id'),
  verification: jsonb('verification'),
  verified_at: timestamp('verified_at', { withTimezone: true }),
});

export const mediaAssets = pgTable('media_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  entry_id: uuid('entry_id').references(() => entries.id, { onDelete: 'cascade' }),
  mime_type: text('mime_type').notNull(),
  uri: text('uri').notNull(),
  alt_text: text('alt_text'),
  caption: text('caption'),
  ocr_text: text('ocr_text'),
  transcript: jsonb('transcript'),
  duration_sec: integer('duration_sec'),
});

export const embeddingSets = pgTable('embedding_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  model_id: text('model_id').notNull(),
  model_version: text('model_version').notNull(),
  dim: integer('dim').notNull(),
  status: text('status').notNull(), // active | building | retired
});

export const chunkVectors = pgTable('chunk_vectors', {
  id: uuid('id').primaryKey().defaultRandom(),
  chunk_id: uuid('chunk_id').notNull().references(() => spans.id, { onDelete: 'cascade' }),
  embedding_set_id: uuid('embedding_set_id').notNull().references(() => embeddingSets.id),
  vector: vector('vector').notNull(),
  text_snippet: text('text_snippet').notNull(),
});

// Operational Tables (§9)
export const correctionLog = pgTable('correction_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  kind: text('kind'),
  role: text('role'),
  domain: text('domain'),
  machine_confidence: real('machine_confidence'),
  owner_action: text('owner_action').notNull(), // accept | reject | edit
  edit_distance: real('edit_distance'),
  at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
});

export const escalations = pgTable('escalations', {
  id: uuid('id').primaryKey().defaultRandom(),
  question: text('question').notNull(),
  query_class: text('query_class').notNull(),
  facets: jsonb('facets'),
  draft: text('draft'),
  final: text('final'),
  draft_edit_distance: real('draft_edit_distance'),
  citation_clicks: integer('citation_clicks').default(0),
  booked: boolean('booked').default(false),
  status: text('status').notNull(), // pending | approved | rejected | auto_refunded
  due_at: timestamp('due_at', { withTimezone: true }),
  status_token: text('status_token'),
  visitor_contact: text('visitor_contact'),
  rejection_reason: text('rejection_reason'),
  at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
});

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  topic: text('topic').notNull(),
  visitor_name: text('visitor_name'),
  visitor_contact: text('visitor_contact').notNull(),
  facets: jsonb('facets'),
  preferred_time: text('preferred_time'),
  notes: text('notes'),
  status: text('status').notNull().default('pending'),
  at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
});

export const calibrationChanges = pgTable('calibration_changes', {
  id: uuid('id').primaryKey().defaultRandom(),
  parameter: text('parameter').notNull(),
  old_value: real('old_value').notNull(),
  new_value: real('new_value').notNull(),
  evidence_count: integer('evidence_count').notNull(),
  applied_by: text('applied_by').notNull(), // system | owner
  reversible: boolean('reversible').default(true).notNull(),
  at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
});

export const topologyReports = pgTable('topology_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  claim_a: uuid('claim_a').notNull().references(() => claims.id),
  claim_b: uuid('claim_b').notNull().references(() => claims.id),
  confidence: real('confidence').notNull(),
  overlap: jsonb('overlap'),
  status: text('status').notNull(), // pending | resolved | dismissed
  at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
});

export const scopedConstraints = pgTable('scoped_constraints', {
  id: uuid('id').primaryKey().defaultRandom(),
  constraint: jsonb('constraint').notNull(),
  scope: jsonb('scope').notNull(),
  source_escalation: uuid('source_escalation').references(() => escalations.id),
  source_quote: text('source_quote'),
  status: text('status').notNull(), // proposed | confirmed | revoked
  at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
});

export const governorLedger = pgTable('governor_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider_id: text('provider_id').notNull(),
  day_utc: text('day_utc').notNull(),
  visitor_tokens: integer('visitor_tokens').notNull().default(0),
  owner_tokens: integer('owner_tokens').notNull().default(0),
  background_tokens: integer('background_tokens').notNull().default(0),
  requests_count: integer('requests_count').notNull().default(0),
  last_reset: timestamp('last_reset', { withTimezone: true }).defaultNow().notNull(),
  is_rate_limited_until: timestamp('is_rate_limited_until', { withTimezone: true }),
  effective_tpm_discount: real('effective_tpm_discount').notNull().default(1.0),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const importJobs = pgTable('import_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: text('status').notNull(), // pending | in_progress | completed | paused | failed
  total_documents: integer('total_documents').notNull().default(0),
  processed_count: integer('processed_count').notNull().default(0),
  failed_count: integer('failed_count').notNull().default(0),
  checkpoints: jsonb('checkpoints').notNull(),
  items: jsonb('items').notNull(),
  config: jsonb('config'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

