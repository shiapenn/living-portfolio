import { loadConfig } from '@living-portfolio/config';
import { escapeHtml } from '../../lib/html.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { renderActionBar, renderField, renderFormSection, renderItem, renderList, renderText } from '../../primitives/index.js';
import { renderEmptyState, renderStatusLine } from '../../components/index.js';

export async function renderAdminVenturesPage(
  clientOrRepo: any,
  options: { siteName?: string; answeringEnabled?: boolean; nonce?: string } = {}
): Promise<string> {
  const cfg = loadConfig();
  let ventures: any[] = [];
  try {
    if (clientOrRepo?.listVentures) {
      ventures = (await clientOrRepo.listVentures()) ?? [];
    }
  } catch { ventures = []; }

  const listHtml = ventures.length > 0
    ? renderList({
        id: 'ventures-list',
        variant: 'plain',
        itemsHtml: ventures.map((v) => renderItem({
          title: String(v.name || v.slug),
          subtitle: v.description ? String(v.description) : `/${String(v.slug)}`,
          statusLabel: v.status === 'archived' ? 'Archived' : 'Active',
          statusTone: v.status === 'archived' ? 'neutral' : 'ok',
          attributes: `data-venture-row="${escapeHtml(String(v.id))}"`,
        })).join(''),
      })
    : renderEmptyState({
        id: 'ventures-empty',
        headingTag: 'h2',
        title: 'No ventures yet',
        body: 'Create a venture below to publish projects on your /build page.',
      });

  const bodyHtml = `
    <div class="lp-stack lp-gap-section">
      ${renderStatusLine({ id: 'ventures-status-line' })}

      ${renderFormSection({
        id: 'ventures-explain-section',
        title: 'How ventures work',
        fieldsHtml: renderText({
          variant: 'description',
          text: 'What it does: Manages projects shown on your public /build page and groups related dev-log entries.',
        }),
      })}

      ${renderFormSection({
        id: 'ventures-create-section',
        title: 'New venture',
        fieldsHtml: `
          ${renderField({
            kind: 'input',
            id: 'venture-name',
            name: 'name',
            label: 'Venture name',
            inputType: 'text',
            value: '',
            placeholder: 'Open Source Toolkit',
          })}
          ${renderField({
            kind: 'textarea',
            id: 'venture-description',
            name: 'description',
            label: 'Short description',
            value: '',
            rows: 3,
          })}
          ${renderField({
            kind: 'select',
            id: 'venture-status',
            name: 'status',
            label: 'Stage',
            value: 'building',
            options: [
              { value: 'building', label: 'Building' },
              { value: 'launched', label: 'Launched' },
              { value: 'paused', label: 'Paused' },
              { value: 'archived', label: 'Archived' },
            ],
          })}
        `,
        actionBarHtml: renderActionBar({
          level: 'item',
          secondary: { id: 'btn-create-venture', label: 'Add venture', variant: 'secondary', type: 'button', size: 'sm' },
        }),
      })}

      ${renderFormSection({
        id: 'ventures-list-section',
        title: 'Published ventures',
        fieldsHtml: listHtml,
      })}
    </div>
    <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
      ${ADMIN_API_CLIENT_SCRIPT}
      (function () {
        var btn = document.getElementById('btn-create-venture');
        var statusEl = document.getElementById('ventures-status-line');
        if (!btn) return;
        btn.addEventListener('click', async function () {
          var nameEl = document.getElementById('venture-name');
          var descEl = document.getElementById('venture-description');
          var stageEl = document.getElementById('venture-status');
          var name = nameEl ? nameEl.value.trim() : '';
          if (!name) {
            if (statusEl) { statusEl.textContent = 'Enter a venture name.'; statusEl.hidden = false; }
            return;
          }
          btn.disabled = true;
          var res = await apiClient('/api/structure/ventures', {
            method: 'POST',
            body: JSON.stringify({
              name: name,
              description: descEl ? descEl.value.trim() : '',
              status: stageEl ? stageEl.value : 'building',
            }),
          });
          if (res && res.ok) {
            if (statusEl) { statusEl.textContent = 'Venture added.'; statusEl.hidden = false; }
            window.location.reload();
          } else {
            if (statusEl) { statusEl.textContent = 'Could not add venture.'; statusEl.hidden = false; }
            btn.disabled = false;
          }
        });
      })();
    </script>`;

  const content = renderPageTemplate({
    title: 'Ventures',
    description: 'Manage projects displayed on your public Build page.',
    bodyHtml,
  });

  return renderAdminShell('Ventures', '/admin/ventures', content, {
    siteName: options.siteName ?? cfg.PUBLIC_SITE_NAME,
    answeringEnabled: options.answeringEnabled,
    nonce: options.nonce,
  });
}
