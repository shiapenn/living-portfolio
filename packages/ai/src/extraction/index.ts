import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DataClass, RoleProfile, Span } from '@living-portfolio/core';
import type { ModelProvider } from '../providers/types.js';

export interface ExtractedFacet {
  key: string;
  value: any;
  quote?: string;
  confidence: number;
}

export interface SuggestedRole {
  spanOrdinal: number;
  role: string;
  confidence: number;
}

export interface ExtractedClaim {
  text: string;
  kind: 'lesson' | 'decision' | 'outcome' | 'finding' | 'fact';
  outcome_status?: 'worked' | 'partly' | 'failed' | 'unresolved' | 'unknown';
  scope?: Record<string, any>;
  confidence: number;
}

export type RedactionItemType = 'secret' | 'email' | 'phone' | 'ip' | 'name' | 'nda' | 'client' | 'exclusion' | 'project';

export interface RedactionPreviewItem {
  type: RedactionItemType;
  match: string;
  index: number;
  pass?: 1 | 2 | 3;
}

export interface MultiPassScanResult {
  pass1Secrets: RedactionPreviewItem[];
  pass2NdaMarkers: RedactionPreviewItem[];
  pass3Entities: RedactionPreviewItem[];
  allWarnings: RedactionPreviewItem[];
  clean: boolean;
  state: 'clean' | 'needs review';
}

export interface ScanOptions {
  exclusions?: string[];
  exclusionsFilePath?: string;
  patterns?: RegExp[];
}

export function findExclusionsFile(customPath?: string): string | null {
  if (customPath && existsSync(customPath)) return customPath;
  const envPath = process.env.REDACTION_EXCLUSIONS_FILE || process.env.REDACTION_EXCLUSIONS_PATH;
  if (envPath && existsSync(envPath)) {
    return envPath;
  }
  const cwdCandidates = [
    resolve(process.cwd(), 'data/redaction-exclusions.json'),
    resolve(process.cwd(), '../data/redaction-exclusions.json'),
    resolve(process.cwd(), '../../data/redaction-exclusions.json'),
  ];
  for (const c of cwdCandidates) {
    if (existsSync(c)) return c;
  }
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    const moduleCandidates = [
      resolve(dir, '../../../../data/redaction-exclusions.json'),
      resolve(dir, '../../../data/redaction-exclusions.json'),
      resolve(dir, '../../data/redaction-exclusions.json'),
      resolve(dir, '../data/redaction-exclusions.json'),
    ];
    for (const c of moduleCandidates) {
      if (existsSync(c)) return c;
    }
  } catch {}
  return null;
}

