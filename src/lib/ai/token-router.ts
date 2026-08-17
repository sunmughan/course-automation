import { prisma } from "@/lib/db";
import { createAIRequestId, persistAIRequest } from "./persistence";
import { providerHealthMonitor } from "./health-monitor";
import {
  aiGateway,
  type AIModelInfo,
  type AIProviderConfig,
  type ProviderCallResult,
  type StreamChunk,
} from "./gateway";
import type { TaskType } from "./router";

export interface BudgetConfig {
  maxTokensPerRequest: number;
  maxCostPerRequest: number;
  dailyTokenBudget: number;
  dailyCostBudget: number;
  preferCheapest: boolean;
}

export interface TokenAllocation {
  provider: string;
  model: string;
  estimatedInputTokens: number;
  maxOutputTokens: number;
  estimatedCost: number;
  isWithinBudget: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface DailyUsage {
  date: string;
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  providerBreakdown: Record<string, TokenUsage>;
}

const DEFAULT_BUDGET: BudgetConfig = {
  maxTokensPerRequest: 32768,
  maxCostPerRequest: 0.05,
  dailyTokenBudget: 1_000_000,
  dailyCostBudget: 0.50,
  preferCheapest: true,
};

const COMPLEXITY_TOKEN_ALLOCATION: Record<string, { input: number; output: number }> = {
  low: { input: 2048, output: 2048 },
  medium: { input: 4096, output: 4096 },
  high: { input: 8192, output: 8192 },
};

const TASK_TOKEN_MULTIPLIER: Record<string, number> = {
  explain: 1.0,
  code_generation: 1.5,
  debugging: 1.2,
  architecture: 1.5,
  visualization: 0.8,
  simple_qa: 0.3,
  "deep-dive": 2.0,
  compare: 1.2,
  review: 1.0,
  socratic: 0.8,
  hint: 0.5,
  simplify: 0.7,
  practice: 1.3,
  interview: 1.5,
};

export class TokenRouter {
  private budget: BudgetConfig;
  private dailyUsageCache: Map<string, DailyUsage> = new Map();

  constructor(budgetOverride?: Partial<BudgetConfig>) {
    this.budget = { ...DEFAULT_BUDGET, ...budgetOverride };
  }

  updateBudget(config: Partial<BudgetConfig>): void {
    this.budget = { ...this.budget, ...config };
  }

  getBudget(): BudgetConfig {
    return { ...this.budget };
  }

  estimateTokens(text: string): number {
    return typeof aiGateway?.estimateTokens === "function"
      ? aiGateway.estimateTokens(text)
      : Math.ceil((text || "").length / 4);
  }

  estimateCost(providerName: string, modelName: string, inputTokens: number, outputTokens: number): number {
    const provider = aiGateway.getProvider(providerName);
    if (!provider) return 0;
    const model = provider.models.find((m) => m.name === modelName);
    if (!model) return 0;
    return ((inputTokens + outputTokens) / 1000) * model.costPer1K;
  }

  estimateTaskTokens(
    taskType: string,
    complexity: "low" | "medium" | "high",
    inputText: string
  ): { inputTokens: number; outputTokens: number } {
    const baseAllocation = COMPLEXITY_TOKEN_ALLOCATION[complexity] || COMPLEXITY_TOKEN_ALLOCATION.medium;
    const multiplier = TASK_TOKEN_MULTIPLIER[taskType] || 1.0;
    const textTokenEstimate = this.estimateTokens(inputText);

    return {
      inputTokens: Math.max(textTokenEstimate, baseAllocation.input),
      outputTokens: Math.round(baseAllocation.output * multiplier),
    };
  }

