import {
  getBlockByNodeType,
  serialiseInlineNodes,
  type PMJsonMark,
  type PMJsonNode,
} from './block-registry.js';
import { consumeContainerDirective, parseColumnsHeader, splitColumnsDirectiveLines } from './columns-parser.js';

export function normalizeMarkdown(md: string): string {
  return md.replace(/\r\n/g, '\n').replace(/\n+$/, '').trimEnd();
}

/**
 * Parse inline Markdown (`**bold**`, `*italic*`, `` `code` ``, `[text](url)`) into ProseMirror text nodes.
 */
export function parseInlineMarkdown(text: string): PMJsonNode[] {
  if (!text) return [];
  const nodes: PMJsonNode[] = [];
  const tokenRe = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRe.exec(text)) !== null) {
    if (match.index > lastIdx) {
      nodes.push({ type: 'text', text: text.slice(lastIdx, match.index) });
    }
    if (match[2] !== undefined && match[3] !== undefined) {
      const inner = parseInlineMarkdown(match[2]);
      for (const n of inner) {
        const marks: PMJsonMark[] = [...(n.marks ?? []), { type: 'link', attrs: { href: match[3] } }];
        nodes.push({ type: 'text', text: n.text ?? '', marks });
      }
    } else if (match[4] !== undefined) {
      nodes.push({ type: 'text', text: match[4], marks: [{ type: 'bold' }] });
    } else if (match[5] !== undefined) {
      nodes.push({ type: 'text', text: match[5], marks: [{ type: 'italic' }] });
    } else if (match[6] !== undefined) {
      nodes.push({ type: 'text', text: match[6], marks: [{ type: 'code' }] });
    }
    lastIdx = tokenRe.lastIndex;
  }

  if (lastIdx < text.length) {
    nodes.push({ type: 'text', text: text.slice(lastIdx) });
  }
  return nodes;
}

const MEDIA_PATH_RE = /^\/api\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function unescapeMdQuoted(val: string): string {
  let out = '';
  for (let i = 0; i < val.length; i++) {
    if (val[i] === '\\' && i + 1 < val.length) {
      out += val[i + 1];
      i++;
    } else {
      out += val[i];
    }
  }
  return out;
}

/** Linear O(n) parser for standalone Markdown images: ![alt](url) or ![alt](url "caption"). */
export function parseStandaloneImageLine(
  line: string
): { alt: string; url: string; caption?: string } | null {
  const s = line.trim();
  if (!s.startsWith('![') || !s.endsWith(')')) return null;
  let i = 2;
  let altRaw = '';
  while (i < s.length) {
    if (s[i] === '\\' && i + 1 < s.length) {
      altRaw += s[i] + s[i + 1];
      i += 2;
      continue;
    }
    if (s[i] === ']') break;
    altRaw += s[i];
    i++;
  }
  if (i >= s.length - 2 || s[i] !== ']' || s[i + 1] !== '(') return null;
  const inner = s.slice(i + 2, s.length - 1).trim();
  if (!inner) return null;
  let urlEnd = 0;
  while (urlEnd < inner.length && inner.charCodeAt(urlEnd) > 32) urlEnd++;
  const url = inner.slice(0, urlEnd);
  if (!url) return null;
  const rest = inner.slice(urlEnd).trim();
  if (!rest) {
    return { alt: unescapeMdQuoted(altRaw), url };
  }
  if (rest.length >= 2 && rest.startsWith('"') && rest.endsWith('"')) {
    return { alt: unescapeMdQuoted(altRaw), url, caption: unescapeMdQuoted(rest.slice(1, -1)) };
  }
  return null;
}

/** Linear O(n) parser for directive attributes: key="value". */
export function parseDirectiveAttrs(attrBlock: string): Record<string, string> {
  const out: Record<string, string> = {};
  let i = 0;
  const len = attrBlock.length;
  while (i < len) {
    while (i < len && attrBlock.charCodeAt(i) <= 32) i++;
    const keyStart = i;
    while (i < len && /[a-zA-Z0-9_-]/.test(attrBlock[i])) i++;
    const key = attrBlock.slice(keyStart, i);
    if (!key) {
      i++;
      continue;
    }
    while (i < len && attrBlock.charCodeAt(i) <= 32) i++;
    if (i >= len || attrBlock[i] !== '=') continue;
    i++;
    while (i < len && attrBlock.charCodeAt(i) <= 32) i++;
    if (i >= len || attrBlock[i] !== '"') continue;
    i++;
    let val = '';
    while (i < len && attrBlock[i] !== '"') {
      if (attrBlock[i] === '\\' && i + 1 < len) {
        val += attrBlock[i + 1];
        i += 2;
      } else {
        val += attrBlock[i];
        i++;
      }
    }
    if (i < len && attrBlock[i] === '"') i++;
    out[key] = val;
  }
  return out;
}

/**
 * Parse Markdown into a Tiptap/ProseMirror JSON document.
 * Preserves future `:::columns` directives, video directives, media images, callouts, tables, code blocks, lists, quotes, headings, and paragraphs losslessly.
 */
