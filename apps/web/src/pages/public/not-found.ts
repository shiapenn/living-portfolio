import { escapeHtml } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";

export function renderNotFoundPage(
  message?: string,
  activePath: string = '/'
): string {
  const content = `
    <div class="empty-state" style="padding:48px 16px;text-align:center;max-width:640px;margin:40px auto">
      <h1 style="font-family:var(--font-reading);font-size:32px;margin:0 0 12px 0">404 — Page Not Found</h1>
      <p style="color:var(--text-muted);font-size:16px;margin:0 0 24px 0">
        ${escapeHtml(message || 'The page or record you requested does not exist or may have been moved.')}
      </p>
      <div style="margin-bottom:28px">
        <form action="/ask" method="GET" style="display:flex;gap:8px;max-width:440px;margin:0 auto">
          <input type="text" name="q" class="ask-input" placeholder="Search records or ask a question..." aria-label="Search records" style="flex:1" required />
          <button type="submit" class="btn">Search</button>
        </form>
      </div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="/work" class="btn btn-secondary">Explore Work</a>
        <a href="/writing" class="btn btn-secondary">Browse Writing</a>
        <a href="/timeline" class="btn btn-secondary">View Timeline</a>
        <a href="/ask" class="btn">Ask Questions</a>
      </div>
    </div>
  `;
  return renderLayout('404 — Page Not Found', activePath, content);
}
