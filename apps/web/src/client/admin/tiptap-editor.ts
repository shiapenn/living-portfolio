import { Editor, Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { markdownToTiptapDoc, tiptapDocToMarkdown } from '../../editor/markdown-bridge.js';
import type { PMJsonNode } from '../../editor/block-registry.js';

const CalloutNode = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  addAttributes() {
    return {
      kind: { default: 'NOTE' },
    };
  },
  parseHTML() {
    return [{ tag: 'aside.lp-callout' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['aside', mergeAttributes(HTMLAttributes, { class: 'lp-callout' }), 0];
  },
});

const TableBlockNode = Node.create({
  name: 'table',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      rawMd: { default: '' },
    };
  },
  parseHTML() {
    return [{ tag: 'div.lp-table-block' }];
  },
  renderHTML({ node }) {
    return ['div', { class: 'lp-table-block', contenteditable: 'false' }, ['pre', {}, String(node.attrs.rawMd || '')]];
  },
});

const DirectiveBlockNode = Node.create({
  name: 'directiveBlock',
  group: 'block',
  atom: true,
  addAttributes() {
    return {
      rawMd: { default: '' },
    };
  },
  parseHTML() {
    return [{ tag: 'div.lp-directive-block' }];
  },
  renderHTML({ node }) {
    return ['div', { class: 'lp-directive-block', contenteditable: 'false' }, ['pre', {}, String(node.attrs.rawMd || '')]];
  },
});

export interface SlashCommandItem {
  id: string;
  label: string;
  run: (editor: Editor) => void;
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
  { id: 'h1', label: 'Heading 1', run: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: 'h2', label: 'Heading 2', run: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: 'h3', label: 'Heading 3', run: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: 'bullet', label: 'Bullet list', run: (ed) => ed.chain().focus().toggleBulletList().run() },
  { id: 'ordered', label: 'Numbered list', run: (ed) => ed.chain().focus().toggleOrderedList().run() },
  { id: 'quote', label: 'Quote', run: (ed) => ed.chain().focus().toggleBlockquote().run() },
  { id: 'code', label: 'Code block', run: (ed) => ed.chain().focus().toggleCodeBlock().run() },
  { id: 'divider', label: 'Divider', run: (ed) => ed.chain().focus().setHorizontalRule().run() },
];

export interface MountedTiptapController {
  editor: Editor;
  isSourceMode: () => boolean;
  setSourceMode: (source: boolean) => void;
  setMarkdown: (md: string) => void;
  getMarkdown: () => string;
  destroy: () => void;
}

export function mountTiptapEditor(opts: {
  mountEl: HTMLElement;
  textareaEl: HTMLTextAreaElement;
  slashMenuEl?: HTMLElement | null;
  onMarkdownChange?: (md: string) => void;
  defaultSourceMode?: boolean;
}): MountedTiptapController {
  let sourceMode = Boolean(opts.defaultSourceMode);
  let dirtyFromInitial = false;
  let initialRawMd = opts.textareaEl.value;
  let suppressUpdate = false;

  const editor = new Editor({
    element: opts.mountEl,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
      }),
      CalloutNode,
      TableBlockNode,
      DirectiveBlockNode,
    ],
    content: markdownToTiptapDoc(initialRawMd) as any,
    editorProps: {
      attributes: {
        class: 'lp-tiptap-prose',
        'aria-label': 'Entry body',
        role: 'textbox',
        'aria-multiline': 'true',
      },
      handlePaste: (_view, event) => {
        const text = event.clipboardData?.getData('text/plain');
        const html = event.clipboardData?.getData('text/html');
        if (text && !html && /(^#{1,3}\s|^[-*+]\s|^\d+\.\s|^>\s|^```)/m.test(text)) {
          event.preventDefault();
          const parsed = markdownToTiptapDoc(text);
          if (parsed.content?.length) {
            editor.commands.insertContent(parsed.content as any);
          }
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (suppressUpdate) return;
      dirtyFromInitial = true;
      const md = tiptapDocToMarkdown(ed.getJSON() as PMJsonNode);
      opts.textareaEl.value = md;
      opts.onMarkdownChange?.(md);
      updateSlashMenu(ed);
    },
  });

  const updateSlashMenu = (ed: Editor) => {
    const menu = opts.slashMenuEl;
    if (!menu) return;
    const { $from } = ed.state.selection;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc');
    if (textBefore === '/' || /\s\/$/.test(textBefore)) {
      menu.removeAttribute('hidden');
    } else {
      menu.setAttribute('hidden', '');
    }
  };

  if (opts.slashMenuEl) {
    opts.slashMenuEl.innerHTML = SLASH_COMMANDS.map(
      (cmd, idx) =>
        `<button type="button" role="menuitem" class="lp-btn lp-btn-quiet lp-btn-sm lp-menu-item" data-slash-cmd="${cmd.id}" tabindex="${idx === 0 ? '0' : '-1'}">${cmd.label}</button>`
    ).join('');

    opts.slashMenuEl.addEventListener('mousedown', (e) => e.preventDefault());
    opts.slashMenuEl.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement)?.closest?.('button[data-slash-cmd]') as HTMLButtonElement | null;
      if (!btn) return;
      const cmdId = btn.getAttribute('data-slash-cmd');
      const cmd = SLASH_COMMANDS.find((c) => c.id === cmdId);
      if (!cmd) return;
      const { from } = editor.state.selection;
      editor.chain().focus().deleteRange({ from: Math.max(1, from - 1), to: from }).run();
      cmd.run(editor);
      opts.slashMenuEl?.setAttribute('hidden', '');
    });
  }

  const applyVisibility = () => {
    if (sourceMode) {
      opts.mountEl.setAttribute('hidden', '');
      opts.textareaEl.removeAttribute('hidden');
      opts.textareaEl.classList.remove('lp-is-hidden');
    } else {
      opts.mountEl.removeAttribute('hidden');
      opts.textareaEl.setAttribute('hidden', '');
      opts.textareaEl.classList.add('lp-is-hidden');
    }
  };
  applyVisibility();

  opts.textareaEl.addEventListener('input', () => {
    dirtyFromInitial = true;
    const raw = opts.textareaEl.value;
    suppressUpdate = true;
    editor.commands.setContent(markdownToTiptapDoc(raw) as any);
    suppressUpdate = false;
    opts.onMarkdownChange?.(raw);
  });

  return {
    editor,
    isSourceMode: () => sourceMode,
    setSourceMode: (next: boolean) => {
      if (next === sourceMode) return;
      if (next && dirtyFromInitial) {
        opts.textareaEl.value = tiptapDocToMarkdown(editor.getJSON() as PMJsonNode);
      } else if (!next) {
        suppressUpdate = true;
        editor.commands.setContent(markdownToTiptapDoc(opts.textareaEl.value) as any);
        suppressUpdate = false;
      }
      sourceMode = next;
      applyVisibility();
    },
    setMarkdown: (md: string) => {
      initialRawMd = md;
      dirtyFromInitial = false;
      opts.textareaEl.value = md;
      suppressUpdate = true;
      editor.commands.setContent(markdownToTiptapDoc(md) as any);
      suppressUpdate = false;
    },
    getMarkdown: () => {
      if (!dirtyFromInitial) return initialRawMd;
      if (sourceMode) return opts.textareaEl.value;
      return tiptapDocToMarkdown(editor.getJSON() as PMJsonNode);
    },
    destroy: () => editor.destroy(),
  };
}
