import type {
  DataClass,
  DegradationStep,
  ObservabilityAlert,
  BudgetUtilization,
} from '@living-portfolio/core';
import type { ModelProvider } from '../providers/types.js';
import { isPolicyAllowedForDataClass } from '../providers/types.js';

export type RequestPriority = 'owner_interactive' | 'visitor_interactive' | 'background';

export interface BudgetConfig {
  visitorShare: number;        // default 0.6 (60%)
  backgroundReserve: number;   // default 0.3 (30%)
  ownerReserve: number;        // default 0.2 (20% reserved for owner-interactive, B1, Fix 11)
  softThreshold: number;       // default 0.8 (80%)
  hardThreshold: number;       // default 1.0 (100%)
  perVisitorHourlyCap: number; // default 10 questions/hour
}

export interface ProviderLedger {
  requestsToday: number;
  tokensToday: number;
  visitorTokensToday: number;
  ownerTokensToday: number;
  backgroundTokensToday: number;
  lastReset: string;           // YYYY-MM-DD UTC date
  isRateLimitedUntil?: string; // 24-hr (or retry-after) backoff on 429
  effectiveTpmDiscount: number;
  minuteWindowStart?: number;
  requestsThisMinute?: number;
  tokensThisMinute?: number;
  learnedDailyTokens?: number;
  learnedTpm?: number;
  learnedRpm?: number;
}

export interface GovernorStorageAdapter {
  getGovernorLedger(provider_id: string, day_utc: string): Promise<any>;
  saveGovernorLedger(ledger: any): Promise<any>;
}

export class BudgetGovernor {
  private config: BudgetConfig;
  private ledgers = new Map<string, ProviderLedger>();
  private visitorHistory = new Map<string, number[]>(); // ip/sessionId -> timestamps
  private storage?: GovernorStorageAdapter;
  private onAlert?: (alert: ObservabilityAlert) => void;

  constructor(
    config: Partial<BudgetConfig> = {},
    storage?: GovernorStorageAdapter,
    onAlert?: (alert: ObservabilityAlert) => void
  ) {
    this.config = {
      visitorShare: config.visitorShare ?? 0.6,
      backgroundReserve: config.backgroundReserve ?? 0.3,
      ownerReserve: config.ownerReserve ?? 0.2,
      softThreshold: config.softThreshold ?? 0.8,
      hardThreshold: config.hardThreshold ?? 1.0,
      perVisitorHourlyCap: config.perVisitorHourlyCap ?? 10,
    };
    this.storage = storage;
    this.onAlert = onAlert;
  }

  setAlertListener(fn?: (alert: ObservabilityAlert) => void): void {
    this.onAlert = fn;
  }

  setStorageAdapter(storage: GovernorStorageAdapter): void {
    this.storage = storage;
  }

  getConfig(): BudgetConfig {
    return { ...this.config };
  }

  getLedger(providerId: string): ProviderLedger {
    const todayStr = new Date().toISOString().slice(0, 10);
    let ledger = this.ledgers.get(providerId);

    // Midnight reset in UTC (B4, §13.5)
    if (!ledger || ledger.lastReset !== todayStr) {
      ledger = {
        requestsToday: 0,
        tokensToday: 0,
        visitorTokensToday: 0,
        ownerTokensToday: 0,
        backgroundTokensToday: 0,
        lastReset: todayStr,
        effectiveTpmDiscount: ledger?.effectiveTpmDiscount ?? 1.0,
        isRateLimitedUntil: ledger?.isRateLimitedUntil,
        minuteWindowStart: Date.now(),
        requestsThisMinute: 0,
        tokensThisMinute: 0,
        learnedDailyTokens: ledger?.learnedDailyTokens,
        learnedTpm: ledger?.learnedTpm,
        learnedRpm: ledger?.learnedRpm,
      };
      this.ledgers.set(providerId, ledger);
    }

    return ledger;
  }

