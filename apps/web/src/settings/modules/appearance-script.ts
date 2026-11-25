import {
  BUILTIN_THEME_PACKS_V2,
  DEFAULT_ADMIN_THEME_PACK,
  DEFAULT_PUBLIC_THEME_PACK,
  THEME_CANVAS,
  type ThemePackV2,
} from '@living-portfolio/ui-core';

/**
 * Client script for Appearance v2 (WP-17.9):
 * - Single accent seed input deriving light & dark ramps via OKLCH
 * - Real composed preview (admin scope) via /assets/css/theme-preview.css
 * - Contrast pair table (public scope)
 * - AA rejection Notice naming failing pair(s) and exact ratio(s)
 * - JSON pack import/export rejecting unknown fields / arbitrary CSS
 */
export function renderAppearanceV2Script(adminPack: ThemePackV2, publicPack: ThemePackV2): string {
  const initialScopes = JSON.stringify({ admin: adminPack, public: publicPack }).replace(/</g, '\\u003c');
  const builtinPacks = JSON.stringify(BUILTIN_THEME_PACKS_V2).replace(/</g, '\\u003c');
  const canvas = JSON.stringify(THEME_CANVAS).replace(/</g, '\\u003c');
  const defAdmin = JSON.stringify(DEFAULT_ADMIN_THEME_PACK).replace(/</g, '\\u003c');
  const defPublic = JSON.stringify(DEFAULT_PUBLIC_THEME_PACK).replace(/</g, '\\u003c');

  return `<script>
(function () {
  var form = document.getElementById('settings-module-form');
  if (!form || form.getAttribute('data-settings-module') !== 'appearance') return;

  var scopes = ${initialScopes};
  var packs = ${builtinPacks};
  var canvas = ${canvas};
  var defAdmin = ${defAdmin};
  var defPublic = ${defPublic};

  var scopeEl = document.getElementById('setting-appearance-scope');
  var packEl = document.getElementById('setting-theme-pack');
  var seedEl = document.getElementById('setting-theme-accent-seed');
  var densityEl = document.getElementById('setting-theme-density');
  var radiusEl = document.getElementById('setting-theme-radius');
  var fontEl = document.getElementById('setting-theme-font');
  var previewLink = document.getElementById('appearance-preview-link');
  var adminPreviewSec = document.getElementById('appearance-admin-preview-section');
  var publicContrastSec = document.getElementById('appearance-public-contrast-section');
  var publicTable = document.getElementById('appearance-public-contrast-table');
  var conformanceEl = document.getElementById('theme-conformance-box');
  var aaErrorEl = document.getElementById('appearance-aa-error');
  var banner = document.getElementById('settings-status-banner');
  var exportBtn = document.getElementById('btn-export-theme-pack');
  var importBtn = document.getElementById('btn-import-theme-pack');
  var importInput = document.getElementById('setting-theme-import-json');
  var saveBtn = document.getElementById('btn-save-settings-module');

  var HEX = /^#[0-9a-fA-F]{6}$/;
  function srgbToLin(v) { return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function linToSrgb(v) { return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055; }
  function hexToRgb(hex) { return [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16) / 255; }); }
  function rgbToHex(rgb) {
    return '#' + rgb.map(function (v) { return Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0'); }).join('').toUpperCase();
  }
  function deriveDark(lightHex) {
    var rgb = hexToRgb(lightHex).map(srgbToLin);
    var l = Math.cbrt(0.4122214708 * rgb[0] + 0.5363325363 * rgb[1] + 0.0514459929 * rgb[2]);
    var m = Math.cbrt(0.2119034982 * rgb[0] + 0.6806995451 * rgb[1] + 0.1073969566 * rgb[2]);
    var s = Math.cbrt(0.0883024619 * rgb[0] + 0.2817188376 * rgb[1] + 0.6299787005 * rgb[2]);
    var L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    var c = Math.min(Math.hypot(A, B), 0.13);
    var h = Math.atan2(B, A);
    var tL = Math.max(0.78, Math.min(0.85, L + 0.3));
    for (var step = 0; step < 30; step++) {
      var a = c * Math.cos(h), b = c * Math.sin(h);
      var l_ = Math.pow(tL + 0.3963377774 * a + 0.2158037573 * b, 3);
      var m_ = Math.pow(tL - 0.1055613458 * a - 0.0638541728 * b, 3);
      var s_ = Math.pow(tL - 0.0894841775 * a - 1.291485548 * b, 3);
      var lin = [
        4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
        -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
        -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
      ];
      if (lin.every(function (v) { return v >= -0.0005 && v <= 1.0005; })) {
        return rgbToHex(lin.map(linToSrgb));
      }
      c *= 0.95;
    }
    return defAdmin.accent.dark;
  }
  function relLum(hex) {
    var rgb = hexToRgb(hex).map(srgbToLin);
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
    var seed = (seedEl ? seedEl.value : base.accent.light).trim().toUpperCase();
    var dark = HEX.test(seed)
      ? (seed === base.accent.light.toUpperCase() ? base.accent.dark : deriveDark(seed))
      : base.accent.dark;
    return {
      version: 2,
      id: packId,
      name: base.name,
      packId: packId,
      accent: { light: seed, dark: dark },
      density: densityEl ? densityEl.value : base.density,
      radiusScale: radiusEl ? radiusEl.value : base.radiusScale,
      fontFamily: fontEl ? fontEl.value : base.fontFamily,
    };
  }
  function toggleScopeSections() {
    var isPublic = getScope() === 'public';
    if (adminPreviewSec) adminPreviewSec.classList.toggle('lp-is-hidden', isPublic);
    if (publicContrastSec) publicContrastSec.classList.toggle('lp-is-hidden', !isPublic);
  }
  function loadScopeIntoFields(scope) {
    var p = scopes[scope] || (scope === 'public' ? defPublic : defAdmin);
    if (packEl) packEl.value = p.packId || 'quiet-default';
    if (seedEl) seedEl.value = p.accent && p.accent.light ? p.accent.light : defAdmin.accent.light;
    if (densityEl) densityEl.value = p.density || 'comfortable';
    if (radiusEl) radiusEl.value = p.radiusScale || 'default';
    if (fontEl) fontEl.value = p.fontFamily || 'system';
    toggleScopeSections();
    updatePreview();
  }
  function updatePublicTable(lc, ll, dc, dl) {
    if (!publicTable) return;
    var rows = publicTable.querySelectorAll('tbody tr');
    var vals = [lc, ll, dc, dl];
    for (var i = 0; i < rows.length && i < vals.length; i++) {
      var cells = rows[i].querySelectorAll('td');
      if (cells[1]) cells[1].textContent = vals[i].toFixed(2) + ':1';
      if (cells[2]) cells[2].textContent = vals[i] >= 4.5 ? 'Pass' : 'Fail';
    }
  }
  function updatePreview() {
    var p = currentPackPayload();
    if (!HEX.test(p.accent.light)) {
      if (conformanceEl) conformanceEl.textContent = 'Enter a 6-digit hex colour (#RRGGBB).';
      if (aaErrorEl) {
        aaErrorEl.textContent = 'Accent seed must be a 6-digit hex colour (#RRGGBB).';
        aaErrorEl.classList.remove('lp-is-hidden');
      }
      return false;
    }
    var lightCanvas = contrast(p.accent.light, canvas.light);
    var lightLabel = contrast(canvas.light, p.accent.light);
    var darkCanvas = contrast(p.accent.dark, canvas.dark);
    var darkLabel = contrast(canvas.dark, p.accent.dark);
    updatePublicTable(lightCanvas, lightLabel, darkCanvas, darkLabel);

    var failures = [];
    if (lightCanvas < 4.5) failures.push('Light accent on canvas is ' + lightCanvas.toFixed(2) + ':1 (minimum 4.5:1 required).');
    if (lightLabel < 4.5) failures.push('Label on light accent is ' + lightLabel.toFixed(2) + ':1 (minimum 4.5:1 required).');
    if (darkCanvas < 4.5) failures.push('Dark accent on canvas is ' + darkCanvas.toFixed(2) + ':1 (minimum 4.5:1 required).');
    if (darkLabel < 4.5) failures.push('Label on dark accent is ' + darkLabel.toFixed(2) + ':1 (minimum 4.5:1 required).');

    var ok = failures.length === 0;
    if (conformanceEl) {
      conformanceEl.textContent = 'Derived accents: ' + p.accent.light + ' (' + lightCanvas.toFixed(2) + ':1) and ' + p.accent.dark + ' (' + darkCanvas.toFixed(2) + ':1).';
    }
    if (aaErrorEl) {
      aaErrorEl.textContent = failures.join(' ');
      aaErrorEl.classList.toggle('lp-is-hidden', ok);
    }
    if (previewLink && getScope() === 'admin') {
      previewLink.setAttribute('href',
        '/assets/css/theme-preview.css?pack=' + encodeURIComponent(p.packId) +
        '&seed=' + encodeURIComponent(p.accent.light) +
        '&density=' + encodeURIComponent(p.density) +
        '&radius=' + encodeURIComponent(p.radiusScale) +
        '&font=' + encodeURIComponent(p.fontFamily)
      );
    }
    return ok;
  }
  function setNotice(msg, isErr) {
    if (!banner) return;
    banner.innerHTML = '<div data-c="Notice" class="lp-notice ' + (isErr ? 'lp-notice-danger' : 'lp-notice-ok') + '" role="' + (isErr ? 'alert' : 'status') + '">' + msg + '</div>';
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
    setNotice(scope === 'admin' ? 'Saved admin appearance.' : 'Saved public appearance.', false);
    return true;
  }

  if (scopeEl) scopeEl.addEventListener('change', function () { loadScopeIntoFields(getScope()); });
  if (packEl) {
    packEl.addEventListener('change', function () {
      var chosen = packs[packEl.value];
      if (!chosen) return;
      if (seedEl) seedEl.value = chosen.accent.light;
      if (densityEl) densityEl.value = chosen.density;
      if (radiusEl) radiusEl.value = chosen.radiusScale;
      if (fontEl) fontEl.value = chosen.fontFamily;
      updatePreview();
    });
  }
  [seedEl, densityEl, radiusEl, fontEl].forEach(function (el) {
    if (el) el.addEventListener('input', updatePreview);
    if (el) el.addEventListener('change', updatePreview);
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', async function (e) {
      e.stopImmediatePropagation();
      if (!updatePreview()) {
        setNotice(aaErrorEl && aaErrorEl.textContent ? aaErrorEl.textContent : 'Contrast check failed (minimum 4.5:1 required).', true);
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
      setNotice('Exported theme pack JSON below.', false);
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

  toggleScopeSections();
  updatePreview();
})();
</script>`;
}
