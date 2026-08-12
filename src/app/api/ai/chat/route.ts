import { NextRequest, NextResponse } from "next/server";
import type { TutorMode } from "@/types";
import { prisma } from "@/lib/db";
import { aiGateway } from "@/lib/ai/gateway";
import { aiRouter } from "@/lib/ai/router";
import { buildContext, type ExecutionContext } from "@/lib/ai/context";
import { composePromptCompact } from "@/lib/ai/prompts";
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
      sessionId,
      mode = "explain" as TutorMode,
      code,
      topicId,
      lessonId,
      executionResult,
    } = body as {
      message: string;
      sessionId?: string;
      mode?: TutorMode;
      code?: string;
      topicId?: string;
      lessonId?: string;
      executionResult?: ExecutionContext;
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const activeProviders = aiGateway.getActiveProviders();
    if (activeProviders.length === 0) {
      return NextResponse.json(
        {
          error: "No AI providers are configured. Please set NVIDIA_API_KEY or GEMINI_API_KEY in your environment.",
          role: "assistant",
          content: "I'm sorry, but the AI tutor is not available right now. Please make sure the API keys are configured.",
        },
        { status: 503 }
      );
    }

    let currentSessionId = sessionId;

    if (!currentSessionId) {
      const session = await prisma.aISession.create({
        data: {
          userId: user.id,
          topicId: topicId || null,
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
        code: code || null,
      },
    });

    await prisma.aISession.update({
      where: { id: currentSessionId },
      data: { mode, updatedAt: new Date() },
    });

    const context = await buildContext({
      userId: user.id,
      sessionId: currentSessionId,
      topicId,
      lessonId,
      code,
      question: message,
      executionResult,
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

    return NextResponse.json({
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
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";

    return NextResponse.json(
      {
        error: errorMessage,
        role: "assistant",
        content: "I'm sorry, I encountered an error while processing your request. Please try again.",
      },
      { status: 500 }
    );
  }
}