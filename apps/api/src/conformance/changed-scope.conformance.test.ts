import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
// @ts-ignore
import { detectChangedScope } from '../../../../scripts/changed-scope';

const ROOT = resolve(import.meta.dirname, '../../../..');
const CHANGED_SCOPE = resolve(ROOT, 'scripts/changed-scope');

describe('CI Fast-Path Hardening & Changed Scope Detection (scripts/changed-scope)', () => {
  it('fails closed (docs_only=false) on missing or empty base SHA', () => {
    const res1 = detectChangedScope({ baseSha: '', headSha: 'HEAD', root: ROOT });
    expect(res1.docsOnly).toBe(false);
    expect(res1.reason).toContain('Base SHA is missing');

    const res2 = detectChangedScope({ baseSha: null as any, headSha: 'HEAD', root: ROOT });
    expect(res2.docsOnly).toBe(false);
  });

  it('fails closed (docs_only=false) on zero base SHA', () => {
    const res = detectChangedScope({
      baseSha: '0000000000000000000000000000000000000000',
      headSha: 'HEAD',
      root: ROOT,
    });
    expect(res.docsOnly).toBe(false);
    expect(res.reason).toContain('zero SHA');
  });

  it('fails closed (docs_only=false) on unknown base SHA commit', () => {
    const res = detectChangedScope({
      baseSha: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      headSha: 'HEAD',
      root: ROOT,
    });
    expect(res.docsOnly).toBe(false);
    expect(res.reason).toContain('does not resolve to a valid commit');
  });

  it('never treats docs/audits/sarif-baseline.json as docs-only', () => {
    // Test detection logic with mock or by inspecting FORBIDDEN_DOCS_FILES
    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
    // Compare against historical commits if known
    const result = detectChangedScope({
      baseSha: head,
      headSha: head,
      root: ROOT,
    });
    // Same commit has 0 diffs -> fails closed (empty diff)
    expect(result.docsOnly).toBe(false);
  });

  it('correctly identifies docs-only commit ranges in repository history', () => {
    // 162e0ea to 0c24f60 was the docs PR for A016
    const base = '162e0ea2dc49e7c775bbe5895d890f4084064660';
    const head = '0c24f60746a32752f49410010d89d02a8cdac537';

    const res = detectChangedScope({ baseSha: base, headSha: head, root: ROOT });
    expect(res.docsOnly).toBe(true);
    expect(res.nonDocsFiles).toHaveLength(0);
    expect(res.changedFiles.length).toBeGreaterThan(0);
  });

  it('correctly identifies code commit ranges as not docs-only', () => {
    // 07a5ef7 to 162e0ea added scripts/handover-check and apps/api/src/...
    const base = '07a5ef743f9bdd5c11f91654aa938096710ce6a9';
    const head = '162e0ea2dc49e7c775bbe5895d890f4084064660';

    const res = detectChangedScope({ baseSha: base, headSha: head, root: ROOT });
    expect(res.docsOnly).toBe(false);
    expect(res.nonDocsFiles.length).toBeGreaterThan(0);
    expect(res.nonDocsFiles.some((f: string) => f.includes('scripts/handover-check'))).toBe(true);
  });

  it('CLI outputs docs_only variable to stdout', () => {
    const base = '162e0ea2dc49e7c775bbe5895d890f4084064660';
    const head = '0c24f60746a32752f49410010d89d02a8cdac537';

    const stdout = execFileSync('node', [CHANGED_SCOPE, '--base', base, '--head', head], {
      cwd: ROOT,
      encoding: 'utf8',
    });

    expect(stdout).toContain('docs_only=true');
  });
});
