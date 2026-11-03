import type { Span } from '@living-portfolio/core';
import type { ModelProvider } from '../providers/types.js';
import {
  judgeEntailment,
  judgeEntailmentLLM,
  extractAssertions,
  stripUngroundedAssertions,
  stripUngroundedAssertionsSync,
  type EntailmentJudgeResult,
  type AssertionStrippingResult,
} from './entailment.js';

export * from './entailment.js';

export interface VerificationInput {
  draftText: string;
  citedSpans: Span[];
  visitorFacets: Record<string, any>;
  citedScopes: Record<string, any>[];
  asOfDate?: string | Date | null;
  judgeProvider?: ModelProvider | null;
  degradationStep?: string;
  skipEntailment?: boolean;
}

export interface VerificationResult {
  passed: boolean;
  faithfulnessPassed: boolean;
  applicabilityNote: string;
  anachronismDetected: boolean;
  anachronismDetails?: string;
  verifiedText: string;
  citedScopes: Record<string, any>[];
  isReconstruction: boolean;
  reconstructionNotice?: string;
  strippedAssertions: string[];
  entailmentDetails?: {
    totalAssertions: number;
    entailedAssertions: number;
    strippedAssertions: string[];
    judgeMode: 'llm' | 'deterministic';
  };
}

/**
 * Runs faithfulness, entailment, assertion stripping, applicability, anachronism,
 * and reconstruction verification on drafted answers (§10.6, §10.8, Fix 14).
 */
