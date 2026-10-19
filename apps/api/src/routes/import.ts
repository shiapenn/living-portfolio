import { Hono } from 'hono';
import type { IPortfolioRepository } from '@living-portfolio/db';
import { chunkMarkdown } from '@living-portfolio/core';
import { scanForConfidentialData } from '@living-portfolio/ai';
import { AuthManager, sha256Hex } from '../auth/security.js';

export function createImportRoutes(repo: IPortfolioRepository, auth: AuthManager) {
  const router = new Hono();

  // Import Planner estimate (§13.6)
  router.post('/plan', async (c) => {
    const { documents } = await c.req.json();
    if (!Array.isArray(documents)) {
      return c.json({ error: 'Array of documents required' }, 400);
    }

    let totalChars = 0;
    documents.forEach((d: { text: string }) => {
      totalChars += (d.text || '').length;
    });

    const estTokens = Math.ceil(totalChars / 4);
    const freeDailyTokenBudget = 100000;
    const daysWithinFree = Math.max(1, Math.ceil(estTokens / freeDailyTokenBudget));
    const paidFastCostUsd = Number(((estTokens / 1000000) * 0.15).toFixed(2));

    return c.json({
      documentCount: documents.length,
      estimatedTokens: estTokens,
      freePlanEstimate: `About ${daysWithinFree} day${daysWithinFree > 1 ? 's' : ''} within free limits`,
      paidFastEstimate: `Finish in minutes for ~$${paidFastCostUsd}`,
    });
  });

  // Bulk import items (Requires signed redactionPreviewToken per item when publishAsIs is true: Fix 2, B.4, C.4)
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
