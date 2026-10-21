import { z } from 'zod';

export const VisibilitySchema = z.enum(['private', 'unlisted', 'public']);
export const EntryViewSchema = z.enum(['article', 'structured']);
export const TemporalLevelSchema = z.enum(['exact', 'range', 'estimated']);
export const AnnotationSourceSchema = z.enum(['machine', 'owner']);
export const AnnotationStatusSchema = z.enum(['suggested', 'accepted', 'rejected']);
export const FacetStatusSchema = z.enum(['suggested', 'confirmed', 'rejected']);
export const ClaimKindSchema = z.enum(['lesson', 'decision', 'outcome', 'finding', 'fact']);
export const OutcomeStatusSchema = z.enum(['worked', 'partly', 'failed', 'unresolved', 'unknown']);
export const RelationTypeSchema = z.enum(['supports', 'refines', 'contradicts', 'supersedes', 'depends_on']);
export const RelationStatusSchema = z.enum(['proposed', 'accepted', 'dismissed']);
export const EvidenceKindSchema = z.enum(['url', 'commit', 'file', 'media', 'product']);
export const QueryClassSchema = z.enum(['lookup', 'advisory', 'about']);
export const DataClassSchema = z.enum(['public', 'unpublished', 'private', 'sensitive']);

export const EntryCreateSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  profile: z.string().default('case-study'),
  view: EntryViewSchema.default('article'),
  visibility: VisibilitySchema.default('private'),
  venture_id: z.string().uuid().nullable().optional(),
  body_md: z.string().trim().min(1, 'Body content cannot be empty or whitespace'),
  valid_from: z.string().datetime().nullable().optional(),
  valid_to: z.string().datetime().nullable().optional(),
  temporal_level: TemporalLevelSchema.default('estimated'),
  valid_from_range_end: z.string().datetime().nullable().optional(),
  is_hindsight: z.boolean().default(false),
  redactionPreviewToken: z.string().optional(),
});

export const EntryUpdateSchema = z.object({
  profile: z.string().optional(),
  view: EntryViewSchema.optional(),
  visibility: VisibilitySchema.optional(),
  venture_id: z.string().uuid().nullable().optional(),
  redactionPreviewToken: z.string().optional(),
});

export const RevisionCreateSchema = z.object({
  entry_id: z.string().uuid(),
  body_md: z.string().trim().min(1, 'Body content cannot be empty or whitespace'),
  valid_from: z.string().datetime().nullable().optional(),
  valid_to: z.string().datetime().nullable().optional(),
  temporal_level: TemporalLevelSchema.default('estimated'),
  valid_from_range_end: z.string().datetime().nullable().optional(),
  is_hindsight: z.boolean().default(false),
});

export const AnnotationUpdateSchema = z.object({
  role: z.string().optional(),
  status: AnnotationStatusSchema,
});

export const FacetUpsertSchema = z.object({
  entry_id: z.string().uuid(),
  revision_id: z.string().uuid().nullable().optional(),
  key: z.string().min(1),
  value: z.any(),
  source: z.enum(['machine', 'owner']).default('owner'),
  status: FacetStatusSchema.default('confirmed'),
  confidence: z.number().min(0).max(1).nullable().optional(),
  source_span_id: z.string().uuid().nullable().optional(),
});

export const ClaimUpsertSchema = z.object({
  revision_id: z.string().uuid(),
  text: z.string().min(1),
  kind: ClaimKindSchema,
  outcome_status: OutcomeStatusSchema.nullable().optional(),
  scope: z.record(z.any()).nullable().optional(),
  valid_from: z.string().datetime().nullable().optional(),
  valid_to: z.string().datetime().nullable().optional(),
  temporal_level: TemporalLevelSchema.nullable().optional(),
  is_hindsight: z.boolean().default(false),
  source_span_id: z.string().uuid().nullable().optional(),
  source: z.enum(['machine', 'owner']).default('owner'),
  status: z.enum(['suggested', 'accepted', 'rejected']).default('accepted'),
});

export const RelationUpsertSchema = z.object({
  src_claim: z.string().uuid(),
  dst_claim: z.string().uuid(),
  type: RelationTypeSchema,
  scope: z.record(z.any()).nullable().optional(),
  status: RelationStatusSchema.default('proposed'),
  valid_from: z.string().datetime().nullable().optional(),
});

export const EvidenceUpsertSchema = z.object({
  entry_id: z.string().uuid().nullable().optional(),
  span_id: z.string().uuid().nullable().optional(),
  claim_id: z.string().uuid().nullable().optional(),
  kind: EvidenceKindSchema,
  url: z.string().url().nullable().optional(),
  media_id: z.string().uuid().nullable().optional(),
  verification: z.record(z.any()).nullable().optional(),
  verified_at: z.string().datetime().nullable().optional(),
});

export const AskQuerySchema = z.object({
  query: z.string().min(1),
  as_of_date: z.string().datetime().nullable().optional(),
  facets: z.record(z.any()).optional().default({}),
  session_id: z.string().optional(),
  scope_entry_slug: z.string().optional(), // for scoped "Ask about this"
});

export const RoutingConfigSchema = z.object({
  tier1_floor: z.number().min(0).max(1).default(0.82),
  tier2_floor: z.number().min(0).max(1).default(0.55),
  facet_known_threshold: z.number().min(0).max(1).default(0.9),
  lookup_threshold: z.number().min(0).max(1).default(0.70),
  w1: z.number().default(1.0),
  w2: z.number().default(0.5),
  w3: z.number().default(0.5),
});

export type EntryCreateInput = z.infer<typeof EntryCreateSchema>;
export type EntryUpdateInput = z.infer<typeof EntryUpdateSchema>;
export type RevisionCreateInput = z.infer<typeof RevisionCreateSchema>;
export type AskQueryInput = z.infer<typeof AskQuerySchema>;
export type RoutingConfigInput = z.infer<typeof RoutingConfigSchema>;
