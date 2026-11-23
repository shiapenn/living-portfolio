/**
 * D-M4 STATES.public Manifest
 * Covers all public routes across 3 viewports (320, 1280, 1920) x 2 themes (light, dark).
 * Runs ONLY core + public-only checks (never admin-only checks).
 */
import { THEMES, VIEWPORTS, type ThemeMode, type ViewportSpec } from './states-manifest.js';

export { THEMES, VIEWPORTS, type ThemeMode, type ViewportSpec };

export interface PublicStateDefinition {
  id: string;
  route: string;
  markerSelector: string;
  checkReadingMeasure?: boolean;
}

export const PUBLIC_STATES: readonly PublicStateDefinition[] = [
  { id: 'pub-home', route: '/', markerSelector: 'main#main-content' },
  { id: 'pub-work', route: '/work', markerSelector: 'main#main-content' },
  { id: 'pub-writing', route: '/writing', markerSelector: 'main#main-content' },
  { id: 'pub-build', route: '/build', markerSelector: 'main#main-content' },
  { id: 'pub-timeline', route: '/timeline', markerSelector: 'main#main-content' },
  { id: 'pub-ask', route: '/ask', markerSelector: 'main#main-content' },
  { id: 'pub-book', route: '/book', markerSelector: 'main#main-content' },
  { id: 'pub-about', route: '/about', markerSelector: 'main#main-content', checkReadingMeasure: true },
  { id: 'pub-now', route: '/now', markerSelector: 'main#main-content', checkReadingMeasure: true },
  { id: 'pub-uses', route: '/uses', markerSelector: 'main#main-content', checkReadingMeasure: true },
];
