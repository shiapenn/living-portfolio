/**
 * D-M4 / D-N3 STATES.public Manifest
 * Covers all 14 public routes and their states (including structured entry, Chinese sample,
 * as-of timeline, ask status, and 404) across 3 viewports (320, 1280, 1920) x 2 themes (light, dark).
 * Runs ONLY core + public-only checks (never admin-only checks).
 */
import { THEMES, VIEWPORTS, type ThemeMode, type ViewportSpec } from './states-manifest.js';

export { THEMES, VIEWPORTS, type ThemeMode, type ViewportSpec };

export interface PublicStateDefinition {
  id: string;
  route: string;
  markerSelector: string;
  checkReadingMeasure?: boolean;
  expectedStatus?: number;
}

export const PUBLIC_STATES: readonly PublicStateDefinition[] = [
  { id: 'pub-home', route: '/', markerSelector: 'main#main-content' },
  { id: 'pub-work', route: '/work', markerSelector: 'main#main-content' },
  { id: 'pub-work-entry', route: '/work/redis-distributed-locks-2021', markerSelector: 'article', checkReadingMeasure: true },
  { id: 'pub-work-entry-structured', route: '/work/redis-distributed-locks-2021?view=structured', markerSelector: 'article', checkReadingMeasure: true },
  { id: 'pub-work-entry-zh', route: '/work/redis-distributed-locks-2021?lang=zh', markerSelector: 'section[lang="zh"]', checkReadingMeasure: true },
  { id: 'pub-writing', route: '/writing', markerSelector: 'main#main-content' },
  { id: 'pub-build', route: '/build', markerSelector: 'main#main-content' },
  { id: 'pub-timeline', route: '/timeline', markerSelector: 'main#main-content' },
  { id: 'pub-timeline-asof', route: '/timeline?as_of=2023-06-01', markerSelector: 'main#main-content' },
  { id: 'pub-ask', route: '/ask', markerSelector: 'main#main-content' },
  { id: 'pub-ask-status', route: '/ask/status/demo-status-check', markerSelector: 'main#main-content' },
  { id: 'pub-book', route: '/book', markerSelector: 'main#main-content' },
  { id: 'pub-about', route: '/about', markerSelector: 'main#main-content', checkReadingMeasure: true },
  { id: 'pub-now', route: '/now', markerSelector: 'main#main-content', checkReadingMeasure: true },
  { id: 'pub-uses', route: '/uses', markerSelector: 'main#main-content', checkReadingMeasure: true },
  { id: 'pub-404', route: '/nonexistent-public-page', markerSelector: 'main#main-content', expectedStatus: 404 },
];
