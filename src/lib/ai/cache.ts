export interface CacheEntry<T = string> {
  key: string;
  value: T;
  createdAt: number;
  lastAccessedAt: number;
  accessCount: number;
  ttlMs: number;
  size: number;
  tags: string[];
}

export interface CacheConfig {
  maxEntries: number;
  maxSizeBytes: number;
  defaultTtlMs: number;
  semanticSimilarityThreshold: number;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxEntries: 500,
  maxSizeBytes: 50 * 1024 * 1024,
  defaultTtlMs: 30 * 60 * 1000,
  semanticSimilarityThreshold: 0.85,
};

export class SemanticCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private totalSize: number = 0;

  constructor(configOverride?: Partial<CacheConfig>) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...configOverride };
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.createdAt > entry.ttlMs) {
      this.cache.delete(key);
      this.totalSize -= entry.size;
      return null;
    }

    entry.lastAccessedAt = Date.now();
    entry.accessCount++;
    return entry.value;
  }

  set(key: string, value: string, options?: { ttlMs?: number; tags?: string[] }): void {
    const ttlMs = options?.ttlMs ?? this.config.defaultTtlMs;
    const size = Buffer.byteLength(value, "utf8") + Buffer.byteLength(key, "utf8");

    this.evict(size);

    const entry: CacheEntry = {
      key,
      value,
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
      ttlMs,
      size,
      tags: options?.tags || [],
    };

    this.cache.set(key, entry);
    this.totalSize += size;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.totalSize -= entry.size;
    }
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.totalSize = 0;
  }

  clearByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        this.totalSize -= entry.size;
        count++;
      }
    }
    return count;
  }

  private evict(neededSize: number): void {
    while (
      this.cache.size >= this.config.maxEntries ||
      this.totalSize + neededSize > this.config.maxSizeBytes
    ) {
      if (this.cache.size === 0) break;
      this.evictLRU();
    }
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.totalSize -= entry.size;
      }
      this.cache.delete(oldestKey);
    }
  }

  generateKey(
    provider: string,
    model: string,
    messages: { role: string; content: string }[],
    options?: { maxTokens?: number; temperature?: number }
  ): string {
    const content = messages.map((m) => `${m.role}:${m.content}`).join("|");
    const normalized = content.toLowerCase().replace(/\s+/g, " ").trim();
    const hash = this.simpleHash(normalized);
    return `${provider}:${model}:${hash}:${options?.temperature ?? 0.7}:${options?.maxTokens ?? 0}`;
  }

  findSimilar(
    messages: { role: string; content: string }[],
    provider?: string
  ): CacheEntry | null {
    const content = messages.map((m) => `${m.role}:${m.content}`).join("|");
    const normalizedQuery = content.toLowerCase().replace(/\s+/g, " ").trim();

    let bestMatch: CacheEntry | null = null;
    let bestSimilarity = 0;

    for (const [, entry] of this.cache) {
      if (provider && !entry.key.startsWith(provider + ":")) continue;
      if (Date.now() - entry.createdAt > entry.ttlMs) continue;

      const similarity = this.jaccardSimilarity(normalizedQuery, entry.key);
      if (similarity > bestSimilarity && similarity >= this.config.semanticSimilarityThreshold) {
        bestSimilarity = similarity;
        bestMatch = entry;
      }
    }

    return bestMatch;
  }

  private jaccardSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.split(/\s+/).filter((w) => w.length > 2));
    const wordsB = new Set(b.split(/\s+/).filter((w) => w.length > 2));

    if (wordsA.size === 0 || wordsB.size === 0) return 0;

    const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
    const union = new Set([...wordsA, ...wordsB]);

    return intersection.size / union.size;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  getStats(): {
    entries: number;
    totalSizeBytes: number;
    maxEntries: number;
    maxSizeBytes: number;
    hitRate: number;
    avgAccessCount: number;
  } {
    let totalAccessCount = 0;
    let entriesWithAccess = 0;

    for (const [, entry] of this.cache) {
      if (entry.accessCount > 0) {
        totalAccessCount += entry.accessCount;
        entriesWithAccess++;
      }
    }

    return {
      entries: this.cache.size,
      totalSizeBytes: this.totalSize,
      maxEntries: this.config.maxEntries,
      maxSizeBytes: this.config.maxSizeBytes,
      hitRate: this.cache.size > 0 ? entriesWithAccess / this.cache.size : 0,
      avgAccessCount: entriesWithAccess > 0 ? totalAccessCount / entriesWithAccess : 0,
    };
  }
}

export const semanticCache = new SemanticCache();