/**
 * Shared owner-facing copy formatters (D-CONTRACT-1, D-FEEDBACK, D-HELP).
 * Single source of truth for counts, plurals, titles-with-counts, and actionable errors.
 */

export function formatPlural(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

export function formatCount(count: number, singular: string, plural?: string): string {
  return `${count} ${formatPlural(count, singular, plural)}`;
}

export function formatTitleWithCount(
  title: string,
  count: number,
  singular: string,
  plural?: string,
): string {
  return `${title} (${formatCount(count, singular, plural)})`;
}

export interface ActionableErrorInput {
  status?: number;
  message?: string;
  action?: string;
  fix?: string;
}

export function formatActionableError(input: ActionableErrorInput): string {
  const { status, message, action, fix } = input;
  if (!status || status === 0) {
    return fix
      ? `Could not reach the server. ${fix}`
      : 'Could not reach the server. Check your connection and try again.';
  }
  if (status === 401) {
    return 'Your session has expired. Sign in again to continue.';
  }
  if (status === 403) {
    return "You don't have permission to perform this action. Sign in as the site owner.";
  }
  if (status === 404) {
    return 'This item could not be found. Refresh the list and try again.';
  }
  if (status >= 500) {
    return action
      ? `Could not ${action}. Wait a moment and try again.`
      : 'The server encountered a problem. Wait a moment and try again.';
  }
  const cleanMessage = (message ?? '').trim();
  if (cleanMessage) {
    return fix && !cleanMessage.includes(fix) ? `${cleanMessage} ${fix}` : cleanMessage;
  }
  return action
    ? `Could not ${action}. Check your input and try again.`
    : 'Something went wrong. Check your input and try again.';
}
