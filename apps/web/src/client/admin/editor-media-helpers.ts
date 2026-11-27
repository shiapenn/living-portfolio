export interface MediaUploadResponse {
  id?: string;
  uri?: string;
  asset?: { id: string; uri: string; mime_type: string; width?: number | null; height?: number | null };
  error?: string;
  code?: string;
  message?: string;
}

export function getCsrfToken(): string {
  try {
    const m = document.cookie.match(/(?:^|;\s*)lp_csrf=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : (sessionStorage.getItem('lp_csrf_token') || '');
  } catch {
    return '';
  }
}

export function isAllowedClientEmbedUrl(rawUrl: string, allowedHosts: string[]): { ok: boolean; url: string; host: string } {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase();
    const isLocal = host === '127.0.0.1' || host === 'localhost';
    if (parsed.protocol !== 'https:' && !(isLocal && parsed.protocol === 'http:')) {
      return { ok: false, url: '', host };
    }
    const bare = host.replace(/^www\./, '');
    const matched = allowedHosts.some((h) => {
      const clean = h.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
      const cleanHost = clean.split(':')[0];
      if (clean.includes(':')) return parsed.host.toLowerCase() === clean;
      return host === cleanHost || bare === cleanHost;
    });
    return { ok: matched, url: matched ? parsed.toString() : '', host };
  } catch {
    return { ok: false, url: '', host: '' };
  }
}

export function mapUploadErrorMessage(status: number, data: MediaUploadResponse | null): string {
  const code = String(data?.code || '').toUpperCase();
  if (status === 0) return 'Could not upload file due to a network error. Check your connection and try again.';
  if (code === 'STORAGE_QUOTA_EXCEEDED') return 'Storage quota reached. Remove unused files in Settings > Storage before uploading.';
  if (code === 'FILE_TOO_LARGE' || status === 413) return 'File is too large for the upload limit. Choose a smaller file and try again.';
  if (code === 'UNSUPPORTED_MEDIA_TYPE' || code === 'UNPARSEABLE_IMAGE' || status === 415) {
    return 'This file type is not supported (SVG and corrupt files are blocked). Choose a PNG, JPEG, WebP, GIF, MP4, or WebM file.';
  }
  return data?.message || 'Could not upload this file. Try again.';
}

export function setMediaFieldError(input: HTMLElement | null, message: string | null): void {
  if (!input) return;
  const field = input.closest('.lp-field');
  if (!field) return;
  const errId = `${input.id}-error`;
  let errEl = document.getElementById(errId);
  if (message) {
    field.classList.add('lp-field-has-error');
    input.setAttribute('aria-invalid', 'true');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.id = errId;
      errEl.className = 'lp-field-error';
      errEl.setAttribute('data-purpose', 'feedback');
      field.appendChild(errEl);
    }
    errEl.classList.remove('lp-is-hidden');
    errEl.textContent = message;
  } else {
    field.classList.remove('lp-field-has-error');
    input.removeAttribute('aria-invalid');
    if (errEl) {
      errEl.textContent = '';
      errEl.classList.add('lp-is-hidden');
    }
  }
}
