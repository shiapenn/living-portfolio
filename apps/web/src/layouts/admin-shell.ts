import { loadConfig } from '@living-portfolio/config';
import { STRATA_DESIGN_SYSTEM_CSS } from '../styles.js';
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
}

/**
 * Unified 720px centred page template for every non-editor admin page (D-LAYOUT #2, D-COMP #2).
 */
export function renderPageTemplate(opts: PageTemplateOptions): string {
  const cls = ['lp-page-column', opts.className].filter(Boolean).join(' ');
  const headerHtml = renderPageHeader({
    title: opts.title,
    description: opts.description,
    backHref: opts.backHref,
    backLabel: opts.backLabel,
    actionHtml: opts.actionsHtml,
  });

  return `<div class="${escapeHtml(cls)}">
  ${headerHtml}
  ${opts.tabsHtml ? opts.tabsHtml : ''}
  <div class="lp-page-sections">
    ${opts.bodyHtml}
  </div>
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
 * Minimal authentication shell for /admin/setup and /admin/login:
 * brand and SVG theme toggle icon only; no public nav, no footer, no cards.
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
    <a href="/admin" class="lp-admin-header-brand">${escapeHtml(siteName)}</a>
    <div class="lp-admin-header-actions">
      ${renderIconButton({
        id: 'theme-toggle',
        ariaLabel: toggleLabel,
        title: toggleLabel,
        icon: toggleIcon,
        iconSize: 20,
        variant: 'quiet',
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
 * Top-bar-only admin shell (D-LAYOUT #1):
 * 48px top bar with hairline below, no sidebar anywhere.
 * Left: launcher grid icon button (36x36) + product name.
 * Right: site status dot icon button + account user icon button.
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

  const mainClass = options?.fullWidth ? 'lp-admin-shell-main lp-admin-shell-main-full' : 'lp-admin-shell-main';

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
      <div class="lp-menu-wrap">
        ${renderIconButton({
          id: 'lp-launcher-btn',
          ariaLabel: 'Open navigation',
          title: 'Open navigation',
          icon: 'grid',
          iconSize: 20,
          variant: 'quiet',
          dataAttrs: { 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': 'lp-launcher-panel' },
        })}
        <nav id="lp-launcher-panel" class="lp-launcher-panel" aria-label="Admin navigation" hidden>
          ${launcherGroupsHtml}
          <div class="lp-launcher-footer">
            <a href="/home" class="lp-launcher-item">${renderIcon({ name: 'external-link', size: 16 })}<span>View public site</span></a>
          </div>
        </nav>
      </div>
      <a href="/admin" class="lp-admin-header-brand">${escapeHtml(siteName)}</a>
    </div>
    <div class="lp-admin-header-actions">
      <div class="lp-menu-wrap">
        <button type="button" id="lp-status-popover-btn" class="lp-icon-btn lp-icon-btn-quiet" aria-label="Site status" title="Site status" aria-haspopup="true" aria-expanded="false" aria-controls="lp-status-popover">
          <span class="lp-status-dot ${answeringOn ? 'lp-status-dot-ok' : 'lp-status-dot-warn'}" aria-hidden="true"></span>
        </button>
        <div id="lp-status-popover" class="lp-popover-menu lp-status-popover" role="dialog" aria-label="Site status" hidden>
          <p class="lp-status-legend-row"><span class="lp-status-dot lp-status-dot-ok" aria-hidden="true"></span><span><strong>Site build:</strong> Idle (ready)</span></p>
          <p class="lp-status-legend-row"><span class="lp-status-dot ${answeringOn ? 'lp-status-dot-ok' : 'lp-status-dot-warn'}" aria-hidden="true"></span><span><strong>Automated answering:</strong> ${answeringOn ? 'Active' : 'Paused'}</span></p>
          <div class="lp-status-popover-actions">
            ${renderButton({
              id: 'lp-status-answering-toggle',
              label: answeringOn ? 'Pause answering' : 'Resume answering',
              variant: 'secondary',
              size: 'sm',
              dataAttrs: { enabled: answeringOn ? 'true' : 'false' },
            })}
            ${renderButton({
              id: 'lp-status-rebuild-btn',
              label: 'Rebuild site',
              variant: 'quiet',
              size: 'sm',
            })}
          </div>
        </div>
      </div>
      <div class="lp-menu-wrap">
        ${renderIconButton({
          id: 'lp-account-menu-btn',
          ariaLabel: 'Account',
          title: 'Account',
          icon: 'user',
          iconSize: 20,
          variant: 'quiet',
          dataAttrs: { 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-controls': 'lp-account-menu' },
        })}
        <div id="lp-account-menu" class="lp-popover-menu lp-menu-popover-float" role="menu" aria-label="Account menu" hidden>
          <div class="lp-menu-header" role="presentation">Owner</div>
          <button type="button" id="theme-toggle" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item" aria-label="${escapeHtml(toggleLabel)}" aria-pressed="${theme === 'dark' ? 'true' : 'false'}">${renderIcon({ name: toggleIcon, size: 16 })}<span data-theme-label="true">${escapeHtml(toggleLabel)}</span></button>
          <hr class="lp-menu-separator" role="separator" />
          <button type="button" role="menuitem" id="btn-admin-logout" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item">Sign out</button>
        </div>
      </div>
    </div>
  </header>
  <main id="main-content" class="${mainClass}">
    ${options?.legacyRecoveryUsed ? '<div id="admin-legacy-recovery-notice" class="lp-notice lp-notice-warn"><span>You signed in with an older recovery code. Replace your recovery codes in <a href="/admin/settings/account">Settings &gt; Account</a> as soon as you can.</span></div>' : ''}
    ${safeContent}
  </main>
  ${renderShellThemeAndMenuScript(nonceAttr, true)}
</body>
</html>`;
}
