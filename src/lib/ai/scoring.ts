import type { TaskCapability, ModelCapabilityProfile } from "./capability-matrix";
import { getCapabilityProfile, getCapabilityScore, checkContextWindow } from "./capability-matrix";
import type { ProviderHealthStatus } from "./gateway";

export interface ScoringWeights {
  quality: number;
  latency: number;
  cost: number;
  reliability: number;
  contextFit: number;
}

export interface ProviderScore {
  provider: string;
  model: string;
  totalScore: number;
  breakdown: {
    quality: number;
    latency: number;
    cost: number;
    reliability: number;
    contextFit: number;
  };
  normalized: {
    quality: number;
    latency: number;
    cost: number;
    reliability: number;
    contextFit: number;
  };
  meta: {
    estimatedCost: number;
    estimatedLatency: number;
    maxContextTokens: number;
    contextUtilization: number;
  };
}

export interface ScoringConfig {
  weights: ScoringWeights;
  task: TaskCapability;
  complexity: "low" | "medium" | "high";
  estimatedTokens: number;
  budgetConstraint?: number;
  latencyConstraint?: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  quality: 0.4,
  latency: 0.15,
  cost: 0.15,
  reliability: 0.2,
  contextFit: 0.1,
};

const COMPLEXITY_WEIGHT_MODIFIERS: Record<string, Partial<ScoringWeights>> = {
  low: { quality: 0.3, latency: 0.25, cost: 0.25, reliability: 0.1, contextFit: 0.1 },
  medium: { quality: 0.4, latency: 0.15, cost: 0.15, reliability: 0.2, contextFit: 0.1 },
  high: { quality: 0.5, latency: 0.1, cost: 0.05, reliability: 0.25, contextFit: 0.1 },
};

export function getComplexityWeights(
  complexity: "low" | "medium" | "high"
): ScoringWeights {
  return { ...DEFAULT_WEIGHTS, ...COMPLEXITY_WEIGHT_MODIFIERS[complexity] };
}

export function scoreProvider(
  providerName: string,
  modelName: string,
  task: TaskCapability,
  health: ProviderHealthStatus | null,
  config: ScoringConfig
): ProviderScore | null {
  const profile = getCapabilityProfile(providerName, modelName);
  if (!profile) return null;

  const capScore = getCapabilityScore(providerName, modelName, task);

  const contextOk = checkContextWindow(providerName, modelName, config.estimatedTokens);
  const contextUtilization = config.estimatedTokens / profile.maxContextTokens;
  const contextFit = contextOk ? 1 - contextUtilization * 0.5 : 0;

  const reliability = health
    ? (health.successRate / 100) * (1 - health.errorRate / 100)
    : capScore.reliability;

  const quality = capScore.quality;
  const latency = capScore.latency;
  const cost = capScore.cost;

  if (config.budgetConstraint !== undefined) {
    const estimatedCost = (config.estimatedTokens / 1000) * profile.costPer1KInput;
    if (estimatedCost > config.budgetConstraint) {
      return null;
    }
  }

  const weights = config.weights || getComplexityWeights(config.complexity);

  const totalScore =
    quality * weights.quality +
    latency * weights.latency +
    cost * weights.cost +
    reliability * weights.reliability +
    contextFit * weights.contextFit;

  return {
    provider: providerName,
    model: modelName,
    totalScore,
    breakdown: {
      quality,
      latency,
      cost,
      reliability,
      contextFit,
    },
    normalized: {
      quality: quality * weights.quality,
      latency: latency * weights.latency,
      cost: cost * weights.cost,
      reliability: reliability * weights.reliability,
      contextFit: contextFit * weights.contextFit,
    },
    meta: {
      estimatedCost: (config.estimatedTokens / 1000) * profile.costPer1KInput,
      estimatedLatency: (1 - latency) * 5000 + 500,
      maxContextTokens: profile.maxContextTokens,
      contextUtilization: Math.round(contextUtilization * 100),
    },
  };
}

