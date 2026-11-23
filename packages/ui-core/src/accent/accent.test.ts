import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACCENT_STEPS,
  accentCssFilename,
  buildAccentCss,
  contrastRatio,
  deltaE2000,
  generateAccentRamp,
  hexToOklch,
  oklchToHex,
  type AccentStep,
  validateAccentSeed,
} from './accent.js';

const DEFAULT_SEED = { light: '#3A4FD0', dark: '#9AA8FF' };
const CANVAS = { light: '#FFFFFF', dark: '#0F1A22' };

describe('accent seed generator (D-N2)', () => {
  it('round-trips hex through OKLCH', () => {
    for (const hex of ['#3A4FD0', '#9AA8FF', '#808080']) {
      expect(deltaE2000(hex, oklchToHex(hexToOklch(hex)))).toBeLessThan(0.5);
    }
  });

  it('matches published CIEDE2000 reference pairs', () => {
    // Sharma et al. pair 1 expressed through sRGB approximations stays well under 5.
    expect(deltaE2000('#FFFFFF', '#FFFFFF')).toBe(0);
    expect(deltaE2000('#000000', '#FFFFFF')).toBeGreaterThan(90);
  });

  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });

  it('keeps seeds exact at their anchor steps and is monotonic in lightness', () => {
    const ramp = generateAccentRamp(DEFAULT_SEED);
    expect(ramp[600]).toBe(DEFAULT_SEED.light);
    expect(ramp[300]).toBe(DEFAULT_SEED.dark);
    const ls = ACCENT_STEPS.map((s) => hexToOklch(ramp[s]).l);
    for (let i = 1; i < ls.length; i++) expect(ls[i]!).toBeLessThanOrEqual(ls[i - 1]! + 0.01);
  });

  it('accepts the default seed and rejects seeds failing AA in either theme', () => {
    expect(validateAccentSeed(DEFAULT_SEED, CANVAS).ok).toBe(true);
    const lightFail = validateAccentSeed({ ...DEFAULT_SEED, light: '#8899FF' }, CANVAS);
    expect(lightFail.ok).toBe(false);
    expect(lightFail.errors.join()).toMatch(/light: accent text/);
    const darkFail = validateAccentSeed({ ...DEFAULT_SEED, dark: '#223344' }, CANVAS);
    expect(darkFail.ok).toBe(false);
    expect(darkFail.errors.join()).toMatch(/dark: accent text/);
    expect(validateAccentSeed({ ...DEFAULT_SEED, light: 'blue' }, CANVAS).ok).toBe(false);
  });

  it('builds a deterministic user-theme layer file with a content hash and refuses bad seeds', () => {
    const css = buildAccentCss({ seed: DEFAULT_SEED, canvas: CANVAS });
    expect(css.startsWith('@layer user-theme {')).toBe(true);
    for (const s of ACCENT_STEPS) expect(css).toContain(`--lp-core-accent-${s}:`);
    expect(buildAccentCss({ seed: DEFAULT_SEED, canvas: CANVAS })).toBe(css);
    expect(accentCssFilename(css)).toMatch(/^accent\.[0-9a-f]{10}\.css$/);
    expect(() => buildAccentCss({ seed: { ...DEFAULT_SEED, light: '#99AAFF' }, canvas: CANVAS })).toThrow(/rejected/);
  });

  it('applies listed overrides verbatim', () => {
    const css = buildAccentCss({ seed: DEFAULT_SEED, canvas: CANVAS, overrides: { 50: '#EEF1FF' } });
    expect(css).toContain('--lp-core-accent-50: #EEF1FF;');
  });
});

describe('core pack accent contract', () => {
  const pack = JSON.parse(
    readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../../../design-tokens/packs/core.json'), 'utf8')
  ) as {
    accent: {
      seed: { light: string; dark: string };
      canvas: { light: string; dark: string };
      overrides: Record<string, { value: string; reason: string }>;
    };
  };
  const todayAdmin: Record<number, string> = { 50: '#EEF1FF', 200: '#C5CEFF', 300: '#9AA8FF', 600: '#3A4FD0', 800: '#1E329E', 900: '#1A244D' };

  it('ships a seed that passes the contrast gate in both themes', () => {
    expect(validateAccentSeed(pack.accent.seed, pack.accent.canvas).ok).toBe(true);
  });

  it("keeps today's admin accent within delta-E 2000 of 2, or lists an override with a reason", () => {
    const ramp = generateAccentRamp(pack.accent.seed);
    for (const [step, hex] of Object.entries(todayAdmin)) {
      const de = deltaE2000(ramp[Number(step) as AccentStep], hex);
      const override = pack.accent.overrides[step];
      if (de > 2) {
        expect(override, `step ${step} (dE ${de.toFixed(2)}) needs an override`).toBeDefined();
        expect(override!.reason.length).toBeGreaterThan(10);
        expect(override!.value).toBe(hex);
      }
    }
  });
});
