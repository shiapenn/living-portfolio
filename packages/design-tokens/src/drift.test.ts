import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateOutputs, loadTokens, resolveRef } from '../generate.mjs';

describe('Design tokens single-source drift, D-L4 monotonic proximity, and D-L5 architecture', () => {
  it('generated src/generated.ts, css bundles, and per-pack docs/design/tokens*.md match committed files', () => {
    const { tsOut, cssOut, publicCssOut, coreCssOut, mdOut, mdCoreOut, mdAdminOut, mdPublicOut } = generateOutputs();
    const committedTs = readFileSync(resolve(import.meta.dirname, 'generated.ts'), 'utf8');
    const committedCss = readFileSync(resolve(import.meta.dirname, 'tokens.css'), 'utf8');
    const committedPublicCss = readFileSync(resolve(import.meta.dirname, 'public.css'), 'utf8');
    const committedCoreCss = readFileSync(resolve(import.meta.dirname, 'core.css'), 'utf8');
    const committedMd = readFileSync(resolve(import.meta.dirname, '../../../docs/design/tokens.md'), 'utf8');
    const committedMdCore = readFileSync(resolve(import.meta.dirname, '../../../docs/design/tokens-core.md'), 'utf8');
    const committedMdAdmin = readFileSync(resolve(import.meta.dirname, '../../../docs/design/tokens-admin.md'), 'utf8');
    const committedMdPublic = readFileSync(resolve(import.meta.dirname, '../../../docs/design/tokens-public.md'), 'utf8');

    expect(committedTs).toBe(tsOut);
    expect(committedCss).toBe(cssOut);
    expect(committedPublicCss).toBe(publicCssOut);
    expect(committedCoreCss).toBe(coreCssOut);
    expect(committedMd).toBe(mdOut);
    expect(committedMdCore).toBe(mdCoreOut);
    expect(committedMdAdmin).toBe(mdAdminOut);
    expect(committedMdPublic).toBe(mdPublicOut);
  });

  it('validates three-tier structure and semantic light/dark key parity', () => {
    const tokens = loadTokens();
    const lightKeys = Object.keys(tokens.semantic.light).sort();
    const darkKeys = Object.keys(tokens.semantic.dark).sort();
    expect(lightKeys).toEqual(darkKeys);
    expect(tokens.breakpoints.viewport.sm).toBe(640);
    expect(tokens.breakpoints.viewport.md).toBe(768);
    expect(tokens.breakpoints.container.compact).toBe(400);
    expect('reserved' in tokens).toBe(false);
  });

  it('enforces D-L4 monotonic proximity hierarchy from token source', () => {
    const tokens = loadTokens();
    const px = (key: string): number => {
      const raw = tokens.component[key];
      expect(raw, `Missing component token ${key}`).toBeDefined();
      return parseFloat(resolveRef(raw, tokens, 'light'));
    };

    const inlineSegment = px('space.inline.segment');
    const inlineDotText = px('space.inline.dot-text');
    const inlineIconText = px('space.inline.icon-text');
    const inlineButtonButton = px('space.inline.button-button');
    const inlineTagTag = px('space.inline.tag-tag');

    const labelToControl = px('space.stack.label-to-control');
    const fieldToField = px('space.stack.field-to-field');
    const subsectionToSubsection = px('space.stack.subsection-to-subsection');
    const sectionToSection = px('space.stack.section-to-section');
    const headerToContent = px('space.stack.header-to-content');
    const pageGutterMobile = px('space.inset.page-gutter');
    const pageGutterDesktop = parseFloat(resolveRef(tokens.responsive.md['space.inset.page-gutter'], tokens, 'light'));

    // Inline gaps <= label-to-control < field-to-field < subsection < section
    for (const inlineGap of [inlineSegment, inlineDotText, inlineIconText, inlineButtonButton, inlineTagTag]) {
      expect(inlineGap).toBeLessThanOrEqual(labelToControl);
    }
    expect(labelToControl).toBeLessThan(fieldToField);
    expect(fieldToField).toBeLessThan(subsectionToSubsection);
    expect(subsectionToSubsection).toBeLessThan(sectionToSection);

    // Header-to-content and page-gutter consistency
    expect(headerToContent).toBeGreaterThanOrEqual(fieldToField);
    expect(headerToContent).toBeLessThan(sectionToSection);
    expect(pageGutterMobile).toBeLessThanOrEqual(pageGutterDesktop);
    expect(pageGutterDesktop).toBe(headerToContent);
  });

  it('enforces D-L5: zero unresolved aliases, zero emitted primitives, named z-index order (toast > modal), and zero numeral-named component tokens', () => {
    const tokens = loadTokens();
    const { cssOut } = generateOutputs();

    // No unresolved {…} references in tokens.css
    expect(cssOut).not.toMatch(/:\s*[^;\n}]*\{[a-zA-Z0-9_.-]+\}/);
    // --lp-z-base resolves to 0
    expect(cssOut).toContain('--lp-z-base: 0;');
    // Zero primitive tokens emitted into shipped CSS
    expect(cssOut).not.toContain('--lp-prim-');

    // Named z-index layers in strict ascending order with toast above modal
    const zVal = (k: string) => Number(resolveRef(tokens.component[`z.${k}`], tokens, 'light'));
    expect(zVal('base')).toBeLessThan(zVal('raised'));
    expect(zVal('raised')).toBeLessThan(zVal('sticky'));
    expect(zVal('sticky')).toBeLessThan(zVal('overlay'));
    expect(zVal('overlay')).toBeLessThan(zVal('popover'));
    expect(zVal('popover')).toBeLessThan(zVal('modal'));
    expect(zVal('modal')).toBeLessThan(zVal('toast'));
    expect(zVal('toast')).toBeLessThan(zVal('skip'));

    // No numeral-only size/space/z token names in component tier
    for (const key of Object.keys(tokens.component)) {
      expect(key).not.toMatch(/^(?:size|space|z)\.\d+(?:-\d+)?$/);
    }
  });
});
