import { loadConfig } from '@living-portfolio/config';
import { CORE_CSS_FILENAME, DEFAULT_ACCENT_CSS_FILENAME } from '@living-portfolio/ui-core';
import {
  ADMIN_CSS_FILENAME,
  ADMIN_EDITOR_CSS_FILENAME,
  ADMIN_GALLERY_CSS_FILENAME,
} from '@living-portfolio/ui-admin';
import { escapeHtml } from '../lib/html.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../lib/admin-api-client.js';
import { renderButton, renderIcon, renderIconButton, renderIconSprite, renderPageHeader, type IconName } from '../primitives/index.js';
import { getSettingsModules } from '../settings/index.js';

export interface AdminShellOptions {
  nonce?: string;
  initialTheme?: 'light' | 'dark';
  answeringEnabled?: boolean;
  siteName?: string;
  legacyRecoveryUsed?: boolean;
  fullWidth?: boolean;
  authenticated?: boolean;
  template?: 'standard' | 'narrow' | 'editor';
}

export type LauncherGroupId = 'Write' | 'Respond' | 'Govern' | 'Configure';

export interface AdminNavDestination {
  id: string;
  group: LauncherGroupId;
  href: string;
  label: string;
  icon: IconName;
  order: number;
}

const LAUNCHER_REGISTRY = new Map<string, AdminNavDestination>();

/**
 * Register a destination in the admin launcher registry (D-LAYOUT #1).
 */
export function registerAdminDestination(dest: AdminNavDestination): void {
  LAUNCHER_REGISTRY.set(dest.id, dest);
}

/**
 * Return all registered launcher destinations sorted by order.
 */
export function getAdminDestinations(): AdminNavDestination[] {
  return Array.from(LAUNCHER_REGISTRY.values()).sort((a, b) => a.order - b.order);
}

const BUILTIN_DESTINATIONS: AdminNavDestination[] = [
  { id: 'today', group: 'Write', href: '/admin', label: 'Today', icon: 'sun', order: 1 },
  { id: 'entries', group: 'Write', href: '/admin/entries', label: 'Entries', icon: 'file-text', order: 2 },
  { id: 'import', group: 'Write', href: '/admin/import', label: 'Import', icon: 'upload', order: 3 },
  { id: 'inbox', group: 'Respond', href: '/admin/inbox', label: 'Inbox', icon: 'inbox', order: 4 },
  { id: 'audit', group: 'Govern', href: '/admin/audit', label: 'Answer rules', icon: 'shield', order: 5 },
  { id: 'status', group: 'Govern', href: '/admin/status', label: 'Status', icon: 'activity', order: 6 },
];
for (const d of BUILTIN_DESTINATIONS) {
  registerAdminDestination(d);
}

export interface PageTemplateOptions {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  tabsHtml?: string;
  bodyHtml: string;
  actionsHtml?: string;
  className?: string;
  template?: 'standard' | 'narrow' | 'editor';
}

/**
 * Unified page template (D-SYS #4): standard (720px), narrow (400px, login only), editor.
 */
export function renderPageTemplate(opts: PageTemplateOptions): string {
  const tmplClass = opts.template === 'narrow' ? 'lp-page-column-narrow' : '';
  const cls = ['lp-page-column', tmplClass, opts.className].filter(Boolean).join(' ');
  const headerHtml = renderPageHeader({
    title: opts.title,
    description: opts.description,
    backHref: opts.backHref,
    backLabel: opts.backLabel,
    actionHtml: opts.actionsHtml,
  });

  const bodyWithTabs = opts.tabsHtml
    ? `<div class="lp-stack lp-gap-related">${opts.tabsHtml}<div class="lp-page-sections">${opts.bodyHtml}</div></div>`
    : `<div class="lp-page-sections">${opts.bodyHtml}</div>`;

  return `<div class="${escapeHtml(cls)}">
  ${headerHtml}
  ${bodyWithTabs}
</div>`;
}

