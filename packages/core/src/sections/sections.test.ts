import { describe, it, expect } from 'vitest';
import { BUILTIN_PROFILES } from '../profiles/index.js';
import { resolveEntrySection, groupProfilesBySection } from './index.js';

describe('D-LAYOUT #13 entry type to section mapping', () => {
  it('maps case-study, design-project, and decision-record to Work', () => {
    expect(resolveEntrySection('case-study', { slug: 'my-case' })).toEqual({
      id: 'work',
      label: 'Work',
      basePath: '/work',
      url: '/work/my-case',
    });
    expect(resolveEntrySection('design-project').id).toBe('work');
    expect(resolveEntrySection('decision-record').id).toBe('work');
  });

  it('maps freeform and unmapped types (research-note, how-to, unknown) to Writing', () => {
    expect(resolveEntrySection('freeform', { slug: 'essay' }).url).toBe('/writing/essay');
    expect(resolveEntrySection('research-note').id).toBe('writing');
    expect(resolveEntrySection('how-to').id).toBe('writing');
    expect(resolveEntrySection('unknown-type').id).toBe('writing');
  });

  it('maps dev-log to Build', () => {
    expect(resolveEntrySection('dev-log', { slug: 'v1', hasVenture: true })).toEqual({
      id: 'build',
      label: 'Build',
      basePath: '/build',
      url: '/build/v1',
    });
  });

  it('groups built-in profiles by section', () => {
    const groups = groupProfilesBySection(Object.values(BUILTIN_PROFILES));
    const work = groups.find((g) => g.sectionId === 'work');
    const writing = groups.find((g) => g.sectionId === 'writing');
    expect(work?.profiles.map((p) => p.id)).toEqual(['case-study', 'decision-record', 'design-project']);
    expect(writing?.profiles.map((p) => p.id)).toEqual(['research-note', 'how-to', 'freeform']);
  });
});