  selectModel(
    taskType: string,
    complexity: "low" | "medium" | "high",
    inputText: string,
    options?: {
      preferredProvider?: string;
      preferredModel?: string;
      maxBudget?: number;
    }
  ): TokenAllocation | null {
    const { inputTokens, outputTokens } = this.estimateTaskTokens(taskType, complexity, inputText);

    if (inputTokens > this.budget.maxTokensPerRequest) {
      return null;
    }

    const maxBudget = options?.maxBudget ?? this.budget.maxCostPerRequest;

    const preferredProvider = options?.preferredProvider;
    const preferredModel = options?.preferredModel;

    if (preferredProvider && preferredModel) {
      const provider = aiGateway.getProvider(preferredProvider);
      if (provider && !providerHealthMonitor.isCircuitOpen(preferredProvider)) {
        const model = provider.models.find((m) => m.name === preferredModel);
        if (model) {
          const cost = this.estimateCost(preferredProvider, preferredModel, inputTokens, outputTokens);
          return {
            provider: preferredProvider,
            model: preferredModel,
            estimatedInputTokens: inputTokens,
            maxOutputTokens: outputTokens,
            estimatedCost: cost,
            isWithinBudget: cost <= maxBudget,
          };
        }
      }
    }

    const candidates: TokenAllocation[] = [];

    for (const provider of aiGateway.getActiveProviders()) {
      for (const model of provider.models) {
        if (!model.capabilities.includes(taskType)) continue;
        if (model.maxTokens < inputTokens + outputTokens) continue;

        const cost = this.estimateCost(provider.name, model.name, inputTokens, outputTokens);
        const isWithinBudget = cost <= maxBudget;

        candidates.push({
          provider: provider.name,
          model: model.name,
          estimatedInputTokens: inputTokens,
          maxOutputTokens: outputTokens,
          estimatedCost: cost,
          isWithinBudget,
        });
      }
    }

    if (candidates.length === 0) {
      const fallback = this.findFallbackAllocation(taskType, inputTokens, outputTokens, maxBudget);
      if (fallback) {
        return { ...fallback, isWithinBudget: true };
      }
      return null;
    }

    if (this.budget.preferCheapest) {
      candidates.sort((a, b) => a.estimatedCost - b.estimatedCost);
    } else {
      candidates.sort((a, b) => {
        if (a.isWithinBudget !== b.isWithinBudget) {
          return a.isWithinBudget ? -1 : 1;
        }
        return a.estimatedCost - b.estimatedCost;
      });
    }

    const best = candidates[0];
    const withinBudgetCandidates = candidates.filter((c) => c.isWithinBudget);
    if (withinBudgetCandidates.length > 0) {
      return withinBudgetCandidates[0];
    }

    return { ...best, isWithinBudget: false };
  }

  private findFallbackAllocation(
    taskType: string,
    inputTokens: number,
    outputTokens: number,
    maxBudget: number
  ): Omit<TokenAllocation, "isWithinBudget"> | null {
    const allProviders = aiGateway.getAllProviders();

    for (const provider of allProviders) {
      if (providerHealthMonitor.isCircuitOpen(provider.name)) continue;

      for (const model of provider.models) {
        if (!model.capabilities.includes(taskType)) continue;
        if (model.maxTokens < inputTokens + outputTokens) continue;

        const cost = this.estimateCost(provider.name, model.name, inputTokens, outputTokens);

        return {
          provider: provider.name,
          model: model.name,
          estimatedInputTokens: inputTokens,
          maxOutputTokens: outputTokens,
          estimatedCost: cost,
        };
      }
    }

    for (const provider of allProviders) {
      for (const model of provider.models) {
        const cost = this.estimateCost(provider.name, model.name, inputTokens, outputTokens);
        return {
          provider: provider.name,
          model: model.name,
          estimatedInputTokens: inputTokens,
          maxOutputTokens: outputTokens,
          estimatedCost: cost,
        };
      }
    }

    return null;
  }

  async checkDailyBudget(userId: string): Promise<{
    withinBudget: boolean;
    currentUsage: DailyUsage | null;
    remaining: { tokens: number; cost: number };
  }> {
    const today = new Date().toISOString().split("T")[0];

    const cached = this.dailyUsageCache.get(`${userId}:${today}`);
    if (cached) {
      return {
        withinBudget:
          cached.totalTokens < this.budget.dailyTokenBudget &&
          cached.totalCost < this.budget.dailyCostBudget,
        currentUsage: cached,
        remaining: {
          tokens: this.budget.dailyTokenBudget - cached.totalTokens,
          cost: this.budget.dailyCostBudget - cached.totalCost,
        },
      };
    }

    const usage = await this.getDailyUsage(userId, today);

    return {
      withinBudget:
        usage.totalTokens < this.budget.dailyTokenBudget &&
        usage.totalCost < this.budget.dailyCostBudget,
      currentUsage: usage,
      remaining: {
        tokens: this.budget.dailyTokenBudget - usage.totalTokens,
        cost: this.budget.dailyCostBudget - usage.totalCost,
      },
    };
  }

