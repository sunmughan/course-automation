import { prisma } from "@/lib/db";
import { aiGateway, type AIProviderConfig, type AIModelInfo, type ProviderCallResult } from "./gateway";

export type TaskType =
  | "explain"
  | "code_generation"
  | "debugging"
  | "architecture"
  | "visualization"
  | "simple_qa";

export interface RouterDecision {
  provider: string;
  model: string;
  score: number;
  fallbackChain: string[];
}

export interface TaskClassification {
  taskType: TaskType;
  confidence: number;
  complexity: "low" | "medium" | "high";
}

interface ProviderScore {
  provider: string;
  model: string;
  score: number;
  reliability: number;
  latency: number;
  cost: number;
  taskCompatibility: number;
}

const TASK_CLASSIFICATION_PATTERNS: Record<TaskType, RegExp[]> = {
  explain: [
    /explain|what is|how does|describe|tell me about|understand|what does.*mean/i,
    /break.?down|walk.?through|elaborate/i,
  ],
  code_generation: [
    /write|create|generate|build|implement|make.*code|code.*for|function.*that/i,
    /component.*for|page.*that|api.*that|endpoint.*for/i,
  ],
  debugging: [
    /debug|fix|error|bug|not working|issue|problem|wrong|failing|crash/i,
    /why.*error|why.*not|what.*wrong|help.*fix/i,
  ],
  architecture: [
    /architect|design|pattern|structure|system.*design|scal(e|able)|best.?practice/i,
    /how.*structure|how.*organize|refactor|improve.*design/i,
  ],
  visualization: [
    /visualize|diagram|chart|graph|draw|illustrate|show.*flow|flowchart/i,
    /visual.*explanation|map.*out|mind.?map/i,
  ],
  simple_qa: [
    /what|when|where|who|which|yes|no|can you|do you|is it|are there/i,
    /how (many|much|long|often|far)/i,
  ],
};

const TASK_COMPLEXITY_INDICATORS = {
  high: [
    /complex|advanced|deep.?dive|comprehensive|in.?depth|thorough/i,
    /architecture|system.?design|refactor|optimize|performance/i,
  ],
  low: [
    /simple|basic|quick|brief|short|what is|definition/i,
  ],
};

const COMPLEXITY_MODEL_MAP: Record<string, Record<string, string[]>> = {
  low: {
    nvidia: ["meta/llama-3.3-70b-instruct"],
    gemini: ["gemini-2.5-flash"],
  },
  medium: {
    nvidia: ["meta/llama-3.3-70b-instruct", "qwen/qwen3-235b-a22b"],
    gemini: ["gemini-2.5-flash", "gemini-2.5-pro"],
  },
  high: {
    nvidia: ["deepseek-ai/deepseek-r1", "meta/llama-3.3-70b-instruct"],
    gemini: ["gemini-2.5-pro"],
  },
};

const TASK_COMPATIBILITY_WEIGHTS: Record<TaskType, Record<string, number>> = {
  explain: { nvidia: 0.85, gemini: 0.9 },
  code_generation: { nvidia: 0.9, gemini: 0.85 },
  debugging: { nvidia: 0.8, gemini: 0.85 },
  architecture: { nvidia: 0.85, gemini: 0.9 },
  visualization: { nvidia: 0.75, gemini: 0.85 },
  simple_qa: { nvidia: 0.8, gemini: 0.9 },
};

const LATENCY_WEIGHTS: Record<string, number> = {
  nvidia: 0.7,
  gemini: 0.85,
};

const COST_WEIGHTS: Record<string, number> = {
  nvidia: 0.9,
  gemini: 0.8,
};

const SCORE_WEIGHTS = {
  reliability: 0.35,
  latency: 0.2,
  cost: 0.15,
  taskCompatibility: 0.3,
};

export class AIRouter {
  classifyTask(message: string): TaskClassification {
    const scores: Record<TaskType, number> = {
      explain: 0,
      code_generation: 0,
      debugging: 0,
      architecture: 0,
      visualization: 0,
      simple_qa: 0,
    };

    for (const [taskType, patterns] of Object.entries(TASK_CLASSIFICATION_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(message)) {
          scores[taskType as TaskType] += 1;
        }
      }
    }

    let bestType: TaskType = "simple_qa";
    let bestScore = 0;

    for (const [taskType, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestType = taskType as TaskType;
      }
    }

    const totalMatches = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = totalMatches > 0 ? bestScore / totalMatches : 0.5;

    const complexity = this.classifyComplexity(message);

