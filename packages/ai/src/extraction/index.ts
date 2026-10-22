import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { RoleProfile, Span } from '@living-portfolio/core';
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

export type RedactionItemType = 'secret' | 'email' | 'phone' | 'ip' | 'name' | 'nda' | 'client' | 'exclusion';

export interface RedactionPreviewItem {
  type: RedactionItemType;
  match: string;
  index: number;
}

export interface ScanOptions {
  exclusions?: string[];
  exclusionsFilePath?: string;
}

export function findExclusionsFile(customPath?: string): string | null {
  if (customPath && existsSync(customPath)) return customPath;
  if (process.env.REDACTION_EXCLUSIONS_PATH && existsSync(process.env.REDACTION_EXCLUSIONS_PATH)) {
    return process.env.REDACTION_EXCLUSIONS_PATH;
  }
  const cwdCandidates = [
    resolve(process.cwd(), 'data/redaction-exclusions.json'),
    resolve(process.cwd(), '../data/redaction-exclusions.json'),
    resolve(process.cwd(), '../../data/redaction-exclusions.json'),
    resolve(process.cwd(), 'packages/ai/data/redaction-exclusions.json'),
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
      resolve(dir, './data/redaction-exclusions.json'),
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
 * Local Redaction Preview (§4.3, §15, UX P0-3 / V3)
 * Runs locally before sending content to third-party model providers.
 * Catches API keys (including sk- keys), NDA markers, client names, emails, IPs, and owner-configured exclusions.
 */
export function scanForConfidentialData(
  text: string,
  options?: ScanOptions | string[]
): RedactionPreviewItem[] {
  const items: RedactionPreviewItem[] = [];

  // API keys / tokens (generic bearer, OpenAI sk- keys, AWS, JWT patterns)
  const tokenRegex = /(?:bearer\s+[a-zA-Z0-9_\-\.]{15,}|sk-[a-zA-Z0-9_\-]{10,}|AKIA[0-9A-Z]{16}|ey[a-zA-Z0-9_\-]{15,}\.[a-zA-Z0-9_\-]{15,})/gi;
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(text)) !== null) {
    items.push({ type: 'secret', match: match[0], index: match.index });
  }

  // NDA / confidentiality markers
  const ndaRegex = /\b(?:nda|non-disclosure|strictly\s+confidential|confidential(?:\s+under\s+nda)?)\b/gi;
  while ((match = ndaRegex.exec(text)) !== null) {
    items.push({ type: 'nda', match: match[0], index: match.index });
  }

  // Client names & client references (generic patterns without hardcoded client names)
  const clientRegex = /\b(?:Client\s+[A-Z][a-zA-Z0-9_-]+|internal\s+client\s+[A-Z][a-zA-Z0-9_-]+)\b/gi;
  while ((match = clientRegex.exec(text)) !== null) {
    items.push({ type: 'client', match: match[0], index: match.index });
  }

  // Emails
  const emailRegex = /\b[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9]{2,}\b/g;
  while ((match = emailRegex.exec(text)) !== null) {
    items.push({ type: 'email', match: match[0], index: match.index });
  }

  // IPv4 addresses
  const ipRegex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
  while ((match = ipRegex.exec(text)) !== null) {
    items.push({ type: 'ip', match: match[0], index: match.index });
  }

  // Owner-configured exclusion list (from options, settings, or data file)
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
    while ((m = regex.exec(text)) !== null) {
      items.push({ type: 'exclusion', match: m[0].trim(), index: m.index });
    }
  }

  return items;
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
