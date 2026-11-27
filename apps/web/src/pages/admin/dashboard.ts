import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { renderFormSection, renderIconButton, renderItem, renderList, renderText } from '../../primitives/index.js';
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
  storageUsagePct?: number;
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
  let storageUsagePct = options.storageUsagePct;
  if (storageUsagePct === undefined && typeof (client as any).getTotalMediaBytes === 'function') {
    try {
      const used = await (client as any).getTotalMediaBytes();
      const quota = Number(process.env.MEDIA_MAX_TOTAL_BYTES || 5 * 1024 * 1024 * 1024);
      if (quota > 0) storageUsagePct = Math.round((used / quota) * 100);
    } catch {
      // Ignore optional media usage probe
    }
  }
  if (typeof storageUsagePct === 'number' && storageUsagePct >= 80) {
    items.push({
      id: 'att-storage-quota',
      tone: storageUsagePct >= 95 ? 'danger' : 'warn',
      badge: 'Storage',
      summary: `Storage is ${storageUsagePct}% full · Manage storage`,
      actionHref: '/admin/settings/storage',
    });
  }

  const attentionHtml = items.length
    ? renderList({
        id: 'today-attention-list',
        variant: 'interactive',
        itemsHtml: items
          .map((item) =>
            renderItem({
              id: item.id,
              href: item.actionHref,
              title: item.summary,
              showChevron: true,
            })
          )
          .join('\n'),
      })
    : renderText({ id: 'today-attention-list', variant: 'description', className: 'lp-page-description', text: 'Nothing needs your attention.' });

  const attentionSectionHtml = renderFormSection({
    id: 'today-attention-section',
    headerId: 'today-attention-heading',
    title: DASHBOARD_STRINGS.attention.heading,
    attributes: 'aria-labelledby="today-attention-heading"',
    fieldsHtml: attentionHtml,
  });

  const checklistHtml = options.checklistDismissed
    ? ''
    : renderFormSection({
        id: 'today-checklist-card',
        headerId: 'today-checklist-heading',
        title: DASHBOARD_STRINGS.checklist.heading,
        attributes: 'aria-labelledby="today-checklist-heading"',
        headerActionHtml: renderIconButton({
          id: 'btn-dismiss-today-checklist',
          ariaLabel: DASHBOARD_STRINGS.checklist.dismissLabel,
          title: DASHBOARD_STRINGS.checklist.dismissLabel,
          icon: 'close',
          iconSize: 16,
          variant: 'quiet',
        }),
        fieldsHtml: renderList({
          id: 'today-checklist-list',
          variant: 'interactive',
          itemsHtml: DASHBOARD_STRINGS.checklist.steps
            .map((step) =>
              renderItem({
                id: step.id,
                href: step.href,
                title: step.label,
                showChevron: true,
              })
            )
            .join(''),
        }),
      });

  const bodyHtml = `
  ${attentionSectionHtml}

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
    archetype: 'dashboard',
    bodyHtml,
  });

  return renderAdminShell(DASHBOARD_STRINGS.pageTitle, '/admin/today', content, {
    nonce: options.nonce,
    siteName: options.siteName,
    answeringEnabled: options.answeringEnabled,
    legacyRecoveryUsed: options.legacyRecoveryUsed,
  });
}
