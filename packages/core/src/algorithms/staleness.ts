import type { Claim, Relation } from '../types/index.js';

export interface StalenessAlert {
  entry_id: string;
  source_claim_id: string;
  superseding_claim_id: string;
  relation_type: 'supersedes' | 'contradicts';
  newer_entry_slug: string;
  newer_entry_title: string;
  newer_written_at: string;
  message: string;
  scope_overlap?: boolean;
}

/**
 * Checks whether two scopes overlap (§10.7, Fix 18).
 * Scopes overlap when neither explicitly contradicts the other on shared facet dimensions.
 *
 * Rules:
 * 1. If either scope is null/undefined or empty ({}), it represents a general/unconstrained scope
 *    which overlaps with any other scope.
 * 2. If both define facet dimensions:
 *    - For all shared dimensions (e.g. `architecture`, `database`, `environment`):
 *      - String values must match (case-insensitive) or be included.
 *      - Array values must have non-empty intersection.
 *      - Number values must be equal.
 *    - If any shared dimension has conflicting/disjoint values (e.g. `architecture: 'single-node'`
 *      vs `architecture: 'cluster'`), the scopes do NOT overlap (returns false).
 * 3. Returns true if no shared dimensions conflict.
 */
export function checkScopeOverlap(
  scopeA?: Record<string, any> | null,
  scopeB?: Record<string, any> | null
): boolean {
  if (!scopeA || Object.keys(scopeA).length === 0) return true;
  if (!scopeB || Object.keys(scopeB).length === 0) return true;

  const sharedKeys = Object.keys(scopeA).filter((k) => k in scopeB);
  if (sharedKeys.length === 0) {
    return true;
  }

  for (const key of sharedKeys) {
    const valA = scopeA[key];
    const valB = scopeB[key];

    if (valA === undefined || valA === null || valB === undefined || valB === null) {
      continue;
    }

    if (Array.isArray(valA) && Array.isArray(valB)) {
      const setB = new Set(valB.map((v) => String(v).trim().toLowerCase()));
      const hasOverlap = valA.some((v) => setB.has(String(v).trim().toLowerCase()));
      if (!hasOverlap) return false;
    } else if (Array.isArray(valA)) {
      const strB = String(valB).trim().toLowerCase();
      if (!valA.some((v) => String(v).trim().toLowerCase() === strB)) return false;
    } else if (Array.isArray(valB)) {
      const strA = String(valA).trim().toLowerCase();
      if (!valB.some((v) => String(v).trim().toLowerCase() === strA)) return false;
    } else if (typeof valA === 'number' && typeof valB === 'number') {
      if (valA !== valB) return false;
    } else {
      const strA = String(valA).trim().toLowerCase();
      const strB = String(valB).trim().toLowerCase();
      if (strA !== strB) return false;
    }
  }

  return true;
}

/**
 * Checks for later thinking across active supersedes and contradicts relations whose scope
 * overlaps the entry's claims (§10.7, Fix 18).
 */
export function detectLaterThinking(
  entryClaims: (Claim & { entry_id: string; entry_slug: string; entry_title?: string })[],
  relations: (Relation & {
    dst_claim_text?: string;
    dst_claim_scope?: Record<string, any> | null;
    dst_entry_slug?: string;
    dst_entry_title?: string;
    dst_written_at?: string;
  })[]
): StalenessAlert[] {
  const alerts: StalenessAlert[] = [];
  const claimMap = new Map(entryClaims.map((c) => [c.id, c]));

  for (const rel of relations) {
    if (rel.status !== 'accepted') continue;
    if (rel.type !== 'supersedes' && rel.type !== 'contradicts') continue;

    const sourceClaim = claimMap.get(rel.src_claim);
    if (!sourceClaim) continue;

    // Fix 18 (§10.7): Check scope overlap between source claim and superseding relation / claim
    const newerScope = rel.scope !== undefined && rel.scope !== null ? rel.scope : rel.dst_claim_scope;
    const overlaps = checkScopeOverlap(sourceClaim.scope, newerScope);
    if (!overlaps) {
      // Different situations / non-overlapping scopes: skip staleness alert
      continue;
    }

    const newerSlug = rel.dst_entry_slug ?? 'newer-entry';
    const newerTitle = rel.dst_entry_title ?? 'Later Entry';
    const newerWritten = rel.dst_written_at ?? rel.recorded_at;

    const actionWord = rel.type === 'supersedes' ? 'superseded' : 'updated';
    const message = `Later thinking: ${actionWord} in "${newerTitle}".`;

    alerts.push({
      entry_id: sourceClaim.entry_id,
      source_claim_id: rel.src_claim,
      superseding_claim_id: rel.dst_claim,
      relation_type: rel.type,
      newer_entry_slug: newerSlug,
      newer_entry_title: newerTitle,
      newer_written_at: newerWritten,
      message,
      scope_overlap: true,
    });
  }

  return alerts;
}
