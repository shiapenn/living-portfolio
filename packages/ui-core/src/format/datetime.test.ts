import { describe, expect, it } from 'vitest';
import { formatAdminDate, formatAdminDateTime } from './datetime.js';

describe('ui-core datetime formatter (A8)', () => {
  it('formats date as "25 Nov 2026" without ISO hyphens', () => {
    const d = new Date(2026, 10, 25, 14, 29, 45);
    expect(formatAdminDate(d)).toBe('25 Nov 2026');
    expect(formatAdminDate(d)).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });

  it('formats date and time as "25 Nov 2026, 14:29" (local TZ, no seconds)', () => {
    const d = new Date(2026, 10, 25, 14, 29, 45);
    expect(formatAdminDateTime(d)).toBe('25 Nov 2026, 14:29');
    expect(formatAdminDateTime(new Date(2026, 0, 5, 8, 4, 59))).toBe('5 Jan 2026, 08:04');
  });

  it('returns empty string for invalid or nullish input', () => {
    expect(formatAdminDate(null)).toBe('');
    expect(formatAdminDate(undefined)).toBe('');
    expect(formatAdminDateTime('not-a-date')).toBe('');
  });
});
