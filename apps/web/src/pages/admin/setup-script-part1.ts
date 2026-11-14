import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';

export const SETUP_SCRIPT_PART_1 = `
    <script>
      (function() {
        const form = document.getElementById('admin-setup-form');
        const statusBox = document.getElementById('setup-status');
        const chip = document.getElementById('wizard-step-chip');
        const progressFill = document.getElementById('wizard-progress-fill');
        const completedActions = document.getElementById('account-completed-actions');

        ${ADMIN_API_CLIENT_SCRIPT}

        let currentActiveStep = 1;

        async function saveStep(stepNum) {
          try {
            if (stepNum === 2) {
              const presetEl = document.querySelector('input[name="hosting-preset"]:checked');
              const preset = presetEl ? presetEl.value : 'hobbyist-docker';
              const publicAddress = (document.getElementById('setup-origin-url') || {}).value || '';
              await apiClient('/api/settings/hosting', {
                method: 'PATCH',
                body: JSON.stringify({ preset: preset, publicAddress: publicAddress })
              });
            } else if (stepNum === 4) {
              const channel = (document.getElementById('setup-notification-channel') || {}).value || 'ntfy';
              const target = (document.getElementById('setup-notification-target') || {}).value || '';
              await apiClient('/api/settings/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ channel: channel, target: target })
              });
            } else if (stepNum === 5) {
              const destination = (document.getElementById('setup-backup-dest') || {}).value || 'local';
              const agePublicKey = (document.getElementById('setup-age-key') || {}).value || '';
              await apiClient('/api/settings/backups', {
                method: 'PATCH',
                body: JSON.stringify({ destination: destination, agePublicKey: agePublicKey })
              });
            } else if (stepNum === 6) {
              const themeEl = document.querySelector('input[name="theme-preset"]:checked');
              const preset = themeEl ? themeEl.value : 'editorial-classic';
              await apiClient('/api/settings/theme', {
                method: 'PATCH',
                body: JSON.stringify({ preset: preset })
              });
            }
          } catch (_) {}
        }

        async function restoreSettings() {
          try {
            const sessRes = await apiClient('/api/auth/session');
            if (sessRes.ok) {
              const sessData = await sessRes.json();
              if (sessData.authenticated) {
                const f = document.getElementById('admin-setup-form');
                if (f) f.style.display = 'none';
                const s = document.getElementById('setup-status');
                if (s) s.style.display = 'none';
                if (currentActiveStep === 1) {
                  goToStep(2);
                }
              }
            }

            const res = await apiClient('/api/settings');
            if (!res.ok) return;
            const data = await res.json();
            if (data.hosting) {
              const preset = data.hosting.preset || data.preset;
              if (preset) {
                const r = document.querySelector('input[name="hosting-preset"][value="' + preset + '"]');
                if (r) r.checked = true;
              }
              if (data.hosting.publicAddress) {
                const urlInput = document.getElementById('setup-origin-url');
                if (urlInput) urlInput.value = data.hosting.publicAddress;
              }
            }
            if (data.notifications) {
              if (data.notifications.channel) {
                const chanSelect = document.getElementById('setup-notification-channel');
                if (chanSelect) chanSelect.value = data.notifications.channel;
              }
              const targetVal = data.notifications.target || data.notifications.topic;
              if (targetVal) {
                const targetInput = document.getElementById('setup-notification-target');
                if (targetInput) targetInput.value = targetVal;
              }
            }
            if (data.backups) {
              if (data.backups.destination) {
                const destSelect = document.getElementById('setup-backup-dest');
                if (destSelect) destSelect.value = data.backups.destination;
              }
              if (data.backups.agePublicKey) {
                const ageInput = document.getElementById('setup-age-key');
                if (ageInput) ageInput.value = data.backups.agePublicKey;
              }
            }
            if (data.themePreset) {
              const tr = document.querySelector('input[name="theme-preset"][value="' + data.themePreset + '"]');
              if (tr) {
                tr.checked = true;
                document.querySelectorAll('.theme-card').forEach(function(card) {
                  card.style.border = '1px solid var(--rule)';
                  card.style.background = 'transparent';
                });
                const parentLabel = tr.closest('.theme-card');
                if (parentLabel) {
                  parentLabel.style.border = '2px solid var(--accent)';
                  parentLabel.style.background = 'var(--surface-subtle)';
                }
              }
            }
          } catch (_) {}
        }

        function goToStep(stepNum) {
          currentActiveStep = stepNum;
          for (let i = 1; i <= 6; i++) {
            const stepEl = document.getElementById('wizard-step-' + i);
            const lblEl = document.getElementById('step-lbl-' + i);
            if (stepEl) {
              stepEl.style.display = i === stepNum ? 'block' : 'none';
            }
            if (lblEl) {
              if (i === stepNum) {
                lblEl.style.fontWeight = '700';
                lblEl.style.color = 'var(--text)';
              } else if (i < stepNum) {
                lblEl.style.fontWeight = '500';
                lblEl.style.color = 'var(--accent)';
              } else {
                lblEl.style.fontWeight = 'normal';
                lblEl.style.color = 'var(--text-muted)';
              }
            }
          }
          if (progressFill) {
            progressFill.style.width = Math.round((stepNum / 6) * 100) + '%';
          }
          if (chip) {
            chip.textContent = 'Step ' + stepNum + ' of 6 · First-Run Wizard';
          }
        }

        document.querySelectorAll('.btn-nav-step').forEach(function(btn) {
          btn.addEventListener('click', async function() {
            const target = parseInt(btn.getAttribute('data-target') || '1', 10);
            if (target > currentActiveStep) {
              await saveStep(currentActiveStep);
            }
            goToStep(target);
          });
        });

        document.querySelectorAll('input[name="theme-preset"]').forEach(function(radio) {
          radio.addEventListener('change', function() {
            document.querySelectorAll('.theme-card').forEach(function(card) {
              card.style.border = '1px solid var(--rule)';
              card.style.background = 'transparent';
            });
            const parentLabel = radio.closest('.theme-card');
            if (parentLabel) {
              parentLabel.style.border = '2px solid var(--accent)';
              parentLabel.style.background = 'var(--surface-subtle)';
            }
            saveStep(6);
          });
        });

        const finishLoginBtn = document.getElementById('btn-setup-finish-login');
        if (finishLoginBtn) {
          finishLoginBtn.addEventListener('click', async function() {
            await saveStep(6);
            await apiClient('/api/settings', {
              method: 'PATCH',
              body: JSON.stringify({ setupWizardCompleted: true })
            });
          });
        }
        const launchImportBtn = document.getElementById('btn-setup-launch-import');
        if (launchImportBtn) {
          launchImportBtn.addEventListener('click', async function() {
            await saveStep(6);
            await apiClient('/api/settings', {
              method: 'PATCH',
              body: JSON.stringify({ setupWizardCompleted: true })
            });
          });
        }

        restoreSettings();

        const continueBtn = document.getElementById('btn-continue-step2');
        if (continueBtn) {
          continueBtn.addEventListener('click', function() {
            goToStep(2);
          });
        }

        let cachedSetupData = null;

        form.addEventListener('submit', async function(e) {
          e.preventDefault();
          statusBox.style.display = 'none';
          const username = document.getElementById('setup-username').value;
          const password = document.getElementById('setup-password').value;
          const totpSecret = document.getElementById('setup-totp-secret').value || undefined;

          try {
            const res = await apiClient('/api/auth/setup', {
              method: 'POST',
              body: JSON.stringify({ username, password, totpSecret })
            });
            const data = await res.json();
            if (res.ok) {
              cachedSetupData = data;
              form.style.display = 'none';`;
