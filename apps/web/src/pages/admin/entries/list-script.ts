import { ADMIN_API_CLIENT_SCRIPT } from '../../../lib/admin-api-client.js';

export const ENTRIES_LIST_SCRIPT = `<script>
(function() {
  ${ADMIN_API_CLIENT_SCRIPT}
  const stateEl = document.getElementById('entries-filter-state');
  const typeEl = document.getElementById('entries-filter-type');
  const searchEl = document.getElementById('entries-search');
  const regionEl = document.getElementById('entries-list-region');
  const emptyEl = document.getElementById('entries-empty-state');
  const errorEl = document.getElementById('entries-error-banner');
  const loadingEl = document.getElementById('entries-loading-banner');
  const offlineEl = document.getElementById('entries-offline-banner');
  const paginationEl = document.getElementById('entries-pagination');
  const pageSummaryEl = document.getElementById('entries-page-summary');
  const prevBtn = document.getElementById('btn-entries-prev');
  const nextBtn = document.getElementById('btn-entries-next');

  const delDialog = document.getElementById('entries-delete-dialog');
  const delInput = document.getElementById('entries-delete-confirm-input');
  const delConfirmBtn = document.getElementById('btn-entries-delete-confirm');
  const delCancelBtn = document.getElementById('entries-delete-cancel');

  let currentPage = 1;
  let totalPages = 1;
  let pendingDeleteId = '';

  const syncOffline = () => {
    if (!offlineEl) return;
    if (navigator.onLine === false) offlineEl.removeAttribute('hidden');
    else offlineEl.setAttribute('hidden', '');
  };
  window.addEventListener('online', syncOffline);
  window.addEventListener('offline', syncOffline);
  syncOffline();

  const levelIndex = (lvl) => {
    if (lvl === 'L3') return 4;
    if (lvl === 'L2') return 3;
    if (lvl === 'L1') return 2;
    return 1;
  };

  const escapeHtml = (s) =>
    String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const renderRows = (entries) => {
    if (!regionEl) return;
    if (!entries.length) {
      regionEl.innerHTML = '';
      if (emptyEl) emptyEl.removeAttribute('hidden');
      return;
    }
    if (emptyEl) emptyEl.setAttribute('hidden', '');
    regionEl.innerHTML = entries.map((e) => {
      const visLabel = e.visibility === 'private' ? 'Draft' : e.visibility === 'unlisted' ? 'Unlisted' : 'Public';
      const visState = e.visibility === 'private' ? 'draft' : e.visibility === 'unlisted' ? 'unlisted' : 'public';
      return '<li class="lp-entries-row" data-entry-row="' + escapeHtml(e.id) + '">' +
        '<div class="lp-entries-row-main">' +
          '<a href="/admin/entries/' + encodeURIComponent(e.id) + '" class="lp-entries-row-title">' + escapeHtml(e.title || 'Untitled') + '</a>' +
          '<div class="lp-entries-row-meta">' +
            '<span class="lp-state-label lp-state-' + visState + '"><span class="lp-state-dot" aria-hidden="true"></span>' + escapeHtml(visLabel) + '</span>' +
            '<span class="lp-chip">' + escapeHtml(e.profile || 'work') + '</span>' +
          '</div>' +
        '</div>' +
      '</li>';
    }).join('');
    bindRowClicks();
  };

  const bindRowClicks = () => {
    document.querySelectorAll('#entries-list-region .lp-entries-row').forEach((row) => {
      row.addEventListener('click', (ev) => {
        if (ev.target && ev.target.closest && ev.target.closest('a, button')) return;
        const id = row.getAttribute('data-entry-row');
        if (id) window.location.href = '/admin/entries/' + encodeURIComponent(id);
      });
    });
  };
  bindRowClicks();

  const loadEntries = async (pageNum) => {
    currentPage = pageNum || 1;
    if (loadingEl) loadingEl.removeAttribute('hidden');
    if (errorEl) errorEl.setAttribute('hidden', '');
    try {
      const vis = stateEl && stateEl.value !== 'all' ? stateEl.value : 'all';
      const type = typeEl && typeEl.value !== 'all' ? typeEl.value : '';
      const q = searchEl ? searchEl.value.trim() : '';
      const params = new URLSearchParams({ visibility: vis, page: String(currentPage), limit: '10' });
      if (type) params.set('type', type);
      if (q) params.set('q', q);
      const data = await apiClient('/api/entries?' + params.toString());
      totalPages = data.totalPages || 1;
      renderRows(data.entries || []);
      if (pageSummaryEl) {
        pageSummaryEl.textContent = 'Page ' + (data.page || 1) + ' of ' + totalPages + ' (' + (data.total || 0) + ' total)';
      }
      if (prevBtn) prevBtn.disabled = currentPage <= 1;
      if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
      if (paginationEl) paginationEl.removeAttribute('hidden');
    } catch (_err) {
      if (errorEl) errorEl.removeAttribute('hidden');
    } finally {
      if (loadingEl) loadingEl.setAttribute('hidden', '');
    }
  };

  if (stateEl) stateEl.addEventListener('change', () => loadEntries(1));
  if (typeEl) typeEl.addEventListener('change', () => loadEntries(1));
  if (searchEl) {
    let searchTimer = null;
    searchEl.addEventListener('input', () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => loadEntries(1), 300);
    });
    searchEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (searchTimer) clearTimeout(searchTimer);
        loadEntries(1);
      }
    });
  }
  if (prevBtn) prevBtn.addEventListener('click', () => { if (currentPage > 1) loadEntries(currentPage - 1); });
  if (nextBtn) nextBtn.addEventListener('click', () => { if (currentPage < totalPages) loadEntries(currentPage + 1); });

  if (delInput && delConfirmBtn) {
    delInput.addEventListener('input', () => {
      delConfirmBtn.disabled = delInput.value.trim() !== 'DELETE';
    });
    delConfirmBtn.addEventListener('click', async () => {
      if (!pendingDeleteId || delInput.value.trim() !== 'DELETE') return;
      delConfirmBtn.disabled = true;
      await apiClient('/api/entries/' + encodeURIComponent(pendingDeleteId), { method: 'DELETE' });
      if (delDialog) delDialog.setAttribute('hidden', '');
      pendingDeleteId = '';
      loadEntries(currentPage);
    });
  }
  if (delCancelBtn && delDialog) {
    delCancelBtn.addEventListener('click', () => {
      delDialog.setAttribute('hidden', '');
      pendingDeleteId = '';
    });
  }
})();
</script>`;
