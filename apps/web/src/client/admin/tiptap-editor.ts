import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { markdownToTiptapDoc, tiptapDocToMarkdown } from '../../editor/markdown-bridge.js';
import type { PMJsonNode } from '../../editor/block-registry.js';
import { CalloutNode, DirectiveBlockNode, MediaImageNode, MediaVideoNode, TableBlockNode } from './tiptap-nodes.js';

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
  { id: 'image', label: 'Image', run: () => {} },
  { id: 'video', label: 'Video', run: () => {} },
];

export interface MountedTiptapController {
  editor: Editor;
  isSourceMode: () => boolean;
  setSourceMode: (source: boolean) => void;
  setMarkdown: (md: string) => void;
  getMarkdown: () => string;
  setMediaHandlers: (handlers: {
    onOpenMediaDialog: (kind: 'image' | 'video', triggerEl?: HTMLElement | null) => void;
    onEditMediaNode: (target: { pos: number; nodeType: 'mediaImage' | 'mediaVideo'; attrs: Record<string, unknown> }, triggerEl?: HTMLElement | null) => void;
    onUploadFile: (file: File) => void;
  }) => void;
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
  let mediaHandlers: {
    onOpenMediaDialog: (kind: 'image' | 'video', triggerEl?: HTMLElement | null) => void;
    onEditMediaNode: (target: { pos: number; nodeType: 'mediaImage' | 'mediaVideo'; attrs: Record<string, unknown> }, triggerEl?: HTMLElement | null) => void;
    onUploadFile: (file: File) => void;
  } | null = null;

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
      MediaImageNode,
      MediaVideoNode,
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
        const files = event.clipboardData?.files;
        if (files && files.length > 0 && mediaHandlers) {
          const mediaFile = Array.from(files).find((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
          if (mediaFile) {
            event.preventDefault();
            mediaHandlers.onUploadFile(mediaFile);
            return true;
          }
        }
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
      handleKeyDown: (_view, event) => {
        if (event.key === 'Enter' && opts.slashMenuEl && !opts.slashMenuEl.hasAttribute('hidden')) {
          const firstVisible = opts.slashMenuEl.querySelector<HTMLButtonElement>('button[data-slash-cmd]:not([hidden])');
          if (firstVisible) {
            event.preventDefault();
            firstVisible.click();
            return true;
          }
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
    onSelectionUpdate: ({ editor: ed }) => {
      if (suppressUpdate) return;
      updateSlashMenu(ed);
    },
  });

  const getSlashQuery = (ed: Editor): string | null => {
    const { $from } = ed.state.selection;
    const textBefore = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc');
    const m = /(?:^|\s)\/([a-z0-9]*)$/i.exec(textBefore);
    return m ? m[1].toLowerCase() : null;
  };

  const updateSlashMenu = (ed: Editor) => {
    const menu = opts.slashMenuEl;
    if (!menu) return;
    const query = getSlashQuery(ed);
    if (query === null) {
      menu.setAttribute('hidden', '');
      return;
    }
    let visibleCount = 0;
    menu.querySelectorAll<HTMLButtonElement>('button[data-slash-cmd]').forEach((btn) => {
      const id = (btn.getAttribute('data-slash-cmd') || '').toLowerCase();
      const label = (btn.textContent || '').toLowerCase();
      const match = !query || id.startsWith(query) || label.includes(query);
      if (match) {
        btn.removeAttribute('hidden');
        visibleCount++;
      } else {
        btn.setAttribute('hidden', '');
      }
    });
    if (visibleCount > 0) menu.removeAttribute('hidden');
    else menu.setAttribute('hidden', '');
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
      const query = getSlashQuery(editor) ?? '';
      const { from } = editor.state.selection;
      editor.chain().focus().deleteRange({ from: Math.max(1, from - query.length - 1), to: from }).run();
      opts.slashMenuEl?.setAttribute('hidden', '');
      if (cmdId === 'image' || cmdId === 'video') {
        mediaHandlers?.onOpenMediaDialog(cmdId, opts.mountEl);
      } else {
        cmd.run(editor);
      }
    });
  }

  // Drop target is the editor surface (never inside the dialog)
  const surfaceWrap = opts.mountEl.parentElement;
  if (surfaceWrap) {
    surfaceWrap.addEventListener('dragover', (e) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
        surfaceWrap.classList.add('is-drop-active');
      }
    });
    surfaceWrap.addEventListener('dragleave', () => {
      surfaceWrap.classList.remove('is-drop-active');
    });
    surfaceWrap.addEventListener('drop', (e) => {
      surfaceWrap.classList.remove('is-drop-active');
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0 || !mediaHandlers) return;
      const mediaFile = Array.from(files).find((f) => f.type.startsWith('image/') || f.type.startsWith('video/'));
      if (!mediaFile) return;
      e.preventDefault();
      mediaHandlers.onUploadFile(mediaFile);
    });
  }

  // Clicking Edit button (or figure) on an inserted media block opens the unified dialog in Edit mode
  opts.mountEl.addEventListener('click', (e) => {
    const targetEl = e.target as HTMLElement | null;
    const editBtn = targetEl?.closest<HTMLElement>('[data-media-edit="true"]');
    const figureEl = targetEl?.closest<HTMLElement>('figure[data-media-node]');
    if (!editBtn && !figureEl) return;
    if (!mediaHandlers || !figureEl) return;
    e.preventDefault();
    const pos = editor.view.posAtDOM(figureEl, 0);
    let resolvedPos = pos;
    let node = editor.state.doc.nodeAt(resolvedPos);
    if (!node || (node.type.name !== 'mediaImage' && node.type.name !== 'mediaVideo')) {
      resolvedPos = Math.max(0, pos - 1);
      node = editor.state.doc.nodeAt(resolvedPos);
    }
    if (node && (node.type.name === 'mediaImage' || node.type.name === 'mediaVideo')) {
      mediaHandlers.onEditMediaNode(
        {
          pos: resolvedPos,
          nodeType: node.type.name as 'mediaImage' | 'mediaVideo',
          attrs: { ...node.attrs },
        },
        editBtn || figureEl
      );
    }
  });

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
    setMediaHandlers: (handlers) => {
      mediaHandlers = handlers;
    },
    destroy: () => editor.destroy(),
  };
}
