import { prisma } from "@/lib/db";
import { cache } from "./redis";
import { ExecutionWorkerPool, type WorkerPoolMetrics } from "./worker-pool";

export interface ComponentHealth {
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface SystemHealthReport {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptimeSeconds: number;
  components: {
    database: ComponentHealth;
    cache: ComponentHealth;
    workers: ComponentHealth & { metrics?: WorkerPoolMetrics };
    aiGateway: ComponentHealth;
  };
  system: {
    nodeVersion: string;
    memoryUsageMB: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
  };
}

export class HealthMonitor {
  private static startTime = Date.now();

  static async getFullHealth(): Promise<SystemHealthReport> {
    const [dbHealth, cacheHealth, workerHealth, aiHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
      this.checkWorkers(),
      this.checkAIGateway(),
    ]);

    const componentStatuses = [dbHealth.status, cacheHealth.status, workerHealth.status, aiHealth.status];
    let overallStatus: SystemHealthReport["status"] = "healthy";

    if (componentStatuses.includes("unhealthy")) {
      overallStatus = "unhealthy";
    } else if (componentStatuses.includes("degraded")) {
      overallStatus = "degraded";
    }

    const mem = process.memoryUsage();

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      components: {
        database: dbHealth,
        cache: cacheHealth,
        workers: workerHealth,
        aiGateway: aiHealth,
      },
      system: {
        nodeVersion: process.version,
        memoryUsageMB: {
          rss: Math.round(mem.rss / (1024 * 1024)),
          heapTotal: Math.round(mem.heapTotal / (1024 * 1024)),
          heapUsed: Math.round(mem.heapUsed / (1024 * 1024)),
        },
      },
    };
  }

  private static async checkDatabase(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: "healthy",
        latencyMs: Date.now() - start,
        message: "PostgreSQL connected and responsive",
      };
    } catch (err: any) {
      return {
        status: "unhealthy",
        latencyMs: Date.now() - start,
        message: `Database check failed: ${err.message}`,
      };
    }
  }

  private static async checkCache(): Promise<ComponentHealth> {
    const start = Date.now();
    try {
      const res = await cache.ping();
      return {
        status: "healthy",
        latencyMs: Date.now() - start,
        message: res,
        details: { isRedis: cache.isRedisActive() },
      };
    } catch (err: any) {
      return {
        status: "degraded",
        latencyMs: Date.now() - start,
        message: `Cache warning: ${err.message}`,
      };
    }
  }

  private static async checkWorkers(): Promise<ComponentHealth & { metrics: WorkerPoolMetrics }> {
    const metrics = ExecutionWorkerPool.getMetrics();
    return {
      status: metrics.health === "overloaded" ? "degraded" : "healthy",
      message: `${metrics.activeWorkers}/${metrics.totalWorkers} workers active, ${metrics.queueDepth} in queue`,
      metrics,
    };
  }

  private static async checkAIGateway(): Promise<ComponentHealth> {
    const hasKeys = !!(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY);
    return {
      status: hasKeys ? "healthy" : "degraded",
      message: hasKeys ? "AI Gateway configured with active API providers" : "AI Gateway in mock/fallback mode (no keys configured)",
    };
  }
}
