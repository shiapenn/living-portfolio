import { escapeHtml } from '../../lib/html.js';
import { renderAdminShell } from '../../layouts/admin-shell.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { renderBadge } from '../../primitives/index.js';
import { renderEmptyState, renderStatusLine } from '../../components/index.js';
import { INBOX_STRINGS } from '../../strings/admin/inbox.js';

function getDueBadge(item: any): { label: string; tone: 'neutral' | 'ok' | 'warn' | 'danger' } {
  const status = String(item.status || 'pending');
  if (status === 'approved') return { label: INBOX_STRINGS.inbox.dueLabels.replied, tone: 'ok' };
  if (status === 'rejected') return { label: INBOX_STRINGS.inbox.dueLabels.declined, tone: 'neutral' };
  const createdMs = item.created_at ? Date.parse(String(item.created_at)) : NaN;
  if (Number.isFinite(createdMs)) {
    const ageHours = (Date.now() - createdMs) / 3_600_000;
    if (ageHours >= 48) return { label: INBOX_STRINGS.inbox.dueLabels.overdue, tone: 'danger' };
    if (ageHours >= 12) return { label: INBOX_STRINGS.inbox.dueLabels.dueSoon, tone: 'warn' };
  }
  return { label: INBOX_STRINGS.inbox.dueLabels.pending, tone: 'warn' };
}

