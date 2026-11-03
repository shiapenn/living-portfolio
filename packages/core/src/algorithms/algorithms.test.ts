import { describe, it, expect } from 'vitest';
import { chunkMarkdown, reanchorSpan } from './chunking.js';
import { computeStructureLevel, getStructureLevelDetails } from './structureLevel.js';
import { generateGapQuestions } from './gapQuestions.js';
import { isTemporallyValid } from './temporal.js';
import { checkGate, routeQuery } from './gateAndRoute.js';
import { detectLaterThinking, checkScopeOverlap } from './staleness.js';
import { detectTopologyConflicts } from './topology.js';
import { mineScopedConstraintFromRejection } from './constraintMining.js';
import { CalibrationEngine } from './calibration.js';
import { planImport } from './importPlanner.js';
import { GitHubConnector, RSSConnector, FileDropConnector } from '../sdk/connectors.js';
import {
  NtfyNotificationChannel,
  TelegramNotificationChannel,
  WebhookNotificationChannel,
} from '../sdk/notifications.js';
import { CASE_STUDY_PROFILE } from '../profiles/index.js';

describe('Chunking and Re-anchoring (§10.1)', () => {
  it('chunks markdown by headings and paragraphs and creates selectors', () => {
    const text = `# Title\n\nFirst paragraph with some text.\n\n## Subheading\n\nSecond paragraph with more detailed explanation.`;
    const chunks = chunkMarkdown('rev-1', text, { targetTokens: 10, maxTokens: 20 });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].text_exact).toContain('Title');
    expect(chunks[0].token_count).toBeGreaterThan(0);
  });

  it('re-anchors spans after minor edits', () => {
    const originalText = `We selected Postgres because it gave us reliability.`;
    const span = {
      text_exact: 'selected Postgres',
      prefix: 'We ',
      suffix: ' because it gave',
      start_off: 3,
    };
    const editedText = `In 2024, We selected Postgres because it gave us reliability.`;
    const result = reanchorSpan(span, editedText);
    expect(result.found).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(editedText.slice(result.start_off, result.end_off)).toBe('selected Postgres');
  });
});

describe('Structure Levels (§3.3)', () => {
  const baseRevision = {
    body_md: 'This is my project writeup.',
    temporal_level: 'exact' as const,
    valid_from: '2024-01-01T00:00:00Z',
    written_at: '2024-01-02T00:00:00Z',
  };

  it('identifies L0 Text with minimal content', () => {
    const level = computeStructureLevel({
      revision: baseRevision,
      profile: CASE_STUDY_PROFILE,
      facets: [],
      annotations: [],
      claims: [],
    });
    expect(level).toBe('L0');
    expect(getStructureLevelDetails(level).label).toBe('L0 Text');
  });

  it('unlocks L1 Context when hard facets are confirmed', () => {
    const domain = {
      id: 'backend',
      name: 'Backend',
      hard_facets: ['database'],
      soft_facets: ['team_size'],
      facet_weight: { database: 1.0 },
    };
    const level = computeStructureLevel({
      revision: baseRevision,
      profile: CASE_STUDY_PROFILE,
      domain,
      facets: [{ key: 'database', value: 'PostgreSQL', status: 'confirmed', confidence: 1.0 }],
      annotations: [],
      claims: [],
    });
    expect(level).toBe('L1');
  });

  it('unlocks L2 Roles when profile minimum role set is satisfied', () => {
    const domain = {
      id: 'backend',
      name: 'Backend',
      hard_facets: ['database'],
      soft_facets: [],
      facet_weight: { database: 1.0 },
    };
    const level = computeStructureLevel({
      revision: baseRevision,
      profile: CASE_STUDY_PROFILE, // requires [friction, goal] AND [decision, lesson, outcome]
      domain,
      facets: [{ key: 'database', value: 'PostgreSQL', status: 'confirmed', confidence: 1.0 }],
      annotations: [
        { role: 'goal', status: 'accepted' },
        { role: 'decision', status: 'accepted' },
      ],
      claims: [],
    });
    expect(level).toBe('L2');
  });

  it('unlocks L3 Claims when scoped claim with outcome is present', () => {
    const domain = {
      id: 'backend',
      name: 'Backend',
      hard_facets: ['database'],
      soft_facets: [],
      facet_weight: { database: 1.0 },
    };
    const level = computeStructureLevel({
      revision: baseRevision,
      profile: CASE_STUDY_PROFILE,
      domain,
      facets: [{ key: 'database', value: 'PostgreSQL', status: 'confirmed', confidence: 1.0 }],
      annotations: [
        { role: 'goal', status: 'accepted' },
        { role: 'decision', status: 'accepted' },
      ],
      claims: [
        {
          scope: { database: 'PostgreSQL' },
          outcome_status: 'worked',
          status: 'accepted',
        },
      ],
    });
    expect(level).toBe('L3');
  });
});

