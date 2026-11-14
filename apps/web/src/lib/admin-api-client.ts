import { DEFAULT_STRATA_THEME } from "@living-portfolio/core";

export const ADMIN_API_CLIENT_SCRIPT = `
        async function apiClient(url, options) {
          var opts = options || {};
          var csrf = sessionStorage.getItem('lp_csrf_token') || '';
          var headers = Object.assign({
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf
          }, opts.headers || {});
          return window.fetch(url, Object.assign({}, opts, { headers: headers }));
        }
        window.apiClient = apiClient;
        window.formatAdminApiError = function(status, message) {
          if (!status) {
            return 'Network error connecting to server.';
          }
          if (status === 401) {
            return 'Your session has expired. <a href="/admin/login">Sign in again</a>.';
          }
          if (status === 403) {
            return 'Security check failed (CSRF token invalid or missing). Reload and sign in again.';
          }
          if (status >= 500) {
            return 'Server error (HTTP ' + status + '). Please try again.';
          }
          return message || ('Request failed (HTTP ' + status + ').');
        };
`;

export interface AdminSettingsState {
  automatedAnsweringEnabled?: boolean;
  calibrationFrozen?: boolean;
  simulatedDegradationMode?: 'normal' | 'extractive' | 'disabled';
  tier1_floor?: number;
  tier2_floor?: number;
  facet_known_threshold?: number;
  theme?: typeof DEFAULT_STRATA_THEME;
  calibration?: {
    suggestion_thresholds?: boolean;
    routing_calibration?: boolean;
    topology_audit?: boolean;
    scoped_constraint_mining?: boolean;
  };
}
