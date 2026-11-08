import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CONFIG_SETTINGS_METADATA } from '@living-portfolio/config';
import { renderAdminSetupPage, renderAdminLoginPage } from '@living-portfolio/web';
import { WIZARD_STRINGS } from '../../../../apps/web/src/strings/en.js';
import { createApp } from '../app.js';

const REPO_ROOT = path.resolve(__dirname, '../../../../');
const START_HERE_PATH = path.join(REPO_ROOT, 'docs/START-HERE.md');

describe('WP-13.13 Conformance: Honest START-HERE Runbook Verification (§13, UX-32, 20261106-UX-48)', () => {
  const docContent = fs.readFileSync(START_HERE_PATH, 'utf8');

  it('1. Pre-flight check and path honesty: docker --version precedes path selection, no unverified claims', () => {
    // Must start with docker --version pre-flight check
    expect(docContent).toContain('docker --version');

    // Section 1 / Overview must not claim "Under 15 minutes (< 15 min)" without qualification
    expect(docContent).not.toMatch(/Under 15 minutes/i);

    // No "Recommended" before pre-flight
    const preflightIdx = docContent.indexOf('docker --version');
    const firstRecommendedIdx = docContent.indexOf('Recommended');
    if (firstRecommendedIdx !== -1) {
      expect(firstRecommendedIdx).toBeGreaterThan(preflightIdx);
    }

    // Must not claim SQLite exists (codebase has no SQLite)
    expect(docContent).not.toMatch(/sqlite/i);

    // Path B must state clearly in bold before commands that data is lost on restart
    expect(docContent).toMatch(/\*\*.*(lost on restart|not survive a restart|ephemeral).*\*\*/i);
    expect(docContent).toContain('InMemoryPortfolioRepository');
  });

  it('2. Referenced file paths, compose files, and pnpm filters exist in repository', () => {
    // docker compose file path check
    const composePathRegex = /(docker\/docker-compose[a-zA-Z0-9._-]*\.ya?ml)/g;
    const matches = Array.from(docContent.matchAll(composePathRegex)).map((m) => m[1]);
    expect(matches.length).toBeGreaterThan(0);
    for (const relPath of matches) {
      const fullPath = path.join(REPO_ROOT, relPath);
      expect(fs.existsSync(fullPath), `Referenced compose file ${relPath} must exist`).toBe(true);
    }

    // pnpm package filter check
    const filterRegex = /--filter\s+(@living-portfolio\/[a-z0-9-]+)/g;
    const filterMatches = Array.from(docContent.matchAll(filterRegex)).map((m) => m[1]);
    expect(filterMatches.length).toBeGreaterThan(0);
    for (const pkgName of filterMatches) {
      const pkgJsonPath = path.join(REPO_ROOT, 'apps', pkgName.replace('@living-portfolio/', ''), 'package.json');
      const pkgJsonPackagesPath = path.join(REPO_ROOT, 'packages', pkgName.replace('@living-portfolio/', ''), 'package.json');
      const exists = fs.existsSync(pkgJsonPath) || fs.existsSync(pkgJsonPackagesPath);
      expect(exists, `Filtered package ${pkgName} must exist`).toBe(true);
    }
  });

  it('3. Referenced environment variables exist in @living-portfolio/config or .env.example', () => {
    const validConfigKeys = new Set(CONFIG_SETTINGS_METADATA.map((m) => m.key));
    // Additional runtime env keys that are valid
    validConfigKeys.add('ENABLE_BUNDLED_WEB');
    validConfigKeys.add('NODE_ENV');
    validConfigKeys.add('PORTFOLIO_DB_MODE');
    validConfigKeys.add('CONFIG_FILE');

    // Extract all uppercase env keys mentioned in START-HERE
    const envKeyRegex = /\b([A-Z][A-Z0-9_]{3,})\b/g;
    const ignoredTokens = new Set([
      'HTTP', 'HTTPS', 'HTML', 'JSON', 'TOTP', 'BASE', 'UUID', 'POST', 'GET', 'CORS', 'CSRF', 'ONNX', 'SMTP', 'S3', 'VPS', 'REST'
    ]);
    const foundKeys = Array.from(docContent.matchAll(envKeyRegex))
      .map((m) => m[1])
      .filter((k) => !ignoredTokens.has(k) && (k.includes('_') || k === 'PORT'));

    for (const key of foundKeys) {
      expect(validConfigKeys.has(key), `Env key ${key} referenced in START-HERE.md must exist in config schema`).toBe(true);
    }
  });

  it('4. Real healthz response matches code: healthy status and 0.1.0 version (not ok or alpha)', async () => {
    const { app } = createApp();
    const res = await app.request('/healthz');
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.status).toBe('healthy');
    expect(body.version).toBe('0.1.0');

    // START-HERE.md must NOT claim {"status":"ok","version":"0.1.0-alpha.0"}
    expect(docContent).not.toContain('"status":"ok"');
    expect(docContent).not.toContain('0.1.0-alpha.0');
    expect(docContent).toContain('"status":"healthy"');
  });

  it('5. Real recovery code format: 16 hex characters xxxx-xxxx-xxxx-xxxx and exactly 8 codes', () => {
    // Must specify 16 hex characters and xxxx-xxxx-xxxx-xxxx format
    expect(docContent).toContain('xxxx-xxxx-xxxx-xxxx');
    expect(docContent).toContain('16');
    expect(docContent).toContain('8');
    // Must NOT specify legacy 8-char format xxxx-xxxx for new setups
    expect(docContent).not.toContain('paste and save 8 emergency recovery codes (`xxxx-xxxx`)');
    expect(docContent).not.toContain('single-use recovery codes (`xxxx-xxxx`)');
  });

  it('6. Step titles, headings, notices and button labels match rendered wizard and strings', () => {
    const setupHtml = renderAdminSetupPage();

    // Step 1: Owner Account Setup
    expect(docContent).toContain(WIZARD_STRINGS.step1.title);
    expect(docContent).toContain(WIZARD_STRINGS.step1.submitButton);
    expect(docContent).toContain(WIZARD_STRINGS.step1.enrolment.verifyButton);
    expect(docContent).toContain(WIZARD_STRINGS.step1.credentials.gateLabel);
    expect(docContent).toContain(WIZARD_STRINGS.step1.credentials.continueButton);

    // Step 2: Hosting Option & Presets
    expect(docContent).toContain(WIZARD_STRINGS.step2.title);
    expect(docContent).toContain(WIZARD_STRINGS.step2.nextButton);

    // Step 3: Model Providers & Privacy Boundary (must be read-only; no "Enter API keys")
    expect(docContent).toContain(WIZARD_STRINGS.step3.title);
    expect(docContent).toContain(WIZARD_STRINGS.step3.nextButton);
    expect(docContent).toContain(WIZARD_STRINGS.step3.keysNotice);
    expect(docContent).not.toContain('Enter API keys for your preferred inference');

    // Step 4: Notifications & Alerts (test alert is disabled)
    expect(docContent).toContain(WIZARD_STRINGS.step4.title);
    expect(docContent).toContain(WIZARD_STRINGS.step4.testDisabledReason);
    expect(docContent).toContain(WIZARD_STRINGS.step4.nextButton);

    // Step 5: Encrypted Backup Destination
    expect(docContent).toContain(WIZARD_STRINGS.step5.title);
    expect(docContent).toContain(WIZARD_STRINGS.step5.nextButton);

    // Step 6: Theme & First-Run Walkthrough
    expect(docContent).toContain(WIZARD_STRINGS.step6.title);
    expect(docContent).toContain(WIZARD_STRINGS.step6.themeAppliedNotice);
    expect(docContent).toContain(WIZARD_STRINGS.step6.finishButton);

    // Step labels in rendered markup
    expect(setupHtml).toContain(WIZARD_STRINGS.step1.title);
    expect(setupHtml).toContain(WIZARD_STRINGS.step6.finishButton);
  });

  it('7. Login page recovery link matches rendered markup', () => {
    const loginHtml = renderAdminLoginPage();
    const expectedLabel = 'Lost your authenticator device? Sign in with a recovery code';
    expect(loginHtml).toContain(expectedLabel);
    expect(docContent).toContain(expectedLabel);
  });

  it('8. Troubleshooting covers all four required error cases', () => {
    // 1. docker not found / command not found
    expect(docContent).toMatch(/docker.*(not found|command not found)/i);
    // 2. port 4000 already in use
    expect(docContent).toMatch(/4000.*(in use|already in use|EADDRINUSE)/i);
    expect(docContent).toContain('lsof -i :4000');
    // 3. pnpm or node not found or too old
    expect(docContent).toMatch(/(node|pnpm).*(not found|too old|outdated)/i);
    // 4. backup folder permissions / cannot write
    expect(docContent).toMatch(/backup.*(permission|write|cannot write|can't write)/i);
  });

  it('9. Document header conforms to repo rules', () => {
    expect(docContent).toMatch(/\|\s*Date\s*\|\s*2026-11-08\s*\|/);
    expect(docContent).toMatch(/\|\s*Status\s*\|\s*active\s*\|/);
    expect(docContent).toMatch(/\|\s*Document ID\s*\|\s*L016\s*\|/);
  });
});
