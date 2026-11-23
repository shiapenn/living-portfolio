import { CORE_ACCENT_CONTRACT } from '@living-portfolio/design-tokens';
import {
  accentCssFilename,
  buildAccentCss,
  type AccentStep,
} from './accent.js';
import { hashCss } from '../theme/theme.js';

function buildDefaultAccentCss(): string {
  const contract = CORE_ACCENT_CONTRACT;
  if (!contract) {
    return buildAccentCss({
      seed: { light: '#3A4FD0', dark: '#9AA8FF' },
      canvas: { light: '#FFFFFF', dark: '#0F1A22' },
    });
  }
  const overrides: Partial<Record<AccentStep, string>> = {};
  for (const [step, entry] of Object.entries(contract.overrides ?? {})) {
    const val = typeof entry === 'string' ? entry : (entry as { value: string }).value;
    overrides[Number(step) as AccentStep] = val;
  }
  return buildAccentCss({
    seed: contract.seed,
    canvas: contract.canvas,
    overrides,
  });
}

export const DEFAULT_ACCENT_CSS = buildDefaultAccentCss();
export const DEFAULT_ACCENT_CSS_HASH = hashCss(DEFAULT_ACCENT_CSS);
export const DEFAULT_ACCENT_CSS_FILENAME = accentCssFilename(DEFAULT_ACCENT_CSS);