    return { taskType: bestType, confidence, complexity };
  }

  private classifyComplexity(message: string): "low" | "medium" | "high" {
    const lowerMessage = message.toLowerCase();

    if (TASK_COMPLEXITY_INDICATORS.high.some((p) => p.test(lowerMessage))) {
      return "high";
    }
    if (TASK_COMPLEXITY_INDICATORS.low.some((p) => p.test(lowerMessage))) {
      return "low";
    }
    return "medium";
  }

  scoreProvider(
    providerName: string,
    taskType: TaskType,
    complexity: "low" | "medium" | "high"
  ): ProviderScore | null {
    const provider = aiGateway.getProvider(providerName);
    if (!provider) return null;

    const status = aiGateway.getProviderStatus(providerName);
    if (status.circuitOpen) return null;

    const eligibleModels = this.getEligibleModels(provider, taskType, complexity);
    if (eligibleModels.length === 0) return null;

    const bestModel = eligibleModels[0];

    const reliability = status.health
      ? (status.health.successRate / 100) * (1 - status.health.errorRate / 100)
      : 0.8;

    const latency = LATENCY_WEIGHTS[providerName] || 0.7;
    const cost = COST_WEIGHTS[providerName] || 0.8;
    const taskCompatibility = TASK_COMPATIBILITY_WEIGHTS[taskType]?.[providerName] || 0.5;

    const score =
      reliability * SCORE_WEIGHTS.reliability +
      latency * SCORE_WEIGHTS.latency +
      cost * SCORE_WEIGHTS.cost +
      taskCompatibility * SCORE_WEIGHTS.taskCompatibility;

    return {
      provider: providerName,
      model: bestModel.name,
      score,
      reliability,
      latency,
      cost,
      taskCompatibility,
    };
  }

  private getEligibleModels(
    provider: AIProviderConfig,
    taskType: TaskType,
    complexity: "low" | "medium" | "high"
  ): AIModelInfo[] {
    const complexityModels = COMPLEXITY_MODEL_MAP[complexity]?.[provider.name] || [];
    return provider.models
      .filter((m) => m.capabilities.includes(taskType))
      .sort((a, b) => {
        const aIdx = complexityModels.indexOf(a.name);
        const bIdx = complexityModels.indexOf(b.name);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return b.maxTokens - a.maxTokens;
      });
  }

  selectProvider(
    taskType: TaskType,
    complexity: "low" | "medium" | "high"
  ): RouterDecision | null {
    const scores: ProviderScore[] = [];

    for (const providerName of aiGateway.getAllProviders().map((p) => p.name)) {
      const score = this.scoreProvider(providerName, taskType, complexity);
      if (score) {
        scores.push(score);
      }
    }

    if (scores.length === 0) return null;

    scores.sort((a, b) => b.score - a.score);

    const primary = scores[0];
    const fallbackChain = scores.slice(1).map((s) => s.provider);

    return {
      provider: primary.provider,
      model: primary.model,
      score: primary.score,
      fallbackChain,
    };
  }

  async route(
    message: string,
    options?: {
      preferredProvider?: string;
      preferredModel?: string;
      complexity?: "low" | "medium" | "high";
    }
  ): Promise<{ decision: RouterDecision; classification: TaskClassification }> {
    const classification = this.classifyTask(message);
    const complexity = options?.complexity || classification.complexity;

    let decision = this.selectProvider(classification.taskType, complexity);

    if (options?.preferredProvider && options?.preferredModel) {
      const preferredProvider = aiGateway.getProvider(options.preferredProvider);
      if (preferredProvider && !aiGateway.isCircuitOpen(options.preferredProvider)) {
        decision = {
          provider: options.preferredProvider,
          model: options.preferredModel,
          score: 1.0,
          fallbackChain: decision?.fallbackChain || [],
        };
      }
    }

    if (!decision) {
      throw new Error("No AI providers available. Please check API keys and provider health.");
    }

    await this.saveRoutingDecision(decision, classification);

    return { decision, classification };
  }

  async executeWithFallback(
    messages: { role: string; content: string }[],
    options?: {
      preferredProvider?: string;
      preferredModel?: string;
      maxTokens?: number;
      temperature?: number;
      complexity?: "low" | "medium" | "high";
    }
  ): Promise<ProviderCallResult> {
    const userMessage = messages.find((m) => m.role === "user")?.content || "";
    const { decision, classification } = await this.route(userMessage, {
      preferredProvider: options?.preferredProvider,
      preferredModel: options?.preferredModel,
      complexity: options?.complexity,
    });

    const providersToTry = [decision.provider, ...decision.fallbackChain];
    let lastError: Error | null = null;

    for (const providerName of providersToTry) {
      try {
        const provider = aiGateway.getProvider(providerName);
        if (!provider) continue;
        if (aiGateway.isCircuitOpen(providerName)) continue;

        const model = providerName === decision.provider
          ? decision.model
          : this.getFallbackModel(providerName, classification.taskType, classification.complexity);

        const result = await aiGateway.callProvider(providerName, model, messages, {
          maxTokens: options?.maxTokens,
          temperature: options?.temperature,
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        aiGateway.recordFailure(providerName);
        continue;
      }
    }

    throw lastError || new Error("All AI providers failed");
  }

  private getFallbackModel(
    providerName: string,
    taskType: TaskType,
    complexity: "low" | "medium" | "high"
  ): string {
    const provider = aiGateway.getProvider(providerName);
    if (!provider) return "";

    const complexityModels = COMPLEXITY_MODEL_MAP[complexity]?.[providerName] || [];
    const eligible = provider.models.filter((m) => m.capabilities.includes(taskType));

    for (const modelName of complexityModels) {
      if (eligible.some((m) => m.name === modelName)) return modelName;
    }

    return eligible[0]?.name || "";
  }

  private async saveRoutingDecision(
    decision: RouterDecision,
    classification: TaskClassification
  ): Promise<void> {
    try {
      await prisma.routingRule.upsert({
        where: { id: `auto_${classification.taskType}` },
        update: {
          preferredProvider: decision.provider,
          preferredModel: decision.model,
          priority: Math.round(decision.score * 100),
        },
        create: {
          id: `auto_${classification.taskType}`,
          taskType: classification.taskType,
          preferredProvider: decision.provider,
          preferredModel: decision.model,
          priority: Math.round(decision.score * 100),
        },
      });
    } catch {
      // Non-critical
    }
  }
}

export const aiRouter = new AIRouter();