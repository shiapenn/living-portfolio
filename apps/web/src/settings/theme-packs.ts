import { z } from '@living-portfolio/core';
import { DARK_PACK_TOKENS, LIGHT_PACK_TOKENS } from '../tokens/index.js';

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export const ThemePackTokensSchema = z.object({
  '--surface-page': z.string().regex(HEX_RE, 'Page background must be a 6-digit hex colour.'),
  '--surface': z.string().regex(HEX_RE, 'Surface colour must be a 6-digit hex colour.'),
  '--surface-input': z.string().regex(HEX_RE, 'Input background must be a 6-digit hex colour.'),
  '--text': z.string().regex(HEX_RE, 'Text colour must be a 6-digit hex colour.'),
  '--text-muted': z.string().regex(HEX_RE, 'Muted text colour must be a 6-digit hex colour.'),
  '--border-subtle': z.string().regex(HEX_RE, 'Subtle border must be a 6-digit hex colour.'),
  '--border-control': z.string().regex(HEX_RE, 'Control border must be a 6-digit hex colour.'),
  '--accent': z.string().regex(HEX_RE, 'Accent colour must be a 6-digit hex colour.'),
  '--text-on-accent': z.string().regex(HEX_RE, 'Text on accent must be a 6-digit hex colour.'),
});

export const ThemePackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mode: z.enum(['light', 'dark']),
  tokens: ThemePackTokensSchema,
});

export type ThemePack = z.infer<typeof ThemePackSchema>;

function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(parseHexRgb(hexA));
  const l2 = relativeLuminance(parseHexRgb(hexB));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate a theme pack's schema and WCAG contrast requirements per D-FOUND & D-SETTINGS-ARCH.
 * Returns a plain-language error message when a contrast check fails.
 */
export function validateThemePack(input: unknown): { ok: true; pack: ThemePack } | { ok: false; message: string } {
  const parsed = ThemePackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message || 'Theme pack is missing required tokens.' };
  }

  const t = parsed.data.tokens;
  const textRatio = contrastRatio(t['--text'], t['--surface-page']);
  if (textRatio < 4.5) {
    return {
      ok: false,
      message: `Main text contrast (${textRatio.toFixed(1)}:1) is below the required 4.5:1 against the page background.`,
    };
  }

  const mutedRatio = contrastRatio(t['--text-muted'], t['--surface-page']);
  if (mutedRatio < 4.5) {
    return {
      ok: false,
      message: `Secondary text contrast (${mutedRatio.toFixed(1)}:1) is below the required 4.5:1 against the page background.`,
    };
  }

  const accentTextRatio = contrastRatio(t['--text-on-accent'], t['--accent']);
  if (accentTextRatio < 4.5) {
    return {
      ok: false,
      message: `Button text contrast (${accentTextRatio.toFixed(1)}:1) is below the required 4.5:1 against the accent colour.`,
    };
  }

  const controlBorderRatio = contrastRatio(t['--border-control'], t['--surface']);
  if (controlBorderRatio < 3.0) {
    return {
      ok: false,
      message: `Control border contrast (${controlBorderRatio.toFixed(1)}:1) is below the required 3.0:1 against the surface.`,
    };
  }

  return { ok: true, pack: parsed.data };
}

export const BUILTIN_THEME_PACKS: Record<'light' | 'dark', ThemePack> = {
  light: {
    id: 'builtin-light',
    name: 'Light',
    mode: 'light',
    tokens: { ...LIGHT_PACK_TOKENS },
  },
  dark: {
    id: 'builtin-dark',
    name: 'Dark',
    mode: 'dark',
    tokens: { ...DARK_PACK_TOKENS },
  },
};
