import { ADMIN_API_CLIENT_SCRIPT } from '../../lib/admin-api-client.js';
import { CREDENTIAL_CLIENT_SCRIPT } from '../../components/credential.js';

export const ACCOUNT_SCRIPT = `
<script>
  (function() {
    ${ADMIN_API_CLIENT_SCRIPT}
    ${CREDENTIAL_CLIENT_SCRIPT}
    var credsNotice = document.getElementById('account-creds-notice');
    var totpNotice = document.getElementById('account-totp-notice');
    var recoveryNotice = document.getElementById('account-recovery-notice');
    var tokensNotice = document.getElementById('account-tokens-notice');
    var tokensListNotice = document.getElementById('account-tokens-list-notice');
    var sessionsNotice = document.getElementById('account-sessions-notice');

    // ADR-025 C2: Action error = danger Notice below ActionBar (assertive); Action success = polite StatusLine (not green Notice)
    var showSectionError = function(el, msg) {
      if (!el) return;
      el.setAttribute('data-c', 'Notice');
      el.setAttribute('aria-live', 'assertive');
      el.className = 'lp-notice lp-notice-danger';
      el.textContent = msg;
      try { el.scrollIntoView({ block: 'center', behavior: 'instant' }); } catch {}
      try { el.focus({ preventScroll: true }); } catch {}
    };
    var showSectionStatus = function(el, msg) {
      if (!el) return;
      el.removeAttribute('data-c');
      el.setAttribute('aria-live', 'polite');
      el.className = 'lp-status-line lp-status-line-ok';
      el.textContent = msg;
      try { el.scrollIntoView({ block: 'nearest', behavior: 'instant' }); } catch {}
    };
    var clearSectionFeedback = function(el) {
      if (!el) return;
      el.className = 'lp-is-hidden';
      el.textContent = '';
    };

    var credsSec = document.getElementById('account-credentials-section');
    if (credsSec) credsSec.addEventListener('input', function() { clearSectionFeedback(credsNotice); });
    var totpSec = document.getElementById('account-totp-section');
    if (totpSec) totpSec.addEventListener('input', function() { clearSectionFeedback(totpNotice); });

    var btnCreds = document.getElementById('btn-update-credentials');
    if (btnCreds) {
      btnCreds.addEventListener('click', async function() {
        var cur = document.getElementById('account-current-password');
        var user = document.getElementById('account-new-username');
        var pwd = document.getElementById('account-new-password');
        clearSectionFeedback(credsNotice);
        btnCreds.disabled = true;
        btnCreds.textContent = 'Saving…';
        if (credsSec) credsSec.setAttribute('aria-busy', 'true');
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
            showSectionStatus(credsNotice, 'Credentials updated.');
          } else {
            showSectionError(credsNotice, data.message || data.error || 'Could not update credentials.');
          }
        } catch {
          showSectionError(credsNotice, 'Network error updating credentials.');
        } finally {
          btnCreds.disabled = false;
          btnCreds.textContent = 'Save credentials';
          if (credsSec) credsSec.removeAttribute('aria-busy');
        }
      });
    }

    var btnReenrol = document.getElementById('btn-reenrol-totp');
    var btnConfirmTotp = document.getElementById('btn-confirm-totp');
    var totpBox = document.getElementById('account-totp-reenrol-box');
    var totpQr = document.getElementById('account-totp-qr');
    if (btnReenrol) {
      btnReenrol.addEventListener('click', async function() {
        clearSectionFeedback(totpNotice);
        btnReenrol.disabled = true;
        try {
          var res = await apiClient('/api/auth/totp/reenrol', { method: 'POST', body: '{}' });
          var data = await res.json().catch(function() { return {}; });
          if (res.ok) {
            if (totpBox) totpBox.classList.remove('lp-is-hidden');
            if (totpQr && data.qrCodeSvg) totpQr.innerHTML = data.qrCodeSvg;
            if (data.totpSecretBase32) lpSetCredentialSingle('account-totp-manual-cred', data.totpSecretBase32, true);
          } else {
            showSectionError(totpNotice, data.error || 'Could not start authenticator re-enrolment.');
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
        if (!code) { showSectionError(totpNotice, 'Enter the 6-digit code first.'); return; }
        clearSectionFeedback(totpNotice);
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
            showSectionStatus(totpNotice, 'Authenticator updated.');
          } else {
            showSectionError(totpNotice, data.message || data.error || 'Invalid 6-digit code.');
          }
        } finally {
          btnConfirmTotp.disabled = false;
        }
      });
    }

    var btnRegen = document.getElementById('btn-regen-recovery');
    if (btnRegen) {
      btnRegen.addEventListener('click', async function() {
        clearSectionFeedback(recoveryNotice);
        btnRegen.disabled = true;
        try {
          var res = await apiClient('/api/auth/recovery-codes/regenerate', { method: 'POST', body: '{}' });
          var data = await res.json().catch(function() { return {}; });
          if (res.ok && Array.isArray(data.recoveryCodes)) {
            lpSetCredentialList('account-recovery-output', data.recoveryCodes);
            var hint = document.getElementById('account-recovery-hint');
            if (hint) hint.classList.add('lp-is-hidden');
          } else {
            showSectionError(recoveryNotice, data.error || 'Could not regenerate recovery codes.');
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
      var list = Array.isArray(data.tokens) ? data.tokens.filter(function(t) { return !t.revokedAt; }) : [];
      if (list.length === 0) {
        tokensContainer.innerHTML = '<div class="lp-empty-state"><p data-c="Text" data-variant="description" class="lp-empty-body">No active API tokens.</p></div>';
        tokensContainer.classList.remove('lp-is-empty');
        return;
      }
      tokensContainer.classList.remove('lp-is-empty');
      var fmtTokenDate = function(iso) {
        if (!iso) return '';
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
        return d.getDate() + ' ' + m + ' ' + d.getFullYear();
      };
      var items = list.map(function(t) {
        var titleHtml = '<div data-rel="title" class="lp-item-title"><span>' + (t.label || 'Token') + '</span></div>';
        var created = fmtTokenDate(t.createdAt || t.created_at);
        var lastUsed = fmtTokenDate(t.lastUsedAt || t.last_used_at);
        var metaParts = [];
        if (created) metaParts.push('<span class="lp-item-meta-field">Created ' + created + '</span>');
        if (lastUsed) metaParts.push('<span class="lp-item-meta-field">Last used ' + lastUsed + '</span>');
        var metaHtml = metaParts.length > 0 ? '<div class="lp-item-meta">' + metaParts.join('') + '</div>' : '';
        var actionsHtml = '<div data-rel="actions" class="lp-item-actions"><div data-c="ActionBar" data-level="item" class="lp-action-bar lp-action-bar-item"><button type="button" data-c="Button" class="lp-btn lp-btn-secondary lp-btn-sm" data-revoke-token="' + t.id + '">Revoke</button></div></div>';
        return '<div data-c="Item" data-rel="item" class="lp-item lp-item-has-actions" data-token-id="' + t.id + '"><div class="lp-item-content">' + titleHtml + metaHtml + '</div>' + actionsHtml + '</div>';
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
          showSectionStatus(tokensListNotice, 'Token revoked.');
          loadTokens();
        } else {
          showSectionError(tokensListNotice, 'Could not revoke token.');
          btn.disabled = false;
        }
      });
    }

    var btnCreateToken = document.getElementById('btn-create-token');
    if (btnCreateToken) {
      btnCreateToken.addEventListener('click', async function() {
        var labelEl = document.getElementById('account-token-label');
        var label = labelEl && labelEl.value.trim() ? labelEl.value.trim() : 'owner-api-token';
        clearSectionFeedback(tokensNotice);
        btnCreateToken.disabled = true;
        try {
          var res = await apiClient('/api/auth/tokens', {
            method: 'POST',
            body: JSON.stringify({ label: label }),
          });
          var data = await res.json().catch(function() { return {}; });
          if (res.ok && data.token) {
            lpSetCredentialSingle('account-token-created', data.token, false);
            if (labelEl) labelEl.value = '';
            loadTokens();
          } else {
            showSectionError(tokensNotice, data.error || 'Could not create token.');
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
        clearSectionFeedback(sessionsNotice);
        btnRevokeOthers.disabled = true;
        try {
          var res = await apiClient('/api/auth/sessions/revoke-others', { method: 'POST', body: '{}' });
          var data = await res.json().catch(function() { return {}; });
          if (res.ok) {
            var count = Number(data.revokedCount || 0);
            if (sessionsOut) sessionsOut.textContent = count === 1 ? 'Signed out 1 other session.' : 'Signed out ' + count + ' other sessions.';
            showSectionStatus(sessionsNotice, 'Other sessions signed out.');
          } else {
            showSectionError(sessionsNotice, 'Could not sign out other sessions.');
          }
        } finally {
          btnRevokeOthers.disabled = false;
        }
      });
    }
  })();
</script>`;
