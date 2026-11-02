/**
 * Hosting Provider Spike & ADR Conformance Test (OSR-17, Gate G3, Spec §13.1, §19)
 *
 * Verifies that the hosting provider spike has been performed and documented in
 * Architecture Decision Record P003, satisfying the requirements of finding OSR-17.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Hosting Provider Spike & Architecture Decision Record (OSR-17, Gate G3)', () => {
  const root = resolve(__dirname, '../../../../');
  const adrPath = resolve(root, 'docs/plans/P003-hosting-provider-evaluation-and-staging-architecture-adr.md');
  const registryPath = resolve(root, 'docs/doc-registry.json');
  const osrPlanPath = resolve(root, 'docs/plans/osr-001-open-source-release.md');

  it('1. Architecture Decision Record P003 exists and is registered in doc-registry.json', () => {
    expect(existsSync(adrPath)).toBe(true);
    expect(existsSync(registryPath)).toBe(true);

    const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
    const entry = registry.find((doc: { id: string }) => doc.id === 'P003');
    expect(entry).toBeDefined();
    expect(entry.class).toBe('P');
    expect(entry.status).toBe('active');
    expect(entry.path).toBe('docs/plans/P003-hosting-provider-evaluation-and-staging-architecture-adr.md');
  });

  it('2. ADR P003 contains all mandatory architectural decision record sections', () => {
    const content = readFileSync(adrPath, 'utf8');

    const expectedSections = [
      '## 1. Context and Problem Statement',
      '## 2. Decision Drivers',
      '## 3. Evaluated Candidates & Spike Findings',
      '## 4. Deep-Dive Spike Verification',
      '## 5. Decision Outcome',
      '## 6. Staging Architecture & Safeguards (OSR-18, OSR-19)',
      '## 7. Operational Runbook & CI/CD Pipeline Design',
      '## 8. Architectural Invariants and Compliance Verification',
    ];

    for (const section of expectedSections) {
      expect(content).toContain(section);
    }
  });

  it('3. ADR P003 comprehensively evaluates all 4 spike criteria (digest, credentials, pgvector, pg_dump)', () => {
    const content = readFileSync(adrPath, 'utf8');

    // 1. Digest deploys
    expect(content).toMatch(/digest/i);
    expect(content).toMatch(/ghcr\.io/i);

    // 2. Credential scoping
    expect(content).toMatch(/credential/i);
    expect(content).toMatch(/deploy hook/i);

    // 3. Native pgvector on PostgreSQL 16
    expect(content).toMatch(/pgvector/i);
    expect(content).toMatch(/PostgreSQL 16/i);

    // 4. pg_dump and backup drills
    expect(content).toMatch(/pg_dump/i);
    expect(content).toMatch(/pg_restore/i);
  });

  it('4. ADR P003 selects Render as lead staging provider and Fly.io as designated alternate', () => {
    const content = readFileSync(adrPath, 'utf8');

    expect(content).toMatch(/Render.*primary|Render.*lead/i);
    expect(content).toMatch(/Fly\.io.*alternate|Fly\.io.*secondary/i);
    expect(content).toMatch(/Docker Compose.*self-host/i);
  });

  it('5. ADR P003 defines staging safeguards conforming to OSR-001 §6.4', () => {
    const content = readFileSync(adrPath, 'utf8');
    const osrPlan = readFileSync(osrPlanPath, 'utf8');

    expect(osrPlan).toContain('### 6.4 Staging safeguards (synthetic data only)');
    expect(content).toContain('DEPLOYMENT_CLASS=staging');
    expect(content).toContain('Staging: synthetic data only');
    expect(content).toContain('robots');
    expect(content).toContain('g4-signoff.md');
  });
});
