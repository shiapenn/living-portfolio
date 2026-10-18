import type {
  DomainConfig,
  GateResult,
  QueryClass,
  RoutingTier,
  ScopedConstraint,
} from '../types/index.js';

export interface GateInput {
  clientFacets: Record<string, any>;
  entryScope?: Record<string, any> | null;
  domain?: DomainConfig;
  scopedConstraints?: ScopedConstraint[];
}

export interface GateDetails {
  result: GateResult;
  matched: Record<string, any>;
  mismatched: Record<string, { expected: any; actual: any }>;
  unknown: string[];
}

/**
 * Checks whether client facets satisfy the hard constraints of the domain and active scoped constraints (§10.5).
 */
export function checkGate(input: GateInput): GateDetails {
  const { clientFacets, entryScope = {}, domain, scopedConstraints = [] } = input;

  const matched: Record<string, any> = {};
  const mismatched: Record<string, { expected: any; actual: any }> = {};
  const unknown: string[] = [];

  const hardDimensions = new Set<string>(domain?.hard_facets ?? []);

  // Check applicable scoped constraints
  for (const sc of scopedConstraints) {
    if (sc.status === 'confirmed') {
      for (const [key, val] of Object.entries(sc.constraint)) {
        hardDimensions.add(key);
      }
    }
  }

  for (const dim of hardDimensions) {
    const clientVal = clientFacets[dim];
    const entryVal = entryScope?.[dim];

    // If either value is unknown
    if (clientVal === undefined || clientVal === null || clientVal === '') {
      unknown.push(dim);
      continue;
    }

    if (entryVal !== undefined && entryVal !== null && entryVal !== '') {
      // Check compatibility (exact match, array inclusion, or numeric threshold)
      const isCompat = checkFacetCompatibility(clientVal, entryVal);
      if (isCompat) {
        matched[dim] = clientVal;
      } else {
        mismatched[dim] = { expected: entryVal, actual: clientVal };
      }
    }
  }

  if (Object.keys(mismatched).length > 0) {
    return { result: 'FAIL', matched, mismatched, unknown };
  }

  if (unknown.length > 0) {
    return { result: 'INDETERMINATE', matched, mismatched, unknown };
  }

  return { result: 'PASS', matched, mismatched, unknown };
}

function checkFacetCompatibility(clientVal: any, entryVal: any): boolean {
  if (clientVal === entryVal) return true;
  if (typeof clientVal === 'string' && typeof entryVal === 'string') {
    return clientVal.toLowerCase() === entryVal.toLowerCase();
  }
  if (Array.isArray(entryVal)) {
    return entryVal.includes(clientVal);
  }
  if (Array.isArray(clientVal)) {
    return clientVal.includes(entryVal);
  }
  return false;
}

export interface RouteMatch {
  similarity: number;
  hasEvidence: boolean;
  hasVerifiedEvidence: boolean;
  outcomeStatus?: string | null;
  hasScope: boolean;
}

export interface RouteInput {
  queryClass: QueryClass;
  matches: RouteMatch[];
  gateResult: GateResult;
  tier1Floor?: number; // default 0.82
  tier2Floor?: number; // default 0.55
  lookupThreshold?: number; // default 0.70
  weights?: { w1: number; w2: number; w3: number };
}

export interface RouteDecision {
  tier: RoutingTier;
  score: number;
  explanation: string;
  isExtractive: boolean;
}

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Routes query to Tier 1 (automated grounded), Tier 2 (draft for review), or Tier 3 (booking) (§10.5).
 */
export function routeQuery(input: RouteInput): RouteDecision {
  const {
    queryClass,
    matches,
    gateResult,
    tier1Floor = 0.82,
    tier2Floor = 0.55,
    lookupThreshold = 0.70,
    weights = { w1: 1.0, w2: 0.5, w3: 0.5 },
  } = input;

  if (matches.length === 0) {
    return {
      tier: 'no_match',
      score: 0,
      explanation: "That isn't in these records. Offer to ask the owner or book a conversation.",
      isExtractive: false,
    };
  }

  const bestMatch = matches[0];

  // Lookup queries (what, whether, where)
  if (queryClass === 'lookup' || queryClass === 'about') {
    if (bestMatch.similarity >= lookupThreshold) {
      return {
        tier: 'tier1',
        score: bestMatch.similarity,
        explanation: 'Lookup query with sufficient record match grounded by citations.',
        isExtractive: false,
      };
    } else {
      return {
        tier: 'no_match',
        score: bestMatch.similarity,
        explanation: 'Lookup query below support threshold.',
        isExtractive: false,
      };
    }
  }

  // Advisory queries (how should I, what approach)
  if (gateResult === 'FAIL') {
    return {
      tier: 'tier3',
      score: 0,
      explanation: 'Hard constraint mismatch between visitor situation and owner records. Hand off to booking.',
      isExtractive: false,
    };
  }

  // Calculate composite advisory score
  const z_norm = Math.min(1.0, Math.max(0.0, bestMatch.similarity));
  const s_evidence =
    matches.filter((m) => m.hasEvidence || m.hasVerifiedEvidence).length / matches.length;

  let outcomeScore = 0.5;
  if (bestMatch.outcomeStatus === 'worked') outcomeScore = 1.0;
  else if (bestMatch.outcomeStatus === 'partly') outcomeScore = 0.6;
  else if (bestMatch.outcomeStatus === 'failed') outcomeScore = 0.2;
  else if (bestMatch.outcomeStatus === 'unresolved') outcomeScore = 0.4;
  else outcomeScore = 0.1;

  // Normalized score mapped through sigmoid with scaled offset
  const rawZ = weights.w1 * (z_norm * 2 - 1) + weights.w2 * s_evidence + weights.w3 * outcomeScore;
  const score = sigmoid(rawZ);

  const matchedClaimsHaveScopeAndOutcome = matches.some(
    (m) => m.hasScope && m.outcomeStatus != null && m.outcomeStatus !== 'unknown'
  );

  if (gateResult === 'PASS' && score >= tier1Floor && matchedClaimsHaveScopeAndOutcome) {
    return {
      tier: 'tier1',
      score,
      explanation: 'Advisory query passed all hard constraints and exceeds Tier 1 floor.',
      isExtractive: false,
    };
  }

  if (score >= tier2Floor) {
    return {
      tier: 'tier2',
      score,
      explanation:
        gateResult === 'INDETERMINATE'
          ? 'Advisory query has unknown constraints; routed to Tier 2 for owner review.'
          : 'Advisory query exceeds Tier 2 floor; draft produced for owner review before delivery.',
      isExtractive: false,
    };
  }

  return {
    tier: 'tier3',
    score,
    explanation: 'Advisory query below Tier 2 floor; routed to live session booking.',
    isExtractive: false,
  };
}
