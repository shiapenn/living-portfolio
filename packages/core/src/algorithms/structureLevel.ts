import type {
  Annotation,
  Claim,
  DomainConfig,
  EntryRevision,
  Facet,
  RoleProfile,
  StructureLevel,
} from '../types/index.js';

export interface StructureLevelInput {
  revision: Pick<EntryRevision, 'body_md' | 'temporal_level' | 'valid_from' | 'written_at'>;
  profile: RoleProfile;
  domain?: DomainConfig;
  facets: Pick<Facet, 'key' | 'value' | 'status' | 'confidence'>[];
  annotations: Pick<Annotation, 'role' | 'status'>[];
  claims: Pick<Claim, 'scope' | 'outcome_status' | 'status'>[];
  facetKnownThreshold?: number; // default 0.9
}

/**
 * Computes the 4-step Structure Level (L0 Text, L1 Context, L2 Roles, L3 Claims)
 * for an entry as defined in §3.3.
 */
export function computeStructureLevel(input: StructureLevelInput): StructureLevel {
  const {
    revision,
    profile,
    domain,
    facets,
    annotations,
    claims,
    facetKnownThreshold = 0.9,
  } = input;

  // L0 Check: Has body and date
  if (!revision.body_md || revision.body_md.trim().length === 0) {
    return 'L0';
  }

  // Check L1: Known values for domain's hard-constraint facets
  let hasL1 = false;
  if (domain && domain.hard_facets.length > 0) {
    const knownFacetKeys = new Set<string>();
    for (const f of facets) {
      if (
        f.status === 'confirmed' ||
        (f.status === 'suggested' && (f.confidence ?? 0) >= facetKnownThreshold)
      ) {
        if (f.value !== null && f.value !== undefined && f.value !== '') {
          knownFacetKeys.add(f.key);
        }
      }
    }

    const allHardKnown = domain.hard_facets.every((key) => knownFacetKeys.has(key));
    hasL1 = allHardKnown;
  } else {
    // If no specific domain hard facets declared, having at least one confirmed facet satisfies L1
    hasL1 = facets.some((f) => f.status === 'confirmed' && f.value != null);
  }

  if (!hasL1) {
    return 'L0';
  }

  // Check L2: Role annotations covering profile's minimum role set (CNF)
  const acceptedRoles = new Set<string>(
    annotations
      .filter((a) => a.status === 'accepted')
      .map((a) => a.role)
  );

  let hasL2 = false;
  if (profile.minimum_for_L2.length === 0) {
    // Freeform or profile with no minimum
    hasL2 = false;
  } else {
    // Each group in minimum_for_L2 must have at least one accepted role
    const satisfiesAllGroups = profile.minimum_for_L2.every((group) =>
      group.some((role) => acceptedRoles.has(role))
    );
    hasL2 = satisfiesAllGroups;
  }

  if (!hasL2) {
    return 'L1';
  }

  // Check L3: At least one claim with scope and an outcome status
  const acceptedClaims = claims.filter((c) => c.status === 'accepted');
  const hasL3 = acceptedClaims.some(
    (c) =>
      c.outcome_status != null &&
      c.outcome_status !== 'unknown' &&
      c.scope != null &&
      Object.keys(c.scope).length > 0
  );

  if (hasL3) {
    return 'L3';
  }

  return 'L2';
}

/**
 * Returns human-readable label and description for a structure level.
 */
export function getStructureLevelDetails(level: StructureLevel): {
  label: string;
  description: string;
  unlocked: string[];
} {
  switch (level) {
    case 'L0':
      return {
        label: 'L0 Text',
        description: 'Plain document with date and full-text/vector index.',
        unlocked: ['Publishing', 'Full search', 'Citations', 'Timeline placement', 'Lookup answers'],
      };
    case 'L1':
      return {
        label: 'L1 Context',
        description: 'Document with confirmed domain hard-constraint facets.',
        unlocked: ['Passes applicability gate', 'Advisory drafts for owner review (Tier 2)'],
      };
    case 'L2':
      return {
        label: 'L2 Roles',
        description: 'Document annotated with structural role profile.',
        unlocked: ['Structured case-study view', 'Role-aware retrieval boost', 'High-value gap questions'],
      };
    case 'L3':
      return {
        label: 'L3 Claims',
        description: 'Document with structured scoped claims and outcome status.',
        unlocked: ['Automated advisory answers (Tier 1)', 'Staleness banners', '"What didn\'t work" answers'],
      };
  }
}
