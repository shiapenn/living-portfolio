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
  ObservabilityMetrics,
  ObservabilityAlert,
  BudgetUtilization,
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
    alert?: string;
  };
  providers: {
    status?: string;
    active?: string[];
    configured?: string[];
    count?: number;
    fallbackChain?: string[];
    circuitStatus?: Record<string, 'healthy' | 'tripped' | 'disabled'>;
    utilization?: BudgetUtilization[];
  };
  monitoring?: {
    metrics: ObservabilityMetrics;
    alerts: ObservabilityAlert[];
  };
}

export interface AuthSetupResponse {
  configured: boolean;
  username: string;
  totpSecret: string;
  totpSecretBase32?: string;
  otpauthUri?: string;
  qrCodeSvg?: string;
  bearerToken: string;
}

export interface AuthConfirmTotpResponse {
  ok: boolean;
  message?: string;
  authenticated?: boolean;
  username?: string;
  csrfToken?: string;
  expiresAt?: string;
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
  query_class?: string;
  queryClass?: string;
  tier?: string;
  answer?: string;
  synthesis?: string;
  citations: Array<{
    citationId?: number;
    entry_id?: string;
    slug?: string;
    title?: string;
    span_id?: string;
    text?: string;
    excerpt?: string;
  }>;
  citedScopes: Array<Record<string, any> | string>;
  isReconstruction?: boolean;
  reconstructionNotice?: string;
  strippedAssertions?: string[];
  verificationPassed?: boolean;
  degradationStep?: string;
  providerDisclosure?: string;
  provider_disclosure?: string;
  aiDisclosure?: string;
  requiresEscalation?: boolean;
  escalationToken?: string;
  statusToken?: string;
  receiptUrl?: string;
  dueAt?: string;
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

export interface PublishStatusResponse {
  status: 'idle' | 'queued' | 'building' | 'live' | 'cap_reached';
  state: 'idle' | 'queued' | 'building' | 'live' | 'cap_reached';
  buildsToday: number;
  maxBuildsPerDay: number;
  debounceMinutes: number;
  lastBuildTime: string | null;
  nextAllowedBuildTime: string | null;
  minutesRemaining: number;
  secondsRemaining: number;
  lastBuildResult?: any;
}

export interface PublishNowResponse {
  ok: boolean;
  built: boolean;
  reason?: string;
  buildsToday: number;
  bundleSummary?: any;
  status: PublishStatusResponse;
}

export interface ClientError {
  error: string;
  status: number;
  details?: any;
}
