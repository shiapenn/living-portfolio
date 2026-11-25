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
        const tier2Input = document.getElementById('setting-tier2-floor');
        const facetInput = document.getElementById('setting-facet-threshold');
        const tier1Warning = document.getElementById('tier1-warning');
        const updateThresholdWarning = () => {
          if (!tier1Warning) return;
          const v1 = tier1Input ? parseFloat(tier1Input.value) : 0.82;
          const v2 = tier2Input ? parseFloat(tier2Input.value) : 0.55;
          const v3 = facetInput ? parseFloat(facetInput.value) : 0.75;
          const below = (!isNaN(v1) && v1 < 0.82) || (!isNaN(v2) && v2 < 0.55) || (!isNaN(v3) && v3 < 0.75);
          tier1Warning.classList.toggle('lp-is-hidden', !below);
        };
        if (tier1Input) tier1Input.addEventListener('input', updateThresholdWarning);
        if (tier2Input) tier2Input.addEventListener('input', updateThresholdWarning);
        if (facetInput) facetInput.addEventListener('input', updateThresholdWarning);

        const restoreBtn = document.getElementById('btn-restore-thresholds');
        if (restoreBtn) {
          restoreBtn.addEventListener('click', function() {
            if (tier1Input) tier1Input.value = '0.82';
            if (tier2Input) tier2Input.value = '0.55';
            if (facetInput) facetInput.value = '0.75';
            updateThresholdWarning();
            setBanner('Recommended thresholds restored. Click Save to apply.', false);
          });
        }

        const answeringCheckbox = document.getElementById('setting-answering-enabled');
        const pauseDialog = document.getElementById('answering-pause-dialog');
        const confirmPauseBtn = document.getElementById('btn-confirm-pause-answering');
        const cancelPauseBtn = document.getElementById('btn-cancel-pause-answering');
        if (answeringCheckbox && pauseDialog) {
          const closePauseDialog = (revert) => {
            pauseDialog.setAttribute('hidden', '');
            if (revert) answeringCheckbox.checked = true;
            answeringCheckbox.focus();
          };
          answeringCheckbox.addEventListener('change', function() {
            if (!answeringCheckbox.checked) {
              pauseDialog.removeAttribute('hidden');
              if (confirmPauseBtn) confirmPauseBtn.focus();
            }
          });
          if (confirmPauseBtn) {
            confirmPauseBtn.addEventListener('click', function() {
              closePauseDialog(false);
            });
          }
          if (cancelPauseBtn) {
            cancelPauseBtn.addEventListener('click', function() {
              closePauseDialog(true);
            });
          }
          pauseDialog.querySelectorAll('[data-lp-dialog-close]').forEach(function(el) {
            el.addEventListener('click', function() { closePauseDialog(true); });
          });
          document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !pauseDialog.hasAttribute('hidden')) {
              e.preventDefault();
              closePauseDialog(true);
            }
          });
        }

        const saveBtn = document.getElementById('btn-save-settings-module');
        if (saveBtn && form) {
          saveBtn.addEventListener('click', async function() {
            saveBtn.setAttribute('disabled', 'true');
            try {
              if (moduleName === 'answering') {
                const replyTimeEl = document.getElementById('setting-reply-time');
                const disclosureEl = document.getElementById('setting-public-disclosure');
                const payload = {
                  tier1_floor: parseFloat(document.getElementById('setting-tier1-floor').value),
                  tier2_floor: parseFloat(document.getElementById('setting-tier2-floor').value),
                  facet_known_threshold: parseFloat(document.getElementById('setting-facet-threshold').value),
                  automatedAnsweringEnabled: document.getElementById('setting-answering-enabled').checked,
                  replyTimeEstimate: replyTimeEl ? replyTimeEl.value : 'Within 24 hours',
                  publicConfidenceDisclosure: disclosureEl ? disclosureEl.checked : true,
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
                const destEl = document.getElementById('setting-backup-destination');
                const keyEl = document.getElementById('setting-backup-age-key');
                const res = await apiClient('/api/settings/backups', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    destination: destEl ? destEl.value.trim() : '',
                    agePublicKey: keyEl ? keyEl.value.trim() : '',
                  })
                });
                setBanner(res.ok ? 'Saved.' : 'Could not save backup settings.', !res.ok);
              } else if (moduleName === 'visibility') {
                const searchEl = document.getElementById('setting-vis-search');
                const aiEl = document.getElementById('setting-vis-ai-crawlers');
                const fedEl = document.getElementById('setting-vis-federation');
                const res = await apiClient('/api/settings/visibility', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    allowSearchIndexing: searchEl ? searchEl.checked : true,
                    blockAiCrawlers: aiEl ? aiEl.checked : false,
                    federationEnabled: fedEl ? fedEl.checked : false,
                  })
                });
                setBanner(res.ok ? 'Saved.' : 'Could not save visibility settings.', !res.ok);
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
              const destEl = document.getElementById('setting-backup-destination');
              const keyEl = document.getElementById('setting-backup-age-key');
              const dest = destEl && 'value' in destEl ? String(destEl.value).trim() : '';
              const ageKey = keyEl && 'value' in keyEl ? String(keyEl.value).trim() : '';
              const res = await apiClient('/api/settings/backups/run-drill', {
                method: 'POST',
                body: JSON.stringify({
                  ...(dest ? { destinationDir: dest } : {}),
                  ...(ageKey ? { agePublicKey: ageKey } : {}),
                }),
              });
              const data = await res.json().catch(() => ({}));
              drillResult.textContent = res.ok
                ? 'Restore drill passed.'
                : (data && data.message ? String(data.message) : 'Not available until a backup folder is set.');
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
