import { describe, it, expect } from 'vitest';
import {
  BudgetGovernor,
  isPolicyAllowedForDataClass,
  MockModelProvider,
  scanForConfidentialData,
  verifyAnswerBeforeDelivery,
} from './index.js';

describe('AI Package: Budget Governor, Data-Class Routing, Verification & Redaction (§10.6, §13.5, §15)', () => {
  it('enforces data-use policy routing so private/sensitive content never reaches training providers (§13.5)', () => {
    const freeTierTrainingPolicy = {
      trainsOnInputs: true,
      retentionDays: 30,
      humanReview: true,
      zeroRetentionOption: false,
    };
    const localPolicy = {
      trainsOnInputs: false,
      retentionDays: 0,
      humanReview: false,
      zeroRetentionOption: true,
    };

    expect(isPolicyAllowedForDataClass(freeTierTrainingPolicy, 'public')).toBe(true);
    expect(isPolicyAllowedForDataClass(freeTierTrainingPolicy, 'unpublished')).toBe(false);
    expect(isPolicyAllowedForDataClass(freeTierTrainingPolicy, 'private')).toBe(false);
    expect(isPolicyAllowedForDataClass(freeTierTrainingPolicy, 'sensitive')).toBe(false);

    expect(isPolicyAllowedForDataClass(localPolicy, 'private')).toBe(true);
    expect(isPolicyAllowedForDataClass(localPolicy, 'sensitive')).toBe(true);
  });

  it('tracks token budgets, reserves background capacity, and steps down degradation ladder (§10.8, §13.5)', () => {
    const governor = new BudgetGovernor({
      visitorShare: 0.6,
      backgroundReserve: 0.3,
      softThreshold: 0.8,
      hardThreshold: 1.0,
      perVisitorHourlyCap: 2,
    });
    const mock = new MockModelProvider();

    const lease = governor.acquire([mock], 500, 'visitor_interactive', 'public');
    expect(lease.provider).not.toBeNull();
    expect(lease.degradationStep).toBe('normal');

    // Visitor rate limit
    expect(governor.checkVisitorRateLimit('v1').allowed).toBe(true);
    expect(governor.checkVisitorRateLimit('v1').allowed).toBe(true);
    expect(governor.checkVisitorRateLimit('v1').allowed).toBe(false);
  });

  it('detects anachronisms during time-travel verification (§10.6)', () => {
    const res = verifyAnswerBeforeDelivery({
      draftText: 'In 2021 we migrated to Postgres and later in 2025 we adopted new features.',
      citedSpans: [
        {
          id: 's1',
          revision_id: 'r1',
          ordinal: 0,
          start_off: 0,
          end_off: 40,
          text_exact: 'In 2021 we migrated to Postgres.',
          token_count: 8,
        },
      ],
      visitorFacets: { database: 'PostgreSQL' },
      citedScopes: [{ database: 'PostgreSQL', scale: '50k TPS' }],
      asOfDate: '2022-01-01T00:00:00Z',
    });

    expect(res.anachronismDetected).toBe(true);
    expect(res.passed).toBe(false);
    expect(res.applicabilityNote).toContain('Matches: database: PostgreSQL');
    expect(res.applicabilityNote).toContain('Not verified for: scale');
  });

  it('scans for confidential secrets, emails, and IP addresses before publishing (§4.3, §15)', () => {
    const warnings = scanForConfidentialData('Contact internal@corp.example.com at 10.24.0.15 with token AKIA1234567890ABCDEF');
    expect(warnings.length).toBeGreaterThanOrEqual(3);
    expect(warnings.some((w) => w.type === 'secret')).toBe(true);
    expect(warnings.some((w) => w.type === 'email')).toBe(true);
    expect(warnings.some((w) => w.type === 'ip')).toBe(true);
  });

  it('matches owner exclusion list loaded from data file and dynamic options without hardcoded literals (UX-03, §4.3)', () => {
    // 1. Loaded from data/redaction-exclusions.json
    const defaultExclusionText = 'Reviewing architecture for internal.corp.example.com and secret-project-alpha';
    const defaultWarnings = scanForConfidentialData(defaultExclusionText);
    expect(defaultWarnings.some((w) => w.type === 'exclusion' && w.match === 'internal.corp.example.com')).toBe(true);
    expect(defaultWarnings.some((w) => w.type === 'exclusion' && w.match === 'secret-project-alpha')).toBe(true);

    // 2. Custom exclusion list passed via options
    const customWarnings = scanForConfidentialData('Working on Project-Starlight for Client Omega', {
      exclusions: ['Project-Starlight', 'Client Omega'],
    });
    expect(customWarnings.some((w) => w.type === 'exclusion' && w.match === 'Project-Starlight')).toBe(true);
    expect(customWarnings.some((w) => w.type === 'exclusion' && w.match === 'Client Omega')).toBe(true);

    // 3. Word-boundary awareness (does not flag words that merely contain exclusion as substring)
    const innocentText = 'The alpha project is unrelated to secrets';
    const innocentWarnings = scanForConfidentialData(innocentText, {
      exclusions: ['secret-project-alpha'],
    });
    expect(innocentWarnings.some((w) => w.match === 'secret-project-alpha')).toBe(false);
  });
});
