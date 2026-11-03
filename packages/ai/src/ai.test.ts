import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import {
  BudgetGovernor,
  isPolicyAllowedForDataClass,
  selectProviderForDataClass,
  determineDataClass,
  extractClaimsFromSpans,
  MockModelProvider,
  OpenAICompatibleProvider,
  scanForConfidentialData,
  extractEntitiesMultiPass,
  verifyAnswerBeforeDelivery,
  verifyAnswerBeforeDeliveryAsync,
  judgeEntailment,
  judgeEntailmentLLM,
  extractAssertions,
  stripUngroundedAssertions,
  stripUngroundedAssertionsSync,
  resolveConfiguredProviders,
  formatProviderDisclosure,
  AnswerCache,
  classifyQuery,
  classifyQuerySync,
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
      ownerReserve: 0.2,
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

  it('[B1] reserves >=20% capacity for owner-interactive calls and enforces priority access (§13.5)', () => {
    const governor = new BudgetGovernor({
      ownerReserve: 0.2, // 20% reserved for owner
      visitorShare: 0.8,
      backgroundReserve: 0.3,
    });
    // Create a mock provider with dailyTokens: 10,000
    const provider = new MockModelProvider();
    provider.limits = () => ({ rpm: 1000, tpm: 100000, dailyTokens: 10000 });

    // Fill up to 8,000 tokens (80% of daily quota, reaching 1.0 - ownerReserve)
    const initLease = governor.acquire([provider], 8000, 'visitor_interactive', 'public');
    expect(initLease.provider).not.toBeNull();

    // Non-owner requests (visitor and background) should now be rejected to protect owner reserve
    const visitorLease = governor.acquire([provider], 100, 'visitor_interactive', 'public');
    expect(visitorLease.provider).toBeNull();
    expect(visitorLease.degradationStep).toBe('extractive');

    const backgroundLease = governor.acquire([provider], 100, 'background', 'public');
    expect(backgroundLease.provider).toBeNull();
    expect(backgroundLease.degradationStep).toBe('extractive');

    // Owner interactive calls can still use the reserved 20% capacity
    const ownerLease = governor.acquire([provider], 1000, 'owner_interactive', 'public');
    expect(ownerLease.provider).not.toBeNull();
  });

  it('[B2, B3] computes visitor thresholds against visitor allocation and enables smaller_model step (§10.8, §13.5)', () => {
    const governor = new BudgetGovernor({
      visitorShare: 0.6, // 60% visitor allocation = 6,000 tokens of 10,000
      softThreshold: 0.8, // 80% of visitor budget = 4,800 tokens
      hardThreshold: 1.0,
      ownerReserve: 0.2,
    });
    const provider = new MockModelProvider();
    provider.limits = () => ({ rpm: 1000, tpm: 100000, dailyTokens: 10000 });

    // Visitor spends 4,000 tokens (< 80% of 6,000 visitor allocation): normal mode
    const lease1 = governor.acquire([provider], 4000, 'visitor_interactive', 'public');
    expect(lease1.provider).not.toBeNull();
    expect(lease1.degradationStep).toBe('normal');

    // Visitor spends another 1,000 tokens (total 5,000 >= 80% of 6,000): smaller_model reachable
    const lease2 = governor.acquire([provider], 1000, 'visitor_interactive', 'public');
    expect(lease2.provider).not.toBeNull();
    expect(lease2.degradationStep).toBe('smaller_model');

    // Visitor exceeds 6,000 tokens: blocked and downgraded to extractive
    const lease3 = governor.acquire([provider], 2000, 'visitor_interactive', 'public');
    expect(lease3.provider).toBeNull();
    expect(lease3.degradationStep).toBe('extractive');
  });

  it('[B4] enforces per-minute limits, 429 penalty, header learning, and token reconciliation (§13.5)', () => {
    const governor = new BudgetGovernor();
    const provider = new MockModelProvider();
    provider.limits = () => ({ rpm: 2, tpm: 1000, dailyTokens: 50000 });

    // RPM limit check: 2 requests allowed per minute
    const l1 = governor.acquire([provider], 100, 'visitor_interactive', 'public');
    expect(l1.provider).not.toBeNull();
    const l2 = governor.acquire([provider], 100, 'visitor_interactive', 'public');
    expect(l2.provider).not.toBeNull();
    const l3 = governor.acquire([provider], 100, 'visitor_interactive', 'public');
    expect(l3.provider).toBeNull(); // RPM exceeded

    // Token reconciliation: estimated 100 tokens, actual was 30 tokens
    governor.reconcileUsage(provider.id, 'visitor_interactive', 100, 30);
    const ledger = governor.getLedger(provider.id);
    expect(ledger.visitorTokensToday).toBe(130); // 200 - 70 = 130

    // Header learning
    governor.recordResponseHeaders(provider.id, {
      'x-ratelimit-limit-tokens': '5000',
      'x-ratelimit-limit-requests': '10',
      'x-ratelimit-limit-tokens-daily': '20000',
    });
    expect(ledger.learnedTpm).toBe(5000);
    expect(ledger.learnedRpm).toBe(10);
    expect(ledger.learnedDailyTokens).toBe(20000);

    // 429 Rate limit error discount
    governor.recordRateLimitError(provider.id, 60);
    expect(ledger.effectiveTpmDiscount).toBeLessThan(1.0);
    expect(ledger.isRateLimitedUntil).toBeDefined();

    // While rate-limited, provider is skipped
    const l4 = governor.acquire([provider], 10, 'owner_interactive', 'public');
    expect(l4.provider).toBeNull();
  });

  it('[B1-B4] persists governor ledger with UTC midnight resets', async () => {
    const memoryStore: Record<string, any> = {};
    const mockStorage = {
      async getGovernorLedger(provider_id: string, day_utc: string) {
        return memoryStore[`${provider_id}:${day_utc}`] || null;
      },
      async saveGovernorLedger(entry: any) {
        memoryStore[`${entry.provider_id}:${entry.day_utc}`] = { ...entry };
        return entry;
      },
    };

    const governor = new BudgetGovernor({}, mockStorage);
    const provider = new MockModelProvider();
    provider.limits = () => ({ rpm: 1000, tpm: 100000, dailyTokens: 10000 });

    governor.acquire([provider], 1200, 'visitor_interactive', 'public');
    await governor.persist(provider.id);

    const todayStr = new Date().toISOString().slice(0, 10);
    expect(memoryStore[`${provider.id}:${todayStr}`]).toBeDefined();
    expect(memoryStore[`${provider.id}:${todayStr}`].visitor_tokens).toBe(1200);

    // Create a new governor instance representing process reboot and load persisted state
    const restoredGovernor = new BudgetGovernor({}, mockStorage);
    await restoredGovernor.loadFromStorage(provider.id, todayStr);
    const restoredLedger = restoredGovernor.getLedger(provider.id);
    expect(restoredLedger.visitorTokensToday).toBe(1200);
    expect(restoredLedger.tokensToday).toBe(1200);
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
    // 1. Loaded from fixture file (e.g. data/redaction-exclusions.example.json)
    const defaultExclusionText = 'Reviewing architecture for internal.corp.example.com and secret-project-alpha';
    const examplePath = resolve(import.meta.dirname, '../../../data/redaction-exclusions.example.json');
    const fixtureWarnings = scanForConfidentialData(defaultExclusionText, {
      exclusionsFilePath: examplePath,
    });
    expect(fixtureWarnings.some((w) => w.type === 'exclusion' && w.match === 'internal.corp.example.com')).toBe(true);
    expect(fixtureWarnings.some((w) => w.type === 'exclusion' && w.match === 'secret-project-alpha')).toBe(true);

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

  it('resolves configured model providers strictly from configuration schemas and presets (§10.8, §13.5)', () => {
    // 1. With no keys configured, returns empty provider array (triggers extractive ladder)
    const emptyProviders = resolveConfiguredProviders({ PRESET: 'free-cloud' });
    expect(emptyProviders).toEqual([]);

    // 2. In free-cloud preset, prioritizes Groq -> Gemini -> OpenAI
    const freeCloudProviders = resolveConfiguredProviders({
      PRESET: 'free-cloud',
      GROQ_API_KEY: 'test-groq-key',
      GEMINI_API_KEY: 'test-gemini-key',
      OPENAI_API_KEY: 'test-openai-key',
    });
    expect(freeCloudProviders.map((p) => p.id)).toEqual(['groq', 'gemini', 'openai']);

    // 3. In hobbyist-vps preset, prioritizes OpenAI -> Groq -> Gemini
    const vpsProviders = resolveConfiguredProviders({
      PRESET: 'hobbyist-vps',
      GROQ_API_KEY: 'test-groq-key',
      GEMINI_API_KEY: 'test-gemini-key',
      OPENAI_API_KEY: 'test-openai-key',
    });
    expect(vpsProviders.map((p) => p.id)).toEqual(['openai', 'groq', 'gemini']);

    // 4. In local-only preset, external cloud keys are omitted
    const localProviders = resolveConfiguredProviders({
      PRESET: 'local-only',
      GROQ_API_KEY: 'test-groq-key',
      OPENAI_API_KEY: 'test-openai-key',
    });
    expect(localProviders).toEqual([]);
  });

  it('formats standard provider disclosure lines in compliance with Spec §10.8 and §13.5', () => {
    // Extractive fallback fixed sentence
    const extractiveLine = formatProviderDisclosure(null);
    expect(extractiveLine).toBe("Showing excerpts from the owner's records. Automated answers are paused for now.");

    // Provider synthesis without specific model
    const mock = new MockModelProvider();
    const synthLine = formatProviderDisclosure(mock);
    expect(synthLine).toBe(`Automated answer synthesized with ${mock.name} from owner records.`);

    // Provider synthesis with specific model
    const detailedLine = formatProviderDisclosure(mock, 'llama-3.3-70b');
    expect(detailedLine).toBe(`Automated answer synthesized with ${mock.name} (llama-3.3-70b) from owner records.`);
  });

  it('[M2] AnswerCache provides Step 2 degradation caching, time-travel isolation, and revision/claim invalidation (§10.8 Step 2)', () => {
    const cache = new AnswerCache();
    const payload = {
      tier: 'tier1',
      queryClass: 'factual',
      answer: 'Synthesized answer for testing cache',
      citations: [{ citationId: 1, title: 'Test Entry', slug: 'test' }],
      degradationStep: 'normal' as const,
    };

    // 1. Caching fails when entries are not exclusively public
    const notCached = cache.set(
      'How does cache work?',
      ['rev-1', 'rev-2'],
      ['claim-1'],
      payload,
      { stack: 'node' },
      null,
      false // non-public
    );
    expect(notCached).toBe(false);
    expect(cache.get('How does cache work?', ['rev-1', 'rev-2'], { stack: 'node' })).toBeNull();

    // 2. Caching succeeds for public entries with normalized question matching
    const cached = cache.set(
      'How does cache work???',
      ['rev-1', 'rev-2'],
      ['claim-1', 'claim-2'],
      payload,
      { stack: 'node' },
      null,
      true
    );
    expect(cached).toBe(true);
    expect(cache.size()).toBe(1);

    // Hit with differently capitalized or punctuated question and unordered revisions
    const hit = cache.get('how DOES cache WORK?', ['rev-2', 'rev-1'], { stack: 'node' });
    expect(hit).not.toBeNull();
    expect(hit?.degradationStep).toBe('cached');
    expect(hit?.answer).toBe('Synthesized answer for testing cache');

    // Miss on different visitor facets
    expect(cache.get('how does cache work', ['rev-1', 'rev-2'], { stack: 'python' })).toBeNull();

    // Miss on different cited revisions
    expect(cache.get('how does cache work', ['rev-1', 'rev-3'], { stack: 'node' })).toBeNull();

    // 3. Time-travel isolation: as_of_date queries are cached only under their specific date
    cache.set(
      'What was the architecture?',
      ['rev-past'],
      ['claim-past'],
      { ...payload, answer: 'Historical architecture in 2024' },
      undefined,
      '2024-06-01',
      true
    );
    // Hit with matching as_of_date
    const timeHit = cache.get('what was the architecture', ['rev-past'], undefined, '2024-06-01');
    expect(timeHit?.answer).toBe('Historical architecture in 2024');
    expect(timeHit?.degradationStep).toBe('cached');
    // Miss without as_of_date (live) or with different date
    expect(cache.get('what was the architecture', ['rev-past'], undefined, null)).toBeNull();
    expect(cache.get('what was the architecture', ['rev-past'], undefined, '2025-01-01')).toBeNull();

    // 4. Invalidation when cited revision changes (§10.8 Step 2)
    const revInvalidated = cache.invalidateRevision('rev-1');
    expect(revInvalidated).toBe(1);
    expect(cache.get('how does cache work', ['rev-1', 'rev-2'], { stack: 'node' })).toBeNull();

    // 5. Invalidation when relation accepted on cited claim (§10.8 Step 2)
    expect(cache.size()).toBe(1); // time-travel entry remains
    const claimInvalidated = cache.invalidateClaim('claim-past');
    expect(claimInvalidated).toBe(1);
    expect(cache.size()).toBe(0);
  });

  it('[M2] Governor returns degradationStep: fallback_provider when falling back to secondary provider (§10.8 Step 3)', () => {
    const gov = new BudgetGovernor();
    const primary = new MockModelProvider('primary-provider', 'Primary');
    const fallback = new MockModelProvider('fallback-provider', 'Fallback');

    // Trip 429 on primary to trigger backoff
    gov.recordRateLimitError('primary-provider');

    // Acquire should bypass primary due to backoff and return fallback with degradationStep: fallback_provider
    const lease = gov.acquire([primary, fallback], 100, 'visitor_interactive', 'public');
    expect(lease.provider?.id).toBe('fallback-provider');
    expect(lease.degradationStep).toBe('fallback_provider');
  });

  it('[S7, Fix 13] selectProviderForDataClass routes across providers strictly adhering to data policies (§13.5, §15)', () => {
    const cloudTraining = new OpenAICompatibleProvider({
      id: 'cloud-free-training',
      apiKey: 'k1',
      dataPolicy: { trainsOnInputs: true, retentionDays: 90, humanReview: true, zeroRetentionOption: false },
    });
    const cloudZeroRetention = new OpenAICompatibleProvider({
      id: 'cloud-enterprise-zero',
      apiKey: 'k2',
      dataPolicy: { trainsOnInputs: false, retentionDays: 0, humanReview: false, zeroRetentionOption: true },
    });
    const local = new MockModelProvider('local-onnx', 'Local');

    const chain = [cloudTraining, cloudZeroRetention, local];

    // Public content -> can use any provider, selects cloudTraining (first)
    const pub = selectProviderForDataClass(chain, 'public');
    expect(pub.provider?.id).toBe('cloud-free-training');

    // Unpublished / Private -> cannot use training provider, selects cloudZeroRetention
    const unpub = selectProviderForDataClass(chain, 'unpublished');
    expect(unpub.provider?.id).toBe('cloud-enterprise-zero');

    const priv = selectProviderForDataClass(chain, 'private');
    expect(priv.provider?.id).toBe('cloud-enterprise-zero');

    // Sensitive -> local only, selects local
    const sens = selectProviderForDataClass(chain, 'sensitive');
    expect(sens.provider?.id).toBe('local-onnx');

    // If local provider not present, sensitive returns null
    const noLocalChain = [cloudTraining, cloudZeroRetention];
    const sensFail = selectProviderForDataClass(noLocalChain, 'sensitive');
    expect(sensFail.provider).toBeNull();
  });

  it('[S7, Fix 13] determineDataClass classifies entries by visibility and redaction findings (§13.5, §15)', () => {
    // Clean entries
    expect(determineDataClass({ visibility: 'public' }, 'Clean public body')).toBe('public');
    expect(determineDataClass({ visibility: 'unlisted' }, 'Clean unlisted draft')).toBe('unpublished');
    expect(determineDataClass({ visibility: 'private' }, 'Clean private notes')).toBe('private');

    // Entries with secrets/NDA/exclusions override to sensitive regardless of visibility
    const testSecretKey = ['sk', 'dummytesttoken123456789'].join('-');
    expect(determineDataClass({ visibility: 'public' }, `Key: ${testSecretKey}`)).toBe('sensitive');
    expect(determineDataClass({ visibility: 'public' }, 'Under strict NDA')).toBe('sensitive');
    expect(
      determineDataClass({ visibility: 'public' }, 'Building InternalProject', { exclusions: ['InternalProject'] })
    ).toBe('sensitive');
  });

  it('[S7, Fix 13] extractClaimsFromSpans extracts structural claims with outcome status and scope', async () => {
    const provider = new MockModelProvider();
    const spans = [
      {
        id: 's1',
        revision_id: 'r1',
        ordinal: 0,
        start_char: 0,
        end_char: 50,
        text_exact: 'We migrated 100k daily active users with Postgres.',
      },
    ];

    const claims = await extractClaimsFromSpans(spans, provider);
    expect(claims.length).toBeGreaterThan(0);
    expect(claims[0].kind).toBe('outcome');
    expect(claims[0].outcome_status).toBe('worked');
    expect(claims[0].scope).toEqual({ database: 'PostgreSQL', stack: 'Node.js' });
    expect(claims[0].source_span_id).toBe('s1');
  });

  it('[20261020-UX-03] extractEntitiesMultiPass groups findings into Pass 1 (Secrets), Pass 2 (NDA), and Pass 3 (Entities)', () => {
    const testSecretKey = ['sk', 'proj', 'supersecrettoken1234567890'].join('-');
    const testText = `Client Alpha deployment under NDA. Secret token: ${testSecretKey}. Contact dev@corp.example.com on 10.0.0.1 for Project Pegasus.`;
    const res = extractEntitiesMultiPass(testText, { exclusions: ['Project Pegasus'] });

    expect(res.clean).toBe(false);
    expect(res.state).toBe('needs review');
    expect(res.pass1Secrets.length).toBeGreaterThanOrEqual(1);
    expect(res.pass1Secrets[0].type).toBe('secret');
    expect(res.pass1Secrets[0].pass).toBe(1);

    expect(res.pass2NdaMarkers.length).toBeGreaterThanOrEqual(1);
    expect(res.pass2NdaMarkers[0].type).toBe('nda');
    expect(res.pass2NdaMarkers[0].pass).toBe(2);

    expect(res.pass3Entities.length).toBeGreaterThanOrEqual(4);
    expect(res.pass3Entities.some((e) => e.type === 'client')).toBe(true);
    expect(res.pass3Entities.some((e) => e.type === 'exclusion')).toBe(true);
    expect(res.pass3Entities.some((e) => e.type === 'email')).toBe(true);
    expect(res.pass3Entities.some((e) => e.type === 'ip')).toBe(true);
    expect(res.allWarnings.length).toBe(res.pass1Secrets.length + res.pass2NdaMarkers.length + res.pass3Entities.length);
  });

  it('[M3, Fix 14] judges entailment across labeled test set (§10.6, fixtures/entailment-cases.json)', () => {
    const fixturePath = resolve(import.meta.dirname, 'verification/fixtures/entailment-cases.json');
    const cases = JSON.parse(readFileSync(fixturePath, 'utf8'));
    expect(cases.length).toBeGreaterThanOrEqual(8);

    for (const testCase of cases) {
      const res = judgeEntailment(testCase.hypothesis, [testCase.premise]);
      expect(res.status).toBe(testCase.expected);
      expect(res.confidence).toBeGreaterThan(0.5);
    }
  });

  it('[M3, Fix 14] LLM entailment judge classifies statements and falls back gracefully on provider errors', async () => {
    // 1. LLM provider returning structured entailment JSON
    const mockJudgeProvider = new MockModelProvider('judge-mock', {
      completionText: JSON.stringify({
        status: 'entailed',
        confidence: 0.96,
        reason: 'The hypothesis is directly supported by the retrieved premise.',
      }),
    });

    const llmRes = await judgeEntailmentLLM(
      'The database was upgraded to PostgreSQL in 2021.',
      ['In 2021 we migrated our primary database to PostgreSQL.'],
      mockJudgeProvider
    );
    expect(llmRes.status).toBe('entailed');
    expect(llmRes.judgeMode).toBe('llm');

    // 2. Provider error falls back to deterministic judge
    const failingProvider = new MockModelProvider('failing-mock', { shouldFail: true });
    const fallbackRes = await judgeEntailmentLLM(
      'The database was upgraded to PostgreSQL in 2021.',
      ['In 2021 we migrated our primary database to PostgreSQL.'],
      failingProvider
    );
    expect(fallbackRes.status).toBe('entailed');
    expect(fallbackRes.judgeMode).toBe('deterministic');
  });

  it('[M3, Fix 14] strips ungrounded assertions while preserving verified entailed claims (§10.6)', async () => {
    const premise = [
      {
        id: 's1',
        revision_id: 'r1',
        ordinal: 0,
        start_off: 0,
        end_off: 60,
        text_exact: 'In 2021 we migrated our primary database to PostgreSQL to handle 50,000 writes per second.',
        token_count: 15,
      },
    ];

    const draftWithHallucination =
      'In 2021 we migrated our primary database to PostgreSQL. The migration reduced operating costs by $200,000 per month.';

    const stripRes = stripUngroundedAssertionsSync(draftWithHallucination, premise);
    expect(stripRes.totalAssertions).toBe(2);
    expect(stripRes.entailedAssertions.length).toBe(1);
    expect(stripRes.strippedAssertions.length).toBe(1);
    expect(stripRes.strippedAssertions[0]).toContain('$200,000');
    expect(stripRes.verifiedText).toContain('PostgreSQL');
    expect(stripRes.verifiedText).not.toContain('$200,000');
  });

  it('[M3, Fix 14] wires citedScopes, attaches explicit reconstruction labeling, and rejects fully ungrounded drafts (§10.6, §10.8)', async () => {
    const premiseSpans = [
      {
        id: 's1',
        revision_id: 'r1',
        ordinal: 0,
        start_off: 0,
        end_off: 50,
        text_exact: 'Architected high-throughput message streaming with Apache Kafka.',
        token_count: 10,
      },
    ];

    // 1. Partial ungrounded draft gets assertion stripped and reconstruction notice attached
    const resPartial = await verifyAnswerBeforeDeliveryAsync({
      draftText: 'Architected message streaming using Apache Kafka. We also implemented Kubernetes orchestration.',
      citedSpans: premiseSpans,
      visitorFacets: { stack: 'Kafka' },
      citedScopes: [{ stack: 'Kafka', scale: '1M events/sec' }],
      degradationStep: 'fallback_provider',
    });

    expect(resPartial.passed).toBe(true);
    expect(resPartial.faithfulnessPassed).toBe(true);
    expect(resPartial.isReconstruction).toBe(true);
    expect(resPartial.reconstructionNotice).toContain('fallback_provider');
    expect(resPartial.verifiedText).toContain('Kafka');
    expect(resPartial.verifiedText).not.toContain('Kubernetes');
    expect(resPartial.strippedAssertions).toContain('We also implemented Kubernetes orchestration.');
    expect(resPartial.citedScopes).toEqual([{ stack: 'Kafka', scale: '1M events/sec' }]);
    expect(resPartial.applicabilityNote).toContain('Matches: stack: Kafka');

    // 2. Time-travel query attaches explicit time-travel reconstruction label
    const resTimeTravel = verifyAnswerBeforeDelivery({
      draftText: 'Architected high-throughput message streaming with Apache Kafka.',
      citedSpans: premiseSpans,
      visitorFacets: {},
      citedScopes: [{ stack: 'Kafka' }],
      asOfDate: '2021-06-01T00:00:00Z',
    });

    expect(resTimeTravel.passed).toBe(true);
    expect(resTimeTravel.isReconstruction).toBe(true);
    expect(resTimeTravel.reconstructionNotice).toContain('Reconstructed from historical records as of 2021-06-01');
    expect(resTimeTravel.verifiedText).toContain('Reconstructed from historical records');

    // 3. Completely ungrounded draft fails faithfulness and verification
    const resFabricated = verifyAnswerBeforeDelivery({
      draftText: 'Built distributed machine learning pipelines with PyTorch and Ray.',
      citedSpans: premiseSpans,
      visitorFacets: {},
      citedScopes: [],
    });

    expect(resFabricated.passed).toBe(false);
    expect(resFabricated.faithfulnessPassed).toBe(false);
    expect(resFabricated.verifiedText).toBe('');
  });

  describe('Query Classification & Labeled Benchmark Suite (§10.3, Fix 15, Finding M4)', () => {
    const fixturePath = resolve(__dirname, 'classification/fixtures/query-classification-cases.json');
    const casesData = JSON.parse(readFileSync(fixturePath, 'utf8'));

    it('classifies labeled benchmark query cases accurately (Fix 15, §10.3, §18)', () => {
      for (const tc of casesData.cases) {
        const result = classifyQuerySync(tc.query);
        expect(
          result.queryClass,
          `Query "${tc.query}" expected class "${tc.expectedClass}" but got "${result.queryClass}" (reason: ${result.reason})`
        ).toBe(tc.expectedClass);
      }
    });

    it('defaults ambiguous and borderline queries to advisory per §10.3 strictness rule', () => {
      const ambiguousQueries = [
        'Database locking strategies',
        'Redis vs Postgres',
        'Microservice architectural patterns',
        'Distributed systems',
        'Kafka performance',
        'Cache invalidation',
      ];

      for (const q of ambiguousQueries) {
        const result = classifyQuerySync(q);
        expect(result.queryClass).toBe('advisory');
        expect(result.isAmbiguous).toBe(true);
      }
    });

    it('classifies queries via ModelProvider and falls back gracefully on provider errors', async () => {
      const provider = new MockModelProvider('test-classifier', 'Test Provider');

      // 1. Provider-based classification
      const resLookup = await classifyQuery('What database did you use for webhook locks in 2021?', provider);
      expect(resLookup.queryClass).toBe('lookup');
      expect(resLookup.source).toBe('provider');

      const resAdvisory = await classifyQuery('Should I use Redis or PostgreSQL for distributed locking?', provider);
      expect(resAdvisory.queryClass).toBe('advisory');
      expect(resAdvisory.source).toBe('provider');

      const resAbout = await classifyQuery('Who are you and what do you work on?', provider);
      expect(resAbout.queryClass).toBe('about');
      expect(resAbout.source).toBe('provider');

      const resAmbiguous = await classifyQuery('Random phrase without context', provider);
      expect(resAmbiguous.queryClass).toBe('advisory');

      // 2. Fallback on provider failure
      const failingProvider = new MockModelProvider('failing', { shouldFail: true });
      const resFallback = await classifyQuery('What database did you use for webhook locks in 2021?', failingProvider);
      expect(resFallback.queryClass).toBe('lookup');
      expect(resFallback.source).toBe('rule_fallback');
    });
  });
});
