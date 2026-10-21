import type { Span } from '../types/index.js';

export interface ChunkOptions {
  targetTokens?: number; // default 350
  maxTokens?: number;    // default 500
  minTokens?: number;    // default 50
  prefixSuffixChars?: number; // default 40
}

/**
 * Estimates token count based on whitespace and punctuation.
 * Roughly 1 token ≈ 4 characters or 0.75 words in English.
 */
export function estimateTokens(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  // Approximation: words count + special characters
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 1.3);
}

/**
 * Splits Markdown body into structure-aware spans anchored by character offsets,
 * exact text, prefix, and suffix.
 */
export function chunkMarkdown(
  revisionId: string,
  bodyMd: string,
  options: ChunkOptions = {}
): Omit<Span, 'id'>[] {
  const targetTokens = options.targetTokens ?? 350;
  const maxTokens = options.maxTokens ?? 500;
  const prefixSuffixChars = options.prefixSuffixChars ?? 40;

  if (!bodyMd || bodyMd.trim().length === 0) {
    return [];
  }

  // Split by headers and double newlines (paragraphs)
  // Preserve offsets accurately without catastrophic backtracking
  const paragraphs: { text: string; start: number; end: number }[] = [];
  const lines = bodyMd.split('\n');
  let blockLines: string[] = [];
  let blockStart = 0;
  let cursor = 0;

  function flushBlock() {
    if (blockLines.length > 0) {
      const blockRaw = blockLines.join('\n');
      const trimmed = blockRaw.trim();
      if (trimmed.length > 0) {
        const lead = blockRaw.indexOf(trimmed);
        paragraphs.push({
          text: trimmed,
          start: blockStart + lead,
          end: blockStart + lead + trimmed.length,
        });
      }
      blockLines = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineStart = cursor;
    cursor += line.length + 1; // + 1 for newline

    if (line.trim().length === 0) {
      flushBlock();
      blockStart = cursor;
    } else if (/^#{1,6}\s/.test(line.trim())) {
      flushBlock();
      const trimmed = line.trim();
      paragraphs.push({
        text: trimmed,
        start: lineStart + line.indexOf(trimmed),
        end: lineStart + line.indexOf(trimmed) + trimmed.length,
      });
      blockStart = cursor;
    } else {
      if (blockLines.length === 0) {
        blockStart = lineStart;
      }
      blockLines.push(line);
    }
  }
  flushBlock();

  // If no paragraphs matched, fallback to full text
  if (paragraphs.length === 0) {
    const trimmed = bodyMd.trim();
    const start = bodyMd.indexOf(trimmed);
    const end = start + trimmed.length;
    return [
      {
        revision_id: revisionId,
        ordinal: 0,
        start_off: start,
        end_off: end,
        text_exact: trimmed,
        prefix: '',
        suffix: '',
        token_count: estimateTokens(trimmed),
      },
    ];
  }

  // Combine small paragraphs or break large ones
  const spans: Omit<Span, 'id'>[] = [];
  let currentGroup: typeof paragraphs = [];
  let currentTokens = 0;

  function flushGroup() {
    if (currentGroup.length === 0) return;
    const first = currentGroup[0];
    const last = currentGroup[currentGroup.length - 1];
    const start_off = first.start;
    const end_off = last.end;
    const text_exact = bodyMd.slice(start_off, end_off);

    const prefixStart = Math.max(0, start_off - prefixSuffixChars);
    const prefix = bodyMd.slice(prefixStart, start_off);

    const suffixEnd = Math.min(bodyMd.length, end_off + prefixSuffixChars);
    const suffix = bodyMd.slice(end_off, suffixEnd);

    spans.push({
      revision_id: revisionId,
      ordinal: spans.length,
      start_off,
      end_off,
      text_exact,
      prefix,
      suffix,
      token_count: estimateTokens(text_exact),
    });

    currentGroup = [];
    currentTokens = 0;
  }

  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para.text);

    // If a single paragraph is too large (> maxTokens), flush current and split paragraph
    if (paraTokens > maxTokens) {
      flushGroup();
      // Split large paragraph into sentences without polynomial backtracking
      const sentences = para.text.split(/(?<=[.!?])\s+/).filter(Boolean);
      let subTokens = 0;
      let subStart = para.start;

      for (const sent of sentences) {
        const sentTokens = estimateTokens(sent);
        if (subTokens + sentTokens > targetTokens && subTokens > 0) {
          const subText = bodyMd.slice(subStart, subStart + (para.text.indexOf(sent, subStart - para.start) - (subStart - para.start)));
          const end_off = subStart + subText.length;
          const prefixStart = Math.max(0, subStart - prefixSuffixChars);
          const suffixEnd = Math.min(bodyMd.length, end_off + prefixSuffixChars);

          spans.push({
            revision_id: revisionId,
            ordinal: spans.length,
            start_off: subStart,
            end_off,
            text_exact: subText.trim(),
            prefix: bodyMd.slice(prefixStart, subStart),
            suffix: bodyMd.slice(end_off, suffixEnd),
            token_count: estimateTokens(subText),
          });

          subStart = end_off;
          subTokens = 0;
        }
        subTokens += sentTokens;
      }

      if (subStart < para.end) {
        const remaining = bodyMd.slice(subStart, para.end);
        const prefixStart = Math.max(0, subStart - prefixSuffixChars);
        const suffixEnd = Math.min(bodyMd.length, para.end + prefixSuffixChars);
        spans.push({
          revision_id: revisionId,
          ordinal: spans.length,
          start_off: subStart,
          end_off: para.end,
          text_exact: remaining.trim(),
          prefix: bodyMd.slice(prefixStart, subStart),
          suffix: bodyMd.slice(para.end, suffixEnd),
          token_count: estimateTokens(remaining),
        });
      }
      continue;
    }

    if (currentTokens + paraTokens > maxTokens && currentGroup.length > 0) {
      flushGroup();
    }

    currentGroup.push(para);
    currentTokens += paraTokens;

    if (currentTokens >= targetTokens) {
      flushGroup();
    }
  }

  flushGroup();
  return spans;
}

