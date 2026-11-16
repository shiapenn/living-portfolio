import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';

export const SETTINGS_SCRIPT = `
    <script>
      (function() {
        const form = document.getElementById('settings-module-form');
        const banner = document.getElementById('settings-status-banner');
        const moduleName = form ? form.getAttribute('data-settings-module') : '';
        ${ADMIN_API_CLIENT_SCRIPT}

        const setBanner = (msg, isError) => {
          if (!banner) return;
          const cls = isError ? 'lp-notice lp-notice-danger' : 'lp-notice lp-notice-ok';
          const role = isError ? 'alert' : 'status';
          banner.innerHTML = '<div class="' + cls + '" role="' + role + '">' + msg + '</div>';
        };

        const tier1Input = document.getElementById('setting-tier1-floor');
        const tier1Warning = document.getElementById('tier1-warning');
        if (tier1Input && tier1Warning) {
          tier1Input.addEventListener('input', function() {
            const val = parseFloat(tier1Input.value);
            tier1Warning.classList.toggle('lp-is-hidden', isNaN(val) || val >= 0.82);
          });
        }

        const saveBtn = document.getElementById('btn-save-settings-module');
        if (saveBtn && form) {
          saveBtn.addEventListener('click', async function() {
            saveBtn.setAttribute('disabled', 'true');
            try {
              if (moduleName === 'answering') {
                const payload = {
                  tier1_floor: parseFloat(document.getElementById('setting-tier1-floor').value),
                  tier2_floor: parseFloat(document.getElementById('setting-tier2-floor').value),
                  facet_known_threshold: parseFloat(document.getElementById('setting-facet-threshold').value),
                  automatedAnsweringEnabled: document.getElementById('setting-answering-enabled').checked,
                  calibration: {
                    suggestion_thresholds: document.getElementById('setting-mech-suggestion-thresholds').checked,
                    routing_calibration: document.getElementById('setting-mech-routing-calibration').checked,
                    topology_audit: document.getElementById('setting-mech-topology-audit').checked,
                    scoped_constraint_mining: document.getElementById('setting-mech-scoped-constraints').checked,
                  }
                };
                const res = await apiClient('/api/settings/routing', {
                  method: 'PATCH',
                  body: JSON.stringify(payload)
                });
                setBanner(res.ok ? 'Saved.' : 'Could not save answering settings.', !res.ok);
              } else if (moduleName === 'providers') {
                const mode = document.getElementById('setting-degradation-mode').value;
                const res = await apiClient('/api/settings/routing', {
                  method: 'PATCH',
                  body: JSON.stringify({ simulatedDegradationMode: mode })
                });
                setBanner(res.ok ? 'Saved.' : 'Could not save fallback mode.', !res.ok);
              } else if (moduleName === 'appearance') {
                const lightAccent = document.getElementById('setting-theme-light-accent').value.trim();
                const darkAccent = document.getElementById('setting-theme-dark-accent').value.trim();
                const res = await apiClient('/api/settings/theme', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    lightTokens: { '--accent': lightAccent },
                    darkTokens: { '--accent': darkAccent }
                  })
                });
                setBanner(res.ok ? 'Saved.' : 'Theme colours failed contrast checks.', !res.ok);
              } else if (moduleName === 'notifications') {
                const topic = document.getElementById('setting-notify-topic').value.trim();
                const res = await apiClient('/api/settings/notifications', {
                  method: 'PATCH',
                  body: JSON.stringify({ notify_topic: topic })
                });
                setBanner(res.ok ? 'Saved.' : 'Could not save notification settings.', !res.ok);
              } else if (moduleName === 'backups') {
                setBanner('Saved.', false);
              }
            } catch {
              setBanner('Network error saving settings.', true);
            } finally {
              saveBtn.removeAttribute('disabled');
            }
          });
        }

        const btnTestNotify = document.getElementById('btn-test-notification');
        const notifyResult = document.getElementById('notify-test-result');
        if (btnTestNotify && notifyResult) {
          btnTestNotify.addEventListener('click', async function() {
            btnTestNotify.setAttribute('disabled', 'true');
            try {
              const res = await apiClient('/api/settings/notifications/test', { method: 'POST', body: '{}' });
              notifyResult.textContent = res.ok ? 'Test alert sent.' : 'Test alert is not enabled in this environment.';
            } catch {
              notifyResult.textContent = 'Could not send test alert.';
            } finally {
              btnTestNotify.removeAttribute('disabled');
            }
          });
        }

        const btnDrill = document.getElementById('btn-run-backup-drill');
        const drillResult = document.getElementById('backup-drill-result');
        if (btnDrill && drillResult) {
          btnDrill.addEventListener('click', async function() {
            btnDrill.setAttribute('disabled', 'true');
            try {
              const res = await apiClient('/api/settings/backups/run-drill', { method: 'POST', body: '{}' });
              drillResult.textContent = res.ok ? 'Restore drill passed.' : 'Restore drill is not enabled in this environment.';
            } catch {
              drillResult.textContent = 'Could not run restore drill.';
            } finally {
              btnDrill.removeAttribute('disabled');
            }
          });
        }

        document.querySelectorAll('.btn-test-provider-key').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            const providerId = btn.getAttribute('data-provider-id') || '';
            const keyInput = document.getElementById('provider-key-' + providerId);
            const resultEl = document.getElementById('provider-test-result-' + providerId);
            const keyVal = keyInput && 'value' in keyInput ? String(keyInput.value).trim() : '';
            if (!keyVal) {
              if (resultEl) resultEl.textContent = 'Enter an API key to test.';
              return;
            }
            btn.setAttribute('disabled', 'true');
            try {
              const res = await apiClient('/api/settings/providers/test', {
                method: 'POST',
                body: JSON.stringify({ providerId, apiKey: keyVal }),
              });
              if (resultEl) {
                resultEl.textContent = res.ok
                  ? 'API key verified.'
                  : 'Provider key check is not enabled in this environment.';
              }
            } catch {
              if (resultEl) resultEl.textContent = 'Could not verify API key.';
            } finally {
              btn.removeAttribute('disabled');
            }
          });
        });
      })();
    </script>`;
