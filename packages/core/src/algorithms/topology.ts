import type { Claim, Relation, TopologyReport } from '../types/index.js';
import { checkScopeOverlap } from './staleness.js';

export interface TopologyAuditOptions {
  minConfidence?: number;
}

export interface ClaimWithContext extends Claim {
  entry_id?: string;
  entry_title?: string;
  entry_slug?: string;
  entry_date?: string;
}

/**
 * Extracts key domain tokens from text for semantic overlap calculation.
 */
function extractKeywords(text: string): Set<string> {
  const stopWords = new Set([
    'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
    'up', 'down', 'out', 'over', 'under', 'again', 'further', 'once', 'here',
    'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
    'too', 'very', 'our', 'we', 'us',
  ]);
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
  return new Set(words);
}

/**
 * Checks for opposing polarity or contradictory assertions.
 */
function hasOpposingPolarity(textA: string, textB: string): boolean {
  const lowerA = textA.toLowerCase();
  const lowerB = textB.toLowerCase();

  const positiveMarkers = [
    'outperform', 'outperforms', 'faster', 'recommend', 'prefer', 'effective',
    'reliable', 'adopt', 'optimal', 'superior', 'use',
  ];
  const negativeMarkers = [
    'slower', 'underperform', 'underperforms', 'avoid', 'deprecated', 'fail',
    'fails', 'failed', 'bottleneck', 'unreliable', 'anti-pattern', 'fragile',
  ];

  const aPos = positiveMarkers.some((m) => lowerA.includes(m));
  const aNeg = negativeMarkers.some((m) => lowerA.includes(m));
  const bPos = positiveMarkers.some((m) => lowerB.includes(m));
  const bNeg = negativeMarkers.some((m) => lowerB.includes(m));

  return (aPos && bNeg) || (aNeg && bPos);
}

/**
 * Automated dynamic topology conflict detector (§11, Fix 17).
 *
 * Observes claim pairs with:
 * 1. Overlapping temporal validity or contemporaneous timeline.
 * 2. Overlapping scope facets (verified via `checkScopeOverlap` or scope-keyword cross-referencing).
 * 3. Opposing conclusions (opposing outcome status or contradictory polarity on shared keywords).
 * 4. No existing relation connecting them.
 *
 * CRITICAL INVARIANT (§11, §18.1):
 * Never creates a relation or writes an edge automatically.
 * It strictly returns proposed conflict reports for owner review.
 */
