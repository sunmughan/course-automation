import { describe, expect, it, vi, beforeEach } from "vitest";
import { cache } from "./redis";
import { RateLimiter } from "./rate-limiter";
import { ExecutionWorkerPool } from "./worker-pool";
import { HealthMonitor } from "./health";
import { DistributedTracer } from "./tracer";

const { prismaMock, multiLangSandboxMock } = vi.hoisted(() => ({
  prismaMock: {
    $queryRaw: vi.fn(),
  },
  multiLangSandboxMock: {
    executeMultiLanguage: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/execution/multi-lang-sandbox", () => ({
  executeMultiLanguage: multiLangSandboxMock.executeMultiLanguage,
}));

describe("Wave 20: Production Infrastructure", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await cache.clear();
    ExecutionWorkerPool.resetForTesting();
  });

  describe("Redis & Cache Abstraction", () => {
    it("handles set, get, incr, expire, and del operations cleanly", async () => {
      await cache.set("test_key", "hello", 10);
      const val = await cache.get("test_key");
      expect(val).toBe("hello");

      const count = await cache.incr("counter_key");
      expect(count).toBe(1);
      const count2 = await cache.incr("counter_key");
      expect(count2).toBe(2);

      const ping = await cache.ping();
      expect(ping).toContain("PONG");

      const del = await cache.del("test_key");
      expect(del).toBe(1);
      expect(await cache.get("test_key")).toBeNull();
    });
  });

  describe("RateLimiter", () => {
    it("permits requests within quota and rejects when limit exceeded", async () => {
      const tier = { windowSeconds: 60, maxRequests: 3 };

      const r1 = await RateLimiter.checkLimit("user-test-1", tier);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = await RateLimiter.checkLimit("user-test-1", tier);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = await RateLimiter.checkLimit("user-test-1", tier);
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);

      const r4 = await RateLimiter.checkLimit("user-test-1", tier);
      expect(r4.allowed).toBe(false);
      expect(r4.remaining).toBe(0);

      const headers = RateLimiter.formatHeaders(r4);
      expect(headers["X-RateLimit-Limit"]).toBe("3");
      expect(headers["X-RateLimit-Remaining"]).toBe("0");
      expect(parseInt(headers["X-RateLimit-Reset"])).toBeGreaterThan(0);
    });
  });

  describe("ExecutionWorkerPool", () => {
    it("processes execution jobs and tracks worker pool health", async () => {
      multiLangSandboxMock.executeMultiLanguage.mockResolvedValue({
        output: "Hello World\n",
        executionTime: 0.05,
        memoryUsed: 12.3,
        status: "success",
        events: [],
      });

      const result = await ExecutionWorkerPool.submitJob({
        code: "console.log('Hello World');",
        language: "javascript",
        userId: "user-1",
      });

      expect(result.status).toBe("completed");
      expect(result.output).toBe("Hello World\n");
      expect(result.exitCode).toBe(0);

      const metrics = ExecutionWorkerPool.getMetrics();
      expect(metrics.totalJobsProcessed).toBe(1);
      expect(metrics.totalJobsFailed).toBe(0);
      expect(metrics.health).toBe("healthy");
    });
  });

  describe("HealthMonitor", () => {
    it("returns comprehensive health status across all subsystems", async () => {
      prismaMock.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const health = await HealthMonitor.getFullHealth();

      expect(health.status).toBeDefined();
      expect(health.components.database.status).toBe("healthy");
      expect(health.components.cache.status).toBe("healthy");
      expect(health.components.workers.status).toBe("healthy");
      expect(health.system.memoryUsageMB.rss).toBeGreaterThan(0);
    });
  });

  describe("DistributedTracer", () => {
    it("starts and ends execution spans with timing telemetry", async () => {
      const result = await DistributedTracer.withSpan("execute_code_block", async (span) => {
        expect(span.traceId).toBeDefined();
        expect(span.name).toBe("execute_code_block");
        return 42;
      });

      expect(result).toBe(42);
      const recent = DistributedTracer.getRecentSpans(5);
      expect(recent.length).toBeGreaterThanOrEqual(1);
      expect(recent[recent.length - 1].status).toBe("ok");
      expect(recent[recent.length - 1].durationMs).toBeDefined();
    });
  });
});
