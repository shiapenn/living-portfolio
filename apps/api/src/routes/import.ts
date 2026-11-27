import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import {
  chunkMarkdown,
  planImport,
  GitHubConnector,
  RSSConnector,
  FileDropConnector,
  type ImportJob,
  type ImportJobDocument,
  type ImportJobCheckpoint,
  type ImportDocumentInput,
} from '@living-portfolio/core';
import { scanForConfidentialData } from '@living-portfolio/ai';
import { AuthManager, sha256Hex } from '../auth/security.js';
import type { AppConfig } from '@living-portfolio/config';
import type { MediaStorageAdapter } from '../media/storage.js';
import { registerImportFileRoutes } from './import-files.js';

export function createImportRoutes(
  repo: IPortfolioRepository,
  auth: AuthManager,
  deploymentClass?: string,
  mediaStorage?: MediaStorageAdapter,
  cfg?: AppConfig
) {
  const router = new Hono();

  // Staging Safeguards (§6.4 item 2, OSR-19): Import and connector features are strictly disabled in staging
  if (deploymentClass === 'staging') {
    const disabledHandler = (c: any) =>
      c.json(
        {
          error: 'Import and connector features are disabled in staging environment (synthetic data only).',
          code: 'STAGING_IMPORT_DISABLED',
        },
        403
      );
    router.all('*', disabledHandler);
    router.all('/', disabledHandler);
    return router;
  }

  // 0. Real file import (WP-18.7: multipart md/txt/html/docx/pdf/zip)
  registerImportFileRoutes(router, repo, mediaStorage, cfg);

  // Core connectors registry (§14)
  const connectors = {
    github: new GitHubConnector(),
    rss: new RSSConnector(),
    'file-drop': new FileDropConnector(),
  };

  // 1. List Core Connectors (§14)
  router.get('/connectors', (c) => {
    const list = Object.values(connectors).map((conn) => ({
      id: conn.id,
      name: conn.name,
      permissions: conn.permissions,
    }));
    return c.json({ connectors: list });
  });

  // 2. Connector Crawl (§14)
  router.post('/connectors/:id/crawl', async (c) => {
    const connId = c.req.param('id') as keyof typeof connectors;
    const connector = connectors[connId];
    if (!connector) {
      return c.json({ error: `Unknown connector: ${connId}` }, 404);
    }

    const body = await c.req.json().catch(() => ({}));
    const assets = [];
    for await (const asset of connector.crawl(body)) {
      assets.push(asset);
    }
    return c.json({ connectorId: connId, count: assets.length, assets });
  });

  // 3. Import Planner with Configured Budgets (§13.6, Fix 21)
  router.post('/plan', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const documents = body.documents;
    if (!Array.isArray(documents)) {
      return c.json({ error: 'Array of documents required' }, 400);
    }

    const docInputs: ImportDocumentInput[] = documents.map((d: any, idx: number) => ({
      id: d.id || `doc-${idx + 1}`,
      title: d.title,
      text: d.text || d.body_md || '',
      audioDurationSeconds: d.audioDurationSeconds || d.audio_seconds,
      dataClass: d.dataClass || d.data_class,
      sourceUrl: d.sourceUrl || d.source_url,
    }));

    const result = planImport(docInputs, body.config);
    return c.json(result);
  });

  // Helper: Process and checkpoint a single document in a job (§13.6)
  async function processDocument(
    item: ImportJobDocument,
    publishAsIs: boolean = false
  ): Promise<ImportJobCheckpoint> {
    const docId = item.id || item.slug || `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const bodyMd = String(item.body_md || '');
    const slug = item.slug || `import-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (publishAsIs) {
      const warnings = scanForConfidentialData(bodyMd);
      const check = auth.verifyRedactionPreviewToken(item.redaction_preview_token, {
        entryId: slug,
        bodyMd,
        warnings,
      });
      if (!check.valid) {
        return {
          documentId: docId,
          importedAt: new Date().toISOString(),
          entryId: '',
          revisionId: '',
          status: 'failed',
          error: `Redaction preview token rejected: ${check.reason}`,
        };
      }
    }

    try {
      // Immediate L0 publish per document (§13.6)
      const { entry, revision } = await repo.createEntry(
        {
          slug,
          title: item.title || slug.replace(/-/g, ' '),
          profile: item.profile || 'case-study',
          view: 'article',
          visibility: publishAsIs ? 'public' : 'private',
          venture_id: null,
          current_revision_id: null,
        },
        {
          body_md: bodyMd,
          body_hash: sha256Hex(bodyMd),
          temporal_level: item.temporal_level || 'estimated',
          valid_from: item.valid_from,
          valid_to: null,
          is_hindsight: false,
        }
      );

      const chunks = chunkMarkdown(revision.id, bodyMd);
      await repo.saveSpans(chunks);

      return {
        documentId: docId,
        importedAt: new Date().toISOString(),
        entryId: entry.id,
        revisionId: revision.id,
        status: 'imported',
      };
    } catch (err: any) {
      return {
        documentId: docId,
        importedAt: new Date().toISOString(),
        entryId: '',
        revisionId: '',
        status: 'failed',
        error: err.message,
      };
    }
  }

  // 4. Create Resumable Import Job (§13.6, Fix 21)
  router.post('/jobs', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const items = body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return c.json({ error: 'Array of document items required' }, 400);
    }

    const autoStart = body.autoStart !== false;
    const publishAsIs = body.publishAsIs === true;

    const initialJob = await repo.createImportJob({
      status: autoStart ? 'in_progress' : 'pending',
      total_documents: items.length,
      processed_count: 0,
      failed_count: 0,
      checkpoints: [],
      items,
      config: body.config || {},
    });

    if (autoStart) {
      const checkpoints: ImportJobCheckpoint[] = [];
      let processed = 0;
      let failed = 0;

      for (const item of items) {
        const cp = await processDocument(item, publishAsIs);
        checkpoints.push(cp);
        if (cp.status === 'imported') {
          processed++;
        } else {
          failed++;
        }
        await repo.updateImportJob(initialJob.id, {
          processed_count: processed,
          failed_count: failed,
          checkpoints,
        });
      }

      const finalStatus = failed > 0 && processed === 0 ? 'failed' : 'completed';
      const updatedJob = await repo.updateImportJob(initialJob.id, {
        status: finalStatus,
        processed_count: processed,
        failed_count: failed,
        checkpoints,
      });

      return c.json({ job: updatedJob, autoStarted: true }, 201);
    }

    return c.json({ job: initialJob, autoStarted: false }, 201);
  });

  // 5. Get Import Job Status & Checkpoints (§13.6)
  router.get('/jobs/:id', async (c) => {
    const id = c.req.param('id');
    const job = await repo.getImportJob(id);
    if (!job) {
      return c.json({ error: 'Import job not found' }, 404);
    }

    const checkpointedIds = new Set(job.checkpoints.map((cp) => cp.documentId));
    const remainingItems = job.items.filter((item) => !checkpointedIds.has(item.id || item.slug || ''));

    return c.json({
      job,
      progress: {
        total: job.total_documents,
        processed: job.processed_count,
        failed: job.failed_count,
        percent: job.total_documents > 0 ? Math.round((job.checkpoints.length / job.total_documents) * 100) : 0,
      },
      checkpoints: job.checkpoints,
      remainingCount: remainingItems.length,
    });
  });

  // 6. Resume Paused or Interrupted Import Job (§13.6)
  router.post('/jobs/:id/resume', async (c) => {
    const id = c.req.param('id');
    const job = await repo.getImportJob(id);
    if (!job) {
      return c.json({ error: 'Import job not found' }, 404);
    }

    if (job.status === 'completed') {
      return c.json({ message: 'Job is already completed', job });
    }

    await repo.updateImportJob(id, { status: 'in_progress' });

    const checkpointedIds = new Set(job.checkpoints.map((cp) => cp.documentId));
    const remainingItems = job.items.filter((item) => !checkpointedIds.has(item.id || item.slug || ''));

    const checkpoints = [...job.checkpoints];
    let processed = job.processed_count;
    let failed = job.failed_count;
    const publishAsIs = job.config?.publishAsIs === true;

    for (const item of remainingItems) {
      const cp = await processDocument(item, publishAsIs);
      checkpoints.push(cp);
      if (cp.status === 'imported') {
        processed++;
      } else {
        failed++;
      }

      await repo.updateImportJob(id, {
        processed_count: processed,
        failed_count: failed,
        checkpoints,
      });
    }

    const finalStatus = failed > 0 && processed === 0 ? 'failed' : 'completed';
    const updatedJob = await repo.updateImportJob(id, {
      status: finalStatus,
      processed_count: processed,
      failed_count: failed,
      checkpoints,
    });

    return c.json({
      resumed: true,
      resumedDocumentsCount: remainingItems.length,
      job: updatedJob,
    });
  });

  // 7. Pause In-Progress Job (§13.6)
  router.post('/jobs/:id/pause', async (c) => {
    const id = c.req.param('id');
    const job = await repo.getImportJob(id);
    if (!job) {
      return c.json({ error: 'Import job not found' }, 404);
    }

    const updated = await repo.updateImportJob(id, { status: 'paused' });
    return c.json({ paused: true, job: updated });
  });

  // 8. Legacy / Bulk import items batch (Preserved for compatibility)
  router.post('/batch', async (c) => {
    const { items, publishAsIs } = await c.req.json();
    if (!Array.isArray(items)) return c.json({ error: 'Items array required' }, 400);

    if (publishAsIs) {
      for (const item of items) {
        const bodyMd = String(item.body_md || '');
        const warnings = scanForConfidentialData(bodyMd);
        const check = auth.verifyRedactionPreviewToken(item.redactionPreviewToken, {
          entryId: item.slug || 'draft',
          bodyMd,
          warnings,
        });
        if (!check.valid) {
          return c.json(
            {
              error: 'Redaction preview confirmation token required for publishAsIs import',
              slug: item.slug,
              reason: check.reason,
            },
            400
          );
        }
      }
    }

    const imported = [];
    for (const item of items) {
      const slug = item.slug || `import-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const bodyMd = String(item.body_md || '');
      const { entry, revision } = await repo.createEntry(
        {
          slug,
          title: item.title || slug.replace(/-/g, ' '),
          profile: item.profile || 'case-study',
          view: 'article',
          visibility: publishAsIs ? 'public' : 'private',
          venture_id: null,
          current_revision_id: null,
        },
        {
          body_md: bodyMd,
          body_hash: sha256Hex(bodyMd),
          temporal_level: item.temporal_level || 'estimated',
          valid_from: item.valid_from,
          valid_to: null,
          is_hindsight: false,
        }
      );

      const chunks = chunkMarkdown(revision.id, bodyMd);
      await repo.saveSpans(chunks);

      imported.push({ entry, revision, chunksCount: chunks.length });
    }

    return c.json({ importedCount: imported.length, entries: imported }, 201);
  });

  return router;
}
