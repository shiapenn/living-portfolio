import { escapeHtml } from '../../lib/html.js';
import { renderAdminShell } from '../../layouts/admin-shell.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { renderBadge } from '../../primitives/index.js';
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

  const tabBar = `<div class="lp-entries-filters" role="group" aria-label="Rule status filters">
    <a id="audit-tab-proposed" href="/admin/audit?status=proposed" class="lp-btn lp-btn-sm ${activeStatus === 'proposed' ? 'lp-btn-primary' : 'lp-btn-secondary'}">${escapeHtml(INBOX_STRINGS.audit.tabs.proposed)}</a>
    <a id="audit-tab-confirmed" href="/admin/audit?status=confirmed" class="lp-btn lp-btn-sm ${activeStatus === 'confirmed' ? 'lp-btn-primary' : 'lp-btn-secondary'}">${escapeHtml(INBOX_STRINGS.audit.tabs.confirmed)}</a>
    <a id="audit-tab-revoked" href="/admin/audit?status=revoked" class="lp-btn lp-btn-sm ${activeStatus === 'revoked' ? 'lp-btn-primary' : 'lp-btn-secondary'}">${escapeHtml(INBOX_STRINGS.audit.tabs.revoked)}</a>
  </div>`;

  const listHtml = rules.length > 0
    ? `<ul id="audit-rules-list" class="lp-history-list">${rules
        .map((rule) => {
          const id = String(rule.id);
          const quote = String(rule.source_quote || '');
          const scopeText = rule.scope && Object.keys(rule.scope).length > 0 ? JSON.stringify(rule.scope) : 'Global';
          const summary = rule.constraint?.guidance || JSON.stringify(rule.constraint || {});
          const tone = activeStatus === 'confirmed' ? 'ok' : activeStatus === 'revoked' ? 'neutral' : 'warn';
          return `<li class="lp-card lp-history-row" data-rule-row="${escapeHtml(id)}">
            <div class="lp-history-row-header">
              <strong>${escapeHtml(String(summary))}</strong>
              ${renderBadge({ label: INBOX_STRINGS.audit.tabs[activeStatus as 'proposed' | 'confirmed' | 'revoked'], tone })}
            </div>
            <p class="lp-type-body-sm"><strong>${escapeHtml(INBOX_STRINGS.audit.sourceQuoteLabel)}:</strong> ${escapeHtml(quote || '—')}</p>
            <p class="lp-type-body-sm"><strong>${escapeHtml(INBOX_STRINGS.audit.scopeLabel)}:</strong> ${escapeHtml(scopeText)}</p>
            <div class="lp-history-meta">
              ${activeStatus === 'proposed' ? `<button type="button" class="lp-btn lp-btn-primary lp-btn-sm" data-rule-id="${escapeHtml(id)}" data-rule-action="confirmed">${escapeHtml(INBOX_STRINGS.audit.confirmRule)}</button>` : ''}
              ${activeStatus !== 'revoked' ? `<button type="button" class="lp-btn lp-btn-secondary lp-btn-sm" data-rule-id="${escapeHtml(id)}" data-rule-action="revoked">${escapeHtml(INBOX_STRINGS.audit.revokeRule)}</button>` : ''}
            </div>
          </li>`;
        })
        .join('')}</ul>`
    : renderEmptyState({ id: 'audit-empty', headingTag: 'h2', title: INBOX_STRINGS.audit.emptyTitle, body: INBOX_STRINGS.audit.emptyBody });

  const content = `<div class="lp-admin-section">
    <div>
      <h1 class="lp-type-h1">${escapeHtml(INBOX_STRINGS.audit.title)}</h1>
      <p class="lp-field-help">${escapeHtml(INBOX_STRINGS.audit.subtitle)}</p>
    </div>
    ${renderStatusLine({ id: 'audit-status-line' })}
    ${tabBar}
    ${listHtml}
  </div>
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

  return renderAdminShell(INBOX_STRINGS.audit.title, '/admin/audit', content, { siteName: options.siteName, answeringEnabled: options.answeringEnabled, nonce: options.nonce });
}
