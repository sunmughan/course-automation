import { prisma } from "@/lib/db";
import { aiGateway } from "@/lib/ai/gateway";
import { aiRouter } from "@/lib/ai/router";
import { buildContext } from "@/lib/ai/context";
import { composePromptCompact } from "@/lib/ai/prompts";
import { apiHandler } from "@/lib/api-handler";
import { aiSchemas, AppError } from "@/lib/errors";
import type { TutorMode } from "@/types";

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as {
    message: string;
    lessonId?: string;
    mode: TutorMode;
    conversationId?: string;
  };

  const { message, lessonId, mode, conversationId } = body;

  const activeProviders = aiGateway.getActiveProviders();
  if (activeProviders.length === 0) {
    throw new AppError(
      "No AI providers are configured. Please set NVIDIA_API_KEY or GEMINI_API_KEY in your environment.",
      503,
      "SERVICE_UNAVAILABLE"
    );
  }

  let currentSessionId = conversationId;

  if (!currentSessionId) {
    const session = await prisma.aISession.create({
      data: {
        userId: user.id,
        topicId: null,
        lessonId: lessonId || null,
        mode,
      },
    });
    currentSessionId = session.id;
  }

  await prisma.aIMessage.create({
    data: {
      sessionId: currentSessionId,
      role: "user",
      content: message,
    },
  });

  await prisma.aISession.update({
    where: { id: currentSessionId },
    data: { mode, updatedAt: new Date() },
  });

  const context = await buildContext({
    userId: user.id,
    sessionId: currentSessionId,
    lessonId,
    question: message,
  });

  const messages = composePromptCompact(mode, context);

  const startTime = performance.now();

  const result = await aiRouter.executeWithFallback(messages);

  const latency = performance.now() - startTime;

  await prisma.aIMessage.create({
    data: {
      sessionId: currentSessionId,
      role: "assistant",
      content: result.content,
    },
  });

  await prisma.aIRequest.create({
    data: {
      userId: user.id,
      sessionId: currentSessionId,
      provider: result.provider,
      model: result.model,
      mode,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latency,
      cost: result.cost,
      status: "success",
      fallbackUsed: false,
    },
  });

  return {
    sessionId: currentSessionId,
    message: {
      role: "assistant",
      content: result.content,
    },
    meta: {
      provider: result.provider,
      model: result.model,
      latency: Math.round(latency),
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    },
  };
}, { requireAuth: true, bodySchema: aiSchemas.chat });