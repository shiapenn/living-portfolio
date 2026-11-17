import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { renderIconButton, renderItem, renderSectionHeader } from '../../primitives/index.js';
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
  pendingRulesCount?: number;
  buildFailed?: boolean;
  backupOverdue?: boolean;
  legacyRecoveryUsed?: boolean;
}

interface AttentionItem {
  id: string;
  tone: 'warn' | 'danger' | 'neutral';
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
  const pendingRulesCount = options.pendingRulesCount ?? 0;
  const buildFailed = Boolean(options.buildFailed);
  const backupOverdue = options.backupOverdue ?? false;
  const answeringOn = options.answeringEnabled ?? true;

  const items: AttentionItem[] = [];
  if (!answeringOn) {
    items.push({
      id: 'att-answering-paused',
      tone: 'warn',
      badge: 'Paused',
      summary: 'Automated answering is paused · Resume',
      actionHref: '/admin/status',
    });
  }
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
      tone: 'neutral',
      badge: 'Drafts',
      summary: DASHBOARD_STRINGS.attention.draftsLabel(draftCount),
      actionHref: '/admin/entries',
    });
  }
  if (pendingRulesCount > 0) {
    items.push({
      id: 'att-rules',
      tone: 'warn',
      badge: 'Rules',
      summary: `${pendingRulesCount} answer rule${pendingRulesCount === 1 ? '' : 's'} waiting for confirmation`,
      actionHref: '/admin/audit',
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
    renderItem({
      id: item.id,
      href: item.actionHref,
      title: item.summary,
      statusLabel: item.badge,
      statusTone: item.tone,
      showChevron: true,
    })
  )
  .join('\n')}
</div>`
    : `<p id="today-attention-list" class="lp-page-description">Nothing needs your attention.</p>`;

  const checklistHtml = options.checklistDismissed
    ? ''
    : `<section id="today-checklist-card" aria-labelledby="today-checklist-heading">
  ${renderSectionHeader({
    id: 'today-checklist-heading',
    title: DASHBOARD_STRINGS.checklist.heading,
    actionHtml: renderIconButton({
      id: 'btn-dismiss-today-checklist',
      ariaLabel: DASHBOARD_STRINGS.checklist.dismissLabel,
      title: DASHBOARD_STRINGS.checklist.dismissLabel,
      icon: 'close',
      iconSize: 16,
      variant: 'quiet',
    }),
  })}
  <div class="lp-list">
    ${DASHBOARD_STRINGS.checklist.steps
      .map((step) =>
        renderItem({
          id: step.id,
          href: step.href,
          title: step.label,
          showChevron: true,
        })
      )
      .join('')}
  </div>
</section>`;

  const bodyHtml = `
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
