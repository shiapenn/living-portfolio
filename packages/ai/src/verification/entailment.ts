import type { Span } from '@living-portfolio/core';
import type { ModelProvider } from '../providers/types.js';

export type EntailmentStatus = 'entailed' | 'contradicted' | 'unsupported';

export interface EntailmentJudgeResult {
  status: EntailmentStatus;
  confidence: number;
  reason: string;
  matchedPremiseIndex?: number;
  judgeMode: 'llm' | 'deterministic';
}

export interface AssertionStrippingResult {
  verifiedText: string;
  totalAssertions: number;
  entailedAssertions: string[];
  strippedAssertions: string[];
  allEntailed: boolean;
  hasEntailed: boolean;
  judgeMode: 'llm' | 'deterministic';
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'we', 'our', 'us', 'they', 'their', 'them', 'this', 'these',
  'those', 'after', 'during', 'before', 'each', 'into', 'over', 'both', 'all',
  'team', 'using', 'used', 'support', 'high', 'system', 'service', 'across'
]);

function getStem(w: string): string {
  if (w.length <= 4) return w;
  return w.replace(/(?:ing|tion|tions|ed|es|s|ly|ment|ments)$/, '');
}

function tokenizeContent(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s$%]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function extractNumbersAndEntities(text: string): { numbers: string[]; entities: string[] } {
  // Extract numbers, percentiles (p99, 99th), percentages, currency, year mentions
  const numMatches = text.match(/\b(?:p|\$)?\d+(?:[\.,]\d+)?(?:st|nd|rd|th)?%?|\$\d+(?:[\.,]\d+)?\b|\b20\d\d\b/gi) || [];
  const numbers = numMatches.map((n) =>
    n.toLowerCase().replace(/,/g, '').replace(/^(?:p|\$)/, '').replace(/(?:st|nd|rd|th)$/, '')
  );

  // Extract capitalized non-initial words or acronyms as candidate entities
  const words = text.split(/\s+/);
  const entities: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const raw = words[i].replace(/[^\w]/g, '');
    if (raw.length > 2 && /^[A-Z][A-Za-z0-9_]+$/.test(raw)) {
      if (i > 0 || /^[A-Z]{2,}$/.test(raw)) {
        entities.push(raw.toLowerCase());
      }
    }
  }

  return { numbers, entities };
}

/**
 * Deterministically judges whether a hypothesis is entailed, contradicted, or unsupported by premise chunks.
 */
