import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CORE_THEME_CSS } from '@living-portfolio/design-tokens';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, '../../src');

export type ThemeMode = 'light' | 'dark';
export type DesignLanguage = 'admin' | 'public';

export function hashCss(css: string): string {
  return createHash('sha256').update(css).digest('hex').slice(0, 10);
}

export function readLayerCss(relPath: string): string {
  return readFileSync(resolve(SRC_ROOT, relPath), 'utf8');
}

export function buildCoreBundleCss(): string {
  const layers = readLayerCss('layers.css');
  const a11y = readLayerCss('primitives/accessibility/accessibility.css');
  const layout = readLayerCss('primitives/layout/layout.css');
  return [
    layers.trim(),
    `@layer tokens {\n${CORE_THEME_CSS.trim()}\n}`,
    a11y.trim(),
    layout.trim(),
  ].join('\n\n') + '\n';
}

export function renderThemeBootstrapScript(storageKey = 'strata-theme'): string {
  return `(function(){try{var s=localStorage.getItem(${JSON.stringify(storageKey)});var t=(s==='dark'||s==='light')?s:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(_){}})();`;
}