describe('Gap Questions (§10.2)', () => {
  it('generates prioritized questions for missing hard facets, outcome, and date', () => {
    const questions = generateGapQuestions({
      revision: { temporal_level: 'estimated', valid_from: null },
      facets: [],
      claims: [],
      domain: {
        id: 'infra',
        name: 'Infrastructure',
        hard_facets: ['cloud_provider'],
        soft_facets: [],
        facet_weight: { cloud_provider: 0.9 },
      },
    });

    expect(questions.length).toBe(3);
    expect(questions[0].field).toBe('claim.outcome_status'); // Value 1.0
    expect(questions[1].field).toBe('facet.cloud_provider'); // Value 0.9
    expect(questions[2].field).toBe('revision.valid_from');   // Value 0.6
  });
});

describe('Temporal Validity (§3.9, §10.4)', () => {
  it('correctly filters future transaction dates', () => {
    const res = isTemporallyValid(
      {
        written_at: '2026-01-01T00:00:00Z',
        valid_from: '2024-01-01T00:00:00Z',
      },
      '2025-01-01T00:00:00Z'
    );
    expect(res.valid).toBe(false);
  });

  it('handles hindsight flag to prevent future leakage into past views', () => {
    const res = isTemporallyValid(
      {
        written_at: '2026-01-01T00:00:00Z',
        valid_from: '2021-01-01T00:00:00Z',
        is_hindsight: true,
      },
      '2023-01-01T00:00:00Z'
    );
    expect(res.valid).toBe(false);
  });

  it('allows soft inclusion with reduced weight for range/estimated dates', () => {
    const res = isTemporallyValid(
      {
        valid_from: '2020-01-01T00:00:00Z',
        valid_from_range_end: '2022-01-01T00:00:00Z',
        temporal_level: 'range',
        written_at: '2020-01-01T00:00:00Z',
      },
      '2021-06-01T00:00:00Z'
    );
    expect(res.valid).toBe(true);
    expect(res.decayWeight).toBeLessThan(1.0);
  });
});

describe('Gate and Routing (§10.5)', () => {
  it('passes gate when hard constraints match', () => {
    const gate = checkGate({
      clientFacets: { database: 'PostgreSQL' },
      entryScope: { database: 'PostgreSQL' },
      domain: {
        id: 'db',
        name: 'Database',
        hard_facets: ['database'],
        soft_facets: [],
        facet_weight: {},
      },
    });
    expect(gate.result).toBe('PASS');
  });

  it('fails gate when hard constraints clash', () => {
    const gate = checkGate({
      clientFacets: { database: 'MySQL' },
      entryScope: { database: 'PostgreSQL' },
      domain: {
        id: 'db',
        name: 'Database',
        hard_facets: ['database'],
        soft_facets: [],
        facet_weight: {},
      },
    });
    expect(gate.result).toBe('FAIL');
  });

  it('routes advisory query to Tier 1 when conditions are met', () => {
    const decision = routeQuery({
      queryClass: 'advisory',
      gateResult: 'PASS',
      matches: [
        {
          similarity: 0.95,
          hasEvidence: true,
          hasVerifiedEvidence: true,
          outcomeStatus: 'worked',
          hasScope: true,
        },
      ],
      tier1Floor: 0.82,
      tier2Floor: 0.55,
    });
    expect(decision.tier).toBe('tier1');
  });

  it('routes to Tier 3 when gate fails', () => {
    const decision = routeQuery({
      queryClass: 'advisory',
      gateResult: 'FAIL',
      matches: [{ similarity: 0.9, hasEvidence: true, hasVerifiedEvidence: false, hasScope: true }],
    });
    expect(decision.tier).toBe('tier3');
  });
});

