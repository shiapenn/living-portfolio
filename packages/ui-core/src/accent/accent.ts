/**
 * Accent seed contract (D-N2).
 * One seed per theme produces a ten-step OKLCH ramp; a contrast gate rejects seeds that fail AA.
 * Pure functions, no I/O, so the generator is trivially testable and costs nothing at runtime.
 */
import { createHash } from 'node:crypto';

export type AccentStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export const ACCENT_STEPS: readonly AccentStep[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

export interface AccentSeed {
  /** Seed used as the accent in the light theme (ramp step 600). Hex, e.g. #3A4FD0. */
  light: string;
  /** Seed used as the accent in the dark theme (ramp step 300). */
  dark: string;
}

export interface AccentCanvas {
  light: string;
  dark: string;
}

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

export type AccentRamp = Record<AccentStep, string>;

export interface AccentValidation {
  ok: boolean;
  errors: string[];
}

const HEX = /^#[0-9a-fA-F]{6}$/;

function srgbToLinear(v: number): number {
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
function linearToSrgb(v: number): number {
  return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
}

export function hexToRgb(hex: string): [number, number, number] {
  if (!HEX.test(hex)) throw new Error(`Invalid hex colour: ${hex}`);
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}

export function rgbToHex(rgb: [number, number, number]): string {
  return (
    '#' +
    rgb
      .map((v) =>
        Math.round(Math.min(1, Math.max(0, v)) * 255)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
      .toUpperCase()
  );
}

function hexToLinear(hex: string): [number, number, number] {
  return hexToRgb(hex).map(srgbToLinear) as [number, number, number];
}

export function hexToOklch(hex: string): Oklch {
  const [r, g, b] = hexToLinear(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const c = Math.hypot(A, B);
  const h = (Math.atan2(B, A) * 180) / Math.PI;
  return { l: L, c, h: (h + 360) % 360 };
}

function oklchToLinear({ l, c, h }: Oklch): [number, number, number] {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

const inGamut = (rgb: number[]) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);

/** Convert OKLCH to hex, reducing chroma until the colour fits sRGB. */
export function oklchToHex(color: Oklch): string {
  let c = color.c;
  let lin = oklchToLinear({ ...color, c });
  for (let i = 0; i < 40 && !inGamut(lin); i++) {
    c *= 0.95;
    lin = oklchToLinear({ ...color, c });
  }
  return rgbToHex(lin.map(linearToSrgb) as [number, number, number]);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToLinear(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function hexToLab(hex: string): [number, number, number] {
  const [r, g, b] = hexToLinear(hex);
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** CIEDE2000 colour difference between two hex colours. */
export function deltaE2000(hexA: string, hexB: string): number {
  const [L1, a1, b1] = hexToLab(hexA);
  const [L2, a2, b2] = hexToLab(hexB);
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cbar ** 7 / (Cbar ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const hp = (b: number, a: number) => ((Math.atan2(b, a) / rad) + 360) % 360;
  const h1p = C1p === 0 ? 0 : hp(b1, a1p);
  const h2p = C2p === 0 ? 0 : hp(b2, a2p);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2);
  const Lbp = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) {
    hbp = Math.abs(h1p - h2p) <= 180 ? (h1p + h2p) / 2 : h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
  }
  const T =
    1 -
    0.17 * Math.cos((hbp - 30) * rad) +
    0.24 * Math.cos(2 * hbp * rad) +
    0.32 * Math.cos((3 * hbp + 6) * rad) -
    0.2 * Math.cos((4 * hbp - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt(
    (dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh)
  );
}

/** Lightness curve anchors: 50 (near white), 300 (dark-theme seed), 600 (light-theme seed), 900 (near black). */
function lightnessFor(step: AccentStep, lLight: number, lDark: number): number {
  const anchors: Array<[number, number]> = [
    [50, 0.97],
    [300, lDark],
    [600, lLight],
    [900, 0.27],
  ];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [s0, v0] = anchors[i]!;
    const [s1, v1] = anchors[i + 1]!;
    if (step >= s0 && step <= s1) return v0 + ((v1 - v0) * (step - s0)) / (s1 - s0);
  }
  return lLight;
}

/** Chroma curve: peaks around the seeds, tapers toward the near-white and near-black ends. */
function chromaFor(step: AccentStep, cLight: number, cDark: number): number {
  const taper: Record<AccentStep, number> = { 50: 0.12, 100: 0.25, 200: 0.6, 300: 1, 400: 1, 500: 1, 600: 1, 700: 0.95, 800: 0.9, 900: 0.6 };
  const base = step <= 300 ? cDark : cLight;
  return base * taper[step];
}

/** Generate the ten-step accent ramp from the two theme seeds. */
export function generateAccentRamp(seed: AccentSeed): AccentRamp {
  const light = hexToOklch(seed.light);
  const dark = hexToOklch(seed.dark);
  const hueFor = (step: AccentStep) => {
    if (step <= 300) return dark.h;
    if (step >= 600) return light.h;
    return dark.h + ((light.h - dark.h) * (step - 300)) / 300;
  };
  const out = {} as AccentRamp;
  for (const step of ACCENT_STEPS) {
    out[step] = oklchToHex({
      l: lightnessFor(step, light.l, dark.l),
      c: chromaFor(step, light.c, dark.c),
      h: hueFor(step),
    });
  }
  // The seeds themselves are authoritative at their anchor steps.
  out[600] = seed.light.toUpperCase();
  out[300] = seed.dark.toUpperCase();
  return out;
}

/** Contrast gate: text 4.5:1 and UI 3:1 in both themes, including the on-accent label colour. */
export function validateAccentSeed(
  seed: AccentSeed,
  canvas: AccentCanvas,
  onAccent: AccentCanvas = { light: '#FFFFFF', dark: canvas.dark }
): AccentValidation {
  const errors: string[] = [];
  for (const theme of ['light', 'dark'] as const) {
    const s = seed[theme];
    if (!HEX.test(s)) {
      errors.push(`${theme}: seed ${s} is not a #RRGGBB hex colour`);
      continue;
    }
    const text = contrastRatio(s, canvas[theme]);
    if (text < 4.5) errors.push(`${theme}: accent text on canvas ${text.toFixed(2)}:1 is below 4.5:1`);
    const ui = contrastRatio(s, canvas[theme]);
    if (ui < 3) errors.push(`${theme}: accent UI/focus ring on canvas ${ui.toFixed(2)}:1 is below 3:1`);
    const label = contrastRatio(onAccent[theme], s);
    if (label < 4.5) errors.push(`${theme}: on-accent label ${label.toFixed(2)}:1 is below 4.5:1`);
  }
  return { ok: errors.length === 0, errors };
}

export interface BuildAccentCssInput {
  seed: AccentSeed;
  canvas: AccentCanvas;
  onAccent?: AccentCanvas;
  /** Steps whose exact value must be kept (today's admin values where the curve differs by delta-E 2000 > 2). */
  overrides?: Partial<Record<AccentStep, string>>;
}

export const ACCENT_VAR_PREFIX = '--lp-core-accent-';

/**
 * Build the user-theme layer file. It only declares `--lp-core-accent-<step>`; both packs map their accent
 * semantics to these properties, so the file is the single override point (no component CSS inside).
 */
export function buildAccentCss(input: BuildAccentCssInput): string {
  const v = validateAccentSeed(input.seed, input.canvas, input.onAccent);
  if (!v.ok) throw new Error(`Accent seed rejected: ${v.errors.join('; ')}`);
  const ramp = { ...generateAccentRamp(input.seed), ...input.overrides };
  const decls = ACCENT_STEPS.map((s) => `${ACCENT_VAR_PREFIX}${s}: ${ramp[s]};`).join('\n  ');
  return `@layer user-theme {\n:root {\n  ${decls}\n}\n}\n`;
}

export function accentCssFilename(css: string): string {
  return `accent.${createHash('sha256').update(css).digest('hex').slice(0, 10)}.css`;
}
