export type Visibility = 'private' | 'unlisted' | 'public';
export type EntryView = 'article' | 'structured';
export type TemporalLevel = 'exact' | 'range' | 'estimated';
export type AnnotationSource = 'machine' | 'owner';
export type AnnotationStatus = 'suggested' | 'accepted' | 'rejected';
export type FacetSource = 'machine' | 'owner';
export type FacetStatus = 'suggested' | 'confirmed' | 'rejected';

export type ClaimKind = 'lesson' | 'decision' | 'outcome' | 'finding' | 'fact';
export type OutcomeStatus = 'worked' | 'partly' | 'failed' | 'unresolved' | 'unknown';
export type ClaimSource = 'machine' | 'owner';
export type ClaimStatus = 'suggested' | 'accepted' | 'rejected';

export type RelationType = 'supports' | 'refines' | 'contradicts' | 'supersedes' | 'depends_on';
export type RelationStatus = 'proposed' | 'accepted' | 'dismissed';

export type EvidenceKind = 'url' | 'commit' | 'file' | 'media' | 'product';
export type StructureLevel = 'L0' | 'L1' | 'L2' | 'L3';

export type QueryClass = 'lookup' | 'advisory' | 'about';
export type GateResult = 'PASS' | 'FAIL' | 'INDETERMINATE';
export type RoutingTier = 'tier1' | 'tier2' | 'tier3' | 'no_match' | 'extractive';

export type DataClass = 'public' | 'unpublished' | 'private' | 'sensitive';
export type DegradationStep = 
  | 'normal'
  | 'cached'
  | 'fallback_provider'
  | 'smaller_model'
  | 'extractive'
  | 'handoff';

export interface Venture {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  status: 'idea' | 'building' | 'live' | 'maintained' | 'sunset';
  links?: Record<string, string> | null;
  started_at?: string | null;
  facets?: Record<string, any> | null;
}

export interface Entry {
  id: string;
  slug: string;
  title: string;
  profile: string;
  view: EntryView;
  visibility: Visibility;
  venture_id?: string | null;
  current_revision_id?: string | null;
  created_at: string;
}

export interface EntryRevision {
  id: string;
  entry_id: string;
  body_md: string;
  body_hash: string;
  written_at: string; // transaction time
  valid_from?: string | null; // event time start
  valid_to?: string | null; // event time end (null if ongoing)
  temporal_level: TemporalLevel;
  valid_from_range_end?: string | null;
  is_hindsight: boolean;
}

export interface Span {
  id: string;
  revision_id: string;
  ordinal: number;
  start_off: number;
  end_off: number;
  text_exact: string;
  prefix?: string | null;
  suffix?: string | null;
  token_count: number;
}

export interface Annotation {
  id: string;
  span_id: string;
  role: string;
  profile: string;
  source: AnnotationSource;
  status: AnnotationStatus;
  confidence?: number | null;
  created_at: string;
}

export interface Facet {
  id: string;
  entry_id: string;
  revision_id?: string | null;
  key: string;
  value: any;
  source: FacetSource;
  status: FacetStatus;
  confidence?: number | null;
  source_span_id?: string | null;
}

export interface Claim {
  id: string;
  revision_id: string;
  text: string;
  kind: ClaimKind;
  outcome_status?: OutcomeStatus | null;
  scope?: Record<string, any> | null;
  valid_from?: string | null;
  valid_to?: string | null;
  recorded_at: string;
  temporal_level?: TemporalLevel | null;
  is_hindsight: boolean;
  source_span_id?: string | null;
  source: ClaimSource;
  status: ClaimStatus;
}

export interface Relation {
  id: string;
  src_claim: string;
  dst_claim: string;
  type: RelationType;
  scope?: Record<string, any> | null;
  status: RelationStatus;
  recorded_at: string;
  valid_from?: string | null;
}

export interface Evidence {
  id: string;
  entry_id?: string | null;
  span_id?: string | null;
  claim_id?: string | null;
  kind: EvidenceKind;
  url?: string | null;
  media_id?: string | null;
  verification?: Record<string, any> | null;
  verified_at?: string | null;
}

export interface MediaAsset {
  id: string;
  entry_id?: string | null;
  mime_type: string;
  uri: string;
  alt_text?: string | null;
  caption?: string | null;
  ocr_text?: string | null;
  transcript?: any | null;
  duration_sec?: number | null;
}

export interface EmbeddingSet {
  id: string;
  model_id: string;
  model_version: string;
  dim: number;
  status: 'active' | 'building' | 'retired';
}

export interface CorrectionLog {
  id: string;
  kind: string;
  role?: string | null;
  domain?: string | null;
  machine_confidence?: number | null;
  owner_action: 'accept' | 'reject' | 'edit';
  edit_distance?: number | null;
  at: string;
}

export interface Escalation {
  id: string;
  question: string;
  query_class: QueryClass;
  facets?: Record<string, any> | null;
  draft?: string | null;
  final?: string | null;
  draft_edit_distance?: number | null;
  citation_clicks?: number;
  booked?: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'auto_refunded';
  due_at?: string | null;
  at: string;
}

export interface CalibrationChange {
  id: string;
  parameter: string;
  old_value: number;
  new_value: number;
  evidence_count: number;
  applied_by: 'system' | 'owner';
  reversible: boolean;
  at: string;
}

export interface TopologyReport {
  id: string;
  claim_a: string;
  claim_b: string;
  confidence: number;
  overlap?: Record<string, any> | null;
  status: 'pending' | 'resolved' | 'dismissed';
  at: string;
}

export interface ScopedConstraint {
  id: string;
  constraint: Record<string, any>;
  scope: Record<string, any>;
  source_escalation?: string | null;
  source_quote?: string | null;
  status: 'proposed' | 'confirmed' | 'revoked';
  at: string;
}

export interface RoleDefinition {
  id: string;
  label: string;
  prompt: string;
  claim_bearing?: boolean;
  structured?: 'outcome_status' | string;
}

export interface RoleProfile {
  id: string;
  label: string;
  roles: RoleDefinition[];
  evidence?: string;
  context?: string;
  minimum_for_L2: string[][];
}

export interface DomainConfig {
  id: string;
  name: string;
  hard_facets: string[];
  soft_facets: string[];
  facet_weight: Record<string, number>;
}
