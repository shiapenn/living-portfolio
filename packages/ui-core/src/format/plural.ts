/**
 * Formats a count with a singular or plural noun (ADR-024 / WP-18.10 V13).
 * Examples:
 * - pluralize(1, 'entry', 'entries') -> '1 entry'
 * - pluralize(3, 'entry', 'entries') -> '3 entries'
 * - pluralize(0, 'file') -> '0 files'
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const n = Number.isFinite(count) ? count : 0;
  const word = n === 1 ? singular : (plural ?? `${singular}s`);
  return `${n} ${word}`;
}

/**
 * Inline browser-safe snippet exposing `lpPluralize(count, singular, plural)`
 * matching `pluralize` without duplicating pluralisation rules in client scripts.
 */
export const ADMIN_PLURAL_HELPER_SCRIPT = `
var lpPluralize = function (count, singular, plural) {
  var n = Number(count);
  if (!isFinite(n)) n = 0;
  var word = n === 1 ? singular : (plural || (singular + 's'));
  return n + ' ' + word;
};`;
