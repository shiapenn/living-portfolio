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
}

/**
 * Checks for later thinking across active supersedes and contradicts relations (§10.7).
 */
export function detectLaterThinking(
  entryClaims: (Claim & { entry_id: string; entry_slug: string; entry_title?: string })[],
  relations: (Relation & {
    dst_claim_text?: string;
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
    });
  }

  return alerts;
}
