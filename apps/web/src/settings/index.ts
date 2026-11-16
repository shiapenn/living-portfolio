import { registerSettingsModule } from './registry.js';
import { answeringModule } from './modules/answering.js';
import { providersModule } from './modules/providers.js';
import { appearanceModule } from './modules/appearance.js';
import { notificationsModule } from './modules/notifications.js';
import { backupsModule } from './modules/backups.js';

export {
  registerSettingsModule,
  getSettingsModules,
  getSettingsModule,
  unregisterSettingsModule,
  type SettingsModuleManifest,
  type SettingsRenderContext,
} from './registry.js';
export { readModuleConfig, writeModuleConfig, type ModuleConfigEnvelope } from './service.js';
export {
  BUILTIN_THEME_PACKS,
  ThemePackSchema,
  ThemePackTokensSchema,
  validateThemePack,
  contrastRatio,
  type ThemePack,
} from './theme-packs.js';

let initialized = false;

export function ensureBuiltinSettingsModulesRegistered(): void {
  if (initialized) return;
  initialized = true;
  registerSettingsModule(answeringModule);
  registerSettingsModule(providersModule);
  registerSettingsModule(appearanceModule);
  registerSettingsModule(notificationsModule);
  registerSettingsModule(backupsModule);
}

ensureBuiltinSettingsModulesRegistered();
