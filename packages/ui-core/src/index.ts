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
