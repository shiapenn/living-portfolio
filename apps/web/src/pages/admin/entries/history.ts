import { formatAdminDateTime } from '@living-portfolio/ui-core';
import { escapeHtml } from '../../../lib/html.js';
import { renderAdminShell, renderPageTemplate } from '../../../layouts/admin-shell.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../../lib/admin-api-client.js';
import { renderActionBar, renderItem, renderList, renderOverlay } from '../../../primitives/index.js';
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
  if (revisions.length > 1) {
    const firstTs = String(revisions[0]?.created_at ?? revisions[0]?.valid_from ?? '');
    const lastTs = String(revisions[revisions.length - 1]?.created_at ?? revisions[revisions.length - 1]?.valid_from ?? '');
    if (firstTs <= lastTs) {
      revisions = [...revisions].reverse();
    }
  }

  const rowsHtml = revisions.length > 0
    ? renderList({
        id: 'history-list',
        variant: 'plain',
        itemsHtml: revisions
          .map((rev, idx) => {
            const revId = String(rev.id ?? idx);
            const bodyMd = String(rev.body_md ?? '');
            const rawValidFrom = String(rev.valid_from ?? '');
            const temporalLevel = String(rev.temporal_level ?? 'exact');
            const rawDate = String(rev.valid_from ?? rev.created_at ?? '');
            const dateLabel = rawDate ? formatAdminDateTime(rawDate) : 'Revision';
            const plain = stripMarkdownMarkers(bodyMd);
            const preview = plain.length > 160 ? `${plain.slice(0, 160)}…` : plain;
            const stateLabel = idx === 0 ? INSPECTOR_STRINGS.historyPage.currentBadge : undefined;
            return renderItem({
              title: dateLabel,
              subtitle: preview || '(Empty body)',
              statusLabel: stateLabel,
              statusTone: idx === 0 ? 'ok' : 'neutral',
              actions: idx === 0
                ? undefined
                : {
                    level: 'item',
                    secondary: {
                      label: 'Restore',
                      ariaLabel: `Restore version from ${dateLabel}`,
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
          .join(''),
      })
    : renderEmptyState({
        id: 'history-empty',
        title: INSPECTOR_STRINGS.historyPage.emptyTitle,
        body: INSPECTOR_STRINGS.historyPage.emptyBody,
      });

  const restoreDialogHtml = renderOverlay({
    id: 'history-restore-dialog',
    kind: 'dialog',
    title: 'Restore revision',
    open: false,
    bodyHtml: '<p>Restore this revision as a new draft revision? Your previous revisions remain in history.</p>',
    footerHtml: renderActionBar({
      level: 'dialog',
      primary: { id: 'history-restore-confirm', label: 'Restore', variant: 'primary', size: 'sm' },
      secondary: { id: 'history-restore-cancel', label: 'Cancel', variant: 'secondary', size: 'sm', dataAttrs: { 'overlay-close': 'true' } },
    }),
  });

  const bodyHtml = `
    ${renderStatusLine({ id: 'history-status' })}
    <div id="history-list-container" data-entry-id="${escapeHtml(entryId)}">${rowsHtml}</div>
    ${restoreDialogHtml}
    <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
      ${ADMIN_API_CLIENT_SCRIPT}
      (function () {
        var container = document.getElementById('history-list-container');
        var statusEl = document.getElementById('history-status');
        var dialog = document.getElementById('history-restore-dialog');
        var confirmBtn = document.getElementById('history-restore-confirm');
        if (!container) return;
        var entryId = container.getAttribute('data-entry-id');
        var pendingBtn = null;

        var doRestore = async function (btn) {
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
        };

        if (dialog) {
          dialog.addEventListener('click', function (e) {
            if (e.target === dialog || (e.target && e.target.closest && e.target.closest('[data-overlay-close]'))) {
              dialog.setAttribute('hidden', '');
              if (pendingBtn) pendingBtn.focus();
              pendingBtn = null;
            }
          });
        }
        if (confirmBtn) {
          confirmBtn.addEventListener('click', function () {
            if (dialog) dialog.setAttribute('hidden', '');
            var btn = pendingBtn;
            pendingBtn = null;
            doRestore(btn);
          });
        }

        container.addEventListener('click', function (e) {
          var btn = e.target && e.target.closest ? e.target.closest('button[data-restore-rev]') : null;
          if (!btn || !entryId) return;
          if (dialog && confirmBtn) {
            pendingBtn = btn;
            dialog.removeAttribute('hidden');
            confirmBtn.focus();
          } else {
            doRestore(btn);
          }
        });
      })();
    </script>`;

  const content = renderPageTemplate({
    title: INSPECTOR_STRINGS.historyPage.titlePrefix,
    description: String(entry.title || 'Untitled'),
    archetype: 'list',
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
