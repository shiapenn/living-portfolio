import { loadConfig } from '@living-portfolio/config';
import { adaptDataSource, type WebDataClient } from '../../lib/data-source.js';
import { escapeHtml } from '../../lib/html.js';
import { renderAdminShell, renderPageTemplate } from '../../layouts/admin-shell.js';
import { renderListRow } from '../../primitives/index.js';
import {
  ensureBuiltinSettingsModulesRegistered,
  getSettingsModule,
  getSettingsModules,
  readModuleConfig,
  type SettingsModuleManifest,
  type SettingsRenderContext,
} from '../../settings/index.js';
import { SETTINGS_SCRIPT } from './settings-script.js';

/**
 * Pure HTML for the Settings index page (D-LAYOUT #10 & D-SETTINGS-ARCH).
 * Built dynamically from the registered settings modules.
 */
export function renderSettingsIndexPage(
  settings: Record<string, unknown>,
  config: Record<string, unknown>,
  providers: Array<{ id?: string; name?: string; model?: string; enabled?: boolean; capabilities?: string[] }> = []
): string {
  ensureBuiltinSettingsModulesRegistered();
  const ctx: SettingsRenderContext = { settings, config, providers };
  const modules = getSettingsModules();

  const rowsHtml = modules
    .map((mod) => {
      const modCfg = readModuleConfig(mod, settings);
      const statusText = mod.status(modCfg, ctx);
      return renderListRow({
        id: `settings-row-${mod.id}`,
        href: mod.route,
        primary: mod.title,
        secondary: mod.summary,
        stateLabel: statusText,
        stateTone: statusText === 'Not set up' || statusText === 'Paused' ? 'neutral' : 'ok',
      });
    })
    .join('');

  const bodyHtml = `
    <section aria-label="Settings areas">
      <div class="lp-list">${rowsHtml}</div>
    </section>
    <p class="lp-help-text" data-banner="alpha-warning" role="note">Early preview software. Back up your data before upgrading.</p>
  `;

  return renderPageTemplate({
    title: 'Settings',
    description: 'Configure answering, providers, appearance, notifications, and backups.',
    bodyHtml,
  });
}

/**
 * Pure HTML for a single Settings module page (/admin/settings/<id>).
 */
export function renderSettingsModulePage<T>(
  mod: SettingsModuleManifest<T>,
  modConfig: T,
  ctx: SettingsRenderContext
): string {
  const backHtml = `<a href="/admin/settings" class="lp-btn lp-btn-quiet lp-btn-sm">All settings</a>`;
  const bodyHtml = `${mod.render(modConfig, ctx)}${SETTINGS_SCRIPT}`;
  return renderPageTemplate({
    title: mod.title,
    description: mod.summary,
    actionsHtml: backHtml,
    bodyHtml,
  });
}

export async function renderAdminSettingsPage(repo: WebDataClient): Promise<string> {
  repo = adaptDataSource(repo);
  const cfg = loadConfig();
  const settings = ((await repo.settings?.get?.()) ?? {}) as Record<string, unknown>;
  const providersRes = (await (repo as any).system?.getProviders?.()) ?? { providers: [] };
  const providers = (providersRes as any).providers ?? [];
  const answeringOn = typeof settings.answering_enabled === 'boolean' ? settings.answering_enabled : true;

  const content = renderSettingsIndexPage(settings, cfg as unknown as Record<string, unknown>, providers);
  return renderAdminShell('Settings', '/admin/settings', content, {
    answeringEnabled: answeringOn,
    siteName: cfg.PUBLIC_SITE_NAME,
  });
}

export async function renderAdminSettingsModulePage(
  repo: WebDataClient,
  moduleId: string
): Promise<string | null> {
  ensureBuiltinSettingsModulesRegistered();
  const mod = getSettingsModule(moduleId);
  if (!mod) return null;

  repo = adaptDataSource(repo);
  const cfg = loadConfig();
  const settings = ((await repo.settings?.get?.()) ?? {}) as Record<string, unknown>;
  const providersRes = (await (repo as any).system?.getProviders?.()) ?? { providers: [] };
  const providers = (providersRes as any).providers ?? [];
  const answeringOn = typeof settings.answering_enabled === 'boolean' ? settings.answering_enabled : true;

  const ctx: SettingsRenderContext = {
    settings,
    config: cfg as unknown as Record<string, unknown>,
    providers,
  };
  const modCfg = readModuleConfig(mod, settings);
  const content = renderSettingsModulePage(mod, modCfg, ctx);
  return renderAdminShell(`${mod.title} — Settings`, mod.route, content, {
    answeringEnabled: answeringOn,
    siteName: cfg.PUBLIC_SITE_NAME,
  });
}

export function renderAdminSettingsNotice(message: string): string {
  return `<div class="lp-notice lp-notice-warn" role="alert">${escapeHtml(message)}</div>`;
}