export function getDefaultExclusions(customPath?: string): string[] {
  if (process.env.REDACTION_EXCLUSIONS) {
    try {
      const parsed = JSON.parse(process.env.REDACTION_EXCLUSIONS);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return process.env.REDACTION_EXCLUSIONS.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
  }
  const filePath = findExclusionsFile(customPath);
  if (filePath) {
    try {
      const content = readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch {}
  }
  return [];
}

/**
 * Multi-Pass Entity Extraction Pipeline (§4.3, §15, 20261020-UX-03)
 * Deconstructs redaction scanning into distinct passes:
 * - Pass 1: Credentials, Tokens & Secrets (API keys, sk- keys, AWS tokens, JWTs, private keys)
 * - Pass 2: NDA, Confidentiality & Restriction Markers
 * - Pass 3: Named Entities, Project Codenames, Internal Hosts, IPs, Emails & Configured Exclusions
 */
export function extractEntitiesMultiPass(
  text: string,
  options?: ScanOptions | string[]
): MultiPassScanResult {
  const pass1Secrets: RedactionPreviewItem[] = [];
  const pass2NdaMarkers: RedactionPreviewItem[] = [];
  const pass3Entities: RedactionPreviewItem[] = [];

  // Mask already-redacted tokens so they are not re-flagged (preserving exact character indices)
  const scannableText = text.replace(/\[REDACTED(?::\s*[^\]]*)?\]/gi, (m) => ' '.repeat(m.length));

  // -------------------------------------------------------------
  // Pass 1: Credentials, Tokens & Secret Keys
  // -------------------------------------------------------------
  const tokenRegex = /(?:bearer\s+[a-zA-Z0-9_\-\.]{15,}|sk-[a-zA-Z0-9_\-]{10,}|AKIA[0-9A-Z]{16}|ey[a-zA-Z0-9_\-]{15,}\.[a-zA-Z0-9_\-]{15,}|-----BEGIN[ A-Z0-9_-]*PRIVATE KEY-----)/gi;
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(scannableText)) !== null) {
    pass1Secrets.push({ type: 'secret', match: text.slice(match.index, match.index + match[0].length), index: match.index, pass: 1 });
  }

  // -------------------------------------------------------------
  // Pass 2: NDA & Confidentiality Markers
  // -------------------------------------------------------------
  const ndaRegex = /\b(?:nda|non-disclosure|strictly\s+confidential|confidential(?:\s+under\s+nda)?|proprietary|internal\s+only|not\s+for\s+distribution)\b/gi;
  while ((match = ndaRegex.exec(scannableText)) !== null) {
    pass2NdaMarkers.push({ type: 'nda', match: text.slice(match.index, match.index + match[0].length), index: match.index, pass: 2 });
  }

  // -------------------------------------------------------------
  // Pass 3: Entities, Project Names, Internal Hosts, IPs & Exclusions
  // -------------------------------------------------------------
  // Client references
  const clientRegex = /\b(?:Client\s+[A-Z][a-zA-Z0-9_-]+|internal\s+client\s+[A-Z][a-zA-Z0-9_-]+|Customer\s+[A-Z][a-zA-Z0-9_-]+)\b/gi;
  while ((match = clientRegex.exec(scannableText)) !== null) {
    pass3Entities.push({ type: 'client', match: text.slice(match.index, match.index + match[0].length), index: match.index, pass: 3 });
  }

  // Emails
  const emailRegex = /\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9]{2,}\b/g;
  while ((match = emailRegex.exec(scannableText)) !== null) {
    pass3Entities.push({ type: 'email', match: text.slice(match.index, match.index + match[0].length), index: match.index, pass: 3 });
  }

  // IPv4 addresses & internal domains
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b|\b[a-zA-Z0-9_-]+\.(?:corp|internal|lan|local)\b/g;
  while ((match = ipRegex.exec(scannableText)) !== null) {
    pass3Entities.push({ type: 'ip', match: text.slice(match.index, match.index + match[0].length), index: match.index, pass: 3 });
  }

  // Configured owner exclusion list
  const activeExclusions = Array.isArray(options)
    ? options
    : options?.exclusions ?? getDefaultExclusions(options?.exclusionsFilePath);

  for (const exclusion of activeExclusions) {
    if (!exclusion || typeof exclusion !== 'string') continue;
    const trimmed = exclusion.trim();
    if (!trimmed) continue;

    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefix = /^\w/.test(trimmed) ? '\\b' : '(?:\\s|^)';
    const suffix = /\w$/.test(trimmed) ? '\\b' : '(?:\\s|$)';
    const regex = new RegExp(`${prefix}${escaped}${suffix}`, 'gi');

    let m: RegExpExecArray | null;
    while ((m = regex.exec(scannableText)) !== null) {
      pass3Entities.push({ type: 'exclusion', match: text.slice(m.index, m.index + m[0].trim().length), index: m.index, pass: 3 });
    }
  }

  // Custom regex patterns from options
  if (options && !Array.isArray(options) && options.patterns) {
    for (const pat of options.patterns) {
      const flags = pat.flags.includes('g') ? pat.flags : pat.flags + 'g';
      const regex = new RegExp(pat.source, flags);
      let m: RegExpExecArray | null;
      while ((m = regex.exec(scannableText)) !== null) {
        pass3Entities.push({ type: 'exclusion', match: text.slice(m.index, m.index + m[0].trim().length), index: m.index, pass: 3 });
      }
    }
  }

  // Consolidate and sort all warnings by position in text
  const allWarnings = [...pass1Secrets, ...pass2NdaMarkers, ...pass3Entities].sort(
    (a, b) => a.index - b.index
  );

  const clean = allWarnings.length === 0;
  return {
    pass1Secrets,
    pass2NdaMarkers,
    pass3Entities,
    allWarnings,
    clean,
    state: clean ? 'clean' : 'needs review',
  };
}

/**
 * Local Redaction Preview (§4.3, §15, UX P0-3 / V3)
 * Runs locally before sending content to third-party model providers.
 * Catches API keys (including sk- keys), NDA markers, client names, emails, IPs, and owner-configured exclusions.
 */
export function scanForConfidentialData(
  text: string,
  options?: ScanOptions | string[]
): RedactionPreviewItem[] {
  return extractEntitiesMultiPass(text, options).allWarnings;
}

/**
 * Determines the DataClass (§13.5, §15) for an entry or text content.
 * If text contains confidential data or matches exclusions, class is 'sensitive'.
 * Otherwise routed by entry visibility / publication state.
 */
export function determineDataClass(
  entry: { visibility?: string },
  bodyMd: string,
  options?: ScanOptions | string[]
): DataClass {
  const findings = scanForConfidentialData(bodyMd, options);
  if (findings.length > 0) {
    return 'sensitive';
  }
  if (entry.visibility === 'private') {
    return 'private';
  }
  if (entry.visibility === 'unlisted') {
    return 'unpublished';
  }
  if (entry.visibility === 'public') {
    return 'public';
  }
  return 'unpublished';
}

