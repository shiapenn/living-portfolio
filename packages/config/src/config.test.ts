import { writeFileSync, unlinkSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertNoSecretsInClientBundle,
  ConfigValidationError,
  extractPublicClientConfig,
  generateEnvExample,
  loadConfig,
} from './index.js';

describe('@living-portfolio/config (OSR-02, OSR-03, OSR-09)', () => {
  it('boots from environment defaults in development mode', () => {
    const cfg = loadConfig({ env: {} });
    expect(cfg.PORT).toBe(4000);
    expect(cfg.DEPLOYMENT_CLASS).toBe('development');
    expect(cfg.SEED_DEMO).toBe(false);
    expect(cfg.PUBLIC_SITE_NAME).toBe('Portfolio Sandbox');
  });

  it('supports precedence: defaults < YAML config < environment variables < *_FILE mounted secrets', () => {
    const tmpYaml = join(tmpdir(), `lp-config-${Date.now()}.yml`);
    const tmpSecret = join(tmpdir(), `lp-secret-${Date.now()}.txt`);
    writeFileSync(tmpYaml, 'PORT: 5000\nPUBLIC_SITE_NAME: "YAML Brand"\n', 'utf8');
    writeFileSync(tmpSecret, '  super_secret_mounted_session_key_12345  \n', 'utf8');

    try {
      const cfg = loadConfig({
        yamlPath: tmpYaml,
        env: {
          PORT: '6000',
          SESSION_SECRET_FILE: tmpSecret,
        },
      });
      expect(cfg.PORT).toBe(6000);
      expect(cfg.PUBLIC_SITE_NAME).toBe('YAML Brand');
      expect(cfg.SESSION_SECRET).toBe('super_secret_mounted_session_key_12345');
    } finally {
      unlinkSync(tmpYaml);
      unlinkSync(tmpSecret);
    }
  });

  it('fails fast with ConfigValidationError listing missing values in production', () => {
    expect(() =>
      loadConfig({
        env: {
          DEPLOYMENT_CLASS: 'production',
          SEED_DEMO: 'true',
        },
      })
    ).toThrow(ConfigValidationError);

    try {
      loadConfig({
        env: {
          DEPLOYMENT_CLASS: 'production',
          SEED_DEMO: 'true',
        },
      });
    } catch (err) {
      const configErr = err as ConfigValidationError;
      expect(configErr.issues.map((i) => i.key)).toEqual(
        expect.arrayContaining(['DATABASE_URL', 'SESSION_SECRET', 'SEED_DEMO'])
      );
    }
  });

  it('extracts only PUBLIC_ settings and proves no secret reaches client output', () => {
    // CI fix 3b: fake key is assembled at runtime so no credential-shaped literal exists in source.
    // It is NOT a real credential — it is a random, test-only string that never leaves this process.
    const fakeOpenAiKey = ['sk', 'test', randomUUID().replace(/-/g, '')].join('-');
    const cfg = loadConfig({
      env: {
        SESSION_SECRET: 'secret_value_that_must_never_leak_999',
        OPENAI_API_KEY: fakeOpenAiKey,
        PUBLIC_SITE_NAME: 'My Portfolio',
      },
    });
    const pub = extractPublicClientConfig(cfg);
    expect(Object.keys(pub).every((k) => k.startsWith('PUBLIC_'))).toBe(true);
    expect(pub.SESSION_SECRET).toBeUndefined();
    expect(pub.OPENAI_API_KEY).toBeUndefined();

    const serializedClientBundle = JSON.stringify(pub);
    const checkClean = assertNoSecretsInClientBundle(serializedClientBundle, cfg);
    expect(checkClean.ok).toBe(true);
    expect(checkClean.leaked).toEqual([]);

    const checkLeaked = assertNoSecretsInClientBundle(
      serializedClientBundle + ` window.OPENAI_API_KEY = "${fakeOpenAiKey}";`,
      cfg
    );
    expect(checkLeaked.ok).toBe(false);
    expect(checkLeaked.leaked).toContain('OPENAI_API_KEY');
  });

  it('generates deterministic .env.example output (OSR-03)', () => {
    const example = generateEnvExample();
    expect(example).toContain('PORT=4000');
    expect(example).toContain('PUBLIC_SITE_NAME=Portfolio Sandbox');
    expect(example).toContain('SESSION_SECRET=');
  });

  it('resolves DATA_DIR and BACKUP_DIR to absolute repository root paths (WP-13.11)', async () => {
    const { resolveDataDir, resolveBackupDir, findRepoRoot } = await import('./index.js');
    const repoRoot = findRepoRoot();
    expect(repoRoot).toBeDefined();

    // From simulated subfolder (like apps/api)
    const simulatedSubdir = join(repoRoot, 'apps/api');
    const dataDir = resolveDataDir(undefined, simulatedSubdir);
    const backupDir = resolveBackupDir(undefined, undefined, simulatedSubdir);

    expect(dataDir).toBe(join(repoRoot, 'data'));
    expect(backupDir).toBe(join(repoRoot, 'data/backups'));
  });
});
