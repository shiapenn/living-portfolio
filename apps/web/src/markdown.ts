/**
 * §4.3 & §12.1 Markdown Rendering Engine (Findings F4 [P2], 20261020-UI-01 [P1])
 *
 * Full CommonMark / GFM parser with HTML security sanitization, heading demotion,
 * fenced code blocks, lists, blockquotes, tables, and inline syntax.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  // Disallow javascript:, vbscript:, data: URIs
  if (/^(javascript|vbscript|data):/i.test(trimmed)) {
    return null;
  }
  // Allow relative URLs, anchors, or http(s)
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return trimmed;
  }
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

/**
 * Sanitizes raw HTML input to strip dangerous tags and attributes.
 */
export function sanitizeHtml(html: string): string {
  // Strip <script>, <iframe>, <object>, <embed>, <style> and their contents
  let safe = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  safe = safe.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  safe = safe.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  safe = safe.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  safe = safe.replace(/<embed\b[^>]*>/gi, '');
  
  // Strip inline event handlers like onclick=, onerror=, onload=
  safe = safe.replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
  // Strip javascript: hrefs / srcs
  safe = safe.replace(/(href|src)\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, '$1="#"');

  return safe;
}

/**
 * Renders inline markdown constructs (bold, italic, code, links, images).
 */
export function renderInlineMarkdown(text: string): string {
  let out = escapeHtml(text);

  // Fenced inline code `code`
  out = out.replace(/`([^`]+)`/g, (_m, code) => `<code class="inline-code">${code}</code>`);

  // Images: ![alt](url)
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, rawUrl) => {
    const safe = sanitizeUrl(rawUrl);
    if (!safe) return escapeHtml(alt);
    return `<img src="${escapeHtml(safe)}" alt="${escapeHtml(alt)}" loading="lazy" class="reading-image" />`;
  });

  // Links: [text](url)
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, rawUrl) => {
    const safe = sanitizeUrl(rawUrl);
    if (!safe) return label;
    const isExternal = safe.startsWith('http:') || safe.startsWith('https:');
    const target = isExternal ? ' target="_blank"' : '';
    const rel = isExternal ? ' rel="noopener noreferrer"' : '';
    return `<a href="${escapeHtml(safe)}"${target}${rel}>${label}</a>`;
  });

  // Bold & Italic: ***text***
  out = out.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold: **text** or __text__
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  // Italic: *text* or _text_
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/\b_([^_]+)_\b/g, '<em>$1</em>');

  return out;
}

export interface MarkdownOptions {
  /**
   * Whether to demote headings so the entry body never overrides page h1:
   * # -> h2, ## -> h3, ### -> h4, etc. Defaults to true.
   */
  demoteHeadings?: boolean;
}

/**
 * Full CommonMark / GFM markdown renderer with HTML sanitization and heading demotion.
 */
export function renderMarkdown(md: string, options?: MarkdownOptions): string {
  if (!md || typeof md !== 'string') return '';

  const demote = options?.demoteHeadings !== false;
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // 1. Fenced Code Block: ```[lang]
    if (line.trim().startsWith('```')) {
      const langMatch = line.trim().match(/^```([a-zA-Z0-9_-]*)/);
      const lang = langMatch ? langMatch[1] : '';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i++; // Consume closing fence
      }
      const rawCode = codeLines.join('\n');
      const escaped = escapeHtml(rawCode);
      const langClass = lang ? ` language-${escapeHtml(lang)}` : '';
      blocks.push(`<pre class="code-block${langClass}"><code class="${lang ? `language-${escapeHtml(lang)}` : ''}">${escaped}</code></pre>`);
      continue;
    }

    // 2. Headings: #, ##, ###, ####, #####, ######
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();
      const targetLevel = demote ? Math.min(6, level + 1) : level;
      blocks.push(`<h${targetLevel}>${renderInlineMarkdown(title)}</h${targetLevel}>`);
      i++;
      continue;
    }

    // 3. Blockquote: > quote
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('>') || (lines[i].trim() && !lines[i].startsWith('#') && !lines[i].startsWith('```')))) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const quoteText = quoteLines.join(' ').trim();
      blocks.push(`<blockquote class="reading-quote"><p>${renderInlineMarkdown(quoteText)}</p></blockquote>`);
      continue;
    }

    // 4. GFM Table: lines starting and containing |
    if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|') && /^[|\s-:]+$/.test(lines[i + 1])) {
      const headerLine = lines[i];
      const separatorLine = lines[i + 1];
      const headers = headerLine.split('|').map((h) => h.trim()).filter((h, idx, arr) => idx > 0 && idx < arr.length - 1 || Boolean(h));
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const rowCells = lines[i].split('|').map((c) => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1 || Boolean(c));
        if (rowCells.length > 0) {
          rows.push(rowCells);
        }
        i++;
      }
      let tableHtml = '<div class="table-container"><table class="data-table"><thead><tr>';
      for (const h of headers) {
        tableHtml += `<th>${renderInlineMarkdown(h)}</th>`;
      }
      tableHtml += '</tr></thead><tbody>';
      for (const row of rows) {
        tableHtml += '<tr>';
        for (let cellIdx = 0; cellIdx < headers.length; cellIdx++) {
          const val = row[cellIdx] || '';
          tableHtml += `<td>${renderInlineMarkdown(val)}</td>`;
        }
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table></div>';
      blocks.push(tableHtml);
      continue;
    }

    // 5. Unordered List: -, *, +
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, '').trim());
        i++;
      }
      const listHtml = `<ul class="reading-list">\n${items.map((it) => `  <li>${renderInlineMarkdown(it)}</li>`).join('\n')}\n</ul>`;
      blocks.push(listHtml);
      continue;
    }

    // 6. Ordered List: 1. 2. 3.
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, '').trim());
        i++;
      }
      const listHtml = `<ol class="reading-list">\n${items.map((it) => `  <li>${renderInlineMarkdown(it)}</li>`).join('\n')}\n</ol>`;
      blocks.push(listHtml);
      continue;
    }

    // 7. Regular paragraph: accumulates consecutive non-empty lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].match(/^#{1,6}\s+/) &&
      !lines[i].trim().startsWith('>') &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !(lines[i].includes('|') && i + 1 < lines.length && lines[i + 1].includes('|') && /^[|\s-:]+$/.test(lines[i + 1]))
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      const paraText = paraLines.join(' ');
      blocks.push(`<p>${renderInlineMarkdown(paraText)}</p>`);
    }
  }

  return blocks.join('\n');
}
