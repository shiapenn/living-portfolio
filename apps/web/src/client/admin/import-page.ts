import { mountTiptapEditor } from './tiptap-editor.js';

function initImportEditor(): void {
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
