import { createHash, createHmac } from 'node:crypto';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { resolveMediaDir, type AppConfig } from '@living-portfolio/config';

export interface MediaStorageAdapter {
  readonly kind: 'local' | 's3';
  put(key: string, data: Uint8Array, contentType: string): Promise<{ key: string; sizeBytes: number }>;
  get(key: string): Promise<{ data: Uint8Array; sizeBytes: number } | null>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
}

const STRICT_STORAGE_KEY_RE = /^[a-f0-9]{2}\/[a-f0-9]{64}\.[a-z0-9]{1,8}$/;

export function assertValidStorageKey(key: string): void {
  if (!STRICT_STORAGE_KEY_RE.test(key)) {
    throw new Error('Invalid media storage key');
  }
}

/**
 * Local volume media storage adapter (default backend per D-STORAGE).
 * Enforces strict content-addressed keys and containment within baseDir.
 */
export class LocalVolumeMediaStorageAdapter implements MediaStorageAdapter {
  readonly kind = 'local' as const;
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = resolve(baseDir);
  }

  private resolveSafePath(key: string): string {
    assertValidStorageKey(key);
    const fullPath = resolve(this.baseDir, key);
    if (fullPath !== this.baseDir && !fullPath.startsWith(this.baseDir + sep)) {
      throw new Error('Path traversal rejected in media storage adapter');
    }
    return fullPath;
  }

  async put(key: string, data: Uint8Array, _contentType: string): Promise<{ key: string; sizeBytes: number }> {
    const fullPath = this.resolveSafePath(key);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, data);
    return { key, sizeBytes: data.byteLength };
  }

  async get(key: string): Promise<{ data: Uint8Array; sizeBytes: number } | null> {
    const fullPath = this.resolveSafePath(key);
    try {
      const buf = await readFile(fullPath);
      const data = new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
      return { data, sizeBytes: data.byteLength };
    } catch (err: any) {
      if (err?.code === 'ENOENT') return null;
      throw err;
    }
  }

  async delete(key: string): Promise<boolean> {
    const fullPath = this.resolveSafePath(key);
    try {
      await unlink(fullPath);
      return true;
    } catch (err: any) {
      if (err?.code === 'ENOENT') return false;
      throw err;
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.resolveSafePath(key);
    try {
      await stat(fullPath);
      return true;
    } catch (err: any) {
      if (err?.code === 'ENOENT') return false;
      throw err;
    }
  }
}

export interface S3StorageConfig {
  bucket: string;
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  fetchImpl?: typeof fetch;
}

function hmacSha256(key: string | Buffer, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}

function sha256Hex(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * S3-compatible object storage adapter (AWS S3, Cloudflare R2, MinIO) using SigV4 signing.
 */
export class S3CompatibleMediaStorageAdapter implements MediaStorageAdapter {
  readonly kind = 's3' as const;
  private readonly cfg: S3StorageConfig;
  private readonly fetchFn: typeof fetch;

  constructor(cfg: S3StorageConfig) {
    if (!cfg.bucket || !cfg.endpoint || !cfg.accessKeyId || !cfg.secretAccessKey) {
      throw new Error('S3CompatibleMediaStorageAdapter requires bucket, endpoint, accessKeyId, and secretAccessKey');
    }
    this.cfg = cfg;
    this.fetchFn = cfg.fetchImpl ?? fetch;
  }

  private buildObjectUrl(key: string): URL {
    assertValidStorageKey(key);
    const base = this.cfg.endpoint.replace(/\/+$/, '');
    return new URL(`${base}/${encodeURIComponent(this.cfg.bucket)}/${key}`);
  }

  private signRequest(
    method: 'PUT' | 'GET' | 'DELETE' | 'HEAD',
    url: URL,
    payloadHash: string,
    extraHeaders: Record<string, string> = {}
  ): Record<string, string> {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const region = this.cfg.region || 'auto';
    const service = 's3';

    const headers: Record<string, string> = {
      host: url.host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      ...extraHeaders,
    };

    const sortedKeys = Object.keys(headers)
      .map((k) => k.toLowerCase())
      .sort();
    const canonicalHeaders = sortedKeys.map((k) => `${k}:${headers[k].trim()}\n`).join('');
    const signedHeaders = sortedKeys.join(';');

    const canonicalRequest = [
      method,
      url.pathname,
      url.searchParams.toString(),
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest),
    ].join('\n');

    const kDate = hmacSha256(`AWS4${this.cfg.secretAccessKey}`, dateStamp);
    const kRegion = hmacSha256(kDate, region);
    const kService = hmacSha256(kRegion, service);
    const kSigning = hmacSha256(kService, 'aws4_request');
    const signature = createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

    return {
      ...headers,
      authorization: `AWS4-HMAC-SHA256 Credential=${this.cfg.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    };
  }

  async put(key: string, data: Uint8Array, contentType: string): Promise<{ key: string; sizeBytes: number }> {
    const url = this.buildObjectUrl(key);
    const payloadHash = sha256Hex(data);
    const headers = this.signRequest('PUT', url, payloadHash, { 'content-type': contentType });
    const res = await this.fetchFn(url.toString(), {
      method: 'PUT',
      headers,
      body: Buffer.from(data),
    });
    if (!res.ok) {
      throw new Error(`S3 media upload failed with status ${res.status}`);
    }
    return { key, sizeBytes: data.byteLength };
  }

  async get(key: string): Promise<{ data: Uint8Array; sizeBytes: number } | null> {
    const url = this.buildObjectUrl(key);
    const payloadHash = sha256Hex('');
    const headers = this.signRequest('GET', url, payloadHash);
    const res = await this.fetchFn(url.toString(), { method: 'GET', headers });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`S3 media fetch failed with status ${res.status}`);
    }
    const ab = await res.arrayBuffer();
    const data = new Uint8Array(ab);
    return { data, sizeBytes: data.byteLength };
  }

  async delete(key: string): Promise<boolean> {
    const url = this.buildObjectUrl(key);
    const payloadHash = sha256Hex('');
    const headers = this.signRequest('DELETE', url, payloadHash);
    const res = await this.fetchFn(url.toString(), { method: 'DELETE', headers });
    if (res.status === 404) return false;
    if (!res.ok) {
      throw new Error(`S3 media delete failed with status ${res.status}`);
    }
    return true;
  }

  async exists(key: string): Promise<boolean> {
    const url = this.buildObjectUrl(key);
    const payloadHash = sha256Hex('');
    const headers = this.signRequest('HEAD', url, payloadHash);
    const res = await this.fetchFn(url.toString(), { method: 'HEAD', headers });
    if (res.status === 404) return false;
    return res.ok;
  }
}

export function createMediaStorageAdapter(
  cfg: AppConfig,
  options?: { baseDir?: string; fetchImpl?: typeof fetch }
): MediaStorageAdapter {
  if (cfg.MEDIA_STORAGE_BACKEND === 's3') {
    return new S3CompatibleMediaStorageAdapter({
      bucket: cfg.MEDIA_S3_BUCKET,
      endpoint: cfg.MEDIA_S3_ENDPOINT,
      region: cfg.MEDIA_S3_REGION,
      accessKeyId: cfg.MEDIA_S3_ACCESS_KEY_ID,
      secretAccessKey: cfg.MEDIA_S3_SECRET_ACCESS_KEY,
      fetchImpl: options?.fetchImpl,
    });
  }
  const baseDir = options?.baseDir ?? resolveMediaDir(cfg.MEDIA_DIR, cfg.DATA_DIR);
  return new LocalVolumeMediaStorageAdapter(baseDir);
}
