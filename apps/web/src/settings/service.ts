import type { SettingsModuleManifest } from './registry.js';

export interface ModuleConfigEnvelope<T> {
  version: number;
  data: T;
}

/**
 * Read, migrate, and validate a module's namespaced configuration through one settings service (D-SETTINGS-ARCH).
 */
export function readModuleConfig<T>(
  manifest: SettingsModuleManifest<T>,
  allSettings: Record<string, unknown>
): T {
  const namespaced = allSettings[`module:${manifest.id}`] as Record<string, unknown> | undefined;
  const rawVersion = typeof namespaced?.version === 'number' ? namespaced.version : 0;
  const rawPayload = namespaced?.data ?? allSettings;

  let candidate: unknown = rawPayload;
  if (rawVersion > 0 && rawVersion < manifest.version && manifest.migrate) {
    candidate = manifest.migrate(rawPayload, rawVersion);
  }

  const parsed = manifest.schema.safeParse(candidate);
  if (parsed.success) {
    return parsed.data;
  }

  const merged =
    candidate && typeof candidate === 'object' && !Array.isArray(candidate)
      ? { ...(manifest.defaults as Record<string, unknown>), ...(candidate as Record<string, unknown>) }
      : manifest.defaults;

  const fallbackParsed = manifest.schema.safeParse(merged);
  return fallbackParsed.success ? fallbackParsed.data : manifest.defaults;
}

/**
 * Validate and wrap a module's configuration for persistence under its own namespace.
 */
export function writeModuleConfig<T>(
  manifest: SettingsModuleManifest<T>,
  input: unknown
): { ok: true; envelope: ModuleConfigEnvelope<T> } | { ok: false; error: string } {
  const parsed = manifest.schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || 'Settings values are not valid.',
    };
  }
  return {
    ok: true,
    envelope: {
      version: manifest.version,
      data: parsed.data,
    },
  };
}
