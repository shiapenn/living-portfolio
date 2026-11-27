import { escapeHtml } from '../lib/html.js';

export interface PMJsonMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface PMJsonNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: PMJsonNode[];
  marks?: PMJsonMark[];
  text?: string;
}

export interface BlockDefinition {
  id: string;
  label: string;
  nodeType: string;
  schema: {
    attrs?: Record<string, unknown>;
    content?: string;
  };
  editorView: string;
  markdownSerialiser: (node: PMJsonNode, helpers: SerialiseHelpers) => string;
  publicRenderer: (node: PMJsonNode, helpers: RenderHelpers) => string;
  exportRule: (node: PMJsonNode, helpers: SerialiseHelpers) => string;
}

export interface SerialiseHelpers {
  serialiseInline: (nodes?: PMJsonNode[]) => string;
  serialiseBlock: (node: PMJsonNode) => string;
}

export interface RenderHelpers {
  renderInline: (nodes?: PMJsonNode[]) => string;
  renderBlock: (node: PMJsonNode) => string;
}

const registry = new Map<string, BlockDefinition>();

export function registerBlock(def: BlockDefinition): void {
  registry.set(def.id, def);
}

export function getRegisteredBlocks(): BlockDefinition[] {
  return Array.from(registry.values());
}

export function getBlockByNodeType(nodeType: string): BlockDefinition | undefined {
  for (const def of registry.values()) {
    if (def.nodeType === nodeType) return def;
  }
  return undefined;
}

export function validateBlockRegistry(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const def of registry.values()) {
    if (typeof def.publicRenderer !== 'function') {
      errors.push(`Block "${def.id}" is missing a publicRenderer.`);
    }
    if (typeof def.exportRule !== 'function') {
      errors.push(`Block "${def.id}" is missing an exportRule.`);
    }
  }
  return { ok: errors.length === 0, errors };
}

function renderTextWithMarks(node: PMJsonNode): string {
  let out = escapeHtml(node.text ?? '');
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') out = `<strong>${out}</strong>`;
    else if (mark.type === 'italic') out = `<em>${out}</em>`;
    else if (mark.type === 'code') out = `<code>${out}</code>`;
    else if (mark.type === 'link') {
      const href = escapeHtml(String(mark.attrs?.href ?? ''));
      out = `<a href="${href}">${out}</a>`;
    }
  }
  return out;
}

export function renderInlineNodes(nodes?: PMJsonNode[]): string {
  if (!nodes?.length) return '';
  return nodes
    .map((n) => (n.type === 'hardBreak' ? '<br />' : renderTextWithMarks(n)))
    .join('');
}

export function serialiseInlineNodes(nodes?: PMJsonNode[]): string {
  if (!nodes?.length) return '';
  return nodes
    .map((n) => {
      if (n.type === 'hardBreak') return '\n';
      let txt = n.text ?? '';
      const marks = n.marks ?? [];
      const linkMark = marks.find((m) => m.type === 'link');
      const hasCode = marks.some((m) => m.type === 'code');
      const hasBold = marks.some((m) => m.type === 'bold');
      const hasItalic = marks.some((m) => m.type === 'italic');
      if (hasCode) txt = `\`${txt}\``;
      if (hasItalic) txt = `*${txt}*`;
      if (hasBold) txt = `**${txt}**`;
      if (linkMark) txt = `[${txt}](${String(linkMark.attrs?.href ?? '')})`;
      return txt;
    })
    .join('');
}

// Register D-LAYOUT #8/#9 text blocks + directive pass-through
registerBlock({
  id: 'paragraph',
  label: 'Paragraph',
  nodeType: 'paragraph',
  schema: { content: 'inline*' },
  editorView: 'StarterKit.Paragraph',
  markdownSerialiser: (node, h) => h.serialiseInline(node.content),
  publicRenderer: (node, h) => `<p>${h.renderInline(node.content)}</p>`,
  exportRule: (node, h) => h.serialiseInline(node.content),
});

