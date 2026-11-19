import { loadConfig } from '@living-portfolio/config';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { escapeHtml } from '../../lib/html.js';
import { renderProviderFlow, type ProviderId } from '../../patterns/provider-flow.js';
import { renderStatusLine } from '../../components/index.js';

/**
 * Child page /admin/settings/providers/change (D-PROV, D-FINAL #19):
 * 3-step Stepper flow: Step 1 Provider -> Step 2 Model -> Step 3 Key ("Test and save").
 */
export function renderProviderChangePage(opts: {
  step?: 1 | 2 | 3;
  provider?: ProviderId;
  model?: string;
  nonce?: string;
} = {}): string {
  const cfg = loadConfig();
  const step = opts.step ?? 1;
  const provider = opts.provider ?? 'local';

  const flowHtml = `<div id="lp-provider-change-root">
    ${renderProviderFlow({ step, selectedProvider: provider, selectedModel: opts.model })}
    ${renderStatusLine({ id: 'lp-provider-change-status' })}
  </div>
  <script${opts.nonce ? ` nonce="${escapeHtml(opts.nonce)}"` : ''}>
    ${ADMIN_API_CLIENT_SCRIPT}
    (function () {
      var root = document.getElementById('lp-provider-change-root');
      if (!root) return;
      root.addEventListener('click', function (e) {
        var target = e.target;
        if (!(target instanceof Element)) return;
        var nextBtn = target.closest('#lp-provider-next');
        if (nextBtn) {
          var url = new URL(window.location.href);
          var curStep = parseInt(url.searchParams.get('step') || '1', 10);
          var checked = root.querySelector('input[name="provider"]:checked');
          var prov = checked ? checked.value : (url.searchParams.get('provider') || 'local');
          var modelEl = document.getElementById('lp-provider-model');
          if (modelEl && modelEl.value) url.searchParams.set('model', modelEl.value);
          url.searchParams.set('provider', prov);
          url.searchParams.set('step', String(Math.min(3, curStep + 1)));
          window.location.href = url.toString();
          return;
        }
        var saveBtn = target.closest('#lp-provider-save, #lp-provider-test-save');
        if (saveBtn) {
          var url2 = new URL(window.location.href);
          var prov2 = url2.searchParams.get('provider') || 'local';
          var model2 = url2.searchParams.get('model') || '';
          var keyEl = document.getElementById('lp-provider-key');
          var apiKey = keyEl ? keyEl.value.trim() : '';
          var statusEl = document.getElementById('lp-provider-change-status');
          if (saveBtn.id === 'lp-provider-test-save' && !apiKey) {
            if (statusEl) statusEl.textContent = 'Enter an API key to test and save.';
            return;
          }
          apiClient('/api/settings', {
            method: 'PUT',
            body: JSON.stringify({ provider: prov2, model: model2 || undefined, apiKey: apiKey || undefined }),
          }).then(function (res) {
            if (res && res.ok) {
              window.location.href = '/admin/settings/providers';
            } else if (statusEl) {
              statusEl.textContent = 'Could not verify provider key. Nothing was saved.';
            }
          }).catch(function () {
            if (statusEl) statusEl.textContent = 'Network error. Nothing was saved.';
          });
        }
      });
    })();
  </script>`;

  const content = renderPageTemplate({
    title: 'Change answering model',
    description: 'Choose a provider, model, and optional API key.',
    backHref: '/admin/settings/providers',
    backLabel: 'Back',
    bodyHtml: flowHtml,
  });

  return renderAdminShell('Change answering model', '/admin/settings/providers/change', content, {
    nonce: opts.nonce,
    siteName: cfg.PUBLIC_SITE_NAME,
  });
}
