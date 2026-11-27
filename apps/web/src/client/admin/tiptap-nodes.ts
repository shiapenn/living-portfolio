import { Node, mergeAttributes } from '@tiptap/core';

export const CalloutNode = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  addAttributes() {
    return { kind: { default: 'NOTE' } };
  },
  parseHTML() {
    return [{ tag: 'aside.lp-callout' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['aside', mergeAttributes(HTMLAttributes, { class: 'lp-callout' }), 0];
  },
});

export const TableBlockNode = Node.create({
  name: 'table',
  group: 'block',
  atom: true,
  addAttributes() {
    return { rawMd: { default: '' } };
  },
  parseHTML() {
    return [{ tag: 'div.lp-table-block' }];
  },
  renderHTML({ node }) {
    return ['div', { class: 'lp-table-block', contenteditable: 'false' }, ['pre', {}, String(node.attrs.rawMd || '')]];
  },
});

export const DirectiveBlockNode = Node.create({
  name: 'directiveBlock',
  group: 'block',
  atom: true,
  addAttributes() {
    return { rawMd: { default: '' } };
  },
  parseHTML() {
    return [{ tag: 'div.lp-directive-block' }];
  },
  renderHTML({ node }) {
    return ['div', { class: 'lp-directive-block', contenteditable: 'false' }, ['pre', {}, String(node.attrs.rawMd || '')]];
  },
});

export const MediaImageNode = Node.create({
  name: 'mediaImage',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      caption: { default: '' },
      decorative: { default: false },
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-media-node="image"]' }];
  },
  renderHTML({ node }) {
    const src = String(node.attrs.src || '');
    const decorative = Boolean(node.attrs.decorative);
    const alt = decorative ? '' : String(node.attrs.alt || '');
    const caption = String(node.attrs.caption || '');
    const labelText = caption || (decorative ? 'Decorative image' : alt || 'Image');
    return [
      'figure',
      { class: 'lp-editor-media-block', 'data-media-node': 'image', contenteditable: 'false' },
      ['img', { src, alt, class: 'lp-editor-media-img', loading: 'lazy' }],
      [
        'figcaption',
        { class: 'lp-editor-media-meta' },
        ['span', { class: 'lp-editor-media-caption' }, labelText],
        ['button', { type: 'button', class: 'lp-btn lp-btn-secondary lp-btn-sm', 'data-media-edit': 'true', 'aria-label': 'Edit image' }, 'Edit'],
      ],
    ];
  },
});

export const ColumnNode = Node.create({
  name: 'column',
  content: 'block+',
  isolating: true,
  parseHTML() {
    return [{ tag: 'div.lp-editor-column' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'lp-editor-column' }), 0];
  },
});

export const ColumnsNode = Node.create({
  name: 'columns',
  group: 'block',
  content: 'column+',
  addAttributes() {
    return {
      cols: {
        default: 2,
        parseHTML: (el) => {
          const n = Number.parseInt(el.getAttribute('data-cols') || '2', 10);
          return n === 3 ? 3 : n === 4 ? 4 : 2;
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div.lp-editor-columns' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    const rawCols = Number(node.attrs.cols ?? 2);
    const cols = rawCols === 3 ? 3 : rawCols === 4 ? 4 : 2;
    return ['div', mergeAttributes(HTMLAttributes, { class: 'lp-editor-columns', 'data-cols': String(cols) }), 0];
  },
});

export const MediaVideoNode = Node.create({
  name: 'mediaVideo',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  addAttributes() {
    return {
      mode: { default: 'upload' },
      src: { default: '' },
      embedUrl: { default: '' },
      description: { default: '' },
      caption: { default: '' },
    };
  },
  parseHTML() {
    return [{ tag: 'figure[data-media-node="video"]' }];
  },
  renderHTML({ node }) {
    const mode = String(node.attrs.mode || 'upload');
    const src = String(node.attrs.src || '');
    const embedUrl = String(node.attrs.embedUrl || '');
    const description = String(node.attrs.description || 'Video');
    const caption = String(node.attrs.caption || '');
    const mediaChild =
      mode === 'embed'
        ? [
            'div',
            { class: 'lp-editor-media-embed-card' },
            ['strong', {}, description],
            ['span', { class: 'lp-editor-media-caption' }, `Embed: ${embedUrl}`],
          ]
        : ['video', { src, controls: 'true', preload: 'metadata', 'aria-label': description, class: 'lp-editor-media-video' }];
    return [
      'figure',
      { class: 'lp-editor-media-block', 'data-media-node': 'video', contenteditable: 'false' },
      mediaChild,
      [
        'figcaption',
        { class: 'lp-editor-media-meta' },
        ['span', { class: 'lp-editor-media-caption' }, caption || description],
        ['button', { type: 'button', class: 'lp-btn lp-btn-secondary lp-btn-sm', 'data-media-edit': 'true', 'aria-label': 'Edit video' }, 'Edit'],
      ],
    ];
  },
});
