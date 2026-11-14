import { escapeHtml } from '../lib/html.js';

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableProps {
  id?: string;
  caption: string;
  columns: TableColumn[];
  rows: Array<Record<string, string>>;
  emptyMessage?: string;
  className?: string;
}

/**
 * Renders a semantic Table with caption and scoped column headers.
 */
export function renderTable(props: TableProps): string {
  const idAttr = props.id ? ` id="${escapeHtml(props.id)}"` : '';
  const classes = ['lp-table-wrap', props.className].filter(Boolean).join(' ');
  const headCells = props.columns.map((c) => `<th scope="col">${escapeHtml(c.label)}</th>`).join('');
  const bodyRows =
    props.rows.length > 0
      ? props.rows
          .map(
            (row) =>
              `<tr>${props.columns.map((c) => `<td>${escapeHtml(row[c.key] ?? '')}</td>`).join('')}</tr>`
          )
          .join('')
      : `<tr><td colspan="${Math.max(1, props.columns.length)}">${escapeHtml(props.emptyMessage ?? 'No items.')}</td></tr>`;

  return `<div class="${escapeHtml(classes)}"${idAttr}>
  <table class="lp-table">
    <caption>${escapeHtml(props.caption)}</caption>
    <thead><tr>${headCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</div>`;
}
