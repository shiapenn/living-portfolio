import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { renderIconButton, renderListRow, renderStatusDot } from '../../primitives/index.js';
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
      actionHref: '/admin/settings/backups',
    });
  }
  if (pendingInboxCount > 0) {
    items.push({
      id: 'att-inbox',
      tone: 'warn',
      badge: 'Inbox',
      summary: DASHBOARD_STRINGS.attention.questionsDueLabel(pendingInboxCount),
      actionHref: '/admin/inbox',
    });
  }
  if (draftCount > 0) {
    items.push({
      id: 'att-drafts',
      tone: 'info',
      badge: 'Drafts',
      summary: DASHBOARD_STRINGS.attention.draftsLabel(draftCount),
      actionHref: '/admin/entries',
    });
  }
  if (backupOverdue) {
    items.push({
      id: 'att-backup',
      tone: 'warn',
      badge: 'Backup',
      summary: DASHBOARD_STRINGS.attention.backupOverdueLabel,
      actionHref: '/admin/settings/backups',
    });
  }

  const attentionHtml = items.length
    ? `<div id="today-attention-list" class="lp-list">
${items
  .map((item) =>
    renderListRow({
      id: item.id,
      href: item.actionHref,
      primary: item.summary,
      stateLabel: item.badge,
      stateTone: item.tone === 'danger' ? 'danger' : item.tone === 'warn' ? 'warn' : 'neutral',
    })
  )
  .join('\n')}
</div>`
    : `<div id="today-attention-list">${renderPageNotice({
        tone: 'ok',
        message: DASHBOARD_STRINGS.attention.empty,
      })}</div>`;

  const checklistHtml = options.checklistDismissed
    ? ''
    : `<section id="today-checklist-card" aria-labelledby="today-checklist-heading">
  <div class="lp-page-title-row">
    <h2 id="today-checklist-heading" class="lp-section-title">${escapeHtml(DASHBOARD_STRINGS.checklist.heading)}</h2>
    ${renderIconButton({
      id: 'btn-dismiss-today-checklist',
      ariaLabel: DASHBOARD_STRINGS.checklist.dismissLabel,
      title: DASHBOARD_STRINGS.checklist.dismissLabel,
      icon: 'x',
      iconSize: 16,
      variant: 'quiet',
    })}
  </div>
  <div class="lp-list">
    ${DASHBOARD_STRINGS.checklist.steps
      .map((step) =>
        renderListRow({
          id: step.id,
          href: step.href,
          primary: step.label,
        })
      )
      .join('')}
  </div>
</section>`;

  const answeringOn = options.answeringEnabled ?? true;
  const killLabel = answeringOn
    ? EDITOR_STRINGS.safety.killSwitchPauseBtn
    : EDITOR_STRINGS.safety.killSwitchResumeBtn;
  const killStateLabel = answeringOn
    ? EDITOR_STRINGS.safety.killSwitchActive
    : EDITOR_STRINGS.safety.killSwitchPaused;

  const answeringTrailing = `<span id="ref-killswitch-badge">${renderStatusDot({
    label: killStateLabel,
    tone: answeringOn ? 'ok' : 'warn',
  })}</span><button type="button" id="btn-killswitch" class="lp-btn lp-btn-secondary lp-btn-sm" aria-pressed="${answeringOn ? 'true' : 'false'}">${escapeHtml(killLabel)}</button>`;

  const bodyHtml = `
  <section aria-label="${escapeHtml(EDITOR_STRINGS.safety.killSwitchTitle)}">
    <div class="lp-list">
      ${renderListRow({
        primary: EDITOR_STRINGS.safety.killSwitchTitle,
        trailingHtml: answeringTrailing,
      })}
    </div>
  </section>

  <section aria-labelledby="today-attention-heading">
    <h2 id="today-attention-heading" class="lp-section-title">${escapeHtml(DASHBOARD_STRINGS.attention.heading)}</h2>
    ${attentionHtml}
  </section>

  ${checklistHtml}
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
        const toneClass = nextEnabled ? 'lp-status-dot lp-status-dot-ok' : 'lp-status-dot lp-status-dot-warn';
        const txt = nextEnabled
          ? ${JSON.stringify(EDITOR_STRINGS.safety.killSwitchActive)}
          : ${JSON.stringify(EDITOR_STRINGS.safety.killSwitchPaused)};
        killBadge.innerHTML = '<span class="' + toneClass + '" aria-hidden="true"></span>' + txt;
      }
    });
  }
})();
</script>`;

  const content = renderPageTemplate({
    title: DASHBOARD_STRINGS.heading,
    description: DASHBOARD_STRINGS.lead,
    bodyHtml,
  });

  return renderAdminShell(DASHBOARD_STRINGS.pageTitle, '/admin/today', content, {
    nonce: options.nonce,
    siteName: options.siteName,
    answeringEnabled: options.answeringEnabled,
    legacyRecoveryUsed: options.legacyRecoveryUsed,
  });
}
