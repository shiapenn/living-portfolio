/**
 * Living Portfolio String Architecture & Canonical Catalogue (§12.6, §12.8, Finding 20261020-CP-06)
 *
 * Implements:
 * 1. Date localization via Intl.DateTimeFormat (Month Year formatting, e.g. "March 2024").
 * 2. Proper pluralization via Intl.PluralRules and ICU message formatting (eliminating hand-coded 's').
 * 3. Canonical string catalogue for Ask flow states, Timeline, Navigation, and Actionable Errors.
 * 4. Three-part actionable error formatting: what failed, why (if known), and what to do now.
 */

export {
  WIZARD_STRINGS,
  EDITOR_STRINGS,
  EDITOR_HELP,
  STRINGS,
  formatCount,
  formatTitleWithCount,
} from './strings/en.js';

export const STRINGS_EN = {
  ask: {
    state: {
      tier1: {
        title: "Automated answer from the owner's records",
        label: "Automated answer from the owner's records",
      },
      tier2: {
        title: "This needs the owner's review. Typical reply within 24 hours.",
        label: "This needs the owner's review. Typical reply within 24 hours.",
        answer: "This needs the owner's review. Typical reply within 24 hours.",
        promise: "Typical reply within 24 hours.",
      },
      tier3: {
        title: "This is better as a conversation.",
        label: "This is better as a conversation.",
        answer: "This is better as a conversation. Your situation has details my past work doesn't cover.",
      },
      extractive: {
        title: "Showing excerpts from the owner's records. Automated answers are paused for now.",
        label: "Showing excerpts from the owner's records. Automated answers are paused for now.",
        answer: "Showing excerpts from the owner's records. Automated answers are paused for now.",
      },
      no_match: {
        title: "That isn't in these records.",
        label: "That isn't in these records.",
        answer: "That isn't in these records. You can ask the owner or book a conversation.",
      },
      disabled: {
        title: "Automated answers are off.",
        label: "Automated answers are off.",
        answer: "Automated answers are off right now. You can book a conversation or send the owner a message.",
      },
      needs_context: {
        title: "A few details will help me check this against my experience. Skip any you don't know.",
        label: "A few details will help me check this against my experience. Skip any you don't know.",
        prompt: "To advise accurately on this question, please provide the following details about your architecture or environment:",
      },
      rate_limited: {
        title: "Hourly question limit reached",
        label: "Hourly question limit reached",
        answer: "Hourly question limit reached. You've reached the limit of questions per hour. Try again in {minutes} minutes, or book a conversation.",
      },
      invalid_query: {
        title: "Type a question to ask",
        label: "Type a question to ask",
        answer: "Type a question to ask. It can be up to 1000 characters.",
      },
      server_error: {
        title: "Can't reach the server",
        label: "Can't reach the server",
        answer: "Can't reach the server, so answers aren't available right now. Try again in a minute, or book a conversation.",
      },
    },
  },
  timeline: {
    heading: "Timeline, {firstYear} to now",
    subtitle: "Pick a month to see this site as it was then.",
    asOf: "As of",
    view: "View",
    viewingAsOf: "Viewing as of {monthYear}. Entries written later are hidden.",
    backToToday: "Back to today",
    listAlternative: "Timeline as a list",
  },
  errors: {
    unauthorized: {
      action: "You're signed out",
      recovery: "Sign in to continue.",
    },
    forbidden_csrf: {
      action: "Security check failed",
      reason: "Your session expired",
      recovery: "Reload the page and sign in again.",
    },
    validation_failed: {
      action: "Couldn't save entry",
      reason: "Check this entry for missing or invalid details",
      recovery: "Fix the highlighted fields and retry.",
    },
    rate_limited: {
      action: "Too many sign-in attempts",
      recovery: "Try again in {minutes} minutes.",
    },
    server_error: {
      action: "Can't reach the server",
      reason: "Answers aren't available right now",
      recovery: "Try again in a minute, or book a conversation.",
    },
  },
} as const;

/**
 * Formats an ISO date slice or timestamp into human-readable "Month Year" (e.g. "March 2024").
 */
export function formatMonthYear(
  dateInput: string | Date | null | undefined,
  locale = 'en-US'
): string {
  if (!dateInput) return '';
  try {
    let d: Date;
    if (typeof dateInput === 'string') {
      const parts = dateInput.split(/[-T\s]/);
      const year = parseInt(parts[0], 10);
      const month = parts.length > 1 ? parseInt(parts[1], 10) - 1 : 0;
      const day = parts.length > 2 ? parseInt(parts[2], 10) : 1;
      d = new Date(Date.UTC(year, month, day));
    } else {
      d = dateInput;
    }
    if (isNaN(d.getTime())) return String(dateInput).slice(0, 7);
    return new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(d);
  } catch {
    return String(dateInput).slice(0, 7);
  }
}

