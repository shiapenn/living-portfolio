/**
 * Appearance v2 theme-pack schema, contrast validation, and CSS generator (WP-17.8, ADR-023).
 *
 * Pure functions, zero external dependencies:
 * - Typed schema over the token tiers (no arbitrary CSS allowed)
 * - Selectable built-in packs, all WCAG AA verified
 * - Constrained customisation: accent seed (light/dark), density proximity-tier table,
 *   allowed radius scale, vetted self-hosted font stack
 * - Generates a single cacheable `@layer user-theme` stylesheet (`theme.<hash>.css`)
 * - Falls back to `DEFAULT_ACCENT_CSS_FILENAME` when unchanged (zero runtime cost)
 */
import { createHash } from 'node:crypto';
import {
  ACCENT_STEPS,
  ACCENT_VAR_PREFIX,
  contrastRatio,
  generateAccentRamp,
  hexToOklch,
  oklchToHex,
  validateAccentSeed,
  type AccentSeed,
} from '../accent/accent.js';
import { DEFAULT_ACCENT_CSS_FILENAME } from '../accent/default-accent.js';

export type ThemeScope = 'admin' | 'public';
export type ThemePackId = 'quiet-default' | 'editorial-slate' | 'warm-ink' | 'high-contrast';
export type DensityChoice = 'comfortable' | 'compact' | 'spacious';
export type RadiusScaleChoice = 'default' | 'sharp' | 'soft';
export type VettedFontChoice = 'system' | 'atkinson' | 'literata';

export interface ThemePackV2 {
  version: 2;
  id: string;
  name: string;
  packId: ThemePackId;
  accent: AccentSeed;
  density: DensityChoice;
  radiusScale: RadiusScaleChoice;
  fontFamily: VettedFontChoice;
}

export interface ThemePackContrastSummary {
  lightOnCanvas: number;
  darkOnCanvas: number;
  lightOnAccent: number;
  darkOnAccent: number;
}

export type ThemePackValidationResult =
  | { ok: true; pack: ThemePackV2; contrast: ThemePackContrastSummary }
  | { ok: false; errors: string[] };

export const THEME_CANVAS = {
  light: '#FFFFFF',
  dark: '#111318',
} as const;

export const ALLOWED_PACK_IDS: readonly ThemePackId[] = [
  'quiet-default',
  'editorial-slate',
  'warm-ink',
  'high-contrast',
];

export const ALLOWED_DENSITIES: readonly DensityChoice[] = ['comfortable', 'compact', 'spacious'];
export const ALLOWED_RADIUS_SCALES: readonly RadiusScaleChoice[] = ['default', 'sharp', 'soft'];
export const ALLOWED_FONTS: readonly VettedFontChoice[] = ['system', 'atkinson', 'literata'];

export const DENSITY_PROXIMITY_TABLES: Record<DensityChoice, Record<string, string>> = {
  comfortable: {
    '--lp-space-proximity-1': '4px',
    '--lp-space-proximity-2': '8px',
    '--lp-space-proximity-3': '16px',
    '--lp-space-proximity-4': '24px',
  },
  compact: {
    '--lp-space-proximity-1': '4px',
    '--lp-space-proximity-2': '6px',
    '--lp-space-proximity-3': '12px',
    '--lp-space-proximity-4': '20px',
  },
  spacious: {
    '--lp-space-proximity-1': '6px',
    '--lp-space-proximity-2': '10px',
    '--lp-space-proximity-3': '20px',
    '--lp-space-proximity-4': '28px',
  },
};

export const RADIUS_SCALE_TABLES: Record<RadiusScaleChoice, Record<string, string>> = {
  default: {
    '--lp-radius-r1': '4px',
    '--lp-radius-r2': '8px',
    '--lp-radius-r3': '12px',
  },
  sharp: {
    '--lp-radius-r1': '2px',
    '--lp-radius-r2': '4px',
    '--lp-radius-r3': '6px',
  },
  soft: {
    '--lp-radius-r1': '6px',
    '--lp-radius-r2': '10px',
    '--lp-radius-r3': '16px',
  },
};

export const VETTED_FONT_STACKS: Record<VettedFontChoice, string> = {
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  atkinson: '"Atkinson Hyperlegible Next", "Atkinson Fallback", system-ui, -apple-system, sans-serif',
  literata: '"Literata", "Literata Fallback", Georgia, Cambria, "Times New Roman", serif',
};