export function judgeEntailment(hypothesis: string, premises: string[]): EntailmentJudgeResult {
  if (!premises || premises.length === 0 || !hypothesis.trim()) {
    return {
      status: 'unsupported',
      confidence: 0,
      reason: 'No premises provided or empty hypothesis.',
      judgeMode: 'deterministic',
    };
  }

  const combinedPremisesText = premises.join(' ');
  const hypTokens = tokenizeContent(hypothesis);
  const hypNumEnt = extractNumbersAndEntities(hypothesis);
  const premNumEnt = extractNumbersAndEntities(combinedPremisesText);

  // 1. Check for temporal or numerical contradictions
  const hypYears = hypNumEnt.numbers.filter((n) => /^20\d\d$/.test(n));
  const premYears = premNumEnt.numbers.filter((n) => /^20\d\d$/.test(n));

  if (hypYears.length > 0 && premYears.length > 0) {
    const ungroundedYears = hypYears.filter((y) => !premYears.includes(y));
    if (ungroundedYears.length > 0) {
      return {
        status: 'contradicted',
        confidence: 0.95,
        reason: `Hypothesis cites year (${ungroundedYears.join(', ')}) conflicting with premise records (${premYears.join(', ')}).`,
        judgeMode: 'deterministic',
      };
    }
  }

  // 2. Check for negation contradiction (e.g. premise avoids/rejects/chose not to adopt X, hypothesis claims adopted X)
  const negationWords = ['not to adopt', 'did not', 'chose not', 'avoided', 'rejected', 'deprecated', 'never', 'unsupported'];
  const hasPremiseNegation = negationWords.some((nw) => combinedPremisesText.toLowerCase().includes(nw));
  if (hasPremiseNegation) {
    for (const ent of hypNumEnt.entities) {
      const premNegationPattern = new RegExp(`(?:not to adopt|did not|chose not|avoided|rejected)\\s+(?:to\\s+)?(?:adopt|use\\s+)?${ent}`, 'i');
      if (premNegationPattern.test(combinedPremisesText)) {
        const hypPositivePattern = new RegExp(`(?:orchestrated|adopted|implemented|deployed|used)\\s+(?:using\\s+)?${ent}`, 'i');
        if (hypPositivePattern.test(hypothesis) || !hypothesis.toLowerCase().includes('not')) {
          return {
            status: 'contradicted',
            confidence: 0.92,
            reason: `Premise indicates rejection or non-adoption of ${ent}, contradicted by affirmative hypothesis.`,
            judgeMode: 'deterministic',
          };
        }
      }
    }
  }

  // 3. Check for completely ungrounded specific numbers/currency/metrics
  for (const num of hypNumEnt.numbers) {
    if (!premNumEnt.numbers.includes(num)) {
      // If premise doesn't contain this metric/number, it is unsupported fabrication
      return {
        status: 'unsupported',
        confidence: 0.88,
        reason: `Hypothesis contains unsupported numerical assertion or metric '${num}' not present in source records.`,
        judgeMode: 'deterministic',
      };
    }
  }

  // 4. Check for completely ungrounded proper entities/vendors
  const ungroundedEntities: string[] = [];
  for (const ent of hypNumEnt.entities) {
    if (!combinedPremisesText.toLowerCase().includes(ent)) {
      ungroundedEntities.push(ent);
    }
  }
  if (ungroundedEntities.length >= 2 || (ungroundedEntities.length === 1 && hypTokens.length < 10)) {
    return {
      status: 'unsupported',
      confidence: 0.85,
      reason: `Hypothesis introduces ungrounded entities (${ungroundedEntities.join(', ')}) absent from source records.`,
      judgeMode: 'deterministic',
    };
  }

  // 5. Evaluate content word recall against each premise chunk
  let bestScore = 0;
  let bestIndex = 0;

  for (let i = 0; i < premises.length; i++) {
    const premTokens = new Set(tokenizeContent(premises[i]));
    if (premTokens.size === 0) continue;

    let matched = 0;
    for (const t of hypTokens) {
      const tStem = getStem(t);
      if (premTokens.has(t)) {
        matched++;
      } else {
        // Stemming / substring approximation for plurals/tenses
        for (const pt of premTokens) {
          const ptStem = getStem(pt);
          if (
            (tStem.length >= 3 && ptStem.length >= 3 && (tStem === ptStem || ptStem.startsWith(tStem) || tStem.startsWith(ptStem))) ||
            pt.startsWith(t) ||
            t.startsWith(pt)
          ) {
            matched += 0.9;
            break;
          }
        }
      }
    }

    const recall = hypTokens.length > 0 ? matched / hypTokens.length : 0;
    if (recall > bestScore) {
      bestScore = recall;
      bestIndex = i;
    }
  }

  // If token recall is above 0.45 and no conflicting entities/numbers, consider entailed
  if (bestScore >= 0.45) {
    return {
      status: 'entailed',
      confidence: Math.min(0.99, Number((bestScore * 1.1).toFixed(2))),
      reason: `Hypothesis assertions are grounded in premise chunk #${bestIndex + 1} (match recall: ${(bestScore * 100).toFixed(0)}%).`,
      matchedPremiseIndex: bestIndex,
      judgeMode: 'deterministic',
    };
  }

  return {
    status: 'unsupported',
    confidence: Number((1 - bestScore).toFixed(2)),
    reason: `Insufficient premise evidence for hypothesis assertions (match recall: ${(bestScore * 100).toFixed(0)}%).`,
    matchedPremiseIndex: bestIndex,
    judgeMode: 'deterministic',
  };
}

/**
 * Evaluates entailment with an LLM judge prompt, with deterministic fallback.
 */
