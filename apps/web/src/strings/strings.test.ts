import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  formatActionableError,
  formatCount,
  formatPlural,
  formatTitleWithCount,
} from './formatters.js';
import { EDITOR_HELP } from './help/editor.js';
import { EDITOR_STRINGS, STRINGS, WIZARD_STRINGS } from './en.js';
import { renderReferenceEditorPage } from '../pages/admin/entries/editor.js';

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectStrings);
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings);
  }
  return [];
}

const JARGON_PATTERNS = [
  /\bL[0-3]\b/,
  /Enrichment pipeline/i,
  /revisions purged/i,
  /\bHTTP\s+\d{3}\b/,
  /\b(?:UX|CP)-\d+\b/,
];

const HTML_TAG_PATTERN = /<[a-z!/]/i;

function extractOutsideBlocks(html: string, tagName: string): string {
  const lower = html.toLowerCase();
  const openTag = `<${tagName}`;
  const closeTag = `</${tagName}>`;
  let out = '';
  let pos = 0;
  while (pos < html.length) {
    const start = lower.indexOf(openTag, pos);
    if (start === -1) {
      out += html.slice(pos);
      break;
    }
    out += html.slice(pos, start);
    const end = lower.indexOf(closeTag, start + openTag.length);
    if (end === -1) break;
    pos = end + closeTag.length;
  }
  return out;
}

describe('WP-15.5 Copy and Help Catalogues', () => {
  it('formats counts, plurals, and titles with counts from one helper', () => {
    expect(formatPlural(1, 'entry', 'entries')).toBe('entry');
    expect(formatPlural(0, 'entry', 'entries')).toBe('entries');
    expect(formatPlural(2, 'entry', 'entries')).toBe('entries');
    expect(formatPlural(1, 'step')).toBe('step');
    expect(formatPlural(3, 'step')).toBe('steps');

    expect(formatCount(1, 'entry', 'entries')).toBe('1 entry');
    expect(formatCount(5, 'entry', 'entries')).toBe('5 entries');
    expect(formatTitleWithCount('Entries', 1, 'entry', 'entries')).toBe('Entries (1 entry)');
    expect(formatTitleWithCount('Entries', 4, 'entry', 'entries')).toBe('Entries (4 entries)');
  });

  it('formats actionable errors without leaking HTTP codes or internal enums', () => {
    expect(formatActionableError({ status: 0 })).toContain('Check your connection');
    expect(formatActionableError({ status: 401 })).toContain('Sign in again');
    expect(formatActionableError({ status: 403 })).toContain("don't have permission");
    expect(formatActionableError({ status: 404 })).toContain('Refresh the list');
    expect(formatActionableError({ status: 503, action: 'save this entry' })).toBe(
      'Could not save this entry. Wait a moment and try again.'
    );
    expect(
      formatActionableError({ status: 400, message: 'Title is required.', fix: 'Add a title.' })
    ).toBe('Title is required. Add a title.');

    for (const status of [0, 400, 401, 403, 404, 500, 502]) {
      const msg = formatActionableError({ status, action: 'save this entry' });
      expect(msg).not.toMatch(/\bHTTP\b/);
    }
  });

  it('structures STRINGS by area and validates EDITOR_HELP schema', () => {
    expect(STRINGS.admin.editor).toBe(EDITOR_STRINGS);
    expect(STRINGS.admin.setup).toBe(WIZARD_STRINGS);
    expect(STRINGS.help.editor).toBe(EDITOR_HELP);

    for (const topic of Object.values(EDITOR_HELP)) {
      expect(topic.id.length).toBeGreaterThan(0);
      expect(topic.title.length).toBeGreaterThan(0);
      expect(topic.what.length).toBeGreaterThan(0);
      expect(topic.when.length).toBeGreaterThan(0);
      expect(topic.how.length).toBeGreaterThan(0);
      expect(topic.impact.length).toBeGreaterThan(0);
      if ('options' in topic && topic.options) {
        for (const opt of topic.options) {
          expect(opt.bestFor.length).toBeGreaterThan(0);
          expect(opt.tradeOff.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('contains zero internal jargon in owner-facing catalogues and rendered Reference Editor', () => {
    const allCatalogueStrings = [
      ...collectStrings(EDITOR_STRINGS),
      ...collectStrings(EDITOR_HELP),
      ...collectStrings(WIZARD_STRINGS),
    ];
    for (const text of allCatalogueStrings) {
      expect(text, `Catalogue string "${text}" contains HTML tag`).not.toMatch(HTML_TAG_PATTERN);
      for (const pattern of JARGON_PATTERNS) {
        expect(text, `Catalogue string "${text}" matched ${pattern}`).not.toMatch(pattern);
      }
    }

    // Negative fixtures proving HTML_TAG_PATTERN catches planted <SCRIPT> and <style strings
    expect('<SCRIPT>alert(1)</SCRIPT>').toMatch(HTML_TAG_PATTERN);
    expect('<style>body{color:red}</style>').toMatch(HTML_TAG_PATTERN);

    const editorHtml = renderReferenceEditorPage({
      entries: [
        {
          id: 'e1',
          slug: 'sample-entry',
          title: 'Sample entry',
          body: 'Hello world',
          visibility: 'draft',
          date: '2026-11-14',
          temporalConfidence: 'exact',
          profile: 'case-study',
        },
      ],
      selectedId: 'e1',
    });
    const visibleEditorMarkup = extractOutsideBlocks(extractOutsideBlocks(editorHtml, 'style'), 'script');
    for (const pattern of JARGON_PATTERNS) {
      expect(visibleEditorMarkup).not.toMatch(pattern);
    }
  });

  it('uses EDITOR_STRINGS and formatActionableError in editor-page.ts without hardcoded HTTP error strings', () => {
    const editorClientPath = join(process.cwd(), 'src/client/admin/editor-page.ts');
    const source = readFileSync(editorClientPath, 'utf8');
    expect(source).toContain('EDITOR_STRINGS');
    expect(source).toContain('formatActionableError');
    expect(source).not.toMatch(/Server error \(HTTP/);
    expect(source).not.toMatch(/Enrichment pipeline/);
  });
});
