import { existsSync, mkdirSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { z } from 'zod';

export const MEDIA_DEPLOY_SETTINGS_METADATA = [
  {
    key: 'MEDIA_STORAGE_BACKEND',
    category: 'deploy' as const,
    description: 'Media storage backend adapter (local | s3; D-STORAGE)',
    defaultValue: 'local',
    exampleValue: 'local',
    secret: false,
    public: false,
  },
  {
    key: 'MEDIA_DIR',
    category: 'deploy' as const,
    description: 'Absolute or repo-relative local directory for uploaded media assets (defaults to <DATA_DIR>/media)',
    defaultValue: '',
    exampleValue: './data/media',
    secret: false,
    public: false,
  },
  {
    key: 'MEDIA_MAX_IMAGE_BYTES',
    category: 'deploy' as const,
    description: 'Maximum allowed image upload size in bytes (default 10 MB; D-STORAGE)',
    defaultValue: 10485760,
    exampleValue: '10485760',
    secret: false,
    public: false,
  },
  {
    key: 'MEDIA_MAX_VIDEO_BYTES',
    category: 'deploy' as const,
    description: 'Maximum allowed video upload size in bytes (default 100 MB; D-STORAGE)',
    defaultValue: 104857600,
    exampleValue: '104857600',
    secret: false,
    public: false,
  },
  {
    key: 'MEDIA_MAX_TOTAL_BYTES',
    category: 'deploy' as const,
    description: 'Total media storage quota in bytes (default 5 GB; D-STORAGE)',
    defaultValue: 5368709120,
    exampleValue: '5368709120',
    secret: false,
    public: false,
  },
  {
    key: 'MEDIA_ALLOWED_MIME_TYPES',
    category: 'deploy' as const,
    description: 'Comma-separated allowed sniffed MIME types for media uploads (SVG rejected by default; D-STORAGE)',
    defaultValue: 'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm',
    exampleValue: 'image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm',
    secret: false,
    public: false,
  },
  {
    key: 'MEDIA_S3_BUCKET',
    category: 'deploy' as const,
    description: 'S3-compatible bucket name when MEDIA_STORAGE_BACKEND=s3 (D-STORAGE)',
    defaultValue: '',
    exampleValue: '',
    secret: false,
    public: false,
  },
  {
    key: 'MEDIA_S3_ENDPOINT',
    category: 'deploy' as const,
    description: 'S3-compatible endpoint URL when MEDIA_STORAGE_BACKEND=s3 (D-STORAGE)',
    defaultValue: '',
    exampleValue: '',
    secret: false,
    public: false,
  },
  {
    key: 'MEDIA_S3_REGION',
    category: 'deploy' as const,
    description: 'S3-compatible signing region when MEDIA_STORAGE_BACKEND=s3 (D-STORAGE)',
    defaultValue: 'auto',
    exampleValue: 'auto',
    secret: false,
    public: false,
  },
] as const;

export const MEDIA_SECRET_SETTINGS_METADATA = [
  {
    key: 'MEDIA_S3_ACCESS_KEY_ID',
    category: 'secrets' as const,
    description: 'S3-compatible access key ID when MEDIA_STORAGE_BACKEND=s3 (D-STORAGE)',
    defaultValue: '',
    exampleValue: '',
    secret: true,
    public: false,
  },
  {
    key: 'MEDIA_S3_SECRET_ACCESS_KEY',
    category: 'secrets' as const,
    description: 'S3-compatible secret access key when MEDIA_STORAGE_BACKEND=s3 (D-STORAGE)',
    defaultValue: '',
    exampleValue: '',
    secret: true,
    public: false,
  },
] as const;

export const MEDIA_CONFIG_SCHEMA_SHAPE = {
  MEDIA_STORAGE_BACKEND: z.enum(['local', 's3']).default('local'),
  MEDIA_DIR: z.string().default(''),
  MEDIA_MAX_IMAGE_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  MEDIA_MAX_VIDEO_BYTES: z.coerce.number().int().positive().default(100 * 1024 * 1024),
  MEDIA_MAX_TOTAL_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024 * 1024),
  MEDIA_ALLOWED_MIME_TYPES: z
    .string()
    .default('image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm'),
  MEDIA_S3_BUCKET: z.string().default(''),
  MEDIA_S3_ENDPOINT: z.string().default(''),
  MEDIA_S3_REGION: z.string().default('auto'),
  MEDIA_S3_ACCESS_KEY_ID: z.string().default(''),
  MEDIA_S3_SECRET_ACCESS_KEY: z.string().default(''),
};

export function resolveMediaDirFrom(
  findRepoRootFn: (startDir?: string) => string,
  resolveDataDirFn: (customDataDir?: string, startDir?: string) => string,
  customMediaDir?: string,
  customDataDir?: string,
  startDir = process.cwd()
): string {
  const root = findRepoRootFn(startDir);
  const raw = customMediaDir || process.env.MEDIA_DIR;
  const target =
    raw && raw.trim() !== ''
      ? isAbsolute(raw.trim())
        ? raw.trim()
        : resolve(root, raw.trim())
      : resolve(resolveDataDirFn(customDataDir, startDir), 'media');
  if (!existsSync(target)) {
    try {
      mkdirSync(target, { recursive: true });
    } catch {}
  }
  return target;
}