function renderShellThemeAndMenuScript(nonceAttr: string, includeAdminMenus: boolean): string {
  const adminMenuJs = includeAdminMenus
    ? `
    const bindPopover = (btnId, popId, focusItemsSelector) => {
      const btn = document.getElementById(btnId);
      const pop = document.getElementById(popId);
      if (!btn || !pop) return;
      const close = (returnFocus) => {
        if (pop.hasAttribute('hidden')) return;
        pop.setAttribute('hidden', '');
        btn.setAttribute('aria-expanded', 'false');
        if (returnFocus) btn.focus();
      };
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = !pop.hasAttribute('hidden');
        document.querySelectorAll('.lp-popover-menu, .lp-launcher-panel').forEach((el) => {
          if (el !== pop) el.setAttribute('hidden', '');
        });
        document.querySelectorAll('[aria-expanded="true"]').forEach((el) => {
          if (el !== btn) el.setAttribute('aria-expanded', 'false');
        });
        if (isOpen) {
          close(false);
        } else {
          pop.removeAttribute('hidden');
          btn.setAttribute('aria-expanded', 'true');
          if (focusItemsSelector) {
            const first = pop.querySelector(focusItemsSelector);
            if (first && typeof first.focus === 'function') first.focus();
          }
        }
      });
      document.addEventListener('click', (e) => {
        if (!pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) close(false);
      });
      document.addEventListener('keydown', (e) => {
        if (pop.hasAttribute('hidden')) return;
        if (e.key === 'Escape') {
          e.preventDefault();
          close(true);
          return;
        }
        if (focusItemsSelector && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
          const items = Array.from(pop.querySelectorAll(focusItemsSelector));
          if (!items.length) return;
          e.preventDefault();
          const idx = items.indexOf(document.activeElement);
          const next = e.key === 'ArrowDown'
            ? (idx + 1) % items.length
            : (idx - 1 + items.length) % items.length;
          items[next].focus();
        }
      });
    };
    bindPopover('lp-launcher-btn', 'lp-launcher-panel', 'a.lp-launcher-item');
    bindPopover('lp-status-popover-btn', 'lp-status-popover', null);
    bindPopover('lp-account-menu-btn', 'lp-account-menu', '[role="menuitem"]');

    const logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          ${ADMIN_API_CLIENT_SCRIPT}
          await apiClient('/api/auth/logout', { method: 'POST' });
        } catch {}
        window.location.href = '/admin/login';
      });
    }
    const statusAnsweringBtn = document.getElementById('lp-status-answering-toggle');
    if (statusAnsweringBtn) {
      statusAnsweringBtn.addEventListener('click', async () => {
        const isEnabled = statusAnsweringBtn.getAttribute('data-enabled') === 'true';
        if (isEnabled && !window.confirm('Pause automated answering on the public site?')) return;
        try {
          ${ADMIN_API_CLIENT_SCRIPT}
          await apiClient('/api/settings/routing', {
            method: 'PATCH',
            body: JSON.stringify({ automatedAnsweringEnabled: !isEnabled }),
          });
          window.location.reload();
        } catch {}
      });
    }
    const statusRebuildBtn = document.getElementById('lp-status-rebuild-btn');
    if (statusRebuildBtn) {
      statusRebuildBtn.addEventListener('click', async () => {
        statusRebuildBtn.setAttribute('disabled', '');
        statusRebuildBtn.textContent = 'Rebuilding…';
        try {
          ${ADMIN_API_CLIENT_SCRIPT}
          await apiClient('/api/settings/backups/export', { method: 'GET' });
        } catch {}
        statusRebuildBtn.removeAttribute('disabled');
        statusRebuildBtn.textContent = 'Rebuild site';
      });
    }`
    : '';

  return `<script${nonceAttr}>
  (function() {
    const html = document.documentElement;
    const saved = (function(){ try { return localStorage.getItem('strata-theme'); } catch { return null; } })();
    const initial = saved === 'dark' || (!saved && html.getAttribute('data-theme') === 'dark') ? 'dark' : 'light';
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
      const labelEl = themeBtn.querySelector('[data-theme-label]');
      if (labelEl) labelEl.textContent = label;
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
 * Single Admin Shell (D-SYS #8, #9, #10):
 * One top bar and page frame for every admin page including editor, login, and setup.
 * Left: launcher icon button (authenticated only) + fixed text "Admin".
 * Right: theme toggle icon button + account icon button (authenticated only).
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
  const isAuth = options?.authenticated !== false;
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

  const groupOrder: LauncherGroupId[] = ['Write', 'Respond', 'Govern', 'Configure'];
  const settingsDests: AdminNavDestination[] = getSettingsModules().map((mod) => ({
    id: `settings-${mod.id}`,
    group: 'Configure',
    href: mod.route,
    label: mod.title,
    icon: (mod.icon as IconName) || 'sliders',
    order: 10 + mod.order,
  }));
  const allDests = [...getAdminDestinations().filter((d) => d.group !== 'Configure'), ...settingsDests];
  const launcherGroupsHtml = groupOrder
    .map((group) => {
      const items = allDests.filter((d) => d.group === group);
      if (!items.length) return '';
      const linksHtml = items
        .map((link) => {
          const isCurrent =
            link.href === '/admin'
              ? activePath === '/admin' || activePath === '/admin/today'
              : activePath === link.href || activePath.startsWith(`${link.href}/`);
          return `<a href="${escapeHtml(link.href)}" class="lp-launcher-item${isCurrent ? ' is-current' : ''}"${isCurrent ? ' aria-current="page"' : ''}>${renderIcon({ name: link.icon, size: 16 })}<span>${escapeHtml(link.label)}</span></a>`;
        })
        .join('');
      return `<div class="lp-launcher-group">
  <div class="lp-launcher-heading">${escapeHtml(group)}</div>
  ${linksHtml}
</div>`;
    })
    .filter(Boolean)
    .join('');

  const mainClass =
    options?.fullWidth || options?.template === 'editor'
      ? 'lp-admin-shell-main lp-admin-shell-main-full'
      : 'lp-admin-shell-main';

  const launcherHtml = isAuth
    ? `<div class="lp-menu-wrap">
        ${renderIconButton({
          id: 'lp-launcher-btn',
          ariaLabel: 'Open navigation',
          title: 'Open navigation',
          icon: 'grid',
          iconSize: 20,
          dataAttrs: { 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': 'lp-launcher-panel' },
        })}
        <nav id="lp-launcher-panel" class="lp-launcher-panel" aria-label="Admin navigation" hidden>
          ${launcherGroupsHtml}
          <div class="lp-launcher-footer">
            <a href="/home" class="lp-launcher-item">${renderIcon({ name: 'external-link', size: 16 })}<span>View public site</span></a>
          </div>
        </nav>
      </div>`
    : '';

  const brandHtml = isAuth
    ? `<a href="/admin" class="lp-admin-header-brand">Admin</a>`
    : `<span class="lp-admin-header-brand">Admin</span>`;

  const accountHtml = isAuth
    ? `<div class="lp-menu-wrap">
        ${renderIconButton({
          id: 'lp-account-menu-btn',
          ariaLabel: 'Account',
          title: 'Account',
          icon: 'user',
          iconSize: 20,
          dataAttrs: { 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-controls': 'lp-account-menu' },
        })}
        <div id="lp-account-menu" class="lp-popover-menu lp-menu-popover-float" role="menu" aria-label="Account menu" hidden>
          <div class="lp-menu-header" role="presentation">Owner</div>
          <button type="button" role="menuitem" id="btn-admin-logout" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item">Sign out</button>
        </div>
      </div>`
    : '';

  const isEditorRoute =
    options?.template === 'editor' ||
    activePath === '/admin/entries/new' ||
    activePath === '/admin/entries/editor' ||
    /^\/admin\/entries\/[^/]+$/.test(activePath) ||
    activePath.startsWith('/admin/dev/');
  const isGalleryRoute = activePath.startsWith('/admin/dev/');
  const routeCssLinks = [
    `<link rel="stylesheet" href="/assets/css/${CORE_CSS_FILENAME}" />`,
    `<link rel="stylesheet" href="/assets/css/${ADMIN_CSS_FILENAME}" />`,
    isEditorRoute ? `<link rel="stylesheet" href="/assets/css/${ADMIN_EDITOR_CSS_FILENAME}" />` : '',
    isGalleryRoute ? `<link rel="stylesheet" href="/assets/css/${ADMIN_GALLERY_CSS_FILENAME}" />` : '',
    `<link rel="stylesheet" href="/assets/css/${DEFAULT_ACCENT_CSS_FILENAME}" />`,
  ]
    .filter(Boolean)
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — ${escapeHtml(siteName)}</title>
  ${routeCssLinks}
</head>
<body class="lp-admin-body">
  ${renderIconSprite()}
  ${stagingBanner}
  <a href="#main-content" class="skip-link">Skip to main content</a>
  <header class="lp-admin-header" role="banner" data-shell-topbar="true">
    <div class="lp-admin-header-start">
      ${launcherHtml}
      ${brandHtml}
    </div>
    <div class="lp-admin-header-actions">
      ${renderIconButton({
        id: 'theme-toggle',
        ariaLabel: toggleLabel,
        title: toggleLabel,
        icon: toggleIcon,
        iconSize: 20,
        className: 'lp-icon-toggle',
        dataAttrs: { 'aria-pressed': theme === 'dark' ? 'true' : 'false' },
      })}
      ${accountHtml}
    </div>
  </header>
  <main id="main-content" class="${mainClass}">
    ${options?.legacyRecoveryUsed ? '<div id="admin-legacy-recovery-notice" class="lp-notice lp-notice-warn"><span>You signed in with an older recovery code. Replace your recovery codes in <a href="/admin/settings/account">Settings &gt; Account</a> as soon as you can.</span></div>' : ''}
    ${safeContent}
  </main>
  ${renderShellThemeAndMenuScript(nonceAttr, isAuth)}
</body>
</html>`;
}
