import { describe, it, expect } from 'vitest';
import { ADMIN_BASE_CSS, ADMIN_CSS_HASH, BUTTON_GALLERY_ENTRY } from './index.js';

describe('@living-portfolio/ui-admin (D-M1 admin language pack)', () => {
  it('compiles admin CSS in cascade layers with zero pub- leakage', () => {
    expect(ADMIN_BASE_CSS).toContain('@layer reset, tokens, base, primitives, components, patterns, templates, pages, utilities;');
    expect(ADMIN_BASE_CSS).toContain('--lp-color-surface-l0');
    expect(ADMIN_BASE_CSS).not.toMatch(/--pub-|\bpub-[a-z]/);
    expect(ADMIN_CSS_HASH).toMatch(/^[0-9a-f]{10}$/);
  });

  it('exports co-located gallery metadata', () => {
    expect(BUTTON_GALLERY_ENTRY.name).toBe('Button');
    expect(BUTTON_GALLERY_ENTRY.pack).toBe('admin');
  });
});
