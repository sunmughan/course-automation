export interface HealthSnapshot {
  timestamp: number;
  isHealthy: boolean;
  latency: number;
  success: boolean;
  errorMessage?: string;
}

export interface HealthMetrics {
  provider: string;
  isHealthy: boolean;
  successRate: number;
  errorRate: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  requestCount: number;
  lastChecked: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  circuitState: "closed" | "open" | "half-open";
  circuitOpenedAt: number | null;
  history: HealthSnapshot[];
  windowStats: {
    windowMs: number;
    successRate: number;
    avgLatency: number;
    requestCount: number;
  };
}

export interface HealthMonitorConfig {
  historySize: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeoutMs: number;
  halfOpenMaxSuccesses: number;
  healthCheckIntervalMs: number;
  windowSizes: number[];
  latencyBuckets: number[];
}

const DEFAULT_CONFIG: HealthMonitorConfig = {
  historySize: 100,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeoutMs: 30_000,
  halfOpenMaxSuccesses: 3,
  healthCheckIntervalMs: 60_000,
  windowSizes: [60_000, 300_000, 900_000],
  latencyBuckets: [100, 250, 500, 1000, 2500, 5000, 10000, 30000],
};

export class ProviderHealthMonitor {
  private metrics: Map<string, HealthMetrics> = new Map();
  private config: HealthMonitorConfig;

