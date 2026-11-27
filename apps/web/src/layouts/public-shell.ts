import { loadConfig } from "@living-portfolio/config";
import {
  CORE_CSS_FILENAME,
  DEFAULT_ACCENT_CSS_FILENAME,
  PUBLIC_FONT_PRELOAD_HTML,
} from "@living-portfolio/ui-core";
import { PUBLIC_CSS_FILENAME } from "@living-portfolio/ui-public";
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
    ? `<img src="${escapeHtml(safeLogoUrl)}" alt="${escapeHtml(cfg.PUBLIC_OWNER_NAME)}" width="24" height="24" class="pub-brand-logo" />${escapeHtml(cfg.PUBLIC_OWNER_NAME)}`
    : escapeHtml(cfg.PUBLIC_OWNER_NAME);

  const stagingBannerHtml =
    cfg.DEPLOYMENT_CLASS === 'staging'
      ? `<div class="as-of-banner pub-staging-banner" data-banner="staging-synthetic-only" role="status"><strong>Staging: synthetic data only.</strong></div>`
      : '';

  const robotsMetaHtml =
    cfg.DEPLOYMENT_CLASS === 'staging'
      ? '  <meta name="robots" content="noindex, nofollow" />\n'
      : '';

  const unofficialForkSlotHtml = cfg.PUBLIC_UNOFFICIAL_FORK_NOTICE
    ? `<div class="unofficial-fork-slot pub-fork-notice" data-slot="unofficial-fork-notice">${escapeHtml(cfg.PUBLIC_UNOFFICIAL_FORK_NOTICE)}</div>`
    : '';

  const nonceAttr = options?.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : '';

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
<html lang="en" data-lang="public">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
${robotsMetaHtml}${headSlotHtml}  <title>${escapeHtml(title)} — ${escapeHtml(cfg.PUBLIC_SITE_NAME)}</title>
  ${PUBLIC_FONT_PRELOAD_HTML}
  <link rel="stylesheet" href="/assets/css/${CORE_CSS_FILENAME}" />
  <link rel="stylesheet" href="/assets/css/${PUBLIC_CSS_FILENAME}" />
  <link rel="stylesheet" href="/assets/css/${DEFAULT_ACCENT_CSS_FILENAME}" />
${options?.nonce ? `  <style${nonceAttr}>/* public-pack-csp-nonce */</style>\n` : ''}</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  ${stagingBannerHtml}
  <header class="site-header">
${headerSlotHtml}    <nav class="site-nav" aria-label="Primary navigation">
      <a href="/" class="site-brand"${activePath === '/' ? ' aria-current="page"' : ''}>${brandHtml}</a>
      <div class="nav-links">
        ${navHtml}
        ${isAdmin ? `<button type="button" class="btn btn-secondary" id="btn-admin-logout">Sign out</button>` : ''}
        <button type="button" class="theme-toggle-btn" id="theme-toggle" aria-pressed="false"><span aria-hidden="true">◐</span> <span class="theme-label">Dark theme</span></button>
      </div>
    </nav>
  </header>
  <main class="site-main pub-main" id="main-content">
    ${safeMainContent}
  </main>
  <footer class="site-footer pub-footer">
${footerSlotHtml}    <div class="pub-footer-row">
      <nav aria-label="Secondary navigation" class="pub-footer-nav">
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

      document.addEventListener('click', function(ev) {
        const target = ev.target && ev.target.closest ? ev.target.closest('.pub-embed-load-btn') : null;
        if (!target) return;
        const gate = target.closest('.pub-embed-gate');
        if (!gate || gate.getAttribute('data-embed-state') === 'loaded') return;
        const src = gate.getAttribute('data-embed-src');
        const label = gate.getAttribute('data-embed-title') || 'Embedded video';
        if (!src) return;
        const iframe = document.createElement('iframe');
        iframe.className = 'pub-embed-frame';
        iframe.setAttribute('src', src);
        iframe.setAttribute('title', label);
        iframe.setAttribute('referrerpolicy', 'no-referrer');
        iframe.setAttribute('allow', 'fullscreen');
        iframe.setAttribute('allowfullscreen', '');
        gate.innerHTML = '';
        gate.setAttribute('data-embed-state', 'loaded');
        gate.appendChild(iframe);
      });
    })();
  </script>
${options?.clientScript ? `  <script type="module" src="${escapeHtml(options.clientScript)}"${nonceAttr}></script>\n` : ''}</body>
</html>`;
}
