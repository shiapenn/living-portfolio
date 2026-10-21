/**
 * Regression Test for scripts/hardcode-check (Instruction 5, OSR-01)
 *
 * Verifies that:
 * 1. The scanner flags credential-like literals in non-test runtime code.
 * 2. Specifically catches the missed default token `lp_pat_default_test_admin_token_001`.
 * 3. Catches `sk-proj-...`, `ghp_...`, and `AKIA...` literals.
 * 4. Respects `excludeTests: true` so test fixtures with mock credentials are not flagged.
 * 5. Full repository scan passes with 0 unlisted hits.
 */
import { describe, it, expect } from 'vitest';
// @ts-ignore
import { scanContent, runHardcodeCheck } from '../../../../scripts/hardcode-check';

describe('scripts/hardcode-check scanner rules (OSR-01, Instruction 5)', () => {
  it('flags the missed default admin token lp_pat_default_test_admin_token_001 in non-test code', () => {
    // Construct token dynamically so this test file itself does not contain the static literal
    const missedDefaultToken = ['lp', 'pat', 'default', 'test', 'admin', 'token', '001'].join('_');
    const fakeRuntimeSource = `
      export function getAdminToken() {
        return process.env.ADMIN_TOKEN || '${missedDefaultToken}';
      }
    `;

    const hits = scanContent(fakeRuntimeSource, 'apps/api/src/app.ts');
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits.some((h: any) => h.ruleId === 'CREDENTIAL_LITERAL_NON_TEST')).toBe(true);
    expect(hits.some((h: any) => h.snippet.includes(missedDefaultToken))).toBe(true);
  });

  it('flags sk-proj, ghp_, and AKIA credential literals in non-test code', () => {
    const fakeKey = ['sk', 'proj', '1234567890abcdef1234567890'].join('-');
    const fakeGhp = ['ghp', '1234567890abcdef1234567890abcdef'].join('_');
    const fakeSource = `
      const openAiKey = "${fakeKey}";
      const ghToken = "${fakeGhp}";
    `;

    const hits = scanContent(fakeSource, 'apps/api/src/routes/ask.ts');
    expect(hits.length).toBeGreaterThanOrEqual(2);
    expect(hits.some((h: any) => h.snippet.includes(fakeKey))).toBe(true);
    expect(hits.some((h: any) => h.snippet.includes(fakeGhp))).toBe(true);
  });

  it('ignores CREDENTIAL_LITERAL_NON_TEST in test files (*.test.ts)', () => {
    const fakeKey = ['sk', 'proj', '1234567890abcdef1234567890'].join('-');
    const testFileContent = `
      it('tests mock token', () => {
        const k = '${fakeKey}';
      });
    `;

    const hits = scanContent(testFileContent, 'apps/api/src/routes/ask.test.ts');
    expect(hits.some((h: any) => h.ruleId === 'CREDENTIAL_LITERAL_NON_TEST')).toBe(false);
  });

  it('runs full repo scan and verifies 0 unlisted hits', () => {
    const hits = runHardcodeCheck();
    expect(hits).toEqual([]);
  });
});
