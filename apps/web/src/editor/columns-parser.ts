/**
 * Linear O(n) parser helpers for `:::columns{cols=2..4}` and nested `:::column` directives.
 * Shared by both the Tiptap Markdown bridge and the public Markdown renderer.
 */

export function parseColumnsHeader(line: string): { cols: 2 | 3 | 4 } | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith(':::columns')) return null;
  const rest = trimmed.slice(':::columns'.length).trim();
  if (!rest) return { cols: 2 };
  if (!rest.startsWith('{') || !rest.endsWith('}')) return null;
  const inner = rest.slice(1, -1).trim();
  // Accept cols=2, cols="2", cols=3, cols=4 (clamped to 2..4)
  const idx = inner.indexOf('cols=');
  if (idx === -1) return { cols: 2 };
  let p = idx + 5;
  if (p < inner.length && (inner[p] === '"' || inner[p] === "'")) p++;
  let numStr = '';
  while (p < inner.length && inner.charCodeAt(p) >= 48 && inner.charCodeAt(p) <= 57) {
    numStr += inner[p];
    p++;
  }
  const n = Number.parseInt(numStr, 10);
  if (n === 3) return { cols: 3 };
  if (n === 4) return { cols: 4 };
  return { cols: 2 };
}

/**
 * Given the lines strictly inside a `:::columns{...}` ... `:::` block,
 * splits them into top-level `:::column` ... `:::` sections, preserving nested `:::` directives.
 */
export function splitColumnsDirectiveLines(innerLines: string[]): string[][] {
  const columns: string[][] = [];
  let i = 0;

  while (i < innerLines.length) {
    const trimmed = innerLines[i].trim();
    if (trimmed === ':::column') {
      const colLines: string[] = [];
      let depth = 1;
      i++;
      while (i < innerLines.length && depth > 0) {
        const cur = innerLines[i];
        const curTrim = cur.trim();
        if (curTrim === ':::') {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
          colLines.push(cur);
        } else if (curTrim.startsWith(':::')) {
          depth++;
          colLines.push(cur);
        } else {
          colLines.push(cur);
        }
        i++;
      }
      columns.push(colLines);
      continue;
    }
    i++;
  }

  return columns;
}

/**
 * Consumes a balanced `:::` container directive starting at `startIdx`,
 * returning `{ rawLines, nextIdx }`.
 */
export function consumeContainerDirective(
  lines: string[],
  startIdx: number
): { rawLines: string[]; nextIdx: number } {
  const rawLines: string[] = [lines[startIdx]];
  let depth = 1;
  let i = startIdx + 1;
  while (i < lines.length && depth > 0) {
    const cur = lines[i];
    const curTrim = cur.trim();
    rawLines.push(cur);
    if (curTrim === ':::') {
      depth--;
    } else if (curTrim.startsWith(':::')) {
      depth++;
    }
    i++;
  }
  return { rawLines, nextIdx: i };
}

/**
 * Renders a `:::columns{cols=2..4}` container directive to HTML using the supplied block renderer.
 */
export function renderColumnsDirective(
  lines: string[],
  startIdx: number,
  renderInner: (md: string) => string
): { html: string; nextIdx: number } | null {
  const colsHeader = parseColumnsHeader(lines[startIdx]);
  if (!colsHeader) return null;
  const { rawLines, nextIdx } = consumeContainerDirective(lines, startIdx);
  const inner = rawLines.slice(1, rawLines[rawLines.length - 1].trim() === ':::' ? -1 : undefined);
  const colSections = splitColumnsDirectiveLines(inner);
  if (colSections.length === 0) return null;
  const colsHtml = colSections
    .map((colLines) => `<div class="pub-column">${renderInner(colLines.join('\n'))}</div>`)
    .join('');
  return {
    html: `<div class="pub-columns" data-cols="${colsHeader.cols}" data-pub-columns="true">${colsHtml}</div>`,
    nextIdx,
  };
}
