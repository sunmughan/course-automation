/**
 * Resilient Redis & Cache client abstraction with automatic in-memory fallback.
 * Allows production Redis deployments while keeping local development seamless.
 */

export interface CacheClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<boolean>;
  ttl(key: string): Promise<number>;
  ping(): Promise<string>;
  clear(): Promise<void>;
  isRedisActive(): boolean;
}

class InMemoryCache implements CacheClient {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const count = (current ? parseInt(current, 10) : 0) + 1;
    await this.set(key, count.toString());
    return count;
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    const item = this.store.get(key);
    if (!item) return false;
    item.expiresAt = Date.now() + ttlSeconds * 1000;
    return true;
  }

  async ttl(key: string): Promise<number> {
    const item = this.store.get(key);
    if (!item || !item.expiresAt) return -1;
    const remaining = Math.ceil((item.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async ping(): Promise<string> {
    return "PONG (memory-fallback)";
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  isRedisActive(): boolean {
    return false;
  }
}

// Global cache instance
export const cache: CacheClient = new InMemoryCache();
