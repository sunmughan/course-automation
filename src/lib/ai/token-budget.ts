import { prisma } from "@/lib/db";
import type { ProviderCallResult } from "./gateway";

export interface TokenBudgetConfig {
  dailyTokens: number;
  dailyCost: number;
  monthlyTokens: number;
  monthlyCost: number;
  maxTokensPerRequest: number;
  maxCostPerRequest: number;
  warnAtPercent: number;
  blockAtPercent: number;
}

export interface UserBudget {
  userId: string;
  daily: { used: number; limit: number; remaining: number; percentUsed: number };
  monthly: { used: number; limit: number; remaining: number; percentUsed: number };
  requestCount: number;
  isBlocked: boolean;
  isWarned: boolean;
  breakdown: Array<{
    provider: string;
    model: string;
    tokens: number;
    cost: number;
    requests: number;
  }>;
}

export interface OrgBudget {
  orgId: string;
  daily: { used: number; limit: number; remaining: number; percentUsed: number };
  monthly: { used: number; limit: number; remaining: number; percentUsed: number };
  totalUsers: number;
  activeUsers: number;
  isBlocked: boolean;
  topUsers: Array<{ userId: string; tokens: number; cost: number }>;
}

const DEFAULT_BUDGET_CONFIG: TokenBudgetConfig = {
  dailyTokens: 1_000_000,
  dailyCost: 0.50,
  monthlyTokens: 20_000_000,
  monthlyCost: 10.00,
  maxTokensPerRequest: 32768,
  maxCostPerRequest: 0.05,
  warnAtPercent: 80,
  blockAtPercent: 100,
};

const ORG_BUDGET_MULTIPLIER = 10;

export class TokenBudgetManager {
  private config: TokenBudgetConfig;
  private userCache: Map<string, { budget: UserBudget; timestamp: number }> = new Map();
  private orgCache: Map<string, { budget: OrgBudget; timestamp: number }> = new Map();
  private readonly cacheTtlMs = 30_000;

  constructor(configOverride?: Partial<TokenBudgetConfig>) {
    this.config = { ...DEFAULT_BUDGET_CONFIG, ...configOverride };
  }

  updateConfig(partial: Partial<TokenBudgetConfig>): void {
    this.config = { ...this.config, ...partial };
    this.userCache.clear();
    this.orgCache.clear();
  }

  getConfig(): TokenBudgetConfig {
    return { ...this.config };
  }

