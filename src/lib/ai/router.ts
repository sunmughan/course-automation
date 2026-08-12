import { prisma } from "@/lib/db";
import { aiGateway, type AIProviderConfig, type AIModelInfo, type ProviderCallResult, type GatewayCallOptions } from "./gateway";
import { getCapabilityProfile, getBestModelForTask, getModelsForTask } from "./capability-matrix";
import type { TaskCapability } from "./capability-matrix";
import { scoreProvider, scoreAllProviders, generateFallbackChain, createScoringConfig, isScoreAcceptable } from "./scoring";
import type { ProviderScore } from "./scoring";
import { providerHealthMonitor } from "./health-monitor";

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
  scoredCandidates: Array<{ provider: string; model: string; score: number }>;
  reasoning: string;
}

export interface TaskClassification {
  taskType: TaskType;
  capability: TaskCapability;
  confidence: number;
  complexity: "low" | "medium" | "high";
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

const TASK_TO_CAPABILITY_MAP: Record<TaskType, TaskCapability> = {
  explain: "explain",
  code_generation: "code_generation",
  debugging: "debugging",
  architecture: "architecture",
  visualization: "visualization",
  simple_qa: "simple_qa",
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
    const capability = TASK_TO_CAPABILITY_MAP[bestType];

    return { taskType: bestType, capability, confidence, complexity };
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

  scoreProviderV2(
    providerName: string,
    task: TaskCapability,
    complexity: "low" | "medium" | "high",
    estimatedTokens: number
  ): ProviderScore | null {
    const provider = aiGateway.getProvider(providerName);
    if (!provider) return null;

    const health = providerHealthMonitor.getHealthSummary(providerName);
    if (!health.isHealthy) return null;

    const config = createScoringConfig(task, complexity, estimatedTokens);

    const bestModel = getBestModelForTask(task, complexity, "quality");
    if (!bestModel) return null;

    const healthStatus = {
      isHealthy: health.isHealthy,
      successRate: health.successRate,
      avgLatency: health.avgLatency,
      errorRate: 100 - health.successRate,
      lastChecked: new Date(health.lastChecked),
    };

    return scoreProvider(providerName, bestModel.modelName, task, healthStatus, config);
  }

  selectProvider(
    taskType: TaskType,
    complexity: "low" | "medium" | "high",
    estimatedTokens?: number
  ): RouterDecision | null {
    const capability = TASK_TO_CAPABILITY_MAP[taskType];
    const tokens = estimatedTokens || 4096;
    const config = createScoringConfig(capability, complexity, tokens);

    const providers = aiGateway.getActiveProviders().map((p) => p.name);
    const models = providers.flatMap((name) =>
      aiGateway.getProviderModels(name).map((m) => ({ provider: name, model: m.name }))
    );

    const healthMap = new Map(
      providers.map((name) => {
        const summary = providerHealthMonitor.getHealthSummary(name);
        return [
          name,
          {
            isHealthy: summary.isHealthy,
            successRate: summary.successRate,
            avgLatency: summary.avgLatency,
            errorRate: 100 - summary.successRate,
            lastChecked: new Date(summary.lastChecked),
          },
        ];
      })
    );

    const allScores = scoreAllProviders(
      providers.map((name) => ({
        name,
        models: aiGateway.getProviderModels(name).map((m) => m.name),
      })),
      capability,
      healthMap,
      config
    );

    if (allScores.length === 0) return null;

    const fallbackChain = generateFallbackChain(allScores);
    const primary = fallbackChain[0];

    return {
      provider: primary.provider,
      model: primary.model,
      score: primary.totalScore,
      fallbackChain: fallbackChain.slice(1).map((s) => s.provider),
      scoredCandidates: allScores.slice(0, 5).map((s) => ({
        provider: s.provider,
        model: s.model,
        score: s.totalScore,
      })),
      reasoning: this.generateReasoning(primary, allScores, capability, complexity),
    };
  }

  private generateReasoning(
    primary: ProviderScore,
    allScores: ProviderScore[],
    task: TaskCapability,
    complexity: string
  ): string {
    const parts: string[] = [];
    parts.push(`Selected ${primary.provider}/${primary.model} for ${task} task (${complexity} complexity)`);
    parts.push(`Quality: ${(primary.breakdown.quality * 100).toFixed(0)}%`);
    parts.push(`Estimated cost: $${primary.meta.estimatedCost.toFixed(4)}`);
    parts.push(`Context utilization: ${primary.meta.contextUtilization}%`);

    if (allScores.length > 1) {
      const second = allScores[1];
      parts.push(
        `Alternative: ${second.provider}/${second.model} (score: ${(second.totalScore * 100).toFixed(0)}%)`
      );
    }

    return parts.join(" | ");
  }

  async route(
    message: string,
    options?: {
      preferredProvider?: string;
      preferredModel?: string;
      complexity?: "low" | "medium" | "high";
      estimatedTokens?: number;
    }
  ): Promise<{ decision: RouterDecision; classification: TaskClassification }> {
    const classification = this.classifyTask(message);
    const complexity = options?.complexity || classification.complexity;
    const estimatedTokens = options?.estimatedTokens || aiGateway.estimateTokens(message);

    let decision = this.selectProvider(classification.taskType, complexity, estimatedTokens);

    if (options?.preferredProvider && options?.preferredModel) {
      const preferredProvider = aiGateway.getProvider(options.preferredProvider);
      if (preferredProvider && providerHealthMonitor.isProviderAvailable(options.preferredProvider)) {
        const prefScore = this.scoreProviderV2(
          options.preferredProvider,
          classification.capability,
          complexity,
          estimatedTokens
        );
        decision = {
          provider: options.preferredProvider,
          model: options.preferredModel,
          score: prefScore?.totalScore || 1.0,
          fallbackChain: decision?.fallbackChain || [],
          scoredCandidates: decision?.scoredCandidates || [],
          reasoning: `Using preferred provider: ${options.preferredProvider}/${options.preferredModel}`,
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
      userId?: string;
      traceId?: string;
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
        if (!providerHealthMonitor.isProviderAvailable(providerName)) continue;

        const model = providerName === decision.provider
          ? decision.model
          : getBestModelForTask(
              classification.capability,
              classification.complexity,
              "quality"
            )?.modelName || "";

        if (!model) continue;

        const result = await aiGateway.callProvider(providerName, model, messages, {
          maxTokens: options?.maxTokens,
          temperature: options?.temperature,
          userId: options?.userId,
          traceId: options?.traceId,
          task: classification.capability,
          complexity: classification.complexity,
        });

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }

    throw lastError || new Error("All AI providers failed");
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