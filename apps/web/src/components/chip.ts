/**
 * §12.4 Standard Chip Abstraction (Finding 20261020-UI-04 [P1])
 *
 * Distinguishes navigation chips (<a>), interactive filter buttons (<button>),
 * and informational state chips (<span>) with solid and provisional (dashed) visual styling.
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export type ChipKind = 'facet' | 'status' | 'level' | 'filter';

export interface ChipOptions {
  label: string;
  kind?: ChipKind;
  href?: string;
  onclick?: string;
  selected?: boolean;
  provisional?: boolean;
  className?: string;
  id?: string;
}

export function renderChip(opts: ChipOptions): string {
  const {
    label,
    kind = 'facet',
    href,
    onclick,
    selected = false,
    provisional = false,
    className = '',
    id,
  } = opts;

  const classes = [
    'chip',
    `chip-${kind}`,
    selected ? 'active' : '',
    provisional ? 'chip-provisional chip-suggested' : '',
    className,
  ].filter(Boolean).join(' ');

  const idAttr = id ? ` id="${escapeHtml(id)}"` : '';
  const onclickAttr = onclick ? ` onclick="${escapeHtml(onclick)}"` : '';
  const text = escapeHtml(label);

  if (href) {
    const ariaCurrent = selected ? ' aria-current="page"' : '';
    return `<a href="${escapeHtml(href)}"${idAttr} class="${classes}"${ariaCurrent}${onclickAttr}>${text}</a>`;
  }

  if (onclick) {
    const ariaPressed = selected ? ' aria-pressed="true"' : ' aria-pressed="false"';
    return `<button type="button"${idAttr} class="${classes}"${ariaPressed}${onclickAttr}>${text}</button>`;
  }

  return `<span${idAttr} class="${classes}">${text}</span>`;
}
