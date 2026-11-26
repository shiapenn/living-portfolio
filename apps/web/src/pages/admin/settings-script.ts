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
          if (isError) {
            banner.setAttribute('data-c', 'Notice');
            banner.setAttribute('aria-live', 'assertive');
            banner.className = 'lp-notice lp-notice-danger';
            banner.textContent = msg;
            try { banner.scrollIntoView({ block: 'center', behavior: 'instant' }); } catch {}
            try { banner.focus({ preventScroll: true }); } catch {}
          } else {
            banner.removeAttribute('data-c');
            banner.setAttribute('aria-live', 'polite');
            banner.className = 'lp-status-line lp-status-line-ok';
            banner.textContent = msg;
          }
        };
        const clearBanner = () => {
          if (!banner) return;
          banner.className = 'lp-is-hidden';
          banner.textContent = '';
        };
        if (form) form.addEventListener('input', clearBanner);

        const setFieldInvalid = (inputEl, msg) => {
          if (!inputEl) { setBanner(msg, true); return; }
          inputEl.setAttribute('aria-invalid', 'true');
          const field = inputEl.closest('.lp-field');
          if (field) {
            const errId = inputEl.id + '-error';
            let helpEl = field.querySelector('.lp-field-help, .lp-help-text, .lp-field-error');
            if (!helpEl) {
              helpEl = document.createElement('p');
              field.appendChild(helpEl);
            }
            if (!helpEl.getAttribute('data-orig-help')) {
              helpEl.setAttribute('data-orig-help', helpEl.textContent || '');
            }
            helpEl.id = errId;
            helpEl.className = 'lp-field-error';
            helpEl.textContent = msg;
            inputEl.setAttribute('aria-describedby', errId);
          }
          setBanner(msg, true);
          try { inputEl.focus(); } catch {}
        };
        const clearFieldInvalid = (inputEl) => {
          if (!inputEl || inputEl.getAttribute('aria-invalid') !== 'true') return;
          inputEl.removeAttribute('aria-invalid');
          const field = inputEl.closest('.lp-field');
          const errEl = field ? field.querySelector('.lp-field-error') : null;
          if (errEl) {
            const orig = errEl.getAttribute('data-orig-help') || '';
            errEl.className = 'lp-field-help';
            errEl.textContent = orig;
          }
        };

        const tier1Input = document.getElementById('setting-tier1-floor');
        const tier2Input = document.getElementById('setting-tier2-floor');
        const facetInput = document.getElementById('setting-facet-threshold');
        const tier1Warning = document.getElementById('tier1-warning');
        const updateThresholdWarning = () => {
          if (!tier1Warning) return;
          const v1 = tier1Input ? parseFloat(tier1Input.value) : 0.82;
          const v2 = tier2Input ? parseFloat(tier2Input.value) : 0.55;
          const v3 = facetInput ? parseFloat(facetInput.value) : 0.9;
          const drifted =
            (!isNaN(v1) && Math.abs(v1 - 0.82) > 0.001) ||
            (!isNaN(v2) && Math.abs(v2 - 0.55) > 0.001) ||
            (!isNaN(v3) && Math.abs(v3 - 0.9) > 0.001);
          tier1Warning.classList.toggle('lp-is-hidden', !drifted);
        };
        if (tier1Input) tier1Input.addEventListener('input', () => { clearFieldInvalid(tier1Input); updateThresholdWarning(); });
        if (tier2Input) tier2Input.addEventListener('input', () => { clearFieldInvalid(tier2Input); updateThresholdWarning(); });
        if (facetInput) facetInput.addEventListener('input', () => { clearFieldInvalid(facetInput); updateThresholdWarning(); });

        const restoreBtn = document.getElementById('btn-restore-thresholds');
        const thresholdsFeedback = document.getElementById('answering-thresholds-feedback');
        if (restoreBtn) {
          restoreBtn.addEventListener('click', function() {
            if (tier1Input) { tier1Input.value = '0.82'; clearFieldInvalid(tier1Input); }
            if (tier2Input) { tier2Input.value = '0.55'; clearFieldInvalid(tier2Input); }
            if (facetInput) { facetInput.value = '0.9'; clearFieldInvalid(facetInput); }
            updateThresholdWarning();
            clearBanner();
            if (thresholdsFeedback) {
              thresholdsFeedback.className = 'lp-status-line lp-status-line-ok';
              thresholdsFeedback.textContent = 'Restored recommended values. Click Save to apply.';
            }
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
                const t1 = parseFloat(document.getElementById('setting-tier1-floor').value);
                const t2 = parseFloat(document.getElementById('setting-tier2-floor').value);
                const t3 = parseFloat(document.getElementById('setting-facet-threshold').value);
                if (isNaN(t1) || t1 < 0.1 || t1 > 1.0) {
                  setFieldInvalid(tier1Input, 'Direct quote threshold must be between 0.10 and 1.00.');
                  return;
                }
                if (isNaN(t2) || t2 < 0.1 || t2 > 1.0) {
                  setFieldInvalid(tier2Input, 'Summary answer threshold must be between 0.10 and 1.00.');
                  return;
                }
                if (isNaN(t3) || t3 < 0.5 || t3 > 1.0) {
                  setFieldInvalid(facetInput, 'Topic match threshold must be between 0.50 and 1.00.');
                  return;
                }
                const replyTimeEl = document.getElementById('setting-reply-time');
                const disclosureEl = document.getElementById('setting-public-disclosure');
                const payload = {
                  tier1_floor: t1,
                  tier2_floor: t2,
                  facet_known_threshold: t3,
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
              } else if (moduleName === 'home') {
                const stmtEl = document.getElementById('setting-home-statement');
                const fcEl = document.getElementById('setting-home-featured-count');
                const rcEl = document.getElementById('setting-home-recent-count');
                const slugsEl = document.getElementById('setting-home-featured-slugs');
                const slugs = slugsEl ? slugsEl.value.split(',').map((s) => s.trim()).filter(Boolean) : [];
                const res = await apiClient('/api/settings/home', {
                  method: 'PATCH',
                  body: JSON.stringify({
                    statement: stmtEl ? stmtEl.value.trim() : '',
                    featuredCount: fcEl ? Number(fcEl.value) : 3,
                    recentCount: rcEl ? Number(rcEl.value) : 10,
                    featuredSlugs: slugs,
                  }),
                });
                const homeData = await res.json().catch(() => ({}));
                setBanner(res.ok ? 'Saved.' : (homeData && homeData.message ? String(homeData.message) : 'Could not save home settings.'), !res.ok);
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
                : (res.status === 501
                    ? 'Restore drill is not enabled until a backup folder is set.'
                    : (data && data.message ? String(data.message) : 'Restore drill is not enabled in this environment.'));
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
