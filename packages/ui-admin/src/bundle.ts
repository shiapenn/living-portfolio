import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEME_CSS } from '@living-portfolio/design-tokens';
import { hashCss } from '@living-portfolio/ui-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, '../src');

const LAYER_ORDER =
  '@layer reset, tokens, base, primitives, components, patterns, templates, pages, utilities, user-theme;';

function readCss(rel: string): string {
  return readFileSync(resolve(SRC_ROOT, rel), 'utf8').trim();
}

/**
 * Shared admin CSS compiled in exact cascade order across layers.
 * Route-exclusive bundles (editor, gallery) are split out below and loaded only on those routes.
 */
const BASE_CSS_PARTS: Array<[string, string]> = [
  ['components', 'base/reset-and-typography.css'],
  ['components', 'shell/admin-shell-legacy.css'],
  ['components', 'primitives/controls/controls.css'],
  ['components', 'primitives/field/field.css'],
  ['components', 'components/feedback/feedback.css'],
  ['components', 'shell/admin-header.css'],
  ['components', 'routes/gallery-foundations.css'],
  ['components', 'routes/editor-reference.css'],
  ['components', 'shell/workspace-shell.css'],
  ['components', 'routes/editor-c3.css'],
  ['components', 'shell/layout-templates.css'],
  ['components', 'routes/editor-fullscreen.css'],
  ['components', 'routes/gallery-canary.css'],
  ['components', 'components/page-header/page-header.css'],
  ['components', 'components/item/item.css'],
  ['components', 'components/action-bar/action-bar.css'],
  ['components', 'components/choice/choice.css'],
  ['components', 'components/tabs-stepper/tabs-stepper.css'],
  ['components', 'components/overlay/overlay.css'],
  ['components', 'components/form-section/form-section.css'],
  ['components', 'shell/overlay-mobile.css'],
  ['components', 'routes/editor-c3-fixes.css'],
  ['components', 'patterns/dsys-foundations.css'],
  ['components', 'templates/dfinal-system.css'],
  ['components', 'templates/dghl-polish.css'],
  ['components', 'routes/gallery-samples.css'],
];

const EDITOR_CSS_PARTS: Array<[string, string]> = [
  ['components', 'routes/editor-dfinal.css'],
];

const GALLERY_CSS_PARTS: Array<[string, string]> = [
  ['pages', 'routes/gallery-canary-overrides.css'],
];

function wrapLayers(entries: Array<[string, string]>): string {
  return entries.map(([layer, file]) => `@layer ${layer} {\n${readCss(file)}\n}`).join('\n\n');
}

export function buildAdminBundleCss(extraAdminCss = ''): string {
  const buttonCss = readCss('primitives/button/button.css');
  const parts = [
    LAYER_ORDER,
    `@layer tokens {\n${THEME_CSS.trim()}\n}`,
    buttonCss,
    wrapLayers(BASE_CSS_PARTS),
  ];
  if (extraAdminCss.trim()) {
    parts.push(`@layer pages {\n${extraAdminCss.trim()}\n}`);
  }
  return parts.join('\n\n') + '\n';
}

export function buildAdminEditorCss(): string {
  return `${LAYER_ORDER}\n\n${wrapLayers(EDITOR_CSS_PARTS)}\n`;
}

export function buildAdminGalleryCss(): string {
  return `${LAYER_ORDER}\n\n${wrapLayers(GALLERY_CSS_PARTS)}\n`;
}

export const ADMIN_BASE_CSS = buildAdminBundleCss();
export const ADMIN_CSS_HASH = hashCss(ADMIN_BASE_CSS);
export const ADMIN_CSS_FILENAME = `admin.${ADMIN_CSS_HASH}.css`;

export const ADMIN_EDITOR_CSS = buildAdminEditorCss();
export const ADMIN_EDITOR_CSS_HASH = hashCss(ADMIN_EDITOR_CSS);
export const ADMIN_EDITOR_CSS_FILENAME = `admin-editor.${ADMIN_EDITOR_CSS_HASH}.css`;

export const ADMIN_GALLERY_CSS = buildAdminGalleryCss();
export const ADMIN_GALLERY_CSS_HASH = hashCss(ADMIN_GALLERY_CSS);
export const ADMIN_GALLERY_CSS_FILENAME = `admin-gallery.${ADMIN_GALLERY_CSS_HASH}.css`;

/** Full combined admin CSS (base + editor + gallery) compiled from modular CSS files. */
export const ADMIN_FULL_CSS = [ADMIN_BASE_CSS, ADMIN_EDITOR_CSS, ADMIN_GALLERY_CSS].join('\n');