export async function renderAdminInboxPage(
  clientOrRepo: any,
  options: { status?: string; selectedId?: string; siteName?: string; answeringEnabled?: boolean; nonce?: string } = {}
): Promise<string> {
  const activeStatus = options.status === 'approved' || options.status === 'rejected' ? options.status : 'pending';
  let items: any[] = [];
  try {
    if (clientOrRepo?.inbox?.list) {
      items = (await clientOrRepo.inbox.list(activeStatus))?.escalations ?? [];
    } else if (clientOrRepo?.getEscalations) {
      items = (await clientOrRepo.getEscalations(activeStatus)) ?? [];
    }
  } catch { items = []; }

  let selectedItem: any = options.selectedId ? items.find((e) => String(e.id) === String(options.selectedId)) : null;
  if (options.selectedId && !selectedItem && clientOrRepo?.getEscalations) {
    const all = (await clientOrRepo.getEscalations()) ?? [];
    selectedItem = all.find((e: any) => String(e.id) === String(options.selectedId)) ?? null;
  }

  const filterBar = `<div class="lp-entries-filters" role="group" aria-label="Inbox status filters">
    <a id="inbox-filter-pending" href="/admin/inbox?status=pending" class="lp-btn lp-btn-sm ${activeStatus === 'pending' ? 'lp-btn-primary' : 'lp-btn-secondary'}">${escapeHtml(INBOX_STRINGS.inbox.filters.pending)}</a>
    <a id="inbox-filter-approved" href="/admin/inbox?status=approved" class="lp-btn lp-btn-sm ${activeStatus === 'approved' ? 'lp-btn-primary' : 'lp-btn-secondary'}">${escapeHtml(INBOX_STRINGS.inbox.filters.approved)}</a>
    <a id="inbox-filter-rejected" href="/admin/inbox?status=rejected" class="lp-btn lp-btn-sm ${activeStatus === 'rejected' ? 'lp-btn-primary' : 'lp-btn-secondary'}">${escapeHtml(INBOX_STRINGS.inbox.filters.rejected)}</a>
  </div>`;

  const listHtml = items.length > 0
    ? `<ul class="lp-history-list">${items
        .map((item) => {
          const id = String(item.id);
          const due = getDueBadge(item);
          const dateLabel = item.created_at ? String(item.created_at).slice(0, 10) : '';
          return `<li class="lp-card lp-history-row" data-inbox-row="${escapeHtml(id)}">
            <div class="lp-history-row-header">
              <a href="/admin/inbox/${encodeURIComponent(id)}" class="lp-type-body"><strong>${escapeHtml(String(item.question || 'Untitled question'))}</strong></a>
              <div class="lp-history-meta">
                ${dateLabel ? `<span class="lp-type-body-sm">${escapeHtml(dateLabel)}</span>` : ''}
                ${renderBadge({ label: due.label, tone: due.tone })}
              </div>
            </div>
          </li>`;
        })
        .join('')}</ul>`
    : renderEmptyState({ id: 'inbox-empty', headingTag: 'h2', title: INBOX_STRINGS.inbox.emptyTitle, body: INBOX_STRINGS.inbox.emptyBody });

  const detailHtml = selectedItem
    ? `<section class="lp-card lp-history-row" id="inbox-detail-card" data-escalation-id="${escapeHtml(String(selectedItem.id))}">
        <div class="lp-history-row-header">
          <a href="/admin/inbox" class="lp-btn lp-btn-ghost lp-btn-sm">&larr; ${escapeHtml(INBOX_STRINGS.inbox.detailBack)}</a>
          ${renderBadge({ label: getDueBadge(selectedItem).label, tone: getDueBadge(selectedItem).tone })}
        </div>
        <h2 class="lp-type-h2">${escapeHtml(INBOX_STRINGS.inbox.questionHeading)}</h2>
        <p class="lp-type-body">${escapeHtml(String(selectedItem.question || ''))}</p>
        ${selectedItem.draft ? `<p class="lp-field-help"><strong>${escapeHtml(INBOX_STRINGS.inbox.draftHeading)}:</strong> ${escapeHtml(String(selectedItem.draft))}</p>` : ''}
        <div class="lp-field">
          <label for="inbox-reply-text" class="lp-field-label">${escapeHtml(INBOX_STRINGS.inbox.replyLabel)}</label>
          <textarea id="inbox-reply-text" class="lp-textarea" rows="4" placeholder="${escapeHtml(INBOX_STRINGS.inbox.replyPlaceholder)}">${escapeHtml(String(selectedItem.final || selectedItem.draft || ''))}</textarea>
        </div>
        <div class="lp-stack-md">
          <div class="lp-row-wrap">
            <button type="button" id="inbox-btn-reply" class="lp-btn lp-btn-primary lp-btn-sm">${escapeHtml(INBOX_STRINGS.inbox.sendReply)}</button>
          </div>
          <div class="lp-inbox-decline-row">
            <input id="inbox-decline-reason" type="text" class="lp-input" placeholder="${escapeHtml(INBOX_STRINGS.inbox.declinePlaceholder)}" aria-label="${escapeHtml(INBOX_STRINGS.inbox.declineLabel)}" />
            <button type="button" id="inbox-btn-decline" class="lp-btn lp-btn-secondary lp-btn-sm">${escapeHtml(INBOX_STRINGS.inbox.declineButton)}</button>
          </div>
        </div>
        <div id="inbox-make-rule-card" class="lp-card lp-inspector-suggested lp-history-row" hidden>
          <h3 class="lp-type-h3">${escapeHtml(INBOX_STRINGS.inbox.makeRuleTitle)}</h3>
          <p class="lp-field-help">${escapeHtml(INBOX_STRINGS.inbox.makeRuleBody)}</p>
          <input id="inbox-rule-text" type="text" class="lp-input" placeholder="${escapeHtml(INBOX_STRINGS.inbox.makeRulePlaceholder)}" value="${escapeHtml(String(selectedItem.question || ''))}" />
          <div class="lp-history-meta">
            <button type="button" id="inbox-btn-make-rule" class="lp-btn lp-btn-primary lp-btn-sm">${escapeHtml(INBOX_STRINGS.inbox.makeRuleConfirm)}</button>
            <button type="button" id="inbox-btn-dismiss-rule" class="lp-btn lp-btn-ghost lp-btn-sm">${escapeHtml(INBOX_STRINGS.inbox.makeRuleDismiss)}</button>
          </div>
        </div>
      </section>`
    : '';

  const content = `<div class="lp-admin-section">
    <div>
      <h1 class="lp-type-h1">${escapeHtml(INBOX_STRINGS.inbox.title)}</h1>
      <p class="lp-field-help">${escapeHtml(INBOX_STRINGS.inbox.subtitle)}</p>
    </div>
    ${renderStatusLine({ id: 'inbox-status-line' })}
    ${detailHtml || `${filterBar}${listHtml}`}
  </div>
  <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
    ${ADMIN_API_CLIENT_SCRIPT}
    (function () {
      var detail = document.getElementById('inbox-detail-card');
      if (!detail) return;
      var escId = detail.getAttribute('data-escalation-id');
      var statusEl = document.getElementById('inbox-status-line');
      var setStatus = function (msg) { if (statusEl) { statusEl.textContent = msg; } };
      var replyBtn = document.getElementById('inbox-btn-reply');
      var declineBtn = document.getElementById('inbox-btn-decline');
      var ruleCard = document.getElementById('inbox-make-rule-card');
      var makeRuleBtn = document.getElementById('inbox-btn-make-rule');
      var dismissRuleBtn = document.getElementById('inbox-btn-dismiss-rule');

      replyBtn && replyBtn.addEventListener('click', async function () {
        var text = (document.getElementById('inbox-reply-text') || {}).value || '';
        var res = await apiClient('/api/inbox/' + encodeURIComponent(escId) + '/approve', { method: 'PATCH', body: JSON.stringify({ finalReply: text }) });
        if (!res || !res.ok) { setStatus(${JSON.stringify(INBOX_STRINGS.inbox.errorStatus)}); return; }
        setStatus(${JSON.stringify(INBOX_STRINGS.inbox.repliedStatus)});
        if (ruleCard) ruleCard.hidden = false;
      });

      declineBtn && declineBtn.addEventListener('click', async function () {
        var reason = (document.getElementById('inbox-decline-reason') || {}).value || '';
        var res = await apiClient('/api/inbox/' + encodeURIComponent(escId) + '/reject', { method: 'PATCH', body: JSON.stringify({ reason: reason }) });
        if (!res || !res.ok) { setStatus(${JSON.stringify(INBOX_STRINGS.inbox.errorStatus)}); return; }
        setStatus(${JSON.stringify(INBOX_STRINGS.inbox.declinedStatus)});
        if (ruleCard) ruleCard.hidden = false;
      });

      makeRuleBtn && makeRuleBtn.addEventListener('click', async function () {
        var quote = (document.getElementById('inbox-rule-text') || {}).value || '';
        var res = await apiClient('/api/audit/scoped-constraints', {
          method: 'POST',
          body: JSON.stringify({ constraint: { guidance: quote }, source_escalation: escId, source_quote: quote }),
        });
        if (!res || !res.ok) { setStatus(${JSON.stringify(INBOX_STRINGS.inbox.errorStatus)}); return; }
        if (ruleCard) ruleCard.hidden = true;
        setStatus(${JSON.stringify(INBOX_STRINGS.inbox.ruleSavedStatus)});
      });

      dismissRuleBtn && dismissRuleBtn.addEventListener('click', function () { if (ruleCard) ruleCard.hidden = true; });
    })();
  </script>`;

  return renderAdminShell(INBOX_STRINGS.inbox.title, '/admin/inbox', content, { siteName: options.siteName, answeringEnabled: options.answeringEnabled, nonce: options.nonce });
}
