import { describe, it, expect } from 'vitest';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';
import {
  renderAdminWorkspacePage,
  renderAdminLoginPage,
  renderAdminSetupPage,
  ADMIN_API_CLIENT_SCRIPT,
} from '@living-portfolio/web';

/**
 * Extracts all inline <script>...</script> code from an HTML page string.
 */
function extractInlineScripts(html: string): string[] {
  const scripts: string[] = [];
  let cursor = 0;
  const lower = html.toLowerCase();
  while (cursor < html.length) {
    const scriptStart = lower.indexOf('<script', cursor);
    if (scriptStart === -1) break;
    const scriptStartClose = html.indexOf('>', scriptStart);
    if (scriptStartClose === -1) break;
    const scriptEnd = lower.indexOf('</script', scriptStartClose);
    if (scriptEnd === -1) break;
    const scriptEndClose = html.indexOf('>', scriptEnd);
    if (scriptEndClose === -1) break;
    scripts.push(html.slice(scriptStartClose + 1, scriptEnd));
    cursor = scriptEndClose + 1;
  }
  return scripts;
}

/**
 * Checks script content for illegal raw `fetch(` or `window.fetch(` calls
 * outside of the canonical apiClient definition itself.
 *
 * Throws an error listing the offending raw fetch occurrences if found.
 */
export function assertNoRawFetchInAdminScript(scriptContent: string, contextName: string): void {
  // Strip out the canonical definition of apiClient itself where window.fetch is wrapped
  const stripped = scriptContent.replace(
    /async\s+function\s+apiClient[\s\S]*?return\s+(?:window\.)?fetch\([^;]+;\s*\}/g,
    '/* apiClient implementation */'
  );

  // Match raw calls to fetch( or window.fetch(
  const rawFetchRegex = /(?:window\.)?fetch\s*\(/g;
  const matches = [...stripped.matchAll(rawFetchRegex)];

  if (matches.length > 0) {
    const lines = stripped.split('\n');
    const violations = lines.filter((line) => /(?:window\.)?fetch\s*\(/.test(line));
    throw new Error(
      `[RAW-FETCH-VIOLATION] Found ${matches.length} illegal raw fetch() call(s) in ${contextName}:\n` +
        violations.map((v) => `  > ${v.trim()}`).join('\n')
    );
  }
}

describe('Admin apiClient Conformance & Raw Fetch Prohibition (WP-1 Task 2, finding 20261020-UX-02 / P0-2)', () => {
  it('forbids raw fetch calls across all admin HTML views (/admin, /admin/login, /admin/setup)', async () => {
    const repo = new InMemoryPortfolioRepository();

    const pages = [
      { name: '/admin (workspace)', html: await renderAdminWorkspacePage(repo) },
      { name: '/admin/login', html: renderAdminLoginPage() },
      { name: '/admin/setup', html: renderAdminSetupPage() },
    ];

    for (const page of pages) {
      const scripts = extractInlineScripts(page.html);
      expect(scripts.length).toBeGreaterThan(0);

      for (let i = 0; i < scripts.length; i++) {
        // Assert every script passes raw fetch validation
        expect(() => {
          assertNoRawFetchInAdminScript(scripts[i], `${page.name} script #${i + 1}`);
        }).not.toThrow();

        // Assert every script has valid JavaScript syntax (no unescaped quotes or template syntax errors)
        expect(() => {
          new Function(scripts[i]);
        }).not.toThrow();
      }
    }
  });

  it('detects and rejects raw fetch calls in admin scripts when violated (negative detector test)', () => {
    const illegalScript = `
      (function() {
        const form = document.getElementById('test-form');
        form.addEventListener('submit', async function(e) {
          e.preventDefault();
          const res = await fetch('/api/entries', { method: 'POST' });
          const data = await res.json();
        });
      })();
    `;

    expect(() => {
      assertNoRawFetchInAdminScript(illegalScript, 'adversarial-raw-fetch-test');
    }).toThrow(/\[RAW-FETCH-VIOLATION\]/);
  });

  it('verifies ADMIN_API_CLIENT_SCRIPT binds window.apiClient and sets CSRF and Content-Type', () => {
    expect(ADMIN_API_CLIENT_SCRIPT).toContain('async function apiClient');
    expect(ADMIN_API_CLIENT_SCRIPT).toContain('window.apiClient = apiClient');
    expect(ADMIN_API_CLIENT_SCRIPT).toContain("sessionStorage.getItem('lp_csrf_token')");
    expect(ADMIN_API_CLIENT_SCRIPT).toContain("'X-CSRF-Token'");
    expect(ADMIN_API_CLIENT_SCRIPT).toContain("'Content-Type': 'application/json'");
  });

  it('renders distinct recovery messages for 401, 403, and 500 error responses in admin workspace', async () => {
    const repo = new InMemoryPortfolioRepository();
    const html = await renderAdminWorkspacePage(repo);

    // 401 Session expired recovery message with sign-in link
    expect(html).toContain('Your session has expired');
    expect(html).toContain('href="/admin/login"');

    // 403 CSRF failure recovery message
    expect(html).toContain('Security check failed (CSRF token invalid or missing)');

    // 500 Server error recovery message
    expect(html).toContain('Server error (HTTP');

    // Network error message
    expect(html).toContain('Network error connecting to server');
  });
});
