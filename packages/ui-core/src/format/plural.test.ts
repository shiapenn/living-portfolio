import { describe, it, expect } from 'vitest';
import { pluralize, ADMIN_PLURAL_HELPER_SCRIPT } from './plural.js';

describe('pluralize (WP-18.10 V13)', () => {
  it('formats singular and plural counts cleanly', () => {
    expect(pluralize(1, 'entry', 'entries')).toBe('1 entry');
    expect(pluralize(0, 'entry', 'entries')).toBe('0 entries');
    expect(pluralize(3, 'entry', 'entries')).toBe('3 entries');
    expect(pluralize(1, 'file')).toBe('1 file');
    expect(pluralize(2, 'file')).toBe('2 files');
    expect(pluralize(1, 'unused file', 'unused files')).toBe('1 unused file');
    expect(pluralize(4, 'unused file', 'unused files')).toBe('4 unused files');
  });

  it('matches browser snippet behaviour', () => {
    const fn = new Function(`${ADMIN_PLURAL_HELPER_SCRIPT}\nreturn lpPluralize;`)() as typeof pluralize;
    expect(fn(1, 'entry', 'entries')).toBe('1 entry');
    expect(fn(2, 'entry', 'entries')).toBe('2 entries');
    expect(fn(1, 'file')).toBe('1 file');
    expect(fn(5, 'file')).toBe('5 files');
  });
});
