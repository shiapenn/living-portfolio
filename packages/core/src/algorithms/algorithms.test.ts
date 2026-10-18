import { describe, it, expect } from 'vitest';
import { chunkMarkdown, reanchorSpan } from './chunking.js';
import { computeStructureLevel, getStructureLevelDetails } from './structureLevel.js';
import { generateGapQuestions } from './gapQuestions.js';
import { isTemporallyValid } from './temporal.js';
import { checkGate, routeQuery } from './gateAndRoute.js';
import { detectLaterThinking } from './staleness.js';
import { CalibrationEngine } from './calibration.js';
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
});

describe('Self-Calibration Engine (§11)', () => {
  it('respects cold-start guard under minimum sample size', () => {
    const engine = new CalibrationEngine({ minSampleSize: 20 });
    const proposal = engine.proposeThresholdAdjustment('facet_known_threshold', 0.9, [
      { id: '1', kind: 'facet', owner_action: 'accept', at: '2026-01-01' },
    ]);
    expect(proposal).toBeNull();
  });

  it('proposes bounded adjustment and supports exact rollback', () => {
    const engine = new CalibrationEngine({ minSampleSize: 5, maxStep: 0.05 });
    const logs = [
      { id: '1', kind: 'role', owner_action: 'reject' as const, at: '2026-01-01' },
      { id: '2', kind: 'role', owner_action: 'reject' as const, at: '2026-01-01' },
      { id: '3', kind: 'role', owner_action: 'reject' as const, at: '2026-01-01' },
      { id: '4', kind: 'role', owner_action: 'reject' as const, at: '2026-01-01' },
      { id: '5', kind: 'role', owner_action: 'accept' as const, at: '2026-01-01' },
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
      at: '2026-01-01',
    });
    expect(rollback.old_value).toBe(proposal!.proposed_value);
    expect(rollback.new_value).toBe(proposal!.current_value);
  });
});
