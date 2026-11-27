import { closeHistory } from '@tiptap/pm/history';
import { attachModalController, updateStatusLine } from '../containers.js';
import type { MountedTiptapController } from './tiptap-editor.js';
import {
  getCsrfToken,
  isAllowedClientEmbedUrl,
  mapUploadErrorMessage,
  setMediaFieldError,
  type MediaUploadResponse,
} from './editor-media-helpers.js';

export interface MediaEditTarget {
  pos: number;
  nodeType: 'mediaImage' | 'mediaVideo';
  attrs: Record<string, unknown>;
}

export function initEditorMedia(tiptapCtrl: MountedTiptapController): {
  openAddDialog: (kind: 'image' | 'video', triggerEl?: HTMLElement | null) => void;
  openEditDialog: (target: MediaEditTarget, triggerEl?: HTMLElement | null) => void;
  handleDroppedOrPastedFile: (file: File) => void;
} {
  const dlgEl = document.getElementById('ref-media-dialog');
  if (!dlgEl) return { openAddDialog: () => {}, openEditDialog: () => {}, handleDroppedOrPastedFile: () => {} };

  const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null;
  const formWrap = dlgEl.querySelector<HTMLElement>('[data-media-dialog-form]');
  const titleEl = byId('ref-media-dialog-title');
  const videoModeWrap = byId('ref-media-video-mode-wrap');
  const modeUploadRadio = byId<HTMLInputElement>('ref-media-mode-upload');
  const modeEmbedRadio = byId<HTMLInputElement>('ref-media-mode-embed');
  const fileWrap = byId('ref-media-file-wrap');
  const fileInput = byId<HTMLInputElement>('ref-media-file');
  const fileNameEl = byId('ref-media-file-filename');
  const embedWrap = byId('ref-media-embed-wrap');
  const embedInput = byId<HTMLInputElement>('ref-media-embed-url');
  const altWrap = byId('ref-media-alt-wrap');
  const altInput = byId<HTMLInputElement>('ref-media-alt');
  const decWrap = byId('ref-media-decorative-wrap');
  const decCheck = byId<HTMLInputElement>('ref-media-decorative');
  const descWrap = byId('ref-media-description-wrap');
  const descInput = byId<HTMLInputElement>('ref-media-description');
  const captionInput = byId<HTMLInputElement>('ref-media-caption');
  const consequenceEl = byId('ref-media-consequence');
  const submitBtn = byId<HTMLButtonElement>('ref-media-submit');
  const removeBtn = byId<HTMLButtonElement>('ref-media-remove');
  const statusEl = byId('ref-media-status');
  const errorNoticeEl = byId('ref-media-error-notice');
  const errorNoticeText = errorNoticeEl?.querySelector<HTMLElement>('.lp-notice-text') ?? null;

  const allowedHosts = (formWrap?.getAttribute('data-embed-hosts') || 'youtube-nocookie.com,player.vimeo.com')
    .split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);

  let activeKind: 'image' | 'video' = 'image';
  let videoMode: 'upload' | 'embed' = 'upload';
  let editTarget: MediaEditTarget | null = null;
  let uploadedUri = '';
  let uploading = false;
  let slowTimer = 0;

  const modalCtrl = attachModalController(dlgEl, {
    onClose: () => {
      if (slowTimer) { window.clearTimeout(slowTimer); slowTimer = 0; }
      uploading = false;
      submitBtn?.removeAttribute('aria-busy');
      if (submitBtn) submitBtn.disabled = false;
      dlgEl.removeAttribute('data-media-state');
    },
  });

  const showErrorNotice = (msg: string | null) => {
    if (!errorNoticeEl || !errorNoticeText) return;
    if (msg) {
      errorNoticeText.textContent = msg;
      errorNoticeEl.setAttribute('role', 'alert');
      errorNoticeEl.removeAttribute('hidden');
      dlgEl.setAttribute('data-media-state', 'error');
    } else {
      errorNoticeText.textContent = '';
      errorNoticeEl.removeAttribute('role');
      errorNoticeEl.setAttribute('hidden', '');
    }
  };

  const setUploadingState = (isBusy: boolean) => {
    uploading = isBusy;
    if (slowTimer) {
      window.clearTimeout(slowTimer);
      slowTimer = 0;
    }
    if (isBusy) {
      dlgEl.setAttribute('data-media-state', 'uploading');
      submitBtn?.setAttribute('aria-busy', 'true');
      if (submitBtn) submitBtn.disabled = true;
      slowTimer = window.setTimeout(() => {
        if (uploading && statusEl) {
          statusEl.classList.remove('lp-is-hidden');
          updateStatusLine(statusEl, { message: 'Uploading…', tone: 'info' });
        }
      }, 1000);
    } else {
      submitBtn?.removeAttribute('aria-busy');
      if (submitBtn) submitBtn.disabled = false;
      if (statusEl) {
        statusEl.classList.add('lp-is-hidden');
        updateStatusLine(statusEl, { message: '', tone: 'info' });
      }
    }
  };

  const syncDecorativeUi = () => {
    const isDec = Boolean(decCheck?.checked);
    decCheck?.closest('.lp-choice')?.classList.toggle('is-selected', isDec);
    if (altInput) {
      altInput.disabled = isDec;
      if (isDec) {
        altInput.value = '';
        setMediaFieldError(altInput, null);
      }
    }
  };

  const syncFormLayout = () => {
    const isImage = activeKind === 'image';
    const isEdit = Boolean(editTarget);
    if (titleEl) {
      titleEl.textContent = isEdit
        ? (isImage ? 'Edit image' : 'Edit video')
        : (isImage ? 'Insert image' : 'Insert video');
    }
    if (submitBtn) submitBtn.textContent = isEdit ? 'Save' : 'Insert';
    removeBtn?.classList.toggle('lp-is-hidden', !isEdit);
    dlgEl.setAttribute('data-media-kind', activeKind);
    dlgEl.setAttribute('data-media-mode', isEdit ? 'edit' : 'add');

    videoModeWrap?.classList.toggle('lp-is-hidden', isImage);
    altWrap?.classList.toggle('lp-is-hidden', !isImage);
    decWrap?.classList.toggle('lp-is-hidden', !isImage);
    descWrap?.classList.toggle('lp-is-hidden', isImage);

    if (fileInput) {
      fileInput.accept = isImage ? 'image/png,image/jpeg,image/webp,image/gif' : 'video/mp4,video/webm';
    }
    const showFile = isImage || videoMode === 'upload';
    const showEmbed = !isImage && videoMode === 'embed';
    fileWrap?.classList.toggle('lp-is-hidden', !showFile);
    embedWrap?.classList.toggle('lp-is-hidden', !showEmbed);

    modeUploadRadio?.closest('.lp-choice')?.classList.toggle('is-selected', videoMode === 'upload');
    modeEmbedRadio?.closest('.lp-choice')?.classList.toggle('is-selected', videoMode === 'embed');

    if (consequenceEl) {
      if (!isImage && videoMode === 'embed') {
        consequenceEl.textContent = 'Visitors must click to load this video.';
        consequenceEl.classList.remove('lp-is-hidden');
      } else if (!isImage && videoMode === 'upload') {
        consequenceEl.textContent = "Video metadata isn't removed on upload.";
        consequenceEl.classList.remove('lp-is-hidden');
      } else {
        consequenceEl.classList.add('lp-is-hidden');
      }
    }
    syncDecorativeUi();
  };

  const resetErrors = () => {
    setMediaFieldError(fileInput, null);
    setMediaFieldError(embedInput, null);
    setMediaFieldError(altInput, null);
    setMediaFieldError(descInput, null);
    showErrorNotice(null);
  };

  const uploadMediaFile = async (file: File): Promise<string | null> => {
    showErrorNotice(null);
    setUploadingState(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (activeKind === 'image' && altInput?.value.trim()) {
        formData.append('alt_text', altInput.value.trim());
      } else if (activeKind === 'video' && descInput?.value.trim()) {
        formData.append('alt_text', descInput.value.trim());
      }
      if (captionInput?.value.trim()) {
        formData.append('caption', captionInput.value.trim());
      }
      const csrf = getCsrfToken();
      const res = await fetch('/api/media', {
        method: 'POST',
        credentials: 'same-origin',
        headers: csrf ? { 'X-CSRF-Token': csrf } : undefined,
        body: formData,
      });
      let data: MediaUploadResponse | null = null;
      try {
        data = (await res.json()) as MediaUploadResponse;
      } catch {
        data = null;
      }
      setUploadingState(false);
      const returnedUri = data?.uri || data?.asset?.uri;
      if (!res.ok || !returnedUri) {
        showErrorNotice(mapUploadErrorMessage(res.status, data));
        return null;
      }
      dlgEl.setAttribute('data-media-state', editTarget ? 'edit' : 'idle');
      return returnedUri;
    } catch {
      setUploadingState(false);
      showErrorNotice(mapUploadErrorMessage(0, null));
      return null;
    }
  };

  const openAddDialog = (kind: 'image' | 'video', triggerEl?: HTMLElement | null) => {
    activeKind = kind;
    videoMode = 'upload';
    editTarget = null;
    uploadedUri = '';
    if (modeUploadRadio) modeUploadRadio.checked = true;
    if (modeEmbedRadio) modeEmbedRadio.checked = false;
    if (fileInput) fileInput.value = '';
    if (fileNameEl) fileNameEl.textContent = 'No file chosen';
    if (embedInput) embedInput.value = '';
    if (altInput) altInput.value = '';
    if (decCheck) decCheck.checked = false;
    if (descInput) descInput.value = '';
    if (captionInput) captionInput.value = '';
    resetErrors();
    syncFormLayout();
    dlgEl.setAttribute('data-media-state', 'idle');
    modalCtrl.open(triggerEl);
  };

  const openEditDialog = (target: MediaEditTarget, triggerEl?: HTMLElement | null) => {
    editTarget = target;
    activeKind = target.nodeType === 'mediaVideo' ? 'video' : 'image';
    videoMode = target.attrs.mode === 'embed' ? 'embed' : 'upload';
    uploadedUri = String(target.attrs.src || '');
    if (modeUploadRadio) modeUploadRadio.checked = videoMode === 'upload';
    if (modeEmbedRadio) modeEmbedRadio.checked = videoMode === 'embed';
    if (fileInput) fileInput.value = '';
    if (fileNameEl) fileNameEl.textContent = uploadedUri ? 'Current file uploaded' : 'No file chosen';
    if (embedInput) embedInput.value = String(target.attrs.embedUrl || '');
    if (altInput) altInput.value = String(target.attrs.alt || '');
    if (decCheck) decCheck.checked = Boolean(target.attrs.decorative);
    if (descInput) descInput.value = String(target.attrs.description || '');
    if (captionInput) captionInput.value = String(target.attrs.caption || '');
    resetErrors();
    syncFormLayout();
    dlgEl.setAttribute('data-media-state', 'edit');
    modalCtrl.open(triggerEl);
  };

  const handleDroppedOrPastedFile = (file: File) => {
    const isVideo = file.type.startsWith('video/');
    openAddDialog(isVideo ? 'video' : 'image');
    if (fileNameEl) fileNameEl.textContent = file.name || 'Dropped file';
    void uploadMediaFile(file).then((uri) => {
      if (uri) {
        uploadedUri = uri;
        if (fileNameEl) fileNameEl.textContent = file.name || 'Uploaded';
        (isVideo ? descInput : altInput)?.focus();
      }
    });
  };

  modeUploadRadio?.addEventListener('change', () => {
    if (modeUploadRadio.checked) {
      videoMode = 'upload';
      resetErrors();
      syncFormLayout();
    }
  });
  modeEmbedRadio?.addEventListener('change', () => {
    if (modeEmbedRadio.checked) {
      videoMode = 'embed';
      resetErrors();
      syncFormLayout();
    }
  });
  decCheck?.addEventListener('change', syncDecorativeUi);
  fileInput?.addEventListener('change', () => {
    const f = fileInput.files?.[0];
    if (fileNameEl) fileNameEl.textContent = f ? f.name : (uploadedUri ? 'Current file uploaded' : 'No file chosen');
    setMediaFieldError(fileInput, null);
    showErrorNotice(null);
  });

  const applyNodeAttrs = (nodeType: 'mediaImage' | 'mediaVideo', attrs: Record<string, unknown>) => {
    tiptapCtrl.editor.view.dispatch(closeHistory(tiptapCtrl.editor.state.tr));
    if (editTarget) {
      const { state, dispatch } = tiptapCtrl.editor.view;
      dispatch(state.tr.setNodeMarkup(editTarget.pos, undefined, attrs));
    } else {
      const sel = tiptapCtrl.editor.state.selection as { node?: unknown; to: number };
      const chain = tiptapCtrl.editor.chain().focus();
      if (sel.node) chain.setTextSelection(sel.to);
      chain.insertContent([{ type: nodeType, attrs }, { type: 'paragraph' }]).run();
    }
    modalCtrl.close();
  };

  const handleSubmit = async () => {
    if (uploading) return;
    resetErrors();

    const caption = captionInput?.value.trim() || '';
    if (activeKind === 'image') {
      const decorative = Boolean(decCheck?.checked);
      const alt = decorative ? '' : (altInput?.value.trim() || '');
      if (!decorative && !alt) { setMediaFieldError(altInput, 'Enter alt text, or mark this image as decorative.'); altInput?.focus(); return; }
      let uri = uploadedUri;
      const picked = fileInput?.files?.[0];
      if (picked) { const resUri = await uploadMediaFile(picked); if (!resUri) return; uri = resUri; }
      if (!uri) { setMediaFieldError(fileInput, 'Choose an image file to insert.'); fileInput?.focus(); return; }
      applyNodeAttrs('mediaImage', { src: uri, alt, caption, decorative });
      return;
    }

    const description = descInput?.value.trim() || '';
    if (!description) { setMediaFieldError(descInput, 'Enter a description for this video.'); descInput?.focus(); return; }
    if (videoMode === 'embed') {
      const check = isAllowedClientEmbedUrl(embedInput?.value.trim() || '', allowedHosts);
      if (!check.ok) { setMediaFieldError(embedInput, `Use a URL from an allowed host (${allowedHosts.join(', ')}).`); embedInput?.focus(); return; }
      applyNodeAttrs('mediaVideo', { mode: 'embed', src: '', embedUrl: check.url, description, caption });
      return;
    }
    let uri = uploadedUri;
    const picked = fileInput?.files?.[0];
    if (picked) { const resUri = await uploadMediaFile(picked); if (!resUri) return; uri = resUri; }
    if (!uri) { setMediaFieldError(fileInput, 'Choose a video file to upload.'); fileInput?.focus(); return; }
    applyNodeAttrs('mediaVideo', { mode: 'upload', src: uri, embedUrl: '', description, caption });
  };

  submitBtn?.addEventListener('click', () => {
    void handleSubmit();
  });

  dlgEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.target as HTMLElement)?.tagName === 'INPUT') {
      const inp = e.target as HTMLInputElement;
      if (inp.type === 'text' || inp.type === 'url') {
        e.preventDefault();
        void handleSubmit();
      }
    }
  });

  removeBtn?.addEventListener('click', () => {
    if (!editTarget) return;
    const pos = editTarget.pos;
    const node = tiptapCtrl.editor.state.doc.nodeAt(pos);
    modalCtrl.close();
    if (node) {
      tiptapCtrl.editor.view.dispatch(closeHistory(tiptapCtrl.editor.state.tr));
      tiptapCtrl.editor
        .chain()
        .focus()
        .deleteRange({ from: pos, to: pos + node.nodeSize })
        .run();
    }
  });

  const fmtImage = document.getElementById('ref-fmt-image');
  const fmtVideo = document.getElementById('ref-fmt-video');
  fmtImage?.addEventListener('mousedown', (e) => e.preventDefault());
  fmtVideo?.addEventListener('mousedown', (e) => e.preventDefault());
  fmtImage?.addEventListener('click', () => openAddDialog('image', fmtImage));
  fmtVideo?.addEventListener('click', () => openAddDialog('video', fmtVideo));

  return { openAddDialog, openEditDialog, handleDroppedOrPastedFile };
}
