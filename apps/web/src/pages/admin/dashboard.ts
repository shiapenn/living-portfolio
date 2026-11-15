import { renderAdminShell } from '../../layouts/admin-shell.js';
import { renderBadge, renderButton, renderStatusDot } from '../../primitives/index.js';
import { renderPageNotice } from '../../components/index.js';
import { adaptDataSource, type WebDataClient } from '../../lib/data-source.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { escapeHtml } from '../../lib/html.js';
import { DASHBOARD_STRINGS } from '../../strings/admin/dashboard.js';
import { EDITOR_STRINGS } from '../../strings/admin/editor.js';

export interface DashboardOptions {
  nonce?: string;
  siteName?: string;
  answeringEnabled?: boolean;
  checklistDismissed?: boolean;
  pendingInboxCount?: number;
  draftCount?: number;
  buildFailed?: boolean;
  backupOverdue?: boolean;
  legacyRecoveryUsed?: boolean;
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
    ${renderStatusDot({ label: item.badge, tone: 'warn' })}
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

  const answeringOn = options.answeringEnabled ?? true;
  const killLabel = answeringOn
    ? EDITOR_STRINGS.safety.killSwitchPauseBtn
    : EDITOR_STRINGS.safety.killSwitchResumeBtn;
  const killStateLabel = answeringOn
    ? EDITOR_STRINGS.safety.killSwitchActive
    : EDITOR_STRINGS.safety.killSwitchPaused;

  const content = `<div class="lp-dashboard-stack">
  <header class="lp-dashboard-header">
    <h1 class="lp-type-title">${escapeHtml(DASHBOARD_STRINGS.heading)}</h1>
    <p class="lp-field-help">${escapeHtml(DASHBOARD_STRINGS.lead)}</p>
  </header>

  <section class="lp-dashboard-card" aria-label="${escapeHtml(EDITOR_STRINGS.safety.killSwitchTitle)}">
    <div class="lp-killswitch-row">
      <div class="lp-killswitch-copy">
        <span class="lp-type-body-sm">${escapeHtml(EDITOR_STRINGS.safety.killSwitchTitle)}</span>
        ${renderBadge({
          id: 'ref-killswitch-badge',
          label: killStateLabel,
          tone: answeringOn ? 'ok' : 'warn',
        })}
      </div>
      <button type="button" id="btn-killswitch" class="lp-btn lp-btn-secondary lp-btn-sm" aria-pressed="${answeringOn ? 'true' : 'false'}">${escapeHtml(killLabel)}</button>
    </div>
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
  const killBtn = document.getElementById('btn-killswitch');
  const killBadge = document.getElementById('ref-killswitch-badge');
  if (killBtn) {
    killBtn.addEventListener('click', async function() {
      const currentlyEnabled = killBtn.getAttribute('aria-pressed') === 'true';
      const nextEnabled = !currentlyEnabled;
      const res = await apiClient('/api/settings/routing', {
        method: 'PATCH',
        body: JSON.stringify({ automatedAnsweringEnabled: nextEnabled }),
      });
      if (!res || !res.ok) return;
      killBtn.setAttribute('aria-pressed', nextEnabled ? 'true' : 'false');
      killBtn.textContent = nextEnabled
        ? ${JSON.stringify(EDITOR_STRINGS.safety.killSwitchPauseBtn)}
        : ${JSON.stringify(EDITOR_STRINGS.safety.killSwitchResumeBtn)};
      if (killBadge) {
        killBadge.textContent = nextEnabled
          ? ${JSON.stringify(EDITOR_STRINGS.safety.killSwitchActive)}
          : ${JSON.stringify(EDITOR_STRINGS.safety.killSwitchPaused)};
        killBadge.className = nextEnabled ? 'lp-badge lp-badge-ok' : 'lp-badge lp-badge-warn';
      }
    });
  }
})();
</script>`;

  return renderAdminShell(DASHBOARD_STRINGS.pageTitle, '/admin/today', content, {
    nonce: options.nonce,
    siteName: options.siteName,
    answeringEnabled: options.answeringEnabled,
    legacyRecoveryUsed: options.legacyRecoveryUsed,
  });
}
