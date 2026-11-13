import {
  attachModalController,
  initDismissibleNotices,
  initTabs,
  updateStatusLine,
} from './containers.js';

function bootGallery(): void {
  initDismissibleNotices(document);

  const tabsEl = document.getElementById('gallery-tabs');
  if (tabsEl) initTabs(tabsEl);

  const dlgEl = document.getElementById('gallery-dialog');
  const openDlgBtn = document.getElementById('gallery-open-dialog');
  if (dlgEl && openDlgBtn) {
    const ctrl = attachModalController(dlgEl);
    openDlgBtn.addEventListener('click', () => ctrl.open(openDlgBtn));
  }

  const drwEl = document.getElementById('gallery-drawer');
  const openDrwBtn = document.getElementById('gallery-open-drawer');
  if (drwEl && openDrwBtn) {
    const ctrl = attachModalController(drwEl);
    openDrwBtn.addEventListener('click', () => ctrl.open(openDrwBtn));
  }

  const statusEl = document.getElementById('gallery-status-line');
  const triggerStatusBtn = document.getElementById('gallery-trigger-status');
  if (statusEl && triggerStatusBtn) {
    triggerStatusBtn.addEventListener('click', () => {
      updateStatusLine(statusEl, {
        message: 'Saved draft.',
        tone: 'ok',
        undoLabel: 'Undo',
        undoSeconds: 8,
        onUndo: () => {
          updateStatusLine(statusEl, { message: 'Restored earlier version.', tone: 'info' });
        },
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootGallery);
} else {
  bootGallery();
}
