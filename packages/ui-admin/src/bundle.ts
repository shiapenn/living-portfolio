import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { THEME_CSS } from '@living-portfolio/design-tokens';
import { hashCss } from '@living-portfolio/ui-core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, '../src');

export function buildAdminBundleCss(extraAdminCss = ''): string {
  const buttonCss = readFileSync(resolve(SRC_ROOT, 'primitives/button/button.css'), 'utf8');
  const parts = [
    '@layer reset, tokens, base, primitives, components, patterns, templates, pages, utilities;',
    `@layer tokens {\n${THEME_CSS.trim()}\n}`,
    buttonCss.trim(),
  ];
  if (extraAdminCss.trim()) {
    parts.push(`@layer components {\n${extraAdminCss.trim()}\n}`);
  }
  return parts.join('\n\n') + '\n';
}

export const ADMIN_BASE_CSS = buildAdminBundleCss();
export const ADMIN_CSS_HASH = hashCss(ADMIN_BASE_CSS);
export const ADMIN_CSS_FILENAME = `admin.${ADMIN_CSS_HASH}.css`;
