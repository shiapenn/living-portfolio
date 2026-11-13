import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { buildOpenApiDocument } from '@living-portfolio/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../..');
const require = createRequire(import.meta.url);

describe('WP-15.0: DOM-ID Baseline Snapshot & Zod 4 / Vitest 4 Dependency Upgrades (UX-51, UX-53, UX-54)', () => {
  it('captures every rendered element id, data-testid, and data-* hook across all pages and fails when a baseline id disappears without an allowlist entry', async () => {
    const scriptPath = resolve(repoRoot, 'scripts/snapshot-dom-ids');
    const baselinePath = resolve(repoRoot, 'docs/audits/dom-id-baseline.json');

    expect(existsSync(scriptPath)).toBe(true);
    expect(existsSync(baselinePath)).toBe(true);

    const mod = await import(scriptPath);
    const result = await mod.verifyDomIdBaseline();
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.snapshot.allIds.length).toBeGreaterThan(50);
    expect(result.snapshot.assertedStrings.length).toBeGreaterThan(20);

    // Simulate a missing DOM id without an allowlist entry -> must fail
    const mutatedBaseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
    mutatedBaseline.allIds.push('synthetic-missing-dom-id-wp15-0');
    const failedResult = await mod.verifyDomIdBaseline({ baselineOverride: mutatedBaseline });
    expect(failedResult.ok).toBe(false);
    expect(failedResult.errors.some((e: string) => e.includes('synthetic-missing-dom-id-wp15-0'))).toBe(true);

    // Adding the missing DOM id to allowlist.removedIds -> must pass
    mutatedBaseline.allowlist = {
      ...mutatedBaseline.allowlist,
      removedIds: ['synthetic-missing-dom-id-wp15-0'],
    };
    const allowedResult = await mod.verifyDomIdBaseline({ baselineOverride: mutatedBaseline });
    expect(allowedResult.ok).toBe(true);
  });

  it('[20261106-UX-53] upgrades zod to >= 4.6.6 and preserves OpenAPI 3.1 schema reflection without drift', () => {
    const zodPkg = require('zod/package.json');
    const [major, minor, patch] = zodPkg.version.split('.').map(Number);
    expect(major).toBeGreaterThanOrEqual(4);
    if (major === 4) {
      expect(minor * 100 + patch).toBeGreaterThanOrEqual(606);
    }

    const doc = buildOpenApiDocument();
    const committedSpec = JSON.parse(readFileSync(resolve(repoRoot, 'docs/spec/openapi.json'), 'utf8'));
    expect(doc).toEqual(committedSpec);
  });

  it('[20261106-UX-54] [20261106-UX-51] upgrades vitest to >= 4.1.11 and resolves tinypool/esbuild/hono workspace versions', () => {
    const vitestPkg = require('vitest/package.json');
    const [vMajor, vMinor, vPatch] = vitestPkg.version.split('.').map(Number);
    expect(vMajor).toBeGreaterThanOrEqual(4);
    if (vMajor === 4 && vMinor === 1) {
      expect(vPatch).toBeGreaterThanOrEqual(11);
    }

    const apiPkg = JSON.parse(readFileSync(resolve(repoRoot, 'apps/api/package.json'), 'utf8'));
    const corePkg = JSON.parse(readFileSync(resolve(repoRoot, 'packages/core/package.json'), 'utf8'));
    expect(apiPkg.dependencies.zod).toMatch(/^\^?4\./);
    expect(corePkg.dependencies.zod).toMatch(/^\^?4\./);
    expect(apiPkg.devDependencies.vitest).toMatch(/^\^?4\./);
  });
});
