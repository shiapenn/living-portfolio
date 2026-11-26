import { ADMIN_DATETIME_FORMATTER_SCRIPT, formatAdminDate, formatAdminDateTime } from '@living-portfolio/ui-core';
import { escapeHtml } from '../../lib/html.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { renderActionBar, renderItem, renderList, renderText } from '../../primitives/index.js';
import { renderEmptyState, renderStatusLine } from '../../components/index.js';
import { INBOX_STRINGS } from '../../strings/admin/inbox.js';

function formatClaimEyebrow(role: 'Older' | 'Newer' | 'Same date', iso?: string): string {
  const d = iso ? formatAdminDate(iso) : '';
  return d ? `${role} · ${d}` : role;
}

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
    const initialHeadline = initialState === 'found'
      ? (activeConflicts.length === 1 ? '1 possible contradiction' : `${activeConflicts.length} possible contradictions`)
      : initialState === 'clean'
        ? 'No contradictions found'
        : 'Not checked yet';
    const initialMeta = options.lastCheckedAt
      ? `Last checked ${formatAdminDateTime(options.lastCheckedAt)}`
      : 'Not run yet';
    const initialBtnLabel = options.lastCheckedAt || activeConflicts.length > 0 ? 'Check again' : 'Run check';

    const conflictResultsHtml = activeConflicts.length > 0
      ? `<p id="audit-conflicts-intro" data-c="Text" data-variant="description" class="lp-description">Keep newer stops answers using the older claim. Keep both leaves both.</p>` +
        renderList({
          id: 'audit-conflicts-list',
          variant: 'plain',
          itemsHtml: activeConflicts.map((c) => {
            const claimA = String(c.claim_a_text || c.claim_a || 'Claim A');
            const claimB = String(c.claim_b_text || c.claim_b || 'Claim B');
            const titleA = String(c.entry_a_title || 'Earlier entry');
            const titleB = String(c.entry_b_title || 'Later entry');
            const dateA = c.entry_a_date ? String(c.entry_a_date) : '';
            const dateB = c.entry_b_date ? String(c.entry_b_date) : '';
            const sameDate = Boolean(dateA && dateB && formatAdminDate(dateA) === formatAdminDate(dateB));
            const eyebrowA = formatClaimEyebrow(sameDate ? 'Same date' : 'Older', dateA);
            const eyebrowB = formatClaimEyebrow(sameDate ? 'Same date' : 'Newer', dateB);
            const hrefA = c.entry_a_id ? `/admin/entries/${encodeURIComponent(String(c.entry_a_id))}` : '';
            const hrefB = c.entry_b_id ? `/admin/entries/${encodeURIComponent(String(c.entry_b_id))}` : '';
            const topicTitle = (c.overlap && typeof c.overlap.topic === 'string' && c.overlap.topic.trim())
              ? c.overlap.topic.trim()
              : 'Possible contradiction';
            const pct = Math.round((Number(c.confidence) || 0.8) * 100);
            const linkA = hrefA
              ? `<a href="${escapeHtml(hrefA)}" class="lp-item-link lp-caption">From ${escapeHtml(titleA)}</a>`
              : `<span class="lp-caption">From ${escapeHtml(titleA)}</span>`;
            const linkB = hrefB
              ? `<a href="${escapeHtml(hrefB)}" class="lp-item-link lp-caption">From ${escapeHtml(titleB)}</a>`
              : `<span class="lp-caption">From ${escapeHtml(titleB)}</span>`;
            const claimsHtml = `<div class="lp-item-claims-grid" data-claims-grid="true">
              <div class="lp-item-claim-card" data-claim-side="older">
                <div class="lp-item-claim-eyebrow">${escapeHtml(eyebrowA)}</div>
                <blockquote data-c="Text" data-variant="quote" class="lp-item-quote">${escapeHtml(claimA)}</blockquote>
                <div>${linkA}</div>
              </div>
              <div class="lp-item-claims-vs" aria-hidden="true">vs</div>
              <div class="lp-item-claim-card" data-claim-side="newer">
                <div class="lp-item-claim-eyebrow">${escapeHtml(eyebrowB)}</div>
                <blockquote data-c="Text" data-variant="quote" class="lp-item-quote">${escapeHtml(claimB)}</blockquote>
                <div>${linkB}</div>
              </div>
            </div>`;
            return renderItem({
              title: topicTitle,
              titleVariant: 'content',
              trailingValue: `${pct}% likely conflict`,
              customBodyHtml: claimsHtml,
              actions: {
                level: 'item',
                secondary: { label: 'Keep newer', variant: 'secondary', size: 'sm', dataAttrs: { 'conflict-id': String(c.id), 'conflict-res': 'supersedes' } },
                textAction: { label: 'Keep both', variant: 'text', size: 'sm', dataAttrs: { 'conflict-id': String(c.id), 'conflict-res': 'dismiss' } },
              },
              attributes: `data-conflict-row="${escapeHtml(String(c.id))}"`,
            });
          }).join(''),
        })
      : '';

    mainContentHtml = `
      <div id="audit-contradictions-panel" data-contradictions-state="${initialState}" class="lp-stack lp-gap-group">
        <div id="audit-conflicts-section" class="lp-stack lp-gap-group">
          <div class="lp-stack lp-gap-tight">
            <div id="audit-state-headline" data-c="Text" class="lp-item-title" aria-live="polite">${escapeHtml(initialHeadline)}</div>
            <p id="audit-last-checked" data-c="Text" data-variant="caption" class="lp-field-help">${escapeHtml(initialMeta)}</p>
          </div>
          <div class="lp-stack lp-gap-related">
            ${renderActionBar({
              level: 'item',
              secondary: { id: 'btn-detect-conflicts', label: initialBtnLabel, variant: 'secondary', type: 'button', size: 'sm' },
            })}
            <div id="audit-conflicts-error" data-c="Notice" class="lp-notice lp-notice-danger lp-is-hidden" aria-live="assertive">
              Could not run contradiction check.
            </div>
            ${renderStatusLine({ id: 'audit-conflicts-resolved-status' })}
          </div>
        </div>
        <div id="audit-conflicts-region" aria-live="polite" class="lp-stack lp-gap-related">
          ${conflictResultsHtml}
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
              return renderItem({
                title: String(summary),
                titleVariant: 'content',
                subtitle: scopeText,
                segments: quote && quote.trim() !== String(summary).trim() ? [{ heading: 'From your reply', body: quote }] : undefined,
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
        var headlineEl = document.getElementById('audit-state-headline');
        var region = document.getElementById('audit-conflicts-region');
        var errBox = document.getElementById('audit-conflicts-error');
        var lastCheckedEl = document.getElementById('audit-last-checked');
        var resolvedStatusEl = document.getElementById('audit-conflicts-resolved-status');
        var lastKnownHeadline = headlineEl ? headlineEl.textContent : 'Not checked yet';
        var hasRun = false;

        var runCheck = async function () {
          if (!detectBtn || !panel) return;
          panel.setAttribute('data-contradictions-state', 'running');
          panel.setAttribute('aria-busy', 'true');
          detectBtn.disabled = true;
          detectBtn.textContent = 'Checking…';
          if (headlineEl) headlineEl.textContent = 'Checking…';
          if (errBox) errBox.classList.add('lp-is-hidden');
          if (resolvedStatusEl) { resolvedStatusEl.textContent = ''; resolvedStatusEl.className = 'lp-status-line'; }
          try {
            var res = await apiClient('/api/audit/topology-conflicts/detect', { method: 'POST', body: '{}' });
            if (!res || !res.ok) throw new Error('Check failed');
            var data = await res.json().catch(function () { return {}; });
            var count = Number(data.detected || 0);
            var nowStr = lpFormatAdminDateTime(new Date());
            hasRun = true;
            if (lastCheckedEl) lastCheckedEl.textContent = 'Last checked ' + nowStr;
            if (count > 0) {
              panel.setAttribute('data-contradictions-state', 'found');
              lastKnownHeadline = count === 1 ? '1 possible contradiction' : count + ' possible contradictions';
              if (headlineEl) headlineEl.textContent = lastKnownHeadline;
              window.location.reload();
              return;
            }
            panel.setAttribute('data-contradictions-state', 'clean');
            lastKnownHeadline = 'No contradictions found';
            if (headlineEl) headlineEl.textContent = lastKnownHeadline;
            if (region) region.innerHTML = '';
          } catch {
            panel.setAttribute('data-contradictions-state', 'error');
            if (headlineEl) headlineEl.textContent = lastKnownHeadline || 'Not checked yet';
            if (errBox) errBox.classList.remove('lp-is-hidden');
          } finally {
            panel.removeAttribute('aria-busy');
            detectBtn.disabled = false;
            detectBtn.textContent = hasRun ? 'Check again' : 'Run check';
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
              lastKnownHeadline = remaining === 0
                ? 'No contradictions found'
                : (remaining === 1 ? '1 possible contradiction' : remaining + ' possible contradictions');
              if (headlineEl) headlineEl.textContent = lastKnownHeadline;
              if (remaining === 0 && region) region.innerHTML = '';
              if (resolvedStatusEl) {
                resolvedStatusEl.textContent = 'Resolved';
                resolvedStatusEl.className = 'lp-status-line lp-status-line-ok';
              }
            } else {
              if (errBox) {
                errBox.textContent = 'Could not resolve contradiction.';
                errBox.classList.remove('lp-is-hidden');
              }
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
