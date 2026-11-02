import type { ObservabilityMetrics, ObservabilityAlert } from '@living-portfolio/core';

export interface MetricsCollectorOptions {
  windowDurationMs?: number;
  errorRateThreshold?: number;
  minRequestsForErrorRate?: number;
  onAlert?: (alert: ObservabilityAlert) => void;
}

interface RequestSample {
  timestamp: number;
  status: number;
  durationMs: number;
}

/**
 * In-memory sliding-window metrics collector for API request observability and alerting (§13.5, §13.9, OSR-21).
 */
export class MetricsCollector {
  private samples: RequestSample[] = [];
  private readonly startedAt: number = Date.now();
  private readonly windowDurationMs: number;
  private readonly errorRateThreshold: number;
  private readonly minRequestsForErrorRate: number;
  private onAlert?: (alert: ObservabilityAlert) => void;

  constructor(options?: MetricsCollectorOptions) {
    this.windowDurationMs = options?.windowDurationMs ?? 60_000;
    this.errorRateThreshold = options?.errorRateThreshold ?? 0.10;
    this.minRequestsForErrorRate = options?.minRequestsForErrorRate ?? 5;
    this.onAlert = options?.onAlert;
  }

  setAlertListener(fn?: (alert: ObservabilityAlert) => void): void {
    this.onAlert = fn;
  }

  recordRequest(status: number, durationMs: number = 0): void {
    const now = Date.now();
    this.samples.push({ timestamp: now, status, durationMs });
    this.prune(now);

    const alerts = this.getAlerts(now);
    if (this.onAlert && alerts.length > 0) {
      for (const alert of alerts) {
        this.onAlert(alert);
      }
    }
  }

  private prune(now: number): void {
    const cutoff = now - this.windowDurationMs;
    while (this.samples.length > 0 && this.samples[0].timestamp < cutoff) {
      this.samples.shift();
    }
  }

  getMetrics(now: number = Date.now()): ObservabilityMetrics {
    this.prune(now);
    const totalRequests = this.samples.length;
    let errorCount5xx = 0;
    let errorCount4xx = 0;
    let rateLimitedCount429 = 0;

    for (const s of this.samples) {
      if (s.status >= 500 && s.status < 600) {
        errorCount5xx++;
      } else if (s.status === 429) {
        rateLimitedCount429++;
        errorCount4xx++;
      } else if (s.status >= 400 && s.status < 500) {
        errorCount4xx++;
      }
    }

    const errorRate5xx = totalRequests > 0 ? errorCount5xx / totalRequests : 0;
    const uptimeSeconds = Math.max(0, Math.floor((now - this.startedAt) / 1000));

    return {
      totalRequests,
      errorCount5xx,
      errorCount4xx,
      rateLimitedCount429,
      errorRate5xx: Number(errorRate5xx.toFixed(4)),
      uptimeSeconds,
      windowDurationMs: this.windowDurationMs,
    };
  }

  getAlerts(now: number = Date.now()): ObservabilityAlert[] {
    const metrics = this.getMetrics(now);
    const alerts: ObservabilityAlert[] = [];

    if (
      metrics.totalRequests >= this.minRequestsForErrorRate &&
      metrics.errorRate5xx >= this.errorRateThreshold
    ) {
      alerts.push({
        code: 'HIGH_ERROR_RATE',
        severity: 'critical',
        subsystem: 'api',
        message: `High HTTP 5xx error rate detected: ${(metrics.errorRate5xx * 100).toFixed(1)}% (${metrics.errorCount5xx}/${metrics.totalRequests} requests failed) over ${this.windowDurationMs / 1000}s window.`,
        timestamp: new Date(now).toISOString(),
        metadata: {
          errorRate: metrics.errorRate5xx,
          errorCount5xx: metrics.errorCount5xx,
          totalRequests: metrics.totalRequests,
        },
      });
    }

    return alerts;
  }

  reset(): void {
    this.samples = [];
  }
}