  /**
   * Asynchronously loads existing daily ledger from persistent repository (Postgres governor_ledger).
   */
  async loadFromStorage(providerId: string, dayUtc?: string): Promise<ProviderLedger> {
    const day = dayUtc || new Date().toISOString().slice(0, 10);
    const inMemory = this.getLedger(providerId);
    if (!this.storage) return inMemory;

    try {
      const persisted = await this.storage.getGovernorLedger(providerId, day);
      if (persisted) {
        inMemory.visitorTokensToday = persisted.visitor_tokens ?? 0;
        inMemory.ownerTokensToday = persisted.owner_tokens ?? 0;
        inMemory.backgroundTokensToday = persisted.background_tokens ?? 0;
        inMemory.requestsToday = persisted.requests_count ?? 0;
        inMemory.tokensToday = inMemory.visitorTokensToday + inMemory.ownerTokensToday + inMemory.backgroundTokensToday;
        inMemory.lastReset = persisted.day_utc ?? day;
        if (persisted.is_rate_limited_until) {
          inMemory.isRateLimitedUntil = new Date(persisted.is_rate_limited_until).toISOString();
        }
        if (typeof persisted.effective_tpm_discount === 'number') {
          inMemory.effectiveTpmDiscount = persisted.effective_tpm_discount;
        }
      }
    } catch {}

    return inMemory;
  }

  /**
   * Persists provider ledger to storage adapter if configured.
   */
  async persist(providerId: string): Promise<void> {
    if (!this.storage) return;
    const ledger = this.getLedger(providerId);
    await this.storage.saveGovernorLedger({
      provider_id: providerId,
      day_utc: ledger.lastReset,
      visitor_tokens: ledger.visitorTokensToday,
      owner_tokens: ledger.ownerTokensToday,
      background_tokens: ledger.backgroundTokensToday,
      requests_count: ledger.requestsToday,
      last_reset: new Date().toISOString(),
      is_rate_limited_until: ledger.isRateLimitedUntil ? new Date(ledger.isRateLimitedUntil) : null,
      effective_tpm_discount: ledger.effectiveTpmDiscount,
    });
  }

  private syncToStorage(providerId: string): void {
    if (!this.storage) return;
    this.persist(providerId).catch(() => {});
  }

  /**
   * Checks visitor abuse & rate limit (§13.5, S4)
   */
  checkVisitorRateLimit(visitorId: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const oneHourAgo = now - 3600 * 1000;
    const timestamps = (this.visitorHistory.get(visitorId) || []).filter((t) => t > oneHourAgo);

    if (timestamps.length >= this.config.perVisitorHourlyCap) {
      return { allowed: false, remaining: 0 };
    }

    timestamps.push(now);
    this.visitorHistory.set(visitorId, timestamps);
    return {
      allowed: true,
      remaining: this.config.perVisitorHourlyCap - timestamps.length,
    };
  }

