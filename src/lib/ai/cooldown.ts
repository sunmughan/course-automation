export interface CooldownEntry {
  provider: string;
  model: string;
  cooldownUntil: number;
  reason: string;
  consecutiveFailures: number;
  lastFailure: number;
}

export interface CooldownConfig {
  baseCooldownMs: number;
  maxCooldownMs: number;
  backoffMultiplier: number;
  maxConsecutiveFailures: number;
  cleanupIntervalMs: number;
}

const DEFAULT_COOLDOWN_CONFIG: CooldownConfig = {
  baseCooldownMs: 10_000,
  maxCooldownMs: 300_000,
  backoffMultiplier: 2,
  maxConsecutiveFailures: 5,
  cleanupIntervalMs: 60_000,
};

export class ModelCooldownManager {
  private cooldowns: Map<string, CooldownEntry> = new Map();
  private config: CooldownConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(configOverride?: Partial<CooldownConfig>) {
    this.config = { ...DEFAULT_COOLDOWN_CONFIG, ...configOverride };
    this.startCleanup();
  }

  private getKey(provider: string, model: string): string {
    return `${provider}:${model}`;
  }

  isCoolingDown(provider: string, model: string): boolean {
    const key = this.getKey(provider, model);
    const entry = this.cooldowns.get(key);
    if (!entry) return false;

    if (Date.now() >= entry.cooldownUntil) {
      this.cooldowns.delete(key);
      return false;
    }

    return true;
  }

  getCooldownStatus(provider: string, model: string): {
    isCoolingDown: boolean;
    remainingMs: number;
    reason: string | null;
    consecutiveFailures: number;
  } {
    const key = this.getKey(provider, model);
    const entry = this.cooldowns.get(key);

    if (!entry) {
      return {
        isCoolingDown: false,
        remainingMs: 0,
        reason: null,
        consecutiveFailures: 0,
      };
    }

    const remainingMs = Math.max(0, entry.cooldownUntil - Date.now());

    if (remainingMs <= 0) {
      this.cooldowns.delete(key);
      return {
        isCoolingDown: false,
        remainingMs: 0,
        reason: null,
        consecutiveFailures: 0,
      };
    }

    return {
      isCoolingDown: true,
      remainingMs,
      reason: entry.reason,
      consecutiveFailures: entry.consecutiveFailures,
    };
  }

  recordFailure(provider: string, model: string, reason: string): void {
    const key = this.getKey(provider, model);
    const existing = this.cooldowns.get(key);
    const consecutiveFailures = (existing?.consecutiveFailures ?? 0) + 1;

    if (consecutiveFailures >= this.config.maxConsecutiveFailures) {
      const cooldownMs = Math.min(
        this.config.baseCooldownMs * Math.pow(this.config.backoffMultiplier, consecutiveFailures - this.config.maxConsecutiveFailures),
        this.config.maxCooldownMs
      );

      this.cooldowns.set(key, {
        provider,
        model,
        cooldownUntil: Date.now() + cooldownMs,
        reason,
        consecutiveFailures,
        lastFailure: Date.now(),
      });
    } else {
      this.cooldowns.set(key, {
        provider,
        model,
        cooldownUntil: existing?.cooldownUntil ?? 0,
        reason,
        consecutiveFailures,
        lastFailure: Date.now(),
      });
    }
  }

  recordSuccess(provider: string, model: string): void {
    const key = this.getKey(provider, model);
    this.cooldowns.delete(key);
  }

  getCooldownDuration(provider: string, model: string): number {
    const key = this.getKey(provider, model);
    const entry = this.cooldowns.get(key);
    if (!entry) return 0;
    return Math.max(0, entry.cooldownUntil - Date.now());
  }

  getAllCooldowns(): CooldownEntry[] {
    const now = Date.now();
    const active: CooldownEntry[] = [];

    for (const [, entry] of this.cooldowns) {
      if (now < entry.cooldownUntil) {
        active.push({ ...entry });
      }
    }

    active.sort((a, b) => a.cooldownUntil - b.cooldownUntil);
    return active;
  }

  getProviderCooldowns(provider: string): CooldownEntry[] {
    return this.getAllCooldowns().filter((c) => c.provider === provider);
  }

  resetCooldown(provider: string, model: string): void {
    const key = this.getKey(provider, model);
    this.cooldowns.delete(key);
  }

  resetAll(): void {
    this.cooldowns.clear();
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cooldowns) {
        if (now >= entry.cooldownUntil) {
          this.cooldowns.delete(key);
        }
      }
    }, this.config.cleanupIntervalMs);
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

export const modelCooldownManager = new ModelCooldownManager();