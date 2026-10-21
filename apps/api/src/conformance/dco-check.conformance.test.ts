/**
 * Conformance & Regression Test for scripts/dco-check (OSR-07 §5.1, Instruction 4 & 6)
 *
 * Verifies that:
 * 1. A multi-commit range with one unsigned commit in the middle fails the DCO check
 *    with non-zero exit code, pinpointing the exact offending commit.
 * 2. A multi-commit range where every commit carries a valid Signed-off-by trailer passes.
 * 3. Commit-msg hook mode rejects unsigned message files and accepts signed messages.
 * 4. When DCO_BASE_SHA is all zeros (new branch push) or an unreachable SHA (force push / history rewrite),
 *    dco-check falls back to inspecting full repository history and prints an explicit notice.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const SCRIPT_PATH = resolve(import.meta.dirname, '../../../../scripts/dco-check');

describe('scripts/dco-check Multi-Commit & Unreachable Base Verification (OSR-07, Instruction 4 & 6)', () => {
  let tmpRepo: string;

  beforeAll(() => {
    tmpRepo = mkdtempSync(join(tmpdir(), 'dco-multi-commit-test-'));
    execFileSync('git', ['init', '-b', 'main'], { cwd: tmpRepo });
    execFileSync('git', ['config', 'user.name', 'Living Portfolio Tester'], { cwd: tmpRepo });
    execFileSync('git', ['config', 'user.email', 'tester@example.com'], { cwd: tmpRepo });
    execFileSync('git', ['config', 'commit.gpgsign', 'false'], { cwd: tmpRepo });
    execFileSync('git', ['config', 'tag.gpgsign', 'false'], { cwd: tmpRepo });

    // Base commit on main branch
    execFileSync(
      'git',
      ['commit', '--allow-empty', '-m', 'chore: root baseline commit\n\nSigned-off-by: Living Portfolio Tester <tester@example.com>'],
      { cwd: tmpRepo }
    );
  });

  afterAll(() => {
    if (tmpRepo) {
      rmSync(tmpRepo, { recursive: true, force: true });
    }
  });

  it('fails when a multi-commit range has one unsigned commit in the middle', () => {
    execFileSync('git', ['checkout', '-b', 'feat/pr-with-middle-unsigned'], { cwd: tmpRepo });

    execFileSync(
      'git',
      ['commit', '--allow-empty', '-m', 'feat: initial signed commit\n\nSigned-off-by: Living Portfolio Tester <tester@example.com>'],
      { cwd: tmpRepo }
    );

    execFileSync(
      'git',
      ['commit', '--allow-empty', '-m', 'fix: middle commit lacking signed-off-by trailer'],
      { cwd: tmpRepo }
    );

    execFileSync(
      'git',
      ['commit', '--allow-empty', '-m', 'test: final signed commit\n\nSigned-off-by: Living Portfolio Tester <tester@example.com>'],
      { cwd: tmpRepo }
    );

    const res = spawnSync('node', [SCRIPT_PATH], {
      cwd: tmpRepo,
      env: { ...process.env, DCO_COMMIT_RANGE: 'main..HEAD' },
      encoding: 'utf8',
    });

    expect(res.status).toBe(1);
    expect(res.stderr).toContain('1 of 3 commit(s) in main..HEAD lack a valid "Signed-off-by: Name <email>" trailer');
    expect(res.stderr).toContain('fix: middle commit lacking signed-off-by trailer');
  });

  it('passes when every commit in a multi-commit range is signed off', () => {
    execFileSync('git', ['checkout', 'main'], { cwd: tmpRepo });
    execFileSync('git', ['checkout', '-b', 'feat/pr-all-signed'], { cwd: tmpRepo });

    execFileSync(
      'git',
      ['commit', '--allow-empty', '-m', 'feat: step 1\n\nSigned-off-by: Living Portfolio Tester <tester@example.com>'],
      { cwd: tmpRepo }
    );

    execFileSync(
      'git',
      ['commit', '--allow-empty', '-m', 'feat: step 2\n\nSigned-off-by: Living Portfolio Tester <tester@example.com>'],
      { cwd: tmpRepo }
    );

    execFileSync(
      'git',
      ['commit', '--allow-empty', '-m', 'feat: step 3\n\nSigned-off-by: Living Portfolio Tester <tester@example.com>'],
      { cwd: tmpRepo }
    );

    const res = spawnSync('node', [SCRIPT_PATH], {
      cwd: tmpRepo,
      env: { ...process.env, DCO_COMMIT_RANGE: 'main..HEAD' },
      encoding: 'utf8',
    });

    expect(res.status).toBe(0);
    expect(res.stdout).toContain('All 3 commit(s) in main..HEAD carry a valid Signed-off-by trailer');
  });

  it('falls back to full history and prints a notice when base SHA is all zeros', () => {
    const res = spawnSync('node', [SCRIPT_PATH], {
      cwd: tmpRepo,
      env: {
        ...process.env,
        DCO_COMMIT_RANGE: '',
        DCO_BASE_SHA: '0000000000000000000000000000000000000000',
        DCO_HEAD_SHA: 'HEAD',
      },
      encoding: 'utf8',
    });

    expect(res.stdout).toContain('[OSR-07 DCO] Notice: Base commit (0000000000000000000000000000000000000000) is unreachable or all zeros');
    expect(res.stdout).toContain('full history up to HEAD');
  });

  it('falls back to full history and prints a notice when base SHA is unreachable (rewritten history)', () => {
    const unreachableSha = '3d10a7711b4c25bf677627acf22cbde78eef6728';
    const res = spawnSync('node', [SCRIPT_PATH], {
      cwd: tmpRepo,
      env: {
        ...process.env,
        DCO_COMMIT_RANGE: '',
        DCO_BASE_SHA: unreachableSha,
        DCO_HEAD_SHA: 'HEAD',
      },
      encoding: 'utf8',
    });

    expect(res.stdout).toContain(`[OSR-07 DCO] Notice: Base commit (${unreachableSha}) is unreachable or all zeros`);
    expect(res.stdout).toContain('full history up to HEAD');
  });

  it('correctly verifies git commit-msg hook mode', () => {
    const hookTmp = mkdtempSync(join(tmpdir(), 'dco-hook-'));
    try {
      const unsignedFile = join(hookTmp, 'COMMIT_UNSIGNED');
      writeFileSync(unsignedFile, 'feat: unsigned commit message\n');
      const resUnsigned = spawnSync('node', [SCRIPT_PATH, unsignedFile], { encoding: 'utf8' });
      expect(resUnsigned.status).toBe(1);
      expect(resUnsigned.stderr).toContain('Commit rejected: missing valid "Signed-off-by: Name <email>" trailer');

      const signedFile = join(hookTmp, 'COMMIT_SIGNED');
      writeFileSync(signedFile, 'feat: signed commit message\n\nSigned-off-by: Living Portfolio Tester <tester@example.com>\n');
      const resSigned = spawnSync('node', [SCRIPT_PATH, signedFile], { encoding: 'utf8' });
      expect(resSigned.status).toBe(0);
      expect(resSigned.stdout).toContain('Commit message sign-off verified');
    } finally {
      rmSync(hookTmp, { recursive: true, force: true });
    }
  });
});
