import { describe, expect, it } from 'vitest';
import {
  BUILTIN_THEME_PACKS_V2,
  DEFAULT_ADMIN_THEME_PACK,
  DEFAULT_ACCENT_CSS_FILENAME,
  buildThemePackCss,
  isDefaultThemePackV2,
  resolveAdminThemeCssAsset,
  themePackCssFilename,
  validateThemePackV2,
} from '../index.js';

describe('WP-17.8 Appearance v2 ThemePack schema & generator', () => {
  it('validates all built-in theme packs against WCAG AA', () => {
    for (const [id, pack] of Object.entries(BUILTIN_THEME_PACKS_V2)) {
      const res = validateThemePackV2(pack);
      expect(res.ok, `Built-in pack ${id} should pass AA`).toBe(true);
      if (res.ok) {
        expect(res.contrast.lightOnCanvas).toBeGreaterThanOrEqual(4.5);
        expect(res.contrast.darkOnCanvas).toBeGreaterThanOrEqual(4.5);
        expect(res.contrast.lightOnAccent).toBeGreaterThanOrEqual(4.5);
        expect(res.contrast.darkOnAccent).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('rejects packs that fail WCAG AA contrast', () => {
    const bad = {
      ...DEFAULT_ADMIN_THEME_PACK,
      accent: { light: '#CCCCCC', dark: '#222222' },
    };
    const res = validateThemePackV2(bad);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.some((e) => e.includes('4.5:1'))).toBe(true);
    }
  });

  it('rejects arbitrary CSS or unknown fields', () => {
    const injected = {
      ...DEFAULT_ADMIN_THEME_PACK,
      customCss: 'body { display: none; }',
    };
    const res = validateThemePackV2(injected);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.errors.some((e) => e.includes('customCss'))).toBe(true);
    }
  });

  it('falls back to DEFAULT_ACCENT_CSS_FILENAME when unchanged (zero cost)', () => {
    expect(isDefaultThemePackV2(DEFAULT_ADMIN_THEME_PACK)).toBe(true);
    const asset = resolveAdminThemeCssAsset(DEFAULT_ADMIN_THEME_PACK);
    expect(asset.filename).toBe(DEFAULT_ACCENT_CSS_FILENAME);
    expect(asset.css).toBeNull();
  });

  it('generates cacheable theme.<hash>.css in @layer user-theme when customised', () => {
    const custom = BUILTIN_THEME_PACKS_V2['warm-ink'];
    expect(isDefaultThemePackV2(custom)).toBe(false);
    const css = buildThemePackCss(custom);
    expect(css).toContain('@layer user-theme');
    expect(css).toContain('--lp-core-accent-600: #9A3412;');
    expect(css).toContain('--lp-radius-r2: 10px;');
    expect(css).toContain('Atkinson Hyperlegible Next');
    const filename = themePackCssFilename(css);
    expect(filename).toMatch(/^theme\.[0-9a-f]{10}\.css$/);
    const asset = resolveAdminThemeCssAsset(custom);
    expect(asset.filename).toBe(filename);
    expect(asset.css).toBe(css);
  });
});
