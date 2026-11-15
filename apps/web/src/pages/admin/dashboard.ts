import { renderAdminShell } from '../../layouts/admin-shell.js';
import { renderButton, renderChip, renderPageNotice } from '../../components/index.js';
import { adaptDataSource, type WebDataClient } from '../../lib/data-source.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { escapeHtml } from '../../lib/html.js';
import { DASHBOARD_STRINGS } from '../../strings/admin/dashboard.js';

export interface DashboardOptions {
  nonce?: string;
  siteName?: string;
  answeringEnabled?: boolean;
  checklistDismissed?: boolean;
  pendingInboxCount?: number;
  draftCount?: number;
  buildFailed?: boolean;
  backupOverdue?: boolean;
}

interface AttentionItem {
  id: string;
  tone: 'warn' | 'danger' | 'info';
  badge: string;
  summary: string;
  actionLabel: string;
  actionHref: string;
}

export async function renderAdminDashboardPage(
  client: WebDataClient,
  options: DashboardOptions = {}
): Promise<string> {
  const ds = adaptDataSource(client);
  const allEntries = await ds.listEntries({ includePrivate: true });
  const draftCount =
    options.draftCount ??
    allEntries.filter((e) => e.visibility === 'private').length;
  const pendingInboxCount = options.pendingInboxCount ?? 0;
  const buildFailed = Boolean(options.buildFailed);
  const backupOverdue = options.backupOverdue ?? false;

  const items: AttentionItem[] = [];
  if (buildFailed) {
    items.push({
      id: 'att-build-failed',
      tone: 'danger',
      badge: 'Build',
      summary: DASHBOARD_STRINGS.attention.buildFailureLabel,
      actionLabel: DASHBOARD_STRINGS.attention.buildFailureAction,
      actionHref: '/admin/settings',
    });
  }
  if (pendingInboxCount > 0) {
    items.push({
      id: 'att-inbox',
      tone: 'warn',
      badge: 'Inbox',
      summary: DASHBOARD_STRINGS.attention.questionsDueLabel(pendingInboxCount),
      actionLabel: DASHBOARD_STRINGS.attention.questionsDueAction,
      actionHref: '/admin/inbox',
    });
  }
  if (draftCount > 0) {
    items.push({
      id: 'att-drafts',
      tone: 'info',
      badge: 'Drafts',
      summary: DASHBOARD_STRINGS.attention.draftsLabel(draftCount),
      actionLabel: DASHBOARD_STRINGS.attention.draftsAction,
      actionHref: '/admin',
    });
  }
  if (backupOverdue) {
    items.push({
      id: 'att-backup',
      tone: 'warn',
      badge: 'Backup',
      summary: DASHBOARD_STRINGS.attention.backupOverdueLabel,
      actionLabel: DASHBOARD_STRINGS.attention.backupOverdueAction,
      actionHref: '/admin/settings',
    });
  }

  const attentionHtml = items.length
    ? `<ul id="today-attention-list" class="lp-dashboard-list">
${items
  .map(
    (item) => `<li id="${escapeHtml(item.id)}" class="lp-dashboard-item">
  <div class="lp-dashboard-item-meta">
    ${renderChip({ label: item.badge, kind: 'status' })}
    <span>${escapeHtml(item.summary)}</span>
  </div>
  <a href="${escapeHtml(item.actionHref)}" class="lp-btn lp-btn-secondary lp-btn-sm">${escapeHtml(item.actionLabel)}</a>
</li>`
  )
  .join('\n')}
</ul>`
    : `<div id="today-attention-list">${renderPageNotice({
        tone: 'ok',
        message: DASHBOARD_STRINGS.attention.empty,
      })}</div>`;

  const checklistHtml = options.checklistDismissed
    ? ''
    : `<section id="today-checklist-card" class="lp-dashboard-card" aria-labelledby="today-checklist-heading">
  <div class="lp-dashboard-card-header">
    <h2 id="today-checklist-heading" class="lp-dashboard-card-title">${escapeHtml(DASHBOARD_STRINGS.checklist.heading)}</h2>
    ${renderButton({
      id: 'btn-dismiss-today-checklist',
      label: DASHBOARD_STRINGS.checklist.dismissLabel,
      variant: 'quiet',
      size: 'sm',
    })}
  </div>
  <ol class="lp-dashboard-checklist">
    ${DASHBOARD_STRINGS.checklist.steps
      .map(
        (step) => `<li id="${escapeHtml(step.id)}"><a href="${escapeHtml(step.href)}">${escapeHtml(step.label)}</a></li>`
      )
      .join('')}
  </ol>
</section>`;

  const exp = DASHBOARD_STRINGS.explanation;
  const content = `<div class="lp-dashboard-stack">
  <header class="lp-dashboard-header">
    <h1 class="lp-type-title">${escapeHtml(DASHBOARD_STRINGS.heading)}</h1>
    <p class="lp-field-help">${escapeHtml(DASHBOARD_STRINGS.lead)}</p>
  </header>

  <section id="today-explanation" class="lp-dashboard-explain" aria-label="How Today works">
    <dl class="lp-dashboard-explain-grid">
      <div><dt>What</dt><dd>${escapeHtml(exp.what)}</dd></div>
      <div><dt>When</dt><dd>${escapeHtml(exp.when)}</dd></div>
      <div><dt>How</dt><dd>${escapeHtml(exp.how)}</dd></div>
      <div><dt>Impact</dt><dd>${escapeHtml(exp.impact)}</dd></div>
    </dl>
  </section>

  ${checklistHtml}

  <section class="lp-dashboard-card" aria-labelledby="today-attention-heading">
    <h2 id="today-attention-heading" class="lp-dashboard-card-title">${escapeHtml(DASHBOARD_STRINGS.attention.heading)}</h2>
    ${attentionHtml}
  </section>
</div>
<script>
(function() {
  ${ADMIN_API_CLIENT_SCRIPT}
  const dismissBtn = document.getElementById('btn-dismiss-today-checklist');
  const card = document.getElementById('today-checklist-card');
  if (dismissBtn && card) {
    dismissBtn.addEventListener('click', async function() {
      dismissBtn.disabled = true;
      try {
        await apiClient('/api/settings/dashboard', {
          method: 'PATCH',
          body: JSON.stringify({ checklistDismissed: true }),
        });
        card.setAttribute('hidden', '');
      } catch (_err) {
        dismissBtn.disabled = false;
      }
    });
  }
})();
</script>`;

  return renderAdminShell(DASHBOARD_STRINGS.pageTitle, '/admin/today', content, {
    nonce: options.nonce,
    siteName: options.siteName,
    answeringEnabled: options.answeringEnabled,
  });
}
