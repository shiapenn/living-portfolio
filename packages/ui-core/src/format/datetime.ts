const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function toValidDate(input: Date | string | number | null | undefined): Date | null {
  if (input === null || input === undefined || input === '') return null;
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a date in the viewer's local timezone as "25 Nov 2026".
 * Returns empty string for invalid/missing input.
 */
export function formatAdminDate(input: Date | string | number | null | undefined): string {
  const d = toValidDate(input);
  if (!d) return '';
  const day = d.getDate();
  const month = SHORT_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Formats a date and time in the viewer's local timezone as "25 Nov 2026, 14:29" (24-hour, no seconds).
 * Returns empty string for invalid/missing input.
 */
export function formatAdminDateTime(input: Date | string | number | null | undefined): string {
  const d = toValidDate(input);
  if (!d) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatAdminDate(d)}, ${hh}:${mm}`;
}

/**
 * Inline browser-safe snippet exposing `window.lpFormatAdminDateTime(date)` and `window.lpFormatAdminDate(date)`
 * matching `formatAdminDateTime` / `formatAdminDate` exactly without duplicating month/format logic.
 */
export const ADMIN_DATETIME_FORMATTER_SCRIPT = `
var lpFormatAdminDate = function (input) {
  var d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '';
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
};
var lpFormatAdminDateTime = function (input) {
  var d = input instanceof Date ? input : new Date(input);
  if (isNaN(d.getTime())) return '';
  var hh = String(d.getHours()).padStart(2, '0');
  var mm = String(d.getMinutes()).padStart(2, '0');
  return lpFormatAdminDate(d) + ', ' + hh + ':' + mm;
};`;