/**
 * Formats a full date into "Month Day, Year" (e.g. "March 15, 2024").
 */
export function formatFullDate(
  dateInput: string | Date | null | undefined,
  locale = 'en-US'
): string {
  if (!dateInput) return '';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput).slice(0, 10);
    return new Intl.DateTimeFormat(locale, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(d);
  } catch {
    return String(dateInput).slice(0, 10);
  }
}

/**
 * Formats the canonical entry date line according to Spec §12.6 and audit finding 20261020-CP-06.
 *
 * Example outputs:
 * - "Happened March 2024. Written September 2026, looking back." (hindsight)
 * - "Happened March 2024. Written September 2026." (revision / delay)
 * - "Written October 2026." (concurrent)
 */
export function formatEntryDateLine(
  happenedIso?: string | null,
  writtenIso?: string | null,
  isHindsight?: boolean,
  locale = 'en-US'
): string {
  const happened = happenedIso ? formatMonthYear(happenedIso, locale) : '';
  const written = writtenIso ? formatMonthYear(writtenIso, locale) : '';

  if (!happened && !written) return '';
  if (!happened) return `Written ${written}.`;
  if (!written) return `Happened ${happened}.`;

  const happenedYm = happenedIso?.slice(0, 7);
  const writtenYm = writtenIso?.slice(0, 7);

  if (happenedYm !== writtenYm || isHindsight) {
    return `Happened ${happened}. Written ${written}${isHindsight ? ', looking back' : ''}.`;
  }
  return `Written ${written}.`;
}

/**
 * Formats proper plurals using Intl.PluralRules (eliminating hand-coded `s` checks).
 */
export function formatPlural(
  count: number,
  singular: string,
  plural: string,
  includeCount = true,
  locale = 'en-US'
): string {
  const pr = new Intl.PluralRules(locale);
  const rule = pr.select(count);
  const word = rule === 'one' ? singular : plural;
  return includeCount ? `${count} ${word}` : word;
}

/**
 * Interpolates ICU-style template strings with variable replacement and plural rules.
 * Supports:
 * - Simple parameters: `{name}`
 * - Plural syntax: `{count, plural, one {# entry} other {# entries}}`
 */
export function formatIcu(
  template: string,
  params: Record<string, string | number>,
  locale = 'en-US'
): string {
  let result = '';
  let i = 0;
  while (i < template.length) {
    if (template[i] === '{') {
      const close = template.indexOf('}', i);
      if (close !== -1) {
        const fullToken = template.slice(i, close + 1);
        if (fullToken.includes(', plural,') || fullToken.includes(',plural,')) {
          // Find the outer closing brace for the plural block
          const outerClose = template.indexOf('}}', i);
          if (outerClose !== -1) {
            const block = template.slice(i + 1, outerClose + 1);
            const comma1 = block.indexOf(',');
            const varName = comma1 !== -1 ? block.slice(0, comma1).trim() : '';
            const rest = comma1 !== -1 ? block.slice(comma1 + 1) : '';
            
            // Extract one {...} and other {...} deterministically without backtracking
            let oneVal = '';
            let otherVal = '';
            const oneIdx = rest.indexOf('one');
            if (oneIdx !== -1) {
              const oneOpen = rest.indexOf('{', oneIdx);
              const oneClose = rest.indexOf('}', oneOpen);
              if (oneOpen !== -1 && oneClose !== -1) {
                oneVal = rest.slice(oneOpen + 1, oneClose);
              }
            }
            const otherIdx = rest.indexOf('other');
            if (otherIdx !== -1) {
              const otherOpen = rest.indexOf('{', otherIdx);
              const otherClose = rest.indexOf('}', otherOpen);
              if (otherOpen !== -1 && otherClose !== -1) {
                otherVal = rest.slice(otherOpen + 1, otherClose);
              }
            }

            const n = Number(params[varName] ?? 0);
            const pr = new Intl.PluralRules(locale);
            const chosen = pr.select(n) === 'one' ? oneVal : otherVal;
            result += chosen.split('#').join(String(n));
            i = outerClose + 2;
            continue;
          }
        } else {
          const varName = fullToken.slice(1, -1).trim();
          if (varName in params) {
            result += String(params[varName]);
            i = close + 1;
            continue;
          }
        }
      }
    }
    result += template[i];
    i++;
  }
  return result;
}

/**
 * Formats a user-facing actionable error adhering to the three-part pattern:
 * 1. What failed
 * 2. Why (if known and useful)
 * 3. What to do now (actionable recovery step)
 */
export function formatActionableError(options: {
  action: string;
  reason?: string;
  recovery: string;
}): string {
  const parts = [options.action];
  if (options.reason) {
    parts.push(options.reason);
  }
  parts.push(options.recovery);
  return parts
    .map((p) => p.trim())
    .join('. ')
    .replace(/\.\./g, '.')
    .replace(/\.\s*\.$/, '.');
}
