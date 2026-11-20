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

        // Step 3: Embedded ProviderFlow interactive handler
        const providerRoot = document.getElementById('setup-provider-flow-root');
        const providerStatus = document.getElementById('setup-provider-status');
        if (providerRoot) {
          const catalog = {
            local: { label: 'Local only', requiresKey: false, models: [] },
            openai: { label: 'OpenAI Compatible', requiresKey: true, models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'] },
            anthropic: { label: 'Anthropic', requiresKey: true, models: ['claude-3-5-haiku-latest', 'claude-3-7-sonnet-latest'] },
            ollama: { label: 'Ollama', requiresKey: false, models: ['llama3.2', 'qwen2.5', 'mistral'] },
          };
          let pfStep = 1;
          let pfProvider = 'local';
          let pfModel = '';
          const escHtml = function(s) {
            return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          };
          const renderSubstep = function(step) {
            const meta = catalog[pfProvider] || catalog.local;
            const total = meta.requiresKey ? 3 : 2;
            const stepName = step === 2 ? 'Model' : 'Key';
            const pct = Math.round((Math.min(step, total) / total) * 100);
            const stepperHtml = '<div id="lp-provider-stepper" class="lp-stepper" data-c="Stepper" data-rel="stepper">' +
              '<div class="lp-stepper-meta"><span class="lp-stepper-count">Step ' + Math.min(step, total) + ' of ' + total + ' · ' + stepName + '</span></div>' +
              '<div class="lp-stepper-bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><div class="lp-stepper-fill"></div></div>' +
              '</div>';
            if (step === 2) {
              const fieldHtml = meta.models.length > 0
                ? '<div class="lp-field" data-c="Field" data-rel="field"><label for="lp-provider-model" class="lp-field-label">Model</label><div class="lp-select-wrap"><select id="lp-provider-model" name="model" class="lp-select">' +
                  meta.models.map(function(m) { return '<option value="' + escHtml(m) + '"' + (m === pfModel ? ' selected' : '') + '>' + escHtml(m) + '</option>'; }).join('') +
                  '</select><span class="lp-select-chevron" aria-hidden="true"><svg class="lp-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg></span></div><div class="lp-field-help">Choose the model used for answering.</div></div>'
                : '<div class="lp-field" data-c="Field" data-rel="field"><label for="lp-provider-model" class="lp-field-label">Model</label><input id="lp-provider-model" name="model" type="text" class="lp-input" value="' + escHtml(pfModel) + '" placeholder="Enter model name" /><div class="lp-field-help">Leave blank for extractive local quotes only.</div></div>';
              const btnId = meta.requiresKey ? 'lp-provider-next' : 'lp-provider-save';
              const btnLabel = meta.requiresKey ? 'Next' : 'Save';
              providerRoot.innerHTML = '<div class="lp-stack lp-gap-group">' + stepperHtml + fieldHtml + '<div class="lp-action-bar" data-c="ActionBar" data-rel="actions"><button id="' + btnId + '" type="button" class="lp-btn lp-btn-secondary">' + btnLabel + '</button></div></div>';
            } else if (step === 3) {
              const keyHtml = '<div class="lp-field" data-c="Field" data-rel="field"><label for="lp-provider-key" class="lp-field-label">API key</label><input id="lp-provider-key" name="apiKey" type="password" class="lp-input" placeholder="Paste key" autocomplete="off" /><div class="lp-field-help">Write-only: stored encrypted and never shown again.</div></div>';
              providerRoot.innerHTML = '<div class="lp-stack lp-gap-group">' + stepperHtml + keyHtml + '<div class="lp-action-bar" data-c="ActionBar" data-rel="actions"><button id="lp-provider-test-save" type="button" class="lp-btn lp-btn-secondary">Test and save</button></div></div>';
            }
            const fillEl = providerRoot.querySelector('.lp-stepper-fill');
            if (fillEl) fillEl.style.width = pct + '%';
          };
          providerRoot.addEventListener('click', async function(e) {
            const target = e.target;
            if (!(target instanceof Element)) return;
            const nextBtn = target.closest('#lp-provider-next');
            if (nextBtn) {
              if (pfStep === 1) {
                const checked = providerRoot.querySelector('input[name="provider"]:checked');
                if (checked) pfProvider = checked.value;
                const meta = catalog[pfProvider] || catalog.local;
                pfModel = meta.models[0] || '';
                pfStep = 2;
                renderSubstep(2);
              } else if (pfStep === 2) {
                const modelEl = document.getElementById('lp-provider-model');
                if (modelEl) pfModel = modelEl.value || '';
                pfStep = 3;
                renderSubstep(3);
              }
              return;
            }
            const saveBtn = target.closest('#lp-provider-save, #lp-provider-test-save');
            if (saveBtn) {
              const modelEl2 = document.getElementById('lp-provider-model');
              if (modelEl2) pfModel = modelEl2.value || pfModel;
              const keyEl = document.getElementById('lp-provider-key');
              const apiKey = keyEl ? keyEl.value.trim() : '';
              if (saveBtn.id === 'lp-provider-test-save' && !apiKey) {
                if (providerStatus) {
                  providerStatus.hidden = false;
                  providerStatus.textContent = 'Enter an API key to test and save.';
                }
                return;
              }
              try {
                const res = await apiClient('/api/settings', {
                  method: 'PUT',
                  body: JSON.stringify({ provider: pfProvider, model: pfModel || undefined, apiKey: apiKey || undefined })
                });
                if (res.ok) {
                  const stEl = document.getElementById('status-' + pfProvider);
                  if (stEl) stEl.textContent = 'Connected';
                  if (providerStatus) {
                    providerStatus.hidden = false;
                    providerStatus.textContent = 'Saved ' + ((catalog[pfProvider] && catalog[pfProvider].label) || pfProvider) + (pfModel ? ' · ' + pfModel : '') + '.';
                  }
                } else if (providerStatus) {
                  providerStatus.hidden = false;
                  providerStatus.textContent = 'Could not verify provider key. Nothing was saved.';
                }
              } catch (_) {
                if (providerStatus) {
                  providerStatus.hidden = false;
                  providerStatus.textContent = 'Network error. Nothing was saved.';
                }
              }
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
