import { Hono } from 'hono';
import type { PortfolioWorker, WorkerQueueManager } from '@living-portfolio/worker';
import type { IPortfolioRepository } from '@living-portfolio/db';

/**
 * §8 & §13.7 Publish and Background Enrichment Routes (Finding 20261020-UX-05 / WP-11.1)
 */
export function createPublishRoutes(
  worker: PortfolioWorker,
  repo?: IPortfolioRepository,
  queueManager?: WorkerQueueManager
) {
  const router = new Hono();

  // GET /status: current debounced static rebuild status & daily cap counters
  router.get('/status', (c) => {
    const status = worker.getPublishStatus();
    return c.json(status);
  });

  // POST /now: trigger manual publish build bypassing the 10-minute debounce window
  router.post('/now', async (c) => {
    try {
      const result = await worker.runPublishStaticSiteJob({ forceNow: true });
      const status = worker.getPublishStatus();
      return c.json({
        ok: true,
        built: result.built,
        reason: result.reason,
        buildsToday: result.buildsToday,
        bundleSummary: result.bundleSummary,
        status,
      });
    } catch (err: any) {
      return c.json(
        {
          error: 'Failed to run static site publish build',
          message: err?.message || String(err),
        },
        500
      );
    }
  });

  // POST /enrich: trigger background enrichment for an entry
  router.post('/enrich', async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      let entryId = body?.entryId;
      if (!entryId && repo) {
        const publicEntries = await repo.listEntries({ visibility: ['public', 'unlisted', 'private'] });
        if (publicEntries.length > 0) {
          entryId = publicEntries[0].id;
        }
      }

      if (!entryId) {
        return c.json({ error: 'entryId is required or an entry must exist in portfolio' }, 400);
      }

      let revisionId = body.revisionId;
      if (!revisionId && repo) {
        const full = await repo.getEntry(entryId);
        revisionId = full?.currentRevision?.id;
      }

      if (!revisionId) {
        return c.json({ error: 'Entry revision not found for enrichment' }, 404);
      }

      if (queueManager) {
        await queueManager.enqueueEnrich({ entryId, revisionId });
      } else {
        // Run asynchronously in background without blocking response
        worker.runEnrichJob(entryId, revisionId).catch((err) => {
          console.error(`[PortfolioWorker] Background enrichment failed for ${entryId}:`, err);
        });
      }

      return c.json({
        ok: true,
        queued: true,
        entryId,
        revisionId,
        message: 'Background enrichment queued successfully',
      });
    } catch (err: any) {
      return c.json(
        {
          error: 'Failed to queue background enrichment',
          message: err?.message || String(err),
        },
        500
      );
    }
  });

  // GET /enrich/status/:entryId: check if enrichment is currently active/pending
  router.get('/enrich/status/:entryId', (c) => {
    const entryId = c.req.param('entryId') || '';
    const pending = worker.isEnrichmentPending(entryId);
    return c.json({
      entryId,
      queued: pending,
    });
  });

  return router;
}
