import { loadConfig } from '@living-portfolio/config';
import { adaptDataSource, type WebDataClient } from '../../lib/data-source.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { escapeHtml } from '../../lib/html.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { renderButton, renderItem, renderFormSection } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';

export interface StatusPageOptions {
  nonce?: string;
  siteName?: string;
  answeringEnabled?: boolean;
}

export async function renderAdminStatusPage(
  client: WebDataClient,
  options: StatusPageOptions = {}
): Promise<string> {
  const ds = adaptDataSource(client);
  const cfg = loadConfig();
  const settings = ((await (ds as any).settings?.get?.()) ?? {}) as Record<string, unknown>;
  const runtime = (settings.runtime && typeof settings.runtime === 'object' ? settings.runtime : settings) as Record<string, unknown>;
  const providersRes = (await (ds as any).system?.getProviders?.()) ?? { providers: [] };
  const providers = Array.isArray((providersRes as any).providers) ? (providersRes as any).providers : [];
  const answeringOn =
    options.answeringEnabled ??
    (typeof runtime.automatedAnsweringEnabled === 'boolean'
      ? runtime.automatedAnsweringEnabled
      : typeof settings.answering_enabled === 'boolean'
        ? settings.answering_enabled
        : true);

  const backupState =
    typeof runtime.lastBackupDrill === 'string' && runtime.lastBackupDrill
      ? `Last drill passed ${runtime.lastBackupDrill}`
      : 'Not set up';
  const savedProvider = settings.activeProvider as any;
  const activeProvider =
    providers.find((p: any) => p && p.configured) ??
    (savedProvider && savedProvider.configured && savedProvider.id !== 'local' ? savedProvider : undefined);
  const providerState = activeProvider
    ? `Connected (${activeProvider.label || activeProvider.id}${activeProvider.model ? ` · ${activeProvider.model}` : ''})`
    : 'Local only';

  const listHtml = `<div class="lp-list">
    ${renderItem({
      id: 'status-build-row',
      className: 'lp-item-trailing-status',
      title: 'Site',
      statusLabel: 'Idle (ready)',
      statusTone: 'ok',
      actions: {
        secondary: { id: 'status-rebuild-btn', label: 'Rebuild site', variant: 'secondary', size: 'sm' },
      },
    })}
    ${renderItem({
      id: 'status-answering-row',
      className: 'lp-item-trailing-status',
      title: 'Automated answering',
      statusLabel: answeringOn ? 'Active' : 'Paused',
      statusTone: answeringOn ? 'ok' : 'warn',
      actions: {
        secondary: {
          id: 'status-answering-toggle',
          label: answeringOn ? 'Pause' : 'Resume',
          variant: 'secondary',
          size: 'sm',
          dataAttrs: { enabled: answeringOn ? 'true' : 'false' },
        },
      },
    })}
    ${renderItem({
      id: 'status-backups-link',
      className: 'lp-item-trailing-status',
      href: '/admin/settings/backups',
      title: 'Backups',
      statusLabel: backupState,
      statusTone: backupState === 'Not set up' ? 'neutral' : 'ok',
      showChevron: true,
    })}
    ${renderItem({
      id: 'status-providers-link',
      className: 'lp-item-trailing-status',
      href: '/admin/settings/providers',
      title: 'Providers',
      statusLabel: providerState,
      statusTone: activeProvider ? 'ok' : 'neutral',
      showChevron: true,
    })}
  </div>`;

  const bodyHtml = `
    ${renderStatusLine({ id: 'status-page-line' })}
    ${listHtml}
    <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
      ${ADMIN_API_CLIENT_SCRIPT}
      (function () {
        var line = document.getElementById('status-page-line');
        var rebuildBtn = document.getElementById('status-rebuild-btn');
        var toggleBtn = document.getElementById('status-answering-toggle');
        var setLine = function (msg) {
          if (!line) return;
          line.textContent = msg;
          line.hidden = !msg;
        };
        var applyAnsweringState = function (enabled) {
          if (toggleBtn) {
            toggleBtn.setAttribute('data-enabled', enabled ? 'true' : 'false');
            toggleBtn.textContent = enabled ? 'Pause' : 'Resume';
          }
          var row = document.getElementById('status-answering-row');
          if (row) {
            var dotCircle = row.querySelector('.lp-status-dot');
            var labelEl = row.querySelector('.lp-status-label');
            if (dotCircle && labelEl) {
              dotCircle.className = 'lp-status-dot lp-status-dot-' + (enabled ? 'ok' : 'warn');
              labelEl.textContent = enabled ? 'Active' : 'Paused';
            }
          }
        };
        apiClient('/api/settings', { method: 'GET' }).then(function (r) {
          if (r && r.ok) return r.json();
          return null;
        }).then(function (data) {
          if (data && data.runtime && typeof data.runtime.automatedAnsweringEnabled === 'boolean') {
            applyAnsweringState(data.runtime.automatedAnsweringEnabled);
          }
          if (data && data.activeProvider && data.activeProvider.configured && data.activeProvider.id !== 'local') {
            var provLink = document.getElementById('status-providers-link');
            if (provLink) {
              var provDot = provLink.querySelector('.lp-status-dot');
              var provLabel = provLink.querySelector('.lp-status-label');
              if (provDot) provDot.className = 'lp-status-dot lp-status-dot-ok';
              if (provLabel) {
                provLabel.textContent = 'Connected (' + (data.activeProvider.label || data.activeProvider.id) + (data.activeProvider.model ? ' · ' + data.activeProvider.model : '') + ')';
              }
            }
          }
        }).catch(function () {});
        if (rebuildBtn) {
          rebuildBtn.addEventListener('click', async function () {
            rebuildBtn.disabled = true;
            try {
              var res = await apiClient('/api/build', { method: 'POST', body: '{}' });
              setLine(res && res.ok ? 'Site rebuild queued.' : 'Could not queue site rebuild.');
            } catch (_err) {
              setLine('Could not queue site rebuild.');
            }
            rebuildBtn.disabled = false;
          });
        }
        if (toggleBtn) {
          toggleBtn.addEventListener('click', async function () {
            var isEnabled = toggleBtn.getAttribute('data-enabled') === 'true';
            if (isEnabled && !window.confirm('Pause automated answering on the public site?')) return;
            toggleBtn.disabled = true;
            try {
              var res = await apiClient('/api/settings/routing', {
                method: 'PATCH',
                body: JSON.stringify({ automatedAnsweringEnabled: !isEnabled }),
              });
              if (res && res.ok) {
                applyAnsweringState(!isEnabled);
                setLine(!isEnabled ? 'Automated answering resumed.' : 'Automated answering paused.');
                toggleBtn.disabled = false;
                return;
              }
              setLine('Could not update automated answering.');
            } catch (_err) {
              setLine('Could not update automated answering.');
            }
            toggleBtn.disabled = false;
          });
        }
      })();
    </script>
  `;

  const content = renderPageTemplate({
    title: 'Status',
    description: 'Site build, automated answering, backups and providers.',
    bodyHtml,
  });

  return renderAdminShell('Status', '/admin/status', content, {
    nonce: options.nonce,
    siteName: options.siteName ?? cfg.PUBLIC_SITE_NAME,
    answeringEnabled: answeringOn,
  });
}
