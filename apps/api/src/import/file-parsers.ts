import { inflateRawSync, inflateSync } from 'node:zlib';

export interface ExtractedBinaryImage {
  name: string;
  bytes: Buffer;
}

export interface ParsedImportDoc {
  title: string;
  slug: string;
  body_md: string;
  sourceFilename: string;
  embeddedImages: ExtractedBinaryImage[];
}

export interface ZipEntry {
  name: string;
  data: Buffer;
}

const MAX_ZIP_ENTRIES = 200;
const MAX_ZIP_UNCOMPRESSED_BYTES = 20 * 1024 * 1024;

function sanitizeZipPath(rawName: string): string | null {
  const norm = rawName.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!norm || norm.includes('..') || norm.endsWith('/')) return null;
  return norm;
}

/**
 * Pure-TS ZIP archive reader (supports Stored method 0 and Deflate method 8 via node:zlib).
 * Defends against zip-slip paths and decompression bombs.
 */
export function parseZipEntries(buf: Buffer): ZipEntry[] {
  // Locate End of Central Directory (EOCD) signature 0x06054b50 from end
  let eocdOffset = -1;
  const minOffset = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= minOffset; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('Invalid ZIP archive: missing end-of-central-directory record.');
  }

  const totalEntries = buf.readUInt16LE(eocdOffset + 10);
  const cdOffset = buf.readUInt32LE(eocdOffset + 16);
  if (totalEntries > MAX_ZIP_ENTRIES) {
    throw new Error(`ZIP archive exceeds maximum entry limit (${MAX_ZIP_ENTRIES}).`);
  }

  const entries: ZipEntry[] = [];
  let cursor = cdOffset;
  let totalUncompressed = 0;

  for (let idx = 0; idx < totalEntries; idx++) {
    if (cursor + 46 > buf.length || buf.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error('Corrupt ZIP central directory header.');
    }
    const method = buf.readUInt16LE(cursor + 10);
    const compSize = buf.readUInt32LE(cursor + 20);
    const uncompSize = buf.readUInt32LE(cursor + 24);
    const nameLen = buf.readUInt16LE(cursor + 28);
    const extraLen = buf.readUInt16LE(cursor + 30);
    const commentLen = buf.readUInt16LE(cursor + 32);
    const localHeaderOffset = buf.readUInt32LE(cursor + 42);
    const rawName = buf.subarray(cursor + 46, cursor + 46 + nameLen).toString('utf8');
    cursor += 46 + nameLen + extraLen + commentLen;

    const safeName = sanitizeZipPath(rawName);
    if (!safeName) continue;

    if (localHeaderOffset + 30 > buf.length || buf.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      throw new Error(`Corrupt ZIP local file header for "${safeName}".`);
    }
    const lhNameLen = buf.readUInt16LE(localHeaderOffset + 26);
    const lhExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + lhNameLen + lhExtraLen;
    const dataEnd = dataStart + compSize;
    if (dataEnd > buf.length) {
      throw new Error(`Truncated ZIP payload for "${safeName}".`);
    }
    const compSlice = buf.subarray(dataStart, dataEnd);

    let data: Buffer;
    if (method === 0) {
      data = Buffer.from(compSlice);
    } else if (method === 8) {
      if (totalUncompressed + uncompSize > MAX_ZIP_UNCOMPRESSED_BYTES) {
        throw new Error('ZIP uncompressed size exceeds safety limit.');
      }
      data = inflateRawSync(compSlice, { maxOutputLength: MAX_ZIP_UNCOMPRESSED_BYTES });
    } else {
      throw new Error(`Unsupported ZIP compression method ${method} for "${safeName}".`);
    }

    totalUncompressed += data.length;
    if (totalUncompressed > MAX_ZIP_UNCOMPRESSED_BYTES) {
      throw new Error('ZIP uncompressed size exceeds safety limit.');
    }
    entries.push({ name: safeName, data });
  }

  return entries;
}

function deriveSlug(title: string, fallback: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || fallback;
}

function stemFromFilename(filename: string): string {
  const base = filename.split('/').pop() || filename;
  const dot = base.lastIndexOf('.');
  return (dot > 0 ? base.slice(0, dot) : base).replace(/[-_]+/g, ' ').trim() || 'Imported entry';
}

function extractTitleFromMarkdown(md: string, fallbackName: string): string {
  for (const line of md.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) {
      return trimmed.replace(/^#+\s*/, '').trim() || stemFromFilename(fallbackName);
    }
    return trimmed.slice(0, 80);
  }
  return stemFromFilename(fallbackName);
}