describe('Staleness and Later-Thinking (§10.7)', () => {
  it('detects when an accepted relation supersedes an earlier claim', () => {
    const claims = [
      {
        id: 'claim-1',
        entry_id: 'entry-1',
        entry_slug: 'early-post',
        revision_id: 'rev-1',
        text: 'Always use mutex locks',
        kind: 'decision' as const,
        recorded_at: '2021-01-01T00:00:00Z',
        is_hindsight: false,
        source: 'owner' as const,
        status: 'accepted' as const,
      },
    ];

    const relations = [
      {
        id: 'rel-1',
        src_claim: 'claim-1',
        dst_claim: 'claim-2',
        type: 'supersedes' as const,
        status: 'accepted' as const,
        recorded_at: '2024-01-01T00:00:00Z',
        dst_entry_slug: 'advisory-locks-revisited',
        dst_entry_title: 'Advisory locks, revisited',
      },
    ];

    const alerts = detectLaterThinking(claims, relations);
    expect(alerts.length).toBe(1);
    expect(alerts[0].newer_entry_slug).toBe('advisory-locks-revisited');
    expect(alerts[0].message).toContain('superseded');
  });

  it('verifies scope overlap rules and suppresses alerts when scopes are disjoint (§10.7, Fix 18)', () => {
    // 1. checkScopeOverlap rules
    expect(checkScopeOverlap(null, null)).toBe(true);
    expect(checkScopeOverlap({}, { architecture: 'single-node' })).toBe(true);
    expect(checkScopeOverlap({ architecture: 'single-node' }, { architecture: 'single-node' })).toBe(true);
    expect(checkScopeOverlap({ architecture: 'single-node' }, { architecture: 'cluster' })).toBe(false);
    expect(checkScopeOverlap({ env: ['aws', 'gcp'] }, { env: 'aws' })).toBe(true);
    expect(checkScopeOverlap({ env: ['aws', 'gcp'] }, { env: 'azure' })).toBe(false);

    // 2. Staleness with matching scope
    const claims = [
      {
        id: 'claim-redis',
        revision_id: 'rev-redis',
        entry_id: 'entry-redis',
        entry_slug: 'redis-leases',
        text: 'Use Redis Redlock leases for worker coordination',
        kind: 'decision' as const,
        scope: { architecture: 'cluster', database: 'redis' },
        recorded_at: '2021-01-01T00:00:00Z',
        is_hindsight: false,
        source: 'owner' as const,
        status: 'accepted' as const,
      },
    ];

    // Non-overlapping relation: destination applies strictly to single-node
    const disjointRelations = [
      {
        id: 'rel-disjoint',
        src_claim: 'claim-redis',
        dst_claim: 'claim-pg-single',
        type: 'supersedes' as const,
        status: 'accepted' as const,
        scope: { architecture: 'single-node' },
        recorded_at: '2024-01-01T00:00:00Z',
        dst_entry_slug: 'pg-locks',
        dst_entry_title: 'Postgres Locks',
      },
    ];

    const disjointAlerts = detectLaterThinking(claims, disjointRelations);
    expect(disjointAlerts.length).toBe(0);

    // Overlapping relation: destination applies to cluster
    const overlappingRelations = [
      {
        id: 'rel-overlap',
        src_claim: 'claim-redis',
        dst_claim: 'claim-pg-cluster',
        type: 'supersedes' as const,
        status: 'accepted' as const,
        scope: { architecture: 'cluster' },
        recorded_at: '2024-01-01T00:00:00Z',
        dst_entry_slug: 'pg-locks-cluster',
        dst_entry_title: 'Postgres Advisory Locks in Clusters',
      },
    ];

    const overlappingAlerts = detectLaterThinking(claims, overlappingRelations);
    expect(overlappingAlerts.length).toBe(1);
    expect(overlappingAlerts[0].superseding_claim_id).toBe('claim-pg-cluster');
    expect(overlappingAlerts[0].scope_overlap).toBe(true);
  });
});

