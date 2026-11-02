import type {
  EntryCreateInput,
  EntryUpdateInput,
  RevisionCreateInput,
  AnnotationUpdateInput,
  FacetUpsertInput,
  ClaimUpsertInput,
  RelationUpsertInput,
  EvidenceUpsertInput,
  AskQueryInput,
  BookingCreateInput,
  RoutingConfigInput,
  Entry,
  Revision,
  Facet,
  Claim,
  Relation,
  Evidence,
  Span,
} from '@living-portfolio/core';

export interface ClientOptions {
  /**
   * Root API URL or versioned path, e.g. "https://api.example.com" or "https://api.example.com/api/v1".
   * Can also be relative in the browser, e.g. "/api/v1".
   */
  baseUrl: string;
  token?: string;
  csrfToken?: string;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  timestamp: string;
  version: string;
  database: 'connected' | 'error';
  databaseKind: string;
  queue: {
    status: string;
    depth: number | null;
    activeWorkers: number | null;
  };
  backup: {
    lastBackup: string | null;
    lastRestoreTestStatus: string;
  };
  providers: {
    configured: string[];
    count: number;
    fallbackChain: string[];
    circuitStatus: Record<string, 'healthy' | 'tripped' | 'disabled'>;
  };
}

export interface AuthSetupResponse {
  configured: boolean;
  username: string;
  totpSecret: string;
  bearerToken: string;
}

export interface AuthLoginResponse {
  authenticated: boolean;
  csrfToken: string;
  username: string;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  username?: string;
  csrfToken?: string;
  setupRequired?: boolean;
}

export interface ApiBearerTokenRecord {
  id: string;
  label: string;
  tokenHash: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface EntrySummary {
  id: string;
  slug: string;
  title: string;
  profile: string;
  view: string;
  visibility: string;
  venture_id?: string | null;
  created_at: string;
  updated_at: string;
  structureLevel?: number;
  facets?: any[];
}

export interface EntryDetailResponse {
  entry: Entry;
  currentRevision: Revision | null;
  structureLevel: number;
  structureDetails?: any;
  gapQuestions?: string[];
  facets?: Facet[];
  evidence?: Evidence[];
}

export interface AskResponse {
  query_class: string;
  synthesis: string;
  citations: Array<{
    entry_id?: string;
    slug?: string;
    title?: string;
    span_id?: string;
    excerpt?: string;
  }>;
  citedScopes: string[];
  providerDisclosure: string;
  requiresEscalation: boolean;
  escalationToken?: string;
}

export interface TimelineBucket {
  yearMonth: string;
  count: number;
  entries: Array<{ id: string; slug: string; title: string; profile: string }>;
  profileCounts: Record<string, number>;
}

export interface TimelineResponse {
  strataBuckets: Record<string, TimelineBucket>;
  totalEntries: number;
}

export interface BookingResponse {
  booking: any;
  confirmed: boolean;
  message?: string;
}

export interface ClientError {
  error: string;
  status: number;
  details?: any;
}
