export interface PublicCardOptions {
  title: string;
  bodyHtml: string;
  className?: string;
}

export function renderPublicCard(opts: PublicCardOptions): string {
  const cls = opts.className ? `pub-card ${opts.className}` : 'pub-card';
  return `<article class="${cls}" data-pub="Card"><h3>${opts.title}</h3>${opts.bodyHtml}</article>`;
}
