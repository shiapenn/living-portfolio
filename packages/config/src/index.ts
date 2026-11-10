import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, isAbsolute } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';

export type SettingCategory = 'deploy' | 'secrets' | 'branding';

export interface SettingMetadata {
  key: string;
  category: SettingCategory;
  description: string;
  defaultValue: string | number | boolean;
  exampleValue: string;
  secret: boolean;
  public: boolean;
  requiredInProduction?: boolean;
}

export const CONFIG_SETTINGS_METADATA: readonly SettingMetadata[] = [
  {
    key: 'PORT',
    category: 'deploy',
    description: 'HTTP server listening port',
    defaultValue: 4000,
    exampleValue: '4000',
    secret: false,
    public: false,
  },
  {
    key: 'DEPLOYMENT_CLASS',
    category: 'deploy',
    description: 'Deployment environment class (development | staging | production)',
    defaultValue: 'development',
    exampleValue: 'development',
    secret: false,
    public: false,
  },
  {
    key: 'PRESET',
    category: 'deploy',
    description: 'Resource and provider preset (free-cloud | hobbyist-vps | local-only | hobbyist-docker | private-local | reliable-low-cost)',
    defaultValue: 'free-cloud',
    exampleValue: 'hobbyist-docker',
    secret: false,
    public: false,
  },
  {
    key: 'DATABASE_URL',
    category: 'deploy',
    description: 'PostgreSQL + pgvector connection string (required in production)',
    defaultValue: '',
    exampleValue: 'postgresql://postgres:postgres@db:5432/portfolio',
    secret: false,
    public: false,
    requiredInProduction: true,
  },
  {
    key: 'SITE_ORIGIN',
    category: 'deploy',
    description: 'Comma-separated allowed public web origins for CORS',
    defaultValue: 'http://localhost:4000',
    exampleValue: 'https://portfolio.example.com',
    secret: false,
    public: false,
  },
  {
    key: 'ADMIN_ORIGIN',
    category: 'deploy',
    description: 'Allowed admin origin for CORS and cookie CSRF validation',
    defaultValue: 'http://localhost:4000',
    exampleValue: 'https://admin.example.com',
    secret: false,
    public: false,
  },
  {
    key: 'ADMIN_HOSTNAME',
    category: 'deploy',
    description: 'Admin interface hostname for edge routing (§13.4)',
    defaultValue: 'admin.example.com',
    exampleValue: 'admin.example.com',
    secret: false,
    public: false,
  },
  {
    key: 'API_HOSTNAME',
    category: 'deploy',
    description: 'Public API hostname for edge routing (§13.4)',
    defaultValue: 'api.example.com',
    exampleValue: 'api.example.com',
    secret: false,
    public: false,
  },
  {
    key: 'SEED_DEMO',
    category: 'deploy',
    description: 'Explicitly opt in to seeding synthetic demo records on startup (never true in production)',
    defaultValue: false,
    exampleValue: 'false',
    secret: false,
    public: false,
  },
  {
    key: 'ENABLE_BUNDLED_WEB',
    category: 'deploy',
    description: 'Enable single-process bundled web server in API (defaults to false in pure API, true in bundled setups)',
    defaultValue: true,
    exampleValue: 'true',
    secret: false,
    public: false,
  },
  {
    key: 'NTFY_TOPIC',
    category: 'deploy',
    description: 'Notification topic for escalations and operational digests (§13.9)',
    defaultValue: '',
    exampleValue: 'living-portfolio-alerts',
    secret: false,
    public: false,
  },
  {
    key: 'AGE_PUBLIC_KEY',
    category: 'deploy',
    description: 'age recipient public key for encrypted database backups (§13.9)',
    defaultValue: '',
    exampleValue: '',
    secret: false,
    public: false,
  },
  {
    key: 'REDACTION_EXCLUSIONS_FILE',
    category: 'deploy',
    description: 'Path to confidential data exclusion list JSON file (§4.3, UX-03)',
    defaultValue: 'data/redaction-exclusions.json',
    exampleValue: 'data/redaction-exclusions.json',
    secret: false,
    public: false,
  },
  {
    key: 'DATA_DIR',
    category: 'deploy',
    description: 'Absolute path to application data directory (defaults to <repo_root>/data)',
    defaultValue: '',
    exampleValue: './data',
    secret: false,
    public: false,
  },
  {
    key: 'BACKUP_DIR',
    category: 'deploy',
    description: 'Absolute path to backup destination directory (defaults to <DATA_DIR>/backups)',
    defaultValue: '',
    exampleValue: './data/backups',
    secret: false,
    public: false,
  },
  {
    key: 'S3_BACKUP_BUCKET',
    category: 'deploy',
    description: 'S3-compatible bucket name for encrypted backup archives (§13.9)',
    defaultValue: '',
    exampleValue: '',
    secret: false,
    public: false,
  },
  {
    key: 'G4_SIGNOFF_PATH',
    category: 'deploy',
    description: 'Path to Gate G4 sign-off record (defaults to docs/releases/g4-signoff.md) (§6.4 item 5, OSR-19)',
    defaultValue: '',
    exampleValue: 'docs/releases/g4-signoff.md',
    secret: false,
    public: false,
  },
  // Browser-safe PUBLIC_ branding and endpoint settings (OSR-02, OSR-09)
  {
    key: 'PUBLIC_API_BASE_URL',
    category: 'branding',
    description: 'Browser-safe base URL for API requests from the public web client',
    defaultValue: '/api',
    exampleValue: '/api',
    secret: false,
    public: true,
  },
  {
    key: 'PUBLIC_SITE_NAME',
    category: 'branding',
    description: 'Public site title / brand label (OSR-09)',
    defaultValue: 'Portfolio Sandbox',
    exampleValue: 'Portfolio Sandbox',
    secret: false,
    public: true,
  },
  {
    key: 'PUBLIC_OWNER_NAME',
    category: 'branding',
    description: 'Display name of the portfolio owner (OSR-04, OSR-09)',
    defaultValue: 'Portfolio Owner',
    exampleValue: 'Portfolio Owner',
    secret: false,
    public: true,
  },
  {
    key: 'PUBLIC_OWNER_STATEMENT',
    category: 'branding',
    description: 'Short positioning statement shown on the home page (OSR-09)',
    defaultValue: 'I design and build fault-tolerant distributed storage systems, PostgreSQL infrastructure, and legible knowledge interfaces.',
    exampleValue: 'Systems engineer and design technologist.',
    secret: false,
    public: true,
  },
  {
    key: 'PUBLIC_OWNER_BIO',
    category: 'branding',
    description: 'About page biography paragraph (OSR-09)',
    defaultValue: 'Systems engineer and design technologist building storage engines, developer tools, and accessible interfaces.',
    exampleValue: 'Systems engineer and design technologist.',
    secret: false,
    public: true,
  },
  {
    key: 'PUBLIC_SITE_LOGO_URL',
    category: 'branding',
    description: 'Optional URL or path to custom brand logo asset (OSR-09)',
    defaultValue: '',
    exampleValue: '',
    secret: false,
    public: true,
  },
  {
    key: 'PUBLIC_SITE_FOOTER_TEXT',
    category: 'branding',
    description: 'Footer copyright or attribution line (OSR-09)',
    defaultValue: 'Powered by an open-source knowledge portfolio runtime (Apache-2.0).',
    exampleValue: 'Powered by an open-source knowledge portfolio runtime (Apache-2.0).',
    secret: false,
    public: true,
  },
  {
    key: 'PUBLIC_UNOFFICIAL_FORK_NOTICE',
    category: 'branding',
    description: 'Mandatory notice when running an unofficial fork offering a service to others (OSR-09 §1.2)',
    defaultValue: 'This is an unofficial fork and is not affiliated with the official project.',
    exampleValue: 'This is an unofficial fork and is not affiliated with the official project.',
    secret: false,
    public: true,
  },
  // Secrets (OSR-02: secret=true, public=false; supports *_FILE mounted secrets)
  {
    key: 'SESSION_SECRET',
    category: 'secrets',
    description: 'HMAC signing key for session cookies, CSRF tokens, and redaction preview tokens (required in production)',
    defaultValue: '',
    exampleValue: '',
    secret: true,
    public: false,
    requiredInProduction: true,
  },
  {
    key: 'ADMIN_API_TOKEN',
    category: 'secrets',
    description: 'Bootstrap personal access token for headless/API admin operations',
    defaultValue: '',
    exampleValue: '',
    secret: true,
    public: false,
  },
  {
    key: 'TUNNEL_TOKEN',
    category: 'secrets',
    description: 'Outbound Cloudflare Tunnel token (§13.8)',
    defaultValue: '',
    exampleValue: '',
    secret: true,
    public: false,
  },
  {
    key: 'GROQ_API_KEY',
    category: 'secrets',
    description: 'Optional Groq cloud provider API key (§13.5)',
    defaultValue: '',
    exampleValue: '',
    secret: true,
    public: false,
  },
  {
    key: 'GEMINI_API_KEY',
    category: 'secrets',
    description: 'Optional Google Gemini cloud provider API key (§13.5)',
    defaultValue: '',
    exampleValue: '',
    secret: true,
    public: false,
  },
  {
    key: 'OPENAI_API_KEY',
    category: 'secrets',
    description: 'Optional OpenAI cloud provider API key (§13.5)',
    defaultValue: '',
    exampleValue: '',
    secret: true,
    public: false,
  },
] as const;

