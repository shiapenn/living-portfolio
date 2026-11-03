export interface MinedConstraintResult {
  isTechnical: boolean;
  constraint?: Record<string, any>;
  quote?: string;
  reason?: string;
}

/**
 * Automated scoped constraint mining detector (§11, Fix 17).
 *
 * Scans rejection replies from the owner in the escalation inbox.
 * Distinguishes technical boundary constraints (scale, memory, platform, architecture, SLA)
 * from non-technical declines ("too busy right now", "not a fit", "on vacation").
 *
 * CRITICAL INVARIANT (§11, §18.1):
 * Mined constraints are always returned as proposals (`status: 'proposed'`).
 * They are never auto-converted to confirmed/active constraints without explicit owner action.
 */
export function mineScopedConstraintFromRejection(
  rejectionReason: string,
  conversationFacets?: Record<string, any> | null
): MinedConstraintResult {
  if (!rejectionReason || typeof rejectionReason !== 'string') {
    return { isTechnical: false, reason: 'Empty rejection reason' };
  }

  const text = rejectionReason.trim();
  const lower = text.toLowerCase();

  // Non-technical rejection patterns (§11: "A rejection reason that isn't a technical constraint is never auto-converted")
  const nonTechnicalPatterns = [
    /too busy/i,
    /schedule (?:is )?(?:full|tight)/i,
    /not (?:taking|accepting) (?:new )?(?:clients|projects|work)/i,
    /out of (?:the )?office/i,
    /on vacation/i,
    /not (?:a )?(?:good )?fit/i,
    /personal preference/i,
    /no capacity/i,
    /fully booked/i,
  ];

  for (const pat of nonTechnicalPatterns) {
    if (pat.test(lower)) {
      return {
        isTechnical: false,
        reason: 'Declined due to personal/schedule availability rather than technical boundary condition',
      };
    }
  }

  // Technical boundary patterns
  // 1. Memory / RAM constraints
  const memoryMatch = text.match(/(?:memory|ram|heap)[^0-9\n]{0,30}?(\d+)\s*(mb|gb)/i);
  if (memoryMatch) {
    const rawVal = parseInt(memoryMatch[1], 10);
    const unit = memoryMatch[2].toLowerCase();
    const mbVal = unit === 'gb' ? rawVal * 1024 : rawVal;
    return {
      isTechnical: true,
      constraint: { max_memory_mb: mbVal },
      quote: memoryMatch[0].trim(),
    };
  }

  // 2. TPS / Concurrency / Throughput constraints
  const tpsMatch = text.match(/(?:throughput|tps|rps|qps|traffic)[^0-9\n]{0,30}?(\d+)\s*(k|m)?/i);
  if (tpsMatch) {
    let tps = parseInt(tpsMatch[1], 10);
    if (tpsMatch[2]?.toLowerCase() === 'k') tps *= 1000;
    if (tpsMatch[2]?.toLowerCase() === 'm') tps *= 1000000;
    return {
      isTechnical: true,
      constraint: { max_tps: tps },
      quote: tpsMatch[0].trim(),
    };
  }

  // 3. Architecture / Environment constraints
  if (/single-node only|single node only/i.test(lower)) {
    return {
      isTechnical: true,
      constraint: { architecture: 'single-node' },
      quote: text.slice(0, 100),
    };
  }
  if (/serverless only|lambda only/i.test(lower)) {
    return {
      isTechnical: true,
      constraint: { environment: 'serverless' },
      quote: text.slice(0, 100),
    };
  }

  // 4. Latency / SLA constraints
  const latencyMatch = text.match(/(?:latency|p99|response time)[^0-9\n]{0,30}?(\d+)\s*(ms|s)/i);
  if (latencyMatch) {
    const rawVal = parseInt(latencyMatch[1], 10);
    const unit = latencyMatch[2].toLowerCase();
    const msVal = unit === 's' ? rawVal * 1000 : rawVal;
    return {
      isTechnical: true,
      constraint: { max_latency_ms: msVal },
      quote: latencyMatch[0].trim(),
    };
  }

  return {
    isTechnical: false,
    reason: 'No technical boundary condition detected in rejection message',
  };
}