/** Linear O(n) HTML-to-Markdown converter with zero network fetches and script/style stripping. */
export function htmlToSafeMarkdown(html: string): string {
  let out = '';
  let i = 0;
  let inSkipTag = false;
  const len = html.length;

  while (i < len) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      if (!inSkipTag) out += html.slice(i);
      break;
    }
    if (!inSkipTag) out += html.slice(i, lt);
    const gt = html.indexOf('>', lt);
    if (gt === -1) break;
    const rawTag = html.slice(lt + 1, gt).trim();
    i = gt + 1;

    const isClosing = rawTag.startsWith('/');
    const body = isClosing ? rawTag.slice(1).trim() : rawTag;
    let nameEnd = 0;
    while (nameEnd < body.length && /[a-zA-Z0-9]/.test(body[nameEnd])) nameEnd++;
    const tag = body.slice(0, nameEnd).toLowerCase();

    if (tag === 'script' || tag === 'style') {
      inSkipTag = !isClosing;
      continue;
    }
    if (inSkipTag) continue;

    if (!isClosing && (tag === 'h1' || tag === 'h2' || tag === 'h3')) {
      out += `\n\n${'#'.repeat(Number(tag[1]))} `;
    } else if (!isClosing && tag === 'li') {
      out += '\n- ';
    } else if (!isClosing && (tag === 'p' || tag === 'br' || tag === 'div')) {
      out += '\n\n';
    } else if (!isClosing && tag === 'img') {
      // Never fetch external images; degrade to plain alt/src link text
      const altMatch = /\balt\s*=\s*"([^"]*)"/i.exec(body);
      const srcMatch = /\bsrc\s*=\s*"([^"]*)"/i.exec(body);
      if (srcMatch?.[1]) {
        const label = altMatch?.[1] || srcMatch[1];
        out += `[${label}](${srcMatch[1]})`;
      }
    }
  }

  return out
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Pure-TS DOCX extractor: reads word/document.xml text + word/media/* images. */
export function parseDocxBuffer(buf: Buffer, filename: string): ParsedImportDoc {
  const entries = parseZipEntries(buf);
  const docXml = entries.find((e) => e.name === 'word/document.xml');
  if (!docXml) {
    throw new Error('Invalid DOCX archive: missing word/document.xml.');
  }

  const xml = docXml.data.toString('utf8');
  const paragraphs: string[] = [];
  let cursor = 0;
  while (cursor < xml.length) {
    const pStart = xml.indexOf('<w:p', cursor);
    if (pStart === -1) break;
    const pEnd = xml.indexOf('</w:p>', pStart);
    if (pEnd === -1) break;
    const chunk = xml.slice(pStart, pEnd);
    cursor = pEnd + 6;

    let paraText = '';
    let tCursor = 0;
    while (tCursor < chunk.length) {
      const tOpen = chunk.indexOf('<w:t', tCursor);
      if (tOpen === -1) break;
      const tGt = chunk.indexOf('>', tOpen);
      if (tGt === -1) break;
      const tClose = chunk.indexOf('</w:t>', tGt);
      if (tClose === -1) break;
      paraText += chunk.slice(tGt + 1, tClose);
      tCursor = tClose + 6;
    }
    const clean = paraText
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .trim();
    if (clean) paragraphs.push(clean);
  }

  const embeddedImages: ExtractedBinaryImage[] = entries
    .filter((e) => e.name.startsWith('word/media/') && /\.(png|jpe?g|gif|webp)$/i.test(e.name))
    .map((e) => ({ name: e.name.split('/').pop() || e.name, bytes: e.data }));

  const bodyMd = paragraphs.join('\n\n') || stemFromFilename(filename);
  const title = extractTitleFromMarkdown(bodyMd, filename);
  return {
    title,
    slug: deriveSlug(title, 'docx-import'),
    body_md: bodyMd,
    sourceFilename: filename,
    embeddedImages,
  };
}