registerBlock({
  id: 'heading',
  label: 'Heading',
  nodeType: 'heading',
  schema: { attrs: { level: 1 }, content: 'inline*' },
  editorView: 'StarterKit.Heading',
  markdownSerialiser: (node, h) => {
    const level = Math.min(3, Math.max(1, Number(node.attrs?.level ?? 1)));
    return `${'#'.repeat(level)} ${h.serialiseInline(node.content)}`;
  },
  publicRenderer: (node, h) => {
    const level = Math.min(3, Math.max(1, Number(node.attrs?.level ?? 1)));
    return `<h${level}>${h.renderInline(node.content)}</h${level}>`;
  },
  exportRule: (node, h) => {
    const level = Math.min(3, Math.max(1, Number(node.attrs?.level ?? 1)));
    return `${'#'.repeat(level)} ${h.serialiseInline(node.content)}`;
  },
});

registerBlock({
  id: 'bulletList',
  label: 'Bullet list',
  nodeType: 'bulletList',
  schema: { content: 'listItem+' },
  editorView: 'StarterKit.BulletList',
  markdownSerialiser: (node, h) =>
    (node.content ?? [])
      .map((item) => {
        const firstPara = item.content?.[0];
        return `- ${firstPara ? h.serialiseInline(firstPara.content) : ''}`;
      })
      .join('\n'),
  publicRenderer: (node, h) =>
    `<ul>${(node.content ?? []).map((li) => `<li>${h.renderInline(li.content?.[0]?.content)}</li>`).join('')}</ul>`,
  exportRule: (node, h) =>
    (node.content ?? []).map((li) => `- ${h.serialiseInline(li.content?.[0]?.content)}`).join('\n'),
});

registerBlock({
  id: 'orderedList',
  label: 'Numbered list',
  nodeType: 'orderedList',
  schema: { attrs: { start: 1 }, content: 'listItem+' },
  editorView: 'StarterKit.OrderedList',
  markdownSerialiser: (node, h) => {
    const start = Number(node.attrs?.start ?? 1);
    return (node.content ?? [])
      .map((item, idx) => `${start + idx}. ${item.content?.[0] ? h.serialiseInline(item.content[0].content) : ''}`)
      .join('\n');
  },
  publicRenderer: (node, h) =>
    `<ol>${(node.content ?? []).map((li) => `<li>${h.renderInline(li.content?.[0]?.content)}</li>`).join('')}</ol>`,
  exportRule: (node, h) =>
    (node.content ?? []).map((li, i) => `${i + 1}. ${h.serialiseInline(li.content?.[0]?.content)}`).join('\n'),
});

registerBlock({
  id: 'blockquote',
  label: 'Quote',
  nodeType: 'blockquote',
  schema: { content: 'block+' },
  editorView: 'StarterKit.Blockquote',
  markdownSerialiser: (node, h) =>
    (node.content ?? [])
      .map((child) =>
        h
          .serialiseBlock(child)
          .split('\n')
          .map((line) => `> ${line}`)
          .join('\n')
      )
      .join('\n>\n'),
  publicRenderer: (node, h) =>
    `<blockquote>${(node.content ?? []).map((c) => h.renderBlock(c)).join('')}</blockquote>`,
  exportRule: (node, h) =>
    (node.content ?? []).map((c) => `> ${h.serialiseBlock(c)}`).join('\n'),
});

registerBlock({
  id: 'callout',
  label: 'Callout',
  nodeType: 'callout',
  schema: { attrs: { kind: 'NOTE' }, content: 'inline*' },
  editorView: 'CalloutExtension',
  markdownSerialiser: (node, h) => {
    const kind = String(node.attrs?.kind ?? 'NOTE').toUpperCase();
    const lines = h.serialiseInline(node.content).split('\n');
    return [`> [!${kind}]`, ...lines.map((l) => `> ${l}`)].join('\n');
  },
  publicRenderer: (node, h) =>
    `<aside class="lp-callout"><strong>${escapeHtml(String(node.attrs?.kind ?? 'NOTE'))}</strong><p>${h.renderInline(node.content)}</p></aside>`,
  exportRule: (node, h) => {
    const kind = String(node.attrs?.kind ?? 'NOTE').toUpperCase();
    return `> [!${kind}]\n> ${h.serialiseInline(node.content)}`;
  },
});

