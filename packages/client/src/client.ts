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
} from '@living-portfolio/core';
import type {
  ClientOptions,
  HealthResponse,
  AuthSetupResponse,
  AuthConfirmTotpResponse,
  AuthLoginResponse,
  AuthSessionResponse,
  ApiBearerTokenRecord,
  EntryDetailResponse,
  AskResponse,
  TimelineResponse,
  BookingResponse,
  PublishStatusResponse,
  PublishNowResponse,
} from './types.js';

export class LivingPortfolioClient {
  private baseApiUrl: string;
  private token?: string;
  private csrfToken?: string;
  private customFetch: typeof fetch;
  private defaultHeaders: Record<string, string>;

  constructor(options: ClientOptions) {
    let rawUrl = (options.baseUrl || '').trim();
    while (rawUrl.endsWith('/')) {
      rawUrl = rawUrl.slice(0, -1);
    }
    if (!rawUrl) {
      this.baseApiUrl = '/api/v1';
    } else if (rawUrl.endsWith('/api/v1')) {
      this.baseApiUrl = rawUrl;
    } else if (rawUrl.endsWith('/api')) {
      this.baseApiUrl = `${rawUrl}/v1`;
    } else {
      this.baseApiUrl = `${rawUrl}/api/v1`;
    }

    this.token = options.token;
    this.csrfToken = options.csrfToken;
    this.customFetch = options.fetch || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : (undefined as any));
    this.defaultHeaders = options.headers || {};
  }

  public setToken(token: string | undefined): void {
    this.token = token;
  }

  public setCsrfToken(csrf: string | undefined): void {
    this.csrfToken = csrf;
  }

  public getBaseUrl(): string {
    return this.baseApiUrl;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${this.baseApiUrl}${cleanPath}`;

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...this.defaultHeaders,
      ...(init?.headers as Record<string, string>),
    };

    if (init?.body && typeof init.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.csrfToken && !headers['X-CSRF-Token']) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    const reqInit: RequestInit = {
      ...init,
      headers,
    };

    let response: Response;
    try {
      response = await this.customFetch(url, reqInit);
    } catch (err: any) {
      if (typeof Request !== 'undefined') {
        const req = new Request(url, reqInit);
        response = await this.customFetch(req as any);
      } else {
        throw err;
      }
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      let errorBody: any = null;
      if (isJson) {
        try {
          errorBody = await response.json();
          if (errorBody && errorBody.error) {
            errorMessage = errorBody.error;
          }
        } catch {}
      } else {
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch {}
      }

      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.body = errorBody;
      throw error;
    }

    if (isJson) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  }

  // --- Health & System ---
  public async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  public async getOpenApiSpec(): Promise<any> {
    return this.request<any>('/openapi.json');
  }

  // --- Authentication Submodule ---
  public auth = {
    setup: (body: { username: string; password: string; totpSecret?: string }): Promise<AuthSetupResponse> =>
      this.request<AuthSetupResponse>('/auth/setup', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    confirmTotp: (body: { code: string }): Promise<AuthConfirmTotpResponse> =>
      this.request<AuthConfirmTotpResponse>('/auth/totp/confirm', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    login: (body: { username: string; password: string; totpCode?: string }): Promise<AuthLoginResponse> =>
      this.request<AuthLoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    logout: (): Promise<{ loggedOut: boolean }> =>
      this.request<{ loggedOut: boolean }>('/auth/logout', {
        method: 'POST',
      }),

    session: (options?: { headers?: Record<string, string> }): Promise<AuthSessionResponse> =>
      this.request<AuthSessionResponse>('/auth/session', {
        method: 'GET',
        headers: options?.headers,
      }),

    listTokens: (): Promise<{ tokens: ApiBearerTokenRecord[] }> =>
      this.request<{ tokens: ApiBearerTokenRecord[] }>('/auth/tokens', {
        method: 'GET',
      }),

    issueToken: (label?: string): Promise<{ token: string; id: string; label: string; createdAt: string }> =>
      this.request('/auth/tokens', {
        method: 'POST',
        body: JSON.stringify({ label }),
      }),

    revokeToken: (id: string): Promise<{ revoked: boolean; id: string }> =>
      this.request(`/auth/tokens/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  };

  // --- Entries Submodule ---
  public entries = {
    list: (params?: { visibility?: string; venture_id?: string; as_of?: string }): Promise<{ entries: any[] }> => {
      const q = new URLSearchParams();
      if (params?.visibility) q.set('visibility', params.visibility);
      if (params?.venture_id) q.set('venture_id', params.venture_id);
      if (params?.as_of) q.set('as_of', params.as_of);
      const qs = q.toString();
      return this.request<{ entries: any[] }>(`/entries${qs ? `?${qs}` : ''}`);
    },

    get: (id: string, options?: { view?: string; as_of?: string }): Promise<EntryDetailResponse> => {
      const q = new URLSearchParams();
      if (options?.view) q.set('view', options.view);
      if (options?.as_of) q.set('as_of', options.as_of);
      const qs = q.toString();
      return this.request<EntryDetailResponse>(`/entries/${encodeURIComponent(id)}${qs ? `?${qs}` : ''}`);
    },

    getBySlug: (slug: string, options?: { view?: string; as_of?: string }): Promise<EntryDetailResponse> => {
      return this.entries.get(slug, options);
    },

    create: (body: EntryCreateInput): Promise<{ entry: any; revision: any; structureLevel: number }> =>
      this.request('/entries', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    update: (id: string, body: EntryUpdateInput): Promise<{ entry: any }> =>
      this.request(`/entries/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    delete: (id: string): Promise<{ ok: boolean; deleted: boolean }> =>
      this.request(`/entries/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),

    listRevisions: (id: string): Promise<{ revisions: any[] }> =>
      this.request(`/entries/${encodeURIComponent(id)}/revisions`),

    createRevision: (
      id: string,
      body: Omit<RevisionCreateInput, 'entry_id'>
    ): Promise<{ revision: any; structureLevel: number }> =>
      this.request(`/entries/${encodeURIComponent(id)}/revisions`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    scanRedactions: (id: string): Promise<{ clean: boolean; warnings: any[]; previewToken: string }> =>
      this.request(`/entries/${encodeURIComponent(id)}/redaction-scan`, {
        method: 'POST',
      }),

    previewRedactions: (body: { body_md: string; entryId?: string }): Promise<{
      previewToken: string;
      warningsCount: number;
      warnings: any[];
    }> =>
      this.request('/entries/redaction-preview', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    quickLog: (body: { body_md: string; valid_from?: string; profile?: string }): Promise<{ entry: any; revision: any }> =>
      this.request('/entries/quick-log', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    applyRedact: (
      id: string,
      body: { body_md: string; redactionPreviewToken?: string }
    ): Promise<{ ok: boolean; maskedBody: string; appliedCount: number }> =>
      this.request(`/entries/${encodeURIComponent(id)}/redact`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    publish: (
      id: string,
      body?: { redactionPreviewToken?: string; nda_confirmed?: boolean }
    ): Promise<{ entry: any; published: boolean }> =>
      this.request(`/entries/${encodeURIComponent(id)}/publish`, {
        method: 'POST',
        body: JSON.stringify(body || {}),
      }),

    archive: (id: string): Promise<{ entry: any; archived: boolean }> =>
      this.request(`/entries/${encodeURIComponent(id)}/archive`, {
        method: 'POST',
      }),
  };

  // --- Ask Submodule ---
  public ask = {
    query: (body: AskQueryInput): Promise<AskResponse> =>
      this.request<AskResponse>('/ask', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    feedback: (body: { query_id: string; rating: 'helpful' | 'unhelpful'; notes?: string }): Promise<{ recorded: boolean }> =>
      this.request('/ask/feedback', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    getStatus: (token: string): Promise<any> =>
      this.request(`/ask/status/${encodeURIComponent(token)}`),
  };

  // --- Strata Timeline Submodule ---
  public timeline = {
    get: (params?: { as_of?: string }): Promise<TimelineResponse> => {
      const q = new URLSearchParams();
      if (params?.as_of) q.set('as_of', params.as_of);
      const qs = q.toString();
      return this.request<TimelineResponse>(`/timeline${qs ? `?${qs}` : ''}`);
    },
  };

  // --- Book Consultations Submodule ---
  public book = {
    create: (body: BookingCreateInput): Promise<BookingResponse> =>
      this.request<BookingResponse>('/book', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    list: (): Promise<{ bookings: any[] }> =>
      this.request<{ bookings: any[] }>('/book', {
        method: 'GET',
      }),
  };

  // --- Structure & Knowledge Graph Submodule ---
  public structure = {
    getFacets: (entryId: string): Promise<{ facets: any[] }> =>
      this.request(`/structure/entries/${encodeURIComponent(entryId)}/facets`),

    createFacet: (body: FacetUpsertInput): Promise<{ facet: any }> =>
      this.request('/structure/facets', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    updateFacet: (id: string, body: Partial<FacetUpsertInput>): Promise<{ facet: any }> =>
      this.request(`/structure/facets/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    deleteFacet: (id: string): Promise<{ ok: boolean; deleted: boolean }> =>
      this.request(`/structure/facets/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),

    getEvidence: (entryId: string): Promise<{ evidence: any[] }> =>
      this.request(`/structure/entries/${encodeURIComponent(entryId)}/evidence`),

    createEvidence: (body: EvidenceUpsertInput): Promise<{ evidence: any }> =>
      this.request('/structure/evidence', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    deleteEvidence: (id: string): Promise<{ ok: boolean; deleted: boolean }> =>
      this.request(`/structure/evidence/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),

    getSpans: (revisionId: string): Promise<{ spans: any[] }> =>
      this.request(`/structure/revisions/${encodeURIComponent(revisionId)}/spans`),

    createAnnotation: (body: AnnotationUpdateInput & { span_id: string }): Promise<{ annotation: any }> =>
      this.request('/structure/annotations', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    updateAnnotation: (id: string, body: AnnotationUpdateInput): Promise<{ annotation: any }> =>
      this.request(`/structure/annotations/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    createClaim: (body: ClaimUpsertInput): Promise<{ claim: any }> =>
      this.request('/structure/claims', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    updateClaim: (id: string, body: Partial<ClaimUpsertInput>): Promise<{ claim: any }> =>
      this.request(`/structure/claims/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    deleteClaim: (id: string): Promise<{ ok: boolean; deleted: boolean }> =>
      this.request(`/structure/claims/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),

    createRelation: (body: RelationUpsertInput): Promise<{ relation: any }> =>
      this.request('/structure/relations', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    deleteRelation: (id: string): Promise<{ ok: boolean; deleted: boolean }> =>
      this.request(`/structure/relations/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  };

  // --- Inbox Submodule ---
  public inbox = {
    list: (params?: { status?: string }): Promise<{ items: any[] }> => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      const qs = q.toString();
      return this.request<{ items: any[] }>(`/inbox${qs ? `?${qs}` : ''}`);
    },

    create: (body: { type: string; title: string; body: string; payload?: any }): Promise<{ item: any }> =>
      this.request('/inbox', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    approve: (id: string): Promise<{ approved: boolean; item: any }> =>
      this.request(`/inbox/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
      }),

    reject: (id: string): Promise<{ rejected: boolean; item: any }> =>
      this.request(`/inbox/${encodeURIComponent(id)}/reject`, {
        method: 'POST',
      }),
  };

  // --- Calibration Submodule ---
  public calibration = {
    get: (): Promise<any> => this.request('/calibration'),
    update: (body: any): Promise<any> =>
      this.request('/calibration', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  };

  // --- Audit Submodule ---
  public audit = {
    get: (): Promise<any> => this.request('/audit'),
    run: (body?: any): Promise<any> =>
      this.request('/audit', {
        method: 'POST',
        body: JSON.stringify(body || {}),
      }),
    getTopologyConflicts: (): Promise<any> => this.request('/audit/topology-conflicts'),
  };

  // --- Import Submodule ---
  public import = {
    plan: (body: { source: string; payload: any }): Promise<{ plan_id: string; itemsCount: number; items: any[] }> =>
      this.request('/import/plan', {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    batch: (body: { plan_id: string; approved_items: string[] }): Promise<{ imported: number; errors: any[] }> =>
      this.request('/import/batch', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  };

  // --- Settings Submodule ---
  public settings = {
    get: (): Promise<any> => this.request('/settings'),

    updateRouting: (body: RoutingConfigInput): Promise<{ ok: boolean; routing: any }> =>
      this.request('/settings/routing', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    updateTheme: (body: { theme: any }): Promise<{ ok: boolean; theme: any }> =>
      this.request('/settings/theme', {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    testNotification: (body?: { adapter?: string }): Promise<{ ok: boolean; sent: boolean }> =>
      this.request('/settings/notifications/test', {
        method: 'POST',
        body: JSON.stringify(body || {}),
      }),

    runBackupDrill: (): Promise<{ ok: boolean; message: string }> =>
      this.request('/settings/backups/run-drill', {
        method: 'POST',
      }),

    confirmConstraint: (id: string): Promise<{ confirmed: boolean }> =>
      this.request(`/settings/constraints/${encodeURIComponent(id)}/confirm`, {
        method: 'PATCH',
      }),

    discardConstraint: (id: string): Promise<{ discarded: boolean }> =>
      this.request(`/settings/constraints/${encodeURIComponent(id)}/discard`, {
        method: 'PATCH',
      }),
  };

  // --- Dual-write Shadow Metrics Submodule ---
  public metrics = {
    getShadowMetrics: (): Promise<{ ok: boolean; mode: string; metrics: any }> =>
      this.request('/admin/metrics/shadow'),

    resetShadowMetrics: (): Promise<{ ok: boolean; reset: boolean }> =>
      this.request('/admin/metrics/shadow/reset', { method: 'POST' }),

    verifyShadowParity: (): Promise<{ ok: boolean; parity: any }> =>
      this.request('/admin/metrics/shadow/parity'),
  };

  // --- Publish & Static Rebuild (§13.7, UX-05) ---
  public publish = {
    status: (): Promise<PublishStatusResponse> =>
      this.request('/publish/status'),

    now: (): Promise<PublishNowResponse> =>
      this.request('/publish/now', { method: 'POST' }),

    enrich: (entryId: string, revisionId?: string): Promise<{ ok: boolean; queued: boolean; entryId: string }> =>
      this.request('/publish/enrich', {
        method: 'POST',
        body: JSON.stringify({ entryId, revisionId }),
      }),

    enrichStatus: (entryId: string): Promise<{ entryId: string; queued: boolean }> =>
      this.request(`/publish/enrich/status/${entryId}`),
  };

  // --- Seed Demo ---
  public async seedDemo(): Promise<{ seeded: boolean; entriesCount: number }> {
    return this.request('/seed', { method: 'POST' });
  }
}

export function createLivingPortfolioClient(options: ClientOptions): LivingPortfolioClient {
  return new LivingPortfolioClient(options);
}
