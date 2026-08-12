import { prisma } from "@/lib/db";
import { aiGateway } from "@/lib/ai/gateway";
import { agentOrchestrator, type OrchestrationMode } from "@/lib/ai/orchestrator";
import { apiHandler } from "@/lib/api-handler";
import { aiSchemas, AppError } from "@/lib/errors";

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as {
    task: string;
    agents?: string[];
  };

  const { task, agents: agentIds } = body;

  const activeProviders = aiGateway.getActiveProviders();
  if (activeProviders.length === 0) {
    throw new AppError(
      "No AI providers are configured. Please set NVIDIA_API_KEY or GEMINI_API_KEY in your environment.",
      503,
      "SERVICE_UNAVAILABLE"
    );
  }

  const session = await prisma.aISession.create({
    data: {
      userId: user.id,
      mode: "explain",
    },
  });
  const currentSessionId = session.id;

  await prisma.aIMessage.create({
    data: {
      sessionId: currentSessionId,
      role: "user",
      content: task,
    },
  });

  const startTime = performance.now();

  const result = await agentOrchestrator.executeWithContext({
    mode: "parallel" as OrchestrationMode,
    agentIds,
    agentCount: 3,
    messages: [
      { role: "system", content: "You are an AI programming tutor on the SkillForge learning platform." },
      { role: "user", content: task },
    ],
    userId: user.id,
    contextOptions: {
      userId: user.id,
      sessionId: currentSessionId,
      question: task,
    },
  });

  const totalLatency = Math.round(performance.now() - startTime);

  await prisma.aIMessage.create({
    data: {
      sessionId: currentSessionId,
      role: "assistant",
      content: result.finalContent,
    },
  });

  for (const agentResult of result.agents) {
    await prisma.aIRequest.create({
      data: {
        userId: user.id,
        sessionId: currentSessionId,
        provider: agentResult.result.provider,
        model: agentResult.result.model,
        mode: "explain",
        inputTokens: agentResult.result.inputTokens,
        outputTokens: agentResult.result.outputTokens,
        latency: agentResult.result.latency,
        cost: agentResult.result.cost,
        status: "success",
        fallbackUsed: result.mode === "fallback",
      },
    });
  }

  return {
    sessionId: currentSessionId,
    content: result.finalContent,
    mode: result.mode,
    agents: result.agents.map((a) => ({
      name: a.agentRole.name,
      provider: a.result.provider,
      model: a.result.model,
      content: a.result.content,
      latency: a.result.latency,
      cost: a.result.cost,
      tokens: a.result.inputTokens + a.result.outputTokens,
    })),
    consensus: result.consensus,
    meta: {
      totalCost: result.meta.totalCost,
      totalTokens: result.meta.totalTokens,
      totalLatency,
      providers: result.meta.providers,
      models: result.meta.models,
    },
  };
}, { requireAuth: true, bodySchema: aiSchemas.orchestrate });

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;

  const agents = agentOrchestrator.getAllAgents();

  const agentDetails = agents.map((agent) => {
    const status = agentOrchestrator.getAgentStatus(agent.id);
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      expertise: agent.expertise,
      preferredProvider: agent.preferredProvider || null,
      preferredModel: agent.preferredModel || null,
      isAvailable: status.isAvailable,
      providerStatus: status.providerStatus
        ? {
            circuitOpen: status.providerStatus.circuitOpen,
            health: status.providerStatus.health
              ? {
                  isHealthy: status.providerStatus.health.isHealthy,
                  successRate: status.providerStatus.health.successRate,
                  avgLatency: status.providerStatus.health.avgLatency,
                }
              : null,
          }
        : null,
    };
  });

  return {
    agents: agentDetails,
    total: agentDetails.length,
    available: agentDetails.filter((a) => a.isAvailable).length,
  };
}, { requireAuth: true });