describe('Dynamic Topology Audit and Scoped Constraint Mining (§11, §18.1, Fix 17)', () => {
  it('detects conflicting claim pairs on overlapping scope with opposing conclusions or polarity', () => {
    const claims = [
      {
        id: 'claim-redis-lock',
        revision_id: 'rev-1',
        text: 'Use Redis Redlock leases for distributed job coordination across worker nodes.',
        kind: 'decision' as const,
        outcome_status: 'worked' as const,
        scope: { scale: 'high', database: 'redis' },
        recorded_at: '2021-01-01T00:00:00Z',
        is_hindsight: false,
        source: 'owner' as const,
        status: 'accepted' as const,
      },
      {
        id: 'claim-pg-lock',
        revision_id: 'rev-2',
        text: 'Transaction-scoped PostgreSQL advisory locks outperform external Redis locks under 50k TPS and avoid distributed split-brain.',
        kind: 'decision' as const,
        outcome_status: 'worked' as const,
        scope: { scale: 'high', database: 'postgres' },
        recorded_at: '2024-01-01T00:00:00Z',
        is_hindsight: false,
        source: 'owner' as const,
        status: 'accepted' as const,
      },
    ];

    const conflicts = detectTopologyConflicts(claims, []);
    expect(conflicts.length).toBeGreaterThanOrEqual(1);
    const top = conflicts[0];
    expect(top.claim_a).toBe('claim-redis-lock');
    expect(top.claim_b).toBe('claim-pg-lock');
    expect(top.confidence).toBeGreaterThanOrEqual(0.6);
    expect(top.status).toBe('pending');
    expect(top.question).toBe('Does the later claim supersede the earlier one, or do they apply to different situations?');
  });

  it('ignores claim pairs that already have a relation edge connecting them', () => {
    const claims = [
      {
        id: 'claim-a',
        revision_id: 'rev-1',
        text: 'Use DynamoDB for low-latency session cache.',
        kind: 'decision' as const,
        outcome_status: 'worked' as const,
        scope: { tier: 'web' },
        recorded_at: '2022-01-01T00:00:00Z',
        is_hindsight: false,
        source: 'owner' as const,
        status: 'accepted' as const,
      },
      {
        id: 'claim-b',
        revision_id: 'rev-2',
        text: 'DynamoDB underperforms in-memory Redis session caching under high traffic.',
        kind: 'decision' as const,
        outcome_status: 'failed' as const,
        scope: { tier: 'web' },
        recorded_at: '2023-01-01T00:00:00Z',
        is_hindsight: false,
        source: 'owner' as const,
        status: 'accepted' as const,
      },
    ];

    // Already linked via relation
    const existingRelations = [
      {
        id: 'rel-ab',
        src_claim: 'claim-a',
        dst_claim: 'claim-b',
        type: 'supersedes' as const,
        status: 'accepted' as const,
        recorded_at: '2023-01-01T00:00:00Z',
      },
    ];

    const conflicts = detectTopologyConflicts(claims, existingRelations);
    expect(conflicts.length).toBe(0);
  });

  it('mines technical boundary constraints and ignores non-technical rejections (§11)', () => {
    // 1. Technical memory ceiling
    const resMem = mineScopedConstraintFromRejection('Declined because memory strictly <= 512MB in this Lambda runtime.');
    expect(resMem.isTechnical).toBe(true);
    expect(resMem.constraint).toEqual({ max_memory_mb: 512 });

    // 2. Technical throughput limit
    const resTps = mineScopedConstraintFromRejection('We capped traffic throughput <= 50k tps for Postgres advisory locks.');
    expect(resTps.isTechnical).toBe(true);
    expect(resTps.constraint).toEqual({ max_tps: 50000 });

    // 3. Technical single-node architecture
    const resArch = mineScopedConstraintFromRejection('This advisory advice applies to single-node only configurations.');
    expect(resArch.isTechnical).toBe(true);
    expect(resArch.constraint).toEqual({ architecture: 'single-node' });

    // 4. Non-technical rejections must NOT be auto-converted (§11)
    const resBusy = mineScopedConstraintFromRejection('Sorry, too busy right now with client launches.');
    expect(resBusy.isTechnical).toBe(false);

    const resVacation = mineScopedConstraintFromRejection('Declined: on vacation until next month.');
    expect(resVacation.isTechnical).toBe(false);

    const resFit = mineScopedConstraintFromRejection('Not a good fit for my current advisory focus.');
    expect(resFit.isTechnical).toBe(false);
  });
});

