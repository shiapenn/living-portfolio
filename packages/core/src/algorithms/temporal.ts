import type { TemporalLevel } from '../types/index.js';

export interface TemporalEntity {
  valid_from?: string | null;
  valid_to?: string | null;
  recorded_at?: string | null;
  written_at?: string | null;
  temporal_level?: TemporalLevel | null;
  valid_from_range_end?: string | null;
  is_hindsight?: boolean;
}

export interface TemporalValidityResult {
  valid: boolean;
  decayWeight: number; // 1.0 = full weight, < 1.0 = reduced weight for range/estimated
  reason?: string;
}

/**
 * Checks whether an entity (chunk, revision, claim, or relation) was valid and known
 * as of query date t_q (§10.4).
 */
export function isTemporallyValid(
  entity: TemporalEntity,
  t_q: Date | string
): TemporalValidityResult {
  const queryDate = typeof t_q === 'string' ? new Date(t_q) : t_q;
  const queryTime = queryDate.getTime();

  // If revision/recorded_at is in the future relative to query date, it did not exist yet (transaction time)
  if (entity.written_at) {
    const writtenTime = new Date(entity.written_at).getTime();
    if (writtenTime > queryTime) {
      return { valid: false, decayWeight: 0, reason: 'Written after query date' };
    }
  }

  if (entity.recorded_at) {
    const recordedTime = new Date(entity.recorded_at).getTime();
    if (recordedTime > queryTime) {
      return { valid: false, decayWeight: 0, reason: 'Recorded after query date' };
    }
  }

  // Check hindsight: if an entry is hindsight (written later about an earlier event),
  // it would leak future knowledge into a past query view
  if (entity.is_hindsight && entity.written_at) {
    const writtenTime = new Date(entity.written_at).getTime();
    // If the author wrote this retrospective after the query date, do not leak hindsight into past query
    if (writtenTime > queryTime) {
      return { valid: false, decayWeight: 0, reason: 'Hindsight knowledge written after query date' };
    }
  }

  // Check event time range (valid_from .. valid_to)
  let validFromTime = entity.valid_from ? new Date(entity.valid_from).getTime() : null;
  let validToTime = entity.valid_to ? new Date(entity.valid_to).getTime() : null;
  let rangeEndTime = entity.valid_from_range_end ? new Date(entity.valid_from_range_end).getTime() : null;

  // Soft include when date is estimated or a range and query date falls inside its range
  if (
    entity.temporal_level &&
    entity.temporal_level !== 'exact' &&
    validFromTime !== null &&
    rangeEndTime !== null
  ) {
    if (queryTime >= validFromTime && queryTime <= rangeEndTime) {
      return {
        valid: true,
        decayWeight: 0.7, // soft include through decay weight only (§3.9, §10.4)
        reason: 'Soft match within estimated range',
      };
    }
  }

  // Normal temporal predicate:
  // valid_from <= t_q AND (valid_to is null OR valid_to > t_q)
  if (validFromTime !== null && validFromTime > queryTime) {
    return { valid: false, decayWeight: 0, reason: 'Event occurred after query date' };
  }

  if (validToTime !== null && validToTime <= queryTime) {
    return { valid: false, decayWeight: 0, reason: 'Event expired before query date' };
  }

  return {
    valid: true,
    decayWeight: 1.0,
  };
}
