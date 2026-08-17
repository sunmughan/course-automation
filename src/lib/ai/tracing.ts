import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

export type TraceEventType =
  | "request.start"
  | "provider.selected"
  | "cache.hit"
  | "cache.miss"
  | "dedup.detected"
  | "provider.call.start"
  | "provider.call.end"
  | "provider.call.error"
  | "retry.attempt"
  | "fallback.triggered"
  | "budget.check"
  | "budget.exceeded"
  | "cooldown.skip"
  | "stream.chunk"
  | "request.complete"
  | "request.error";

export interface TraceEvent {
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  type: TraceEventType;
  timestamp: number;
  duration?: number;
  data: Record<string, unknown>;
}

export interface TraceSpan {
  id: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  type: TraceEventType;
  startTime: number;
  endTime?: number;
  duration?: number;
  events: TraceEvent[];
  children: TraceSpan[];
  status: "running" | "success" | "error";
  error?: string;
  metadata: Record<string, unknown>;
}

export interface AITrace {
  id: string;
  userId: string;
  spans: TraceSpan[];
  rootSpan: TraceSpan;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  status: "running" | "success" | "error";
  totalCost: number;
  totalTokens: number;
  providerCalls: number;
  cacheHits: number;
  dedupSavings: number;
  fallbackCount: number;
  retryCount: number;
}

export interface TracingConfig {
  enabled: boolean;
  maxTraces: number;
  maxEventsPerTrace: number;
  sampleRate: number;
  persistToDb: boolean;
}

const DEFAULT_TRACING_CONFIG: TracingConfig = {
  enabled: true,
  maxTraces: 1000,
  maxEventsPerTrace: 500,
  sampleRate: 1.0,
  persistToDb: false,
};

export class AITracer {
  private traces: Map<string, AITrace> = new Map();
  private config: TracingConfig;

  constructor(configOverride?: Partial<TracingConfig>) {
    this.config = { ...DEFAULT_TRACING_CONFIG, ...configOverride };
  }

  shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  startTrace(userId: string, metadata?: Record<string, unknown>): string {
    if (!this.config.enabled) return "";

    if (this.traces.size >= this.config.maxTraces) {
      const oldestKey = this.traces.keys().next().value;
      if (oldestKey) this.traces.delete(oldestKey);
    }

    const traceId = randomUUID();
    const rootSpanId = randomUUID();

    const rootSpan: TraceSpan = {
      id: rootSpanId,
      traceId,
      name: "ai.request",
      type: "request.start",
      startTime: Date.now(),
      events: [],
      children: [],
      status: "running",
      metadata: metadata || {},
    };

    const trace: AITrace = {
      id: traceId,
      userId,
      spans: [rootSpan],
      rootSpan,
      startTime: Date.now(),
      status: "running",
      totalCost: 0,
      totalTokens: 0,
      providerCalls: 0,
      cacheHits: 0,
      dedupSavings: 0,
      fallbackCount: 0,
      retryCount: 0,
    };

    this.traces.set(traceId, trace);
    return traceId;
  }

  startSpan(
    traceId: string,
    name: string,
    type: TraceEventType,
    parentSpanId?: string,
    metadata?: Record<string, unknown>
  ): string | null {
    if (!this.config.enabled || !traceId) return null;

    const trace = this.traces.get(traceId);
    if (!trace) return null;

    if (trace.spans.length >= this.config.maxEventsPerTrace) return null;

    const spanId = randomUUID();
    const parentId = parentSpanId || trace.rootSpan.id;

    const span: TraceSpan = {
      id: spanId,
      traceId,
      parentSpanId: parentId,
      name,
      type,
      startTime: Date.now(),
      events: [],
      children: [],
      status: "running",
      metadata: metadata || {},
    };

    const parentSpan = this.findSpan(trace, parentId);
    if (parentSpan) {
      parentSpan.children.push(span);
    }
    trace.spans.push(span);

    return spanId;
  }

  endSpan(
    traceId: string,
    spanId: string,
    status: "success" | "error" = "success",
    error?: string,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.config.enabled || !traceId) return;

    const trace = this.traces.get(traceId);
    if (!trace) return;

    const span = this.findSpan(trace, spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    if (error) span.error = error;
    if (metadata) Object.assign(span.metadata, metadata);
  }

  addEvent(
    traceId: string,
    spanId: string,
    type: TraceEventType,
    data: Record<string, unknown> = {}
  ): void {
    if (!this.config.enabled || !traceId) return;

    const trace = this.traces.get(traceId);
    if (!trace) return;

    const span = this.findSpan(trace, spanId);
    if (!span) return;

    if (span.events.length >= this.config.maxEventsPerTrace) return;

    span.events.push({
      id: randomUUID(),
      traceId,
      spanId,
      type,
      timestamp: Date.now(),
      data,
    });
  }

  endTrace(
    traceId: string,
    status: "success" | "error" = "success",
    metadata?: Record<string, unknown>
  ): AITrace | null {
    if (!this.config.enabled || !traceId) return null;

    const trace = this.traces.get(traceId);
    if (!trace) return null;

    trace.endTime = Date.now();
    trace.totalDuration = trace.endTime - trace.startTime;
    trace.status = status;

    trace.rootSpan.endTime = trace.endTime;
    trace.rootSpan.duration = trace.totalDuration;
    trace.rootSpan.status = status;

    if (metadata) {
      Object.assign(trace.rootSpan.metadata, metadata);
    }

    return trace;
  }

