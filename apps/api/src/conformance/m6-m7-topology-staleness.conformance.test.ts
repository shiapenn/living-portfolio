import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../app.js';
import { InMemoryPortfolioRepository } from '@living-portfolio/db';

describe('WP-10.4: Dynamic Topology Audit & Staleness Scope Overlap (Findings M6, M7 / Fix 17, Fix 18, §10.7, §11, §18.1)', () => {
  let repo: InMemoryPortfolioRepository;
  let app: ReturnType<typeof createApp>['app'];
  let adminToken: string;
  let authHeaders: Record<string, string>;

  beforeEach(async () => {
    repo = new InMemoryPortfolioRepository();
    const created = createApp(repo, { bootstrapAdminToken: 'test-admin-wp10-4' });
    app = created.app;
    adminToken = created.adminToken;
    authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };
  });

  it('1. GET /api/audit/topology-conflicts?live=true dynamically detects conflicting claim pairs without creating edges (§11, Fix 17)', async () => {
    // 1. Seed two entries with conflicting claims
    const { entry: entry1, revision: rev1 } = await repo.createEntry(
      { slug: 'distributed-redis-locks', title: 'Distributed Redis Locks', visibility: 'public' },
      { body: 'We used Redis Redlock leases across all worker nodes.', written_at: '2021-01-01T00:00:00Z' }
    );
    await repo.saveClaim({
      revision_id: rev1.id,
      text: 'Use Redis Redlock leases for distributed job coordination across worker nodes.',
      kind: 'decision',
      outcome_status: 'worked',
      scope: { task: 'coordination', scale: 'under-50k-tps', database: 'redis' },
      is_hindsight: false,
      source: 'owner',
      status: 'accepted',
    });

    const { entry: entry2, revision: rev2 } = await repo.createEntry(
      { slug: 'postgres-advisory-locks', title: 'PostgreSQL Advisory Locks', visibility: 'public' },
      { body: 'Advisory locks in Postgres avoid split-brain under 50k TPS.', written_at: '2024-01-01T00:00:00Z' }
    );
    await repo.saveClaim({
      revision_id: rev2.id,
      text: 'Transaction-scoped PostgreSQL advisory locks outperform external Redis locks under 50k TPS and avoid distributed split-brain.',
      kind: 'decision',
      outcome_status: 'worked',
      scope: { task: 'coordination', scale: 'under-50k-tps', database: 'postgres' },
      is_hindsight: false,
      source: 'owner',
      status: 'accepted',
    });

    // 2. Fetch live topology conflicts
    const res = await app.request('/api/audit/topology-conflicts?live=true', {
      headers: authHeaders,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.detector).toBe('automated');
    expect(body.conflicts.length).toBeGreaterThanOrEqual(1);

    const topConflict = body.conflicts[0];
    expect(topConflict.question).toBe('Does the later claim supersede the earlier one, or do they apply to different situations?');
    expect(topConflict.status).toBe('pending');

    // 3. Verify owner-only write invariant: NO relation edges were created
    const acceptedRelations = await repo.listAcceptedRelations();
    expect(acceptedRelations.length).toBe(0);
  });

  it('2. Owner-Only Write Test (§18.1): neither topology audit nor constraint mining writes an active relation or confirmed constraint without owner action', async () => {
    // 1. Seed escalation in inbox
    const esc = await repo.saveEscalation({
      thread_id: 'thread-audit-write-test',
      status: 'pending',
      visitor_name: 'Alex',
      visitor_contact: 'alex@example.com',
      query: 'Can you consult on running this at 100k TPS on single-node?',
      facets: { service: 'payments', architecture: 'single-node' },
    });

    // 2. Reject with technical constraint statement
    const rejectRes = await app.request(`/api/inbox/${esc.id}/reject`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        reason: 'Declined because our memory strictly <= 512MB in this runtime and traffic throughput <= 50k tps.',
      }),
    });
    expect(rejectRes.status).toBe(200);
    const rejectBody = await rejectRes.json();
    expect(rejectBody.minedConstraint).toBe(true);

    // 3. Verify the mined constraint is strictly 'proposed' - NEVER 'confirmed'
    const allConstraints = await repo.getScopedConstraints();
    expect(allConstraints.length).toBe(1);
    expect(allConstraints[0].status).toBe('proposed');
    expect(allConstraints[0].status).not.toBe('confirmed');

    // 4. Verify no active/confirmed constraints exist
    const confirmedConstraints = await repo.getScopedConstraints('confirmed');
    expect(confirmedConstraints.length).toBe(0);

    // 5. Explicit owner confirmation is required to activate
    const confirmRes = await app.request(`/api/audit/scoped-constraints/${allConstraints[0].id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ status: 'confirmed' }),
    });
    expect(confirmRes.status).toBe(200);

    const activeNow = await repo.getScopedConstraints('confirmed');
    expect(activeNow.length).toBe(1);
    expect(activeNow[0].status).toBe('confirmed');
  });

  it('3. POST /api/audit/topology-conflicts/:id/resolve creates accepted relation edge and triggers staleness recompute upon owner action (§11, §10.7, Fix 17, Fix 18)', async () => {
    // 1. Seed earlier and later claims
    const { entry: entryA, revision: revA } = await repo.createEntry(
      { slug: 'old-service', title: 'Old Service', visibility: 'public' },
      { body: 'Old content', written_at: '2021-01-01T00:00:00Z' }
    );
    const claimA = await repo.saveClaim({
      revision_id: revA.id,
      text: 'Original locking architecture using Redis leases.',
      kind: 'decision',
      outcome_status: 'worked',
      scope: { domain: 'concurrency', cluster: 'yes' },
      is_hindsight: false,
      source: 'owner',
      status: 'accepted',
    });

    const { entry: entryB, revision: revB } = await repo.createEntry(
      { slug: 'new-service', title: 'New Service', visibility: 'public' },
      { body: 'New content', written_at: '2024-01-01T00:00:00Z' }
    );
    const claimB = await repo.saveClaim({
      revision_id: revB.id,
      text: 'Postgres advisory locking completely supersedes Redis leases in cluster environments.',
      kind: 'decision',
      outcome_status: 'worked',
      scope: { domain: 'concurrency', cluster: 'yes' },
      is_hindsight: false,
      source: 'owner',
      status: 'accepted',
    });

    // 2. Owner resolves conflict by creating 'supersedes' relation
    const resolveRes = await app.request('/api/audit/topology-conflicts/topo-test-1/resolve', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        resolution: 'supersedes',
        claim_a: claimA.id,
        claim_b: claimB.id,
        overlap: { domain: 'concurrency', cluster: 'yes' },
      }),
    });
    expect(resolveRes.status).toBe(200);
    const resolveBody = await resolveRes.json();
    expect(resolveBody.resolved).toBe(true);
    expect(resolveBody.stalenessRecomputed).toBe(true);
    expect(resolveBody.relation.type).toBe('supersedes');
    expect(resolveBody.relation.status).toBe('accepted');

    // 3. Verify that entryA now shows the later-thinking banner with link to new-service
    const entryRes = await app.request(`/api/entries/${entryA.slug}`);
    expect(entryRes.status).toBe(200);
    const entryData = await entryRes.json();
    expect(entryData.laterThinkingAlerts.length).toBe(1);
    expect(entryData.laterThinkingAlerts[0].newer_entry_slug).toBe('new-service');
    expect(entryData.laterThinkingAlerts[0].message).toContain('superseded in "New Service"');
  });

  it('4. Scope-overlap staleness detector suppresses banner when scopes are disjoint (§10.7, Fix 18)', async () => {
    // 1. Seed source entry and claim (applies to single-node)
    const { entry, revision: rev } = await repo.createEntry(
      { slug: 'sqlite-embedded', title: 'SQLite Embedded', visibility: 'public' },
      { body: 'SQLite for single node', written_at: '2022-01-01T00:00:00Z' }
    );
    const claim = await repo.saveClaim({
      revision_id: rev.id,
      text: 'SQLite is the best zero-ops embedded database for single-node tools.',
      kind: 'decision',
      outcome_status: 'worked',
      scope: { architecture: 'single-node' },
      is_hindsight: false,
      source: 'owner',
      status: 'accepted',
    });

    // 2. Destination claim applies to cluster (disjoint architecture)
    const { entry: newerEntry, revision: newerRev } = await repo.createEntry(
      { slug: 'cockroachdb-cluster', title: 'CockroachDB Cluster', visibility: 'public' },
      { body: 'Cockroach for distributed clusters', written_at: '2024-01-01T00:00:00Z' }
    );
    const newerClaim = await repo.saveClaim({
      revision_id: newerRev.id,
      text: 'CockroachDB replaces relational databases for distributed cluster operations.',
      kind: 'decision',
      outcome_status: 'worked',
      scope: { architecture: 'cluster' },
      is_hindsight: false,
      source: 'owner',
      status: 'accepted',
    });

    // 3. Create relation between them with scope { architecture: 'cluster' }
    await repo.saveRelation({
      src_claim: claim.id,
      dst_claim: newerClaim.id,
      type: 'supersedes',
      status: 'accepted',
      scope: { architecture: 'cluster' },
    });

    // 4. Query entry: since scopes are disjoint (single-node vs cluster), banner should be suppressed!
    const res = await app.request(`/api/entries/${entry.slug}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.laterThinkingAlerts.length).toBe(0);

    // 5. Now update relation scope to overlap { architecture: 'single-node' }
    const rels = await repo.getRelationsForClaim(claim.id);
    expect(rels.length).toBe(1);

    const patchRes = await app.request(`/api/structure/relations/${rels[0].id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({
        scope: { architecture: 'single-node' },
      }),
    });
    expect(patchRes.status).toBe(200);

    // 6. Query entry again: now that scope overlaps, laterThinking banner appears!
    const res2 = await app.request(`/api/entries/${entry.slug}`);
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.laterThinkingAlerts.length).toBe(1);
    expect(data2.laterThinkingAlerts[0].newer_entry_slug).toBe('cockroachdb-cluster');
  });
});