export const BUILTIN_THEME_PACKS_V2: Record<ThemePackId, ThemePackV2> = {
  'quiet-default': {
    version: 2,
    id: 'quiet-default',
    name: 'Quiet default',
    packId: 'quiet-default',
    accent: { light: '#3A4FD0', dark: '#A5B4FC' },
    density: 'comfortable',
    radiusScale: 'default',
    fontFamily: 'system',
  },
  'editorial-slate': {
    version: 2,
    id: 'editorial-slate',
    name: 'Editorial slate',
    packId: 'editorial-slate',
    accent: { light: '#1E5B70', dark: '#7DD3FC' },
    density: 'spacious',
    radiusScale: 'sharp',
    fontFamily: 'literata',
  },
  'warm-ink': {
    version: 2,
    id: 'warm-ink',
    name: 'Warm ink',
    packId: 'warm-ink',
    accent: { light: '#9A3412', dark: '#FDBA74' },
    density: 'comfortable',
    radiusScale: 'soft',
    fontFamily: 'atkinson',
  },
  'high-contrast': {
    version: 2,
    id: 'high-contrast',
    name: 'High contrast',
    packId: 'high-contrast',
    accent: { light: '#1D4ED8', dark: '#BFDBFE' },
    density: 'comfortable',
    radiusScale: 'sharp',
    fontFamily: 'atkinson',
  },
};

export const DEFAULT_ADMIN_THEME_PACK: ThemePackV2 = BUILTIN_THEME_PACKS_V2['quiet-default'];
export const DEFAULT_PUBLIC_THEME_PACK: ThemePackV2 = BUILTIN_THEME_PACKS_V2['editorial-slate'];

const ALLOWED_TOP_KEYS = new Set([
  'version',
  'id',
  'name',
  'packId',
  'accent',
  'density',
  'radiusScale',
  'fontFamily',
]);

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Validate a ThemePackV2 payload against the typed token-tier schema and WCAG AA contrast gates.
 * Rejects arbitrary CSS properties, unknown keys, or failing contrast ratios.
 */
export function validateThemePackV2(input: unknown): ThemePackValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: ['Theme pack must be a JSON object.'] };
  }
  const obj = input as Record<string, unknown>;
  const errors: string[] = [];

  for (const key of Object.keys(obj)) {
    if (!ALLOWED_TOP_KEYS.has(key)) {
      errors.push(`Unknown property "${key}" is not allowed (arbitrary CSS and custom fields are rejected).`);
    }
  }

  if (obj.version !== 2) {
    errors.push('Theme pack version must be 2.');
  }
  const id = typeof obj.id === 'string' && /^[a-z0-9-]{1,48}$/.test(obj.id) ? obj.id : '';
  if (!id) {
    errors.push('Theme pack id must be 1-48 lowercase letters, digits, or hyphens.');
  }
  const name = typeof obj.name === 'string' && obj.name.trim().length > 0 && obj.name.trim().length <= 64
    ? obj.name.trim()
    : '';
  if (!name) {
    errors.push('Theme pack name must be a non-empty string (up to 64 characters).');
  }
  const packId = obj.packId as ThemePackId;
  if (!ALLOWED_PACK_IDS.includes(packId)) {
    errors.push(`packId must be one of: ${ALLOWED_PACK_IDS.join(', ')}.`);
  }
  const density = obj.density as DensityChoice;
  if (!ALLOWED_DENSITIES.includes(density)) {
    errors.push(`density must be one of: ${ALLOWED_DENSITIES.join(', ')}.`);
  }
  const radiusScale = obj.radiusScale as RadiusScaleChoice;
  if (!ALLOWED_RADIUS_SCALES.includes(radiusScale)) {
    errors.push(`radiusScale must be one of: ${ALLOWED_RADIUS_SCALES.join(', ')}.`);
  }
  const fontFamily = obj.fontFamily as VettedFontChoice;
  if (!ALLOWED_FONTS.includes(fontFamily)) {
    errors.push(`fontFamily must be one of: ${ALLOWED_FONTS.join(', ')}.`);
  }

  const accentRaw = obj.accent;
  let light = '';
  let dark = '';
  if (!accentRaw || typeof accentRaw !== 'object' || Array.isArray(accentRaw)) {
    errors.push('accent must be an object with light and dark #RRGGBB hex seeds.');
  } else {
    const acc = accentRaw as Record<string, unknown>;
    for (const k of Object.keys(acc)) {
      if (k !== 'light' && k !== 'dark') {
        errors.push(`Unknown accent property "${k}" is not allowed.`);
      }
    }
    light = typeof acc.light === 'string' ? acc.light.trim().toUpperCase() : '';
    dark = typeof acc.dark === 'string' ? acc.dark.trim().toUpperCase() : '';
    if (!HEX_RE.test(light)) errors.push('accent.light must be a #RRGGBB hex colour.');
    if (!HEX_RE.test(dark)) errors.push('accent.dark must be a #RRGGBB hex colour.');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const seedCheck = validateAccentSeed({ light, dark }, THEME_CANVAS);
  if (!seedCheck.ok) {
    return { ok: false, errors: seedCheck.errors };
  }

  const contrast: ThemePackContrastSummary = {
    lightOnCanvas: Number(contrastRatio(light, THEME_CANVAS.light).toFixed(2)),
    darkOnCanvas: Number(contrastRatio(dark, THEME_CANVAS.dark).toFixed(2)),
    lightOnAccent: Number(contrastRatio('#FFFFFF', light).toFixed(2)),
    darkOnAccent: Number(contrastRatio(THEME_CANVAS.dark, dark).toFixed(2)),
  };

  return {
    ok: true,
    pack: {
      version: 2,
      id,
      name,
      packId,
      accent: { light, dark },
      density,
      radiusScale,
      fontFamily,
    },
    contrast,
  };
}