export const CalibrationConfigSchema = z
  .object({
    suggestion_thresholds: z.boolean().default(false),
    routing_calibration: z.boolean().default(false),
    topology_audit: z.boolean().default(true),
    scoped_constraint_mining: z.boolean().optional(),
    scoped_constraints: z.boolean().optional(),
  })
  .transform((c) => ({
    suggestion_thresholds: c.suggestion_thresholds,
    routing_calibration: c.routing_calibration,
    topology_audit: c.topology_audit,
    scoped_constraint_mining:
      c.scoped_constraint_mining ?? c.scoped_constraints ?? true,
  }))
  .default({
    suggestion_thresholds: false,
    routing_calibration: false,
    topology_audit: true,
    scoped_constraint_mining: true,
  });

export type CalibrationConfig = z.infer<typeof CalibrationConfigSchema>;

export const AppConfigSchema = z
  .object({
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DEPLOYMENT_CLASS: z.enum(['development', 'staging', 'production']).default('development'),
    PRESET: z
      .enum(['free-cloud', 'hobbyist-vps', 'local-only', 'hobbyist-docker', 'private-local', 'reliable-low-cost'])
      .default('free-cloud'),
    calibration: CalibrationConfigSchema,
    DATABASE_URL: z.string().default(''),
    SITE_ORIGIN: z.string().min(1).default('http://localhost:4000'),
    ADMIN_ORIGIN: z.string().min(1).default('http://localhost:4000'),
    ADMIN_HOSTNAME: z.string().default('admin.example.com'),
    API_HOSTNAME: z.string().default('api.example.com'),
    SEED_DEMO: z
      .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
      .transform((val) => val === true || val === 'true' || val === '1')
      .default(false),
    ENABLE_BUNDLED_WEB: z
      .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
      .transform((val) => val === true || val === 'true' || val === '1')
      .default(true),
    NTFY_TOPIC: z.string().default(''),
    AGE_PUBLIC_KEY: z.string().default(''),
    S3_BACKUP_BUCKET: z.string().default(''),
    DATA_DIR: z.string().default(''),
    BACKUP_DIR: z.string().default(''),
    G4_SIGNOFF_PATH: z.string().default(''),
    PUBLIC_API_BASE_URL: z.string().min(1).default('/api'),
    PUBLIC_SITE_NAME: z.string().min(1).default('Portfolio Sandbox'),
    PUBLIC_OWNER_NAME: z.string().min(1).default('Portfolio Owner'),
    PUBLIC_OWNER_STATEMENT: z
      .string()
      .default(
        'I design and build fault-tolerant distributed storage systems, PostgreSQL infrastructure, and legible knowledge interfaces.'
      ),
    PUBLIC_OWNER_BIO: z
      .string()
      .default(
        'Systems engineer and design technologist building storage engines, developer tools, and accessible interfaces.'
      ),
    PUBLIC_SITE_LOGO_URL: z.string().default(''),
    PUBLIC_SITE_FOOTER_TEXT: z
      .string()
      .default('Powered by an open-source knowledge portfolio runtime (Apache-2.0).'),
    PUBLIC_UNOFFICIAL_FORK_NOTICE: z
      .string()
      .default('This is an unofficial fork and is not affiliated with the official project.'),
    SESSION_SECRET: z.string().default(''),
    ADMIN_API_TOKEN: z.string().default(''),
    TUNNEL_TOKEN: z.string().default(''),
    GROQ_API_KEY: z.string().default(''),
    GEMINI_API_KEY: z.string().default(''),
    OPENAI_API_KEY: z.string().default(''),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.DEPLOYMENT_CLASS === 'production') {
      if (!cfg.DATABASE_URL || cfg.DATABASE_URL.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DATABASE_URL'],
          message: 'DATABASE_URL is required when DEPLOYMENT_CLASS=production',
        });
      }
      if (!cfg.SESSION_SECRET || cfg.SESSION_SECRET.trim().length < 16) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SESSION_SECRET'],
          message: 'SESSION_SECRET (min 16 chars) is required when DEPLOYMENT_CLASS=production',
        });
      }
      if (cfg.SEED_DEMO) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['SEED_DEMO'],
          message: 'SEED_DEMO cannot be enabled when DEPLOYMENT_CLASS=production',
        });
      }

      // Gate G4 Production Sign-off Guard (§6.4 item 5, OSR-19)
      const signoffPath = cfg.G4_SIGNOFF_PATH || findG4SignoffPath();
      if (!existsSync(signoffPath)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DEPLOYMENT_CLASS'],
          message: 'Production startup refused: missing required Gate G4 sign-off record (docs/releases/g4-signoff.md)',
        });
      }
    }
  });

