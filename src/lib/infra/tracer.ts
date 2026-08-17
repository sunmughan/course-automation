export interface Span {
  traceId: string;
  spanId: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  attributes: Record<string, unknown>;
  status: "ok" | "error";
  error?: string;
}

export class DistributedTracer {
  private static spans: Span[] = [];

  static createTraceId(): string {
    return `tr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  static createSpanId(): string {
    return `sp_${Math.random().toString(36).slice(2, 10)}`;
  }

  static startSpan(name: string, traceId?: string, attributes: Record<string, unknown> = {}): Span {
    const span: Span = {
      traceId: traceId || this.createTraceId(),
      spanId: this.createSpanId(),
      name,
      startTime: Date.now(),
      attributes,
      status: "ok",
    };
    return span;
  }

  static endSpan(span: Span, error?: Error): Span {
    span.endTime = Date.now();
    span.durationMs = span.endTime - span.startTime;
    if (error) {
      span.status = "error";
      span.error = error.message;
    }
    this.spans.push(span);
    if (this.spans.length > 500) this.spans.shift();
    return span;
  }

  static async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    attributes: Record<string, unknown> = {}
  ): Promise<T> {
    const span = this.startSpan(name, undefined, attributes);
    try {
      const result = await fn(span);
      this.endSpan(span);
      return result;
    } catch (err: any) {
      this.endSpan(span, err);
      throw err;
    }
  }

  static getRecentSpans(limit = 20): Span[] {
    return this.spans.slice(-limit);
  }
}
