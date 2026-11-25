import { loadConfig } from '@living-portfolio/config';
import { escapeHtml } from '../../lib/html.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { renderActionBar, renderChoiceGroup, renderFormSection, renderItem, renderList, renderText } from '../../primitives/index.js';
import { renderStatusLine } from '../../components/index.js';

export async function renderAdminCalibrationPage(
  clientOrRepo: any,
  options: { siteName?: string; answeringEnabled?: boolean; initialSettings?: Record<string, unknown>; nonce?: string } = {}
): Promise<string> {
  const cfg = loadConfig();
  const raw = options.initialSettings ?? {};
  const cal = (raw.calibration && typeof raw.calibration === 'object' ? raw.calibration : {}) as Record<string, unknown>;
  const mechSuggest = Boolean(cal.suggestion_thresholds ?? false);
  const mechRouting = Boolean(cal.routing_calibration ?? false);
  const mechTopology = cal.topology_audit !== false;
  const mechScoped = cal.scoped_constraint_mining !== false;

  let history: any[] = [];
  try {
    if (clientOrRepo?.getCalibrationChanges) {
      history = (await clientOrRepo.getCalibrationChanges()) ?? [];
    }
  } catch { history = []; }

  const historyItemsHtml = history.length > 0
    ? renderList({
        id: 'calibration-history-list',
        variant: 'plain',
        itemsHtml: history.slice().reverse().map((h) => renderItem({
          title: `${String(h.parameter)}: ${Number(h.old_value).toFixed(2)} to ${Number(h.new_value).toFixed(2)}`,
          subtitle: `Applied by ${String(h.applied_by || 'owner')} · ${h.evidence_count || 0} samples`,
          statusLabel: h.reversible ? 'Active' : 'Archived',
          statusTone: h.reversible ? 'ok' : 'neutral',
          actions: h.reversible
            ? {
                level: 'item',
                secondary: { label: 'Roll back', variant: 'secondary', size: 'sm', dataAttrs: { 'rollback-id': String(h.id) } },
              }
            : undefined,
          attributes: `data-calibration-id="${escapeHtml(String(h.id))}"`,
        })).join(''),
      })
    : renderText({ id: 'calibration-history-empty', variant: 'caption', text: 'No parameter changes have been applied yet.' });

  const bodyHtml = `
    <div class="lp-stack lp-gap-section">
      ${renderStatusLine({ id: 'calibration-status-line' })}

      ${renderFormSection({
        id: 'calibration-explain-section',
        title: 'How self-calibration works',
        fieldsHtml: `
          ${renderText({ variant: 'description', text: 'What it does: Controls automatic threshold proposals and lets you apply or roll back parameter adjustments.' })}
          ${renderText({ variant: 'description', text: 'Safety gate: Parameter adjustments ship off by default, require at least 20 samples, and change by at most 0.05 per step.' })}
        `,
      })}

      ${renderFormSection({
        id: 'calibration-mechanisms-section',
        title: 'Calibration mechanisms',
        description: 'Each mechanism can be switched on or off independently.',
        fieldsHtml: renderChoiceGroup({
          name: 'calibration-mechanisms',
          mode: 'multiple',
          variant: 'card',
          options: [
            { id: 'cal-mech-suggest', value: 'suggest', label: 'Suggestion thresholds (min 20 samples, max step 0.05)', checked: mechSuggest },
            { id: 'cal-mech-routing', value: 'routing', label: 'Routing calibration (min 20 samples, max step 0.05)', checked: mechRouting },
            { id: 'cal-mech-topology', value: 'topology', label: 'Contradiction detection (proposals only)', checked: mechTopology },
            { id: 'cal-mech-scoped', value: 'scoped', label: 'Answer rule proposals after replies (proposals only)', checked: mechScoped },
          ],
        }),
        actionBarHtml: renderActionBar({
          level: 'item',
          secondary: { id: 'btn-save-calibration-mechs', label: 'Save switches', variant: 'secondary', type: 'button', size: 'sm' },
        }),
      })}

      ${renderFormSection({
        id: 'calibration-proposals-section',
        title: 'Pending proposals',
        description: 'Review suggested threshold changes before applying them.',
        fieldsHtml: `<div id="calibration-proposals-list" data-c="List" data-variant="plain" class="lp-list lp-list-plain lp-is-empty"></div>${renderText({ id: 'calibration-proposals-empty', variant: 'caption', text: 'No pending proposals right now.' })}`,
      })}

      ${renderFormSection({
        id: 'calibration-history-section',
        title: 'Change history',
        description: 'Every applied change can be rolled back in one click.',
        fieldsHtml: historyItemsHtml,
      })}
    </div>
    <script${options.nonce ? ` nonce="${escapeHtml(options.nonce)}"` : ''}>
      ${ADMIN_API_CLIENT_SCRIPT}
      (function () {
        var statusEl = document.getElementById('calibration-status-line');
        var setStatus = function (msg) {
          if (!statusEl) return;
          statusEl.textContent = msg;
          statusEl.hidden = !msg;
        };
        var saveBtn = document.getElementById('btn-save-calibration-mechs');
        if (saveBtn) {
          saveBtn.addEventListener('click', async function () {
            saveBtn.disabled = true;
            var res = await apiClient('/api/settings/routing', {
              method: 'PATCH',
              body: JSON.stringify({
                calibration: {
                  suggestion_thresholds: !!document.getElementById('cal-mech-suggest')?.checked,
                  routing_calibration: !!document.getElementById('cal-mech-routing')?.checked,
                  topology_audit: !!document.getElementById('cal-mech-topology')?.checked,
                  scoped_constraint_mining: !!document.getElementById('cal-mech-scoped')?.checked,
                },
              }),
            });
            setStatus(res && res.ok ? 'Calibration switches saved.' : 'Could not save calibration switches.');
            saveBtn.disabled = false;
          });
        }
        var histList = document.getElementById('calibration-history-list');
        if (histList) {
          histList.addEventListener('click', async function (e) {
            var btn = e.target && e.target.closest ? e.target.closest('button[data-rollback-id]') : null;
            if (!btn) return;
            var id = btn.getAttribute('data-rollback-id');
            btn.disabled = true;
            var res = await apiClient('/api/calibration/rollback/' + encodeURIComponent(id), { method: 'POST', body: '{}' });
            if (res && res.ok) {
              setStatus('Change rolled back.');
              window.location.reload();
            } else {
              setStatus('Could not roll back change.');
              btn.disabled = false;
            }
          });
        }
      })();
    </script>`;

  const content = renderPageTemplate({
    title: 'Calibration',
    description: 'Self-tuning switches, pending proposals, and rollback history.',
    bodyHtml,
  });

  return renderAdminShell('Calibration', '/admin/calibration', content, {
    siteName: options.siteName ?? cfg.PUBLIC_SITE_NAME,
    answeringEnabled: options.answeringEnabled,
    nonce: options.nonce,
  });
}
