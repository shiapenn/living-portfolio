export {
  buildCoreBundleCss,
  hashCss,
  renderThemeBootstrapScript,
  type ThemeMode,
  type DesignLanguage,
} from './theme/theme.js';
export { renderSkipLink, renderVisuallyHidden } from './primitives/accessibility/accessibility.js';
export { renderCoreStack, renderCoreCluster } from './primitives/layout/layout.js';
export { ACCESSIBILITY_GALLERY_ENTRY } from './primitives/accessibility/accessibility.gallery.js';
export { LAYOUT_GALLERY_ENTRY } from './primitives/layout/layout.gallery.js';

import { buildCoreBundleCss, hashCss } from './theme/theme.js';

export const CORE_BUNDLE_CSS = buildCoreBundleCss();
export const CORE_CSS_HASH = hashCss(CORE_BUNDLE_CSS);
export const CORE_CSS_FILENAME = `core.${CORE_CSS_HASH}.css`;

export {
  ACCENT_STEPS,
  ACCENT_VAR_PREFIX,
  accentCssFilename,
  buildAccentCss,
  generateAccentRamp,
  validateAccentSeed,
  deltaE2000,
  contrastRatio,
  type AccentSeed,
  type AccentRamp,
  type AccentStep,
  type AccentValidation,
  type BuildAccentCssInput,
} from './accent/accent.js';
export {
  DEFAULT_ACCENT_CSS,
  DEFAULT_ACCENT_CSS_HASH,
  DEFAULT_ACCENT_CSS_FILENAME,
} from './accent/default-accent.js';
export {
  ATKINSON_FONT,
  LITERATA_FONT,
  FONT_ASSETS,
  TOTAL_FONT_BYTES,
  PUBLIC_FONT_FACE_CSS,
  PUBLIC_FONT_PRELOAD_HTML,
} from './fonts/fonts.js';
export {
  ALLOWED_DENSITIES,
  ALLOWED_FONTS,
  ALLOWED_PACK_IDS,
  ALLOWED_RADIUS_SCALES,
  BUILTIN_THEME_PACKS_V2,
  DEFAULT_ADMIN_THEME_PACK,
  DEFAULT_PUBLIC_THEME_PACK,
  DENSITY_PROXIMITY_TABLES,
  RADIUS_SCALE_TABLES,
  THEME_CANVAS,
  VETTED_FONT_STACKS,
  buildThemePackCss,
  buildThemePreviewCss,
  deriveAccentPairFromSeed,
  isDefaultThemePackV2,
  resolveAdminThemeCssAsset,
  themePackCssFilename,
  validateThemePackV2,
  type DensityChoice,
  type RadiusScaleChoice,
  type ThemePackContrastSummary,
  type ThemePackId,
  type ThemePackV2,
  type ThemePackValidationResult,
  type ThemeScope,
  type VettedFontChoice,
} from './theme/theme-pack.js';
export {
  formatAdminDate,
  formatAdminDateTime,
  ADMIN_DATETIME_FORMATTER_SCRIPT,
} from './format/datetime.js';
