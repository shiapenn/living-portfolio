import { escapeHtml } from '../../lib/html.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { renderActionBar, renderFormSection, renderItem, renderList, renderText } from '../../primitives/index.js';
import { renderEmptyState, renderStatusLine } from '../../components/index.js';
import { INBOX_STRINGS } from '../../strings/admin/inbox.js';

export async function renderAdminAuditRulesPage(
  clientOrRepo: any,
  options: { status?: string; siteName?: string; answeringEnabled?: boolean; nonce?: string } = {}
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

  const tabsHtml = `<div data-c="Tabs" data-rel="tabs" class="lp-tabs" role="tablist" aria-label="Rule status filters">
    <a id="audit-tab-proposed" href="/admin/audit?status=proposed" role="tab" aria-selected="${activeStatus === 'proposed' ? 'true' : 'false'}" class="lp-tab${activeStatus === 'proposed' ? ' lp-tab-active' : ''}">${escapeHtml(INBOX_STRINGS.audit.tabs.proposed)}</a>
    <a id="audit-tab-confirmed" href="/admin/audit?status=confirmed" role="tab" aria-selected="${activeStatus === 'confirmed' ? 'true' : 'false'}" class="lp-tab${activeStatus === 'confirmed' ? ' lp-tab-active' : ''}">${escapeHtml(INBOX_STRINGS.audit.tabs.confirmed)}</a>
    <a id="audit-tab-revoked" href="/admin/audit?status=revoked" role="tab" aria-selected="${activeStatus === 'revoked' ? 'true' : 'false'}" class="lp-tab${activeStatus === 'revoked' ? ' lp-tab-active' : ''}">${escapeHtml(INBOX_STRINGS.audit.tabs.revoked)}</a>
  </div>`;

  let mainContentHtml = '';
  if (activeStatus === 'contradictions') {
    const activeConflicts = conflicts.filter((c) => c.status !== 'dismissed' && c.status !== 'resolved');
    const conflictItemsHtml = activeConflicts.length > 0
      ? renderList({
          id: 'audit-conflicts-list',
          variant: 'plain',
          itemsHtml: activeConflicts.map((c) => renderItem({
            title: `Claim pair: ${String(c.claim_a)} vs ${String(c.claim_b)}`,
            subtitle: `Detected ${c.at ? new Date(c.at).toISOString().slice(0, 10) : 'recently'} · confidence ${Math.round((Number(c.confidence) || 0.8) * 100)}%`,
            statusLabel: 'Pending',
            statusTone: 'warn',
            actions: {
              level: 'item',
              secondary: { label: 'Supersede', variant: 'secondary', size: 'sm', dataAttrs: { 'conflict-id': String(c.id), 'conflict-res': 'supersedes' } },
              textAction: { label: 'Dismiss', variant: 'text', size: 'sm', dataAttrs: { 'conflict-id': String(c.id), 'conflict-res': 'dismiss' } },
            },
            attributes: `data-conflict-row="${escapeHtml(String(c.id))}"`,
          })).join(''),
        })
      : renderEmptyState({
          id: 'audit-conflicts-empty',
          headingTag: 'h2',
          title: 'No contradictions detected',
          body: 'Run the contradiction check to scan published claims for conflicting statements.',
        });

    mainContentHtml = `
      ${renderFormSection({
        id: 'audit-conflicts-section',
        title: 'Contradictions and stale claims',
        description: 'Review conflicting claims across entries and record whether a newer claim supersedes an earlier one.',
        fieldsHtml: renderText({ id: 'audit-detect-summary', variant: 'caption', text: `${activeConflicts.length} pending contradiction(s).` }),
        actionBarHtml: renderActionBar({
          level: 'item',
          secondary: { id: 'btn-detect-conflicts', label: 'Run check', variant: 'secondary', type: 'button', size: 'sm' },
        }),
      })}
      ${conflictItemsHtml}
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
                statusLabel: activeStatus === 'confirmed' ? 'Active' : activeStatus === 'revoked' ? 'Ignored' : 'Pending',
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
      : renderEmptyState({ id: 'audit-empty', headingTag: 'h2', title: INBOX_STRINGS.audit.emptyTitle, body: INBOX_STRINGS.audit.emptyBody });
  }

  const bodyHtml = `
    ${renderStatusLine({ id: 'audit-status-line' })}
    ${mainContentHtml}
    <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
      ${ADMIN_API_CLIENT_SCRIPT}
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
        var detectBtn = document.getElementById('btn-detect-conflicts');
        if (detectBtn) {
          detectBtn.addEventListener('click', async function () {
            detectBtn.disabled = true;
            var res = await apiClient('/api/audit/topology-conflicts/detect', { method: 'POST', body: '{}' });
            if (res && res.ok) {
              var data = await res.json().catch(function () { return {}; });
              if (statusEl) statusEl.textContent = 'Check complete. Found ' + (data.detected || 0) + ' contradiction(s).';
              if ((data.detected || 0) > 0) window.location.reload();
            } else if (statusEl) {
              statusEl.textContent = 'Could not run contradiction check.';
            }
            detectBtn.disabled = false;
          });
        }
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
              if (statusEl) statusEl.textContent = 'Contradiction resolved.';
              window.location.reload();
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
