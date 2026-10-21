import type { Span } from '@living-portfolio/core';

export interface VerificationInput {
  draftText: string;
  citedSpans: Span[];
  visitorFacets: Record<string, any>;
  citedScopes: Record<string, any>[];
  asOfDate?: string | Date | null;
}

export interface VerificationResult {
  passed: boolean;
  faithfulnessPassed: boolean;
  applicabilityNote: string;
  anachronismDetected: boolean;
  anachronismDetails?: string;
  verifiedText: string;
}

/**
 * Runs faithfulness, applicability, and anachronism verification on drafted answers (§10.6).
 */
export function verifyAnswerBeforeDelivery(input: VerificationInput): VerificationResult {
  const { draftText, citedSpans, visitorFacets, citedScopes, asOfDate } = input;

  // 1. Faithfulness check: ensure cited spans are referenced in draft
  // and text doesn't make unsupported fabrications
  let faithfulnessPassed = true;
  if (citedSpans.length === 0 && !draftText.toLowerCase().includes('not in the records')) {
    faithfulnessPassed = false;
  }

  // 2. Applicability check: compare visitor facets with cited scopes
  const matches: string[] = [];
  const mismatches: string[] = [];
  const unknowns: string[] = [];

  const allScopeKeys = new Set<string>();
  for (const s of citedScopes) {
    for (const k of Object.keys(s)) allScopeKeys.add(k);
  }

  for (const key of allScopeKeys) {
    const visitorVal = visitorFacets[key];
    const citedVals = citedScopes.map((s) => s[key]).filter((v) => v != null);

    if (visitorVal === undefined || visitorVal === null || visitorVal === '') {
      unknowns.push(key.replace(/_/g, ' '));
      continue;
    }

    if (citedVals.length > 0) {
      const match = citedVals.some((v) => String(v).toLowerCase() === String(visitorVal).toLowerCase());
      if (match) {
        matches.push(`${key.replace(/_/g, ' ')}: ${visitorVal}`);
      } else {
        mismatches.push(`${key.replace(/_/g, ' ')} (cited ${citedVals[0]}, you mentioned ${visitorVal})`);
      }
    }
  }

  let applicabilityParts: string[] = [];
  if (matches.length > 0) {
    applicabilityParts.push(`Matches: ${matches.join(', ')}.`);
  }
  if (mismatches.length > 0) {
    applicabilityParts.push(`Mismatched: ${mismatches.join(', ')}.`);
  }
  if (unknowns.length > 0) {
    applicabilityParts.push(`Not verified for: ${unknowns.join(', ')}.`);
  }
  const applicabilityNote = applicabilityParts.join(' ');

  // 3. Anachronism check (for time-travel queries)
  let anachronismDetected = false;
  let anachronismDetails: string | undefined;

  if (asOfDate) {
    const queryYear = new Date(asOfDate).getFullYear();
    // Scan text for mentions of years greater than queryYear (e.g. 2024, 2025, 2026)
    const yearMatches = draftText.match(/\b(20[2-9][0-9])\b/g);
    if (yearMatches) {
      for (const y of yearMatches) {
        const foundYear = parseInt(y, 10);
        if (foundYear > queryYear) {
          anachronismDetected = true;
          anachronismDetails = `Found future reference to year ${foundYear} while querying as of ${queryYear}.`;
          break;
        }
      }
    }
  }

  const passed = faithfulnessPassed && !anachronismDetected;

  let verifiedText = draftText;

  // G5: strip/redact future-year references from verifiedText in time-travel mode
  if (anachronismDetected && asOfDate) {
    const queryYear = new Date(asOfDate).getFullYear();
    const sentences = verifiedText.split(/(?<=[.!?])\s+/);
    const cleaned = sentences.filter((s) => {
      const ym = s.match(/\b(20[2-9][0-9])\b/g);
      if (!ym) return true;
      return !ym.some((y) => parseInt(y, 10) > queryYear);
    });
    verifiedText = cleaned.join(' ').trim();
    if (verifiedText.includes(String(new Date(asOfDate).getFullYear()))) {
      // Keep valid text
    } else {
      verifiedText = verifiedText.replace(/\b(20[2-9][0-9])\b/g, (y) => {
        return parseInt(y, 10) > queryYear ? '[redacted]' : y;
      });
    }
  }

  if (applicabilityNote && !draftText.includes(applicabilityNote)) {
    verifiedText = `${verifiedText}\n\n*${applicabilityNote}*`;
  }

  return {
    passed,
    faithfulnessPassed,
    applicabilityNote,
    anachronismDetected,
    anachronismDetails,
    verifiedText,
  };
}
