const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalController {
  open: (triggerEl?: HTMLElement | null) => void;
  close: () => void;
}

export interface ModalHooks {
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * Attaches focus-trap, Escape-key close, backdrop close, and focus-return behaviour to a Dialog or Drawer.
 */
export function attachModalController(modalEl: HTMLElement, hooks?: ModalHooks): ModalController {
  let lastTrigger: HTMLElement | null = null;

  const getFocusable = (): HTMLElement[] =>
    Array.from(modalEl.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.hasAttribute('hidden') && el.offsetParent !== null
    );

  const close = () => {
    modalEl.setAttribute('hidden', '');
    document.removeEventListener('keydown', onKeyDown);
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      lastTrigger.focus();
    }
    lastTrigger = null;
    hooks?.onClose?.();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (modalEl.hasAttribute('hidden')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === 'Tab') {
      const focusable = getFocusable();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const open = (triggerEl?: HTMLElement | null) => {
    lastTrigger = triggerEl ?? (document.activeElement as HTMLElement | null);
    hooks?.onOpen?.();
    modalEl.removeAttribute('hidden');
    document.addEventListener('keydown', onKeyDown);
    const focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  };

  modalEl.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (target === modalEl || target?.closest('[data-lp-dialog-close]')) {
      close();
    }
  });

  return { open, close };
}

/**
 * Shared Menu popover controller: handles Enter/Space/ArrowDown/ArrowUp on trigger,
 * ArrowDown/ArrowUp/Home/End/Escape/Tab inside menu, and outside-click dismissal.
 */
export function attachMenuController(buttonId: string, menuId: string): () => void {
  const btn = document.getElementById(buttonId);
  const menu = document.getElementById(menuId);
  if (!btn || !menu) return () => {};

  const getItems = (): HTMLElement[] =>
    Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"], [role="menuitemradio"]')).filter(
      (el) => !el.hasAttribute('disabled') && !el.closest('[hidden]') && getComputedStyle(el).display !== 'none'
    );

  const close = (returnFocus = false) => {
    if (menu.hasAttribute('hidden')) return;
    menu.setAttribute('hidden', '');
    btn.setAttribute('aria-expanded', 'false');
    if (returnFocus) btn.focus();
  };

  const open = (focusTarget: 'first' | 'last' | 'none' = 'none') => {
    menu.removeAttribute('hidden');
    btn.setAttribute('aria-expanded', 'true');
    if (focusTarget === 'none') return;
    const items = getItems();
    if (items.length === 0) return;
    const target = focusTarget === 'last' ? items[items.length - 1] : items[0];
    target?.focus();
  };

  btn.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = !menu.hasAttribute('hidden');
    if (isOpen) {
      close(false);
    } else {
      open(event.detail === 0 ? 'first' : 'none');
    }
  });

  btn.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      open('first');
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      open('last');
    } else if (event.key === 'Escape' && !menu.hasAttribute('hidden')) {
      event.preventDefault();
      close(true);
    }
  });

  menu.addEventListener('keydown', (event) => {
    const items = getItems();
    if (items.length === 0) return;
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(idx + 1) % items.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(idx - 1 + items.length) % items.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Tab') {
      close(false);
    }
  });

  document.addEventListener('click', (event) => {
    if (!menu.contains(event.target as Node) && event.target !== btn && !btn.contains(event.target as Node)) {
      close(false);
    }
  });

  return () => close(false);
}

/**
 * Attaches ArrowLeft/ArrowRight/Home/End keyboard navigation and roving tabindex to a Tabs container.
 */