  async getDailyUsage(userId: string, date?: string): Promise<DailyUsage> {
    const targetDate = date || new Date().toISOString().split("T")[0];

    const cacheKey = `${userId}:${targetDate}`;
    const cached = this.dailyUsageCache.get(cacheKey);
    if (cached) return cached;

    try {
      const startOfDay = new Date(targetDate + "T00:00:00.000Z");
      const endOfDay = new Date(targetDate + "T23:59:59.999Z");

      const requests = await prisma.aIRequest.findMany({
        where: {
          userId,
          createdAt: { gte: startOfDay, lte: endOfDay },
          status: "success",
        },
        select: {
          provider: true,
          inputTokens: true,
          outputTokens: true,
          cost: true,
        },
      });

      let totalTokens = 0;
      let totalCost = 0;
      const providerBreakdown: Record<string, TokenUsage> = {};

      for (const req of requests) {
        const tokens = req.inputTokens + req.outputTokens;
        totalTokens += tokens;
        totalCost += req.cost;

        if (!providerBreakdown[req.provider]) {
          providerBreakdown[req.provider] = {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
            cost: 0,
          };
        }

        providerBreakdown[req.provider].promptTokens += req.inputTokens;
        providerBreakdown[req.provider].completionTokens += req.outputTokens;
        providerBreakdown[req.provider].totalTokens += tokens;
        providerBreakdown[req.provider].cost += req.cost;
      }

      const usage: DailyUsage = {
        date: targetDate,
        totalTokens,
        totalCost: Math.round(totalCost * 10000) / 10000,
        requestCount: requests.length,
        providerBreakdown,
      };

      this.dailyUsageCache.set(cacheKey, usage);
      return usage;
    } catch {
      const empty: DailyUsage = {
        date: targetDate,
        totalTokens: 0,
        totalCost: 0,
        requestCount: 0,
        providerBreakdown: {},
      };
      return empty;
    }
  }

  async recordUsage(
    userId: string,
    result: ProviderCallResult
  ): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    const cacheKey = `${userId}:${today}`;
    this.dailyUsageCache.delete(cacheKey);
  }

  getProviderPricing(): { provider: string; models: { name: string; costPer1K: number; maxTokens: number }[] }[] {
    return aiGateway.getAllProviders().map((provider) => ({
      provider: provider.name,
      models: provider.models.map((m) => ({
        name: m.name,
        costPer1K: m.costPer1K,
        maxTokens: m.maxTokens,
      })),
    }));
  }

  compareCosts(
    inputTokens: number,
    outputTokens: number,
    taskType: string
  ): { provider: string; model: string; cost: number; isActive: boolean }[] {
    const results: { provider: string; model: string; cost: number; isActive: boolean }[] = [];

    for (const provider of aiGateway.getAllProviders()) {
      const isActive = !providerHealthMonitor.isCircuitOpen(provider.name);
      for (const model of provider.models) {
        if (!model.capabilities.includes(taskType)) continue;
        const cost = this.estimateCost(provider.name, model.name, inputTokens, outputTokens);
        results.push({
          provider: provider.name,
          model: model.name,
          cost: Math.round(cost * 100000) / 100000,
          isActive,
        });
      }
    }

    results.sort((a, b) => a.cost - b.cost);
    return results;
  }

  getSmartAllocation(
    taskType: string,
    complexity: "low" | "medium" | "high",
    inputText: string,
    dailyBudgetRemaining: { tokens: number; cost: number }
  ): TokenAllocation | null {
    const defaultAllocation = this.selectModel(taskType, complexity, inputText);

    if (!defaultAllocation) return null;

    if (defaultAllocation.isWithinBudget) {
      const { inputTokens, outputTokens } = this.estimateTaskTokens(taskType, complexity, inputText);
      if (inputTokens + outputTokens <= dailyBudgetRemaining.tokens) {
        return defaultAllocation;
      }
    }

    const allCandidates = this.getAllCandidatesForTask(taskType, inputText);

    for (const candidate of allCandidates) {
      if (candidate.estimatedInputTokens + candidate.maxOutputTokens <= dailyBudgetRemaining.tokens) {
        return candidate;
      }
    }

    if (allCandidates.length > 0) {
      const cheapest = allCandidates[0];
      if (cheapest.estimatedCost <= dailyBudgetRemaining.cost) {
        return cheapest;
      }
    }

    return null;
  }

  private getAllCandidatesForTask(
    taskType: string,
    inputText: string
  ): TokenAllocation[] {
    const candidates: TokenAllocation[] = [];

    for (const complexity of ["low", "medium", "high"] as const) {
      const { inputTokens, outputTokens } = this.estimateTaskTokens(taskType, complexity, inputText);

      for (const provider of aiGateway.getActiveProviders()) {
        for (const model of provider.models) {
          if (!model.capabilities.includes(taskType)) continue;
          if (model.maxTokens < inputTokens + outputTokens) continue;

          const cost = this.estimateCost(provider.name, model.name, inputTokens, outputTokens);

          candidates.push({
            provider: provider.name,
            model: model.name,
            estimatedInputTokens: inputTokens,
            maxOutputTokens: outputTokens,
            estimatedCost: cost,
            isWithinBudget: cost <= this.budget.maxCostPerRequest,
          });
        }
      }
    }

    candidates.sort((a, b) => a.estimatedCost - b.estimatedCost);
    return candidates;
  }