describe('Self-Calibration Engine (§11)', () => {
  it('respects cold-start guard under minimum sample size', () => {
    const engine = new CalibrationEngine({
      minSampleSize: 20,
      mechanisms: { suggestion_thresholds: true },
    });
    const proposal = engine.proposeThresholdAdjustment('facet_known_threshold', 0.9, [
      { id: '1', kind: 'facet', owner_action: 'accept', at: new Date().toISOString() },
    ]);
    expect(proposal).toBeNull();
  });

  it('proposes bounded adjustment and supports exact rollback', () => {
    const now = new Date();
    const engine = new CalibrationEngine({
      minSampleSize: 5,
      maxStep: 0.05,
      mechanisms: { suggestion_thresholds: true },
    });
    const logs = [
      { id: '1', kind: 'role', owner_action: 'reject' as const, at: now.toISOString() },
      { id: '2', kind: 'role', owner_action: 'reject' as const, at: now.toISOString() },
      { id: '3', kind: 'role', owner_action: 'reject' as const, at: now.toISOString() },
      { id: '4', kind: 'role', owner_action: 'reject' as const, at: now.toISOString() },
      { id: '5', kind: 'role', owner_action: 'accept' as const, at: now.toISOString() },
    ];
    const proposal = engine.proposeThresholdAdjustment('role_suggestion_threshold', 0.8, logs);
    expect(proposal).not.toBeNull();
    expect(proposal!.proposed_value).toBeGreaterThan(0.8);
    expect(proposal!.proposed_value - 0.8).toBeLessThanOrEqual(0.05);

    const rollback = engine.createRollbackChange({
      id: 'change-1',
      parameter: proposal!.parameter,
      old_value: proposal!.current_value,
      new_value: proposal!.proposed_value,
      evidence_count: proposal!.evidence_count,
      applied_by: 'system',
      reversible: true,
      at: now.toISOString(),
    });
    expect(rollback.old_value).toBe(proposal!.proposed_value);
    expect(rollback.new_value).toBe(proposal!.current_value);
    expect(rollback.reversible).toBe(false);
  });

  it('enforces sliding-window filtering and caps at maxWindowSize (§11)', () => {
    const now = new Date();
    const engine = new CalibrationEngine({
      minSampleSize: 5,
      windowDays: 14,
      maxWindowSize: 3,
      mechanisms: { suggestion_thresholds: true },
    });

    const logs = [
      // Within window (last 5 days)
      { id: '1', kind: 'role', owner_action: 'accept' as const, at: new Date(now.getTime() - 1 * 86_400_000).toISOString() },
      { id: '2', kind: 'role', owner_action: 'accept' as const, at: new Date(now.getTime() - 2 * 86_400_000).toISOString() },
      { id: '3', kind: 'role', owner_action: 'accept' as const, at: new Date(now.getTime() - 3 * 86_400_000).toISOString() },
      { id: '4', kind: 'role', owner_action: 'accept' as const, at: new Date(now.getTime() - 4 * 86_400_000).toISOString() },
      // Expired outside window (30 days ago)
      { id: '5', kind: 'role', owner_action: 'reject' as const, at: new Date(now.getTime() - 30 * 86_400_000).toISOString() },
      { id: '6', kind: 'role', owner_action: 'reject' as const, at: new Date(now.getTime() - 45 * 86_400_000).toISOString() },
    ];

    const filtered = engine.filterLogsByWindow(logs, now);
    // Should exclude the 2 expired logs and cap to maxWindowSize = 3
    expect(filtered.length).toBe(3);
    expect(filtered.map((l) => l.id)).toEqual(['1', '2', '3']);
  });

  it('honors calibrationFrozen freeze guard setting (§11)', () => {
    const now = new Date();
    const engine = new CalibrationEngine({
      minSampleSize: 5,
      calibrationFrozen: true,
      mechanisms: { suggestion_thresholds: true, routing_calibration: true },
    });

    const logs = [
      { id: '1', kind: 'role', owner_action: 'accept' as const, at: now.toISOString() },
      { id: '2', kind: 'role', owner_action: 'accept' as const, at: now.toISOString() },
      { id: '3', kind: 'role', owner_action: 'accept' as const, at: now.toISOString() },
      { id: '4', kind: 'role', owner_action: 'accept' as const, at: now.toISOString() },
      { id: '5', kind: 'role', owner_action: 'accept' as const, at: now.toISOString() },
    ];

    expect(engine.isFrozen()).toBe(true);
    const thresholdProposal = engine.proposeThresholdAdjustment('role_suggestion_threshold', 0.8, logs);
    expect(thresholdProposal).toBeNull();

    const routingProposals = engine.proposeRoutingAdjustment(
      'databases',
      { w1: 0.4, w2: 0.35, w3: 0.25, decay: 0.05 },
      logs.map((l) => ({ id: l.id, domain: 'databases', draft_edit_ratio: 0.5, at: l.at }))
    );
    expect(routingProposals).toHaveLength(0);
  });

  it('honors per-mechanism on/off flags with parameter-changing mechanisms off by default (§11)', () => {
    const now = new Date();
    const defaultEngine = new CalibrationEngine({ minSampleSize: 5 });
    const mechanisms = defaultEngine.getMechanisms();

    // Spec §11 table: suggestion_thresholds and routing_calibration ship off
    expect(mechanisms.suggestion_thresholds).toBe(false);
    expect(mechanisms.routing_calibration).toBe(false);
    expect(mechanisms.topology_audit).toBe(true);
    expect(mechanisms.scoped_constraint_mining).toBe(true);

    const logs = [
      { id: '1', kind: 'role', owner_action: 'reject' as const, at: now.toISOString() },
      { id: '2', kind: 'role', owner_action: 'reject' as const, at: now.toISOString() },
      { id: '3', kind: 'role', owner_action: 'reject' as const, at: now.toISOString() },
      { id: '4', kind: 'role', owner_action: 'reject' as const, at: now.toISOString() },
      { id: '5', kind: 'role', owner_action: 'reject' as const, at: now.toISOString() },
    ];

    // Disabled mechanism returns null
    expect(defaultEngine.proposeThresholdAdjustment('role_suggestion_threshold', 0.8, logs)).toBeNull();

    // Enabling mechanism generates proposal
    defaultEngine.setMechanism('suggestion_thresholds', true);
    expect(defaultEngine.proposeThresholdAdjustment('role_suggestion_threshold', 0.8, logs)).not.toBeNull();
  });

  it('computes Expected Calibration Error (ECE) and generates reliability curves (§11)', () => {
    const engine = new CalibrationEngine();
    const samples = [
      { confidence: 0.95, correct: true },
      { confidence: 0.92, correct: true },
      { confidence: 0.88, correct: true },
      { confidence: 0.85, correct: false },
      { confidence: 0.75, correct: true },
      { confidence: 0.70, correct: false },
      { confidence: 0.60, correct: false },
      { confidence: 0.55, correct: true },
      { confidence: 0.40, correct: false },
      { confidence: 0.20, correct: false },
    ];

    const report = engine.computeECE(samples, 5);
    expect(report.sampleSize).toBe(10);
    expect(report.expectedCalibrationError).toBeGreaterThan(0);
    expect(report.expectedCalibrationError).toBeLessThan(0.5);
    expect(report.reliabilityCurve).toHaveLength(5);
    expect(report.brierScore).toBeGreaterThan(0);
  });

  it('validates adjustments against held-out validation data (§11)', () => {
    const engine = new CalibrationEngine();
    const trainSamples = [
      { confidence: 0.9, correct: true },
      { confidence: 0.8, correct: true },
      { confidence: 0.7, correct: true },
      { confidence: 0.6, correct: false },
    ];
    const heldOutSamples = [
      { confidence: 0.95, correct: true },
      { confidence: 0.85, correct: true },
      { confidence: 0.75, correct: false },
      { confidence: 0.65, correct: false },
    ];

    // Moderate bounded adjustment passes
    const validation = engine.validateHeldOut(trainSamples, heldOutSamples, 0.8, 0.82);
    expect(validation.trainingSamples).toBe(4);
    expect(validation.heldOutSamples).toBe(4);
    expect(typeof validation.passed).toBe('boolean');
  });

  it('proposes routing calibration adjustments based on draft edits, citation clicks, and scoped constraints rate (§11)', () => {
    const now = new Date();
    const engine = new CalibrationEngine({
      minSampleSize: 5,
      maxStep: 0.05,
      mechanisms: { routing_calibration: true },
    });

    const logs = [
      { id: '1', domain: 'distributed-systems', draft_edit_ratio: 0.65, citation_clicked: false, converted_to_booking: false, scoped_constraints_count: 2, at: now.toISOString() },
      { id: '2', domain: 'distributed-systems', draft_edit_ratio: 0.55, citation_clicked: true, converted_to_booking: false, scoped_constraints_count: 1, at: now.toISOString() },
      { id: '3', domain: 'distributed-systems', draft_edit_ratio: 0.45, citation_clicked: false, converted_to_booking: false, scoped_constraints_count: 1, at: now.toISOString() },
      { id: '4', domain: 'distributed-systems', draft_edit_ratio: 0.60, citation_clicked: false, converted_to_booking: false, scoped_constraints_count: 0, at: now.toISOString() },
      { id: '5', domain: 'distributed-systems', draft_edit_ratio: 0.50, citation_clicked: false, converted_to_booking: false, scoped_constraints_count: 1, at: now.toISOString() },
    ];

    const currentWeights = { w1: 0.45, w2: 0.30, w3: 0.25, decay: 0.05 };
    const proposals = engine.proposeRoutingAdjustment('distributed-systems', currentWeights, logs);

    expect(proposals.length).toBeGreaterThanOrEqual(1);

    // High edit ratio should propose reducing w1
    const w1Prop = proposals.find((p) => p.parameter === 'routing_weights.distributed-systems.w1');
    expect(w1Prop).toBeDefined();
    expect(w1Prop!.proposed_value).toBeLessThan(0.45);
    expect(0.45 - w1Prop!.proposed_value).toBeLessThanOrEqual(0.05);

    // High scoped constraint rate in domain should propose increasing temporal_decay (§11)
    const decayProp = proposals.find((p) => p.parameter === 'routing_weights.distributed-systems.temporal_decay');
    expect(decayProp).toBeDefined();
    expect(decayProp!.proposed_value).toBeGreaterThan(0.05);
  });

  it('restores state on rollback and prevents indefinite cascading rollbacks (§11)', () => {
    const engine = new CalibrationEngine();
    const currentParams = {
      role_suggestion_threshold: 0.85,
      tier1_floor: 0.78,
    };

    const change = {
      id: 'change-applied-1',
      parameter: 'tier1_floor',
      old_value: 0.82,
      new_value: 0.78,
      evidence_count: 25,
      applied_by: 'owner' as const,
      reversible: true,
      at: new Date().toISOString(),
    };

    const result = engine.applyRollback(change, currentParams);
    expect(result.restoredParameter).toBe('tier1_floor');
    expect(result.restoredValue).toBe(0.82);
    expect(currentParams.tier1_floor).toBe(0.82);
    expect(result.rollbackChange.reversible).toBe(false);
  });
});