export function initTabs(tabsRoot: HTMLElement): void {
  const tabs = Array.from(tabsRoot.querySelectorAll<HTMLElement>('[role="tab"]'));
  if (tabs.length === 0) return;

  const activate = (nextTab: HTMLElement, focusTab: boolean) => {
    for (const tab of tabs) {
      const selected = tab === nextTab;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.setAttribute('tabindex', selected ? '0' : '-1');
      const panelId = tab.getAttribute('aria-controls');
      if (panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
          if (selected) {
            panel.removeAttribute('hidden');
          } else {
            panel.setAttribute('hidden', '');
          }
        }
      }
    }
    if (focusTab) nextTab.focus();
  };

  tabsRoot.addEventListener('click', (event) => {
    const tab = (event.target as HTMLElement | null)?.closest<HTMLElement>('[role="tab"]');
    if (tab && tabs.includes(tab)) {
      activate(tab, false);
    }
  });

  tabsRoot.addEventListener('keydown', (event) => {
    const current = (event.target as HTMLElement | null)?.closest<HTMLElement>('[role="tab"]');
    if (!current) return;
    const idx = tabs.indexOf(current);
    if (idx === -1) return;

    let nextIdx = idx;
    if (event.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIdx = 0;
    else if (event.key === 'End') nextIdx = tabs.length - 1;
    else return;

    event.preventDefault();
    activate(tabs[nextIdx], true);
  });
}

/**
 * Wires dismiss buttons on persistent PageNotice elements.
 */
export function initDismissibleNotices(root: Document | HTMLElement = document): void {
  root.addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement | null)?.closest('[data-lp-notice-dismiss]');
    if (!btn) return;
    const notice = btn.closest('.lp-notice');
    if (notice) {
      notice.setAttribute('hidden', '');
    }
  });
}

export interface StatusLineUpdate {
  message: string;
  tone?: 'info' | 'ok' | 'warn' | 'danger';
  undoLabel?: string;
  undoSeconds?: number;
  onUndo?: () => void;
}

const activeTimers = new WeakMap<HTMLElement, number>();

const TONE_ICONS: Record<'info' | 'ok' | 'warn' | 'danger', string> = {
  info: 'info',
  ok: 'check-circle',
  warn: 'alert-triangle',
  danger: 'alert-circle',
};

/**
 * Updates a StatusLine live region cleanly once and optionally runs a real-countdown Undo timer.
 */
export function updateStatusLine(statusEl: HTMLElement, update: StatusLineUpdate): void {
  const prevTimer = activeTimers.get(statusEl);
  if (prevTimer !== undefined) {
    window.clearInterval(prevTimer);
    activeTimers.delete(statusEl);
  }

  const tone = update.tone ?? 'info';
  statusEl.className = `lp-status-line lp-status-line-${tone}`;
  statusEl.setAttribute('role', tone === 'danger' ? 'alert' : 'status');
  statusEl.setAttribute('aria-live', tone === 'danger' ? 'assertive' : 'polite');
  if (update.message) {
    statusEl.removeAttribute('hidden');
  } else {
    statusEl.setAttribute('hidden', '');
  }
  statusEl.innerHTML = '';

  if (update.message) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'lp-icon lp-icon-16 lp-status-icon');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#lp-icon-${TONE_ICONS[tone]}`);
    svg.appendChild(use);
    statusEl.appendChild(svg);
  }

  const bodySpan = document.createElement('span');
  bodySpan.className = 'lp-status-line-body';
  const textSpan = document.createElement('span');
  textSpan.className = 'lp-status-line-text';
  textSpan.textContent = update.message;
  bodySpan.appendChild(textSpan);

  if (update.undoLabel && update.undoSeconds && update.undoSeconds > 0 && update.onUndo) {
    let remaining = update.undoSeconds;
    bodySpan.appendChild(document.createTextNode(' '));
    const undoBtn = document.createElement('button');
    undoBtn.type = 'button';
    undoBtn.className = 'lp-status-undo lp-status-undo-link';
    undoBtn.textContent = `${update.undoLabel} (${remaining}s)`;
    undoBtn.addEventListener('click', () => {
      const t = activeTimers.get(statusEl);
      if (t !== undefined) {
        window.clearInterval(t);
        activeTimers.delete(statusEl);
      }
      undoBtn.remove();
      update.onUndo?.();
    });
    bodySpan.appendChild(undoBtn);

    const timer = window.setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        window.clearInterval(timer);
        activeTimers.delete(statusEl);
        undoBtn.remove();
      } else {
        undoBtn.textContent = `${update.undoLabel} (${remaining}s)`;
      }
    }, 1000);
    activeTimers.set(statusEl, timer);
  }
  statusEl.appendChild(bodySpan);
}
