import type { z } from '@living-portfolio/core';

export interface SettingsRenderContext {
  settings: Record<string, unknown>;
  config: Record<string, unknown>;
  providers?: Array<{ id?: string; name?: string; model?: string; enabled?: boolean; capabilities?: string[] }>;
}

export interface SettingsExplainBlock {
  what: string;
  when: string;
  how: string;
  impact: string;
}

export interface SettingsModuleManifest<TConfig = Record<string, unknown>> {
  id: string;
  title: string;
  summary: string;
  icon: string;
  order: number;
  route: string;
  version: number;
  defaults: TConfig;
  schema: z.ZodType<TConfig>;
  explain?: SettingsExplainBlock;
  status: (config: TConfig, ctx?: SettingsRenderContext) => string;
  render: (config: TConfig, ctx: SettingsRenderContext) => string;
  migrate?: (raw: unknown, fromVersion: number) => TConfig;
}

const modules = new Map<string, SettingsModuleManifest<any>>();

/**
 * Register a self-contained settings module manifest (D-SETTINGS-ARCH).
 */
export function registerSettingsModule<TConfig>(manifest: SettingsModuleManifest<TConfig>): void {
  modules.set(manifest.id, manifest);
}

/**
 * Return all registered settings modules sorted by `order` then `title`.
 */
export function getSettingsModules(): SettingsModuleManifest<any>[] {
  return Array.from(modules.values()).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

/**
 * Look up a registered settings module by its id.
 */
export function getSettingsModule(id: string): SettingsModuleManifest<any> | undefined {
  return modules.get(id);
}

/**
 * Unregister a settings module (intended for isolated unit tests).
 */
export function unregisterSettingsModule(id: string): void {
  modules.delete(id);
}
