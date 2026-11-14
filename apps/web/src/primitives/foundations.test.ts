import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  renderIcon,
  renderIconSprite,
  renderFoundationsGalleryPage,
} from './foundations-gallery.js';
import {
  renderBadge,
  renderButton,
  renderChip,
  renderIconButton,
} from './index.js';
import {
  renderDisclosure,
  renderEmptyState,
  renderPageNotice,
  renderStatusLine,
} from '../components/index.js';

describe('WP-15.3a Design Foundations (D-FOUND-1..6)', () => {
  it('registers docs/design/foundations.md with D-FOUND-1 through D-FOUND-6 and Lucide ISC licence', () => {
    const docPath = resolve(process.cwd(), '../../docs/design/foundations.md');
    expect(existsSync(docPath)).toBe(true);
    const content = readFileSync(docPath, 'utf8');
    for (const rule of ['D-FOUND-1', 'D-FOUND-2', 'D-FOUND-3', 'D-FOUND-4', 'D-FOUND-5', 'D-FOUND-6', 'ISC']) {
      expect(content).toContain(rule);
    }
  });

  it('renders self-hosted 24px SVG icon sprite and icons at 16, 20, and 24 px only (D-FOUND-1)', () => {
    const sprite = renderIconSprite();
    expect(sprite).toContain('<svg id="lp-icon-sprite"');
    expect(sprite).toContain('viewBox="0 0 24 24"');
    expect(sprite).toContain('id="lp-icon-x"');
    expect(sprite).toContain('id="lp-icon-chevron-down"');
    expect(sprite).toContain('id="lp-icon-sun-moon"');

    const icon16 = renderIcon({ name: 'x', size: 16 });
    expect(icon16).toContain('width="16" height="16"');
    expect(icon16).toContain('href="#lp-icon-x"');
  });

  it('enforces ghost/outlined icon buttons with accessible label and tooltip, never filled (D-FOUND-1)', () => {
    const ghost = renderIconButton({
      ariaLabel: 'Dismiss notice',
      icon: 'x',
      variant: 'quiet',
      iconSize: 16,
    });
    expect(ghost).toContain('aria-label="Dismiss notice"');
    expect(ghost).toContain('title="Dismiss notice"');
    expect(ghost).toContain('lp-icon-btn-ghost');
    expect(ghost).not.toContain('×');

    const outlined = renderIconButton({
      ariaLabel: 'Switch theme',
      icon: 'sun-moon',
      variant: 'secondary',
      iconSize: 20,
    });
    expect(outlined).toContain('lp-icon-btn-outlined');
  });

  it('renders Badge as borderless pill and Chip as interactive pill with border (D-FOUND-2)', () => {
    const badge = renderBadge({ label: 'Public', tone: 'ok' });
    expect(badge).toContain('lp-badge');
    expect(badge).toContain('<span');

    const chip = renderChip({ label: 'Architecture', state: 'confirmed', interactive: true });
    expect(chip).toContain('<button');
    expect(chip).toContain('lp-chip');
  });

  it('renders Notice with tone icon + ghost X dismiss, StatusLine with tone icon + link Undo, and Disclosure with rotating chevron (D-FOUND-6)', () => {
    const notice = renderPageNotice({
      id: 'n1',
      tone: 'warn',
      message: 'Session expires soon.',
      dismissible: true,
    });
    expect(notice).toContain('#lp-icon-alert-triangle');
    expect(notice).toContain('#lp-icon-x');
    expect(notice).not.toContain('×');

    const status = renderStatusLine({
      id: 's1',
      tone: 'ok',
      message: 'Saved draft.',
      undoLabel: 'Undo',
      undoSeconds: 8,
    });
    expect(status).toContain('#lp-icon-check-circle');
    expect(status).toContain('lp-status-undo-link');

    const disc = renderDisclosure({
      id: 'd1',
      summary: 'Details',
      summaryMeta: '13 Nov 2026 · Exact',
      bodyHtml: '<p>Fields</p>',
    });
    expect(disc).toContain('#lp-icon-chevron-down');
  });

  it('renders EmptyState with single primary CTA and optional embedded first-run guide numbered once (D-FOUND-6)', () => {
    const empty = renderEmptyState({
      id: 'e1',
      title: 'Write your first entry',
      body: 'Start a draft to record your notes.',
      actionHtml: renderButton({ label: 'Start a draft', variant: 'primary' }),
      guideSteps: [
        { title: 'Write a draft', body: 'Add a clear title and notes.' },
        { title: 'Publish safely', body: 'Check for private details.' },
      ],
    });
    expect(empty).toContain('lp-empty-guide');
    expect(empty).not.toMatch(/1\.\s*1\./);
  });

  it('renders /admin/dev/foundations specimen and interactive state gallery', () => {
    const html = renderFoundationsGalleryPage('light');
    expect(html).toContain('Design Foundations Gallery');
    expect(html).toContain('id="foundations-specimens"');
    expect(html).toContain('id="foundations-components"');
    expect(html).toContain('id="foundations-layout-preview"');
    expect(html).not.toMatch(/\sstyle="/i);
  });
});
