import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../..');

describe('WP-15.1: Mechanical Monolith Split of apps/web/src/renderer.ts', () => {
  it('keeps apps/web/src/renderer.ts under 300 lines as a compatibility barrel and extracts per-page modules', () => {
    const rendererPath = resolve(repoRoot, 'apps/web/src/renderer.ts');
    const rendererContent = readFileSync(rendererPath, 'utf8');
    const lineCount = rendererContent.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(300);

    const expectedModules = [
      'apps/web/src/lib/data-source.ts',
      'apps/web/src/lib/html.ts',
      'apps/web/src/layouts/public-shell.ts',
      'apps/web/src/components/strata-timeline.ts',
      'apps/web/src/pages/public/home.ts',
      'apps/web/src/pages/public/entry.ts',
      'apps/web/src/pages/public/entries-index.ts',
      'apps/web/src/pages/public/not-found.ts',
      'apps/web/src/pages/public/build.ts',
      'apps/web/src/pages/public/timeline.ts',
      'apps/web/src/pages/public/ask.ts',
      'apps/web/src/pages/public/static.ts',
      'apps/web/src/pages/public/book.ts',
      'apps/web/src/pages/public/ask-status.ts',
      'apps/web/src/pages/admin/entries/editor.ts',
      'apps/web/src/pages/admin/settings.ts',
      'apps/web/src/pages/admin/login.ts',
      'apps/web/src/pages/admin/setup.ts',
      'apps/web/src/pages/admin/import.ts',
    ];

    for (const rel of expectedModules) {
      expect(existsSync(resolve(repoRoot, rel)), `Missing extracted module ${rel}`).toBe(true);
    }
  });

  it('preserves the WP-15.0 DOM-id, data-testid, and data-* baseline with zero regressions', async () => {
    const { verifyDomIdBaseline } = await import(resolve(repoRoot, 'scripts/snapshot-dom-ids'));
    const result = await verifyDomIdBaseline();
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
