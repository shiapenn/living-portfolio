import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../../../');

describe('WP-12.3 Open-Source Governance & Full Documentation Suite (M10, OSR-23)', () => {
  describe('Open-Source Governance File Set (M10 [P3])', () => {
    it('LICENSE exists and contains Apache-2.0 license terms', () => {
      const licensePath = path.join(REPO_ROOT, 'LICENSE');
      expect(fs.existsSync(licensePath)).toBe(true);
      const content = fs.readFileSync(licensePath, 'utf8');
      expect(content).toContain('Apache License');
      expect(content).toContain('Version 2.0, January 2004');
      expect(content).toContain('http://www.apache.org/licenses/');
    });

    it('GOVERNANCE.md exists with required governance sections', () => {
      const govPath = path.join(REPO_ROOT, 'GOVERNANCE.md');
      expect(fs.existsSync(govPath)).toBe(true);
      const content = fs.readFileSync(govPath, 'utf8');
      expect(content).toContain('# Project Governance');
      expect(content).toContain('Project Philosophy');
      expect(content).toContain('Roles and Responsibilities');
      expect(content).toContain('Decision-Making');
      expect(content).toContain('Release Process');
      expect(content).toContain('Gate G0');
      expect(content).toContain('Gate G5');
      expect(content).toContain('Code of Conduct');
    });

    it('CODE_OF_CONDUCT.md exists and contains Contributor Covenant v2.1', () => {
      const cocPath = path.join(REPO_ROOT, 'CODE_OF_CONDUCT.md');
      expect(fs.existsSync(cocPath)).toBe(true);
      const content = fs.readFileSync(cocPath, 'utf8');
      expect(content).toContain('Contributor Covenant Code of Conduct');
      expect(content).toContain('Our Pledge');
      expect(content).toContain('Our Standards');
      expect(content).toContain('Enforcement Guidelines');
      expect(content).toContain('version 2.1');
    });

    it('CONTRIBUTING.md links to GOVERNANCE.md, CODE_OF_CONDUCT.md, LICENSE, and DCO', () => {
      const contribPath = path.join(REPO_ROOT, 'CONTRIBUTING.md');
      expect(fs.existsSync(contribPath)).toBe(true);
      const content = fs.readFileSync(contribPath, 'utf8');
      expect(content).toContain('GOVERNANCE.md');
      expect(content).toContain('CODE_OF_CONDUCT.md');
      expect(content).toContain('LICENSE');
      expect(content).toContain('DCO');
      expect(content).toContain('Signed-off-by');
    });

    it('THIRD_PARTY_NOTICES lists all direct runtime dependencies', () => {
      const noticesPath = path.join(REPO_ROOT, 'THIRD_PARTY_NOTICES');
      expect(fs.existsSync(noticesPath)).toBe(true);
      const content = fs.readFileSync(noticesPath, 'utf8');
      const requiredDeps = [
        'hono',
        '@hono/node-server',
        'drizzle-orm',
        'pg',
        'pg-boss',
        'pgvector',
        'zod',
        'yaml',
        'typescript',
        'vitest',
        'playwright',
        'turbo',
      ];
      for (const dep of requiredDeps) {
        expect(content).toContain(dep);
      }
    });
  });

  describe('Complete Documentation Suite (OSR-23 [P3])', () => {
    it('Self-Hosting Guide (docs/self-hosting.md) covers deployment, configuration, and trademarks', () => {
      const guidePath = path.join(REPO_ROOT, 'docs/self-hosting.md');
      expect(fs.existsSync(guidePath)).toBe(true);
      const content = fs.readFileSync(guidePath, 'utf8');
      expect(content).toContain('# Self-Hosting & Branding Configuration Guide');
      expect(content).toContain('Single-Owner Deployment Model');
      expect(content).toContain('System Requirements');
      expect(content).toContain('Docker Compose');
      expect(content).toContain('Configuration Contract');
      expect(content).toContain('PORT');
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('SITE_ORIGIN');
      expect(content).toContain('ADMIN_ORIGIN');
      expect(content).toContain('SESSION_SECRET');
      expect(content).toContain('Reverse Proxy');
      expect(content).toContain('Cloudflare Tunnel');
      expect(content).toContain('Backups');
      expect(content).toContain('PUBLIC_UNOFFICIAL_FORK_NOTICE');
    });

    it('Configuration Reference (G002) is active and registered in docs registry', () => {
      const configDocPath = path.join(REPO_ROOT, 'docs/G002-configuration-reference-and-environment-contract.md');
      expect(fs.existsSync(configDocPath)).toBe(true);
      const registryPath = path.join(REPO_ROOT, 'docs/doc-registry.json');
      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      const entry = registry.find((d: { id: string }) => d.id === 'G002');
      expect(entry).toBeDefined();
      expect(entry.class).toBe('G');
      expect(entry.status).toBe('active');
    });

    it('Upgrade Guide (G003) covers semver, migrations, backups, and embedding transitions', () => {
      const upgradePath = path.join(REPO_ROOT, 'docs/G003-upgrade-and-migration-guide.md');
      expect(fs.existsSync(upgradePath)).toBe(true);
      const content = fs.readFileSync(upgradePath, 'utf8');
      expect(content).toContain('# G003 — Upgrade and Migration Guide');
      expect(content).toContain('Semantic Versioning');
      expect(content).toContain('qrxp_schema_version');
      expect(content).toContain('Pre-Upgrade Preparation');
      expect(content).toContain('pg_dump');
      expect(content).toContain('Drizzle ORM');
      expect(content).toContain('db:migrate');
      expect(content).toContain('Embedding Model Transitions');
      expect(content).toContain('Rollback Procedures');
    });

    it('ADR Archive (G004) indexes P002, P003, and DR-AUD-001 with governance guidelines', () => {
      const adrIndexPath = path.join(REPO_ROOT, 'docs/G004-architecture-decision-records-archive.md');
      expect(fs.existsSync(adrIndexPath)).toBe(true);
      const content = fs.readFileSync(adrIndexPath, 'utf8');
      expect(content).toContain('# G004 — Architecture Decision Records Archive');
      expect(content).toContain('P002');
      expect(content).toContain('P003');
      expect(content).toContain('DR-AUD-001');
      expect(content).toContain('When an ADR is Required');
      expect(content).toContain('Proposing a New ADR');
    });

    it('README.md links all governance files, documentation guides, and ADRs', () => {
      const readmePath = path.join(REPO_ROOT, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf8');
      expect(content).toContain('GOVERNANCE.md');
      expect(content).toContain('CODE_OF_CONDUCT.md');
      expect(content).toContain('CONTRIBUTING.md');
      expect(content).toContain('THIRD_PARTY_NOTICES');
      expect(content).toContain('docs/self-hosting.md');
      expect(content).toContain('G002');
      expect(content).toContain('G003');
      expect(content).toContain('G004');
    });
  });
});
