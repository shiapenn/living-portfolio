export const SETUP_SCRIPT_PART_2 = `              const qrBox = document.getElementById('setup-qr-code');
              if (qrBox) qrBox.innerHTML = data.qrCodeSvg || '';
              const keyEl = document.getElementById('setup-manual-key');
              if (keyEl) keyEl.textContent = data.totpSecretBase32 || '';
              const enrolBox = document.getElementById('totp-enrolment-container');
              if (enrolBox) enrolBox.style.display = 'block';
            } else if (res.status === 409) {
              statusBox.className = 'later-thinking-banner';
              statusBox.textContent = data.error || 'Account setup already completed.';
              statusBox.style.display = 'block';
            } else if (res.status >= 500) {
              statusBox.className = 'later-thinking-banner';
              statusBox.textContent = 'Server error during setup. Please retry.';
              statusBox.style.display = 'block';
            } else {
              statusBox.className = 'later-thinking-banner';
              statusBox.textContent = data.error || ('Setup failed (HTTP ' + res.status + ')');
              statusBox.style.display = 'block';
            }
          } catch (err) {
            statusBox.className = 'later-thinking-banner';
            statusBox.textContent = 'Network error during setup.';
            statusBox.style.display = 'block';
          }
        });

        const confirmForm = document.getElementById('totp-confirm-form');
        if (confirmForm) {
          confirmForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const codeInput = document.getElementById('confirm-totp-code');
            const code = codeInput ? codeInput.value.trim() : '';
            const confirmError = document.getElementById('totp-confirm-error');
            if (confirmError) confirmError.style.display = 'none';

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
                if (enrolBox) enrolBox.style.display = 'none';
                statusBox.className = 'as-of-banner';
                const secret = (cachedSetupData && cachedSetupData.totpSecret) || '';
                // Per D-12 & WP-13.2: Stop showing the bearer token in the wizard
                statusBox.innerHTML = '<strong>Setup Completed!</strong> Authenticator enrolled and session established. TOTP secret hex: <code>' + secret + '</code>.';
                statusBox.style.display = 'block';

                const credBox = document.getElementById('credentials-display-container');
                if (credBox) {
                  const keyEl = document.getElementById('credentials-totp-key');
                  if (keyEl) keyEl.textContent = (cachedSetupData && (cachedSetupData.totpSecretBase32 || cachedSetupData.totpSecret)) || '';
                  const grid = document.getElementById('recovery-codes-grid');
                  if (grid && cachedSetupData && cachedSetupData.recoveryCodes) {
                    grid.innerHTML = cachedSetupData.recoveryCodes.map(function(c) {
                      return '<div style="padding:4px 8px;background:var(--surface);border:1px solid var(--rule);border-radius:4px;text-align:center"><code>' + c + '</code></div>';
                    }).join('');
                  }
                  credBox.style.display = 'block';
                }
              } else {
                if (confirmError) {
                  confirmError.textContent = data.message || data.error || 'Invalid TOTP code. Please check your authenticator app.';
                  confirmError.style.display = 'block';
                }
              }
            } catch (err) {
              if (confirmError) {
                confirmError.textContent = 'Network error verifying TOTP code.';
                confirmError.style.display = 'block';
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
            alertDisabledReason.style.display = 'block';
          }
        }
        if (notifTargetInput) {
          notifTargetInput.addEventListener('input', updateAlertButton);
          updateAlertButton();
        }

        const alertResult = document.getElementById('setup-alert-result');
        if (testAlertBtn && alertResult) {
          testAlertBtn.addEventListener('click', async function() {
            alertResult.style.display = 'none';
            try {
              const res = await apiClient('/api/settings/notifications/test', { method: 'POST' });
              const data = await res.json();
              alertResult.className = 'later-thinking-banner';
              alertResult.textContent = data.message || "Test alerts aren't available in this version yet.";
              alertResult.style.display = 'block';
            } catch (err) {
              alertResult.className = 'later-thinking-banner';
              alertResult.textContent = "Test alerts aren't available in this version yet.";
              alertResult.style.display = 'block';
            }
          });
        }

        // Step 5: Test Drill button
        const testDrillBtn = document.getElementById('btn-setup-test-drill');
        const drillResult = document.getElementById('setup-drill-result');
        if (testDrillBtn && drillResult) {
          testDrillBtn.addEventListener('click', async function() {
            drillResult.style.display = 'none';
            const destFolder = (document.getElementById('setup-backup-dir') || {}).value || './data/backups';
            const ageKey = (document.getElementById('setup-age-key') || {}).value || '';

            try {
              const res = await apiClient('/api/settings/backups/run-drill', {
                method: 'POST',
                body: JSON.stringify({ destinationDir: destFolder.trim() || undefined, agePublicKey: ageKey.trim() || undefined })
              });
              const data = await res.json();
              if (res.status === 501) {
                drillResult.className = 'later-thinking-banner';
                drillResult.textContent = data.message || 'Not available until a backup folder is set';
                drillResult.style.display = 'block';
              } else if (res.ok && data.ok) {
                drillResult.className = 'chip';
                drillResult.textContent = '✓ Backup created & restore verification drill succeeded!';
                drillResult.style.display = 'block';
              } else {
                drillResult.className = 'later-thinking-banner';
                drillResult.textContent = data.message || data.error || "The app can't write to that folder. Choose another folder or fix its permissions.";
                drillResult.style.display = 'block';
              }
            } catch (err) {
              drillResult.className = 'later-thinking-banner';
              drillResult.textContent = "The app can't write to that folder. Choose another folder or fix its permissions.";
              drillResult.style.display = 'block';
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