export function findRepoRoot(startDir = process.cwd()): string {
  let curr = resolve(startDir);
  for (let i = 0; i < 6; i++) {
    if (existsSync(resolve(curr, 'pnpm-workspace.yaml'))) {
      return curr;
    }
    const parent = resolve(curr, '..');
    if (parent === curr) break;
    curr = parent;
  }
  return resolve(startDir);
}

export function resolveDataDir(customDataDir?: string, startDir = process.cwd()): string {
  const root = findRepoRoot(startDir);
  const raw = customDataDir || process.env.DATA_DIR;
  const resolved = raw && raw.trim() !== ''
    ? (isAbsolute(raw.trim()) ? raw.trim() : resolve(root, raw.trim()))
    : resolve(root, 'data');
  if (!existsSync(resolved)) {
    try {
      mkdirSync(resolved, { recursive: true });
    } catch {
      // In restricted filesystems caller handles
    }
  }
  return resolved;
}

export function resolveBackupDir(customBackupDir?: string, customDataDir?: string, startDir = process.cwd()): string {
  const root = findRepoRoot(startDir);
  const raw = customBackupDir || process.env.BACKUP_DIR;
  if (raw && raw.trim() !== '') {
    const resolved = isAbsolute(raw.trim()) ? raw.trim() : resolve(root, raw.trim());
    if (!existsSync(resolved)) {
      try {
        mkdirSync(resolved, { recursive: true });
      } catch {}
    }
    return resolved;
  }
  const dataDir = resolveDataDir(customDataDir, startDir);
  const backupDir = resolve(dataDir, 'backups');
  if (!existsSync(backupDir)) {
    try {
      mkdirSync(backupDir, { recursive: true });
    } catch {}
  }
  return backupDir;
}

