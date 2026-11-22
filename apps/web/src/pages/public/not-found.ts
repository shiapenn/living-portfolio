import { escapeHtml } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";

export function renderNotFoundPage(
  message?: string,
  activePath: string = '/'
): string {
  const content = `
    <div class="empty-state" style="padding:var(--lp-size-48) var(--lp-space-16);text-align:center;max-width:var(--lp-size-640);margin:var(--lp-space-40) auto">
      <h1 style="font-family:var(--font-reading);font-size:var(--lp-size-32);margin:0 0 var(--lp-space-12) 0">404 — Page Not Found</h1>
      <p style="color:var(--text-muted);font-size:var(--lp-space-16);margin:0 0 var(--lp-space-24) 0">
        ${escapeHtml(message || 'The page or record you requested does not exist or may have been moved.')}
      </p>
      <div style="margin-bottom:var(--lp-size-28)">
        <form action="/ask" method="GET" style="display:flex;gap:var(--lp-space-8);max-width:var(--lp-size-440);margin:0 auto">
          <input type="text" name="q" class="ask-input" placeholder="Search records or ask a question..." aria-label="Search records" style="flex:1" required />
          <button type="submit" class="btn">Search</button>
        </form>
      </div>
      <div style="display:flex;gap:var(--lp-space-12);justify-content:center;flex-wrap:wrap">
        <a href="/work" class="btn btn-secondary">Explore Work</a>
        <a href="/writing" class="btn btn-secondary">Browse Writing</a>
        <a href="/timeline" class="btn btn-secondary">View Timeline</a>
        <a href="/ask" class="btn">Ask Questions</a>
      </div>
    </div>
  `;
  return renderLayout('404 — Page Not Found', activePath, content);
}
