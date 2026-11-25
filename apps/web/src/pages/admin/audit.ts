import { ADMIN_DATETIME_FORMATTER_SCRIPT, formatAdminDateTime } from '@living-portfolio/ui-core';
import { escapeHtml } from '../../lib/html.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { renderActionBar, renderItem, renderList, renderText } from '../../primitives/index.js';
import { renderEmptyState, renderStatusLine } from '../../components/index.js';
import { INBOX_STRINGS } from '../../strings/admin/inbox.js';

export async function renderAdminAuditRulesPage(
  clientOrRepo: any,
  options: { status?: string; siteName?: string; answeringEnabled?: boolean; nonce?: string; lastCheckedAt?: string | null } = {}
): Promise<string> {
  const activeStatus =
    options.status === 'confirmed' || options.status === 'revoked' || options.status === 'contradictions'
      ? options.status
      : 'proposed';

  let rules: any[] = [];
  let conflicts: any[] = [];
  if (activeStatus === 'contradictions') {
    try {
      if (clientOrRepo?.getTopologyReports) {
        conflicts = (await clientOrRepo.getTopologyReports()) ?? [];
      }
    } catch { conflicts = []; }
  } else {
    try {
      if (clientOrRepo?.audit?.listRules) {
        rules = (await clientOrRepo.audit.listRules(activeStatus))?.constraints ?? [];
      } else if (clientOrRepo?.getScopedConstraints) {
        rules = (await clientOrRepo.getScopedConstraints(activeStatus)) ?? [];
      }
    } catch { rules = []; }
  }

  const tabsHtml = `<div data-c="Tabs" data-rel="tabs" class="lp-tabs" role="tablist" aria-label="Audit views">
    <a id="audit-tab-proposed" href="/admin/audit?status=proposed" role="tab" aria-selected="${activeStatus === 'proposed' ? 'true' : 'false'}" class="lp-tab${activeStatus === 'proposed' ? ' lp-tab-active' : ''}">${escapeHtml(INBOX_STRINGS.audit.tabs.proposed)}</a>
    <a id="audit-tab-confirmed" href="/admin/audit?status=confirmed" role="tab" aria-selected="${activeStatus === 'confirmed' ? 'true' : 'false'}" class="lp-tab${activeStatus === 'confirmed' ? ' lp-tab-active' : ''}">${escapeHtml(INBOX_STRINGS.audit.tabs.confirmed)}</a>
    <a id="audit-tab-revoked" href="/admin/audit?status=revoked" role="tab" aria-selected="${activeStatus === 'revoked' ? 'true' : 'false'}" class="lp-tab${activeStatus === 'revoked' ? ' lp-tab-active' : ''}">${escapeHtml(INBOX_STRINGS.audit.tabs.revoked)}</a>
    <a id="audit-tab-contradictions" href="/admin/audit?status=contradictions" role="tab" aria-selected="${activeStatus === 'contradictions' ? 'true' : 'false'}" class="lp-tab${activeStatus === 'contradictions' ? ' lp-tab-active' : ''}">Contradictions</a>
  </div>`;

  let mainContentHtml = '';
  if (activeStatus === 'contradictions') {
    const activeConflicts = conflicts.filter((c) => c.status !== 'dismissed' && c.status !== 'resolved');
    const initialState = activeConflicts.length > 0 ? 'found' : options.lastCheckedAt ? 'clean' : 'idle';
    const conflictBodyHtml = activeConflicts.length > 0
      ? renderList({
          id: 'audit-conflicts-list',
          variant: 'plain',
          itemsHtml: activeConflicts.map((c) => {
            const claimA = String(c.claim_a_text || c.claim_a || 'Claim A');
            const claimB = String(c.claim_b_text || c.claim_b || 'Claim B');
            const entryALink = c.entry_a_id ? `Entry: ${String(c.entry_a_title || 'View entry')}` : '';
            const entryBLink = c.entry_b_id ? `Entry: ${String(c.entry_b_title || 'View entry')}` : '';
            return renderItem({
              title: 'Conflicting claims',
              subtitle: `Confidence ${Math.round((Number(c.confidence) || 0.8) * 100)}%`,
              segments: [
                { heading: entryALink || 'First claim', body: `"${claimA}"` },
                { heading: entryBLink || 'Second claim', body: `"${claimB}"` },
              ],
              statusLabel: 'Pending',
              statusTone: 'warn',
              actions: {
                level: 'item',
                secondary: { label: 'Supersede', variant: 'secondary', size: 'sm', dataAttrs: { 'conflict-id': String(c.id), 'conflict-res': 'supersedes' } },
                textAction: { label: 'Dismiss', variant: 'text', size: 'sm', dataAttrs: { 'conflict-id': String(c.id), 'conflict-res': 'dismiss' } },
              },
              attributes: `data-conflict-row="${escapeHtml(String(c.id))}"`,
            });
          }).join(''),
        })
      : renderEmptyState({
          id: 'audit-conflicts-empty',
          body: initialState === 'clean' ? 'No contradictions found.' : 'Not checked yet.',
        });

    const checkedMetaHtml = options.lastCheckedAt
      ? renderText({ id: 'audit-last-checked', variant: 'caption', text: `Last checked ${formatAdminDateTime(options.lastCheckedAt)}` })
      : `<p id="audit-last-checked" data-c="Text" data-variant="caption" class="lp-caption lp-is-hidden"></p>`;

    mainContentHtml = `
      <div id="audit-contradictions-panel" data-contradictions-state="${initialState}" class="lp-stack lp-gap-group">
        <div id="audit-conflicts-section" class="lp-stack lp-gap-group">
          <div id="audit-conflicts-region" aria-live="polite" class="lp-stack lp-gap-related">
            ${conflictBodyHtml}
            ${checkedMetaHtml}
          </div>
          <div id="audit-conflicts-error" data-c="Notice" class="lp-notice lp-notice-danger lp-is-hidden">
            Could not run contradiction check.
          </div>
          ${renderActionBar({
            level: 'item',
            secondary: { id: 'btn-detect-conflicts', label: 'Run check', variant: 'secondary', type: 'button', size: 'sm' },
          })}
        </div>
      </div>
    `;
  } else {
    mainContentHtml = rules.length > 0
      ? renderList({
          id: 'audit-rules-list',
          variant: 'plain',
          itemsHtml: rules
            .map((rule) => {
              const id = String(rule.id);
              const quote = String(rule.source_quote || '');
              const scopeEntries = rule.scope && typeof rule.scope === 'object' ? Object.entries(rule.scope) : [];
              const scopeText = scopeEntries.length > 0
                ? `Applies when ${scopeEntries.map(([k, v]) => `${k} is ${Array.isArray(v) ? v.join(', ') : String(v)}`).join(' and ')}.`
                : 'Applies to all questions.';
              const c = rule.constraint || {};
              const cObj = typeof c === 'object' && c !== null ? (c as Record<string, unknown>) : null;
              const summary =
                cObj?.guidance || cObj?.summary || cObj?.rule || cObj?.description || cObj?.message || cObj?.text ||
                (cObj?.disallow_claim ? `Do not claim ${String(cObj.disallow_claim)}` : undefined) ||
                (cObj?.topic ? `Topic rule: ${String(cObj.topic)}` : undefined) ||
                (typeof c === 'string' && c.trim() ? c : undefined) ||
                (quote ? quote : undefined) ||
                (cObj && Object.keys(cObj).length > 0
                  ? Object.entries(cObj).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${String(v)}`).join('; ')
                  : 'Answer rule');
              const tone = activeStatus === 'confirmed' ? 'ok' : activeStatus === 'revoked' ? 'neutral' : 'warn';
              return renderItem({
                title: String(summary),
                subtitle: scopeText,
                segments: quote && quote.trim() !== String(summary).trim() ? [{ heading: 'From your reply', body: quote }] : undefined,
                statusLabel: activeStatus === 'confirmed' ? 'Active' : activeStatus === 'revoked' ? 'Discarded' : 'Pending',
                statusTone: tone,
                actions: activeStatus === 'revoked'
                  ? { level: 'item', secondary: { label: 'Restore', variant: 'secondary', size: 'sm', dataAttrs: { 'rule-id': id, 'rule-action': 'confirmed' } } }
                  : activeStatus === 'proposed'
                    ? {
                        level: 'item',
                        secondary: { label: INBOX_STRINGS.audit.confirmRule, variant: 'secondary', size: 'sm', dataAttrs: { 'rule-id': id, 'rule-action': 'confirmed' } },
                        textAction: { label: 'Discard', variant: 'text', size: 'sm', dataAttrs: { 'rule-id': id, 'rule-action': 'revoked' } },
                      }
                    : { level: 'item', secondary: { label: INBOX_STRINGS.audit.revokeRule, variant: 'secondary', size: 'sm', dataAttrs: { 'rule-id': id, 'rule-action': 'revoked' } } },
                attributes: `data-rule-row="${escapeHtml(id)}"`,
              });
            })
            .join(''),
        })
      : renderEmptyState({ id: 'audit-empty', body: INBOX_STRINGS.audit.emptyBody });
  }

  const bodyHtml = `
    ${renderStatusLine({ id: 'audit-status-line' })}
    ${mainContentHtml}
    <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
      ${ADMIN_API_CLIENT_SCRIPT}
      ${ADMIN_DATETIME_FORMATTER_SCRIPT}
      (function () {
        var list = document.getElementById('audit-rules-list');
        var statusEl = document.getElementById('audit-status-line');
        if (list) {
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
        }
        var panel = document.getElementById('audit-contradictions-panel');
        var detectBtn = document.getElementById('btn-detect-conflicts');
        var region = document.getElementById('audit-conflicts-region');
        var errBox = document.getElementById('audit-conflicts-error');
        var lastCheckedEl = document.getElementById('audit-last-checked');
        var runCheck = async function () {
          if (!detectBtn || !panel) return;
          panel.setAttribute('data-contradictions-state', 'running');
          panel.setAttribute('aria-busy', 'true');
          detectBtn.disabled = true;
          detectBtn.textContent = 'Checking…';
          if (errBox) errBox.classList.add('lp-is-hidden');
          try {
            var res = await apiClient('/api/audit/topology-conflicts/detect', { method: 'POST', body: '{}' });
            if (!res || !res.ok) throw new Error('Check failed');
            var data = await res.json().catch(function () { return {}; });
            var count = Number(data.detected || 0);
            var nowStr = lpFormatAdminDateTime(new Date());
            if (count > 0) {
              panel.setAttribute('data-contradictions-state', 'found');
              if (statusEl) statusEl.textContent = '';
              window.location.reload();
              return;
            }
            panel.setAttribute('data-contradictions-state', 'clean');
            if (region) {
              var emptyP = region.querySelector('#audit-conflicts-empty .lp-empty-body');
              if (emptyP) emptyP.textContent = 'No contradictions found.';
            }
            if (lastCheckedEl) {
              lastCheckedEl.textContent = 'Last checked ' + nowStr;
              lastCheckedEl.classList.remove('lp-is-hidden');
            }
            if (statusEl) statusEl.textContent = '';
          } catch {
            panel.setAttribute('data-contradictions-state', 'error');
            if (errBox) errBox.classList.remove('lp-is-hidden');
            if (statusEl) statusEl.textContent = '';
            detectBtn.textContent = 'Retry';
          } finally {
            panel.removeAttribute('aria-busy');
            detectBtn.disabled = false;
            if (panel.getAttribute('data-contradictions-state') !== 'error') {
              detectBtn.textContent = 'Run check';
            }
          }
        };
        if (detectBtn) detectBtn.addEventListener('click', runCheck);

        var conflictList = document.getElementById('audit-conflicts-list');
        if (conflictList) {
          conflictList.addEventListener('click', async function (e) {
            var btn = e.target && e.target.closest ? e.target.closest('button[data-conflict-res]') : null;
            if (!btn) return;
            var id = btn.getAttribute('data-conflict-id');
            var resolution = btn.getAttribute('data-conflict-res');
            btn.disabled = true;
            var res = await apiClient('/api/audit/topology-conflicts/' + encodeURIComponent(id) + '/resolve', {
              method: 'POST',
              body: JSON.stringify({ resolution: resolution }),
            });
            if (res && res.ok) {
              var row = conflictList.querySelector('[data-conflict-row="' + id + '"]');
              if (row) row.remove();
              var remaining = conflictList.querySelectorAll('[data-conflict-row]').length;
              if (panel) panel.setAttribute('data-contradictions-state', remaining === 0 ? 'clean' : 'resolved');
              if (remaining === 0 && region) {
                region.innerHTML = '<div id="audit-conflicts-empty" class="lp-empty-state"><p data-c="Text" data-variant="description" class="lp-empty-body">No contradictions found.</p></div>';
                if (statusEl) statusEl.textContent = '';
              } else if (statusEl) {
                statusEl.textContent = remaining === 1 ? '1 contradiction remaining.' : remaining + ' contradictions remaining.';
              }
            } else {
              if (statusEl) statusEl.textContent = 'Could not resolve contradiction.';
              btn.disabled = false;
            }
          });
        }
      })();
    </script>`;

  const content = renderPageTemplate({
    title: INBOX_STRINGS.audit.title,
    description: INBOX_STRINGS.audit.subtitle,
    tabsHtml,
    bodyHtml,
  });

  return renderAdminShell(INBOX_STRINGS.audit.title, '/admin/audit', content, { siteName: options.siteName, answeringEnabled: options.answeringEnabled, nonce: options.nonce });
}