export function findG4SignoffPath(): string {
  if (process.env.G4_SIGNOFF_PATH) return process.env.G4_SIGNOFF_PATH;
  let curr = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = resolve(curr, 'docs/releases/g4-signoff.md');
    if (existsSync(candidate)) return candidate;
    const parent = resolve(curr, '..');
    if (parent === curr) break;
    curr = parent;
  }
  return resolve(process.cwd(), 'docs/releases/g4-signoff.md');
}

export type AppConfig = z.infer<typeof AppConfigSchema>;

export class ConfigValidationError extends Error {
  public readonly issues: Array<{ key: string; message: string }>;

  constructor(issues: Array<{ key: string; message: string }>) {
    const formatted = issues.map((i) => `  - ${i.key}: ${i.message}`).join('\n');
    super(`Configuration validation failed at boot:\n${formatted}`);
    this.name = 'ConfigValidationError';
    this.issues = issues;
  }
}

/**
 * Loads configuration with precedence:
 * 1. Built-in defaults
 * 2. Optional YAML file (via options.yamlPath or env.CONFIG_FILE)
 * 3. Environment variables + `*_FILE` secret mounts
 */
export function loadConfig(options?: {
  env?: Record<string, string | undefined>;
  yamlPath?: string;
}): AppConfig {
  const env = options?.env ?? process.env;
  const mergedRaw: Record<string, unknown> = {};

  // 1. Optional YAML file
  const yamlFile = options?.yamlPath ?? env.CONFIG_FILE;
  if (yamlFile && existsSync(yamlFile)) {
    const parsed = parseYaml(readFileSync(yamlFile, 'utf8'));
    if (parsed && typeof parsed === 'object') {
      Object.assign(mergedRaw, parsed);
    }
  }

  // 2. Environment variables and *_FILE mounted secrets
  for (const meta of CONFIG_SETTINGS_METADATA) {
    const fileEnvKey = `${meta.key}_FILE`;
    const filePath = env[fileEnvKey];
    if (filePath && filePath.trim() !== '') {
      if (!existsSync(filePath)) {
        throw new ConfigValidationError([
          { key: fileEnvKey, message: `Mounted secret file does not exist: ${filePath}` },
        ]);
      }
      mergedRaw[meta.key] = readFileSync(filePath, 'utf8').trim();
    } else if (env[meta.key] !== undefined && env[meta.key] !== '') {
      mergedRaw[meta.key] = env[meta.key];
    }
  }

  const parsed = AppConfigSchema.safeParse(mergedRaw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      key: issue.path.join('.') || 'root',
      message: issue.message,
    }));
    throw new ConfigValidationError(issues);
  }

  return parsed.data;
}