/** Pure-TS PDF text extractor (verifies %PDF- header; extracts literal text from BT..ET / FlateDecode streams). */
export function parsePdfBuffer(buf: Buffer, filename: string): ParsedImportDoc {
  const header = buf.subarray(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    throw new Error('Invalid PDF file: missing %PDF- header.');
  }

  const rawLatin1 = buf.toString('latin1');
  const extractedChunks: string[] = [];

  const extractPdfTextOps = (streamStr: string) => {
    let i = 0;
    while (i < streamStr.length) {
      const openParen = streamStr.indexOf('(', i);
      if (openParen === -1) break;
      let j = openParen + 1;
      let text = '';
      let depth = 1;
      while (j < streamStr.length && depth > 0) {
        const ch = streamStr[j];
        if (ch === '\\' && j + 1 < streamStr.length) {
          text += streamStr[j + 1];
          j += 2;
          continue;
        }
        if (ch === '(') depth++;
        else if (ch === ')') {
          depth--;
          if (depth === 0) break;
        }
        text += ch;
        j++;
      }
      i = j + 1;
      const clean = text.replace(/[^\x20-\x7E\n]/g, '').trim();
      if (clean) extractedChunks.push(clean);
    }
  };

  let sCursor = 0;
  while (sCursor < rawLatin1.length) {
    const sStart = rawLatin1.indexOf('stream', sCursor);
    if (sStart === -1) break;
    const sEnd = rawLatin1.indexOf('endstream', sStart + 6);
    if (sEnd === -1) break;
    let bodyStart = sStart + 6;
    if (rawLatin1[bodyStart] === '\r' && rawLatin1[bodyStart + 1] === '\n') bodyStart += 2;
    else if (rawLatin1[bodyStart] === '\n') bodyStart += 1;

    const dictWindow = rawLatin1.slice(Math.max(0, sStart - 200), sStart);
    const streamBytes = buf.subarray(bodyStart, sEnd);
    if (dictWindow.includes('/FlateDecode')) {
      try {
        const inflated = inflateSync(streamBytes, { maxOutputLength: 5 * 1024 * 1024 }).toString('latin1');
        extractPdfTextOps(inflated);
      } catch {
        // Skip non-text or malformed compressed stream
      }
    } else {
      extractPdfTextOps(streamBytes.toString('latin1'));
    }
    sCursor = sEnd + 9;
  }

  const bodyMd = extractedChunks.join('\n\n').trim() || stemFromFilename(filename);
  const title = extractTitleFromMarkdown(bodyMd, filename);
  return {
    title,
    slug: deriveSlug(title, 'pdf-import'),
    body_md: bodyMd,
    sourceFilename: filename,
    embeddedImages: [],
  };
}

export function parseSingleImportFile(
  filename: string,
  buf: Buffer
): { docs: ParsedImportDoc[]; standaloneImages: ExtractedBinaryImage[] } {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.md') || lower.endsWith('.markdown') || lower.endsWith('.txt')) {
    const text = buf.toString('utf8').trim();
    if (!text) throw new Error('File is empty.');
    const title = extractTitleFromMarkdown(text, filename);
    return {
      docs: [{ title, slug: deriveSlug(title, 'text-import'), body_md: text, sourceFilename: filename, embeddedImages: [] }],
      standaloneImages: [],
    };
  }
  if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    const md = htmlToSafeMarkdown(buf.toString('utf8'));
    if (!md) throw new Error('HTML file contained no readable content.');
    const title = extractTitleFromMarkdown(md, filename);
    return {
      docs: [{ title, slug: deriveSlug(title, 'html-import'), body_md: md, sourceFilename: filename, embeddedImages: [] }],
      standaloneImages: [],
    };
  }
  if (lower.endsWith('.docx')) {
    return { docs: [parseDocxBuffer(buf, filename)], standaloneImages: [] };
  }
  if (lower.endsWith('.pdf')) {
    return { docs: [parsePdfBuffer(buf, filename)], standaloneImages: [] };
  }
  if (lower.endsWith('.zip')) {
    const entries = parseZipEntries(buf);
    const docs: ParsedImportDoc[] = [];
    const standaloneImages: ExtractedBinaryImage[] = [];
    for (const entry of entries) {
      const entryLower = entry.name.toLowerCase();
      if (/\.(png|jpe?g|gif|webp)$/.test(entryLower)) {
        standaloneImages.push({ name: entry.name.split('/').pop() || entry.name, bytes: entry.data });
      } else if (/\.(md|markdown|txt|html|htm|docx|pdf)$/.test(entryLower)) {
        const sub = parseSingleImportFile(entry.name, entry.data);
        docs.push(...sub.docs);
        standaloneImages.push(...sub.standaloneImages);
      }
    }
    return { docs, standaloneImages };
  }
  throw new Error(`Unsupported file type: ${filename}`);
}