export function markdownToTiptapDoc(md: string): PMJsonNode {
  const norm = normalizeMarkdown(md);
  if (!norm) {
    return { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
  }

  const lines = norm.split('\n');
  const blocks: PMJsonNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      i++;
      continue;
    }

    // 1. Container directive (:::video or :::columns ... :::)
    if (line.startsWith(':::')) {
      const videoHeader = /^:::video\{(.*)\}\s*$/.exec(line.trim());
      const colsHeader = parseColumnsHeader(line);
      const { rawLines: dirLines, nextIdx } = consumeContainerDirective(lines, i);
      i = nextIdx;
      if (videoHeader && dirLines.length >= 2) {
        const attrs = parseDirectiveAttrs(videoHeader[1]);
        const isEmbed = Boolean(attrs.embed);
        blocks.push({
          type: 'mediaVideo',
          attrs: {
            mode: isEmbed ? 'embed' : 'upload',
            src: isEmbed ? '' : (attrs.src ?? ''),
            embedUrl: isEmbed ? (attrs.embed ?? '') : '',
            description: attrs.description ?? '',
            caption: attrs.caption ?? '',
          },
        });
        continue;
      }
      if (colsHeader && dirLines.length >= 2) {
        const inner = dirLines.slice(1, dirLines[dirLines.length - 1].trim() === ':::' ? -1 : undefined);
        const colSections = splitColumnsDirectiveLines(inner);
        if (colSections.length > 0) {
          const columnNodes: PMJsonNode[] = colSections.map((colLines) => {
            const parsed = markdownToTiptapDoc(colLines.join('\n'));
            return {
              type: 'column',
              content: parsed.content?.length ? parsed.content : [{ type: 'paragraph', content: [] }],
            };
          });
          blocks.push({
            type: 'columns',
            attrs: { cols: colsHeader.cols },
            content: columnNodes,
          });
          continue;
        }
      }
      blocks.push({ type: 'directiveBlock', attrs: { rawMd: dirLines.join('\n') } });
      continue;
    }

    // 1b. Standalone /api/media/:id image block
    const imgMatch = parseStandaloneImageLine(line);
    if (imgMatch && MEDIA_PATH_RE.test(imgMatch.url)) {
      blocks.push({
        type: 'mediaImage',
        attrs: {
          src: imgMatch.url,
          alt: imgMatch.alt,
          caption: imgMatch.caption ?? '',
          decorative: imgMatch.alt === '',
        },
      });
      i++;
      continue;
    }

    // 2. Fenced code block
    const fenceMatch = /^```(.*)$/.exec(line);
    if (fenceMatch) {
      const language = fenceMatch[1].trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].startsWith('```')) i++;
      blocks.push({
        type: 'codeBlock',
        attrs: { language },
        content: codeLines.length ? [{ type: 'text', text: codeLines.join('\n') }] : [],
      });
      continue;
    }

    // 3. Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: 'horizontalRule' });
      i++;
      continue;
    }

    // 4. Heading 1-3
    const hMatch = /^(#{1,3})\s+(.+)$/.exec(line);
    if (hMatch) {
      blocks.push({
        type: 'heading',
        attrs: { level: hMatch[1].length },
        content: parseInlineMarkdown(hMatch[2]),
      });
      i++;
      continue;
    }

    // 5. GFM Table
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\|\s*[-:]+/.test(lines[i + 1].trim())) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'table', attrs: { rawMd: tableLines.join('\n') } });
      continue;
    }

    // 6. Callout or Blockquote
    if (line.startsWith('>')) {
      const calloutMatch = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i.exec(line);
      if (calloutMatch) {
        const kind = calloutMatch[1].toUpperCase();
        const bodyLines: string[] = [];
        i++;
        while (i < lines.length && lines[i].startsWith('>')) {
          bodyLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        blocks.push({
          type: 'callout',
          attrs: { kind },
          content: parseInlineMarkdown(bodyLines.join('\n')),
        });
        continue;
      }

      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'blockquote',
        content: [{ type: 'paragraph', content: parseInlineMarkdown(quoteLines.join(' ')) }],
      });
      continue;
    }

    // 7. Bullet list
    if (/^[-*+]\s+/.test(line)) {
      const items: PMJsonNode[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^[-*+]\s+/, '');
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInlineMarkdown(itemText) }],
        });
        i++;
      }
      blocks.push({ type: 'bulletList', content: items });
      continue;
    }

    // 8. Ordered list
    const olMatch = /^(\d+)\.\s+(.+)$/.exec(line);
    if (olMatch) {
      const start = parseInt(olMatch[1], 10);
      const items: PMJsonNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s+/, '');
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInlineMarkdown(itemText) }],
        });
        i++;
      }
      blocks.push({ type: 'orderedList', attrs: { start }, content: items });
      continue;
    }

    // 9. Paragraph (collect contiguous non-block lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith(':::') &&
      !(() => { const m = parseStandaloneImageLine(lines[i]); return Boolean(m && MEDIA_PATH_RE.test(m.url)); })() &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('>') &&
      !/^(#{1,3})\s+/.test(lines[i]) &&
      !/^[-*+]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({
      type: 'paragraph',
      content: parseInlineMarkdown(paraLines.join('\n')),
    });
  }

  return {
    type: 'doc',
    content: blocks.length ? blocks : [{ type: 'paragraph', content: [] }],
  };
}

/**
 * Serialise a Tiptap/ProseMirror JSON document back to normalised Markdown using the block registry.
 */
export function tiptapDocToMarkdown(doc: PMJsonNode): string {
  const serialiseBlock = (node: PMJsonNode): string => {
    const def = getBlockByNodeType(node.type);
    if (def) {
      return def.markdownSerialiser(node, {
        serialiseInline: serialiseInlineNodes,
        serialiseBlock,
      });
    }
    if (node.content) {
      return serialiseInlineNodes(node.content);
    }
    return node.text ?? '';
  };

  const parts = (doc.content ?? []).map(serialiseBlock);
  return normalizeMarkdown(parts.join('\n\n'));
}
