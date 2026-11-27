import { renderMarkdown, type MarkdownOptions } from "../markdown.js";

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function sanitizeHttpUrl(rawUrl?: string | null): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function renderMarkdownToHtml(md: string, options?: MarkdownOptions): string {
  if (!md || typeof md !== 'string') return '';
  return renderMarkdown(md, { demoteHeadings: true, ...options });
}

export interface AsOfDateInfo {
  date: Date;
  valid: boolean;
  raw: string;
}

export function parseAsOfDate(asOfParam?: string | null): AsOfDateInfo | null {
  if (!asOfParam || typeof asOfParam !== 'string') return null;
  const trimmed = asOfParam.trim();
  if (!trimmed) return null;
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const dateStr = isDateOnly ? `${trimmed}T23:59:59.999Z` : trimmed;
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    return { date: new Date(), valid: false, raw: trimmed };
  }
  return { date: parsed, valid: true, raw: trimmed };
}
