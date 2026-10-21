import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../../..');
const RECEIPT_CHECK = resolve(ROOT, 'scripts/receipt-check');

describe('Receipt Check Conformance (Task WP-1.1b)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'receipt-check-test-'));
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function runReceiptCheck(args: string[]): { stdout: string; stderr: string; status: number } {
    try {
      const stdout = execFileSync('node', [RECEIPT_CHECK, ...args], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: 'pipe',
      });
      return { stdout, stderr: '', status: 0 };
    } catch (err: any) {
      return {
        stdout: err.stdout ? err.stdout.toString() : '',
        stderr: err.stderr ? err.stderr.toString() : '',
        status: err.status ?? 1,
      };
    }
  }

  it('fails check (a) when "Files touched" does not match git diff between SHAs', () => {
    const mockReceipt = join(tempDir, 'A009.md');
    // Invent a file not in git diff
    writeFileSync(
      mockReceipt,
      `# Execution Report A009

| Field | Value |
| --- | --- |
| Report ID | A009 |
| Date | 21 October 2026 |
| Author | Implementer |
| Task ID | WP-1.1 |
| Evidence SHA | 34f984b |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/1 |
| Verified By | null |

---

## 4. Files Touched
- \`invented/file/not-in-git.ts\`
`,
      'utf8'
    );

    const res = runReceiptCheck([mockReceipt, '--offline']);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('[FILES-TOUCHED]');
    expect(res.stderr).toContain('invented/file/not-in-git.ts');
  });

  it('fails check (b) when a line in verbatim block is absent from CI logs (no network fixture)', () => {
    const mockReceipt = join(tempDir, 'A999.md');
    writeFileSync(
      mockReceipt,
      `# Execution Report A999

| Field | Value |
| --- | --- |
| Report ID | A999 |
| Date | 21 October 2026 |
| Author | Implementer |
| Task ID | WP-1.1b |
| Evidence SHA | 34f984b |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/1 |
| Verified By | null |

---

## 2. CI Evidence
### 2.2 Verbatim Test Results (Job 12345)
\`\`\`
Test Files  99 passed (99)
     Tests  999 passed (999)
\`\`\`

## 4. Files Touched
`,
      'utf8'
    );

    const fixtureLog = join(tempDir, 'ci.log');
    writeFileSync(
      fixtureLog,
      `2026-10-21T08:56:00.000Z Test Files  1 passed (1)\n2026-10-21T08:56:01.000Z Tests  4 passed (4)\n`,
      'utf8'
    );

    const res = runReceiptCheck([mockReceipt, '--skip-git', '--fixture-log', fixtureLog]);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('[VERBATIM-CHECK]');
    expect(res.stderr).toContain('Test Files  99 passed (99)');
  });

  it('passes check (b) when all lines in verbatim block exist in fixture CI log (no network fixture)', () => {
    const mockReceipt = join(tempDir, 'A999.md');
    writeFileSync(
      mockReceipt,
      `# Execution Report A999

| Field | Value |
| --- | --- |
| Report ID | A999 |
| Date | 21 October 2026 |
| Author | Implementer |
| Task ID | WP-1.1b |
| Evidence SHA | 34f984b |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/1 |
| Verified By | null |

---

## 2. CI Evidence
### 2.2 Verbatim Test Results (Job 12345)
\`\`\`
Test Files  1 passed (1)
     Tests  4 passed (4)
\`\`\`

## 4. Files Touched
`,
      'utf8'
    );

    const fixtureLog = join(tempDir, 'ci.log');
    writeFileSync(
      fixtureLog,
      `2026-10-21T08:56:00.000Z \x1b[32mTest Files  1 passed (1)\x1b[0m\n2026-10-21T08:56:01.000Z Tests  4 passed (4)\n`,
      'utf8'
    );

    const res = runReceiptCheck([mockReceipt, '--skip-git', '--fixture-log', fixtureLog]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('All receipt checks PASSED');
  });

  it('passes and warns when --offline flag is set without network access', () => {
    const mockReceipt = join(tempDir, 'A999.md');
    writeFileSync(
      mockReceipt,
      `# Execution Report A999

| Field | Value |
| --- | --- |
| Report ID | A999 |
| Date | 21 October 2026 |
| Author | Implementer |
| Task ID | WP-1.1b |
| Evidence SHA | 34f984b |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/1 |
| Verified By | null |

---

## 2. CI Evidence
### 2.2 Verbatim Results (Job 9999)
\`\`\`
Any unverified text
\`\`\`

## 4. Files Touched
`,
      'utf8'
    );

    const res = runReceiptCheck([mockReceipt, '--skip-git', '--offline']);
    expect(res.status).toBe(0);
    expect(res.stdout + res.stderr).toContain('WARNING: --offline flag provided');
    expect(res.stdout).toContain('All receipt checks PASSED');
  });
});
