import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../../..');
const HANDOVER_CHECK = resolve(ROOT, 'scripts/handover-check');
const HANDOVER_VERIFY = resolve(ROOT, 'scripts/handover-verify');

describe('Handover Protocol Conformance (IAHP Section 11 Step 2, HO-1)', () => {
  let tempDir: string;
  let tempDocsDir: string;
  let tempHandoversDir: string;
  let headSha: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'handover-conformance-test-'));
    tempDocsDir = join(tempDir, 'docs');
    tempHandoversDir = join(tempDocsDir, 'handovers');
    mkdirSync(tempHandoversDir, { recursive: true });

    try {
      headSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
    } catch (_) {
      headSha = '35685db2cd9f2789c64da1171825c67123a6ebfd';
    }
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function runHandoverCheck(args: string[]): { stdout: string; stderr: string; status: number } {
    try {
      const stdout = execFileSync('node', [HANDOVER_CHECK, ...args], {
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

  function runHandoverVerify(args: string[]): { stdout: string; stderr: string; status: number } {
    try {
      const stdout = execFileSync('node', [HANDOVER_VERIFY, ...args], {
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

  function createValidHandoverContent(overrides: Record<string, string> = {}): string {
    const defaultContent = `# H001 — WP-1 Gate 1b Closure and WP-2 Kickoff

| Field | Value |
| --- | --- |
| Handover ID | \`H001\` |
| Date | 2026-10-22 |
| Author | A (Implementer) |
| Supersedes | none |
| Evidence SHA (on \`main\`) | \`${headSha}\` |
| CI runs for that SHA | 39736922928 / 39736922863 / 39736922866 |
| Receipts covered | A001 to A015 |
| Phase closed | WP-1 (Gate 1b+) |
| Phase next | WP-2 (Gate 1c / G2) |

**Start prompt (give this to the new session):**

> You are taking over the Living Portfolio implementation. Read \`docs/handovers/H001-wp1-gate-1b-closure-and-wp2-kickoff.md\`, then \`docs/plans/execution-protocol.md\`, and nothing else. Do not explore the repo. Run \`pnpm handover:verify H001\`. If any halt condition in section 8 applies, stop and report it to L. Otherwise execute Immediate Next Action 1 in section 4. Follow the execution protocol exactly: one task per PR, tests included, Rebase and merge, receipt as a file, no edits to earlier reports.

## 1. Mission and constitution
- **Objective:** The Living Portfolio is an open-source, self-hosted portfolio with zero hardcoded literals.
- **Non-negotiables:** Zero hardcoding, strict HTTP API decoupling, reproducible local verification gates.

## 2. Source-of-truth map
| Topic | Where | How to query |
| --- | --- | --- |
| Product spec | \`docs/spec/The_Living_Portfolio_Open_Source_Spec.md\` | Read by section number |
| Execution protocol | \`docs/plans/execution-protocol.md\` | Read in full |

## 3. Phase ledger
- **Completed:**
  - WP-0: Housekeeping and governance alignment (receipts A008, evidence \`a37f734\`).
  - WP-1: Gate 1b+ delivery (receipts A009 to A015, evidence \`${headSha.slice(0, 7)}\`).
- **Current phase:** WP-1 Gate Closure.
- **Next phases:**
  - WP-2: Gate 1c / G2 alpha (Postgres + pgvector, migrations, route trees).

## 4. Active workspace
- **Git:** \`main\` at \`${headSha.slice(0, 7)}\`; open PRs: none; working tree: clean.
- **Next task:** \`WP-2.1\`: Setup Postgres service container and migration harness.
- **Hot files (at most 7):**
  1. \`docs/plans/execution-protocol.md\`: Core workflow protocol.
  2. \`docs/audits/register.yml\`: Finding statuses.
- **Immediate next actions (ordered, at most 7):**
  1. Create branch \`feat/wp2.1-postgres-migrations\` and implement migration scaffolding.
  2. Add migration tests.
- **Pending decisions:** None.

## 5. Findings and backlog snapshot
- **Register counts:** 26 fixed, 0 partial, 71 open.
- **Open P0 findings:** None remaining in WP-1 scope.

## 6. Decisions and pitfalls
- **Decisions (at most 10):**
  - 2026-10-22: Rebase merge only to preserve DCO trailers. Where: \`docs/plans/execution-protocol.md\`.
- **Pitfalls and dead ends (at most 10):**
  - Do not use paths-ignore on required status check workflows. Because: GitHub branch protections require jobs to report status. See: \`docs/execution-reports/A015-wp1-provider-registry-extractive-degradation.md\`.

## 7. Verification harness
| Check | Command | Expected baseline (source) |
| --- | --- | --- |
| Full gate suite | \`pnpm verify\` | all gates pass |
| Receipt check | \`pnpm receipt:check A015\` | passes |

Fresh-clone procedure for gate sign-off: \`git clone ... && pnpm install && pnpm verify\`.

## 8. Entry halt conditions and exit checklist
**Halt and report to L (change nothing) if:**
1. \`origin/main\` differs from Evidence SHA by anything other than docs-only commits.
2. \`pnpm verify\` does not pass.
3. CI on \`main\` is red.
`;

    let result = defaultContent;
    for (const [key, value] of Object.entries(overrides)) {
      result = result.replace(key, value);
    }
    return result;
  }

  it('passes validation on a compliant handover document', () => {
    const file = join(tempHandoversDir, 'H001-wp1-gate-1b-closure-and-wp2-kickoff.md');
    writeFileSync(file, createValidHandoverContent(), 'utf8');

    const res = runHandoverCheck([file]);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('All handover checks PASSED');
    expect(res.stdout).toContain('[BUDGET]');
  });

  it('fails validation when line count exceeds 300 lines limit', () => {
    const longContent = createValidHandoverContent() + '\n<!-- extra -->\n'.repeat(305);
    const file = join(tempHandoversDir, 'H001-too-long.md');
    writeFileSync(file, longContent, 'utf8');

    const res = runHandoverCheck([file]);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('Line count exceeds budget');
  });

  it('fails validation when file size exceeds 32 KB limit', () => {
    const heavyComment = `<!-- ${'A'.repeat(33 * 1024)} -->\n`;
    const heavyContent = createValidHandoverContent() + '\n' + heavyComment;
    const file = join(tempHandoversDir, 'H001-too-heavy.md');
    writeFileSync(file, heavyContent, 'utf8');

    const res = runHandoverCheck([file]);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('File size exceeds budget');
  });

  it('fails validation when unresolved template placeholders or guidance comments exist', () => {
    const file = join(tempHandoversDir, 'H001-placeholders.md');
    const content = createValidHandoverContent({
      'none': '{{previous H ID or none}}',
    }) + '\n<!-- guidance: some comment -->\n';
    writeFileSync(file, content, 'utf8');

    const res = runHandoverCheck([file]);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('Unresolved template placeholder');
    expect(res.stderr).toContain('Found unresolved <!-- guidance --> comment');
  });

  it('fails validation when hot files or next actions exceed budget limits', () => {
    const excessHotFiles = `- **Hot files (at most 7):**\n  1. \`docs/plans/execution-protocol.md\`: 1\n  2. \`docs/plans/execution-protocol.md\`: 2\n  3. \`docs/plans/execution-protocol.md\`: 3\n  4. \`docs/plans/execution-protocol.md\`: 4\n  5. \`docs/plans/execution-protocol.md\`: 5\n  6. \`docs/plans/execution-protocol.md\`: 6\n  7. \`docs/plans/execution-protocol.md\`: 7\n  8. \`docs/plans/execution-protocol.md\`: 8\n`;
    const file = join(tempHandoversDir, 'H001-excess-items.md');
    const content = createValidHandoverContent().replace(
      /-\s+\*\*Hot files[^\n]*\n[\s\S]*?(?=-\s+\*\*Immediate next actions)/i,
      excessHotFiles
    );
    writeFileSync(file, content, 'utf8');

    const res = runHandoverCheck([file]);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('Hot files count exceeds budget');
  });

  it('fails validation when referenced repository path does not exist', () => {
    const nonExistentPath = '`docs/plans/non-existent-protocol-path-xyz.md`';
    const file = join(tempHandoversDir, 'H001-missing-path.md');
    const content = createValidHandoverContent({
      '`docs/plans/execution-protocol.md`': nonExistentPath,
    });
    writeFileSync(file, content, 'utf8');

    const res = runHandoverCheck([file]);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('Referenced repository path does not exist on disk');
  });

  it('fails validation when mandatory section is missing', () => {
    const file = join(tempHandoversDir, 'H001-missing-sec.md');
    const content = createValidHandoverContent().replace('## 8. Entry halt conditions and exit checklist', '## 8. Custom section');
    writeFileSync(file, content, 'utf8');

    const res = runHandoverCheck([file]);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('Section 8 mismatch');
  });

  it('fails validation when Evidence SHA is not in git history', () => {
    const file = join(tempHandoversDir, 'H001-bad-sha.md');
    const content = createValidHandoverContent({
      [headSha]: '0000000000000000000000000000000000000000',
    });
    writeFileSync(file, content, 'utf8');

    const res = runHandoverCheck([file]);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('is not a valid commit in git history');
  });

  it('verifyHandover passes when Evidence SHA matches and genealogy is clean', () => {
    const file = join(tempHandoversDir, 'H001-verify-pass.md');
    writeFileSync(file, createValidHandoverContent(), 'utf8');

    const res = runHandoverVerify([file, '--skip-verify']);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('handover:verify PASSED');
  });

  it('verifyHandover halts when pending decision blocks Immediate Next Action 1', () => {
    const file = join(tempHandoversDir, 'H001-halt-blocked.md');
    const content = createValidHandoverContent({
      '- **Pending decisions:** None.': '- **Pending decisions:** DEC-1: Architecture choice. Owner: L. Blocks action 1.',
    });
    writeFileSync(file, content, 'utf8');

    const res = runHandoverVerify([file, '--skip-verify']);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('Pending decision blocks Immediate Next Action 1');
    expect(res.stderr).toContain('HALT CONDITION TRIGGERED');
  });

  describe('H002+ Strict Hygiene and Consistency Conformance (Task A017 / HO-1b)', () => {
    function createValidH002(overrides: Record<string, string> = {}): string {
      const base = createValidHandoverContent({
        '# H001 — WP-1 Gate 1b Closure and WP-2 Kickoff': '# H002 — Autonomous Gate 1c Transition',
        '| Handover ID | `H001` |': '| Handover ID | `H002` |',
        'H001-wp1-gate-1b-closure-and-wp2-kickoff.md': 'H002-autonomous-gate-1c-transition.md',
        'pnpm handover:verify H001': 'pnpm handover:verify H002',
      });
      let result = base;
      for (const [k, v] of Object.entries(overrides)) {
        result = result.replace(k, v);
      }
      return result;
    }

    it('fails validation for H002+ when Verified By header row is present', () => {
      const file = join(tempHandoversDir, 'H002-with-verified-by.md');
      const content = createValidH002({
        '| Phase next | WP-2 (Gate 1c / G2) |': '| Phase next | WP-2 (Gate 1c / G2) |\n| Verified By | L |',
      });
      writeFileSync(file, content, 'utf8');

      const res = runHandoverCheck([file]);
      expect(res.status).toBe(1);
      expect(res.stderr).toContain('"Verified By" is forbidden in handover headers from H002 onward');
    });

    it('fails validation for H002+ when human sign-off claim is present', () => {
      const file = join(tempHandoversDir, 'H002-with-human-claim.md');
      const content = createValidH002({
        'WP-1 Gate Closure.': 'WP-1 Gate Closure (L sign-off: pending gate review).',
      });
      writeFileSync(file, content, 'utf8');

      const res = runHandoverCheck([file]);
      expect(res.status).toBe(1);
      expect(res.stderr).toContain('must not contain claims of human verification or sign-off');
    });

    it('fails validation for H002+ when header Evidence SHA differs from Section 4 Git SHA', () => {
      const file = join(tempHandoversDir, 'H002-sha-mismatch.md');
      const content = createValidH002({
        [`- **Git:** \`main\` at \`${headSha.slice(0, 7)}\``]: '- **Git:** `main` at `deadbeef1234`',
      });
      writeFileSync(file, content, 'utf8');

      const res = runHandoverCheck([file]);
      expect(res.status).toBe(1);
      expect(res.stderr).toContain('differs from Section 4 Git SHA');
    });

    it('fails validation for H002+ when finding title differs from register.yml', () => {
      const file = join(tempHandoversDir, 'H002-finding-mismatch.md');
      const content = createValidH002({
        '- **Open P0 findings:** None remaining in WP-1 scope.':
          '- **Open P0 findings:**\n  - `20261020-UX-04`: Invented title not matching register.',
      });
      writeFileSync(file, content, 'utf8');

      const res = runHandoverCheck([file]);
      expect(res.status).toBe(1);
      expect(res.stderr).toContain("differs from register title ('Truncated CMS lifecycle");
    });

    it('fails validation for H002+ when tool version does not match package.json', () => {
      const file = join(tempHandoversDir, 'H002-tool-mismatch.md');
      const content = createValidH002({
        'Zero hardcoding': 'Zero hardcoding. Sourced toolchain: pnpm 9.9.9, Vitest 3.0.7.',
      });
      writeFileSync(file, content, 'utf8');

      const res = runHandoverCheck([file]);
      expect(res.status).toBe(1);
      expect(res.stderr).toContain('cites pnpm 9.9.9, which does not match package.json');
    });
  });
});