/**
 * Async facet extraction pipeline
 */
export async function extractFacetsFromMarkdown(
  bodyMd: string,
  provider: ModelProvider,
  modelName: string = 'mock-llama-3.3-70b'
): Promise<ExtractedFacet[]> {
  const prompt = `Extract structured context facets from this technical text (stack, domain, scale, team size, budget, latency). Return JSON with an array of {key, value, quote, confidence}:
${bodyMd.slice(0, 3000)}`;

  try {
    const res = await provider.complete({
      model: modelName,
      messages: [
        { role: 'system', content: 'You are a precise technical facet extractor. Respond in strict JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    });

    const parsed = JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] || '{"facets": []}');
    return parsed.facets || [];
  } catch {
    return [];
  }
}

/**
 * Async role suggestions pipeline
 */
export async function suggestRolesForSpans(
  spans: Span[],
  profile: RoleProfile,
  provider: ModelProvider,
  modelName: string = 'mock-llama-3.3-70b'
): Promise<SuggestedRole[]> {
  if (spans.length === 0 || profile.roles.length === 0) return [];

  const rolesCatalog = profile.roles.map((r) => `${r.id}: ${r.prompt}`).join('\n');
  const spanSummaries = spans
    .map((s) => `[Span ${s.ordinal}]: ${s.text_exact.slice(0, 150)}...`)
    .join('\n');

  const prompt = `Given the role profile:\n${rolesCatalog}\n\nAssign the most suitable role to each span. Return JSON with {roles: [{spanOrdinal: number, role: string, confidence: number}]}:\n${spanSummaries}`;

  try {
    const res = await provider.complete({
      model: modelName,
      messages: [
        { role: 'system', content: 'You assign structural roles to technical writing spans. Return JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    });

    const parsed = JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] || '{"roles": []}');
    return parsed.roles || [];
  } catch {
    return [];
  }
}

/**
 * Async claim extraction pipeline (§8, §13.5, S7, Fix 13)
 * Extracts structural claims with kinds, outcome statuses, and scopes via model provider,
 * replacing naive keyword matching.
 */
export async function extractClaimsFromSpans(
  spans: Span[],
  provider: ModelProvider,
  modelName: string = 'mock-llama-3.3-70b'
): Promise<Array<ExtractedClaim & { source_span_id?: string; spanOrdinal?: number }>> {
  if (spans.length === 0) return [];

  const spanSummaries = spans
    .map((s) => `[Span ${s.ordinal} id=${s.id}]: ${s.text_exact.slice(0, 300)}`)
    .join('\n');

  const prompt = `Given these text spans from a technical portfolio entry, extract structural claims (lessons, decisions, outcomes, findings, facts) with their outcome status and scope.
Return strict JSON with format:
{
  "claims": [
    {
      "text": "Specific claim or result",
      "kind": "lesson" | "decision" | "outcome" | "finding" | "fact",
      "outcome_status": "worked" | "partly" | "failed" | "unresolved" | "unknown",
      "scope": { "facet_name": "value" },
      "spanOrdinal": 0,
      "confidence": 0.9
    }
  ]
}

Spans:
${spanSummaries}`;

  try {
    const res = await provider.complete({
      model: modelName,
      messages: [
        {
          role: 'system',
          content: 'You extract verified technical claims, decisions, and outcomes with precise scopes and statuses. Respond in strict JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    });

    const parsed = JSON.parse(res.text.match(/\{[\s\S]*\}/)?.[0] || '{"claims": []}');
    const rawClaims = Array.isArray(parsed.claims) ? parsed.claims : [];

    return rawClaims.map((c: any) => {
      const matchedSpan = typeof c.spanOrdinal === 'number'
        ? spans.find((s) => s.ordinal === c.spanOrdinal)
        : spans.find((s) => s.id === c.source_span_id) || spans[0];

      return {
        text: String(c.text || '').slice(0, 500),
        kind: ['lesson', 'decision', 'outcome', 'finding', 'fact'].includes(c.kind) ? c.kind : 'fact',
        outcome_status: ['worked', 'partly', 'failed', 'unresolved', 'unknown'].includes(c.outcome_status)
          ? c.outcome_status
          : 'unknown',
        scope: typeof c.scope === 'object' && c.scope !== null ? c.scope : {},
        confidence: typeof c.confidence === 'number' ? c.confidence : 0.8,
        source_span_id: matchedSpan?.id ?? spans[0]?.id,
        spanOrdinal: matchedSpan?.ordinal ?? 0,
      };
    });
  } catch {
    return [];
  }
}

