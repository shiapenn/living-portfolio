import { escapeHtml } from '../../../lib/html.js';
import { renderAdminShell } from '../../../layouts/admin-shell.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../../lib/admin-api-client.js';
import { renderBadge } from '../../../primitives/index.js';
import { renderEmptyState, renderStatusLine } from '../../../components/index.js';
import { INSPECTOR_STRINGS } from '../../../strings/admin/inspector.js';

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
    ? `<ul class="lp-history-list">${revisions
        .map((rev, idx) => {
          const revId = String(rev.id ?? idx);
          const bodyMd = String(rev.body_md ?? '');
          const rawValidFrom = String(rev.valid_from ?? '');
          const validFrom = String(rev.valid_from ?? rev.created_at ?? '').slice(0, 10);
          const temporalLevel = String(rev.temporal_level ?? 'exact');
          const preview = bodyMd.length > 200 ? `${bodyMd.slice(0, 200)}…` : bodyMd;
          return `<li class="lp-card lp-history-row" data-revision-row="${escapeHtml(revId)}">
            <div class="lp-history-row-header">
              <div class="lp-history-meta">
                <strong>${escapeHtml(validFrom || 'Revision')}</strong>
                ${renderBadge({ label: temporalLevel, tone: 'neutral' })}
                ${idx === 0 ? renderBadge({ label: INSPECTOR_STRINGS.historyPage.currentBadge, tone: 'ok' }) : ''}
              </div>
              <button type="button" class="lp-btn lp-btn-secondary lp-btn-sm" data-restore-rev="${escapeHtml(revId)}" data-body-md="${escapeHtml(bodyMd)}" data-valid-from="${escapeHtml(rawValidFrom)}" data-temporal-level="${escapeHtml(temporalLevel)}">${escapeHtml(INSPECTOR_STRINGS.historyPage.restoreButton)}</button>
            </div>
            <p class="lp-type-body-sm">${escapeHtml(preview || '(Empty body)')}</p>
          </li>`;
        })
        .join('')}</ul>`
    : renderEmptyState({
        id: 'history-empty',
        title: INSPECTOR_STRINGS.historyPage.emptyTitle,
        body: INSPECTOR_STRINGS.historyPage.emptyBody,
      });

  const content = `<div class="lp-admin-section">
    <div class="lp-admin-header-row">
      <div>
        <a href="/admin/entries/${encodeURIComponent(entryId)}" class="lp-btn lp-btn-ghost lp-btn-sm">&larr; ${escapeHtml(INSPECTOR_STRINGS.historyPage.backToEntry)}</a>
        <h1 class="lp-type-h1">${escapeHtml(INSPECTOR_STRINGS.historyPage.titlePrefix)}: ${escapeHtml(String(entry.title || 'Untitled'))}</h1>
        <p class="lp-field-help">${escapeHtml(INSPECTOR_STRINGS.historyPage.subtitle)}</p>
      </div>
    </div>
    ${renderStatusLine({ id: 'history-status' })}
    <div id="history-list-container" data-entry-id="${escapeHtml(entryId)}">${rowsHtml}</div>
  </div>
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