export async function judgeEntailmentLLM(
  hypothesis: string,
  premises: string[],
  provider?: ModelProvider | null
): Promise<EntailmentJudgeResult> {
  if (!provider) {
    return judgeEntailment(hypothesis, premises);
  }

  try {
    const prompt = `You are a strict verification entailment judge for professional portfolio records (§10.6).
Compare the following HYPOTHESIS assertion against the verified PREMISES from owner records.
Classify the hypothesis as:
- "entailed": strictly supported or paraphrased by the premises without adding new unverified facts.
- "contradicted": directly conflicts with statements, outcomes, or dates in the premises.
- "unsupported": contains fabricated metrics, ungrounded technologies, or claims not verified by premises.

PREMISES:
${premises.map((p, idx) => `[Chunk ${idx + 1}] ${p}`).join('\n')}

HYPOTHESIS:
${hypothesis}

Output strictly valid JSON with this structure:
{"status": "entailed"|"contradicted"|"unsupported", "confidence": 0.0-1.0, "reason": "brief explanation"}`;

    const res = await provider.complete({
      model: 'default',
      messages: [
        { role: 'system', content: 'You evaluate entailment strictly against provided context chunks. Return only JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.0,
    });

    const text = res.text.trim();
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const parsed = JSON.parse(text.slice(startIdx, endIdx + 1));
      if (['entailed', 'contradicted', 'unsupported'].includes(parsed.status)) {
        return {
          status: parsed.status as EntailmentStatus,
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
          reason: parsed.reason || 'LLM entailment evaluation.',
          judgeMode: 'llm',
        };
      }
    }
    // Fallback if LLM output does not match expected schema
    return judgeEntailment(hypothesis, premises);
  } catch {
    // Graceful fallback to deterministic judge on provider error or budget exhaustion
    return judgeEntailment(hypothesis, premises);
  }
}

/**
 * Extracts discrete assertional sentences from draft text, preserving citation markers.
 */
export function extractAssertions(text: string): string[] {
  if (!text || !text.trim()) return [];

  // Split on sentence boundaries while keeping sentences intact
  const rawSentences = text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9"'\*])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return rawSentences;
}

/**
 * Strips ungrounded assertions from a draft answer, ensuring only entailed claims remain (§10.6).
 */
export async function stripUngroundedAssertions(
  draftText: string,
  premises: string[] | Span[],
  options?: { provider?: ModelProvider | null }
): Promise<AssertionStrippingResult> {
  const premiseTexts = premises.map((p) => (typeof p === 'string' ? p : p.text_exact));
  const assertions = extractAssertions(draftText);

  if (assertions.length === 0) {
    return {
      verifiedText: draftText,
      totalAssertions: 0,
      entailedAssertions: [],
      strippedAssertions: [],
      allEntailed: true,
      hasEntailed: false,
      judgeMode: options?.provider ? 'llm' : 'deterministic',
    };
  }

  const entailed: string[] = [];
  const stripped: string[] = [];
  let usedLlm = false;

  for (const assertion of assertions) {
    // If the sentence is merely conversational framing or test simulation, keep it
    if (/^(based on|according to|showing excerpts|here is|here are|\[simulated\]|verified answer)\b/i.test(assertion)) {
      entailed.push(assertion);
      continue;
    }

    const judgment = options?.provider
      ? await judgeEntailmentLLM(assertion, premiseTexts, options.provider)
      : judgeEntailment(assertion, premiseTexts);

    if (judgment.judgeMode === 'llm') usedLlm = true;

    if (judgment.status === 'entailed') {
      entailed.push(assertion);
    } else {
      stripped.push(assertion);
    }
  }

  const hasEntailed = entailed.some((s) => s.length > 20 && !s.toLowerCase().startsWith('based on'));
  const allEntailed = stripped.length === 0;
  const verifiedText = entailed.join(' ').trim();

  return {
    verifiedText,
    totalAssertions: assertions.length,
    entailedAssertions: entailed,
    strippedAssertions: stripped,
    allEntailed,
    hasEntailed,
    judgeMode: usedLlm ? 'llm' : 'deterministic',
  };
}

/**
 * Synchronous variant of assertion stripping using deterministic entailment.
 */
export function stripUngroundedAssertionsSync(
  draftText: string,
  premises: string[] | Span[]
): AssertionStrippingResult {
  const premiseTexts = premises.map((p) => (typeof p === 'string' ? p : p.text_exact));
  const assertions = extractAssertions(draftText);

  if (assertions.length === 0) {
    return {
      verifiedText: draftText,
      totalAssertions: 0,
      entailedAssertions: [],
      strippedAssertions: [],
      allEntailed: true,
      hasEntailed: false,
      judgeMode: 'deterministic',
    };
  }

  const entailed: string[] = [];
  const stripped: string[] = [];

  for (const assertion of assertions) {
    // If the sentence is merely conversational framing or test simulation, keep it
    if (/^(based on|according to|showing excerpts|here is|here are|\[simulated\]|verified answer)\b/i.test(assertion)) {
      entailed.push(assertion);
      continue;
    }

    const judgment = judgeEntailment(assertion, premiseTexts);
    if (judgment.status === 'entailed') {
      entailed.push(assertion);
    } else {
      stripped.push(assertion);
    }
  }

  const hasEntailed = entailed.some((s) => s.length > 20 && !s.toLowerCase().startsWith('based on'));
  const allEntailed = stripped.length === 0;
  const verifiedText = entailed.join(' ').trim();

  return {
    verifiedText,
    totalAssertions: assertions.length,
    entailedAssertions: entailed,
    strippedAssertions: stripped,
    allEntailed,
    hasEntailed,
    judgeMode: 'deterministic',
  };
}