  getTrace(traceId: string): AITrace | null {
    return this.traces.get(traceId) || null;
  }

  getAllTraces(): AITrace[] {
    return Array.from(this.traces.values()).sort((a, b) => b.startTime - a.startTime);
  }

  getUserTraces(userId: string): AITrace[] {
    return this.getAllTraces().filter((t) => t.userId === userId);
  }

  getActiveTraces(): AITrace[] {
    return this.getAllTraces().filter((t) => t.status === "running");
  }

  async getPersistedTrace(requestId: string): Promise<Record<string, unknown> | null> {
    try {
      const record = await prisma.aIRequest.findUnique({
        where: { requestId },
      });
      if (!record) return null;

      let attemptedProviders: string[] = [];
      let attemptedModels: string[] = [];
      try {
        attemptedProviders = JSON.parse(record.attemptedProviders || "[]");
      } catch {
        attemptedProviders = [];
      }
      try {
        attemptedModels = JSON.parse(record.attemptedModels || "[]");
      } catch {
        attemptedModels = [];
      }

      return {
        id: record.requestId,
        requestId: record.requestId,
        userId: record.userId,
        organizationId: record.organizationId,
        sessionId: record.sessionId,
        provider: record.provider,
        model: record.model,
        agent: record.agent,
        mode: record.mode,
        status: record.status,
        latency: record.latency,
        cost: record.cost,
        estimatedCost: record.estimatedCost,
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        totalTokens: record.totalTokens,
        fallbackUsed: record.fallbackUsed,
        attemptedProviders,
        attemptedModels,
        finalProvider: record.finalProvider,
        error: record.error,
        startedAt: record.startedAt,
        completedAt: record.completedAt,
        createdAt: record.createdAt,
      };
    } catch {
      return null;
    }
  }

  async getPersistedUserTraces(userId: string, limit: number = 50): Promise<Array<Record<string, unknown>>> {
    try {
      const records = await prisma.aIRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return records.map((record) => {
        let attemptedProviders: string[] = [];
        let attemptedModels: string[] = [];
        try {
          attemptedProviders = JSON.parse(record.attemptedProviders || "[]");
        } catch {
          attemptedProviders = [];
        }
        try {
          attemptedModels = JSON.parse(record.attemptedModels || "[]");
        } catch {
          attemptedModels = [];
        }

        return {
          id: record.requestId,
          requestId: record.requestId,
          userId: record.userId,
          organizationId: record.organizationId,
          sessionId: record.sessionId,
          provider: record.provider,
          model: record.model,
          agent: record.agent,
          mode: record.mode,
          status: record.status,
          latency: record.latency,
          cost: record.cost,
          estimatedCost: record.estimatedCost,
          inputTokens: record.inputTokens,
          outputTokens: record.outputTokens,
          totalTokens: record.totalTokens,
          fallbackUsed: record.fallbackUsed,
          attemptedProviders,
          attemptedModels,
          finalProvider: record.finalProvider,
          error: record.error,
          startedAt: record.startedAt,
          completedAt: record.completedAt,
          createdAt: record.createdAt,
        };
      });
    } catch {
      return [];
    }
  }

  getTraceSummary(traceId: string): Record<string, unknown> | null {
    const trace = this.traces.get(traceId);
    if (!trace) return null;

    return {
      id: trace.id,
      userId: trace.userId,
      status: trace.status,
      totalDuration: trace.totalDuration,
      totalCost: trace.totalCost,
      totalTokens: trace.totalTokens,
      providerCalls: trace.providerCalls,
      cacheHits: trace.cacheHits,
      dedupSavings: trace.dedupSavings,
      fallbackCount: trace.fallbackCount,
      retryCount: trace.retryCount,
      spanCount: trace.spans.length,
      startTime: new Date(trace.startTime).toISOString(),
      endTime: trace.endTime ? new Date(trace.endTime).toISOString() : null,
    };
  }

  getTraceTree(traceId: string): Record<string, unknown> | null {
    const trace = this.traces.get(traceId);
    if (!trace) return null;
    return this.spanToTree(trace.rootSpan);
  }

  private spanToTree(span: TraceSpan): Record<string, unknown> {
    return {
      id: span.id,
      name: span.name,
      type: span.type,
      duration: span.duration,
      status: span.status,
      error: span.error,
      metadata: span.metadata,
      eventCount: span.events.length,
      children: span.children.map((c) => this.spanToTree(c)),
    };
  }

  private findSpan(trace: AITrace, spanId: string): TraceSpan | undefined {
    if (trace.rootSpan.id === spanId) return trace.rootSpan;
    return trace.spans.find((s) => s.id === spanId);
  }

  incrementMetric(traceId: string, metric: keyof Pick<AITrace, "providerCalls" | "cacheHits" | "dedupSavings" | "fallbackCount" | "retryCount">): void {
    const trace = this.traces.get(traceId);
    if (trace) {
      (trace[metric] as number)++;
    }
  }

  addCost(traceId: string, tokens: number, cost: number): void {
    const trace = this.traces.get(traceId);
    if (trace) {
      trace.totalTokens += tokens;
      trace.totalCost += cost;
    }
  }

  cleanup(maxAgeMs: number = 3_600_000): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [id, trace] of this.traces) {
      if (trace.endTime && trace.endTime < cutoff) {
        this.traces.delete(id);
      }
    }
  }

  clear(): void {
    this.traces.clear();
  }
}

export const aiTracer = new AITracer();