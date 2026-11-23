import { escapeHtml } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";

export function renderNotFoundPage(
  message?: string,
  activePath: string = '/'
): string {
  const content = `
    <div class="empty-state" style="padding:var(--lp-space-inset-hero-y) var(--lp-space-inset-section);text-align:center;max-width:var(--lp-size-layout-reading-col);margin:var(--lp-space-stack-section) auto">
      <h1 style="font-family:var(--lp-font-family-reading);font-size:var(--lp-font-size-32);margin:0 0 var(--lp-space-stack-snug) 0">404 — Page Not Found</h1>
      <p style="color:var(--text-muted);font-size:var(--lp-font-size-16);margin:0 0 var(--lp-space-stack-group) 0">
        ${escapeHtml(message || 'The page or record you requested does not exist or may have been moved.')}
      </p>
      <div style="margin-bottom:var(--lp-space-stack-display)">
        <form action="/ask" method="GET" style="display:flex;gap:var(--lp-space-stack-label-to-control);max-width:var(--lp-size-form-compact-max);margin:0 auto">
          <input type="text" name="q" class="ask-input" placeholder="Search records or ask a question..." aria-label="Search records" style="flex:1" required />
          <button type="submit" class="btn">Search</button>
        </form>
      </div>
      <div style="display:flex;gap:var(--lp-space-stack-snug);justify-content:center;flex-wrap:wrap">
        <a href="/work" class="btn btn-secondary">Explore Work</a>
        <a href="/writing" class="btn btn-secondary">Browse Writing</a>
        <a href="/timeline" class="btn btn-secondary">View Timeline</a>
        <a href="/ask" class="btn">Ask Questions</a>
      </div>
    </div>
  `;
  return renderLayout('404 — Page Not Found', activePath, content);
}
