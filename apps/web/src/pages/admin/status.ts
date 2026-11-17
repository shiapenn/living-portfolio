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

  const siteBuildHtml = renderFormSection({
    id: 'status-section-build',
    title: 'Site build',
    description: 'Static visitor pages and timeline artifacts.',
    fieldsHtml: `<div class="lp-list">
      ${renderItem({
        id: 'status-build-row',
        title: 'Site build',
        subtitle: 'Static snapshot for public visitors.',
        statusLabel: 'Idle (ready)',
        statusTone: 'ok',
        actions: {
          secondary: { id: 'status-rebuild-btn', label: 'Rebuild site', variant: 'secondary', size: 'sm' },
        },
      })}
    </div>`,
  });

  const answeringHtml = renderFormSection({
    id: 'status-section-answering',
    title: 'Automated answering',
    description: 'Pause or resume public question answering.',
    fieldsHtml: `<div class="lp-list">
      ${renderItem({
        id: 'status-answering-row',
        title: 'Automated answering',
        subtitle: answeringOn ? 'Visitors receive answers from published entries.' : 'Public answering is paused.',
        statusLabel: answeringOn ? 'Active' : 'Paused',
        statusTone: answeringOn ? 'ok' : 'warn',
        actions: {
          secondary: {
            id: 'status-answering-toggle',
            label: answeringOn ? 'Pause answering' : 'Resume answering',
            variant: 'secondary',
            size: 'sm',
            dataAttrs: { enabled: answeringOn ? 'true' : 'false' },
          },
        },
      })}
    </div>`,
  });

  const linksHtml = renderFormSection({
    id: 'status-section-infra',
    title: 'Backups & Providers',
    fieldsHtml: `<div class="lp-list">
      ${renderItem({
        id: 'status-backups-link',
        href: '/admin/settings/backups',
        title: 'Backups',
        subtitle: 'Configure backup directory, age encryption key, and restore drills.',
        showChevron: true,
      })}
      ${renderItem({
        id: 'status-providers-link',
        href: '/admin/settings/providers',
        title: 'Providers',
        subtitle: `${providers.length} configured provider${providers.length === 1 ? '' : 's'} · Configure degradation mode and routing.`,
        showChevron: true,
      })}
    </div>`,
  });

  const bodyHtml = `
    ${renderStatusLine({ id: 'status-page-line' })}
    ${siteBuildHtml}
    ${answeringHtml}
    ${linksHtml}
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
            toggleBtn.textContent = enabled ? 'Pause answering' : 'Resume answering';
          }
          var row = document.getElementById('status-answering-row');
          if (row) {
            var badge = row.querySelector('.lp-badge');
            if (badge) {
              badge.textContent = enabled ? 'Active' : 'Paused';
              badge.className = 'lp-badge ' + (enabled ? 'lp-badge-ok' : 'lp-badge-warn');
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
    title: 'Site Status',
    description: 'Build state, automated answering, backups, and providers.',
    bodyHtml,
  });

  return renderAdminShell('Site Status', '/admin/status', content, {
    nonce: options.nonce,
    siteName: options.siteName ?? cfg.PUBLIC_SITE_NAME,
    answeringEnabled: answeringOn,
  });
}