/**
 * Re-anchors a span in a modified document using text-quote selector matching
 * (exact match, followed by prefix/suffix context matching).
 */
export function reanchorSpan(
  span: Pick<Span, 'text_exact' | 'prefix' | 'suffix' | 'start_off'>,
  newBodyMd: string
): { found: boolean; start_off: number; end_off: number; confidence: number } {
  // 1. Exact match at exact old offset
  if (newBodyMd.slice(span.start_off, span.start_off + span.text_exact.length) === span.text_exact) {
    return {
      found: true,
      start_off: span.start_off,
      end_off: span.start_off + span.text_exact.length,
      confidence: 1.0,
    };
  }

  // 2. Exact match anywhere in new body
  const exactIndex = newBodyMd.indexOf(span.text_exact);
  if (exactIndex !== -1 && newBodyMd.indexOf(span.text_exact, exactIndex + 1) === -1) {
    // Unique exact match
    return {
      found: true,
      start_off: exactIndex,
      end_off: exactIndex + span.text_exact.length,
      confidence: 0.95,
    };
  }

  // 3. Match with prefix & suffix
  if (span.prefix && span.suffix) {
    const combined = `${span.prefix}${span.text_exact}${span.suffix}`;
    const combinedIndex = newBodyMd.indexOf(combined);
    if (combinedIndex !== -1) {
      const start = combinedIndex + span.prefix.length;
      return {
        found: true,
        start_off: start,
        end_off: start + span.text_exact.length,
        confidence: 0.9,
      };
    }
  }

  // 4. Fallback search for text_exact first occurrence
  if (exactIndex !== -1) {
    return {
      found: true,
      start_off: exactIndex,
      end_off: exactIndex + span.text_exact.length,
      confidence: 0.7,
    };
  }

  return {
    found: false,
    start_off: 0,
    end_off: 0,
    confidence: 0,
  };
}
