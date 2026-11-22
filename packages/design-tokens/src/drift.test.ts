import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateOutputs, loadTokens } from '../generate.mjs';

describe('Design tokens single-source drift test', () => {
  it('generated src/generated.ts, src/tokens.css, and docs/design/tokens.md match committed files', () => {
    const { tsOut, cssOut, mdOut } = generateOutputs();
    const committedTs = readFileSync(resolve(import.meta.dirname, 'generated.ts'), 'utf8');
    const committedCss = readFileSync(resolve(import.meta.dirname, 'tokens.css'), 'utf8');
    const committedMd = readFileSync(resolve(import.meta.dirname, '../../../docs/design/tokens.md'), 'utf8');

    expect(committedTs).toBe(tsOut);
    expect(committedCss).toBe(cssOut);
    expect(committedMd).toBe(mdOut);
  });

  it('validates three-tier structure and semantic light/dark key parity', () => {
    const tokens = loadTokens();
    const lightKeys = Object.keys(tokens.semantic.light).sort();
    const darkKeys = Object.keys(tokens.semantic.dark).sort();
    expect(lightKeys).toEqual(darkKeys);
    expect(tokens.breakpoints.viewport.sm).toBe(640);
    expect(tokens.breakpoints.viewport.md).toBe(768);
    expect(tokens.breakpoints.container.compact).toBe(400);
  });
});
