import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
// @ts-expect-error ESM script without .d.ts
import { evaluateUiGuards } from '../../../../scripts/verify-ui-guards';

const REPO_ROOT = resolve(import.meta.dirname, '../../../../');
const tempDirs: string[] = [];

function createTempRepo(files: Record<string, string>, allowlist = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'wp15-6-guards-'));
  tempDirs.push(dir);
  for (const [rel, content] of Object.entries(files)) {
    const full = join(dir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }
  return {
    rootDir: dir,
    allowlist: {
      version: 1,
      sizeBudgets: {},
      inlineStyle: {},
      hexColor: {},
      liveRegion: {},
      ...allowlist,
    },
  };
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('WP-15.6 UI Contract & Size-Budget Guard Rails (D-CONTRACT-2..7, D-FEEDBACK, D-UI-5, D-UI-6)', () => {
  it('passes on the real repository with 0 exemptions on Reference Editor Page and 0 files over size budget', () => {
    const allowlist = JSON.parse(
      readFileSync(join(REPO_ROOT, 'docs/audits/ui-guard-allowlist.json'), 'utf8')
    );
    expect(allowlist.sizeBudgets).toEqual({});
    expect(allowlist.inlineStyle['apps/web/src/pages/admin/entries/editor.ts']).toBeUndefined();
    expect(allowlist.inlineStyle['apps/web/src/pages/admin/entries/editor-sections.ts']).toBeUndefined();
    expect(allowlist.inlineStyle['apps/web/src/client/admin/editor-page.ts']).toBeUndefined();

    const result = evaluateUiGuards({ rootDir: REPO_ROOT, allowlist });
    expect(result.passed).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects inline style= attributes outside the shrinking allowlist', () => {
    const ctx = createTempRepo({
      'apps/web/src/pages/admin/entries/editor.ts': 'export const html = `<div style="color:red">hi</div>`;',
    });
    const res = evaluateUiGuards(ctx);
    expect(res.passed).toBe(false);
    expect(res.errors[0]).toContain('[INLINE-STYLE]');
  });

  it('rejects hardcoded hex colours outside tokens', () => {
    const ctx = createTempRepo({
      'apps/web/src/pages/admin/entries/editor.ts': "export const c = '#ff0000';",
    });
    const res = evaluateUiGuards(ctx);
    expect(res.passed).toBe(false);
    expect(res.errors[0]).toContain('[HEX-COLOR]');
  });

  it('rejects vendor or sample names in markup', () => {
    const ctx = createTempRepo({
      'apps/web/src/pages/public/sample.ts': 'export const s = "<p>Acme Corp</p>";',
    });
    const res = evaluateUiGuards(ctx);
    expect(res.passed).toBe(false);
    expect(res.errors[0]).toContain('[VENDOR-NAME]');
  });

  it('rejects cross-page imports between admin page modules', () => {
    const ctx = createTempRepo({
      'apps/web/src/pages/admin/setup.ts': "import { x } from './settings.js'; export const y = x;",
      'apps/web/src/pages/admin/settings.ts': 'export const x = 1;',
    });
    const res = evaluateUiGuards(ctx);
    expect(res.passed).toBe(false);
    expect(res.errors[0]).toContain('[CROSS-PAGE-IMPORT]');
  });

  it('rejects role="status" and role="alert" outside the four D-FEEDBACK places', () => {
    const ctx = createTempRepo({
      'apps/web/src/pages/admin/entries/editor.ts': 'export const html = `<div role="status">Saved</div>`;',
    });
    const res = evaluateUiGuards(ctx);
    expect(res.passed).toBe(false);
    expect(res.errors[0]).toContain('[LIVE-REGION]');
  });

  it('rejects files exceeding their size budget or growing past an allowlisted line count', () => {
    const overPage = Array.from({ length: 405 }, (_, i) => `export const a${i} = ${i};`).join('\n');
    const ctx = createTempRepo({
      'apps/web/src/pages/admin/new-page.ts': overPage,
    });
    const res = evaluateUiGuards(ctx);
    expect(res.passed).toBe(false);
    expect(res.errors[0]).toContain('[SIZE-BUDGET]');

    const overAllow = createTempRepo(
      { 'apps/web/src/components/legacy.ts': overPage },
      { sizeBudgets: { 'apps/web/src/components/legacy.ts': { maxLines: 272, deadline: 'WP-15.6' } } }
    );
    const res2 = evaluateUiGuards(overAllow);
    expect(res2.passed).toBe(false);
    expect(res2.errors[0]).toContain('[SIZE-BUDGET]');
  });
});
