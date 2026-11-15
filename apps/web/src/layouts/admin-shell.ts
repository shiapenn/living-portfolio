import { loadConfig } from '@living-portfolio/config';
import { STRATA_DESIGN_SYSTEM_CSS } from '../styles.js';
import { escapeHtml } from '../lib/html.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../lib/admin-api-client.js';
import { renderIcon, renderIconButton, renderIconSprite } from '../primitives/index.js';

export interface AdminShellOptions {
  nonce?: string;
  initialTheme?: 'light' | 'dark';
  answeringEnabled?: boolean;
  siteName?: string;
  legacyRecoveryUsed?: boolean;
}

interface RailLink {
  href: string;
  label: string;
}

interface RailGroup {
  heading: string;
  links: RailLink[];
}

const RAIL_GROUPS: RailGroup[] = [
  {
    heading: 'Write',
    links: [
      { href: '/admin', label: 'Today' },
      { href: '/admin/entries', label: 'Entries' },
      { href: '/admin/import', label: 'Import' },
      { href: '/admin/quick-log', label: 'Quick Log' },
      { href: '/admin/pages', label: 'Pages' },
    ],
  },
  {
    heading: 'Respond',
    links: [
      { href: '/admin/inbox', label: 'Inbox' },
      { href: '/admin/bookings', label: 'Bookings' },
    ],
  },
  {
    heading: 'Govern',
    links: [
      { href: '/admin/audit', label: 'Audit' },
      { href: '/admin/calibration', label: 'Calibration' },
      { href: '/admin/structure', label: 'Structure' },
    ],
  },
  {
    heading: 'Configure',
    links: [
      { href: '/admin/routing', label: 'Answering' },
      { href: '/admin/theme', label: 'Theme' },
      { href: '/admin/settings', label: 'Settings' },
    ],
  },
];

function renderShellThemeAndMenuScript(nonceAttr: string, includeAdminMenus: boolean): string {
  const adminMenuJs = includeAdminMenus
    ? `
    const bindPopover = (btnId, popId) => {
      const btn = document.getElementById(btnId);
      const pop = document.getElementById(popId);
      if (!btn || !pop) return;
      const close = () => { pop.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); };
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = !pop.hasAttribute('hidden');
        if (open) close();
        else { pop.removeAttribute('hidden'); btn.setAttribute('aria-expanded', 'true'); }
      });
      document.addEventListener('click', (e) => {
        if (!pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) close();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !pop.hasAttribute('hidden')) { close(); btn.focus(); }
      });
    };
    bindPopover('lp-status-popover-btn', 'lp-status-popover');
    bindPopover('lp-account-menu-btn', 'lp-account-menu');
    const railToggle = document.getElementById('lp-rail-toggle');
    const railEl = document.getElementById('lp-admin-rail');
    if (railToggle && railEl) {
      railToggle.addEventListener('click', () => {
        const isOpen = railEl.classList.toggle('is-open');
        railToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }
    const logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          ${ADMIN_API_CLIENT_SCRIPT}
          await apiClient('/api/auth/logout', { method: 'POST' });
        } catch {}
        window.location.href = '/admin/login';
      });
    }`
    : '';

  return `<script${nonceAttr}>
  (function() {
    const html = document.documentElement;
    const saved = (function(){ try { return localStorage.getItem('strata-theme'); } catch { return null; } })();
    const initial = saved === 'dark' ? 'dark' : 'light';
    html.setAttribute('data-theme', initial);
    const themeBtn = document.getElementById('theme-toggle');
    const syncThemeBtn = (t) => {
      if (!themeBtn) return;
      const label = t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
      const icon = t === 'dark' ? 'sun' : 'moon';
      themeBtn.setAttribute('aria-label', label);
      themeBtn.setAttribute('title', label);
      themeBtn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      const useEl = themeBtn.querySelector('use');
      if (useEl) useEl.setAttribute('href', '#lp-icon-' + icon);
    };
    syncThemeBtn(initial);
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        syncThemeBtn(next);
        try { localStorage.setItem('strata-theme', next); } catch {}
      });
    }${adminMenuJs}
  })();
  </script>`;
}

