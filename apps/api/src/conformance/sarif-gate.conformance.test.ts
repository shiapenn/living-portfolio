import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const ROOT = resolve(import.meta.dirname, '../../../..');
const SARIF_GATE = resolve(ROOT, 'scripts/sarif-gate');

describe('CodeQL SARIF Gate Conformance (Instructions 1 & 2)', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sarif-gate-test-'));
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function runSarifGate(args: string[], env: NodeJS.ProcessEnv = {}): { stdout: string; stderr: string; status: number } {
    try {
      const stdout = execFileSync('node', [SARIF_GATE, ...args], {
        cwd: ROOT,
        env: { ...process.env, ...env },
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

  it('fails when specified SARIF file or directory is missing (Instruction 2)', () => {
    const nonexistent = join(tempDir, 'does-not-exist.sarif');
    const result = runSarifGate([nonexistent]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Specified SARIF path does not exist');
  });

  it('fails in CI environment when no SARIF file is found (Instruction 2 non-vacuous requirement)', () => {
    // 1. Target directory with no SARIF files
    const emptyDir = join(tempDir, 'empty');
    mkdirSyncCustom(emptyDir);
    const resultWithDir = runSarifGate([emptyDir], { CI: 'true' });
    expect(resultWithDir.status).toBe(1);
    expect(resultWithDir.stderr).toContain('No SARIF files found at specified path');

    // 2. No target specified at all in CI
    const resultWithoutArg = runSarifGate([], { CI: 'true' });
    expect(resultWithoutArg.status).toBe(1);
    expect(resultWithoutArg.stderr).toContain('In CI environments, a SARIF target directory or file must be specified');
  });

  it('fails when an unbaselined CodeQL alert is present and prints parsed counts (Instruction 2)', () => {
    const unbaselinedSarif = {
      version: '2.1.0',
      $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
      runs: [
        {
          tool: { driver: { name: 'CodeQL', version: '2.20.0' } },
          results: [
            {
              ruleId: 'js/sql-injection',
              message: { text: 'Untrusted input in query' },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: 'apps/api/src/routes/entries.ts' },
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    const sarifPath = join(tempDir, 'results.sarif');
    writeFileSync(sarifPath, JSON.stringify(unbaselinedSarif, null, 2), 'utf8');

    const result = runSarifGate([sarifPath]);
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('Alerts parsed from SARIF: total = 1, baselined = 0, unbaselined = 1');
    expect(result.stderr).toContain('unbaselined CodeQL alert(s) detected');
    expect(result.stderr).toContain('Rule [js/sql-injection]');
  });

  it('passes when a SARIF alert matches a valid baselined rule citing an approved register finding', () => {
    // S1 is a valid register finding in docs/audits/register.yml
    const customBaselinePath = resolve(ROOT, 'docs/audits/sarif-baseline.json');
    const originalBaseline = JSON.parse(readFileSyncCustom(customBaselinePath));

    try {
      // Temporarily add a baselined rule mapping to S1
      const testBaseline = {
        baselined_alerts: [
          {
            rule_id: 'js/tested-baselined-rule',
            register_finding: 'S1',
            file: 'apps/api/src/app.ts',
            justification: 'Approved baseline finding S1 mapping',
          },
        ],
      };
      writeFileSync(customBaselinePath, JSON.stringify(testBaseline, null, 2), 'utf8');

      const baselinedSarif = {
        version: '2.1.0',
        runs: [
          {
            tool: { driver: { name: 'CodeQL' } },
            results: [
              {
                ruleId: 'js/tested-baselined-rule',
                message: { text: 'Expected baselined alert' },
                locations: [
                  {
                    physicalLocation: {
                      artifactLocation: { uri: 'apps/api/src/app.ts' },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };
      const sarifPath = join(tempDir, 'clean.sarif');
      writeFileSync(sarifPath, JSON.stringify(baselinedSarif, null, 2), 'utf8');

      const result = runSarifGate([sarifPath]);
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('Alerts parsed from SARIF: total = 1, baselined = 1, unbaselined = 0');
      expect(result.stdout).toContain('Gate PASSED');
    } finally {
      writeFileSync(customBaselinePath, JSON.stringify(originalBaseline, null, 2), 'utf8');
    }
  });
});

function readFileSyncCustom(p: string): string {
  const { readFileSync } = require('node:fs');
  return readFileSync(p, 'utf8');
}

function mkdirSyncCustom(p: string): void {
  const { mkdirSync } = require('node:fs');
  mkdirSync(p, { recursive: true });
}