  /**
   * Walks the provider chain and acquires a lease for a provider that satisfies
   * data policies and budget constraints (§13.5, B1-B4). If none available, returns the degradation step.
   */
  acquire(
    chain: ModelProvider[],
    estTokens: number,
    priority: RequestPriority,
    dataClass: DataClass
  ): { provider: ModelProvider | null; degradationStep: DegradationStep } {
    const now = new Date();
    const nowMs = now.getTime();

    for (let i = 0; i < chain.length; i++) {
      const provider = chain[i];
      // 1. Data policy check
      if (!isPolicyAllowedForDataClass(provider.dataPolicy, dataClass, provider.isLocal)) {
        continue;
      }

      const limits = provider.limits();
      const ledger = this.getLedger(provider.id);

      // 2. Active 429 penalty check
      if (ledger.isRateLimitedUntil && new Date(ledger.isRateLimitedUntil) > now) {
        continue;
      }

      // 3. Sliding 1-minute limits check (TPM, RPM, B4)
      if (!ledger.minuteWindowStart || (nowMs - ledger.minuteWindowStart >= 60000)) {
        ledger.minuteWindowStart = nowMs;
        ledger.requestsThisMinute = 0;
        ledger.tokensThisMinute = 0;
      }

      const effectiveTpm = (ledger.learnedTpm ?? limits.tpm) * ledger.effectiveTpmDiscount;
      const effectiveRpm = ledger.learnedRpm ?? limits.rpm;
      if (
        (ledger.tokensThisMinute! + estTokens > effectiveTpm) ||
        (ledger.requestsThisMinute! + 1 > effectiveRpm)
      ) {
        continue;
      }

      // 4. Daily limits calculation (B1, B2, B3, B4)
      const dailyTokensMax = ledger.learnedDailyTokens ?? limits.dailyTokens ?? 1000000;
      const projectedTokens = ledger.tokensToday + estTokens;

      // Hard threshold: global cap across all usage
      if (projectedTokens > dailyTokensMax * this.config.hardThreshold) {
        if (this.onAlert) {
          this.onAlert({
            code: 'BUDGET_HARD_CAP',
            severity: 'critical',
            subsystem: 'provider',
            message: `Provider '${provider.id}' daily token spend reached hard budget cap (100%). Falling back to extractive mode (§10.8, §13.5).`,
            timestamp: new Date().toISOString(),
            metadata: { providerId: provider.id, projectedTokens, dailyTokensMax },
          });
        }
        continue;
      }

      // Step 3 (Fallback provider) vs Step 1 (Normal)
      let step: DegradationStep = i > 0 ? 'fallback_provider' : 'normal';

      // Step 4: Global soft threshold triggers smaller_model step
      if (projectedTokens / dailyTokensMax >= this.config.softThreshold) {
        step = 'smaller_model';
        if (this.onAlert) {
          this.onAlert({
            code: 'BUDGET_SOFT_CAP',
            severity: 'warning',
            subsystem: 'provider',
            message: `Provider '${provider.id}' daily token spend reached soft budget cap (>= 80%). Trimming context and routing to smaller models (§13.5).`,
            timestamp: new Date().toISOString(),
            metadata: { providerId: provider.id, projectedTokens, dailyTokensMax },
          });
        }
      }

      // Priority enforcement (B1, B2, B3)
      if (priority === 'visitor_interactive') {
        // B1: Visitor traffic cannot encroach on the owner reserve (>= 20%)
        const nonOwnerCeiling = dailyTokensMax * (1.0 - this.config.ownerReserve);
        if (projectedTokens > nonOwnerCeiling) {
          continue;
        }

        // B2 & B3: Visitor quota is evaluated against visitor token allocation
        const visitorAllocation = dailyTokensMax * this.config.visitorShare;
        const projectedVisitorTokens = ledger.visitorTokensToday + estTokens;
        const visitorRatio = projectedVisitorTokens / visitorAllocation;

        if (visitorRatio > this.config.hardThreshold) {
          continue;
        }

        if (visitorRatio >= this.config.softThreshold) {
          step = 'smaller_model';
        }
      } else if (priority === 'background') {
        // B1: Background traffic cannot encroach on the owner reserve
        const nonOwnerCeiling = dailyTokensMax * (1.0 - this.config.ownerReserve);
        if (projectedTokens > nonOwnerCeiling) {
          continue;
        }

        // Background work may not consume the last background_reserve share
        const backgroundCeiling = dailyTokensMax * (1.0 - this.config.backgroundReserve);
        if (projectedTokens > backgroundCeiling) {
          continue;
        }
      } else if (priority === 'owner_interactive') {
        // Owner work has highest priority, bounded only by hardThreshold (B1)
        if (projectedTokens > dailyTokensMax * this.config.hardThreshold) {
          continue;
        }
      }

      // Record provisional spend
      ledger.tokensToday += estTokens;
      ledger.requestsToday += 1;
      ledger.tokensThisMinute! += estTokens;
      ledger.requestsThisMinute! += 1;

      if (priority === 'visitor_interactive') {
        ledger.visitorTokensToday += estTokens;
      } else if (priority === 'owner_interactive') {
        ledger.ownerTokensToday += estTokens;
      } else if (priority === 'background') {
        ledger.backgroundTokensToday += estTokens;
      }

      this.syncToStorage(provider.id);
      return { provider, degradationStep: step };
    }

    // If chain exhausted, step down to extractive mode (§10.8)
    return { provider: null, degradationStep: 'extractive' };
  }

