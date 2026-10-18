import type { Claim, DomainConfig, EntryRevision, Facet } from '../types/index.js';

export interface GapQuestion {
  id: string;
  field: string;
  question: string;
  hint?: string;
  value: number; // Value of Information priority score
  skippable: true;
}

export interface GapQuestionsInput {
  revision: Pick<EntryRevision, 'temporal_level' | 'valid_from'>;
  facets: Pick<Facet, 'key' | 'value' | 'status' | 'confidence'>[];
  claims: Pick<Claim, 'outcome_status' | 'status'>[];
  domain?: DomainConfig;
  facetKnownThreshold?: number;
}

export function generateGapQuestions(input: GapQuestionsInput): GapQuestion[] {
  const {
    revision,
    facets,
    claims,
    domain,
    facetKnownThreshold = 0.9,
  } = input;

  const candidates: GapQuestion[] = [];

  // 1. Check domain hard facets
  if (domain) {
    const knownKeys = new Set<string>();
    for (const f of facets) {
      if (
        f.status === 'confirmed' ||
        (f.status === 'suggested' && (f.confidence ?? 0) >= facetKnownThreshold)
      ) {
        if (f.value !== null && f.value !== undefined && f.value !== '') {
          knownKeys.add(f.key);
        }
      }
    }

    for (const facetKey of domain.hard_facets) {
      if (!knownKeys.has(facetKey)) {
        const weight = domain.facet_weight[facetKey] ?? 0.8;
        candidates.push({
          id: `facet_${facetKey}`,
          field: `facet.${facetKey}`,
          question: `What was the ${facetKey.replace(/_/g, ' ')}?`,
          hint: `Knowing the ${facetKey} unlocks automated advisory matching for similar visitors.`,
          value: weight,
          skippable: true,
        });
      }
    }
  }

  // 2. Check outcome status (Value = HIGH = 1.0)
  const hasOutcome = claims.some(
    (c) =>
      c.status === 'accepted' &&
      c.outcome_status != null &&
      c.outcome_status !== 'unknown'
  );
  if (!hasOutcome) {
    candidates.push({
      id: 'outcome_status',
      field: 'claim.outcome_status',
      question: 'Did it work?',
      hint: 'Specifying whether this worked, partly worked, or failed unlocks "what didn\'t work" answers and prevents bad advice.',
      value: 1.0, // HIGH
      skippable: true,
    });
  }

  // 3. Check estimated date (Value = MED = 0.6)
  if (revision.temporal_level === 'estimated' || !revision.valid_from) {
    candidates.push({
      id: 'valid_from',
      field: 'revision.valid_from',
      question: 'When did this work take place?',
      hint: 'Providing a specific date or year places this accurately on your Strata Timeline and avoids time-travel leakage.',
      value: 0.6, // MED
      skippable: true,
    });
  }

  // Sort candidates by value descending and return top 3
  candidates.sort((a, b) => b.value - a.value);
  return candidates.slice(0, 3);
}
