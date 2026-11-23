import { describe, it, expect } from 'vitest';
import { PUBLIC_DIRECTIONS, renderPublicLabPage, DIRECTIONS_CSS, type PublicDirectionId } from './directions.js';

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lum([r, g, b]: [number, number, number]): number {
  const c = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
function contrast(a: string, b: string): number {
  const l1 = lum(hexToRgb(a));
  const l2 = lum(hexToRgb(b));
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe('WP-16.M D-M5 Public Direction Prototypes', () => {
  const dirs: PublicDirectionId[] = ['quiet-editorial', 'field-notebook', 'strata'];

  it('satisfies WCAG AA contrast (>= 4.5:1) in both light and dark themes for all three directions', () => {
    for (const id of dirs) {
      const spec = PUBLIC_DIRECTIONS[id];
      expect(contrast(spec.paletteLight.ink, spec.paletteLight.canvas), `${id} light ink`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(spec.paletteLight.accent, spec.paletteLight.canvas), `${id} light accent`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(spec.paletteDark.ink, spec.paletteDark.canvas), `${id} dark ink`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(spec.paletteDark.accent, spec.paletteDark.canvas), `${id} dark accent`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('renders all templates cleanly with zero admin lp- component leakage', () => {
    expect(DIRECTIONS_CSS).not.toMatch(/--lp-(?!core-)/);
    expect(DIRECTIONS_CSS).not.toMatch(/\.lp-(?!core-)/);
    for (const id of dirs) {
      const html = renderPublicLabPage({
        direction: id,
        template: 'home',
        siteName: 'Living Portfolio',
        ownerName: 'Archive Owner',
        entries: [{ slug: 'sample', title: 'Sample Entry', date: '2026-11-01', profile: 'case-study', summary: 'Summary' }],
      });
      expect(html).toContain(`data-direction="${id}"`);
      expect(html).toContain('noindex, nofollow');
      expect(html).not.toContain('admin-entry');
    }
  });
});