  /**
   * Reconciles estimated spend with actual LLM tokens used, releasing unused quota (B4, G8).
   */
  reconcileUsage(
    providerId: string,
    priority: RequestPriority,
    estimatedTokens: number,
    actualTokens: number
  ): void {
    const ledger = this.getLedger(providerId);
    const delta = actualTokens - estimatedTokens;

    ledger.tokensToday = Math.max(0, ledger.tokensToday + delta);
    if (ledger.tokensThisMinute != null) {
      ledger.tokensThisMinute = Math.max(0, ledger.tokensThisMinute + delta);
    }

    if (priority === 'visitor_interactive') {
      ledger.visitorTokensToday = Math.max(0, ledger.visitorTokensToday + delta);
    } else if (priority === 'owner_interactive') {
      ledger.ownerTokensToday = Math.max(0, ledger.ownerTokensToday + delta);
    } else if (priority === 'background') {
      ledger.backgroundTokensToday = Math.max(0, ledger.backgroundTokensToday + delta);
    }

    this.syncToStorage(providerId);
  }

  /**
   * Learns from response headers (TPM, RPM, daily tokens, retry-after) (B4).
   */
  recordResponseHeaders(
    providerId: string,
    headers: Record<string, string | number | undefined>
  ): void {
    const ledger = this.getLedger(providerId);
    const normalized: Record<string, string> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (v !== undefined) normalized[k.toLowerCase()] = String(v);
    }

    const tpmLimit = normalized['x-ratelimit-limit-tokens'];
    if (tpmLimit && !isNaN(Number(tpmLimit))) {
      ledger.learnedTpm = Number(tpmLimit);
    }

    const rpmLimit = normalized['x-ratelimit-limit-requests'];
    if (rpmLimit && !isNaN(Number(rpmLimit))) {
      ledger.learnedRpm = Number(rpmLimit);
    }

    const dailyLimit = normalized['x-ratelimit-limit-tokens-daily'] || normalized['x-ratelimit-daily-tokens'];
    if (dailyLimit && !isNaN(Number(dailyLimit))) {
      ledger.learnedDailyTokens = Number(dailyLimit);
    }

    const retryAfter = normalized['retry-after'];
    if (retryAfter) {
      const sec = Number(retryAfter);
      if (!isNaN(sec) && sec > 0) {
        ledger.isRateLimitedUntil = new Date(Date.now() + sec * 1000).toISOString();
      }
    }

