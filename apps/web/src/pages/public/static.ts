import { loadConfig } from "@living-portfolio/config";
import { escapeHtml } from "../../lib/html.js";
import { renderLayout } from "../../layouts/public-shell.js";
import { renderBookPage } from "./book.js";

export function renderStaticPage(page: 'now' | 'about' | 'uses' | 'book', queryParam?: string): string {
  if (page === 'now') {
    return renderLayout(
      'Now',
      '/now',
      `<div class="reading-column">
        <h1>What I'm focused on now</h1>
        <p class="neutral-empty-note"><em>Nothing here yet.</em></p>
      </div>`
    );
  }
  if (page === 'about') {
    const cfg = loadConfig();
    const forkNoticeHtml = cfg.PUBLIC_UNOFFICIAL_FORK_NOTICE
      ? `<p class="unofficial-fork-slot" data-slot="unofficial-fork-notice"><em>${escapeHtml(cfg.PUBLIC_UNOFFICIAL_FORK_NOTICE)}</em></p>`
      : '';
    return renderLayout(
      'About & Verified Credentials',
      '/about',
      `<div class="reading-column">
        <h1>About ${escapeHtml(cfg.PUBLIC_OWNER_NAME)}</h1>
        <p>${escapeHtml(cfg.PUBLIC_OWNER_BIO)}</p>
        ${forkNoticeHtml}
        <h2>Verified credentials</h2>
        <p>A badge appears only when it can be proved: signed commits checked against GitHub, or ownership of this domain.</p>
        <p class="neutral-empty-note"><em>Nothing has been verified yet.</em></p>
      </div>`
    );
  }
  if (page === 'uses') {
    return renderLayout(
      'Uses & Stack',
      '/uses',
      `<div class="reading-column">
        <h1>Tools &amp; Stack</h1>
        <p class="neutral-empty-note"><em>Instance stack information.</em></p>
      </div>`
    );
  }
  return renderBookPage(queryParam);
}
