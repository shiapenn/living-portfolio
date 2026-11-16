import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  getRegisteredBlocks,
  validateBlockRegistry,
} from './block-registry.js';
import {
  markdownToTiptapDoc,
  normalizeMarkdown,
  tiptapDocToMarkdown,
} from './markdown-bridge.js';

describe('D-LAYOUT #9 block registry and Markdown round-trip gate', () => {
  it('ensures every registered block has a publicRenderer and exportRule', () => {
    const blocks = getRegisteredBlocks();
    expect(blocks.length).toBeGreaterThanOrEqual(10);
    const check = validateBlockRegistry();
    expect(check.errors).toEqual([]);
    expect(check.ok).toBe(true);
  });

  it('round-trips every fixture (headings, lists, quotes, callouts, code, tables, divider, and future :::columns directives) 100% losslessly', () => {
    const fixtures = [
      '# Heading 1\n\n## Heading 2\n\n### Heading 3',
      'Paragraph with **bold**, *italic*, `inline code`, and [a link](https://example.com).',
      '- First item\n- Second item\n- Third item',
      '1. Step one\n2. Step two\n3. Step three',
      '> A thoughtful blockquote with *emphasis*.',
      '> [!NOTE]\n> Callout body preserved.',
      '```ts\nconst x = 1;\nconsole.log(x);\n```',
      '| Column A | Column B |\n| --- | --- |\n| 1 | 2 |',
      'Before divider\n\n---\n\nAfter divider',
      ':::columns{cols=2}\n:::column\nLeft column text.\n:::\n:::column\nRight column text.\n:::\n:::',
    ];

    for (const md of fixtures) {
      const doc = markdownToTiptapDoc(md);
      const out = tiptapDocToMarkdown(doc);
      expect(out).toBe(normalizeMarkdown(md));
    }
  });

  it('round-trips every seeded entry body_md from packages/db/src/seed.ts 100% identically', () => {
    const seedPath = resolve(process.cwd(), '../../packages/db/src/seed.ts');
    const seedSrc = readFileSync(seedPath, 'utf8');
    const bodyMatches = [...seedSrc.matchAll(/body_md:\s*`([\s\S]*?)`/g)];
    expect(bodyMatches.length).toBeGreaterThan(0);

    for (const match of bodyMatches) {
      const rawBody = match[1];
      const doc = markdownToTiptapDoc(rawBody);
      const roundTripped = tiptapDocToMarkdown(doc);
      expect(roundTripped).toBe(normalizeMarkdown(rawBody));
    }
  });
});
