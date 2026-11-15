export const SETUP_SCRIPT_PART_2 = `              const qrBox = document.getElementById('setup-qr-code');
              if (qrBox) qrBox.innerHTML = data.qrCodeSvg || '';
              const keyEl = document.getElementById('setup-manual-key');
              if (keyEl) keyEl.textContent = data.totpSecretBase32 || '';
              const enrolBox = document.getElementById('totp-enrolment-container');
              if (enrolBox) enrolBox.classList.remove('lp-is-hidden');
            } else if (res.status === 409) {
              statusBox.className = 'lp-notice lp-notice-warn';
              statusBox.textContent = data.error || 'Account setup already completed.';
            } else if (res.status >= 500) {
              statusBox.className = 'lp-notice lp-notice-danger';
              statusBox.textContent = 'Server error during setup. Please retry.';
            } else {
              statusBox.className = 'lp-notice lp-notice-danger';
              statusBox.textContent = data.error || ('Setup failed (HTTP ' + res.status + ')');
            }
          } catch (err) {
            statusBox.className = 'lp-notice lp-notice-danger';
            statusBox.textContent = 'Network error during setup.';
          }
        });

        const confirmForm = document.getElementById('totp-confirm-form');
        if (confirmForm) {
          confirmForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const codeInput = document.getElementById('confirm-totp-code');
            const code = codeInput ? codeInput.value.trim() : '';
            const confirmError = document.getElementById('totp-confirm-error');
            if (confirmError) confirmError.classList.add('lp-is-hidden');

            try {
              const res = await apiClient('/api/auth/totp/confirm', {
                method: 'POST',
                body: JSON.stringify({ code })
              });
              const data = await res.json();
              if (res.ok) {
                if (data.csrfToken) {
                  sessionStorage.setItem('lp_csrf_token', data.csrfToken);
                }
                const enrolBox = document.getElementById('totp-enrolment-container');
                if (enrolBox) enrolBox.classList.add('lp-is-hidden');
                statusBox.className = 'lp-notice lp-notice-info';
                const secret = (cachedSetupData && cachedSetupData.totpSecret) || '';
                // Per D-12 & WP-13.2: Stop showing the bearer token in the wizard
                statusBox.innerHTML = '<strong>Setup Completed!</strong> Authenticator enrolled and session established. TOTP secret hex: <code>' + secret + '</code>.';

                const credBox = document.getElementById('credentials-display-container');
                if (credBox) {
                  const keyEl = document.getElementById('credentials-totp-key');
                  if (keyEl) keyEl.textContent = (cachedSetupData && (cachedSetupData.totpSecretBase32 || cachedSetupData.totpSecret)) || '';
                  const grid = document.getElementById('recovery-codes-grid');
                  if (grid && cachedSetupData && cachedSetupData.recoveryCodes) {
                    grid.innerHTML = cachedSetupData.recoveryCodes.map(function(c) {
                      return '<div class="lp-code-cell"><code>' + c + '</code></div>';
                    }).join('');
                  }
                  credBox.classList.remove('lp-is-hidden');
                }
              } else {
                if (confirmError) {
                  confirmError.textContent = data.message || data.error || 'Invalid TOTP code. Please check your authenticator app.';
                  confirmError.classList.remove('lp-is-hidden');
                }
              }
            } catch (err) {
              if (confirmError) {
                confirmError.textContent = 'Network error verifying TOTP code.';
                confirmError.classList.remove('lp-is-hidden');
              }
            }
          });
        }

        // Credentials screen interactive handlers (WP-13.3, UX-30)
        const savedGate = document.getElementById('setup-saved-credentials-gate');
        if (savedGate && continueBtn) {
          savedGate.addEventListener('change', function() {
            if (savedGate.checked) {
              continueBtn.disabled = false;
              continueBtn.removeAttribute('disabled');
            } else {
              continueBtn.disabled = true;
              continueBtn.setAttribute('disabled', 'disabled');
            }
          });
        }

        const downloadBtn = document.getElementById('btn-download-recovery-codes');
        if (downloadBtn) {
          downloadBtn.addEventListener('click', function() {
            const codes = (cachedSetupData && cachedSetupData.recoveryCodes) || [];
            const username = (cachedSetupData && cachedSetupData.username) || 'owner';
            const text = 'Living Portfolio Emergency Recovery Codes\\n' +
              'Account: ' + username + '\\n' +
              'Generated: ' + new Date().toISOString() + '\\n\\n' +
              'Each code can be used once if you lose access to your authenticator app:\\n\\n' +
              codes.map(function(c, i) { return (i + 1) + '. ' + c; }).join('\\n') + '\\n';
            const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'living-portfolio-recovery-codes.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          });
        }

        const copyCodesBtn = document.getElementById('btn-copy-recovery-codes');
        if (copyCodesBtn) {
          copyCodesBtn.addEventListener('click', function() {
            const codes = (cachedSetupData && cachedSetupData.recoveryCodes) || [];
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(codes.join('\\n'));
              copyCodesBtn.textContent = 'Copied!';
              setTimeout(function() { copyCodesBtn.textContent = 'Copy All'; }, 2000);
            }
          });
        }

        const copyKeyBtn = document.getElementById('btn-copy-totp-key');
        if (copyKeyBtn) {
          copyKeyBtn.addEventListener('click', function() {
            const key = (cachedSetupData && (cachedSetupData.totpSecretBase32 || cachedSetupData.totpSecret)) || '';
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(key);
              copyKeyBtn.textContent = 'Copied!';
              setTimeout(function() { copyKeyBtn.textContent = 'Copy Key'; }, 2000);
            }
          });
        }

        // Step 4: Notification test disabled in this version (UX-33, WP-17.2)
        const notifTargetInput = document.getElementById('setup-notification-target');
        const testAlertBtn = document.getElementById('btn-setup-test-alert');
        const alertDisabledReason = document.getElementById('setup-alert-disabled-reason');
        function updateAlertButton() {
          if (!testAlertBtn) return;
          testAlertBtn.disabled = true;
          if (alertDisabledReason) {
            alertDisabledReason.classList.remove('lp-is-hidden');
          }
        }
        if (notifTargetInput) {
          notifTargetInput.addEventListener('input', updateAlertButton);
          updateAlertButton();
        }

        const alertResult = document.getElementById('setup-alert-result');
        if (testAlertBtn && alertResult) {
          testAlertBtn.addEventListener('click', async function() {
            alertResult.classList.add('lp-is-hidden');
            try {
              const res = await apiClient('/api/settings/notifications/test', { method: 'POST' });
              const data = await res.json();
              alertResult.className = 'lp-notice lp-notice-warn';
              alertResult.textContent = data.message || "Test alerts aren't available in this version yet.";
            } catch (err) {
              alertResult.className = 'lp-notice lp-notice-warn';
              alertResult.textContent = "Test alerts aren't available in this version yet.";
            }
          });
        }

        // Step 5: Test Drill button
        const testDrillBtn = document.getElementById('btn-setup-test-drill');
        const drillResult = document.getElementById('setup-drill-result');
        if (testDrillBtn && drillResult) {
          testDrillBtn.addEventListener('click', async function() {
            drillResult.classList.add('lp-is-hidden');
            const destFolder = (document.getElementById('setup-backup-dir') || {}).value || './data/backups';
            const ageKey = (document.getElementById('setup-age-key') || {}).value || '';

            try {
              const res = await apiClient('/api/settings/backups/run-drill', {
                method: 'POST',
                body: JSON.stringify({ destinationDir: destFolder.trim() || undefined, agePublicKey: ageKey.trim() || undefined })
              });
              const data = await res.json();
              if (res.status === 501) {
                drillResult.className = 'lp-notice lp-notice-warn';
                drillResult.textContent = data.message || 'Not available until a backup folder is set';
              } else if (res.ok && data.ok) {
                drillResult.className = 'lp-chip';
                drillResult.textContent = '✓ Backup created & restore verification drill succeeded!';
              } else {
                drillResult.className = 'lp-notice lp-notice-danger';
                drillResult.textContent = data.message || data.error || "The app can't write to that folder. Choose another folder or fix its permissions.";
              }
            } catch (err) {
              drillResult.className = 'lp-notice lp-notice-danger';
              drillResult.textContent = "The app can't write to that folder. Choose another folder or fix its permissions.";
            }
          });
        }

        // Step 6: Trigger static deploy on finish
        const finishBtn = document.getElementById('btn-setup-finish-login');
        if (finishBtn) {
          finishBtn.addEventListener('click', function() {
            apiClient('/api/publish/now', { method: 'POST' }).catch(function() {});
          });
        }
      })();
    </script>`;
