import { escapeHtml } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";

export function renderNotFoundPage(
  message?: string,
  activePath: string = '/'
): string {
  const content = `
    <div class="empty-state pub-empty pub-prose">
      <h1 class="pub-m-0">404 — Page Not Found</h1>
      <p class="pub-muted pub-m-0">
        ${escapeHtml(message || 'The page or record you requested does not exist or may have been moved.')}
      </p>
      <div class="pub-mb-md">
        <form action="/ask" method="GET" class="pub-row pub-m-0">
          <input type="text" name="q" class="ask-input pub-flex-1" placeholder="Search records or ask a question..." aria-label="Search records" required />
          <button type="submit" class="btn">Search</button>
        </form>
      </div>
      <div class="pub-row">
        <a href="/work" class="btn btn-secondary">Explore Work</a>
        <a href="/writing" class="btn btn-secondary">Browse Writing</a>
        <a href="/timeline" class="btn btn-secondary">View Timeline</a>
        <a href="/ask" class="btn">Ask Questions</a>
      </div>
    </div>
  `;
  return renderLayout('404 — Page Not Found', activePath, content);
}
