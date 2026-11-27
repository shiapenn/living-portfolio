import { parseDirectiveAttrs, parseStandaloneImageLine } from './editor/markdown-bridge.js';

export { parseStandaloneImageLine };

export interface MediaDimension {
  width: number;
  height: number;
}

export interface MarkdownMediaOptions {
  mediaDimensions?: Record<string, MediaDimension>;
  embedAllowedHosts?: string[];
}

export const DEFAULT_EMBED_ALLOWED_HOSTS = ['youtube-nocookie.com', 'player.vimeo.com'];
export const INTERNAL_MEDIA_RE = /^\/api\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

function checkEmbedUrl(rawUrl: string, allowedHosts: readonly string[]): { ok: boolean; url: string; host: string } {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase();
    const isLocalHost = host === '127.0.0.1' || host === 'localhost';
    if (parsed.protocol !== 'https:' && !(isLocalHost && parsed.protocol === 'http:')) {
      return { ok: false, url: '', host };
    }
    const bareHost = host.replace(/^www\./, '');
    const matched = allowedHosts.some((allowed) => {
      const clean = allowed.toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
      const cleanHostname = clean.split(':')[0];
      if (clean.includes(':')) return parsed.host.toLowerCase() === clean;
      return host === cleanHostname || bareHost === cleanHostname;
    });
    return { ok: matched, url: matched ? parsed.toString() : '', host };
  } catch {
    return { ok: false, url: '', host: '' };
  }
}

function escHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function unescapeQuoted(val: string): string {
  return val.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

function sanitizeLinkUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed || /^(javascript|vbscript|data):/i.test(trimmed)) return null;
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function extractInternalMediaIds(md: string): string[] {
  const ids = new Set<string>();
  const re = /\/api\/media\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) !== null) {
    ids.add(m[1].toLowerCase());
  }
  return Array.from(ids);
}

export function renderMarkdownImage(
  rawAlt: string,
  rawUrl: string,
  rawCaption: string | undefined,
  options?: MarkdownMediaOptions,
  inline = false
): string {
  const alt = rawAlt.replace(/\\\]/g, ']');
  const trimmedUrl = rawUrl.trim();
  const internalMatch = INTERNAL_MEDIA_RE.exec(trimmedUrl);

  if (!internalMatch) {
    // Privacy rule (WP-18.4): non-/api/media/:id images render as plain link text, never <img>.
    const safe = sanitizeLinkUrl(trimmedUrl);
    const label = escHtml(alt || trimmedUrl);
    if (!safe) return label;
    const isExternal = safe.startsWith('http:') || safe.startsWith('https:');
    const attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${escHtml(safe)}"${attrs}>${label}</a>`;
  }

  const mediaId = internalMatch[1].toLowerCase();
  const dims = options?.mediaDimensions?.[mediaId] ?? options?.mediaDimensions?.[internalMatch[1]];
  const dimAttrs =
    dims && dims.width > 0 && dims.height > 0
      ? ` width="${Math.round(dims.width)}" height="${Math.round(dims.height)}"`
      : '';
  const imgTag = `<img src="${escHtml(trimmedUrl)}" alt="${escHtml(alt)}"${dimAttrs} loading="lazy" />`;

  if (inline) return imgTag;

  const caption = rawCaption !== undefined ? unescapeQuoted(rawCaption) : '';
  const capHtml = caption ? `<figcaption class="pub-media-caption">${escHtml(caption)}</figcaption>` : '';
  return `<figure class="pub-media" data-pub-media="image">${imgTag}${capHtml}</figure>`;
}

export function extractInlineImages(
  text: string,
  options?: MarkdownMediaOptions
): { raw: string; imgTokens: string[] } {
  const imgTokens: string[] = [];
  let raw = '';
  let pos = 0;
  while (pos < text.length) {
    const start = text.indexOf('![', pos);
    if (start === -1) { raw += text.slice(pos); break; }
    const closeBracket = text.indexOf(']', start + 2);
    if (closeBracket === -1 || text[closeBracket + 1] !== '(') { raw += text.slice(pos, start + 2); pos = start + 2; continue; }
    const closeParen = text.indexOf(')', closeBracket + 2);
    if (closeParen === -1) { raw += text.slice(pos, start + 2); pos = start + 2; continue; }
    const parsed = parseStandaloneImageLine(text.slice(start, closeParen + 1));
    if (!parsed) { raw += text.slice(pos, start + 2); pos = start + 2; continue; }
    raw += text.slice(pos, start);
    raw += `\u0000IMG${imgTokens.length}\u0000`;
    imgTokens.push(renderMarkdownImage(parsed.alt, parsed.url, parsed.caption, options, true));
    pos = closeParen + 1;
  }
  return { raw, imgTokens };
}

export function renderVideoDirectiveBlock(
  headerLine: string,
  options?: MarkdownMediaOptions
): string | null {
  const headerMatch = /^:::video\{(.*)\}\s*$/.exec(headerLine.trim());
  if (!headerMatch) return null;

  const attrs = parseDirectiveAttrs(headerMatch[1]);
  const description = (attrs.description ?? '').trim() || 'Video';
  const caption = (attrs.caption ?? '').trim();
  const capHtml = caption ? `<figcaption class="pub-media-caption">${escHtml(caption)}</figcaption>` : '';

  if (attrs.src && INTERNAL_MEDIA_RE.test(attrs.src.trim())) {
    const src = attrs.src.trim();
    return `<figure class="pub-media" data-pub-media="video"><video src="${escHtml(src)}" controls preload="metadata" aria-label="${escHtml(description)}"></video>${capHtml}</figure>`;
  }

  if (attrs.embed) {
    const allowedHosts = options?.embedAllowedHosts ?? DEFAULT_EMBED_ALLOWED_HOSTS;
    const check = checkEmbedUrl(attrs.embed, allowedHosts);
    if (check.ok) {
      return `<figure class="pub-media" data-pub-media="embed"><div class="pub-embed-gate" data-embed-state="unloaded" data-embed-src="${escHtml(check.url)}" data-embed-title="${escHtml(description)}" data-embed-host="${escHtml(check.host)}"><p class="pub-embed-gate-title">${escHtml(description)}</p><p class="pub-embed-gate-note">External video hosted on ${escHtml(check.host)}. Click to load.</p><button type="button" class="btn btn-primary pub-embed-load-btn">Load video</button></div>${capHtml}</figure>`;
    }
    const safeFallback = sanitizeLinkUrl(attrs.embed);
    if (safeFallback) {
      return `<p><a href="${escHtml(safeFallback)}" target="_blank" rel="noopener noreferrer">${escHtml(description)}</a></p>`;
    }
    return `<p>${escHtml(description)}</p>`;
  }

  return null;
}
