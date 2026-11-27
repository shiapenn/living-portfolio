import { mountTiptapEditor } from './tiptap-editor.js';

function initImportFileUpload(): void {
  const fileInput = document.getElementById('import-files-input') as HTMLInputElement | null;
  const fileStatusEl = document.getElementById('import-files-status');
  const pasteArea = document.getElementById('import-paste-area') as HTMLTextAreaElement | null;
  const banner = document.getElementById('import-status-banner');
  if (!fileInput) return;

  const setBanner = (text: string) => {
    if (!banner) return;
    const bodyEl = banner.querySelector('.lp-notice-body') || banner;
    bodyEl.textContent = text;
    if (text) {
      banner.setAttribute('role', 'alert');
      banner.removeAttribute('hidden');
      banner.classList.remove('lp-is-hidden');
    } else {
      banner.removeAttribute('role');
      banner.setAttribute('hidden', '');
      banner.classList.add('lp-is-hidden');
    }
  };

  fileInput.addEventListener('change', async () => {
    const files = fileInput.files;
    if (!files || files.length === 0) return;
    if (fileStatusEl) fileStatusEl.textContent = `Parsing ${files.length} file(s)...`;
    setBanner('');
    try {
      const fd = new FormData();
      for (let i = 0; i < files.length; i++) fd.append('files', files[i]);
      const csrf =
        sessionStorage.getItem('lp_csrf_token') ||
        (document.cookie.match(/(?:^|;\s*)lp_csrf=([^;]+)/) || [])[1] ||
        '';
      const res = await window.fetch('/api/import/files', {
        method: 'POST',
        headers: csrf ? { 'X-CSRF-Token': decodeURIComponent(csrf) } : {},
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setBanner(data.error || `File import failed (HTTP ${res.status}).`);
        if (fileStatusEl) fileStatusEl.textContent = 'Upload failed';
        return;
      }
      const parsedDocs: Array<{ body_md: string }> = Array.isArray(data.documents) ? data.documents : [];
      const errs: Array<{ filename: string; error: string }> = Array.isArray(data.errors) ? data.errors : [];
      if (parsedDocs.length > 0 && pasteArea) {
        const joined = parsedDocs.map((d) => d.body_md).join('\n\n---\n\n');
        pasteArea.value = pasteArea.value.trim() ? `${pasteArea.value.trim()}\n\n---\n\n${joined}` : joined;
      }
      if (fileStatusEl) {
        fileStatusEl.textContent =
          `${parsedDocs.length} document(s) parsed` + (errs.length ? `, ${errs.length} error(s)` : '');
      }
      if (errs.length > 0) {
        setBanner(errs.map((e) => `${e.filename}: ${e.error}`).join(' | '));
      }
    } catch {
      setBanner('Network error uploading import files.');
      if (fileStatusEl) fileStatusEl.textContent = 'Upload failed';
    }
  });
}

function initImportEditor(): void {
  initImportFileUpload();
  const mountEl = document.getElementById('import-tiptap-editor');
  const textareaEl = document.getElementById('import-paste-area') as HTMLTextAreaElement | null;
  const toggleBtn = document.getElementById('import-source-toggle');
  if (!mountEl || !textareaEl || !toggleBtn) return;

  const controller = mountTiptapEditor({
    mountEl,
    textareaEl,
    defaultSourceMode: true,
  });

  toggleBtn.addEventListener('click', () => {
    const nextSource = !controller.isSourceMode();
    controller.setSourceMode(nextSource);
    toggleBtn.setAttribute('aria-pressed', nextSource ? 'true' : 'false');
    if (nextSource) {
      textareaEl.classList.remove('lp-is-hidden');
      textareaEl.hidden = false;
      mountEl.classList.add('lp-is-hidden');
      mountEl.hidden = true;
    } else {
      textareaEl.classList.add('lp-is-hidden');
      textareaEl.hidden = true;
      mountEl.classList.remove('lp-is-hidden');
      mountEl.hidden = false;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initImportEditor);
} else {
  initImportEditor();
}
