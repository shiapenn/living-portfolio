import { escapeHtml } from '../../lib/html.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { renderListRow, renderStatusDot } from '../../primitives/index.js';
import { renderEmptyState, renderStatusLine } from '../../components/index.js';
import { INBOX_STRINGS } from '../../strings/admin/inbox.js';

export async function renderAdminAuditRulesPage(
  clientOrRepo: any,
  options: { status?: string; siteName?: string; answeringEnabled?: boolean; nonce?: string } = {}
): Promise<string> {
  const activeStatus = options.status === 'confirmed' || options.status === 'revoked' ? options.status : 'proposed';
  let rules: any[] = [];
  try {
    if (clientOrRepo?.audit?.listRules) {
      rules = (await clientOrRepo.audit.listRules(activeStatus))?.constraints ?? [];
    } else if (clientOrRepo?.getScopedConstraints) {
      rules = (await clientOrRepo.getScopedConstraints(activeStatus)) ?? [];
    }
  } catch { rules = []; }

  const tabsHtml = `<div class="lp-tabs" role="tablist" aria-label="Rule status filters">
    <a id="audit-tab-proposed" href="/admin/audit?status=proposed" role="tab" aria-selected="${activeStatus === 'proposed' ? 'true' : 'false'}" class="lp-tab${activeStatus === 'proposed' ? ' lp-tab-active' : ''}">${escapeHtml(INBOX_STRINGS.audit.tabs.proposed)}</a>
    <a id="audit-tab-confirmed" href="/admin/audit?status=confirmed" role="tab" aria-selected="${activeStatus === 'confirmed' ? 'true' : 'false'}" class="lp-tab${activeStatus === 'confirmed' ? ' lp-tab-active' : ''}">${escapeHtml(INBOX_STRINGS.audit.tabs.confirmed)}</a>
    <a id="audit-tab-revoked" href="/admin/audit?status=revoked" role="tab" aria-selected="${activeStatus === 'revoked' ? 'true' : 'false'}" class="lp-tab${activeStatus === 'revoked' ? ' lp-tab-active' : ''}">${escapeHtml(INBOX_STRINGS.audit.tabs.revoked)}</a>
  </div>`;

  const listHtml = rules.length > 0
    ? `<div id="audit-rules-list" class="lp-list">${rules
        .map((rule) => {
          const id = String(rule.id);
          const quote = String(rule.source_quote || '');
          const scopeEntries = rule.scope && typeof rule.scope === 'object' ? Object.entries(rule.scope) : [];
          const scopeText = scopeEntries.length > 0
            ? `Applies when ${scopeEntries.map(([k, v]) => `${k} is ${Array.isArray(v) ? v.join(', ') : String(v)}`).join(' and ')}.`
            : 'Applies to all questions.';
          const c = rule.constraint || {};
          const summary = c.guidance || c.summary || c.rule || (typeof c === 'string' ? c : 'Answer rule.');
          const tone = activeStatus === 'confirmed' ? 'ok' : activeStatus === 'revoked' ? 'neutral' : 'warn';
          const statusLabel = INBOX_STRINGS.audit.tabs[activeStatus as 'proposed' | 'confirmed' | 'revoked'];
          const trailingHtml = renderStatusDot({ label: statusLabel, tone }) +
            (activeStatus === 'proposed' ? `<button type="button" class="lp-btn lp-btn-primary lp-btn-sm" data-rule-id="${escapeHtml(id)}" data-rule-action="confirmed">${escapeHtml(INBOX_STRINGS.audit.confirmRule)}</button>` : '') +
            (activeStatus !== 'revoked' ? `<button type="button" class="lp-btn lp-btn-secondary lp-btn-sm" data-rule-id="${escapeHtml(id)}" data-rule-action="revoked">${escapeHtml(INBOX_STRINGS.audit.revokeRule)}</button>` : '');
          return renderListRow({
            primary: String(summary),
            secondary: `${scopeText}${quote ? ` · Source quote: ${quote}` : ''}`,
            trailingHtml,
            attributes: `data-rule-row="${escapeHtml(id)}"`,
          });
        })
        .join('')}</div>`
    : renderEmptyState({ id: 'audit-empty', headingTag: 'h2', title: INBOX_STRINGS.audit.emptyTitle, body: INBOX_STRINGS.audit.emptyBody });

  const bodyHtml = `
    ${renderStatusLine({ id: 'audit-status-line' })}
    ${listHtml}
    <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
      ${ADMIN_API_CLIENT_SCRIPT}
      (function () {
        var list = document.getElementById('audit-rules-list');
        var statusEl = document.getElementById('audit-status-line');
        if (!list) return;
        list.addEventListener('click', async function (e) {
          var btn = e.target && e.target.closest ? e.target.closest('button[data-rule-action]') : null;
          if (!btn) return;
          var id = btn.getAttribute('data-rule-id');
          var nextStatus = btn.getAttribute('data-rule-action');
          if (!id || !nextStatus) return;
          btn.disabled = true;
          var res = await apiClient('/api/audit/scoped-constraints/' + encodeURIComponent(id), {
            method: 'PATCH',
            body: JSON.stringify({ status: nextStatus }),
          });
          if (!res || !res.ok) {
            if (statusEl) statusEl.textContent = ${JSON.stringify(INBOX_STRINGS.audit.errorStatus)};
            btn.disabled = false;
            return;
          }
          window.location.reload();
        });
      })();
    </script>`;

  const content = renderPageTemplate({
    title: INBOX_STRINGS.audit.title,
    description: INBOX_STRINGS.audit.subtitle,
    tabsHtml,
    bodyHtml,
  });

  return renderAdminShell(INBOX_STRINGS.audit.title, '/admin/audit', content, { siteName: options.siteName, answeringEnabled: options.answeringEnabled, nonce: options.nonce });
}
