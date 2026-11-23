import { describe, it, expect } from 'vitest';
import { buildCoreBundleCss, hashCss, renderSkipLink, renderCoreStack, renderCoreCluster } from './index.js';

describe('@living-portfolio/ui-core (D-M1 core floor)', () => {
  it('compiles cascade layers and accessibility floor into core.css with deterministic content hash', () => {
    const css = buildCoreBundleCss();
    expect(css).toContain('@layer reset, tokens, base, primitives, components, patterns, templates, pages, utilities, user-theme;');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain('.lp-core-skip-link');
    expect(css).toContain('.lp-core-sr-only');
    expect(css).toContain('container-type: inline-size');
    expect(hashCss(css)).toMatch(/^[0-9a-f]{10}$/);
  });

  it('renders core accessibility and layout helpers', () => {
    expect(renderSkipLink()).toContain('lp-core-skip-link');
    expect(renderCoreStack('<p>a</p>')).toContain('lp-core-stack');
    expect(renderCoreCluster('<p>a</p>')).toContain('lp-core-cluster');
  });
});
