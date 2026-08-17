import { cache } from "./redis";

export interface RateLimitConfig {
  windowSeconds: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export const RATE_LIMIT_TIERS: Record<string, RateLimitConfig> = {
  public: { windowSeconds: 60, maxRequests: 60 },          // 60 req/min
  authenticated: { windowSeconds: 60, maxRequests: 180 },  // 180 req/min
  code_execution: { windowSeconds: 60, maxRequests: 30 },  // 30 runs/min
  ai_generation: { windowSeconds: 60, maxRequests: 20 },   // 20 AI req/min
};

export class RateLimiter {
  /**
   * Checks and enforces rate limits for an identifier (IP address, user ID, or API key).
   */
  static async checkLimit(
    identifier: string,
    tier: keyof typeof RATE_LIMIT_TIERS | RateLimitConfig = "public"
  ): Promise<RateLimitResult> {
    const config = typeof tier === "string" ? RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS.public : tier;
    const now = Math.floor(Date.now() / 1000);
    const windowKey = `ratelimit:${identifier}:${Math.floor(now / config.windowSeconds)}`;

    const currentCount = await cache.incr(windowKey);
    if (currentCount === 1) {
      await cache.expire(windowKey, config.windowSeconds);
    }

    const remaining = Math.max(0, config.maxRequests - currentCount);
    const resetSeconds = config.windowSeconds - (now % config.windowSeconds);

    return {
      allowed: currentCount <= config.maxRequests,
      limit: config.maxRequests,
      remaining,
      resetSeconds,
    };
  }

  /**
   * Formats standard rate limit HTTP headers.
   */
  static formatHeaders(result: RateLimitResult): Record<string, string> {
    return {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.resetSeconds.toString(),
    };
  }
}
