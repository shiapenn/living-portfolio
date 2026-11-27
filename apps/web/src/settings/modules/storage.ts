import { z } from '@living-portfolio/core';
import {
  renderActionBar,
  renderField,
  renderFormSection,
  renderList,
  renderOverlay,
  renderText,
} from '../../primitives/index.js';
import { renderPageNotice, renderStatusLine } from '../../components/index.js';
import type { SettingsModuleManifest } from '../registry.js';

export const StorageConfigSchema = z.object({
  maxImageMb: z.number().int().min(1).max(100).default(10),
  maxVideoMb: z.number().int().min(1).max(1000).default(100),
  quotaGb: z.number().int().min(1).max(500).default(5),
});

export type StorageConfig = z.infer<typeof StorageConfigSchema>;

export const storageModule: SettingsModuleManifest<StorageConfig> = {
  id: 'storage',
  title: 'Storage',
  summary: 'Media usage, quota, and uploaded files',
  icon: 'layers',
  order: 9,
  route: '/admin/settings/storage',
  version: 1,
  defaults: {
    maxImageMb: 10,
    maxVideoMb: 100,
    quotaGb: 5,
  },
  schema: StorageConfigSchema,
  status: (_cfg, ctx) => {
    const backend = String(ctx?.config?.MEDIA_STORAGE_BACKEND || 'local');
    return backend === 's3' ? 'S3-compatible' : 'Local volume';
  },
  render: (cfg, ctx) => {
    const raw = (ctx.settings || {}) as Record<string, any>;
    const st = (raw.storage && typeof raw.storage === 'object' ? raw.storage : {}) as Record<string, any>;
    const maxImageMb = Number(st.maxImageMb ?? cfg.maxImageMb ?? 10);
    const maxVideoMb = Number(st.maxVideoMb ?? cfg.maxVideoMb ?? 100);
    const quotaGb = Number(st.quotaGb ?? cfg.quotaGb ?? 5);
    const backendRaw = String(ctx.config?.MEDIA_STORAGE_BACKEND || 'local');
    const backendLabel = backendRaw === 's3' ? 'S3-compatible' : 'Local volume';

    const usageListHtml = renderList({
      id: 'storage-summary-list',
      variant: 'definition',
      definitionRows: [
        { label: 'Active backend', valueHtml: `<span id="storage-backend-value">${backendLabel}</span>` },
        { label: 'Usage', valueHtml: `<span id="storage-usage-summary">0 B of ${quotaGb} GB (0%)</span>` },
      ],
    });

    const deleteDialogHtml = renderOverlay({
      id: 'storage-delete-dialog',
      kind: 'dialog',
      title: 'Delete media file?',
      bodyHtml: `
        <div class="lp-stack lp-gap-related">
          <div id="storage-delete-filename" class="lp-type-body">Selected file</div>
          <div class="lp-type-meta">This removes the file permanently from storage.</div>
          ${renderPageNotice({ id: 'storage-delete-error', tone: 'danger', message: '', role: 'none', hidden: true })}
        </div>
      `,
      footerHtml: renderActionBar({
        level: 'dialog',
        primary: { id: 'btn-storage-delete-confirm', label: 'Delete', variant: 'danger', type: 'button' },
        textAction: { id: 'btn-storage-delete-cancel', label: 'Cancel', variant: 'quiet', type: 'button' },
      }),
    });

    const pruneDialogHtml = renderOverlay({
      id: 'storage-prune-dialog',
      kind: 'dialog',
      title: 'Remove unused files?',
      bodyHtml: `
        <div class="lp-stack lp-gap-related">
          <div id="storage-prune-summary" class="lp-type-body">No unused files selected.</div>
          <div class="lp-type-meta">Files referenced by published entries are never removed.</div>
        </div>
      `,
      footerHtml: renderActionBar({
        level: 'dialog',
        primary: { id: 'btn-storage-prune-confirm', label: 'Remove unused', variant: 'danger', type: 'button' },
        textAction: { id: 'btn-storage-prune-cancel', label: 'Cancel', variant: 'quiet', type: 'button' },
      }),
    });

    return `
      <form id="settings-storage-form" data-settings-module="storage" class="lp-stack lp-gap-section">
        ${renderFormSection({
          title: 'Storage usage',
          fieldsHtml: `
            ${usageListHtml}
            ${renderText({ id: 'storage-quota-note', variant: 'caption', text: 'A warning appears on Today when usage reaches 80% of quota.' })}
          `,
        })}

        ${renderFormSection({
          title: 'Upload limits',
          fieldsHtml: `
            ${renderField({
              kind: 'input',
              id: 'setting-storage-max-image-mb',
              name: 'maxImageMb',
              label: 'Max image size (MB)',
              inputType: 'number',
              value: String(maxImageMb),
              help: 'Default 10 MB per image.',
            })}
            ${renderField({
              kind: 'input',
              id: 'setting-storage-max-video-mb',
              name: 'maxVideoMb',
              label: 'Max video size (MB)',
              inputType: 'number',
              value: String(maxVideoMb),
              help: 'Default 100 MB per video.',
            })}
            ${renderField({
              kind: 'input',
              id: 'setting-storage-quota-gb',
              name: 'quotaGb',
              label: 'Total storage quota (GB)',
              inputType: 'number',
              value: String(quotaGb),
              help: 'Default 5 GB across all uploaded media.',
            })}
          `,
        })}

        <div class="lp-stack lp-gap-related">
          ${renderActionBar({
            pageLevel: true,
            primary: { id: 'btn-save-storage-settings', label: 'Save', variant: 'primary', type: 'button' },
          })}
          ${renderStatusLine({ id: 'storage-save-status', message: '', className: 'lp-is-hidden' })}
          ${renderPageNotice({ id: 'storage-save-error', tone: 'danger', message: '', role: 'none', hidden: true })}
        </div>

        ${renderFormSection({
          title: 'Uploaded media',
          fieldsHtml: `
            <div id="storage-media-list" data-c="List" data-variant="plain" class="lp-list lp-list-plain">
              <div class="lp-type-meta">Loading media assets...</div>
            </div>
          `,
          actionBarHtml: renderActionBar({
            level: 'item',
            secondary: { id: 'btn-storage-remove-unused', label: 'Remove unused', variant: 'secondary', type: 'button', size: 'sm' },
          }),
        })}
      </form>
      ${deleteDialogHtml}
      ${pruneDialogHtml}
      <script>
        (function() {
          const listEl = document.getElementById('storage-media-list');
          const usageEl = document.getElementById('storage-usage-summary');
          const backendEl = document.getElementById('storage-backend-value');
          const saveBtn = document.getElementById('btn-save-storage-settings');
          const saveStatus = document.getElementById('storage-save-status');
          const saveError = document.getElementById('storage-save-error');
          const removeUnusedBtn = document.getElementById('btn-storage-remove-unused');
          const delDialog = document.getElementById('storage-delete-dialog');
          const delFilename = document.getElementById('storage-delete-filename');
          const delError = document.getElementById('storage-delete-error');
          const delConfirm = document.getElementById('btn-storage-delete-confirm');
          const delCancel = document.getElementById('btn-storage-delete-cancel');
          const pruneDialog = document.getElementById('storage-prune-dialog');
          const pruneSummary = document.getElementById('storage-prune-summary');
          const pruneConfirm = document.getElementById('btn-storage-prune-confirm');
          const pruneCancel = document.getElementById('btn-storage-prune-cancel');

          let mediaItems = [];
          let pendingDeleteId = null;
          let lastTrigger = null;

          function fmtBytes(n) {
            if (!n || n < 1024) return (n || 0) + ' B';
            if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
            if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
            return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
          }
          function esc(s) {
            return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          }
          function setNotice(el, msg) {
            if (!el) return;
            const body = el.querySelector('.lp-notice-body') || el;
            body.textContent = msg || '';
            if (msg) {
              el.setAttribute('role', 'alert');
              el.removeAttribute('hidden');
              el.classList.remove('lp-is-hidden');
            } else {
              el.removeAttribute('role');
              el.setAttribute('hidden', '');
              el.classList.add('lp-is-hidden');
            }
          }
          function openModal(dlg, trigger) {
            lastTrigger = trigger || document.activeElement;
            if (dlg) dlg.removeAttribute('hidden');
          }
          function closeModal(dlg) {
            if (dlg) dlg.setAttribute('hidden', '');
            if (lastTrigger && typeof lastTrigger.focus === 'function') lastTrigger.focus();
          }

          async function loadMedia() {
            if (!listEl) return;
            try {
              const res = await window.apiClient('/api/media', { method: 'GET' });
              if (!res.ok) return;
              const data = await res.json();
              mediaItems = Array.isArray(data.items) ? data.items : [];
              const used = Number(data.total_bytes || 0);
              const quota = Number(data.quota_bytes || 5 * 1024 * 1024 * 1024);
              const pct = quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0;
              if (usageEl) usageEl.textContent = fmtBytes(used) + ' of ' + fmtBytes(quota) + ' (' + pct + '%)';
              if (backendEl && data.backend) backendEl.textContent = data.backend === 's3' ? 'S3-compatible' : 'Local volume';
              renderMediaList();
            } catch {}
          }

          function renderMediaList() {
            if (!listEl) return;
            if (mediaItems.length === 0) {
              listEl.innerHTML = '<div class="lp-type-meta">No media files uploaded yet.</div>';
              return;
            }
            listEl.innerHTML = mediaItems.map(function(m) {
              const refCount = Number(m.reference_count || 0);
              const pubCount = Number(m.public_reference_count || 0);
              const refText = refCount > 0 ? ('Used in ' + refCount + (refCount === 1 ? ' entry' : ' entries')) : 'Unused';
              const dateStr = (m.created_at || '').slice(0, 10) || 'Unknown date';
              const blocked = pubCount > 0;
              const actionHtml = blocked
                ? '<div class="lp-type-meta" data-media-blocked="true">Used in a published entry. Remove it from the entry before deleting.</div>'
                : '<div data-c="ActionBar" data-level="inline" class="lp-action-bar lp-action-bar-inline"><button type="button" class="lp-btn lp-btn-secondary lp-btn-sm" data-storage-delete="' + esc(m.id) + '" data-storage-name="' + esc(m.original_filename || m.id) + '">Delete</button></div>';
              return '<div data-c="Item" class="lp-item lp-item-has-actions" data-media-id="' + esc(m.id) + '">' +
                '<div class="lp-item-main">' +
                  '<div class="lp-item-head">' +
                    '<span class="lp-item-title">' + esc(m.original_filename || m.id) + '</span>' +
                    '<span class="lp-item-status">' + esc(refText) + '</span>' +
                  '</div>' +
                  '<div class="lp-item-subtitle">' + esc(fmtBytes(m.size_bytes)) + ' · ' + esc(dateStr) + '</div>' +
                  actionHtml +
                '</div>' +
              '</div>';
            }).join('');

            listEl.querySelectorAll('[data-storage-delete]').forEach(function(btn) {
              btn.addEventListener('click', function() {
                pendingDeleteId = btn.getAttribute('data-storage-delete');
                if (delFilename) delFilename.textContent = btn.getAttribute('data-storage-name') || 'Selected file';
                setNotice(delError, '');
                openModal(delDialog, btn);
              });
            });
          }

          if (delCancel) delCancel.addEventListener('click', function() { closeModal(delDialog); });
          if (pruneCancel) pruneCancel.addEventListener('click', function() { closeModal(pruneDialog); });
          document.querySelectorAll('#storage-delete-dialog [data-overlay-close], #storage-delete-dialog .lp-overlay-close').forEach(function(el) {
            el.addEventListener('click', function() { closeModal(delDialog); });
          });
          document.querySelectorAll('#storage-prune-dialog [data-overlay-close], #storage-prune-dialog .lp-overlay-close').forEach(function(el) {
            el.addEventListener('click', function() { closeModal(pruneDialog); });
          });

          if (delConfirm) {
            delConfirm.addEventListener('click', async function() {
              if (!pendingDeleteId) return;
              delConfirm.setAttribute('aria-busy', 'true');
              try {
                const res = await window.apiClient('/api/media/' + encodeURIComponent(pendingDeleteId), { method: 'DELETE' });
                if (res.ok) {
                  closeModal(delDialog);
                  await loadMedia();
                } else {
                  const data = await res.json().catch(function() { return {}; });
                  setNotice(delError, data.error || ('Delete failed (HTTP ' + res.status + ').'));
                }
              } catch {
                setNotice(delError, 'Network error deleting file.');
              } finally {
                delConfirm.removeAttribute('aria-busy');
              }
            });
          }

          if (removeUnusedBtn) {
            removeUnusedBtn.addEventListener('click', function() {
              const unused = mediaItems.filter(function(m) { return Number(m.reference_count || 0) === 0 && Number(m.public_reference_count || 0) === 0; });
              const totalFreed = unused.reduce(function(acc, m) { return acc + Number(m.size_bytes || 0); }, 0);
              if (pruneSummary) {
                pruneSummary.textContent = unused.length > 0
                  ? ('Remove ' + unused.length + ' unused ' + (unused.length === 1 ? 'file' : 'files') + ' and free ' + fmtBytes(totalFreed) + '?')
                  : 'There are no unused files to remove.';
              }
              if (pruneConfirm) pruneConfirm.disabled = unused.length === 0;
              openModal(pruneDialog, removeUnusedBtn);
            });
          }

          if (pruneConfirm) {
            pruneConfirm.addEventListener('click', async function() {
              const unused = mediaItems.filter(function(m) { return Number(m.reference_count || 0) === 0 && Number(m.public_reference_count || 0) === 0; });
              pruneConfirm.setAttribute('aria-busy', 'true');
              for (let i = 0; i < unused.length; i++) {
                await window.apiClient('/api/media/' + encodeURIComponent(unused[i].id), { method: 'DELETE' }).catch(function() {});
              }
              pruneConfirm.removeAttribute('aria-busy');
              closeModal(pruneDialog);
              await loadMedia();
            });
          }

          if (saveBtn) {
            saveBtn.addEventListener('click', async function() {
              setNotice(saveError, '');
              if (saveStatus) { saveStatus.textContent = ''; saveStatus.classList.add('lp-is-hidden'); }
              const maxImageMb = Number((document.getElementById('setting-storage-max-image-mb') || {}).value || 10);
              const maxVideoMb = Number((document.getElementById('setting-storage-max-video-mb') || {}).value || 100);
              const quotaGb = Number((document.getElementById('setting-storage-quota-gb') || {}).value || 5);
              saveBtn.setAttribute('aria-busy', 'true');
              try {
                const res = await window.apiClient('/api/settings/storage', {
                  method: 'PATCH',
                  body: JSON.stringify({ maxImageMb: maxImageMb, maxVideoMb: maxVideoMb, quotaGb: quotaGb }),
                });
                if (res.ok) {
                  if (saveStatus) { saveStatus.textContent = 'Storage limits saved.'; saveStatus.classList.remove('lp-is-hidden'); }
                } else {
                  const data = await res.json().catch(function() { return {}; });
                  setNotice(saveError, data.error || ('Save failed (HTTP ' + res.status + ').'));
                }
              } catch {
                setNotice(saveError, 'Network error saving storage limits.');
              } finally {
                saveBtn.removeAttribute('aria-busy');
              }
            });
          }

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadMedia);
          } else {
            setTimeout(loadMedia, 0);
          }
        })();
      </script>
    `;
  },
};
