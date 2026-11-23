import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_THEME_CSS } from '@living-portfolio/design-tokens';
import { hashCss, PUBLIC_FONT_FACE_CSS } from '@living-portfolio/ui-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, '../src');

export function buildPublicBundleCss(extraPublicCss = ''): string {
  const shellCss = readFileSync(resolve(SRC_ROOT, 'components/shell/shell.css'), 'utf8');
  const parts = [
    '@layer reset, tokens, base, primitives, components, patterns, templates, pages, utilities, user-theme;',
    `@layer tokens {\n${PUBLIC_FONT_FACE_CSS}\n\n${PUBLIC_THEME_CSS.trim()}\n}`,
    shellCss.trim(),
  ];
  if (extraPublicCss.trim()) {
    parts.push(`@layer pages {\n${extraPublicCss.trim()}\n}`);
  }
  return parts.join('\n\n') + '\n';
}

export const PUBLIC_BUNDLE_CSS = buildPublicBundleCss();
export const PUBLIC_CSS_HASH = hashCss(PUBLIC_BUNDLE_CSS);
export const PUBLIC_CSS_FILENAME = `public.${PUBLIC_CSS_HASH}.css`;
