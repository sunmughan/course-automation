import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aiGateway } from "@/lib/ai/gateway";
import { agentOrchestrator, type OrchestrationMode } from "@/lib/ai/orchestrator";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      message,
      mode = "parallel" as OrchestrationMode,
      agentIds,
      agentCount = 3,
      sessionId,
      code,
      topicId,
      lessonId,
      temperature,
      taskType,
    } = body as {
      message: string;
      mode?: OrchestrationMode;
      agentIds?: string[];
      agentCount?: number;
      sessionId?: string;
      code?: string;
      topicId?: string;
      lessonId?: string;
      temperature?: number;
      taskType?: string;
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const activeProviders = aiGateway.getActiveProviders();
    if (activeProviders.length === 0) {
      return NextResponse.json(
        {
          error: "No AI providers are configured. Please set NVIDIA_API_KEY or GEMINI_API_KEY in your environment.",
        },
        { status: 503 }
      );
    }

    const validModes: OrchestrationMode[] = ["parallel", "chain", "voting", "debate", "fallback"];
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { error: `Invalid mode. Must be one of: ${validModes.join(", ")}` },
        { status: 400 }
      );
    }

    let currentSessionId = sessionId;
    if (!currentSessionId) {
      const session = await prisma.aISession.create({
        data: {
          userId: user.id,
          topicId: topicId || null,
          lessonId: lessonId || null,
          mode: "explain",
        },
      });
      currentSessionId = session.id;
    }

    await prisma.aIMessage.create({
      data: {
        sessionId: currentSessionId,
        role: "user",
        content: message,
        code: code || null,
      },
    });

    const startTime = performance.now();

    const result = await agentOrchestrator.executeWithContext({
      mode,
      agentIds,
      agentCount,
      messages: [
        { role: "system", content: "You are an AI programming tutor on the SkillForge learning platform." },
        { role: "user", content: message },
      ],
      taskType,
      userId: user.id,
      temperature,
      contextOptions: {
        userId: user.id,
        sessionId: currentSessionId,
        topicId,
        lessonId,
        code,
        question: message,
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

    return NextResponse.json({
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
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskType = searchParams.get("taskType") || undefined;

    const agents = taskType
      ? agentOrchestrator.getAvailableAgentsForTask(taskType)
      : agentOrchestrator.getAllAgents();

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

    return NextResponse.json({
      agents: agentDetails,
      total: agentDetails.length,
      available: agentDetails.filter((a) => a.isAvailable).length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}