export function verifyAnswerBeforeDelivery(input: VerificationInput): VerificationResult {
  const { draftText, citedSpans, visitorFacets, citedScopes, asOfDate, degradationStep, skipEntailment } = input;

  let faithfulnessPassed = true;
  let strippedAssertions: string[] = [];
  let workingText = draftText;
  let totalAssertions = 0;
  let entailedAssertionsCount = 0;

  // 1. Faithfulness & Entailment verification with assertion stripping (§10.6, M3)
  if (citedSpans.length === 0 && !draftText.toLowerCase().includes('not in the records')) {
    faithfulnessPassed = false;
    strippedAssertions = extractAssertions(draftText);
    workingText = '';
  } else if (citedSpans.length > 0 && !skipEntailment) {
    const stripRes = stripUngroundedAssertionsSync(draftText, citedSpans);
    totalAssertions = stripRes.totalAssertions;
    entailedAssertionsCount = stripRes.entailedAssertions.length;
    strippedAssertions = stripRes.strippedAssertions;

    if (stripRes.totalAssertions > 0 && !stripRes.hasEntailed) {
      faithfulnessPassed = false;
      workingText = '';
    } else {
      faithfulnessPassed = true;
      workingText = stripRes.verifiedText;
    }
  }

  // 2. Applicability check: compare visitor facets with wired cited scopes (§10.6)
  const matches: string[] = [];
  const mismatches: string[] = [];
  const unknowns: string[] = [];

  const hasVisitorFacets = visitorFacets && Object.keys(visitorFacets).length > 0;
  if (hasVisitorFacets) {
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

  // 3. Anachronism check (for time-travel queries, G5)
  let anachronismDetected = false;
  let anachronismDetails: string | undefined;

  if (asOfDate) {
    const queryYear = new Date(asOfDate).getFullYear();
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

  let verifiedText = workingText;

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

  // 4. Explicit reconstruction labeling (§10.6, §10.8, M3)
  let isReconstruction = false;
  let reconstructionNotice: string | undefined;

  if (asOfDate) {
    isReconstruction = true;
    const formattedDate = new Date(asOfDate).toISOString().split('T')[0];
    reconstructionNotice = `Reconstructed from historical records as of ${formattedDate}, not direct owner testimony.`;
  } else if (degradationStep && ['fallback_provider', 'smaller_shorter', 'extractive'].includes(degradationStep)) {
    isReconstruction = true;
    reconstructionNotice = `Synthesized under provider degradation ladder (${degradationStep}), reconstructed from verified records.`;
  }

  if (isReconstruction && reconstructionNotice && !verifiedText.includes(reconstructionNotice)) {
    verifiedText = verifiedText ? `${verifiedText}\n\n*${reconstructionNotice}*` : `*${reconstructionNotice}*`;
  }

  if (applicabilityNote && !verifiedText.includes(applicabilityNote)) {
    verifiedText = verifiedText ? `${verifiedText}\n\n*${applicabilityNote}*` : `*${applicabilityNote}*`;
  }

  const passed = faithfulnessPassed && !anachronismDetected && verifiedText.length > 0;

  return {
    passed,
    faithfulnessPassed,
    applicabilityNote,
    anachronismDetected,
    anachronismDetails,
    verifiedText,
    citedScopes,
    isReconstruction,
    reconstructionNotice,
    strippedAssertions,
    entailmentDetails: {
      totalAssertions,
      entailedAssertions: entailedAssertionsCount,
      strippedAssertions,
      judgeMode: 'deterministic',
    },
  };
}

/**
 * Asynchronous variant using LLM entailment judge when a provider is available (§10.6, §10.8, Fix 14).
 */
export async function verifyAnswerBeforeDeliveryAsync(input: VerificationInput): Promise<VerificationResult> {
  const {
    draftText,
    citedSpans,
    visitorFacets,
    citedScopes,
    asOfDate,
    judgeProvider,
    degradationStep,
    skipEntailment,
  } = input;

  let faithfulnessPassed = true;
  let strippedAssertions: string[] = [];
  let workingText = draftText;
  let totalAssertions = 0;
  let entailedAssertionsCount = 0;
  let judgeMode: 'llm' | 'deterministic' = judgeProvider ? 'llm' : 'deterministic';

  // 1. Faithfulness & Entailment verification with assertion stripping
  if (citedSpans.length === 0 && !draftText.toLowerCase().includes('not in the records')) {
    faithfulnessPassed = false;
    strippedAssertions = extractAssertions(draftText);
    workingText = '';
  } else if (citedSpans.length > 0 && !skipEntailment) {
    const stripRes = await stripUngroundedAssertions(draftText, citedSpans, { provider: judgeProvider });
    totalAssertions = stripRes.totalAssertions;
    entailedAssertionsCount = stripRes.entailedAssertions.length;
    strippedAssertions = stripRes.strippedAssertions;
    judgeMode = stripRes.judgeMode;

    if (stripRes.totalAssertions > 0 && !stripRes.hasEntailed) {
      faithfulnessPassed = false;
      workingText = '';
    } else {
      faithfulnessPassed = true;
      workingText = stripRes.verifiedText;
    }
  }

  // 2. Applicability check: compare visitor facets with wired cited scopes
  const matches: string[] = [];
  const mismatches: string[] = [];
  const unknowns: string[] = [];

  const hasVisitorFacets = visitorFacets && Object.keys(visitorFacets).length > 0;
  if (hasVisitorFacets) {
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

  // 3. Anachronism check (for time-travel queries, G5)
  let anachronismDetected = false;
  let anachronismDetails: string | undefined;

  if (asOfDate) {
    const queryYear = new Date(asOfDate).getFullYear();
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

  let verifiedText = workingText;

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

  // 4. Explicit reconstruction labeling (§10.6, §10.8, M3)
  let isReconstruction = false;
  let reconstructionNotice: string | undefined;

  if (asOfDate) {
    isReconstruction = true;
    const formattedDate = new Date(asOfDate).toISOString().split('T')[0];
    reconstructionNotice = `Reconstructed from historical records as of ${formattedDate}, not direct owner testimony.`;
  } else if (degradationStep && ['fallback_provider', 'smaller_shorter', 'extractive'].includes(degradationStep)) {
    isReconstruction = true;
    reconstructionNotice = `Synthesized under provider degradation ladder (${degradationStep}), reconstructed from verified records.`;
  }

  if (isReconstruction && reconstructionNotice && !verifiedText.includes(reconstructionNotice)) {
    verifiedText = verifiedText ? `${verifiedText}\n\n*${reconstructionNotice}*` : `*${reconstructionNotice}*`;
  }

  if (applicabilityNote && !verifiedText.includes(applicabilityNote)) {
    verifiedText = verifiedText ? `${verifiedText}\n\n*${applicabilityNote}*` : `*${applicabilityNote}*`;
  }

  const passed = faithfulnessPassed && !anachronismDetected && verifiedText.length > 0;

  return {
    passed,
    faithfulnessPassed,
    applicabilityNote,
    anachronismDetected,
    anachronismDetails,
    verifiedText,
    citedScopes,
    isReconstruction,
    reconstructionNotice,
    strippedAssertions,
    entailmentDetails: {
      totalAssertions,
      entailedAssertions: entailedAssertionsCount,
      strippedAssertions,
      judgeMode,
    },
  };
}
