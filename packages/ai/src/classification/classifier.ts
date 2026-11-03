import type { ModelProvider } from '../providers/types.js';
import type { ClassificationOptions, QueryClass, QueryClassificationResult } from './types.js';

const ABOUT_PATTERNS = [
  /\bwho\s+(?:are\s+you|is\s+(?:the\s+)?author|created|made\s+this)\b/i,
  /\babout\s+(?:you|yourself|the\s+author|this\s+site|the\s+creator)\b/i,
  /\btell\s+me\s+about\s+(?:you|yourself|your\s+background)\b/i,
  /\byour\s+(?:background|experience|bio|career|resume|cv)\b/i,
  /\b(?:who\s+wrote|author\s+bio|about\s+the\s+site)\b/i,
  /\bwhat\s+(?:tech\s+)?stack\s+powers\s+(?:this|the)\s+(?:site|portfolio)\b/i,
  /\bhow\s+does\s+(?:(?:this|the)\s+)?(?:living\s+portfolio|site)(?:\s+(?:architecture|system))?\s+work\b/i,
  /\b(?:site\s+architecture|architecture\s+of\s+this\s+site|living\s+portfolio)\b/i,
  /\b(?:contact\s+(?:the\s+)?author|how\s+can\s+i\s+contact|get\s+in\s+touch)\b/i,
  /\b(?:verified\s+credentials|gpg\s+signatures?|domain\s+ownership)\b/i,
];

const ADVISORY_PATTERNS = [
  /\bshould\s+(?:i|we)\b/i,
  /\brecommend(?:ed|ation|ing)?\b/i,
  /\btradeoffs?\b/i,
  /\bbest\s+(?:practices?|approaches?|architecture)\b/i,
  /\bhow\s+(?:to|should\s+(?:i|we)|can\s+i)\b/i,
  /\bwhat\s+approach\b/i,
  /\b(?:is\s+it\s+)?better\s+to\b/i,
  /\b(?:would\s+you\s+)?(?:advise|suggest)\b/i,
  /\badvice\s+(?:on|for)\b/i,
  /\bwhich\s+should\s+(?:i|we)\b/i,
  /\bhelp\s+me\s+(?:design|choose|architect|decide)\b/i,
];

const LOOKUP_PATTERNS = [
  /\b(?:what|which)\s+database\s+did\s+you\b/i,
  /\bdid\s+(?:you|the|it)\b/i,
  /\bwhen\s+(?:was|did)\b/i,
  /\bwhere\s+was\b/i,
  /\bwhat\s+(?:was|were)\s+the\s+(?:outcome|result|metric|p99|latency|findings?)\b/i,
  /\bwhich\s+version\s+of\b/i,
  /\bwhat\s+happened\s+(?:in|when|with)\b/i,
  /\bwhat\s+did\s+you\s+(?:do|use|deploy|choose|implement|write)\b/i,
  /\bwhat\s+replaced\b/i,
  /\bhow\s+(?:did|do)\s+(?:you|we)\b/i,
  /\bhow\s+did\s+you\s+(?:coordinate|deploy|build|scale|implement)\b/i,
];

/**
 * Deterministically classifies a visitor query using pattern heuristics.
 *
 * NOTE: §10.3 requires ambiguous or borderline queries to default to 'advisory'
 * because that enforces stricter applicability gating before automated delivery.
 */
export function classifyQuerySync(query: string): QueryClassificationResult {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      queryClass: 'advisory',
      confidence: 0.5,
      reason: 'Empty query defaults to advisory per §10.3.',
      source: 'rule_fallback',
      isAmbiguous: true,
    };
  }

  // 1. Check About patterns
  for (const pattern of ABOUT_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        queryClass: 'about',
        confidence: 0.92,
        reason: 'Query asks about author biography, site architecture, or verified credentials.',
        source: 'rule_fallback',
      };
    }
  }

  // 2. Explicit Advisory patterns override lookup if recommendations/guidance requested
  for (const pattern of ADVISORY_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        queryClass: 'advisory',
        confidence: 0.9,
        reason: 'Query requests advice, recommendations, tradeoffs, or how-to guidance.',
        source: 'rule_fallback',
      };
    }
  }

  // 3. Clear factual Lookup patterns
  for (const pattern of LOOKUP_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        queryClass: 'lookup',
        confidence: 0.88,
        reason: 'Query asks for specific historical facts or records answerable with citations.',
        source: 'rule_fallback',
      };
    }
  }

  // 4. Ambiguous / Borderline cases: §10.3 STRICT DEFAULT TO ADVISORY
  return {
    queryClass: 'advisory',
    confidence: 0.7,
    reason: 'Ambiguous or ungrounded inquiry defaults to advisory to ensure context applicability gating (§10.3).',
    source: 'rule_fallback',
    isAmbiguous: true,
  };
}

/**
 * Classifies a visitor query via model provider with graceful deterministic fallback (§10.3).
 */
export async function classifyQuery(
  query: string,
  provider?: ModelProvider,
  options?: ClassificationOptions
): Promise<QueryClassificationResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return classifyQuerySync(query);
  }

  if (!provider) {
    return classifyQuerySync(query);
  }

  const prompt = `You are a visitor query classifier for a personal technical portfolio. Classify the user query into exactly one of three categories:
1. "lookup": Factual questions about what, whether, when, or where something happened in recorded entries, answerable strictly from text records with citations (e.g., "Did you use Redis in 2021?", "What database was used for webhook processing?").
2. "advisory": Recommendations, architecture suggestions, decision tradeoffs, or "what should I do" questions whose answer depends on visitor context, stack, or scale constraints (e.g., "Should I use Redis or Postgres for locks?", "How to handle webhook idempotency?").
3. "about": Questions about the portfolio author, personal background, bio, site architecture, contact, credentials, or how the site works (e.g., "Who are you?", "What is your background?", "What tech stack powers this portfolio?").

IMPORTANT: If the query is ambiguous, borderline, or could be either lookup or advisory, classify it as "advisory" because advisory enforces strict applicability context gating before answering (§10.3).

User Query:
"${trimmed}"

Respond in strict JSON with no markdown fences:
{
  "queryClass": "lookup" | "advisory" | "about",
  "confidence": number between 0 and 1,
  "reason": "Brief rationale",
  "isAmbiguous": boolean
}`;

  try {
    const res = await provider.complete({
      model: options?.model || 'default',
      messages: [
        {
          role: 'system',
          content: 'You classify user portfolio questions into lookup, advisory, or about. Ambiguous queries default to advisory. Respond in strict JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.0,
    });

    const text = res.text.trim();
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx !== -1 && endIdx > startIdx) {
      const parsed = JSON.parse(text.slice(startIdx, endIdx + 1));
      const rawClass = parsed.queryClass || parsed.class;
      if (['lookup', 'advisory', 'about'].includes(rawClass)) {
        return {
          queryClass: rawClass as QueryClass,
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
          reason: parsed.reason || 'Classified by model provider.',
          source: 'provider',
          isAmbiguous: Boolean(parsed.isAmbiguous),
        };
      }
    }
    // Fallback if provider response does not match expected schema
    return classifyQuerySync(query);
  } catch {
    // Fallback on provider error, rate limit, or timeout
    return classifyQuerySync(query);
  }
}
