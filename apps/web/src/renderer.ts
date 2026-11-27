/**
 * Compatibility barrel for @living-portfolio/web renderer.
 * Mechanically split into per-page modules in WP-15.1.
 */
export const ALPHA_WARNING_TEXT =
  "Alpha version with known defects. Do not use in production or input real sensitive data.";

export { adaptDataSource, type WebDataClient } from "./lib/data-source.js";
export {
  sanitizeHttpUrl,
  renderMarkdownToHtml,
  parseAsOfDate,
  type AsOfDateInfo,
} from "./lib/html.js";
export { renderLayout, type RenderLayoutOptions } from "./layouts/public-shell.js";
export { renderAdminShell, type AdminShellOptions } from "./layouts/admin-shell.js";
export { renderAdminSectionPage } from "./pages/admin/section-page.js";
export { renderAdminDashboardPage, type DashboardOptions } from "./pages/admin/dashboard.js";
export { renderAdminEntriesListPage, type EntriesListOptions } from "./pages/admin/entries/list.js";
export { renderStrataTimelineSection } from "./components/strata-timeline.js";
export { renderHomePage } from "./pages/public/home.js";
export { renderEntryDetailPage } from "./pages/public/entry.js";
export { renderWorkOrWritingPage } from "./pages/public/entries-index.js";
export { renderNotFoundPage } from "./pages/public/not-found.js";
export { renderBuildVenturePage, renderBuildPage } from "./pages/public/build.js";
export { renderTimelinePage } from "./pages/public/timeline.js";
export { renderAskPage } from "./pages/public/ask.js";
export { renderStaticPage } from "./pages/public/static.js";
export { renderBookPage } from "./pages/public/book.js";
export { renderAskStatusPage } from "./pages/public/ask-status.js";
export {
  ADMIN_API_CLIENT_SCRIPT,
  type AdminSettingsState,
} from "./lib/admin-api-client.js";
export {
  renderAdminEntriesPage,
  renderDedicatedEditorPage,
  renderReferenceEditorPage,
  type ReferenceEditorEntry,
  type ReferenceEditorOptions,
} from "./pages/admin/entries/editor.js";
export { renderEntryHistoryPage } from "./pages/admin/entries/history.js";
export { renderAdminInboxPage } from "./pages/admin/inbox.js";
export { renderAdminAuditRulesPage } from "./pages/admin/audit.js";
export { renderAdminCalibrationPage } from "./pages/admin/calibration.js";
export { renderAdminStructurePage } from "./pages/admin/structure.js";
export { renderAdminBookingsPage, renderAdminBookingDetailPage } from "./pages/admin/bookings.js";
export { renderAdminVenturesPage } from "./pages/admin/ventures.js";
export { renderAdminPagesEditorPage } from "./pages/admin/pages.js";
export { renderAdminSettingsPage, renderAdminSettingsModulePage } from "./pages/admin/settings.js";
export { renderAdminLoginPage } from "./pages/admin/login.js";
export { renderAdminSetupPage } from "./pages/admin/setup.js";
export { renderAdminImportPage } from "./pages/admin/import.js";
export { renderAdminStatusPage, type StatusPageOptions } from "./pages/admin/status.js";
export { renderAdminQuickLogPage } from './pages/admin/quick-log.js';