/**
 * Returns true when a theme pack matches the shipped default admin pack
 * (zero runtime cost: serve the pre-baked DEFAULT_ACCENT_CSS_FILENAME instead).
 */
export function isDefaultThemePackV2(pack?: Partial<ThemePackV2> | null): boolean {
  if (!pack) return true;
  const def = DEFAULT_ADMIN_THEME_PACK;
  return (
    (pack.accent?.light || def.accent.light).toUpperCase() === def.accent.light &&
    (pack.accent?.dark || def.accent.dark).toUpperCase() === def.accent.dark &&
    (pack.density || def.density) === def.density &&
    (pack.radiusScale || def.radiusScale) === def.radiusScale &&
    (pack.fontFamily || def.fontFamily) === def.fontFamily
  );
}

/**
 * Build the single cacheable `@layer user-theme` CSS file from a validated ThemePackV2.
 */
export function buildThemePackCss(pack: ThemePackV2): string {
  const checked = validateThemePackV2(pack);
  if (!checked.ok) {
    throw new Error(`Theme pack rejected: ${checked.errors.join('; ')}`);
  }
  const p = checked.pack;
  const ramp = generateAccentRamp(p.accent);
  const lines: string[] = [];

  for (const step of ACCENT_STEPS) {
    lines.push(`${ACCENT_VAR_PREFIX}${step}: ${ramp[step]};`);
  }
  if (p.density !== 'comfortable') {
    for (const [k, v] of Object.entries(DENSITY_PROXIMITY_TABLES[p.density])) {
      lines.push(`${k}: ${v};`);
    }
  }
  if (p.radiusScale !== 'default') {
    for (const [k, v] of Object.entries(RADIUS_SCALE_TABLES[p.radiusScale])) {
      lines.push(`${k}: ${v};`);
    }
  }
  if (p.fontFamily !== 'system') {
    lines.push(`--lp-font-family-sans: ${VETTED_FONT_STACKS[p.fontFamily]};`);
  }

  return `@layer user-theme {\n:root {\n  ${lines.join('\n  ')}\n}\n}\n`;
}

export function themePackCssFilename(css: string): string {
  return `theme.${createHash('sha256').update(css).digest('hex').slice(0, 10)}.css`;
}

/**
 * Derive a light/dark AccentSeed pair from a single #RRGGBB seed using OKLCH lightness & chroma bounds.
 */
export function deriveAccentPairFromSeed(seedHex: string): AccentSeed {
  const light = seedHex.trim().toUpperCase();
  if (!HEX_RE.test(light)) {
    return { ...DEFAULT_ADMIN_THEME_PACK.accent };
  }
  const o = hexToOklch(light);
  const dark = oklchToHex({
    l: Math.max(0.78, Math.min(0.85, o.l + 0.3)),
    c: Math.min(o.c, 0.13),
    h: o.h,
  });
  return { light, dark };
}

/**
 * Build a scoped preview stylesheet targeting `.lp-appearance-preview` so Appearance v2 renders
 * a live composed preview without inline style= attributes.
 */
export function buildThemePreviewCss(pack: ThemePackV2): string {
  const ramp = generateAccentRamp(pack.accent);
  const density = DENSITY_PROXIMITY_TABLES[pack.density] || DENSITY_PROXIMITY_TABLES.comfortable;
  const radius = RADIUS_SCALE_TABLES[pack.radiusScale] || RADIUS_SCALE_TABLES.default;
  const font = VETTED_FONT_STACKS[pack.fontFamily] || VETTED_FONT_STACKS.system;
  const lines = [
    ...ACCENT_STEPS.map((s) => `${ACCENT_VAR_PREFIX}${s}: ${ramp[s]};`),
    `--accent: ${pack.accent.light};`,
    ...Object.entries(density).map(([k, v]) => `${k}: ${v};`),
    ...Object.entries(radius).map(([k, v]) => `${k}: ${v};`),
    `--lp-font-family-sans: ${font};`,
    `font-family: ${font};`,
  ];
  return `@layer user-theme {\n#appearance-live-preview {\n  ${lines.join('\n  ')}\n}\n[data-theme="dark"] #appearance-live-preview {\n  --accent: ${pack.accent.dark};\n}\n}\n`;
}

/**
 * Resolve the stylesheet filename for an admin theme pack.
 * Returns DEFAULT_ACCENT_CSS_FILENAME when unchanged (zero cost).
 */
export function resolveAdminThemeCssAsset(pack?: ThemePackV2 | null): { filename: string; css: string | null } {
  if (!pack || isDefaultThemePackV2(pack)) {
    return { filename: DEFAULT_ACCENT_CSS_FILENAME, css: null };
  }
  const css = buildThemePackCss(pack);
  return { filename: themePackCssFilename(css), css };
}
