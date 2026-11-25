import {
  BUILTIN_THEME_PACKS_V2,
  DEFAULT_ADMIN_THEME_PACK,
  DEFAULT_PUBLIC_THEME_PACK,
  THEME_CANVAS,
  type ThemePackV2,
} from '@living-portfolio/ui-core';

/**
 * Client script for Appearance v2 (WP-17.8):
 * - Two scopes (admin + public)
 * - Selectable packs with live preview & real-time WCAG AA contrast computation
 * - Constrained customisation (accent seeds, density, radius scale, vetted self-hosted font)
 * - JSON pack export & import (no arbitrary CSS)
 */
export function renderAppearanceV2Script(adminPack: ThemePackV2, publicPack: ThemePackV2): string {
  const initialScopes = JSON.stringify({ admin: adminPack, public: publicPack }).replace(/</g, '\\u003c');
  const builtinPacks = JSON.stringify(BUILTIN_THEME_PACKS_V2).replace(/</g, '\\u003c');
  const canvas = JSON.stringify(THEME_CANVAS).replace(/</g, '\\u003c');

  return `<script>
(function () {
  var form = document.getElementById('settings-module-form');
  if (!form || form.getAttribute('data-settings-module') !== 'appearance') return;

  var scopes = ${initialScopes};
  var packs = ${builtinPacks};
  var canvas = ${canvas};
  var scopeEl = document.getElementById('setting-appearance-scope');
  var packEl = document.getElementById('setting-theme-pack');
  var lightEl = document.getElementById('setting-theme-light-accent');
  var darkEl = document.getElementById('setting-theme-dark-accent');
  var densityEl = document.getElementById('setting-theme-density');
  var radiusEl = document.getElementById('setting-theme-radius');
  var fontEl = document.getElementById('setting-theme-font');
  var previewEl = document.getElementById('appearance-live-preview');
  var conformanceEl = document.getElementById('theme-conformance-box');
  var banner = document.getElementById('settings-status-banner');
  var exportBtn = document.getElementById('btn-export-theme-pack');
  var importBtn = document.getElementById('btn-import-theme-pack');
  var importInput = document.getElementById('setting-theme-import-json');
  var saveBtn = document.getElementById('btn-save-settings-module');

  var HEX = /^#[0-9a-fA-F]{6}$/;
  function relLum(hex) {
    var rgb = [1, 3, 5].map(function (i) {
      var v = parseInt(hex.slice(i, i + 2), 16) / 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  function contrast(a, b) {
    var la = relLum(a), lb = relLum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  function getScope() {
    return scopeEl && scopeEl.value === 'public' ? 'public' : 'admin';
  }
  function currentPackPayload() {
    var packId = packEl ? packEl.value : 'quiet-default';
    var base = packs[packId] || packs['quiet-default'];
    return {
      version: 2,
      id: packId,
      name: base.name,
      packId: packId,
      accent: {
        light: (lightEl ? lightEl.value : base.accent.light).trim().toUpperCase(),
        dark: (darkEl ? darkEl.value : base.accent.dark).trim().toUpperCase(),
      },
      density: densityEl ? densityEl.value : base.density,
      radiusScale: radiusEl ? radiusEl.value : base.radiusScale,
      fontFamily: fontEl ? fontEl.value : base.fontFamily,
    };
  }
  function loadScopeIntoFields(scope) {
    var defAdmin = ${JSON.stringify(DEFAULT_ADMIN_THEME_PACK)};
    var defPublic = ${JSON.stringify(DEFAULT_PUBLIC_THEME_PACK)};
    var p = scopes[scope] || (scope === 'public' ? defPublic : defAdmin);
    if (packEl) packEl.value = p.packId || 'quiet-default';
    if (lightEl) lightEl.value = p.accent && p.accent.light ? p.accent.light : defAdmin.accent.light;
    if (darkEl) darkEl.value = p.accent && p.accent.dark ? p.accent.dark : defAdmin.accent.dark;
    if (densityEl) densityEl.value = p.density || 'comfortable';
    if (radiusEl) radiusEl.value = p.radiusScale || 'default';
    if (fontEl) fontEl.value = p.fontFamily || 'system';
    updatePreview();
  }
  function updatePreview() {
    var p = currentPackPayload();
    var scope = getScope();
    var validHex = HEX.test(p.accent.light) && HEX.test(p.accent.dark);
    if (!validHex) {
      if (conformanceEl) conformanceEl.textContent = 'Invalid hex colour. Use #RRGGBB format.';
      if (previewEl) previewEl.textContent = 'Preview unavailable until valid #RRGGBB colours are entered.';
      return false;
    }
    var lightCanvas = contrast(p.accent.light, canvas.light);
    var lightLabel = contrast(canvas.light, p.accent.light);
    var darkCanvas = contrast(p.accent.dark, canvas.dark);
    var darkLabel = contrast(canvas.dark, p.accent.dark);
    var ok = lightCanvas >= 4.5 && lightLabel >= 4.5 && darkCanvas >= 4.5 && darkLabel >= 4.5;
    if (conformanceEl) {
      conformanceEl.textContent = ok
        ? 'WCAG AA passed — Light: ' + lightCanvas.toFixed(2) + ':1, Dark: ' + darkCanvas.toFixed(2) + ':1.'
        : 'WCAG AA failed — Light: ' + lightCanvas.toFixed(2) + ':1 (on-accent ' + lightLabel.toFixed(2) + ':1), Dark: ' + darkCanvas.toFixed(2) + ':1 (on-accent ' + darkLabel.toFixed(2) + ':1). Minimum 4.5:1 required.';
    }
    if (previewEl) {
      previewEl.textContent = 'Live preview (' + scope + '): ' + p.name + ' · density ' + p.density + ' · radius ' + p.radiusScale + ' · font ' + p.fontFamily + ' · accent ' + p.accent.light + ' / ' + p.accent.dark + '.';
    }
    return ok;
  }
  function setNotice(msg, isErr) {
    if (!banner) return;
    banner.innerHTML = '<div class="lp-notice ' + (isErr ? 'lp-notice-danger' : 'lp-notice-ok') + '" role="' + (isErr ? 'alert' : 'status') + '">' + msg + '</div>';
  }
  function swapAdminThemeLink(filename) {
    if (!filename) return;
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href') || '';
      if (/\\/assets\\/css\\/(accent|theme)\\.[0-9a-f]{10}\\.css$/.test(href)) {
        links[i].setAttribute('href', '/assets/css/' + filename);
        return;
      }
    }
  }
  function getCsrf() {
    var m = document.cookie.match(/(?:^|;\\s*)lp_csrf=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : (sessionStorage.getItem('lp_csrf_token') || '');
  }
  async function savePack(scope, payload) {
    var res = await fetch('/api/settings/appearance-v2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
      body: JSON.stringify({ scope: scope, pack: payload }),
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      var msg = Array.isArray(data.errors) && data.errors.length ? data.errors.join(' ') : 'Theme pack failed validation.';
      setNotice(msg, true);
      return false;
    }
    scopes[scope] = data.pack || payload;
    if (scope === 'admin' && data.adminCssFilename) {
      swapAdminThemeLink(data.adminCssFilename);
    }
    setNotice(scope === 'admin' ? 'Saved admin appearance.' : 'Saved public appearance (stored for WP-19/WP-20.1).', false);
    return true;
  }

  if (scopeEl) {
    scopeEl.addEventListener('change', function () {
      loadScopeIntoFields(getScope());
    });
  }
  if (packEl) {
    packEl.addEventListener('change', function () {
      var chosen = packs[packEl.value];
      if (!chosen) return;
      if (lightEl) lightEl.value = chosen.accent.light;
      if (darkEl) darkEl.value = chosen.accent.dark;
      if (densityEl) densityEl.value = chosen.density;
      if (radiusEl) radiusEl.value = chosen.radiusScale;
      if (fontEl) fontEl.value = chosen.fontFamily;
      updatePreview();
    });
  }
  [lightEl, darkEl, densityEl, radiusEl, fontEl].forEach(function (el) {
    if (el) el.addEventListener('input', updatePreview);
    if (el) el.addEventListener('change', updatePreview);
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', async function (e) {
      e.stopImmediatePropagation();
      if (!updatePreview()) {
        setNotice('Theme colours failed WCAG AA contrast checks (minimum 4.5:1 required).', true);
        return;
      }
      saveBtn.setAttribute('disabled', 'true');
      try {
        await savePack(getScope(), currentPackPayload());
      } finally {
        saveBtn.removeAttribute('disabled');
      }
    }, true);
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', function () {
      var p = currentPackPayload();
      if (importInput) importInput.value = JSON.stringify(p, null, 2);
      setNotice('Exported ' + getScope() + ' theme pack JSON below.', false);
    });
  }

  if (importBtn && importInput) {
    importBtn.addEventListener('click', async function () {
      var raw = importInput.value.trim();
      if (!raw) {
        setNotice('Paste a JSON theme pack before importing.', true);
        return;
      }
      var parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        setNotice('Invalid JSON syntax in theme pack.', true);
        return;
      }
      importBtn.setAttribute('disabled', 'true');
      try {
        var ok = await savePack(getScope(), parsed);
        if (ok) loadScopeIntoFields(getScope());
      } finally {
        importBtn.removeAttribute('disabled');
      }
    });
  }

  updatePreview();
})();
</script>`;
}