  async getUserBudget(userId: string): Promise<UserBudget> {
    const cached = this.userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.budget;
    }

    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dailyUsage, monthlyUsage] = await Promise.all([
      this.getUsageInRange(userId, dayStart, now),
      this.getUsageInRange(userId, monthStart, now),
    ]);

    const dailyUsed = dailyUsage.totalTokens;
    const dailyCostUsed = dailyUsage.totalCost;
    const monthlyUsed = monthlyUsage.totalTokens;
    const monthlyCostUsed = monthlyUsage.totalCost;

    const dailyPercent = (dailyUsed / this.config.dailyTokens) * 100;
    const monthlyPercent = (monthlyUsed / this.config.monthlyTokens) * 100;

    const budget: UserBudget = {
      userId,
      daily: {
        used: dailyUsed,
        limit: this.config.dailyTokens,
        remaining: Math.max(0, this.config.dailyTokens - dailyUsed),
        percentUsed: Math.round(dailyPercent * 100) / 100,
      },
      monthly: {
        used: monthlyUsed,
        limit: this.config.monthlyTokens,
        remaining: Math.max(0, this.config.monthlyTokens - monthlyUsed),
        percentUsed: Math.round(monthlyPercent * 100) / 100,
      },
      requestCount: dailyUsage.requestCount,
      isBlocked:
        dailyPercent >= this.config.blockAtPercent ||
        monthlyPercent >= this.config.blockAtPercent,
      isWarned:
        dailyPercent >= this.config.warnAtPercent ||
        monthlyPercent >= this.config.warnAtPercent,
      breakdown: dailyUsage.providerBreakdown,
    };

    this.userCache.set(userId, { budget, timestamp: Date.now() });
    return budget;
  }

  async getOrgBudget(orgId: string): Promise<OrgBudget> {
    const cached = this.orgCache.get(orgId);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.budget;
    }

    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const orgDailyLimit = this.config.dailyTokens * ORG_BUDGET_MULTIPLIER;
    const orgMonthlyLimit = this.config.monthlyTokens * ORG_BUDGET_MULTIPLIER;

    let dailyUsed = 0;
    let dailyCostUsed = 0;
    let monthlyUsed = 0;
    let monthlyCostUsed = 0;
    let totalUsers = 0;
    let activeUsers = 0;
    const userMap = new Map<string, { tokens: number; cost: number }>();

    try {
      const orgUsers = await prisma.user.findMany({
        select: { id: true },
      });
      totalUsers = orgUsers.length;

      for (const user of orgUsers) {
        const [daily, monthly] = await Promise.all([
          this.getUsageInRange(user.id, dayStart, now),
          this.getUsageInRange(user.id, monthStart, now),
        ]);

        dailyUsed += daily.totalTokens;
        dailyCostUsed += daily.totalCost;
        monthlyUsed += monthly.totalTokens;
        monthlyCostUsed += monthly.totalCost;

        if (daily.requestCount > 0) {
          activeUsers++;
          userMap.set(user.id, { tokens: monthly.totalTokens, cost: monthly.totalCost });
        }
      }
    } catch {
      // DB might not have orgId field yet
    }

    const dailyPercent = (dailyUsed / orgDailyLimit) * 100;
    const monthlyPercent = (monthlyUsed / orgMonthlyLimit) * 100;

    const topUsers = Array.from(userMap.entries())
      .sort((a, b) => b[1].tokens - a[1].tokens)
      .slice(0, 10)
      .map(([userId, stats]) => ({ userId, tokens: stats.tokens, cost: stats.cost }));

    const budget: OrgBudget = {
      orgId,
      daily: {
        used: dailyUsed,
        limit: orgDailyLimit,
        remaining: Math.max(0, orgDailyLimit - dailyUsed),
        percentUsed: Math.round(dailyPercent * 100) / 100,
      },
      monthly: {
        used: monthlyUsed,
        limit: orgMonthlyLimit,
        remaining: Math.max(0, orgMonthlyLimit - monthlyUsed),
        percentUsed: Math.round(monthlyPercent * 100) / 100,
      },
      totalUsers,
      activeUsers,
      isBlocked:
        dailyPercent >= this.config.blockAtPercent ||
        monthlyPercent >= this.config.blockAtPercent,
      topUsers,
    };

    this.orgCache.set(orgId, { budget, timestamp: Date.now() });
    return budget;
  }

  async checkRequestBudget(
    userId: string,
    estimatedTokens: number,
    estimatedCost: number
  ): Promise<{ allowed: boolean; reason?: string }> {
    if (estimatedTokens > this.config.maxTokensPerRequest) {
      return {
        allowed: false,
        reason: `Request exceeds max tokens per request (${estimatedTokens} > ${this.config.maxTokensPerRequest})`,
      };
    }

    if (estimatedCost > this.config.maxCostPerRequest) {
      return {
        allowed: false,
        reason: `Request exceeds max cost per request ($${estimatedCost.toFixed(4)} > $${this.config.maxCostPerRequest.toFixed(4)})`,
      };
    }

    const budget = await this.getUserBudget(userId);

    if (budget.isBlocked) {
      return {
        allowed: false,
        reason: `Daily/monthly budget exhausted. Daily: ${budget.daily.percentUsed}%, Monthly: ${budget.monthly.percentUsed}%`,
      };
    }

    if (estimatedTokens > budget.daily.remaining) {
      return {
        allowed: false,
        reason: `Insufficient daily token budget (need ${estimatedTokens}, have ${budget.daily.remaining})`,
      };
    }

    return { allowed: true };
  }

  async recordUsage(
    userId: string,
    result: Omit<ProviderCallResult, "latency" | "cached" | "deduplicated">
  ): Promise<void> {
    this.userCache.delete(userId);

    try {
      await prisma.aIRequest.create({
        data: {
          userId,
          provider: result.provider,
          model: result.model,
          mode: "chat",
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          cost: result.cost,
          status: "success",
          latency: 0,
        },
      });
    } catch {
      // Non-critical
    }
  }

  async recordFailedUsage(
    userId: string,
    provider: string,
    model: string,
    errorMessage: string
  ): Promise<void> {
    this.userCache.delete(userId);

    try {
      await prisma.aIRequest.create({
        data: {
          userId,
          provider,
          model,
          mode: "chat",
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          status: "failed",
        },
      });
    } catch {
      // Non-critical
    }
  }

  private async getUsageInRange(
    userId: string,
    start: Date,
    end: Date
  ): Promise<{
    totalTokens: number;
    totalCost: number;
    requestCount: number;
    providerBreakdown: Array<{
      provider: string;
      model: string;
      tokens: number;
      cost: number;
      requests: number;
    }>;
  }> {
    try {
      const requests = await prisma.aIRequest.findMany({
        where: {
          userId,
          createdAt: { gte: start, lte: end },
          status: "success",
        },
        select: {
          provider: true,
          model: true,
          inputTokens: true,
          outputTokens: true,
          cost: true,
        },
      });

      let totalTokens = 0;
      let totalCost = 0;
      const breakdownMap = new Map<
        string,
        { provider: string; model: string; tokens: number; cost: number; requests: number }
      >();

      for (const req of requests) {
        const tokens = req.inputTokens + req.outputTokens;
        totalTokens += tokens;
        totalCost += req.cost;

        const key = `${req.provider}:${req.model}`;
        if (!breakdownMap.has(key)) {
          breakdownMap.set(key, {
            provider: req.provider,
            model: req.model,
            tokens: 0,
            cost: 0,
            requests: 0,
          });
        }
        const entry = breakdownMap.get(key)!;
        entry.tokens += tokens;
        entry.cost += req.cost;
        entry.requests++;
      }

      return {
        totalTokens,
        totalCost: Math.round(totalCost * 10000) / 10000,
        requestCount: requests.length,
        providerBreakdown: Array.from(breakdownMap.values()).sort(
          (a, b) => b.tokens - a.tokens
        ),
      };
    } catch {
      return {
        totalTokens: 0,
        totalCost: 0,
        requestCount: 0,
        providerBreakdown: [],
      };
    }
  }

  async getUserUsageHistory(
    userId: string,
    days: number = 7
  ): Promise<Array<{ date: string; tokens: number; cost: number; requests: number }>> {
    const history: Array<{ date: string; tokens: number; cost: number; requests: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const usage = await this.getUsageInRange(userId, dayStart, dayEnd);
      history.push({
        date: dayStart.toISOString().split("T")[0],
        tokens: usage.totalTokens,
        cost: usage.totalCost,
        requests: usage.requestCount,
      });
    }

    return history;
  }

  invalidateCache(userId?: string): void {
    if (userId) {
      this.userCache.delete(userId);
    } else {
      this.userCache.clear();
      this.orgCache.clear();
    }
  }
}

export const tokenBudgetManager = new TokenBudgetManager();