/**
 * Extracts only browser-safe `PUBLIC_*` settings (OSR-02 §3.3 rule 5).
 * Enforces that every public setting starts with `PUBLIC_` and is not marked `secret`.
 */
export function extractPublicClientConfig(config: AppConfig): Record<string, string> {
  const out: Record<string, string> = {};
  for (const meta of CONFIG_SETTINGS_METADATA) {
    if (meta.public) {
      if (!meta.key.startsWith('PUBLIC_') || meta.secret) {
        throw new Error(`Invalid public config metadata for key ${meta.key}: must start with PUBLIC_ and not be secret.`);
      }
      out[meta.key] = String(config[meta.key as keyof AppConfig] ?? '');
    }
  }
  return out;
}

/**
 * Verifies that no secret variable name (or non-empty secret value) appears in client bundle text (OSR-02).
 */
export function assertNoSecretsInClientBundle(
  bundleText: string,
  config?: Partial<AppConfig>
): { ok: boolean; leaked: string[] } {
  const leaked: string[] = [];
  for (const meta of CONFIG_SETTINGS_METADATA) {
    if (!meta.secret) continue;
    const keyRegex = new RegExp(`\\b${meta.key}\\b`);
    if (keyRegex.test(bundleText)) {
      leaked.push(meta.key);
    }
    const secretVal = config?.[meta.key as keyof AppConfig];
    if (typeof secretVal === 'string' && secretVal.length >= 8 && bundleText.includes(secretVal)) {
      leaked.push(`${meta.key}_VALUE`);
    }
  }
  return { ok: leaked.length === 0, leaked };
}

/**
 * Generates `.env.example` deterministically from `CONFIG_SETTINGS_METADATA` (OSR-03).
 */
export function generateEnvExample(): string {
  const lines: string[] = [
    '# The Living Portfolio — Environment Configuration (§13.12, §13.13, OSR-03)',
    '# Generated from @living-portfolio/config schema. Do not edit manually; run `pnpm config:generate-env`.',
    '',
  ];

  const categories: Array<{ id: SettingCategory; title: string }> = [
    { id: 'deploy', title: '# 1. Deployment & Infrastructure Configuration' },
    { id: 'branding', title: '# 2. Public Site & Branding Configuration (PUBLIC_ prefix)' },
    { id: 'secrets', title: '# 3. Secrets (Never commit values; supports *_FILE mounted secrets)' },
  ];

  for (const cat of categories) {
    lines.push(cat.title);
    for (const meta of CONFIG_SETTINGS_METADATA.filter((m) => m.category === cat.id)) {
      lines.push(`# ${meta.description}${meta.requiredInProduction ? ' [REQUIRED IN PRODUCTION]' : ''}`);
      lines.push(`${meta.key}=${meta.exampleValue}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