    this.syncToStorage(providerId);
  }

  /**
   * Learns from a 429 response by applying a conservative discount and jittered backoff (§13.5, B4).
   */
  recordRateLimitError(providerId: string, retryAfterSec?: number): void {
    const ledger = this.getLedger(providerId);
    const backoffMs = retryAfterSec ? retryAfterSec * 1000 : 24 * 3600 * 1000;
    const jitter = Math.floor(Math.random() * 30000);
    ledger.isRateLimitedUntil = new Date(Date.now() + backoffMs + jitter).toISOString();
    ledger.effectiveTpmDiscount = Math.max(0.2, ledger.effectiveTpmDiscount * 0.7);
    this.syncToStorage(providerId);

    if (this.onAlert) {
      this.onAlert({
        code: 'PROVIDER_RATE_LIMITED',
        severity: 'warning',
        subsystem: 'provider',
        message: `Provider '${providerId}' received a 429 rate limit backoff until ${ledger.isRateLimitedUntil}.`,
        timestamp: new Date().toISOString(),
        metadata: { providerId, rateLimitedUntil: ledger.isRateLimitedUntil },
      });
    }
  }

  /**
   * Returns current token and request utilization for all tracked providers (§13.5, OSR-21).
   */
  getUtilization(providers?: ModelProvider[]): BudgetUtilization[] {
    const providerMap = new Map<string, ModelProvider>();
    if (providers) {
      for (const p of providers) providerMap.set(p.id, p);
    }

    const allProviderIds = new Set<string>([
      ...this.ledgers.keys(),
      ...(providers ? providers.map((p) => p.id) : []),
    ]);

    const result: BudgetUtilization[] = [];
    const now = new Date();

    for (const providerId of allProviderIds) {
      const ledger = this.getLedger(providerId);
      const provider = providerMap.get(providerId);
      const dailyTokensMax = ledger.learnedDailyTokens ?? provider?.limits().dailyTokens ?? 1000000;
      const ratio = dailyTokensMax > 0 ? ledger.tokensToday / dailyTokensMax : 0;
      const isRateLimited = Boolean(ledger.isRateLimitedUntil && new Date(ledger.isRateLimitedUntil) > now);

      result.push({
        providerId,
        requestsToday: ledger.requestsToday,
        tokensToday: ledger.tokensToday,
        visitorTokensToday: ledger.visitorTokensToday,
        ownerTokensToday: ledger.ownerTokensToday,
        backgroundTokensToday: ledger.backgroundTokensToday,
        dailyLimitTokens: dailyTokensMax,
        utilizationPercent: Number((ratio * 100).toFixed(2)),
        softThresholdReached: ratio >= this.config.softThreshold,
        hardThresholdReached: ratio >= this.config.hardThreshold,
        isRateLimited,
        rateLimitedUntil: isRateLimited ? (ledger.isRateLimitedUntil ?? null) : null,
      });
    }

    return result;
  }

  /**
   * Evaluates all tracked provider ledgers and produces active observability alerts (§13.5, §13.9, OSR-21).
   */
  getAlerts(providers?: ModelProvider[]): ObservabilityAlert[] {
    const utilizations = this.getUtilization(providers);
    const alerts: ObservabilityAlert[] = [];
    const nowIso = new Date().toISOString();

    for (const u of utilizations) {
      if (u.isRateLimited) {
        alerts.push({
          code: 'PROVIDER_RATE_LIMITED',
          severity: 'warning',
          subsystem: 'provider',
          message: `Provider '${u.providerId}' received a 429 rate limit backoff until ${u.rateLimitedUntil}.`,
          timestamp: nowIso,
          metadata: { providerId: u.providerId, rateLimitedUntil: u.rateLimitedUntil },
        });
      }

      if (u.hardThresholdReached) {
        alerts.push({
          code: 'BUDGET_HARD_CAP',
          severity: 'critical',
          subsystem: 'provider',
          message: `Provider '${u.providerId}' daily token spend (${u.tokensToday}) reached 100% of daily limit (${u.dailyLimitTokens}). Stepping down to extractive mode (§10.8, §13.5).`,
          timestamp: nowIso,
          metadata: {
            providerId: u.providerId,
            tokensToday: u.tokensToday,
            dailyLimit: u.dailyLimitTokens,
            utilizationPercent: u.utilizationPercent,
          },
        });
      } else if (u.softThresholdReached) {
        alerts.push({
          code: 'BUDGET_SOFT_CAP',
          severity: 'warning',
          subsystem: 'provider',
          message: `Provider '${u.providerId}' daily token spend (${u.tokensToday}) reached ${u.utilizationPercent.toFixed(1)}% of daily limit (${u.dailyLimitTokens}). Applying context trimming and smaller model routing (§13.5).`,
          timestamp: nowIso,
          metadata: {
            providerId: u.providerId,
            tokensToday: u.tokensToday,
            dailyLimit: u.dailyLimitTokens,
            utilizationPercent: u.utilizationPercent,
          },
        });
      }
    }

    return alerts;
  }
}

/**
 * Data-class policy router (§13.5, §15, S7, Fix 13)
 * Walks a provider chain and selects the first provider allowed for content's data class
 * and within budget limits if a governor is supplied.
 */
export function selectProviderForDataClass(
  chain: ModelProvider[],
  dataClass: DataClass,
  governor?: BudgetGovernor,
  estTokens: number = 500,
  priority: RequestPriority = 'background'
): { provider: ModelProvider | null; degradationStep?: DegradationStep; reason?: string } {
  if (governor) {
    const res = governor.acquire(chain, estTokens, priority, dataClass);
    return {
      provider: res.provider,
      degradationStep: res.degradationStep,
      reason: res.provider ? undefined : `No eligible provider in chain for data class '${dataClass}' or budget exhausted`,
    };
  }

  for (const provider of chain) {
    if (isPolicyAllowedForDataClass(provider.dataPolicy, dataClass, provider.isLocal)) {
      return { provider, degradationStep: 'normal' };
    }
  }

  return {
    provider: null,
    reason: `No provider in chain permits data class '${dataClass}'`,
  };
}
