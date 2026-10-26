import type { DegradationStep } from '@living-portfolio/core';

export interface CachedAnswerPayload {
  tier: string;
  queryClass: string;
  answer: string;
  citations: any[];
  contextChips?: string[];
  degradationStep: DegradationStep;
  provider_disclosure?: string;
  aiDisclosure?: string;
}

export interface CachedAnswerRecord {
  id: string;
  normalizedQuestion: string;
  asOfDate: string | null;
  facetsKey: string;
  revisionsKey: string;
  citedRevisionIds: string[];
  citedClaimIds: string[];
  payload: CachedAnswerPayload;
  cachedAt: number;
}

export function normalizeQuestion(q: string): string {
  let s = q.toLowerCase().trim();
  const punct = new Set(['?', '!', '.', ',', ';', ':']);
  while (s.length > 0 && punct.has(s[s.length - 1])) {
    s = s.slice(0, -1).trimEnd();
  }
  return s.split(/\s+/).filter(Boolean).join(' ');
}

export function computeFacetsKey(facets?: Record<string, any>): string {
  if (!facets || Object.keys(facets).length === 0) return '{}';
  const sortedKeys = Object.keys(facets).sort();
  const sortedObj: Record<string, any> = {};
  for (const k of sortedKeys) {
    if (facets[k] !== undefined) {
      sortedObj[k] = facets[k];
    }
  }
  return JSON.stringify(sortedObj);
}

export function computeRevisionsKey(revisions: string[]): string {
  return [...revisions].sort().join(',');
}

export function normalizeAsOfDate(asOf?: string | Date | null): string | null {
  if (!asOf) return null;
  if (asOf instanceof Date) return asOf.toISOString().slice(0, 10);
  return asOf.slice(0, 10);
}

/**
 * Answer Cache for Degradation Ladder Step 2 (§10.8).
 *
 * Rules:
 * - Serves cached answer when normalized question, set of cited entry revisions,
 *   visitor facets, and as-of date all match.
 * - Only answers built exclusively from public entries are cached.
 * - Time-travel answers are cached only under their specific "as of" date.
 * - Invalidated when any cited revision changes or an accepted relation touches a cited claim.
 */
export class AnswerCache {
  private cache = new Map<string, CachedAnswerRecord>();

  private makeKey(
    normQ: string,
    revisionsKey: string,
    facetsKey: string,
    asOfDateStr: string | null
  ): string {
    return `${normQ}::${revisionsKey}::${facetsKey}::${asOfDateStr ?? 'live'}`;
  }

  get(
    question: string,
    citedRevisionIds: string[],
    visitorFacets?: Record<string, any>,
    asOfDate?: string | Date | null
  ): CachedAnswerPayload | null {
    if (citedRevisionIds.length === 0) return null;
    const normQ = normalizeQuestion(question);
    const revisionsKey = computeRevisionsKey(citedRevisionIds);
    const facetsKey = computeFacetsKey(visitorFacets);
    const asOfDateStr = normalizeAsOfDate(asOfDate);

    const key = this.makeKey(normQ, revisionsKey, facetsKey, asOfDateStr);
    const record = this.cache.get(key);
    if (!record) return null;

    return {
      ...structuredClone(record.payload),
      degradationStep: 'cached',
    };
  }

  set(
    question: string,
    citedRevisionIds: string[],
    citedClaimIds: string[],
    payload: CachedAnswerPayload,
    visitorFacets?: Record<string, any>,
    asOfDate?: string | Date | null,
    isAllPublic: boolean = true
  ): boolean {
    // Only answers built exclusively from public entries are cached (§10.8 Step 2)
    if (!isAllPublic || citedRevisionIds.length === 0) {
      return false;
    }

    const normQ = normalizeQuestion(question);
    const revisionsKey = computeRevisionsKey(citedRevisionIds);
    const facetsKey = computeFacetsKey(visitorFacets);
    const asOfDateStr = normalizeAsOfDate(asOfDate);
    const key = this.makeKey(normQ, revisionsKey, facetsKey, asOfDateStr);

    const record: CachedAnswerRecord = {
      id: crypto.randomUUID(),
      normalizedQuestion: normQ,
      asOfDate: asOfDateStr,
      facetsKey,
      revisionsKey,
      citedRevisionIds: [...citedRevisionIds],
      citedClaimIds: [...citedClaimIds],
      payload: structuredClone(payload),
      cachedAt: Date.now(),
    };

    this.cache.set(key, record);
    return true;
  }

  /**
   * Invalidates any cache entries citing the given revision ID (§10.8).
   */
  invalidateRevision(revisionId: string): number {
    let invalidated = 0;
    for (const [key, record] of this.cache.entries()) {
      if (record.citedRevisionIds.includes(revisionId)) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    return invalidated;
  }

  /**
   * Invalidates any cache entries citing the given claim ID (§10.8).
   * Called when an accepted relation touches a cited claim or claim is updated.
   */
  invalidateClaim(claimId: string): number {
    let invalidated = 0;
    for (const [key, record] of this.cache.entries()) {
      if (record.citedClaimIds.includes(claimId)) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    return invalidated;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
