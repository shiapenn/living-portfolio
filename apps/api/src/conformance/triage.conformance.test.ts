import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { runTriage } from '../../../../scripts/triage';

const ROOT = resolve(import.meta.dirname, '../../../..');
const TRIAGE_BIN = resolve(ROOT, 'scripts/triage');

describe('Autonomous Triage Protocol Conformance (scripts/triage, Task A017 / HO-1b)', () => {
  it('evaluates current repository state and yields TRIAGE: PROCEED', () => {
    const res = runTriage({ offline: true });
    expect(res.verdict).toBe('TRIAGE: PROCEED');
    expect(res.failures).toEqual([]);
    expect(res.questions).toEqual([]);
  });

  it('runs via CLI and exits 0 on valid state', () => {
    const stdout = execFileSync('node', [TRIAGE_BIN, '--offline'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    expect(stdout).toContain('TRIAGE: PROCEED');
  });
});
