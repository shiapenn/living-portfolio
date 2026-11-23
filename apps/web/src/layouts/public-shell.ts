import { loadConfig } from "@living-portfolio/config";
import { STRATA_DESIGN_SYSTEM_CSS } from "../styles.js";
import { escapeHtml, sanitizeHttpUrl } from "../lib/html.js";

export interface RenderLayoutOptions {
  nonce?: string;
  headSlot?: string;
  headerSlot?: string;
  footerSlot?: string;
  clientScript?: string;
}

export function renderLayout(
  title: string,
  activePath: string,
  mainContentHtml: string,
  options?: RenderLayoutOptions
): string {
  const cfg = loadConfig();
  const navItems = [
    { href: '/work', label: 'Work' },
    { href: '/writing', label: 'Writing' },
    { href: '/build', label: 'Build' },
    { href: '/timeline', label: 'Timeline' },
    { href: '/ask', label: 'Ask' },
  ];

  const navHtml = navItems
    .map(
      (item) =>
        `<a href="${item.href}"${activePath === item.href || (item.href !== '/' && activePath.startsWith(item.href)) ? ' aria-current="page"' : ''}>${item.label}</a>`
    )
    .join('\n          ');

  const safeLogoUrl = sanitizeHttpUrl(cfg.PUBLIC_SITE_LOGO_URL);
  const brandHtml = safeLogoUrl
    ? `<img src="${escapeHtml(safeLogoUrl)}" alt="${escapeHtml(cfg.PUBLIC_OWNER_NAME)}" style="height:var(--lp-size-icon-lg);vertical-align:middle;margin-right:var(--lp-space-inline-icon-text)" />${escapeHtml(cfg.PUBLIC_OWNER_NAME)}`
    : escapeHtml(cfg.PUBLIC_OWNER_NAME);

  const stagingBannerHtml =
    cfg.DEPLOYMENT_CLASS === 'staging'
      ? `<div class="as-of-banner" data-banner="staging-synthetic-only" role="status" style="position:sticky;top:0;z-index:var(--lp-z-modal);margin:0;border-radius:0;justify-content:center;background:var(--surface-raised);border-bottom:var(--lp-border-focus) solid var(--lp-color-passage-friction)"><strong>Staging: synthetic data only.</strong></div>`
      : '';

  const robotsMetaHtml =
    cfg.DEPLOYMENT_CLASS === 'staging'
      ? '  <meta name="robots" content="noindex, nofollow" />\n'
      : '';

  const unofficialForkSlotHtml = cfg.PUBLIC_UNOFFICIAL_FORK_NOTICE
    ? `<div class="unofficial-fork-slot" data-slot="unofficial-fork-notice" style="margin-top:var(--lp-space-stack-sub-compact);font-size:var(--lp-font-size-13);color:var(--text-muted)">${escapeHtml(cfg.PUBLIC_UNOFFICIAL_FORK_NOTICE)}</div>`
    : '';

  const nonceAttr = options?.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : '';

  // Inject nonce into any <script> tags inside mainContentHtml if specified
  let safeMainContent = mainContentHtml;
  if (options?.nonce) {
    safeMainContent = safeMainContent.replace(
      /<script\b(?![^>]*\bnonce=)([^>]*)>/gi,
      `<script nonce="${escapeHtml(options.nonce)}"$1>`
    );
  }

  const headSlotHtml = options?.headSlot ? `  ${options.headSlot}\n` : '';
  const headerSlotHtml = options?.headerSlot ? `    ${options.headerSlot}\n` : '';
  const footerSlotHtml = options?.footerSlot ? `    ${options.footerSlot}\n` : '';

  const isAdmin = activePath.startsWith('/admin') && activePath !== '/admin/login' && activePath !== '/admin/setup';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
${robotsMetaHtml}${headSlotHtml}  <title>${escapeHtml(title)} — ${escapeHtml(cfg.PUBLIC_SITE_NAME)}</title>
  <style${nonceAttr}>${STRATA_DESIGN_SYSTEM_CSS}</style>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  ${stagingBannerHtml}
  <header class="site-header">
${headerSlotHtml}    <nav class="site-nav" aria-label="Primary navigation">
      <a href="/" class="site-brand"${activePath === '/' ? ' aria-current="page"' : ''}>${brandHtml}</a>
      <div class="nav-links">
        ${navHtml}
        ${isAdmin ? `<button type="button" class="btn btn-secondary" id="btn-admin-logout" style="font-size:var(--lp-font-size-12);padding:var(--lp-space-inset-track) var(--lp-space-inset-control-sm);margin-left:var(--lp-space-inline-icon-text);cursor:pointer">Sign out</button>` : ''}
        <button type="button" class="theme-toggle-btn" id="theme-toggle" aria-pressed="false" style="min-height:var(--lp-size-hit-area)"><span aria-hidden="true">◐</span> <span class="theme-label">Dark theme</span></button>
      </div>
    </nav>
  </header>
  <main class="site-main" id="main-content">
    ${safeMainContent}
  </main>
  <footer class="site-footer" style="max-width:var(--lp-size-layout-max);margin:var(--lp-space-stack-block) auto var(--lp-space-stack-group);padding:var(--lp-space-inset-section) var(--lp-space-inset-dialog);border-top:var(--lp-border-hairline) solid var(--rule);font-size:var(--lp-font-size-14);color:var(--text-muted)">
${footerSlotHtml}    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--lp-space-stack-snug);margin-bottom:var(--lp-space-stack-snug)">
      <nav aria-label="Secondary navigation" style="display:flex;gap:var(--lp-space-stack-field-to-field);flex-wrap:wrap">
        <a href="/about">About</a>
        <a href="/now">Now</a>
        <a href="/uses">Uses</a>
        <a href="/book">Book</a>
        <a href="/rss.xml">RSS</a>
      </nav>
      <div>${escapeHtml(cfg.PUBLIC_SITE_FOOTER_TEXT)}</div>
    </div>
    ${unofficialForkSlotHtml}
  </footer>
  <script${nonceAttr}>
    (function() {
      const logoutBtn = document.getElementById('btn-admin-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
          try {
            if (typeof window.apiClient === 'function') {
              await window.apiClient('/api/auth/logout', { method: 'POST' });
            }
          } catch (_) {}
          try {
            sessionStorage.removeItem('lp_csrf_token');
            sessionStorage.removeItem('lp_legacy_recovery_used');
          } catch (_) {}
          window.location.href = '/admin/login';
        });
      }

      const btn = document.getElementById('theme-toggle');
      function getStoredTheme() {
        try {
          const saved = localStorage.getItem('strata-theme');
          if (saved === 'dark' || saved === 'light') return saved;
        } catch (_) {}
        return null;
      }
      function getSystemTheme() {
        try {
          if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
          }
        } catch (_) {}
        return 'light';
      }
      function updateThemeUI(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        if (btn) {
          const isDark = theme === 'dark';
          btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
          btn.innerHTML = isDark
            ? '<span aria-hidden="true">☀</span> <span class="theme-label">Light theme</span>'
            : '<span aria-hidden="true">◐</span> <span class="theme-label">Dark theme</span>';
        }
      }
      let currentTheme = getStoredTheme() || getSystemTheme();
      updateThemeUI(currentTheme);
      if (btn) {
        btn.addEventListener('click', function() {
          currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
          updateThemeUI(currentTheme);
          try { localStorage.setItem('strata-theme', currentTheme); } catch (_) {}
        });
      }
    })();
  </script>
${options?.clientScript ? `  <script type="module" src="${escapeHtml(options.clientScript)}"${nonceAttr}></script>\n` : ''}</body>
</html>`;
}