export function detectTopologyConflicts(
  claims: ClaimWithContext[],
  relations: Relation[],
  options: TopologyAuditOptions = {}
): TopologyReport[] {
  const minConfidence = options.minConfidence ?? 0.55;
  const reports: TopologyReport[] = [];

  // Build existing relations index (bidirectional)
  const existingRelations = new Set<string>();
  for (const rel of relations) {
    if (rel.status !== 'dismissed') {
      existingRelations.add(`${rel.src_claim}:${rel.dst_claim}`);
      existingRelations.add(`${rel.dst_claim}:${rel.src_claim}`);
    }
  }

  // Filter to active/accepted claims
  const candidateClaims = claims.filter((c) => c.status === 'accepted' || c.status === 'suggested');

  for (let i = 0; i < candidateClaims.length; i++) {
    for (let j = i + 1; j < candidateClaims.length; j++) {
      const claimA = candidateClaims[i];
      const claimB = candidateClaims[j];

      // Skip if an existing relation already connects them
      if (existingRelations.has(`${claimA.id}:${claimB.id}`)) {
        continue;
      }

      // Compute topic similarity via keyword overlap
      const kwA = extractKeywords(claimA.text);
      const kwB = extractKeywords(claimB.text);
      const intersection = Array.from(kwA).filter((k) => kwB.has(k));
      const union = new Set([...kwA, ...kwB]);
      const jaccard = union.size > 0 ? intersection.length / union.size : 0;

      // Check scope overlap (§11: "Topology audit selects candidates by constraint similarity, not exact match")
      const scopesOverlapDirect = checkScopeOverlap(claimA.scope, claimB.scope);
      const textCrossReferencesScope =
        (claimA.scope && Object.values(claimA.scope).some((v) => typeof v === 'string' && kwB.has(v.toLowerCase()))) ||
        (claimB.scope && Object.values(claimB.scope).some((v) => typeof v === 'string' && kwA.has(v.toLowerCase())));

      if (!scopesOverlapDirect && !textCrossReferencesScope) {
        continue;
      }

      // Condition 1: Opposing outcome statuses on shared topic
      const opposingOutcomes =
        (claimA.outcome_status === 'worked' && claimB.outcome_status === 'failed') ||
        (claimB.outcome_status === 'worked' && claimA.outcome_status === 'failed') ||
        (claimA.outcome_status === 'worked' && claimB.outcome_status === 'partly') ||
        (claimB.outcome_status === 'worked' && claimA.outcome_status === 'partly');

      // Condition 2: Opposing polarity in text on shared topic
      const opposingPolarity = hasOpposingPolarity(claimA.text, claimB.text) && (intersection.length >= 1 || jaccard >= 0.1);

      // Condition 3: Different architectural or technical choices with high shared context
      const highSharedContext = jaccard >= 0.15 || intersection.length >= 2;

      let conflictDetected = false;
      let confidence = 0;

      if (opposingOutcomes && highSharedContext) {
        conflictDetected = true;
        confidence = Math.min(0.95, 0.7 + jaccard * 0.5);
      } else if (opposingPolarity) {
        conflictDetected = true;
        confidence = Math.min(0.92, 0.65 + jaccard * 0.4);
      } else if (highSharedContext && (claimA.kind === 'decision' || claimB.kind === 'decision')) {
        // Conflicting decisions on the same topic without relation edge
        conflictDetected = true;
        confidence = Math.min(0.88, 0.6 + jaccard * 0.4);
      }

      if (conflictDetected && confidence >= minConfidence) {
        // Determine earlier vs later claim (prefer entry published/updated date, fallback to claim.recorded_at)
        const dateA = claimA.entry_date || claimA.recorded_at || '';
        const dateB = claimB.entry_date || claimB.recorded_at || '';
        const timeA = dateA ? new Date(dateA).getTime() : 0;
        const timeB = dateB ? new Date(dateB).getTime() : 0;
        const [earlier, later] = timeA <= timeB ? [claimA, claimB] : [claimB, claimA];
        const earlierDate = earlier.entry_date || earlier.recorded_at || undefined;
        const laterDate = later.entry_date || later.recorded_at || undefined;

        // Compute overlap record
        const overlap: Record<string, any> = {};
        if (earlier.scope && later.scope) {
          for (const k of Object.keys(earlier.scope)) {
            if (k in later.scope && earlier.scope[k] === later.scope[k]) {
              overlap[k] = earlier.scope[k];
            }
          }
        }
        if (intersection.length > 0) {
          overlap['matched_keywords'] = intersection;
        }

        reports.push({
          id: `topo-${earlier.id.slice(0, 8)}-${later.id.slice(0, 8)}`,
          claim_a: earlier.id,
          claim_b: later.id,
          confidence: Number(confidence.toFixed(2)),
          overlap: Object.keys(overlap).length > 0 ? overlap : null,
          status: 'pending',
          at: new Date().toISOString(),
          question: 'Does the later claim supersede the earlier one, or do they apply to different situations?',
          claim_a_text: earlier.text,
          claim_b_text: later.text,
          entry_a_id: earlier.entry_id,
          entry_a_title: earlier.entry_title,
          entry_a_date: earlierDate,
          entry_b_id: later.entry_id,
          entry_b_title: later.entry_title,
          entry_b_date: laterDate,
        });
      }
    }
  }

  // Rank conflicts by confidence descending (§11)
  return reports.sort((a, b) => b.confidence - a.confidence);
}
