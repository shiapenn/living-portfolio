import type {
  Entry,
  Revision,
  Span,
  Facet,
  Claim,
  Evidence,
  Relation,
} from "@living-portfolio/core";

export interface WebDataClient {
  entries?: {
    list: (params?: any) => Promise<{ entries: Entry[] }>;
    get: (id: string, options?: any) => Promise<any>;
    getBySlug?: (slug: string, options?: any) => Promise<any>;
  };
  listEntries: (opts?: any) => Promise<Entry[]>;
  getEntry: (id: string, vis?: any) => Promise<{ entry: Entry; currentRevision?: Revision | null; revisions?: Revision[] } | null>;
  getEntryBySlug: (slug: string, vis?: any) => Promise<{ entry: Entry; currentRevision?: Revision | null; revisions?: Revision[] } | null>;
  listAcceptedRelations: () => Promise<Relation[]>;
  getFacetsForEntry: (id: string) => Promise<Facet[]>;
  getSpans: (revId: string) => Promise<Span[]>;
  getClaimsForRevision: (revId: string) => Promise<Claim[]>;
  getEvidenceForEntry: (id: string) => Promise<Evidence[]>;
  listAnnotationsForRevision: (revId: string) => Promise<any[]>;
  getRevisions: (id: string) => Promise<Revision[]>;
  listVentures: () => Promise<any[]>;
  getEscalationByStatusToken: (token: string) => Promise<any>;
  getEscalations: () => Promise<any[]>;
  getScopedConstraints: () => Promise<any[]>;
  structure?: any;
  timeline?: any;
  inbox?: any;
  settings?: any;
}

/**
 * Normalizes input data source to standard client / repository methods.
 * Supports LivingPortfolioClient directly over HTTP/fetch, and provides
 * backward compatibility for existing in-memory tests without requiring @living-portfolio/db imports.
 */
export function adaptDataSource(source: any): WebDataClient {
  if (!source) return source;

  // If source already implements listEntries, it is already a repository or WebDataClient!
  if (typeof source.listEntries === 'function') {
    if (typeof source.listVentures !== 'function') {
      source.listVentures = async () => [];
    }
    if (typeof source.getEscalations !== 'function') {
      source.getEscalations = async () => [];
    }
    if (typeof source.getScopedConstraints !== 'function') {
      source.getScopedConstraints = async () => [];
    }
    if (typeof source.getEscalationByStatusToken !== 'function') {
      source.getEscalationByStatusToken = async () => null;
    }
    return source;
  }

  // If source already has .entries.list, it's a LivingPortfolioClient!
  if (source.entries && typeof source.entries.list === 'function') {
    return {
      ...source,
      listEntries: async (opts?: any) => {
        const res = await source.entries.list(opts);
        return res?.entries || [];
      },
      getEntry: async (id: string, vis?: any) => {
        const res = await source.entries.get(id);
        if (!res) return null;
        return {
          entry: res.entry || res,
          currentRevision: res.revision || res.currentRevision || null,
          revisions: res.revisions || [],
        };
      },
      getEntryBySlug: async (slug: string, vis?: any) => {
        const res = source.entries.getBySlug ? await source.entries.getBySlug(slug) : await source.entries.get(slug);
        if (!res) return null;
        return {
          entry: res.entry || res,
          currentRevision: res.revision || res.currentRevision || null,
          revisions: res.revisions || [],
        };
      },
      listAcceptedRelations: async () => {
        if (typeof source.listAcceptedRelations === 'function') return source.listAcceptedRelations();
        if (typeof source.structure?.relations === 'function') {
          const res = await source.structure.relations();
          return res?.relations || [];
        }
        if (typeof source.structure?.listRelations === 'function') {
          const res = await source.structure.listRelations();
          return res?.relations || [];
        }
        return [];
      },
      getFacetsForEntry: async (id: string) => {
        if (typeof source.getFacetsForEntry === 'function') return source.getFacetsForEntry(id);
        if (typeof source.structure?.getFacets === 'function') {
          try {
            const res = await source.structure.getFacets(id);
            return res?.facets || [];
          } catch {}
        }
        return [];
      },
      getSpans: async (revId: string) => {
        if (typeof source.getSpans === 'function') return source.getSpans(revId);
        if (typeof source.structure?.getSpans === 'function') {
          try {
            const res = await source.structure.getSpans(revId);
            return res?.spans || [];
          } catch {}
        }
        return [];
      },
      getClaimsForRevision: async (revId: string) => {
        if (typeof source.getClaimsForRevision === 'function') return source.getClaimsForRevision(revId);
        return [];
      },
      getEvidenceForEntry: async (id: string) => {
        if (typeof source.getEvidenceForEntry === 'function') return source.getEvidenceForEntry(id);
        if (typeof source.structure?.getEvidence === 'function') {
          try {
            const res = await source.structure.getEvidence(id);
            return res?.evidence || [];
          } catch {}
        }
        return [];
      },
      listAnnotationsForRevision: async (revId: string) => {
        if (typeof source.listAnnotationsForRevision === 'function') return source.listAnnotationsForRevision(revId);
        return [];
      },
      getRevisions: async (id: string) => {
        if (typeof source.getRevisions === 'function') return source.getRevisions(id);
        const res = await source.entries.get(id);
        return res?.revisions || [];
      },
      listVentures: async () => {
        if (typeof source.listVentures === 'function') return source.listVentures();
        if (typeof source.timeline?.ventures === 'function') {
          const res = await source.timeline.ventures();
          return res?.ventures || [];
        }
        return [];
      },
      getEscalationByStatusToken: async (token: string) => {
        if (typeof source.getEscalationByStatusToken === 'function') return source.getEscalationByStatusToken(token);
        if (typeof source.inbox?.escalations?.get === 'function') {
          const res = await source.inbox.escalations.get(token);
          return res?.escalation || null;
        }
        return null;
      },
      getEscalations: async () => {
        if (typeof source.getEscalations === 'function') return source.getEscalations();
        if (typeof source.inbox?.escalations?.list === 'function') {
          const res = await source.inbox.escalations.list();
          return res?.escalations || [];
        }
        return [];
      },
      getScopedConstraints: async () => {
        if (typeof source.getScopedConstraints === 'function') return source.getScopedConstraints();
        if (typeof source.structure?.constraints === 'function') {
          const res = await source.structure.constraints();
          return res?.constraints || [];
        }
        return [];
      },
    };
  }

  return source;
}
