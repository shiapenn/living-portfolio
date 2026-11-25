import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';

export const ACCOUNT_SCRIPT = `
<script>
  (function() {
    ${ADMIN_API_CLIENT_SCRIPT}
    var banner = document.getElementById('settings-status-banner');
    var setBanner = function(msg, isErr) {
      if (!banner) return;
      var cls = isErr ? 'lp-notice lp-notice-danger' : 'lp-notice lp-notice-ok';
      var role = isErr ? 'alert' : 'status';
      banner.innerHTML = '<div class="' + cls + '" role="' + role + '">' + msg + '</div>';
    };

    var btnCreds = document.getElementById('btn-update-credentials');
    if (btnCreds) {
      btnCreds.addEventListener('click', async function() {
        var cur = document.getElementById('account-current-password');
        var user = document.getElementById('account-new-username');
        var pwd = document.getElementById('account-new-password');
        btnCreds.disabled = true;
        try {
          var res = await apiClient('/api/auth/account', {
            method: 'PATCH',
            body: JSON.stringify({
              currentPassword: cur ? cur.value : '',
              newUsername: user && user.value.trim() ? user.value.trim() : undefined,
              newPassword: pwd && pwd.value ? pwd.value : undefined,
            }),
          });
          var data = await res.json().catch(function() { return {}; });
          if (res.ok) {
            if (cur) cur.value = '';
            if (pwd) pwd.value = '';
            setBanner('Credentials updated.', false);
          } else {
            setBanner(data.message || data.error || 'Could not update credentials.', true);
          }
        } catch {
          setBanner('Network error updating credentials.', true);
        } finally {
          btnCreds.disabled = false;
        }
      });
    }

    var btnReenrol = document.getElementById('btn-reenrol-totp');
    var btnConfirmTotp = document.getElementById('btn-confirm-totp');
    var totpBox = document.getElementById('account-totp-reenrol-box');
    var totpQr = document.getElementById('account-totp-qr');
    var totpManual = document.getElementById('account-totp-manual');
    if (btnReenrol) {
      btnReenrol.addEventListener('click', async function() {
        btnReenrol.disabled = true;
        try {
          var res = await apiClient('/api/auth/totp/reenrol', { method: 'POST', body: '{}' });
          var data = await res.json().catch(function() { return {}; });
          if (res.ok) {
            if (totpBox) totpBox.classList.remove('lp-is-hidden');
            if (totpQr && data.qrCodeSvg) totpQr.innerHTML = data.qrCodeSvg;
            if (totpManual && data.totpSecretBase32) totpManual.textContent = 'Manual key: ' + data.totpSecretBase32;
            setBanner('Scan the QR code and enter a 6-digit code to confirm.', false);
          } else {
            setBanner(data.error || 'Could not start authenticator re-enrolment.', true);
          }
        } finally {
          btnReenrol.disabled = false;
        }
      });
    }
    if (btnConfirmTotp) {
      btnConfirmTotp.addEventListener('click', async function() {
        var codeEl = document.getElementById('account-totp-code');
        var code = codeEl ? codeEl.value.trim() : '';
        if (!code) { setBanner('Enter the 6-digit code first.', true); return; }
        btnConfirmTotp.disabled = true;
        try {
          var res = await apiClient('/api/auth/totp/reenrol/confirm', {
            method: 'POST',
            body: JSON.stringify({ code: code }),
          });
          var data = await res.json().catch(function() { return {}; });
          if (res.ok) {
            if (totpBox) totpBox.classList.add('lp-is-hidden');
            if (codeEl) codeEl.value = '';
            setBanner('Authenticator updated.', false);
          } else {
            setBanner(data.message || data.error || 'Invalid 6-digit code.', true);
          }
        } finally {
          btnConfirmTotp.disabled = false;
        }
      });
    }

    var btnRegen = document.getElementById('btn-regen-recovery');
    var recOut = document.getElementById('account-recovery-output');
    if (btnRegen) {
      btnRegen.addEventListener('click', async function() {
        btnRegen.disabled = true;
        try {
          var res = await apiClient('/api/auth/recovery-codes/regenerate', { method: 'POST', body: '{}' });
          var data = await res.json().catch(function() { return {}; });
          if (res.ok && Array.isArray(data.recoveryCodes)) {
            if (recOut) recOut.textContent = data.recoveryCodes.join('  ·  ');
            setBanner('Generated 8 new recovery codes. Save them now.', false);
          } else {
            setBanner(data.error || 'Could not regenerate recovery codes.', true);
          }
        } finally {
          btnRegen.disabled = false;
        }
      });
    }

    var tokensContainer = document.getElementById('account-tokens-container');
    var loadTokens = async function() {
      if (!tokensContainer) return;
      var res = await apiClient('/api/auth/tokens', { method: 'GET' });
      if (!res.ok) return;
      var data = await res.json().catch(function() { return { tokens: [] }; });
      var list = Array.isArray(data.tokens) ? data.tokens : [];
      if (list.length === 0) {
        tokensContainer.innerHTML = '';
        tokensContainer.classList.add('lp-is-empty');
        return;
      }
      tokensContainer.classList.remove('lp-is-empty');
      var items = list.map(function(t) {
        var status = t.revokedAt ? 'Revoked' : 'Active';
        var tone = t.revokedAt ? 'neutral' : 'ok';
        var titleHtml = '<div data-rel="title" class="lp-item-title"><span>' + (t.label || t.id) + '</span></div>';
        var statusHtml = '<div class="lp-item-status"><span data-c="StatusLabel" class="lp-status-label lp-status-label-' + tone + '">' + status + '</span></div>';
        if (t.revokedAt) {
          return '<div data-c="Item" data-rel="item" class="lp-item" data-token-id="' + t.id + '">' + titleHtml + statusHtml + '</div>';
        }
        var actionsHtml = '<div data-rel="actions" class="lp-item-actions"><div data-c="ActionBar" data-level="item" class="lp-action-bar lp-action-bar-item"><button type="button" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-sm" data-revoke-token="' + t.id + '">Revoke</button></div></div>';
        return '<div data-c="Item" data-rel="item" class="lp-item lp-item-has-actions" data-token-id="' + t.id + '"><div class="lp-item-content">' + titleHtml + statusHtml + '</div>' + actionsHtml + '</div>';
      }).join('');
      tokensContainer.innerHTML = items;
    };
    loadTokens();

    if (tokensContainer) {
      tokensContainer.addEventListener('click', async function(e) {
        var btn = e.target && e.target.closest ? e.target.closest('button[data-revoke-token]') : null;
        if (!btn) return;
        var id = btn.getAttribute('data-revoke-token');
        btn.disabled = true;
        var res = await apiClient('/api/auth/tokens/' + encodeURIComponent(id), { method: 'DELETE' });
        if (res.ok) {
          setBanner('Token revoked.', false);
          loadTokens();
        } else {
          setBanner('Could not revoke token.', true);
          btn.disabled = false;
        }
      });
    }

    var btnCreateToken = document.getElementById('btn-create-token');
    var tokenCreatedEl = document.getElementById('account-token-created');
    if (btnCreateToken) {
      btnCreateToken.addEventListener('click', async function() {
        var labelEl = document.getElementById('account-token-label');
        var label = labelEl && labelEl.value.trim() ? labelEl.value.trim() : 'owner-api-token';
        btnCreateToken.disabled = true;
        try {
          var res = await apiClient('/api/auth/tokens', {
            method: 'POST',
            body: JSON.stringify({ label: label }),
          });
          var data = await res.json().catch(function() { return {}; });
          if (res.ok && data.token) {
            if (tokenCreatedEl) tokenCreatedEl.textContent = 'Created token (' + label + '): ' + data.token;
            if (labelEl) labelEl.value = '';
            setBanner('API token created. Copy it now.', false);
            loadTokens();
          } else {
            setBanner(data.error || 'Could not create token.', true);
          }
        } finally {
          btnCreateToken.disabled = false;
        }
      });
    }

    var btnRevokeOthers = document.getElementById('btn-revoke-other-sessions');
    var sessionsOut = document.getElementById('account-sessions-result');
    if (btnRevokeOthers) {
      btnRevokeOthers.addEventListener('click', async function() {
        btnRevokeOthers.disabled = true;
        try {
          var res = await apiClient('/api/auth/sessions/revoke-others', { method: 'POST', body: '{}' });
          var data = await res.json().catch(function() { return {}; });
          if (res.ok) {
            if (sessionsOut) sessionsOut.textContent = 'Signed out ' + (data.revokedCount || 0) + ' other session(s).';
            setBanner('Other sessions signed out.', false);
          } else {
            setBanner('Could not sign out other sessions.', true);
          }
        } finally {
          btnRevokeOthers.disabled = false;
        }
      });
    }
  })();
</script>`;
