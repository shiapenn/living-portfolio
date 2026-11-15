import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';

export const SETTINGS_SCRIPT = `
    <script>
      (function() {
        const banner = document.getElementById('settings-status-banner');
        const tier1Input = document.getElementById('setting-tier1-floor');
        const tier1Warning = document.getElementById('tier1-warning');
        const tier2Input = document.getElementById('setting-tier2-floor');
        const facetInput = document.getElementById('setting-facet-threshold');
        const mechSuggestion = document.getElementById('setting-mech-suggestion-thresholds');
        const mechRouting = document.getElementById('setting-mech-routing-calibration');
        const mechTopology = document.getElementById('setting-mech-topology-audit');
        const mechScoped = document.getElementById('setting-mech-scoped-constraints');
        const answeringCheck = document.getElementById('setting-answering-enabled');
        const degradationSelect = document.getElementById('setting-degradation-mode');

        ${ADMIN_API_CLIENT_SCRIPT}

        // Live validation of Tier 1 floor warning (< 0.82)
        if (tier1Input && tier1Warning) {
          tier1Input.addEventListener('input', function() {
            var val = parseFloat(tier1Input.value);
            tier1Warning.classList.toggle('lp-is-hidden', isNaN(val) || val >= 0.82);
          });
        }

        // Save Routing & Calibration
        var btnSaveRouting = document.getElementById('btn-save-routing');
        if (btnSaveRouting) {
          btnSaveRouting.addEventListener('click', async function() {
            btnSaveRouting.setAttribute('disabled', 'true');
            try {
              var payload = {
                tier1_floor: parseFloat(tier1Input.value),
                tier2_floor: parseFloat(tier2Input.value),
                facet_known_threshold: parseFloat(facetInput.value),
                automatedAnsweringEnabled: answeringCheck ? answeringCheck.checked : true,
                calibration: {
                  suggestion_thresholds: mechSuggestion ? mechSuggestion.checked : false,
                  routing_calibration: mechRouting ? mechRouting.checked : false,
                  topology_audit: mechTopology ? mechTopology.checked : true,
                  scoped_constraint_mining: mechScoped ? mechScoped.checked : true,
                }
              };
              var res = await apiClient('/api/settings/routing', {
                method: 'PATCH',
                body: JSON.stringify(payload)
              });
              if (res.ok) {
                var data = await res.json();
                var warnMsg = data.routing && data.routing.warning ? ' ' + data.routing.warning : '';
                banner.innerHTML = '<div class="as-of-banner">✓ Routing &amp; Calibration saved successfully.' + warnMsg + '</div>';
              } else {
                banner.innerHTML = '<div class="later-thinking-banner" role="alert">Error saving calibration settings (HTTP ' + res.status + ').</div>';
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error saving calibration settings.</div>';
            } finally {
              btnSaveRouting.removeAttribute('disabled');
            }
          });
        }

        // Update Degradation Mode
        var btnSaveDegradation = document.getElementById('btn-save-degradation');
        if (btnSaveDegradation) {
          btnSaveDegradation.addEventListener('click', async function() {
            btnSaveDegradation.setAttribute('disabled', 'true');
            try {
              var res = await apiClient('/api/settings/routing', {
                method: 'PATCH',
                body: JSON.stringify({ simulatedDegradationMode: degradationSelect.value })
              });
              if (res.ok) {
                banner.innerHTML = '<div class="as-of-banner">✓ Degradation mode updated to <strong>' + degradationSelect.value + '</strong>.</div>';
              } else {
                banner.innerHTML = '<div class="later-thinking-banner" role="alert">Error updating degradation mode.</div>';
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error updating degradation mode.</div>';
            } finally {
              btnSaveDegradation.removeAttribute('disabled');
            }
          });
        }

        // Save Theme Tokens
        var btnSaveTheme = document.getElementById('btn-save-theme');
        if (btnSaveTheme) {
          btnSaveTheme.addEventListener('click', async function() {
            btnSaveTheme.setAttribute('disabled', 'true');
            try {
              var lightAccent = document.getElementById('setting-theme-light-accent').value;
              var darkAccent = document.getElementById('setting-theme-dark-accent').value;
              var res = await apiClient('/api/settings/theme', {
                method: 'PATCH',
                body: JSON.stringify({
                  lightTokens: { '--accent': lightAccent },
                  darkTokens: { '--accent': darkAccent }
                })
              });
              if (res.ok) {
                var data = await res.json();
                banner.innerHTML = '<div class="as-of-banner">✓ Theme updated. Conformance check: <strong>' + (data.conformance && data.conformance.valid ? 'PASSED' : 'FAILED') + '</strong>.</div>';
              } else {
                banner.innerHTML = '<div class="later-thinking-banner" role="alert">Error updating theme tokens.</div>';
              }
            } catch (err) {
              banner.innerHTML = '<div class="later-thinking-banner" role="alert">Network error updating theme.</div>';
            } finally {
              btnSaveTheme.removeAttribute('disabled');
            }
          });
        }

        // Test Notification
        var btnTestNotification = document.getElementById('btn-test-notification');
        if (btnTestNotification) {
          btnTestNotification.addEventListener('click', async function() {
            var resultEl = document.getElementById('notify-test-result');
            btnTestNotification.setAttribute('disabled', 'true');
            if (resultEl) resultEl.innerHTML = '<span class="lp-help-text">Testing delivery...</span>';
            try {
              var res = await apiClient('/api/settings/notifications/test', { method: 'POST' });
              if (res.status === 501) {
                var errData = await res.json();
                if (resultEl) resultEl.innerHTML = '<div class="lp-notice lp-notice-warn" role="note"><strong>501 Not Implemented:</strong> ' + (errData.message || 'Notification adapter is not yet implemented.') + '</div>';
              } else if (res.ok) {
                if (resultEl) resultEl.innerHTML = '<span class="lp-status-line-ok">✓ Delivery test completed.</span>';
              } else {
                if (resultEl) resultEl.innerHTML = '<span class="lp-status-line-danger">Delivery test failed (HTTP ' + res.status + ').</span>';
              }
            } catch (err) {
              if (resultEl) resultEl.innerHTML = '<span class="lp-status-line-danger">Network error testing notification.</span>';
            } finally {
              btnTestNotification.removeAttribute('disabled');
            }
          });
        }

        // Run Backup Drill
        var btnRunBackupDrill = document.getElementById('btn-run-backup-drill');
        if (btnRunBackupDrill) {
          btnRunBackupDrill.addEventListener('click', async function() {
            var resultEl = document.getElementById('backup-drill-result');
            btnRunBackupDrill.setAttribute('disabled', 'true');
            if (resultEl) resultEl.innerHTML = '<span class="lp-help-text">Executing backup drill...</span>';
            try {
              var res = await apiClient('/api/settings/backups/run-drill', { method: 'POST' });
              if (res.status === 501) {
                var errData = await res.json();
                if (resultEl) resultEl.innerHTML = '<div class="lp-notice lp-notice-warn" role="note"><strong>501 Not Implemented:</strong> ' + (errData.message || 'Backup restore verification drill is not yet implemented.') + '</div>';
              } else if (res.ok) {
                if (resultEl) resultEl.innerHTML = '<span class="lp-status-line-ok">✓ Backup restore drill passed.</span>';
              } else {
                if (resultEl) resultEl.innerHTML = '<span class="lp-status-line-danger">Backup drill failed (HTTP ' + res.status + ').</span>';
              }
            } catch (err) {
              if (resultEl) resultEl.innerHTML = '<span class="lp-status-line-danger">Network error executing backup drill.</span>';
            } finally {
              btnRunBackupDrill.removeAttribute('disabled');
            }
          });
        }
      })();
    </script>`;