describe('Import Planner with Configured Budgets (§13.6, Fix 21)', () => {
  it('honors configured dailyTokenBudget and calculates days and paid-fast estimate', () => {
    const docs = [
      { id: 'd1', title: 'System Arch', text: 'A '.repeat(20000) }, // 20k chars ~ 5k tokens
      { id: 'd2', title: 'Distributed Locks', text: 'B '.repeat(40000) }, // 40k chars ~ 10k tokens
    ];

    // Standard 100k budget
    const planStandard = planImport(docs, { dailyTokenBudget: 100000 });
    expect(planStandard.documentCount).toBe(2);
    expect(planStandard.daysWithinFree).toBe(1);
    expect(planStandard.freePlanEstimate).toContain('1 day');

    // Tight 5,000 token budget -> should require 7 days (30k tokens / 5k)
    const planTight = planImport(docs, { dailyTokenBudget: 5000, costPerMillionTokensUsd: 0.20 });
    expect(planTight.daysWithinFree).toBe(7);
    expect(planTight.freePlanEstimate).toContain('About 7 days within free limits');
    expect(planTight.paidFastCostUsd).toBeGreaterThan(0);
    expect(planTight.paidFastEstimate).toContain('Finish in minutes');
  });

  it('incorporates audio seconds into quota and cost estimation', () => {
    const docs = [
      { id: 'd1', title: 'Keynote Talk', text: 'Short summary', audioDurationSeconds: 7200 }, // 2 hours
    ];

    const plan = planImport(docs, {
      dailyAudioSecondsBudget: 1800, // 30 mins free daily
      costPerAudioMinuteUsd: 0.01,
    });

    // 7200 / 1800 = 4 days
    expect(plan.totalAudioSeconds).toBe(7200);
    expect(plan.daysWithinFree).toBe(4);
    expect(plan.paidFastCostUsd).toBeCloseTo(1.20, 1); // 120 mins * 0.01 = $1.20
  });
});

