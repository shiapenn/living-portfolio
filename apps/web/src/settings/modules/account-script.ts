import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';

export const ACCOUNT_SCRIPT = `
<script>
  (function() {
    ${ADMIN_API_CLIENT_SCRIPT}
    var credsNotice = document.getElementById('account-creds-notice');
    var totpNotice = document.getElementById('account-totp-notice');
    var recoveryNotice = document.getElementById('account-recovery-notice');
    var tokensNotice = document.getElementById('account-tokens-notice');
    var tokensListNotice = document.getElementById('account-tokens-list-notice');
    var sessionsNotice = document.getElementById('account-sessions-notice');

    var showSectionNotice = function(el, msg, isErr) {
      if (!el) return;
      el.setAttribute('data-c', 'Notice');
      el.className = 'lp-notice ' + (isErr ? 'lp-notice-danger' : 'lp-notice-ok');
      el.textContent = msg;
      try { el.scrollIntoView({ block: 'center', behavior: 'instant' }); } catch {}
      try { el.focus({ preventScroll: true }); } catch {}
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
            showSectionNotice(credsNotice, 'Credentials updated.', false);
          } else {
            showSectionNotice(credsNotice, data.message || data.error || 'Could not update credentials.', true);
          }
        } catch {
          showSectionNotice(credsNotice, 'Network error updating credentials.', true);
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
            showSectionNotice(totpNotice, 'Scan the QR code and enter a 6-digit code to confirm.', false);
          } else {
            showSectionNotice(totpNotice, data.error || 'Could not start authenticator re-enrolment.', true);
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
        if (!code) { showSectionNotice(totpNotice, 'Enter the 6-digit code first.', true); return; }
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
            showSectionNotice(totpNotice, 'Authenticator updated.', false);
          } else {
            showSectionNotice(totpNotice, data.message || data.error || 'Invalid 6-digit code.', true);
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
            showSectionNotice(recoveryNotice, 'Generated 8 new recovery codes. Save them now.', false);
          } else {
            showSectionNotice(recoveryNotice, data.error || 'Could not regenerate recovery codes.', true);
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
        tokensContainer.innerHTML = '<div class="lp-empty-state"><p data-c="Text" data-variant="description" class="lp-empty-body">No API tokens created yet.</p></div>';
        tokensContainer.classList.remove('lp-is-empty');
        return;
      }
      tokensContainer.classList.remove('lp-is-empty');
      var items = list.map(function(t) {
        var status = t.revokedAt ? 'Revoked' : 'Active';
        var tone = t.revokedAt ? 'neutral' : 'ok';
        var titleHtml = '<div data-rel="title" class="lp-item-title"><span>' + (t.label || 'Token') + '</span></div>';
        var statusHtml = '<div class="lp-item-status"><span data-c="StatusLabel" class="lp-status-indicator"><span class="lp-status-dot lp-status-dot-' + tone + '" aria-hidden="true"></span><span class="lp-status-label">' + status + '</span></span></div>';
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
          showSectionNotice(tokensListNotice, 'Token revoked.', false);
          loadTokens();
        } else {
          showSectionNotice(tokensListNotice, 'Could not revoke token.', true);
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
            showSectionNotice(tokensNotice, 'API token created. Copy it now.', false);
            loadTokens();
          } else {
            showSectionNotice(tokensNotice, data.error || 'Could not create token.', true);
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
            var count = Number(data.revokedCount || 0);
            if (sessionsOut) sessionsOut.textContent = count === 1 ? 'Signed out 1 other session.' : 'Signed out ' + count + ' other sessions.';
            showSectionNotice(sessionsNotice, 'Other sessions signed out.', false);
          } else {
            showSectionNotice(sessionsNotice, 'Could not sign out other sessions.', true);
          }
        } finally {
          btnRevokeOthers.disabled = false;
        }
      });
    }
  })();
</script>`;