  constructor(configOverride?: Partial<HealthMonitorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...configOverride };
  }

  private getOrCreateMetrics(provider: string): HealthMetrics {
    if (!this.metrics.has(provider)) {
      this.metrics.set(provider, {
        provider,
        isHealthy: true,
        successRate: 100,
        errorRate: 0,
        avgLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        requestCount: 0,
        lastChecked: 0,
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        circuitState: "closed",
        circuitOpenedAt: null,
        history: [],
        windowStats: {
          windowMs: this.config.windowSizes[1] || 300_000,
          successRate: 100,
          avgLatency: 0,
          requestCount: 0,
        },
      });
    }
    return this.metrics.get(provider)!;
  }

  recordSuccess(provider: string, latency: number): void {
    const metrics = this.getOrCreateMetrics(provider);
    metrics.requestCount++;
    metrics.consecutiveSuccesses++;
    metrics.consecutiveFailures = 0;

    if (metrics.circuitState === "half-open") {
      if (metrics.consecutiveSuccesses >= this.config.halfOpenMaxSuccesses) {
        metrics.circuitState = "closed";
        metrics.circuitOpenedAt = null;
        metrics.isHealthy = true;
      }
    }

    metrics.history.push({
      timestamp: Date.now(),
      isHealthy: true,
      latency,
      success: true,
    });

    this.pruneHistory(metrics);
    this.recalculateMetrics(metrics);
  }

  recordFailure(provider: string, latency: number, errorMessage?: string): void {
    const metrics = this.getOrCreateMetrics(provider);
    metrics.requestCount++;
    metrics.consecutiveFailures++;
    metrics.consecutiveSuccesses = 0;

    metrics.history.push({
      timestamp: Date.now(),
      isHealthy: false,
      latency,
      success: false,
      errorMessage,
    });

    if (
      metrics.consecutiveFailures >= this.config.circuitBreakerThreshold &&
      metrics.circuitState === "closed"
    ) {
      metrics.circuitState = "open";
      metrics.circuitOpenedAt = Date.now();
      metrics.isHealthy = false;
    }

    this.pruneHistory(metrics);
    this.recalculateMetrics(metrics);
  }

  checkCircuitState(provider: string): "closed" | "open" | "half-open" {
    const metrics = this.getOrCreateMetrics(provider);

    if (
      metrics.circuitState === "open" &&
      metrics.circuitOpenedAt &&
      Date.now() - metrics.circuitOpenedAt > this.config.circuitBreakerTimeoutMs
    ) {
      metrics.circuitState = "half-open";
      metrics.consecutiveSuccesses = 0;
    }

    return metrics.circuitState;
  }

  isCircuitOpen(provider: string): boolean {
    return this.checkCircuitState(provider) === "open";
  }

  isProviderAvailable(provider: string): boolean {
    const state = this.checkCircuitState(provider);
    return state !== "open";
  }

  getMetrics(provider: string): HealthMetrics {
    this.checkCircuitState(provider);
    return this.getOrCreateMetrics(provider);
  }

  getAllMetrics(): Map<string, HealthMetrics> {
    for (const provider of this.metrics.keys()) {
      this.checkCircuitState(provider);
    }
    return new Map(this.metrics);
  }

  getHealthSummary(provider: string): {
    isHealthy: boolean;
    circuitState: string;
    successRate: number;
    avgLatency: number;
    p95Latency: number;
    requestCount: number;
    lastChecked: number;
  } {
    const metrics = this.getOrCreateMetrics(provider);
    this.checkCircuitState(provider);
    return {
      isHealthy: metrics.isHealthy,
      circuitState: metrics.circuitState,
      successRate: metrics.successRate,
      avgLatency: metrics.avgLatency,
      p95Latency: metrics.p95Latency,
      requestCount: metrics.requestCount,
      lastChecked: metrics.lastChecked,
    };
  }

  shouldHealthCheck(provider: string): boolean {
    const metrics = this.getOrCreateMetrics(provider);
    return Date.now() - metrics.lastChecked > this.config.healthCheckIntervalMs;
  }

  markHealthChecked(provider: string): void {
    const metrics = this.getOrCreateMetrics(provider);
    metrics.lastChecked = Date.now();
  }

  private pruneHistory(metrics: HealthMetrics): void {
    if (metrics.history.length > this.config.historySize) {
      metrics.history = metrics.history.slice(-this.config.historySize);
    }
  }

  private recalculateMetrics(metrics: HealthMetrics): void {
    const history = metrics.history;
    if (history.length === 0) return;

    const total = history.length;
    const successes = history.filter((h) => h.success).length;
    metrics.successRate = Math.round((successes / total) * 100);
    metrics.errorRate = 100 - metrics.successRate;

    const latencies = history.filter((h) => h.success).map((h) => h.latency);
    if (latencies.length > 0) {
      metrics.avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
      const sorted = [...latencies].sort((a, b) => a - b);
      metrics.p50Latency = sorted[Math.floor(sorted.length * 0.5)];
      metrics.p95Latency = sorted[Math.floor(sorted.length * 0.95)];
      metrics.p99Latency = sorted[Math.floor(sorted.length * 0.99)];
    }

    const now = Date.now();
    const windowMs = this.config.windowSizes[1] || 300_000;
    const recentSnapshots = history.filter((h) => now - h.timestamp <= windowMs);
    if (recentSnapshots.length > 0) {
      const recentSuccesses = recentSnapshots.filter((h) => h.success).length;
      const recentLatencies = recentSnapshots.filter((h) => h.success).map((h) => h.latency);
      metrics.windowStats = {
        windowMs,
        successRate: Math.round((recentSuccesses / recentSnapshots.length) * 100),
        avgLatency: recentLatencies.length > 0
          ? Math.round(recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length)
          : 0,
        requestCount: recentSnapshots.length,
      };
    }
  }

  getLatencyDistribution(provider: string): Record<string, number> {
    const metrics = this.getOrCreateMetrics(provider);
    const distribution: Record<string, number> = {};
    const latencies = metrics.history.filter((h) => h.success).map((h) => h.latency);

    for (let i = 0; i < this.config.latencyBuckets.length; i++) {
      const bucket = this.config.latencyBuckets[i];
      const prevBucket = i > 0 ? this.config.latencyBuckets[i - 1] : 0;
      const label = i === this.config.latencyBuckets.length - 1
        ? `${prevBucket}+ms`
        : `${prevBucket}-${bucket}ms`;
      distribution[label] = latencies.filter((l) => l > prevBucket && l <= bucket).length;
    }

    distribution[`${this.config.latencyBuckets[this.config.latencyBuckets.length - 1]}+ms`] =
      latencies.filter((l) => l > this.config.latencyBuckets[this.config.latencyBuckets.length - 1]).length;

    return distribution;
  }

  reset(provider: string): void {
    this.metrics.delete(provider);
  }

  resetAll(): void {
    this.metrics.clear();
  }
}

export const providerHealthMonitor = new ProviderHealthMonitor();