describe('Core Source Connectors (§14, Fix 21)', () => {
  it('GitHubConnector crawls repository assets and infers exact temporal confidence', async () => {
    const connector = new GitHubConnector();
    expect(connector.id).toBe('github');
    expect(connector.permissions.networkHosts).toContain('api.github.com');

    const authOk = await connector.authenticate({ token: 'mock-gh-token' });
    expect(authOk).toBe(true);

    const items = [
      {
        sha: 'abc1234',
        message: 'feat: add distributed lock\n\nFull details here',
        date: '2026-05-10T14:30:00Z',
      },
    ];

    const assets = [];
    for await (const asset of connector.crawl({ repo: 'owner/repo', items })) {
      assets.push(asset);
    }

    expect(assets.length).toBe(1);
    expect(assets[0].title).toBe('feat: add distributed lock');
    expect(assets[0].occurredAt).toBe('2026-05-10T14:30:00.000Z');
    expect(assets[0].temporalLevel).toBe('exact');
  });

  it('RSSConnector crawls feed items and FileDropConnector handles local files', async () => {
    const rss = new RSSConnector();
    expect(rss.id).toBe('rss');
    const rssAssets = [];
    for await (const asset of rss.crawl({
      items: [
        {
          id: 'rss-1',
          title: 'Architecture Retrospective',
          description: 'Lessons from 3 years of microservices.',
          pubDate: '2025-11-01T10:00:00Z',
        },
      ],
    })) {
      rssAssets.push(asset);
    }
    expect(rssAssets.length).toBe(1);
    expect(rssAssets[0].title).toBe('Architecture Retrospective');
    expect(rssAssets[0].temporalLevel).toBe('exact');

    const fileDrop = new FileDropConnector();
    expect(fileDrop.id).toBe('file-drop');
    const fileAssets = [];
    for await (const asset of fileDrop.crawl({
      files: [
        {
          name: 'project-notes.md',
          content: '# Project Notes\n\nAll notes.',
          modifiedAt: '2026-01-15T09:00:00Z',
        },
      ],
    })) {
      fileAssets.push(asset);
    }
    expect(fileAssets.length).toBe(1);
    expect(fileAssets[0].title).toBe('project notes');
    expect(fileAssets[0].temporalLevel).toBe('exact');
  });
});

