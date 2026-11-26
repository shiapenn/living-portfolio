import { loadConfig } from '@living-portfolio/config';
import { formatAdminDateTime } from '@living-portfolio/ui-core';
import { escapeHtml } from '../../lib/html.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { renderActionBar, renderField, renderFormSection, renderItem, renderList } from '../../primitives/index.js';
import { renderEmptyState, renderStatusLine } from '../../components/index.js';

type PageKey = 'about' | 'now' | 'uses';
const SECTION_LABELS: Record<PageKey, string> = {
  about: 'About',
  now: 'Now',
  uses: 'Uses',
};

export async function renderAdminPagesEditorPage(
  _clientOrRepo: any,
  options: { section?: string; siteName?: string; answeringEnabled?: boolean; initialSettings?: Record<string, unknown>; nonce?: string } = {}
): Promise<string> {
  const cfg = loadConfig();
  const active: PageKey =
    options.section === 'now' || options.section === 'uses' ? options.section : 'about';
  const pagesMap = ((options.initialSettings as any)?.pages || {}) as Record<string, any>;
  const current = pagesMap[active] || {
    slug: active,
    title: SECTION_LABELS[active],
    body_md: `${SECTION_LABELS[active]} section content.`,
    revisions: [],
  };
  const revisions: Array<{ id: string; body_md: string; savedAt: string }> = Array.isArray(current.revisions) ? current.revisions : [];

  const tabsHtml = `<div data-c="Tabs" data-rel="tabs" class="lp-tabs" role="tablist" aria-label="Page sections">
    ${(['about', 'now', 'uses'] as PageKey[])
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
          .map((rev, idx) =>
            renderItem({
              title: `Revision ${revisions.length - idx}`,
              subtitle: `Saved ${formatAdminDateTime(rev.savedAt)}`,
              body: rev.body_md.slice(0, 140),
              statusLabel: idx === 0 ? 'Current' : undefined,
              statusTone: idx === 0 ? 'ok' : undefined,
            })
          )
          .join(''),
      })
    : renderEmptyState({
        id: 'pages-revisions-empty',
        body: 'No earlier revisions saved yet.',
      });

  const bodyHtml = `
    <form id="admin-pages-form" data-page-section="${escapeHtml(active)}" class="lp-stack lp-gap-section">
      ${renderFormSection({
        id: 'pages-editor-section',
        title: 'Content',
        fieldsHtml: renderField({
          kind: 'textarea',
          id: 'pages-body-md',
          name: 'body_md',
          label: `${SECTION_LABELS[active]} content`,
          value: String(current.body_md || ''),
          rows: 8,
          help: 'Markdown supported. Each save keeps an earlier revision.',
        }),
      })}

      ${renderFormSection({
        id: 'pages-revisions-section',
        title: 'Revision history',
        fieldsHtml: revListHtml,
      })}

      <div class="lp-stack lp-gap-related">
        ${renderActionBar({
          pageLevel: true,
          primary: { id: 'btn-save-page-section', label: 'Save', variant: 'primary', type: 'button' },
        })}
        <div id="pages-status-line" class="lp-is-hidden" aria-live="assertive" tabindex="-1"></div>
      </div>
    </form>
    <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
      ${ADMIN_API_CLIENT_SCRIPT}
      (function () {
        var btn = document.getElementById('btn-save-page-section');
        var area = document.getElementById('pages-body-md');
        var statusEl = document.getElementById('pages-status-line');
        var form = document.getElementById('admin-pages-form');
        if (!btn || !area || !form) return;
        var setStatus = function (msg, isErr) {
          if (!statusEl) return;
          statusEl.hidden = false;
          statusEl.className = 'lp-notice ' + (isErr ? 'lp-notice-danger' : 'lp-notice-ok');
          statusEl.setAttribute('role', isErr ? 'alert' : 'status');
          statusEl.textContent = msg;
        };
        btn.addEventListener('click', async function () {
          var slug = form.getAttribute('data-page-section') || 'about';
          if (!area.value.trim()) {
            setStatus('Content cannot be empty.', true);
            return;
          }
          btn.disabled = true;
          try {
            var res = await apiClient('/api/settings/pages/' + encodeURIComponent(slug), {
              method: 'PUT',
              body: JSON.stringify({ body_md: area.value }),
            });
            if (res && res.ok) {
              setStatus('Saved revision.', false);
              window.location.reload();
            } else {
              var errData = res ? await res.json().catch(function () { return {}; }) : {};
              setStatus(errData.message || 'Could not save page.', true);
              btn.disabled = false;
            }
          } catch {
            setStatus('Could not save page.', true);
            btn.disabled = false;
          }
        });
      })();
    </script>`;

  const content = renderPageTemplate({
    title: 'Pages',
    description: 'Edit About, Now, and Uses pages.',
    archetype: 'list',
    tabsHtml,
    bodyHtml,
  });

  return renderAdminShell('Pages', '/admin/pages', content, {
    siteName: options.siteName ?? cfg.PUBLIC_SITE_NAME,
    answeringEnabled: options.answeringEnabled,
    nonce: options.nonce,
  });
}
