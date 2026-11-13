import { describe, it, expect } from 'vitest';
import { renderReferenceEditorPage } from './editor.js';
import { EDITOR_STRINGS, formatCount } from '../../../strings/admin/editor.js';

describe('WP-15.7 Reference Editor Page', () => {
  it('renders without inline styles, public nav/footer, or internal jargon', () => {
    const html = renderReferenceEditorPage({
      entries: [
        {
          id: 'entry-1',
          slug: 'architecture-notes',
          title: 'Architecture notes',
          body: 'Initial draft body.',
          visibility: 'draft',
          date: '2026-11-13',
          temporalConfidence: 'exact',
          profile: 'decision',
        },
      ],
      selectedId: 'entry-1',
      siteName: 'Living Portfolio',
    });

    // Zero inline styles
    expect(html).not.toMatch(/\sstyle="/i);

    // No public nav or footer, no unofficial fork notice, no Publish Now
    expect(html).not.toContain('unofficial fork');
    expect(html).not.toContain('Publish Now');
    expect(html).not.toContain('Signed preview token');
    expect(html).not.toContain('Enrichment pipeline');
    expect(html).not.toMatch(/\bL[0-3]\b/);

    // Only the 4 D-FEEDBACK places may carry role="status" or role="alert"
    const roleMatches = html.match(/role="(status|alert)"/g) ?? [];
    expect(roleMatches.length).toBeLessThanOrEqual(4);
  });

  it('provides single count/plural helper in strings catalogue', () => {
    expect(formatCount(0, 'entry', 'entries')).toBe('0 entries');
    expect(formatCount(1, 'entry', 'entries')).toBe('1 entry');
    expect(formatCount(3, 'entry', 'entries')).toBe('3 entries');
    expect(EDITOR_STRINGS.actions.saveDraft).toBe('Save draft');
  });
});
