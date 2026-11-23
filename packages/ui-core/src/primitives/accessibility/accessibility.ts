export function renderSkipLink(targetId = 'main-content', label = 'Skip to main content'): string {
  return `<a href="#${targetId}" class="lp-core-skip-link skip-link">${label}</a>`;
}

export function renderVisuallyHidden(text: string): string {
  return `<span class="lp-core-sr-only sr-only">${text}</span>`;
}