registerBlock({
  id: 'codeBlock',
  label: 'Code block',
  nodeType: 'codeBlock',
  schema: { attrs: { language: '' }, content: 'text*' },
  editorView: 'StarterKit.CodeBlock',
  markdownSerialiser: (node) => {
    const lang = String(node.attrs?.language ?? '');
    const code = (node.content ?? []).map((c) => c.text ?? '').join('');
    return `\`\`\`${lang}\n${code}\n\`\`\``;
  },
  publicRenderer: (node) => {
    const code = escapeHtml((node.content ?? []).map((c) => c.text ?? '').join(''));
    return `<pre><code>${code}</code></pre>`;
  },
  exportRule: (node) => {
    const lang = String(node.attrs?.language ?? '');
    const code = (node.content ?? []).map((c) => c.text ?? '').join('');
    return `\`\`\`${lang}\n${code}\n\`\`\``;
  },
});

registerBlock({
  id: 'table',
  label: 'Table',
  nodeType: 'table',
  schema: { attrs: { rows: [] } },
  editorView: 'TableBlockExtension',
  markdownSerialiser: (node) => String(node.attrs?.rawMd ?? ''),
  publicRenderer: (node) => `<div class="lp-table-wrap"><pre>${escapeHtml(String(node.attrs?.rawMd ?? ''))}</pre></div>`,
  exportRule: (node) => String(node.attrs?.rawMd ?? ''),
});

registerBlock({
  id: 'horizontalRule',
  label: 'Divider',
  nodeType: 'horizontalRule',
  schema: {},
  editorView: 'StarterKit.HorizontalRule',
  markdownSerialiser: () => '---',
  publicRenderer: () => '<hr />',
  exportRule: () => '---',
});

registerBlock({
  id: 'linkEmbed',
  label: 'Link or embed',
  nodeType: 'linkEmbed',
  schema: { attrs: { url: '', label: '' } },
  editorView: 'LinkEmbedExtension',
  markdownSerialiser: (node) => `[${String(node.attrs?.label ?? node.attrs?.url ?? '')}](${String(node.attrs?.url ?? '')})`,
  publicRenderer: (node) => {
    const url = escapeHtml(String(node.attrs?.url ?? ''));
    const label = escapeHtml(String(node.attrs?.label ?? url));
    return `<p><a href="${url}">${label}</a></p>`;
  },
  exportRule: (node) => `[${String(node.attrs?.label ?? node.attrs?.url ?? '')}](${String(node.attrs?.url ?? '')})`,
});

registerBlock({
  id: 'mediaImage',
  label: 'Image',
  nodeType: 'mediaImage',
  schema: { attrs: { src: '', alt: '', caption: '', decorative: false } },
  editorView: 'MediaImageExtension',
  markdownSerialiser: (node) => {
    const src = String(node.attrs?.src ?? '');
    const decorative = Boolean(node.attrs?.decorative);
    const alt = decorative ? '' : String(node.attrs?.alt ?? '').replace(/\]/g, '\\]');
    const caption = String(node.attrs?.caption ?? '');
    const capPart = caption ? ` "${caption.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : '';
    return `![${alt}](${src}${capPart})`;
  },
  publicRenderer: (node) => {
    const src = escapeHtml(String(node.attrs?.src ?? ''));
    const decorative = Boolean(node.attrs?.decorative);
    const alt = decorative ? '' : escapeHtml(String(node.attrs?.alt ?? ''));
    const caption = String(node.attrs?.caption ?? '');
    return `<figure class="pub-media" data-pub-media="image"><img src="${src}" alt="${alt}" loading="lazy" />${caption ? `<figcaption class="pub-media-caption">${escapeHtml(caption)}</figcaption>` : ''}</figure>`;
  },
  exportRule: (node) => {
    const src = String(node.attrs?.src ?? '');
    const decorative = Boolean(node.attrs?.decorative);
    const alt = decorative ? '' : String(node.attrs?.alt ?? '').replace(/\]/g, '\\]');
    const caption = String(node.attrs?.caption ?? '');
    const capPart = caption ? ` "${caption.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : '';
    return `![${alt}](${src}${capPart})`;
  },
});

