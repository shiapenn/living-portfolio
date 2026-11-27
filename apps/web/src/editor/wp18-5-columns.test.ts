import { describe, it, expect } from 'vitest';
import { markdownToTiptapDoc, tiptapDocToMarkdown, normalizeMarkdown } from './markdown-bridge.js';
import { getBlockByNodeType, validateBlockRegistry } from './block-registry.js';
import { renderMarkdown } from '../markdown.js';
import { PUBLIC_BUNDLE_CSS } from '@living-portfolio/ui-public';

describe('WP-18.5 Columns container directive canaries', () => {
  it('[1-COLUMNS-TIPTAP-AST] parses 2, 3, and 4 columns into structured columns/column nodes and round-trips 100% losslessly', () => {
    for (const cols of [2, 3, 4]) {
      const colBlocks = Array.from({ length: cols }, (_, idx) => `:::column\nColumn ${idx + 1} content.\n:::`).join('\n');
      const md = `:::columns{cols=${cols}}\n${colBlocks}\n:::`;
      const doc = markdownToTiptapDoc(md);
      expect(doc.content?.[0]?.type).toBe('columns');
      expect(doc.content?.[0]?.attrs?.cols).toBe(cols);
      expect(doc.content?.[0]?.content?.length).toBe(cols);
      expect(doc.content?.[0]?.content?.[0]?.type).toBe('column');
      const out = tiptapDocToMarkdown(doc);
      expect(normalizeMarkdown(out)).toBe(normalizeMarkdown(md));
    }
  });

  it('[2-NESTED-COLUMNS-ROUNDTRIP] parses nested :::columns inside a :::column and round-trips losslessly', () => {
    const md = [
      ':::columns{cols=2}',
      ':::column',
      'Outer left',
      '',
      ':::columns{cols=2}',
      ':::column',
      'Inner A',
      ':::',
      ':::column',
      'Inner B',
      ':::',
      ':::',
      ':::',
      ':::column',
      'Outer right',
      ':::',
      ':::',
    ].join('\n');

    const doc = markdownToTiptapDoc(md);
    const outer = doc.content?.[0];
    expect(outer?.type).toBe('columns');
    const leftCol = outer?.content?.[0];
    expect(leftCol?.type).toBe('column');
    const innerCols = leftCol?.content?.find((n) => n.type === 'columns');
    expect(innerCols).toBeDefined();
    expect(innerCols?.content?.length).toBe(2);
    expect(normalizeMarkdown(tiptapDocToMarkdown(doc))).toBe(normalizeMarkdown(md));
  });

  it('[3-PUBLIC-COLUMNS-RENDER] renders :::columns into .pub-columns grid preserving source reading order and inner markdown', () => {
    const md = [
      ':::columns{cols=3}',
      ':::column',
      '## First',
      '',
      'Alpha text',
      ':::',
      ':::column',
      '- Beta item',
      ':::',
      ':::column',
      'Gamma text',
      ':::',
      ':::',
    ].join('\n');

    const html = renderMarkdown(md);
    expect(html).toContain('class="pub-columns"');
    expect(html).toContain('data-cols="3"');
    expect(html).not.toContain(':::columns');
    expect(html).not.toContain(':::column');
    const firstIdx = html.indexOf('Alpha text');
    const secondIdx = html.indexOf('Beta item');
    const thirdIdx = html.indexOf('Gamma text');
    expect(firstIdx).toBeGreaterThan(-1);
    expect(secondIdx).toBeGreaterThan(firstIdx);
    expect(thirdIdx).toBeGreaterThan(secondIdx);
  });

  it('[4-PUBLIC-NESTED-COLUMNS] renders nested :::columns cleanly inside .pub-column', () => {
    const md = [
      ':::columns{cols=2}',
      ':::column',
      ':::columns{cols=2}',
      ':::column',
      'Nested one',
      ':::',
      ':::column',
      'Nested two',
      ':::',
      ':::',
      ':::',
      ':::column',
      'Outer two',
      ':::',
      ':::',
    ].join('\n');

    const html = renderMarkdown(md);
    const matches = html.match(/class="pub-columns"/g) ?? [];
    expect(matches.length).toBe(2);
    expect(html).toContain('Nested one');
    expect(html).toContain('Nested two');
    expect(html).toContain('Outer two');
  });

  it('[5-REGISTRY-COLUMNS-BLOCK] registers columns and column blocks with publicRenderer and exportRule', () => {
    const colsDef = getBlockByNodeType('columns');
    const colDef = getBlockByNodeType('column');
    expect(colsDef).toBeDefined();
    expect(colDef).toBeDefined();
    expect(validateBlockRegistry().ok).toBe(true);
  });

  it('[6-PUBLIC-COLUMNS-CSS] bundles responsive .pub-columns grid rules in ui-public', () => {
    expect(PUBLIC_BUNDLE_CSS).toContain('.pub-columns');
    expect(PUBLIC_BUNDLE_CSS).toContain('.pub-column');
    expect(PUBLIC_BUNDLE_CSS).toContain('grid-template-columns');
  });
});
