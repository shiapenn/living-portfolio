import { loadConfig } from '@living-portfolio/config';
import { BUILTIN_PROFILES } from '@living-portfolio/core';
import { escapeHtml } from '../../lib/html.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { renderActionBar, renderField, renderFormSection, renderItem, renderList, renderText } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';

export async function renderAdminStructurePage(
  clientOrRepo: any,
  options: { siteName?: string; answeringEnabled?: boolean; initialSettings?: Record<string, unknown>; nonce?: string } = {}
): Promise<string> {
  const cfg = loadConfig();
  const raw = options.initialSettings ?? {};
  const exclusions = Array.isArray((raw as any).redactionExclusions)
    ? ((raw as any).redactionExclusions as string[])
    : Array.isArray((raw as any).redaction?.exclusions)
      ? ((raw as any).redaction.exclusions as string[])
      : [];

  const profiles = Object.values(BUILTIN_PROFILES);
  const profilesListHtml = renderList({
    id: 'structure-profiles-list',
    variant: 'plain',
    itemsHtml: profiles.map((p: any) => renderItem({
      title: String(p.label || p.name || p.id),
      subtitle: `Roles: ${Array.isArray(p.roles) ? p.roles.join(', ') : 'General'}`,
      statusLabel: 'Active',
      statusTone: 'ok',
    })).join(''),
  });

  const bodyHtml = `
    <form id="structure-settings-form" class="lp-stack lp-gap-section">
      ${renderStatusLine({ id: 'structure-status-line' })}

      ${renderFormSection({
        id: 'structure-explain-section',
        title: 'How structure and exclusions work',
        fieldsHtml: `
          ${renderText({ variant: 'description', text: 'What it does: Lists entry types and manages private names or client terms blocked during publishing checks.' })}
          ${renderText({ variant: 'description', text: 'Impact: Terms added to exclusions trigger a confirmation warning before any entry can be published.' })}
        `,
      })}

      ${renderFormSection({
        id: 'structure-profiles-section',
        title: 'Entry profiles',
        description: 'Built-in profiles organize your writing into Work, Writing, and Build sections.',
        fieldsHtml: profilesListHtml,
      })}

      ${renderFormSection({
        id: 'structure-exclusions-section',
        title: 'Private detail exclusions',
        description: 'One client, project, or codename per line. Matches are flagged before publishing.',
        fieldsHtml: renderField({
          kind: 'textarea',
          id: 'structure-redaction-exclusions',
          name: 'exclusions',
          label: 'Excluded terms',
          value: exclusions.join('\n'),
          rows: 5,
          help: 'Entries containing these terms require explicit confirmation before becoming public.',
        }),
      })}

      ${renderActionBar({
        pageLevel: true,
        primary: { id: 'btn-save-structure-exclusions', label: 'Save', variant: 'primary', type: 'button' },
      })}
    </form>
    <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
      ${ADMIN_API_CLIENT_SCRIPT}
      (function () {
        var btn = document.getElementById('btn-save-structure-exclusions');
        var statusEl = document.getElementById('structure-status-line');
        var area = document.getElementById('structure-redaction-exclusions');
        if (btn && area) {
          btn.addEventListener('click', async function () {
            btn.disabled = true;
            var list = area.value.split(/\\r?\\n/).map(function (s) { return s.trim(); }).filter(Boolean);
            var res = await apiClient('/api/settings/redaction', {
              method: 'PATCH',
              body: JSON.stringify({ exclusions: list }),
            });
            if (statusEl) {
              statusEl.textContent = res && res.ok ? 'Saved.' : 'Could not save exclusions.';
              statusEl.hidden = false;
            }
            btn.disabled = false;
          });
        }
      })();
    </script>`;

  const content = renderPageTemplate({
    title: 'Structure',
    description: 'Entry profiles, topic vocabulary, and private detail exclusions.',
    bodyHtml,
  });

  return renderAdminShell('Structure', '/admin/structure', content, {
    siteName: options.siteName ?? cfg.PUBLIC_SITE_NAME,
    answeringEnabled: options.answeringEnabled,
    nonce: options.nonce,
  });
}
