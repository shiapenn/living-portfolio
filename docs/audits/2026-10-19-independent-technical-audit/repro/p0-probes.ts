/**
 * Reproducible P0 Audit Probes for AUD-2026-10-19 (DR-AUD-001 AUD-02, AUD-15)
 *
 * These probes reproduce the exact P0 findings described in
 * `docs/audits/2026-10-19-independent-technical-audit/report.md` (§5 & Appendix).
 * Promoted to regression tests in `apps/api/src/conformance/p0-probes.conformance.test.ts`.
 */
import { createApp } from '../../../../apps/api/src/app.js';
import { seedDemoPortfolio } from '../../../../packages/db/src/index.js';
import { verifyAnswerBeforeDelivery } from '../../../../packages/ai/src/index.js';
import { checkGate } from '../../../../packages/core/src/index.js';

export async function runAuditP0Probes() {
  const { app, repo } = createApp();
  await seedDemoPortfolio(repo);

  const results: Record<string, { reproducedDefect: boolean; detail: string }> = {};

  // Probe S1: Unauthenticated read of private NDA entry & visibility=all
  const listAllRes = await app.request('/api/entries?visibility=all');
  const privateEntryRes = await app.request('/api/entries/private-nda-architecture-notes');
  results.S1 = {
    reproducedDefect: listAllRes.status === 200 && privateEntryRes.status === 200,
    detail: `GET /api/entries?visibility=all -> ${listAllRes.status}; GET /api/entries/private-nda-architecture-notes -> ${privateEntryRes.status}`,
  };

  // Probe S2: Unauthenticated mutation of private entry to public, leaking into /api/ask
  const privateData = await privateEntryRes.json();
  const putRes = await app.request(`/api/entries/${privateData.entry.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visibility: 'public' }),
  });
  const askRes = await app.request('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'Project Titan sharding topology' }),
  });
  const askBody = await askRes.json();
  const citedPrivate = (askBody.citations ?? []).some((c: any) =>
    String(c.entrySlug || c.title || '').toLowerCase().includes('titan') ||
    String(c.entrySlug || '').includes('private-nda')
  );
  results.S2 = {
    reproducedDefect: putRes.status === 200 && citedPrivate,
    detail: `PUT visibility=public -> ${putRes.status}; cited in /api/ask -> ${citedPrivate}`,
  };

  // Probe S4: Rate limit bypass by rotating client-supplied session_id
  let succeededRequests = 0;
  for (let i = 0; i < 15; i++) {
    const r = await app.request('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'What did you build?', session_id: `rotated-session-${i}` }),
    });
    if (r.status === 200) succeededRequests++;
  }
  results.S4 = {
    reproducedDefect: succeededRequests > 10,
    detail: `${succeededRequests}/15 requests succeeded despite 10/hr visitor limit by rotating session_id`,
  };

  // Probe G1: checkGate ignores unknown hard facets on the entry side
  const gateResult = checkGate({
    clientFacets: { database: 'PostgreSQL', stack: 'Node.js' },
    entryScope: {}, // entry has no known database/stack facets
    domain: { name: 'Systems', hard_facets: ['database', 'stack'], soft_facets: [] },
  });
  results.G1 = {
    reproducedDefect: gateResult.result === 'PASS',
    detail: `checkGate with missing entry-side hard facets returned ${gateResult.result} instead of INDETERMINATE`,
  };

  // Probe G5: Anachronism detected in verifier but still present in verifiedText
  const verification = verifyAnswerBeforeDelivery({
    draftText: 'In 2025 we migrated the cluster to PostgreSQL 17.',
    citedSpans: [{ id: 'span-1', text_exact: 'In 2025 we migrated the cluster to PostgreSQL 17.' } as any],
    visitorFacets: {},
    citedScopes: [],
    asOfDate: '2021-06-01T00:00:00Z',
  });
  results.G5 = {
    reproducedDefect: verification.anachronismDetected && verification.verifiedText.includes('2025'),
    detail: `anachronismDetected=${verification.anachronismDetected}, verifiedText still contains '2025'=${verification.verifiedText.includes('2025')}`,
  };

  return results;
}
