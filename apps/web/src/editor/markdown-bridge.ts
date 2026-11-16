import {
  getBlockByNodeType,
  serialiseInlineNodes,
  type PMJsonMark,
  type PMJsonNode,
} from './block-registry.js';

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

/**
 * Parse Markdown into a Tiptap/ProseMirror JSON document.
 * Preserves future `:::columns` directives, callouts, tables, code blocks, lists, quotes, headings, and paragraphs losslessly.
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

    // 1. Container directive (:::columns ... :::)
    if (line.startsWith(':::')) {
      const dirLines: string[] = [line];
      let depth = 1;
      i++;
      while (i < lines.length && depth > 0) {
        const cur = lines[i];
        dirLines.push(cur);
        if (cur.trim() === ':::') {
          depth--;
        } else if (cur.trim().startsWith(':::')) {
          depth++;
        }
        i++;
      }
      blocks.push({ type: 'directiveBlock', attrs: { rawMd: dirLines.join('\n') } });
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
