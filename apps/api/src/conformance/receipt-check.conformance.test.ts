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
    const mockReceipt = join(tempDir, 'A010.md');
    writeFileSync(
      mockReceipt,
      `# Execution Report A010

| Field | Value |
| --- | --- |
| Report ID | A010 |
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
    const mockReceipt = join(tempDir, 'A010.md');
    writeFileSync(
      mockReceipt,
      `# Execution Report A010

| Field | Value |
| --- | --- |
| Report ID | A010 |
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
    const mockReceipt = join(tempDir, 'A010.md');
    writeFileSync(
      mockReceipt,
      `# Execution Report A010

| Field | Value |
| --- | --- |
| Report ID | A010 |
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

  it('fails when receipt >= A013 is missing Section 8 (receipt-gate self-validation)', () => {
    const mockReceipt = join(tempDir, 'A013-test-receipt.md');
    writeFileSync(
      mockReceipt,
      `# Execution Report A013

| Field | Value |
| --- | --- |
| Report ID | A013 |
| Date | 22 October 2026 |
| Author | Implementer |
| Task ID | PROC-1 |
| Evidence SHA | 34f984b |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/1 |
| Verified By | null |

---

## 1. Scope
## 2. CI Evidence
## 3. Tests Added and Count Change
## 4. Files Touched
## 5. Register and Backlog Changes
## 6. Not Done (Tagged)
## 7. Changes to Earlier Reports
## 9. Handover Decision
- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 1
- Clean-boundary preconditions: met
- Next action: continue
`,
      'utf8'
    );

    const res = runReceiptCheck([mockReceipt, '--skip-git', '--offline']);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('[SECTIONS-CHECK] Section 8 (Receipt Gate Self-Validation) is missing');
  });

  it('fails when receipt >= A013 is missing Section 9 (handover decision)', () => {
    const mockReceipt = join(tempDir, 'A013-test-receipt.md');
    writeFileSync(
      mockReceipt,
      `# Execution Report A013

| Field | Value |
| --- | --- |
| Report ID | A013 |
| Date | 22 October 2026 |
| Author | Implementer |
| Task ID | PROC-1 |
| Evidence SHA | 34f984b |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/1 |
| Verified By | null |

---

## 1. Scope
## 2. CI Evidence
## 3. Tests Added and Count Change
## 4. Files Touched
## 5. Register and Backlog Changes
## 6. Not Done (Tagged)
## 7. Changes to Earlier Reports
## 8. Receipt Gate Self-Validation
\`\`\`
All receipt checks PASSED for A013.
\`\`\`
`,
      'utf8'
    );

    const res = runReceiptCheck([mockReceipt, '--skip-git', '--offline']);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('[SECTIONS-CHECK] Section 9 (Handover Decision) is missing');
  });

  it('fails when receipt >= A013 has malformed Section 8 or 9', () => {
    const mockReceipt = join(tempDir, 'A013-test-receipt.md');
    writeFileSync(
      mockReceipt,
      `# Execution Report A013

| Field | Value |
| --- | --- |
| Report ID | A013 |
| Date | 22 October 2026 |
| Author | Implementer |
| Task ID | PROC-1 |
| Evidence SHA | 34f984b |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/1 |
| Verified By | null |

---

## 1. Scope
## 2. CI Evidence
## 3. Tests Added and Count Change
## 4. Files Touched
## 5. Register and Backlog Changes
## 6. Not Done (Tagged)
## 7. Changes to Earlier Reports
## 8. Receipt Gate Self-Validation
Incomplete output without passed line
## 9. Handover Decision
- Decision: INVALID_STATUS
`,
      'utf8'
    );

    const res = runReceiptCheck([mockReceipt, '--skip-git', '--offline']);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('[SECTION-8-CHECK]');
  });

  it('passes when receipt >= A013 has all 9 sections properly formed', () => {
    const mockReceipt = join(tempDir, 'A013-test-receipt.md');
    writeFileSync(
      mockReceipt,
      `# Execution Report A013

| Field | Value |
| --- | --- |
| Report ID | A013 |
| Date | 22 October 2026 |
| Author | Implementer |
| Task ID | PROC-1 |
| Evidence SHA | 34f984b |
| CI run | https://github.com/shiapenn/living-portfolio/actions/runs/1 |
| Verified By | null |

---

## 1. Scope
## 2. CI Evidence
## 3. Tests Added and Count Change
## 4. Files Touched
## 5. Register and Backlog Changes
## 6. Not Done (Tagged)
## 7. Changes to Earlier Reports
## 8. Receipt Gate Self-Validation
\`\`\`
All receipt checks PASSED for A013.
\`\`\`
## 9. Handover Decision
- Decision: NOT REQUIRED
- Rule(s): HO-R5
- Receipts since last handover: 1
- Clean-boundary preconditions: met
- Next action: continue
`,
      'utf8'
    );

    const res = runReceiptCheck([mockReceipt, '--skip-git', '--offline']);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('Mandatory sections 1 through 9 verified');
    expect(res.stdout).toContain('All receipt checks PASSED');
  });
});