/**
 * Minimal authentication shell for /admin/setup and /admin/login:
 * brand and SVG theme toggle icon only; no public nav, no footer, no admin rail.
 */
export function renderAuthShell(
  title: string,
  contentHtml: string,
  options?: AdminShellOptions
): string {
  const cfg = loadConfig();
  const siteName = options?.siteName || cfg.PUBLIC_SITE_NAME || 'Living Portfolio';
  const theme = options?.initialTheme === 'dark' ? 'dark' : 'light';
  const nonceAttr = options?.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : '';
  const toggleIcon = theme === 'dark' ? 'sun' : 'moon';
  const toggleLabel = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  const stagingBanner =
    cfg.DEPLOYMENT_CLASS === 'staging'
      ? `<div class="lp-staging-banner" data-banner="staging-synthetic-only" role="note"><strong>Staging: synthetic data only.</strong></div>`
      : '';

  let safeContent = contentHtml;
  if (options?.nonce) {
    safeContent = safeContent.replace(
      /<script\b(?![^>]*\bnonce=)([^>]*)>/gi,
      `<script nonce="${escapeHtml(options.nonce)}"$1>`
    );
  }

  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — ${escapeHtml(siteName)}</title>
  <style${nonceAttr}>${STRATA_DESIGN_SYSTEM_CSS}</style>
</head>
<body class="lp-admin-body">
  ${renderIconSprite()}
  ${stagingBanner}
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header class="lp-admin-header" role="banner">
    <a href="/admin" class="lp-admin-header-brand">Living Portfolio Admin</a>
    <div class="lp-admin-header-actions">
      ${renderIconButton({
        id: 'theme-toggle',
        ariaLabel: toggleLabel,
        title: toggleLabel,
        icon: toggleIcon,
        iconSize: 20,
        variant: 'secondary',
        dataAttrs: { 'aria-pressed': theme === 'dark' ? 'true' : 'false' },
      })}
    </div>
  </header>
  <main id="main-content" class="lp-auth-shell-main">
    ${safeContent}
  </main>
  ${renderShellThemeAndMenuScript(nonceAttr, false)}
</body>
</html>`;
}

/**
 * Full admin shell with top bar (brand, site status popover with legend, theme icon, account menu with Sign out),
 * collapsible navigation rail (Write, Respond, Govern, Configure), and skip link.
 */
export function renderAdminShell(
  title: string,
  activePath: string,
  contentHtml: string,
  options?: AdminShellOptions
): string {
  const cfg = loadConfig();
  const siteName = options?.siteName || cfg.PUBLIC_SITE_NAME || 'Living Portfolio';
  const theme = options?.initialTheme === 'dark' ? 'dark' : 'light';
  const answeringOn = options?.answeringEnabled ?? true;
  const nonceAttr = options?.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : '';
  const toggleIcon = theme === 'dark' ? 'sun' : 'moon';
  const toggleLabel = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  const stagingBanner =
    cfg.DEPLOYMENT_CLASS === 'staging'
      ? `<div class="lp-staging-banner" data-banner="staging-synthetic-only" role="note"><strong>Staging: synthetic data only.</strong></div>`
      : '';

  let safeContent = contentHtml;
  if (options?.nonce) {
    safeContent = safeContent.replace(
      /<script\b(?![^>]*\bnonce=)([^>]*)>/gi,
      `<script nonce="${escapeHtml(options.nonce)}"$1>`
    );
  }

  const railHtml = RAIL_GROUPS.map((group) => {
    const items = group.links
      .map((link) => {
        const isCurrent =
          link.href === '/admin'
            ? activePath === '/admin' || activePath === '/admin/today'
            : activePath === link.href || activePath.startsWith(`${link.href}/`);
        return `<a href="${link.href}" class="lp-admin-rail-link${isCurrent ? ' lp-admin-rail-link-active' : ''}"${isCurrent ? ' aria-current="page"' : ''}>${escapeHtml(link.label)}</a>`;
      })
      .join('');
    return `<div class="lp-admin-rail-group">
  <div class="lp-admin-rail-heading">${escapeHtml(group.heading)}</div>
  ${items}
</div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — ${escapeHtml(siteName)}</title>
  <style${nonceAttr}>${STRATA_DESIGN_SYSTEM_CSS}</style>
</head>
<body class="lp-admin-body">
  ${renderIconSprite()}
  ${stagingBanner}
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header class="lp-admin-header" role="banner">
    <div class="lp-admin-header-start">
      ${renderIconButton({
        id: 'lp-rail-toggle',
        ariaLabel: 'Toggle workspace navigation',
        title: 'Toggle workspace navigation',
        icon: 'menu',
        iconSize: 20,
        variant: 'secondary',
        className: 'lp-admin-header-mobile-only',
        dataAttrs: { 'aria-expanded': 'false', 'aria-controls': 'lp-admin-rail' },
      })}
      <a href="/admin" class="lp-admin-header-brand">Living Portfolio Admin</a>
    </div>
    <div class="lp-admin-header-actions">
      <div class="lp-menu-wrap">
        <button type="button" id="lp-status-popover-btn" class="lp-btn lp-btn-secondary lp-btn-sm" aria-label="Site status" aria-haspopup="true" aria-expanded="false" aria-controls="lp-status-popover">
          <span class="lp-status-dot lp-status-dot-ok" aria-hidden="true"></span>
          <span class="lp-admin-header-desktop-only">Site status</span>
          ${renderIcon({ name: 'chevron-down', size: 16 })}
        </button>
        <div id="lp-status-popover" class="lp-popover-menu lp-status-popover" hidden>
          <p class="lp-status-legend-row"><span class="lp-status-dot lp-status-dot-ok" aria-hidden="true"></span><span><strong>Site build:</strong> Idle (ready)</span></p>
          <p class="lp-status-legend-row"><span class="lp-status-dot ${answeringOn ? 'lp-status-dot-ok' : 'lp-status-dot-warn'}" aria-hidden="true"></span><span><strong>Automatic answers:</strong> ${answeringOn ? 'On' : 'Off'} — <a href="/admin/routing">Settings › Answering</a></span></p>
          <p class="lp-status-legend-row"><span class="lp-status-dot lp-status-dot-ok" aria-hidden="true"></span><span><strong>System:</strong> Operational</span></p>
        </div>
      </div>
      ${renderIconButton({
        id: 'theme-toggle',
        ariaLabel: toggleLabel,
        title: toggleLabel,
        icon: toggleIcon,
        iconSize: 20,
        variant: 'secondary',
        dataAttrs: { 'aria-pressed': theme === 'dark' ? 'true' : 'false' },
      })}
      <div class="lp-menu-wrap">
        <button type="button" id="lp-account-menu-btn" class="lp-btn lp-btn-secondary lp-btn-sm" aria-haspopup="menu" aria-expanded="false" aria-controls="lp-account-menu">
          <span>Account</span>
          ${renderIcon({ name: 'chevron-down', size: 16 })}
        </button>
        <div id="lp-account-menu" class="lp-popover-menu lp-menu-popover-float" role="menu" aria-label="Account menu" hidden>
          <a href="/admin/settings/account" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item">Account settings</a>
          <a href="/home" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item">View public site</a>
          <hr class="lp-menu-separator" role="separator" />
          <button type="button" role="menuitem" id="btn-admin-logout" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item">Sign out</button>
        </div>
      </div>
    </div>
  </header>
  <div class="lp-admin-shell-body">
    <nav id="lp-admin-rail" class="lp-admin-rail" aria-label="Admin navigation">
      ${railHtml}
      <div class="lp-admin-rail-footer">
        <a href="/home" class="lp-admin-rail-link">View public site</a>
      </div>
    </nav>
    <main id="main-content" class="lp-admin-shell-main">
      ${options?.legacyRecoveryUsed ? '<div id="admin-legacy-recovery-notice" class="lp-notice lp-notice-warn"><span>You signed in with an older recovery code. Replace your recovery codes in <a href="/admin/settings/account">Settings &gt; Account</a> as soon as you can.</span></div>' : ''}
      ${safeContent}
    </main>
  </div>
  ${renderShellThemeAndMenuScript(nonceAttr, true)}
</body>
</html>`;
}