  async executeWithTokenBudget(
    messages: { role: string; content: string }[],
    taskType: string,
    complexity: "low" | "medium" | "high",
    userId: string,
    options?: {
      preferredProvider?: string;
      preferredModel?: string;
      temperature?: number;
      organizationId?: string;
      requestId?: string;
      sessionId?: string;
      agent?: string;
      mode?: string;
    }
  ): Promise<ProviderCallResult> {
    const userMessage = messages.find((m) => m.role === "user")?.content || "";
    const allText = messages.map((m) => m.content).join("\n");

    const { withinBudget, remaining } = await this.checkDailyBudget(userId);

    if (!withinBudget && remaining.tokens <= 0) {
      throw new Error(
        `Daily token budget of ${this.budget.dailyTokenBudget.toLocaleString()} tokens exhausted. Try again tomorrow.`
      );
    }

    const primaryAllocation = this.getSmartAllocation(taskType, complexity, allText, remaining);

    if (!primaryAllocation) {
      throw new Error(
        `No model available within budget. Remaining: ${remaining.tokens.toLocaleString()} tokens, $${remaining.cost.toFixed(4)} cost.`
      );
    }

    const allCandidates = this.getAllCandidatesForTask(taskType, allText);
    const candidateAllocations: TokenAllocation[] = [primaryAllocation];
    for (const cand of allCandidates) {
      if (!candidateAllocations.some((c) => c.provider === cand.provider && c.model === cand.model)) {
        if (
          cand.estimatedInputTokens + cand.maxOutputTokens <= remaining.tokens &&
          cand.estimatedCost <= remaining.cost
        ) {
          candidateAllocations.push(cand);
        }
      }
    }

    const requestId = options?.requestId || createAIRequestId();
    const startedAt = new Date();
    const attemptedProviders: string[] = [];
    const attemptedModels: string[] = [];
    let lastError: Error | null = null;

    for (const allocation of candidateAllocations) {
      try {
        attemptedProviders.push(allocation.provider);
        attemptedModels.push(allocation.model);

        const result = await aiGateway.callProvider(
          allocation.provider,
          allocation.model,
          messages,
          {
            maxTokens: allocation.maxOutputTokens,
            temperature: options?.temperature,
            userId,
            organizationId: options?.organizationId,
            requestId,
            sessionId: options?.sessionId,
            agent: options?.agent,
            mode: options?.mode,
          }
        );
        const completedAt = new Date();
        const fallbackUsed = attemptedProviders.length > 1;
        const finalProvider = result.provider || allocation.provider;

        await persistAIRequest({
          requestId,
          userId,
          organizationId: options?.organizationId,
          sessionId: options?.sessionId,
          provider: result.provider,
          model: result.model,
          agent: options?.agent,
          mode: options?.mode || taskType,
          startedAt,
          completedAt,
          latency: result.latency,
          status: "success",
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          estimatedCost: result.cost,
          fallbackUsed,
          attemptedProviders: [...attemptedProviders],
          attemptedModels: [...attemptedModels],
          finalProvider,
        });
        await this.recordUsage(userId, {
          ...result,
          fallbackUsed,
          attemptedProviders: [...attemptedProviders],
          attemptedModels: [...attemptedModels],
          finalProvider,
        });

        return {
          ...result,
          fallbackUsed,
          attemptedProviders: [...attemptedProviders],
          attemptedModels: [...attemptedModels],
          finalProvider,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
      }
    }

    const completedAt = new Date();
    await persistAIRequest({
      requestId,
      userId,
      organizationId: options?.organizationId,
      sessionId: options?.sessionId,
      provider: attemptedProviders.at(-1) || primaryAllocation.provider,
      model: attemptedModels.at(-1) || primaryAllocation.model,
      agent: options?.agent,
      mode: options?.mode || taskType,
      startedAt,
      completedAt,
      latency: completedAt.getTime() - startedAt.getTime(),
      status: "failed",
      error: lastError?.message || "Token budget execution failed",
      fallbackUsed: attemptedProviders.length > 1,
      attemptedProviders: [...attemptedProviders],
      attemptedModels: [...attemptedModels],
      finalProvider: null,
    });
    throw lastError || new Error("Token budget execution failed");
  }
}

export const tokenRouter = new TokenRouter();