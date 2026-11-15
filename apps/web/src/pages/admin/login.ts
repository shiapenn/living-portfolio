import { renderAuthShell } from "../../layouts/admin-shell.js";
import { ADMIN_API_CLIENT_SCRIPT } from "../../lib/admin-api-client.js";

export function renderAdminLoginPage(): string {
  const content = `
    <div style="max-width:440px;margin:48px auto;padding:24px;border:1px solid var(--rule);background:var(--surface-page)">
      <h1 style="font-size:24px;margin:0 0 8px 0">Owner Sign in</h1>
      <p style="font-size:14px;color:var(--text-muted);margin:0 0 20px 0">
        Enter your admin credentials and 6-digit TOTP code to access the workspace.
      </p>

      <div id="login-error" role="alert" style="margin-bottom:16px;display:none"></div>

      <form id="admin-login-form">
        <div style="margin-bottom:12px">
          <label for="login-username" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">Username</label>
          <input id="login-username" type="text" class="ask-input" style="width:100%;padding:8px" autocomplete="username" required />
        </div>
        <div style="margin-bottom:12px">
          <label for="login-password" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">Password</label>
          <input id="login-password" type="password" class="ask-input" style="width:100%;padding:8px" autocomplete="current-password" required />
        </div>
        <div style="margin-bottom:16px">
          <label id="login-code-label" for="login-totp" style="display:block;font-size:13px;font-weight:600;margin-bottom:4px">6-Digit Authenticator Code</label>
          <input id="login-totp" type="text" class="ask-input" style="width:100%;padding:8px;font-family:var(--font-code);letter-spacing:2px" placeholder="000000" autocomplete="one-time-code" required />
          <div id="login-code-help" style="font-size:12px;color:var(--text-muted);margin-top:4px">
            Enter the 6-digit verification code from your authenticator app (Google Authenticator, 1Password, etc.).
          </div>
          <div style="margin-top:8px">
            <button type="button" id="btn-toggle-recovery" style="background:none;border:none;padding:0;font-size:12px;color:var(--accent);text-decoration:underline;cursor:pointer">Lost your authenticator device? Sign in with a recovery code</button>
          </div>
        </div>
        <button type="submit" class="btn" style="width:100%;padding:10px">Sign in</button>
      </form>
      <div style="margin-top:16px;font-size:12px;color:var(--text-muted);line-height:1.4">
        Login attempts are rate-limited to 5 per 15 minutes. If throttled: "Too many failed login attempts. Try again later."
      </div>
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

        if (codeInput) {
          codeInput.addEventListener('paste', function(e) {
            const pasteData = (e.clipboardData || window.clipboardData) ? (e.clipboardData || window.clipboardData).getData('text') : '';
            if (pasteData && checkMultipleCodes(pasteData)) {
              e.preventDefault();
              errBox.className = 'later-thinking-banner';
              errBox.textContent = 'Enter one code at a time';
              errBox.style.display = 'block';
              codeInput.value = '';
              return;
            }
          });
        }

        if (toggleBtn && codeLabel && codeInput && codeHelp) {
          toggleBtn.addEventListener('click', function() {
            recoveryMode = !recoveryMode;
            errBox.style.display = 'none';
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
          errBox.style.display = 'none';
          const username = document.getElementById('login-username').value;
          const password = document.getElementById('login-password').value;
          const rawCode = document.getElementById('login-totp').value.trim();

          if (checkMultipleCodes(rawCode)) {
            errBox.className = 'later-thinking-banner';
            errBox.textContent = 'Enter one code at a time';
            errBox.style.display = 'block';
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
              errBox.className = 'later-thinking-banner';
              errBox.textContent = data.message || data.error || 'Enter one code at a time';
              errBox.style.display = 'block';
            } else if (res.status === 401) {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = data.message || data.error || (recoveryMode
                ? "That recovery code wasn't recognised. Enter one code, like abcd-1234. Each code works once."
                : 'Invalid credentials or TOTP code.');
              errBox.style.display = 'block';
            } else if (res.status === 403) {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = data.message || data.error || 'Access forbidden (security check failed).';
              errBox.style.display = 'block';
            } else if (res.status === 429) {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = data.message || data.error || 'Too many failed login attempts. Try again in 15 minutes.';
              errBox.style.display = 'block';
            } else if (res.status >= 500) {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = 'Server error during sign-in. Please retry.';
              errBox.style.display = 'block';
            } else {
              errBox.className = 'later-thinking-banner';
              errBox.textContent = data.message || data.error || ('Sign-in failed (HTTP ' + res.status + ')');
              errBox.style.display = 'block';
            }
          } catch (err) {
            errBox.className = 'later-thinking-banner';
            errBox.textContent = 'Network error connecting to login server.';
            errBox.style.display = 'block';
          }
        });
      })();
    </script>
  `;
  return renderAuthShell('Sign in', content);
}
