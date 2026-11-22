import { renderAdminShell } from "../../layouts/admin-shell.js";
import { ADMIN_API_CLIENT_SCRIPT } from "../../lib/admin-api-client.js";
import { renderActionBar } from "../../primitives/index.js";

export function renderAdminLoginPage(): string {
  const content = `
    <div class="lp-page-column lp-page-column-narrow lp-auth-column lp-stack lp-gap-group">
      <div class="lp-page-header">
        <h1 class="lp-page-title">Owner Sign in</h1>
        <p class="lp-page-description">
          Enter your admin credentials and 6-digit TOTP code to access the workspace.
        </p>
      </div>

      <div id="login-error" class="lp-notice lp-notice-danger lp-is-hidden" role="alert"></div>

      <form id="admin-login-form" class="lp-stack lp-gap-group">
        <div class="lp-stack lp-gap-related">
        <div class="lp-field">
          <label class="lp-field-label" for="login-username">Username</label>
          <input id="login-username" type="text" class="lp-input" autocomplete="username" required />
        </div>
        <div class="lp-field">
          <label class="lp-field-label" for="login-password">Password</label>
          <input id="login-password" type="password" class="lp-input" autocomplete="current-password" required />
        </div>
        <div class="lp-field">
          <label id="login-code-label" class="lp-field-label" for="login-totp">6-Digit Authenticator Code</label>
          <input id="login-totp" type="text" class="lp-input lp-input-code" placeholder="000000" autocomplete="one-time-code" required />
          <p id="login-code-help" class="lp-field-help">
            Enter the 6-digit verification code from your authenticator app (Google Authenticator, 1Password, etc.).
          </p>
        </div>
        </div>
        ${renderActionBar({
          primary: { label: 'Sign in', variant: 'primary', type: 'submit' },
          textAction: { id: 'btn-toggle-recovery', label: 'Lost your authenticator device? Sign in with a recovery code', variant: 'text' },
        })}
      </form>
      <p class="lp-help-text">
        Login attempts are rate-limited to 5 per 15 minutes. If throttled: "Too many failed login attempts. Try again later."
      </p>
    </div>
    <script>
      (function() {
        const form = document.getElementById('admin-login-form');
        const errBox = document.getElementById('login-error');
        const toggleBtn = document.getElementById('btn-toggle-recovery');
        const codeLabel = document.getElementById('login-code-label');
        const codeInput = document.getElementById('login-totp');
        const codeHelp = document.getElementById('login-code-help');
        let recoveryMode = false;

        function checkMultipleCodes(val) {
          if (!val) return false;
          const lines = val.trim().split(new RegExp('\\r?\\n')).filter(function(l) { return l.trim().length > 0; });
          if (lines.length > 1) return true;
          const stripped = val.replace(new RegExp('[\\s-]+', 'g'), '');
          if (stripped.length >= 32) return true;
          const tokens = val.trim().split(new RegExp('\\s+'));
          if (tokens.length > 1) {
            const codeTokens = tokens.filter(function(t) { return new RegExp('^[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}$').test(t); });
            if (codeTokens.length > 1) return true;
          }
          return false;
        }

        const showErr = (msg) => {
          errBox.className = 'lp-notice lp-notice-danger';
          errBox.textContent = msg;
        };
        const hideErr = () => {
          errBox.className = 'lp-notice lp-notice-danger lp-is-hidden';
        };

        if (codeInput) {
          codeInput.addEventListener('paste', function(e) {
            const pasteData = (e.clipboardData || window.clipboardData) ? (e.clipboardData || window.clipboardData).getData('text') : '';
            if (pasteData && checkMultipleCodes(pasteData)) {
              e.preventDefault();
              showErr('Enter one code at a time');
              codeInput.value = '';
              return;
            }
          });
        }

        if (toggleBtn && codeLabel && codeInput && codeHelp) {
          toggleBtn.addEventListener('click', function() {
            recoveryMode = !recoveryMode;
            hideErr();
            if (recoveryMode) {
              codeLabel.textContent = 'Single-Use Recovery Code';
              codeInput.placeholder = 'xxxx-xxxx-xxxx-xxxx';
              codeHelp.textContent = 'Enter one of your 8 emergency alphanumeric recovery codes. Each code can only be used once.';
              toggleBtn.textContent = 'Have your authenticator? Use 6-digit TOTP code';
            } else {
              codeLabel.textContent = '6-Digit Authenticator Code';
              codeInput.placeholder = '000000';
              codeHelp.textContent = 'Enter the 6-digit verification code from your authenticator app (Google Authenticator, 1Password, etc.).';
              toggleBtn.textContent = 'Lost your authenticator device? Sign in with a recovery code';
            }
          });
        }

        ${ADMIN_API_CLIENT_SCRIPT}

        form.addEventListener('submit', async function(e) {
          e.preventDefault();
          hideErr();
          const username = document.getElementById('login-username').value;
          const password = document.getElementById('login-password').value;
          const rawCode = document.getElementById('login-totp').value.trim();

          if (checkMultipleCodes(rawCode)) {
            showErr('Enter one code at a time');
            return;
          }

          let normalizedCode = rawCode;
          if (recoveryMode || rawCode.includes('-')) {
            const noSpaces = rawCode.toLowerCase().replace(new RegExp('[\\s-]+', 'g'), '');
            if (new RegExp('^[a-z0-9]{16}$').test(noSpaces)) {
              normalizedCode = noSpaces.slice(0, 4) + '-' + noSpaces.slice(4, 8) + '-' + noSpaces.slice(8, 12) + '-' + noSpaces.slice(12, 16);
            } else if (new RegExp('^[a-z0-9]{8}$').test(noSpaces)) {
              normalizedCode = noSpaces.slice(0, 4) + '-' + noSpaces.slice(4);
            } else {
              normalizedCode = rawCode.trim();
            }
          }

          try {
            const payload = {
              username: username,
              password: password,
              totpCode: recoveryMode ? undefined : normalizedCode,
              recoveryCode: recoveryMode ? normalizedCode : undefined,
              code: normalizedCode,
            };
            const res = await apiClient('/api/auth/login', {
              method: 'POST',
              body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
              if (data.csrfToken) {
                sessionStorage.setItem('lp_csrf_token', data.csrfToken);
              }
              sessionStorage.setItem('lp_legacy_recovery_used', data.legacyRecoveryUsed ? 'true' : 'false');
              function sanitizeNext(target) {
                if (!target || typeof target !== 'string') return '/admin';
                var trimmed = target.trim();
                if (!trimmed || !trimmed.startsWith('/')) return '/admin';
                var bslash = String.fromCharCode(92);
                if (trimmed.startsWith('//') || trimmed.startsWith('/' + bslash) || trimmed.startsWith(bslash)) return '/admin';
                var decoded = trimmed;
                for (var i = 0; i < 3; i++) {
                  try {
                    var nextDecoded = decodeURIComponent(decoded);
                    if (nextDecoded === decoded) break;
                    decoded = nextDecoded;
                  } catch (_) {
                    return '/admin';
                  }
                }
                decoded = decoded.trim();
                if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.startsWith('/' + bslash) || decoded.startsWith(bslash)) return '/admin';
                for (var j = 0; j < decoded.length; j++) {
                  var code = decoded.charCodeAt(j);
                  if (code <= 32 || code === 127) return '/admin';
                }
                if (decoded.indexOf(bslash) !== -1) return '/admin';
                try {
                  var u = new URL(trimmed, window.location.origin);
                  if (u.origin !== window.location.origin) return '/admin';
                  if (u.protocol !== window.location.protocol) return '/admin';
                  if (!u.pathname.startsWith('/') || u.pathname.startsWith('//') || u.pathname.indexOf(bslash) !== -1) {
                    return '/admin';
                  }
                  return u.pathname + u.search + u.hash;
                } catch (_) {
                  return '/admin';
                }
              }
              const rawNext = new URLSearchParams(window.location.search).get('next');
              window.location.href = sanitizeNext(rawNext);
            } else if (res.status === 400) {
              showErr(data.message || data.error || 'Enter one code at a time');
            } else if (res.status === 401) {
              showErr(data.message || data.error || (recoveryMode
                ? "That recovery code wasn't recognised. Enter one code, like abcd-1234. Each code works once."
                : 'Invalid credentials or TOTP code.'));
            } else if (res.status === 403) {
              showErr(data.message || data.error || 'Access forbidden (security check failed).');
            } else if (res.status === 429) {
              showErr(data.message || data.error || 'Too many failed login attempts. Try again in 15 minutes.');
            } else if (res.status >= 500) {
              showErr('Server error during sign-in. Please retry.');
            } else {
              showErr(data.message || data.error || ('Sign-in failed (HTTP ' + res.status + ')'));
            }
          } catch (err) {
            showErr('Network error connecting to login server.');
          }
        });
      })();
    </script>
  `;
  return renderAdminShell('Sign in', '/admin/login', content, { authenticated: false, template: 'narrow' });
}