registerBlock({
  id: 'mediaVideo',
  label: 'Video',
  nodeType: 'mediaVideo',
  schema: { attrs: { mode: 'upload', src: '', embedUrl: '', description: '', caption: '' } },
  editorView: 'MediaVideoExtension',
  markdownSerialiser: (node) => {
    const mode = String(node.attrs?.mode ?? 'upload') === 'embed' ? 'embed' : 'upload';
    const escAttr = (v: string) => v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const desc = escAttr(String(node.attrs?.description ?? ''));
    const cap = String(node.attrs?.caption ?? '');
    const capAttr = cap ? ` caption="${escAttr(cap)}"` : '';
    if (mode === 'embed') {
      const embed = escAttr(String(node.attrs?.embedUrl ?? ''));
      return `:::video{embed="${embed}" description="${desc}"${capAttr}}\n:::`;
    }
    const src = escAttr(String(node.attrs?.src ?? ''));
    return `:::video{src="${src}" description="${desc}"${capAttr}}\n:::`;
  },
  publicRenderer: (node) => {
    const mode = String(node.attrs?.mode ?? 'upload') === 'embed' ? 'embed' : 'upload';
    const desc = escapeHtml(String(node.attrs?.description ?? ''));
    const cap = String(node.attrs?.caption ?? '');
    const capHtml = cap ? `<figcaption class="pub-media-caption">${escapeHtml(cap)}</figcaption>` : '';
    if (mode === 'embed') {
      const embed = escapeHtml(String(node.attrs?.embedUrl ?? ''));
      return `<figure class="pub-media" data-pub-media="embed"><div class="pub-embed-gate" data-embed-state="unloaded" data-embed-src="${embed}" data-embed-title="${desc}"><p class="pub-embed-gate-title">${desc}</p><button type="button" class="btn btn-primary pub-embed-load-btn">Load video</button></div>${capHtml}</figure>`;
    }
    const src = escapeHtml(String(node.attrs?.src ?? ''));
    return `<figure class="pub-media" data-pub-media="video"><video src="${src}" controls preload="metadata" aria-label="${desc}"></video>${capHtml}</figure>`;
  },
  exportRule: (node) => {
    const mode = String(node.attrs?.mode ?? 'upload') === 'embed' ? 'embed' : 'upload';
    const escAttr = (v: string) => v.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const desc = escAttr(String(node.attrs?.description ?? ''));
    const cap = String(node.attrs?.caption ?? '');
    const capAttr = cap ? ` caption="${escAttr(cap)}"` : '';
    if (mode === 'embed') {
      return `:::video{embed="${escAttr(String(node.attrs?.embedUrl ?? ''))}" description="${desc}"${capAttr}}\n:::`;
    }
    return `:::video{src="${escAttr(String(node.attrs?.src ?? ''))}" description="${desc}"${capAttr}}\n:::`;
  },
});

registerBlock({
  id: 'directiveBlock',
  label: 'Container directive',
  nodeType: 'directiveBlock',
  schema: { attrs: { rawMd: '' } },
  editorView: 'DirectiveBlockExtension',
  markdownSerialiser: (node) => String(node.attrs?.rawMd ?? ''),
  publicRenderer: (node) => `<div class="lp-directive">${escapeHtml(String(node.attrs?.rawMd ?? ''))}</div>`,
  exportRule: (node) => String(node.attrs?.rawMd ?? ''),
});
