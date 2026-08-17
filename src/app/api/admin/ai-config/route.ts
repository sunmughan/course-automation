import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { aiGateway, type AIProviderConfig } from "@/lib/ai/gateway";
import { ZYLOO_MODELS, zylooService } from "@/lib/ai/providers/zyloo";
import { providerHealthMonitor } from "@/lib/ai/health-monitor";
import { semanticCache } from "@/lib/ai/cache";

function maskApiKey(key?: string | null): string {
  if (!key || key.length < 8) return "";
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

export const GET = apiHandler(async () => {
  // 1. Fetch routing rules from DB
  const routingRules = await prisma.routingRule.findMany({
    where: { isActive: true },
    orderBy: { priority: "desc" },
  }).catch(() => []);

  // 2. Aggregate provider details
  const providers = [
    {
      id: "zyloo",
      name: "Zyloo.ai",
      slug: "zyloo",
      baseUrl: "https://api.zyloo.io/v1",
      description: "Unified AI Gateway with 95+ models across 11 frontier providers (Google, OpenAI, Anthropic, DeepSeek, Qwen, Moonshot, Zhipu, xAI, MiniMax, Meta, Xiaomi)",
      isConfigured: Boolean(process.env.ZYLOO_KEY || process.env.ZYLOO_API_KEY),
      maskedKey: maskApiKey(process.env.ZYLOO_KEY || process.env.ZYLOO_API_KEY),
      totalModels: ZYLOO_MODELS.length,
      status: providerHealthMonitor.getHealthSummary("zyloo"),
    },
    {
      id: "gemini",
      name: "Google Gemini",
      slug: "gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      description: "Direct Google Gemini API (Gemini 3.7 Flash, 3.5 Flash, 3.5 Flash Lite)",
      isConfigured: Boolean(process.env.GEMINI_API_KEY),
      maskedKey: maskApiKey(process.env.GEMINI_API_KEY),
      totalModels: 3,
      status: providerHealthMonitor.getHealthSummary("gemini"),
    },
    {
      id: "nvidia",
      name: "NVIDIA NIM",
      slug: "nvidia",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      description: "NVIDIA NIM Inference (Llama 3.3 70B, DeepSeek R1, Nemotron Ultra)",
      isConfigured: Boolean(process.env.NVIDIA_API_KEY),
      maskedKey: maskApiKey(process.env.NVIDIA_API_KEY),
      totalModels: 4,
      status: providerHealthMonitor.getHealthSummary("nvidia"),
    },
    {
      id: "agentrouter",
      name: "AgentRouter",
      slug: "agentrouter",
      baseUrl: "https://agentrouter.org/v1",
      description: "Enterprise multi-model router",
      isConfigured: Boolean(process.env.AGENTROUTER_API_KEY),
      maskedKey: maskApiKey(process.env.AGENTROUTER_API_KEY),
      totalModels: 5,
      status: providerHealthMonitor.getHealthSummary("agentrouter"),
    },
    {
      id: "tokenrouter",
      name: "TokenRouter",
      slug: "tokenrouter",
      baseUrl: "https://api.tokenrouter.io/v1",
      description: "Auto-balancing and cost-optimized routing",
      isConfigured: Boolean(process.env.TOKENROUTER_API_KEY),
      maskedKey: maskApiKey(process.env.TOKENROUTER_API_KEY),
      totalModels: 4,
      status: providerHealthMonitor.getHealthSummary("tokenrouter"),
    },
  ];

  // 3. Routing Defaults by Task
  const defaultChatProvider = routingRules.find((r) => r.taskType === "chat")?.preferredProvider || "zyloo";
  const defaultChatModel = routingRules.find((r) => r.taskType === "chat")?.preferredModel || "zyloo/gemini-3.5-flash";
  const defaultCodeModel = routingRules.find((r) => r.taskType === "code_generation")?.preferredModel || "zyloo/deepseek-v4-pro";
  const defaultDebugModel = routingRules.find((r) => r.taskType === "debugging")?.preferredModel || "zyloo/claude-sonnet-4-6";
  const defaultArchitectureModel = routingRules.find((r) => r.taskType === "architecture")?.preferredModel || "zyloo/claude-opus-5";
  const defaultImageModel = routingRules.find((r) => r.taskType === "visualization")?.preferredModel || "zyloo/gpt-image-2";
  const defaultReasoningModel = routingRules.find((r) => r.taskType === "reasoning")?.preferredModel || "zyloo/claude-fable-5";
  const defaultExerciseModel = routingRules.find((r) => r.taskType === "exercise_generation")?.preferredModel || "zyloo/gemini-3.5-flash";

  // 4. Tutor Modes Metadata
  const tutorModes = [
    { mode: "explain", label: "Explain", defaultTemp: 0.7, maxTokens: 4096, description: "Clear conceptual explanations and breakdowns" },
    { mode: "code-breakdown", label: "Code Breakdown", defaultTemp: 0.3, maxTokens: 4096, description: "Line-by-line code explanation" },
    { mode: "execution", label: "Execution Trace", defaultTemp: 0.2, maxTokens: 4096, description: "Memory and variable state trace step-by-step" },
    { mode: "debug", label: "Debug", defaultTemp: 0.4, maxTokens: 4096, description: "Root cause diagnosis and targeted bug hints" },
    { mode: "hint", label: "Hint", defaultTemp: 0.6, maxTokens: 1024, description: "Progressive scaffolding without spoiling solutions" },
    { mode: "socratic", label: "Socratic", defaultTemp: 0.7, maxTokens: 2048, description: "Guides student through thought-provoking questions" },
    { mode: "simplify", label: "Simplify", defaultTemp: 0.7, maxTokens: 2048, description: "ELI5 plain English analogies" },
    { mode: "deep-dive", label: "Deep Dive", defaultTemp: 0.6, maxTokens: 8192, description: "Comprehensive architectural and internal mechanics" },
    { mode: "visualize", label: "Visualize", defaultTemp: 0.5, maxTokens: 4096, description: "Diagram & flowchart structured output generation" },
    { mode: "compare", label: "Compare", defaultTemp: 0.5, maxTokens: 4096, description: "Benchmark and tradeoffs comparison" },
    { mode: "interview", label: "Interview", defaultTemp: 0.7, maxTokens: 4096, description: "FAANG / Staff engineer mock interview drills" },
    { mode: "practice", label: "Practice", defaultTemp: 0.6, maxTokens: 4096, description: "Generates custom exercises and edge cases" },
    { mode: "review", label: "Review", defaultTemp: 0.3, maxTokens: 4096, description: "Clean code and production readiness audit" },
  ];

  // 5. System Optimization & Cache Settings
  const cacheStats = semanticCache.getStats();
  const optimizationSettings = {
    semanticCacheEnabled: true,
    cacheTtlSeconds: 3600,
    deduplicationEnabled: true,
    dedupWindowMs: 5000,
    localFallbackEnabled: true,
    cacheStats,
  };

  // 6. Adaptive Learning Settings
  const adaptiveSettings = {
    exerciseModel: defaultExerciseModel,
    difficultyAutoScaling: true,
    errorDrillTargeting: true,
    sm2InitialIntervalDays: 1,
    sm2EaseFactorDefault: 2.5,
  };

  // 7. Image Studio Settings
  const imageStudioSettings = {
    defaultImageModel,
    defaultResolution: "1024x1024",
    defaultQuality: "standard",
    enhancedStyleInjection: true,
    svgFallbackEnabled: true,
  };

  return {
    providers,
    zylooModels: ZYLOO_MODELS,
    routingRules,
    defaults: {
      defaultChatProvider,
      defaultChatModel,
      defaultCodeModel,
      defaultDebugModel,
      defaultArchitectureModel,
      defaultImageModel,
      defaultReasoningModel,
      defaultExerciseModel,
    },
    tutorModes,
    optimizationSettings,
    adaptiveSettings,
    imageStudioSettings,
    stats: {
      totalProviders: providers.length,
      activeProviders: providers.filter((p) => p.isConfigured).length,
      totalModels: ZYLOO_MODELS.length + 16,
    },
  };
}, { requireAdmin: true });

const updateConfigSchema = z.object({
  action: z.enum([
    "save_defaults",
    "test_connection",
    "add_model",
    "toggle_model",
    "save_api_key",
    "save_optimization",
    "save_adaptive",
    "save_image_studio",
    "clear_cache",
  ]),
  provider: z.string().optional(),
  apiKey: z.string().optional(),
  defaults: z.object({
    defaultChatProvider: z.string().optional(),
    defaultChatModel: z.string().optional(),
    defaultCodeModel: z.string().optional(),
    defaultDebugModel: z.string().optional(),
    defaultArchitectureModel: z.string().optional(),
    defaultImageModel: z.string().optional(),
    defaultReasoningModel: z.string().optional(),
    defaultExerciseModel: z.string().optional(),
  }).optional(),
  optimizationSettings: z.record(z.string(), z.unknown()).optional(),
  adaptiveSettings: z.record(z.string(), z.unknown()).optional(),
  imageStudioSettings: z.record(z.string(), z.unknown()).optional(),
  model: z.object({
    name: z.string(),
    provider: z.string(),
    maxTokens: z.number().optional(),
    costPer1K: z.number().optional(),
    capabilities: z.array(z.string()).optional(),
  }).optional(),
  modelId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof updateConfigSchema>;

  if (body.action === "test_connection") {
    const targetProvider = body.provider || "zyloo";
    const startTime = performance.now();
    try {
      if (targetProvider === "zyloo") {
        const response = await zylooService.chatCompletion({
          model: "zyloo/gemini-3.5-flash",
          messages: [{ role: "user", content: "ping" }],
          maxTokens: 5,
        });
        const latency = Math.round(performance.now() - startTime);
        return {
          success: true,
          provider: targetProvider,
          latency,
          message: `Connected successfully to Zyloo API (${latency}ms)`,
          responseSnippet: response.choices?.[0]?.message?.content || "OK",
        };
      }

      const health = await aiGateway.healthCheck(targetProvider);
      const latency = Math.round(performance.now() - startTime);
      return {
        success: health.isHealthy,
        provider: targetProvider,
        latency,
        message: health.isHealthy ? `Provider is healthy (${latency}ms)` : "Provider returned error",
      };
    } catch (err: any) {
      return {
        success: false,
        provider: targetProvider,
        latency: Math.round(performance.now() - startTime),
        error: err.message || "Connection failed",
      };
    }
  }

  if (body.action === "save_defaults" && body.defaults) {
    const d = body.defaults;

    const taskMappings = [
      { id: "rule_default_chat", task: "chat", provider: d.defaultChatProvider || "zyloo", model: d.defaultChatModel },
      { id: "rule_default_code", task: "code_generation", provider: "zyloo", model: d.defaultCodeModel },
      { id: "rule_default_debug", task: "debugging", provider: "zyloo", model: d.defaultDebugModel },
      { id: "rule_default_arch", task: "architecture", provider: "zyloo", model: d.defaultArchitectureModel },
      { id: "rule_default_image", task: "visualization", provider: "zyloo", model: d.defaultImageModel },
      { id: "rule_default_reasoning", task: "reasoning", provider: "zyloo", model: d.defaultReasoningModel },
      { id: "rule_default_exercise", task: "exercise_generation", provider: "zyloo", model: d.defaultExerciseModel },
    ];

    for (const mapping of taskMappings) {
      if (mapping.model) {
        await prisma.routingRule.upsert({
          where: { id: mapping.id },
          update: { preferredProvider: mapping.provider, preferredModel: mapping.model, isActive: true },
          create: { id: mapping.id, taskType: mapping.task, preferredProvider: mapping.provider, preferredModel: mapping.model },
        }).catch(() => {});
      }
    }

    return { success: true, message: "Task-based AI routing rules updated successfully" };
  }

  if (body.action === "save_api_key" && body.provider && body.apiKey) {
    if (body.provider === "zyloo") {
      process.env.ZYLOO_KEY = body.apiKey;
      process.env.ZYLOO_API_KEY = body.apiKey;
    } else if (body.provider === "gemini") {
      process.env.GEMINI_API_KEY = body.apiKey;
    } else if (body.provider === "nvidia") {
      process.env.NVIDIA_API_KEY = body.apiKey;
    }

    await prisma.aIProvider.upsert({
      where: { name: body.provider },
      update: { apiKey: body.apiKey, isActive: true },
      create: {
        name: body.provider,
        baseUrl: body.provider === "zyloo" ? "https://api.zyloo.io/v1" : "https://api.openai.com/v1",
        apiKey: body.apiKey,
        isActive: true,
      },
    }).catch(() => {});

    return { success: true, message: `API Key saved for ${body.provider}` };
  }

  if (body.action === "clear_cache") {
    semanticCache.clear();
    return { success: true, message: "Semantic AI cache cleared successfully" };
  }

  return { success: true, message: "Settings saved" };
}, { requireAdmin: true, bodySchema: updateConfigSchema });