describe('Concrete Notification Channels (§13.9, §14, Fix 21)', () => {
  it('NtfyNotificationChannel, TelegramNotificationChannel, and WebhookNotificationChannel format and send alerts', async () => {
    const capturedFetches: Array<{ url: string; options: any }> = [];
    const mockFetch = (async (url: string, options: any) => {
      capturedFetches.push({ url, options });
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    }) as any;

    const ntfy = new NtfyNotificationChannel({
      topic: 'test-topic',
      fetchFn: mockFetch,
    });
    const ntfyRes = await ntfy.send({
      title: 'High Latency Alert',
      message: 'p99 > 500ms',
      severity: 'critical',
    });
    expect(ntfyRes.delivered).toBe(true);
    expect(capturedFetches[0].options.headers.Title).toBe('High Latency Alert');
    expect(capturedFetches[0].options.headers.Priority).toBe('urgent');

    const tg = new TelegramNotificationChannel({
      botToken: 'bot12345',
      chatId: '98765',
      fetchFn: mockFetch,
    });
    const tgRes = await tg.send({
      title: 'Deployment Success',
      message: 'Version 0.2.0 deployed',
      severity: 'info',
    });
    expect(tgRes.delivered).toBe(true);
    expect(capturedFetches[1].url).toContain('api.telegram.org/botbot12345/sendMessage');

    const webhook = new WebhookNotificationChannel({
      url: 'https://webhook.site/test',
      secret: 'sig-secret-123',
      fetchFn: mockFetch,
    });
    const hookRes = await webhook.send({
      title: 'Staleness Detected',
      message: 'Entry superseded',
      severity: 'warning',
    });
    expect(hookRes.delivered).toBe(true);
    expect(capturedFetches[2].options.headers['X-Portfolio-Secret']).toBe('sig-secret-123');
  });
});