export function scoreAllProviders(
  providers: Array<{ name: string; models: string[] }>,
  task: TaskCapability,
  healthMap: Map<string, ProviderHealthStatus>,
  config: ScoringConfig
): ProviderScore[] {
  const scores: ProviderScore[] = [];

  for (const { name: providerName, models } of providers) {
    const health = healthMap.get(providerName) || null;
    if (health && !health.isHealthy) continue;

    for (const modelName of models) {
      const score = scoreProvider(providerName, modelName, task, health, config);
      if (score) {
        scores.push(score);
      }
    }
  }

  scores.sort((a, b) => b.totalScore - a.totalScore);
  return scores;
}

export function generateFallbackChain(
  scores: ProviderScore[],
  minDiversity = 0.1
): ProviderScore[] {
  if (scores.length <= 1) return scores;

  const chain: ProviderScore[] = [scores[0]];
  const usedProviders = new Set([scores[0].provider]);

  for (let i = 1; i < scores.length; i++) {
    const candidate = scores[i];
    if (!usedProviders.has(candidate.provider)) {
      chain.push(candidate);
      usedProviders.add(candidate.provider);
    } else if (candidate.totalScore > chain[0].totalScore * (1 - minDiversity)) {
      chain.push(candidate);
    }
  }

  return chain;
}

export function isScoreAcceptable(
  score: ProviderScore,
  threshold: number = 0.5
): boolean {
  return score.totalScore >= threshold;
}

export function explainScore(score: ProviderScore): string {
  const parts: string[] = [];
  if (score.breakdown.quality < 0.6) parts.push("lower quality for this task");
  if (score.breakdown.latency < 0.5) parts.push("higher latency expected");
  if (score.breakdown.cost < 0.3) parts.push("higher cost");
  if (score.breakdown.reliability < 0.7) parts.push("lower reliability");
  if (score.breakdown.contextFit < 0.5) parts.push("context window may be tight");
  return parts.length > 0 ? parts.join(", ") : "good fit for this task";
}

export function compareScores(
  a: ProviderScore,
  b: ProviderScore
): {
  winner: "a" | "b";
  advantages: string[];
  tradeoffs: string[];
} {
  const advantages: string[] = [];
  const tradeoffs: string[] = [];

  const fields: Array<keyof ProviderScore["breakdown"]> = [
    "quality",
    "latency",
    "cost",
    "reliability",
    "contextFit",
  ];

  let aWins = 0;
  let bWins = 0;

  for (const field of fields) {
    if (a.breakdown[field] > b.breakdown[field] + 0.05) {
      aWins++;
      advantages.push(`${field}: ${a.provider}/${a.model} (+${(a.breakdown[field] - b.breakdown[field]).toFixed(2)})`);
    } else if (b.breakdown[field] > a.breakdown[field] + 0.05) {
      bWins++;
      tradeoffs.push(`${field}: ${b.provider}/${b.model} (+${(b.breakdown[field] - a.breakdown[field]).toFixed(2)})`);
    }
  }

  return {
    winner: aWins >= bWins ? "a" : "b",
    advantages,
    tradeoffs,
  };
}

export function createScoringConfig(
  task: TaskCapability,
  complexity: "low" | "medium" | "high",
  estimatedTokens: number,
  overrides?: Partial<{
    qualityWeight: number;
    costWeight: number;
    latencyWeight: number;
    budgetConstraint: number;
    latencyConstraint: number;
  }>
): ScoringConfig {
  const baseWeights = getComplexityWeights(complexity);

  return {
    weights: {
      ...baseWeights,
      ...(overrides?.qualityWeight !== undefined && { quality: overrides.qualityWeight }),
      ...(overrides?.costWeight !== undefined && { cost: overrides.costWeight }),
      ...(overrides?.latencyWeight !== undefined && { latency: overrides.latencyWeight }),
    },
    task,
    complexity,
    estimatedTokens,
    budgetConstraint: overrides?.budgetConstraint,
    latencyConstraint: overrides?.latencyConstraint,
  };
}