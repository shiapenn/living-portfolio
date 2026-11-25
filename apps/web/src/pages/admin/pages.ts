import { loadConfig } from '@living-portfolio/config';
import { escapeHtml } from '../../lib/html.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { renderActionBar, renderField, renderFormSection, renderItem, renderList, renderText } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';

type PageKey = 'about' | 'now' | 'uses' | 'home';
const SECTION_LABELS: Record<PageKey, string> = {
  about: 'About',
  now: 'Now',
  uses: 'Uses',
  home: 'Home statement',
};

export async function renderAdminPagesEditorPage(
  _clientOrRepo: any,
  options: { section?: string; siteName?: string; answeringEnabled?: boolean; initialSettings?: Record<string, unknown>; nonce?: string } = {}
): Promise<string> {
  const cfg = loadConfig();
  const active: PageKey =
    options.section === 'now' || options.section === 'uses' || options.section === 'home' ? options.section : 'about';
  const pagesMap = ((options.initialSettings as any)?.pages || {}) as Record<string, any>;
  const current = pagesMap[active] || {
    slug: active,
    title: SECTION_LABELS[active],
    body_md: active === 'home' ? 'Independent builder documenting real engineering work, decisions, and outcomes.' : `${SECTION_LABELS[active]} section content.`,
    revisions: [],
  };
  const revisions: Array<{ id: string; body_md: string; savedAt: string }> = Array.isArray(current.revisions) ? current.revisions : [];

  const tabsHtml = `<div data-c="Tabs" data-rel="tabs" class="lp-tabs" role="tablist" aria-label="Page sections">
    ${(['about', 'now', 'uses', 'home'] as PageKey[])
      .map(
        (key) =>
          `<a id="pages-tab-${key}" href="/admin/pages?section=${key}" role="tab" aria-selected="${active === key ? 'true' : 'false'}" class="lp-tab${active === key ? ' lp-tab-active' : ''}">${escapeHtml(SECTION_LABELS[key])}</a>`
      )
      .join('')}
  </div>`;

  const revListHtml = revisions.length > 0
    ? renderList({
        id: 'pages-revisions-list',
        variant: 'plain',
        itemsHtml: revisions
          .slice()
          .reverse()
          .map((rev) =>
            renderItem({
              title: `Revision ${rev.id}`,
              subtitle: `Saved ${new Date(rev.savedAt).toISOString().slice(0, 19).replace('T', ' ')}`,
              body: rev.body_md.slice(0, 140),
              statusLabel: 'Archived',
              statusTone: 'neutral',
            })
          )
          .join(''),
      })
    : renderText({ id: 'pages-revisions-empty', variant: 'caption', text: 'No earlier revisions saved yet. Saving creates a new revision.' });

  const bodyHtml = `
    <form id="admin-pages-form" data-page-section="${escapeHtml(active)}" class="lp-stack lp-gap-section">
      ${renderStatusLine({ id: 'pages-status-line' })}

      ${renderFormSection({
        id: 'pages-explain-section',
        title: 'How site pages work',
        fieldsHtml: renderText({
          variant: 'description',
          text: 'What it does: Edits your About, Now, Uses, and Home statement sections in Markdown while keeping immutable revision history.',
        }),
      })}

      ${renderFormSection({
        id: 'pages-editor-section',
        title: SECTION_LABELS[active],
        fieldsHtml: renderField({
          kind: 'textarea',
          id: 'pages-body-md',
          name: 'body_md',
          label: `${SECTION_LABELS[active]} content (Markdown)`,
          value: String(current.body_md || ''),
          rows: 8,
          help: 'Every save records a new immutable revision.',
        }),
      })}

      ${renderFormSection({
        id: 'pages-revisions-section',
        title: 'Revision history',
        fieldsHtml: revListHtml,
      })}

      ${renderActionBar({
        pageLevel: true,
        primary: { id: 'btn-save-page-section', label: 'Save', variant: 'primary', type: 'button' },
      })}
    </form>
    <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
      ${ADMIN_API_CLIENT_SCRIPT}
      (function () {
        var btn = document.getElementById('btn-save-page-section');
        var area = document.getElementById('pages-body-md');
        var statusEl = document.getElementById('pages-status-line');
        var form = document.getElementById('admin-pages-form');
        if (!btn || !area || !form) return;
        btn.addEventListener('click', async function () {
          var slug = form.getAttribute('data-page-section') || 'about';
          btn.disabled = true;
          var res = await apiClient('/api/settings/pages/' + encodeURIComponent(slug), {
            method: 'PUT',
            body: JSON.stringify({ body_md: area.value }),
          });
          if (res && res.ok) {
            if (statusEl) { statusEl.textContent = 'Saved revision.'; statusEl.hidden = false; }
            window.location.reload();
          } else {
            if (statusEl) { statusEl.textContent = 'Could not save page section.'; statusEl.hidden = false; }
            btn.disabled = false;
          }
        });
      })();
    </script>`;

  const content = renderPageTemplate({
    title: 'Pages',
    description: 'Edit About, Now, Uses, and Home statement with revision history.',
    tabsHtml,
    bodyHtml,
  });

  return renderAdminShell('Pages', '/admin/pages', content, {
    siteName: options.siteName ?? cfg.PUBLIC_SITE_NAME,
    answeringEnabled: options.answeringEnabled,
    nonce: options.nonce,
  });
}
