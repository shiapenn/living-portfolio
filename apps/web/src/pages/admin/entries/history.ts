import { escapeHtml } from '../../../lib/html.js';
import { renderAdminShell, renderPageTemplate } from '../../../layouts/admin-shell.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../../lib/admin-api-client.js';
import { renderItem } from '../../../primitives/index.js';
import { renderEmptyState, renderStatusLine } from '../../../components/index.js';
import { INSPECTOR_STRINGS } from '../../../strings/admin/inspector.js';

/**
 * Strip Markdown syntax markers for plain-text revision excerpts (D-LAYOUT #11).
 */
export function stripMarkdownMarkers(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/(\*\*|__|\*|_|~~)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function renderEntryHistoryPage(
  clientOrRepo: any,
  entryId: string,
  options: { siteName?: string; answeringEnabled?: boolean; nonce?: string } = {}
): Promise<string | null> {
  if (!entryId || entryId === 'new') return null;

  let entry: any = null;
  let revisions: any[] = [];
  try {
    if (typeof clientOrRepo?.getEntry === 'function') {
      const res = await clientOrRepo.getEntry(entryId, ['private', 'unlisted', 'public']);
      if (res) {
        entry = res.entry;
        revisions = Array.isArray(res.revisions) ? res.revisions : [];
      }
    } else if (typeof clientOrRepo?.entries?.get === 'function') {
      const res = await clientOrRepo.entries.get(entryId);
      entry = res?.entry ?? res;
      revisions = Array.isArray(res?.revisions) ? res.revisions : [];
    }
  } catch {
    return null;
  }
  if (!entry) return null;

  if (revisions.length === 0 && clientOrRepo?.getRevisions) {
    revisions = (await clientOrRepo.getRevisions(entryId)) ?? [];
  }

  const rowsHtml = revisions.length > 0
    ? `<div class="lp-list">${revisions
        .map((rev, idx) => {
          const revId = String(rev.id ?? idx);
          const bodyMd = String(rev.body_md ?? '');
          const rawValidFrom = String(rev.valid_from ?? '');
          const validFrom = String(rev.valid_from ?? rev.created_at ?? '').slice(0, 10);
          const temporalLevel = String(rev.temporal_level ?? 'exact');
          const plain = stripMarkdownMarkers(bodyMd);
          const preview = plain.length > 160 ? `${plain.slice(0, 160)}…` : plain;
          const dateLabel = validFrom || 'Revision';
          const stateLabel = idx === 0 ? INSPECTOR_STRINGS.historyPage.currentBadge : temporalLevel;
          return renderItem({
            title: preview || '(Empty body)',
            subtitle: idx === 0 ? `${temporalLevel} · ${INSPECTOR_STRINGS.historyPage.currentBadge}` : temporalLevel,
            meta: dateLabel,
            statusLabel: stateLabel,
            statusTone: idx === 0 ? 'ok' : 'neutral',
            actions: {
              secondary: {
                label: INSPECTOR_STRINGS.historyPage.restoreButton,
                variant: 'secondary',
                size: 'sm',
                dataAttrs: {
                  'restore-rev': revId,
                  'body-md': bodyMd,
                  'valid-from': rawValidFrom,
                  'temporal-level': temporalLevel,
                },
              },
            },
            attributes: `data-revision-row="${escapeHtml(revId)}"`,
          });
        })
        .join('')}</div>`
    : renderEmptyState({
        id: 'history-empty',
        title: INSPECTOR_STRINGS.historyPage.emptyTitle,
        body: INSPECTOR_STRINGS.historyPage.emptyBody,
      });

  const bodyHtml = `
    ${renderStatusLine({ id: 'history-status' })}
    <div id="history-list-container" data-entry-id="${escapeHtml(entryId)}">${rowsHtml}</div>
    <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
      ${ADMIN_API_CLIENT_SCRIPT}
      (function () {
        var container = document.getElementById('history-list-container');
        var statusEl = document.getElementById('history-status');
        if (!container) return;
        var entryId = container.getAttribute('data-entry-id');
        container.addEventListener('click', async function (e) {
          var btn = e.target && e.target.closest ? e.target.closest('button[data-restore-rev]') : null;
          if (!btn || !entryId) return;
          btn.disabled = true;
          try {
            var res = await apiClient('/api/entries/' + encodeURIComponent(entryId) + '/revisions', {
              method: 'POST',
              body: JSON.stringify({
                entry_id: entryId,
                body_md: btn.getAttribute('data-body-md') || '',
                valid_from: btn.getAttribute('data-valid-from') || undefined,
                temporal_level: btn.getAttribute('data-temporal-level') || 'exact',
              }),
            });
            if (!res || !res.ok) {
              if (statusEl) {
                statusEl.textContent = ${JSON.stringify(INSPECTOR_STRINGS.historyPage.restoreError)};
                statusEl.hidden = false;
              }
              btn.disabled = false;
              return;
            }
            window.location.reload();
          } catch (_err) {
            if (statusEl) {
              statusEl.textContent = ${JSON.stringify(INSPECTOR_STRINGS.historyPage.restoreError)};
              statusEl.hidden = false;
            }
            btn.disabled = false;
          }
        });
      })();
    </script>`;

  const content = renderPageTemplate({
    title: `${INSPECTOR_STRINGS.historyPage.titlePrefix}: ${String(entry.title || 'Untitled')}`,
    description: INSPECTOR_STRINGS.historyPage.subtitle,
    backHref: `/admin/entries/${encodeURIComponent(entryId)}`,
    backLabel: INSPECTOR_STRINGS.historyPage.backToEntry,
    bodyHtml,
  });

  return renderAdminShell(
    `${INSPECTOR_STRINGS.historyPage.titlePrefix} · ${String(entry.title || 'Entry')}`,
    '/admin/entries',
    content,
    {
      siteName: options.siteName,
      answeringEnabled: options.answeringEnabled,
      nonce: options.nonce,
    }
  );
}
