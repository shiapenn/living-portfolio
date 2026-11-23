import { describe, it, expect } from 'vitest';
import { PUBLIC_BUNDLE_CSS, PUBLIC_CSS_HASH, renderPublicCard, PUBLIC_SHELL_GALLERY_ENTRY } from './index.js';

describe('@living-portfolio/ui-public (D-M1 public language pack)', () => {
  it('compiles public CSS in cascade layers with zero admin lp- component leakage', () => {
    expect(PUBLIC_BUNDLE_CSS).toContain('@layer reset, tokens, base, primitives, components, patterns, templates, pages, utilities;');
    expect(PUBLIC_BUNDLE_CSS).toContain('--pub-color-surface-canvas');
    expect(PUBLIC_BUNDLE_CSS).not.toMatch(/--lp-(?!core-)/);
    expect(PUBLIC_BUNDLE_CSS).not.toMatch(/\.lp-(?!core-)/);
    expect(PUBLIC_CSS_HASH).toMatch(/^[0-9a-f]{10}$/);
  });

  it('renders public card and exports gallery metadata', () => {
    expect(renderPublicCard({ title: 'Test', bodyHtml: '<p>Hi</p>' })).toContain('pub-card');
    expect(PUBLIC_SHELL_GALLERY_ENTRY.pack).toBe('public');
  });
});
