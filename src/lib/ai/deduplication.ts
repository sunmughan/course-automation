import { createHash } from "crypto";

export interface PendingRequest {
  id: string;
  hash: string;
  createdAt: number;
  promise: Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

export interface DedupConfig {
  ttlMs: number;
  maxPendingRequests: number;
  cleanupIntervalMs: number;
}

const DEFAULT_DEDUP_CONFIG: DedupConfig = {
  ttlMs: 60_000,
  maxPendingRequests: 100,
  cleanupIntervalMs: 30_000,
};

export class RequestDeduplicator {
  private pending: Map<string, PendingRequest> = new Map();
  private config: DedupConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(configOverride?: Partial<DedupConfig>) {
    this.config = { ...DEFAULT_DEDUP_CONFIG, ...configOverride };
    this.startCleanup();
  }

  generateHash(
    provider: string,
    model: string,
    messages: { role: string; content: string }[],
    options?: Record<string, unknown>
  ): string {
    const content = JSON.stringify({
      provider,
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      options,
    });
    return createHash("sha256").update(content).digest("hex").substring(0, 16);
  }

  async deduplicate<T>(
    hash: string,
    executor: () => Promise<T>
  ): Promise<{ result: T; wasDeduplicated: boolean }> {
    const existing = this.pending.get(hash);

    if (existing) {
      if (Date.now() - existing.createdAt < this.config.ttlMs) {
        const result = await existing.promise as T;
        return { result, wasDeduplicated: true };
      }
      this.pending.delete(hash);
    }

    let resolvePromise!: (value: T) => void;
    let rejectPromise!: (error: Error) => void;

    const promise = new Promise<T>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    const pendingRequest: PendingRequest = {
      id: hash,
      hash,
      createdAt: Date.now(),
      promise: promise as Promise<unknown>,
      resolve: resolvePromise as (value: unknown) => void,
      reject: rejectPromise,
    };

    this.pending.set(hash, pendingRequest);

    if (this.pending.size > this.config.maxPendingRequests) {
      this.evictOldest();
    }

    try {
      const result = await executor();
      pendingRequest.resolve(result);
      return { result, wasDeduplicated: false };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      pendingRequest.reject(err);
      throw err;
    } finally {
      this.pending.delete(hash);
    }
  }

  getPendingCount(): number {
    return this.pending.size;
  }

  getPendingHashes(): string[] {
    return Array.from(this.pending.keys());
  }

  cancel(hash: string): boolean {
    const pending = this.pending.get(hash);
    if (pending) {
      pending.reject(new Error("Request cancelled"));
      this.pending.delete(hash);
      return true;
    }
    return false;
  }

  cancelAll(): void {
    for (const [, pending] of this.pending) {
      pending.reject(new Error("All requests cancelled"));
    }
    this.pending.clear();
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.pending) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const pending = this.pending.get(oldestKey);
      if (pending) {
        pending.reject(new Error("Request evicted due to capacity"));
      }
      this.pending.delete(oldestKey);
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.pending) {
        if (now - entry.createdAt > this.config.ttlMs) {
          entry.reject(new Error("Request timed out"));
          this.pending.delete(key);
        }
      }
    }, this.config.cleanupIntervalMs);
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.cancelAll();
  }
}

export const requestDeduplicator = new RequestDeduplicator();