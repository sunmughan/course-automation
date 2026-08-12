import { prisma } from "@/lib/db";
import { aiGateway } from "@/lib/ai/gateway";
import { aiRouter } from "@/lib/ai/router";
import { assembleContext } from "@/lib/ai/protocol/context-assembly";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/protocol/instructions";
import { conversationManager } from "@/lib/ai/protocol/conversation";
import { createUserMessage, createAssistantMessage, flattenToOpenAI } from "@/lib/ai/protocol/messages";
import { parseStructuredOutput, formatStructuredOutputForDisplay } from "@/lib/ai/protocol/outputs";
import { executeTool, parseToolCallFromResponse } from "@/lib/ai/protocol/tools";
import { detectErrorCategory, generateErrorExplanation } from "@/lib/ai/protocol/error-correction";
import { apiHandler } from "@/lib/api-handler";
import { aiSchemas, AppError } from "@/lib/errors";
import type { TutorMode } from "@/types";

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as {
    message: string;
    lessonId?: string;
    topicId?: string;
    mode: TutorMode;
    conversationId?: string;
    code?: string;
    enforceStructuredOutput?: boolean;
  };

  const { message, lessonId, topicId, mode, conversationId, code, enforceStructuredOutput } = body;

  const activeProviders = aiGateway.getActiveProviders();
  if (activeProviders.length === 0) {
    throw new AppError(
      "No AI providers are configured. Please set NVIDIA_API_KEY or GEMINI_API_KEY in your environment.",
      503,
      "SERVICE_UNAVAILABLE"
    );
  }

  let currentSessionId = conversationId;
  let turnIndex = 0;
  let conversationState = "initial";

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

    conversationManager.createSession(user.id, mode, {
      lessonId: lessonId || undefined,
      topicId: topicId || undefined,
    });
  } else {
    const existingSession = conversationManager.getSession(currentSessionId);
    if (existingSession) {
      turnIndex = existingSession.turns.length;
      conversationState = existingSession.state;
    } else {
      conversationManager.createSession(user.id, mode, {
        lessonId: lessonId || undefined,
        topicId: topicId || undefined,
      });
    }
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

  const userMsg = createUserMessage(message, {
    code: code ? [{ language: "javascript", code }] : undefined,
    mode,
    context: {
      lessonId: lessonId || undefined,
      topicId: topicId || undefined,
    },
    sessionId: currentSessionId,
    messageIndex: turnIndex,
  });

  const assembled = await assembleContext({
    userId: user.id,
    sessionId: currentSessionId,
    lessonId,
    topicId,
    code,
    question: message,
    maxContextTokens: 6000,
    includeRelatedTopics: true,
    includeSkillMap: true,
    compressHistory: true,
  });

  const systemPrompt = buildSystemPrompt(mode, assembled.aiContext, {
    enforceStructuredOutput: enforceStructuredOutput || false,
    includeTools: true,
    includeExamples: true,
  });

  const userPrompt = buildUserPrompt(assembled.aiContext);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const startTime = performance.now();

  let result;
  try {
    result = await aiRouter.executeWithFallback(messages, {
      complexity: "medium",
      userId: user.id,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    const { errorCategory, explanation } = generateErrorExplanation(errorMsg, code);

    await prisma.aIMessage.create({
      data: {
        sessionId: currentSessionId,
        role: "assistant",
        content: explanation,
      },
    });

    return {
      sessionId: currentSessionId,
      message: { role: "assistant", content: explanation },
      meta: {
        error: true,
        errorCategory,
        latency: Math.round(performance.now() - startTime),
      },
    };
  }

  const latency = performance.now() - startTime;

  let displayContent = result.content;
  let structuredOutput = null;
  let toolResults = null;

  if (enforceStructuredOutput) {
    structuredOutput = parseStructuredOutput(result.content, mode);
    if (structuredOutput) {
      displayContent = formatStructuredOutputForDisplay(structuredOutput);
    }
  }

  const toolCall = parseToolCallFromResponse(result.content);
  if (toolCall) {
    const toolResult = await executeTool(toolCall.name, toolCall.arguments);
    if (toolResult.success) {
      toolResults = {
        name: toolCall.name,
        result: toolResult.result,
      };
    }
  }

  await prisma.aIMessage.create({
    data: {
      sessionId: currentSessionId,
      role: "assistant",
      content: displayContent,
      code: structuredOutput ? JSON.stringify(structuredOutput) : null,
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

  const assistantMsg = createAssistantMessage(displayContent, {
    sessionId: currentSessionId,
    messageIndex: turnIndex + 1,
    tokenUsage: {
      prompt: result.inputTokens,
      completion: result.outputTokens,
      total: result.inputTokens + result.outputTokens,
    },
  });

  conversationManager.addTurn(
    currentSessionId,
    userMsg,
    assistantMsg,
    result.inputTokens + result.outputTokens,
    latency,
    toolResults ? 1 : 0
  );

  const suggestedMode = conversationManager.suggestModeSwitch(currentSessionId);
  const stats = conversationManager.getStats(currentSessionId);

  return {
    sessionId: currentSessionId,
    message: {
      role: "assistant",
      content: displayContent,
      structuredOutput,
      toolResults,
    },
    meta: {
      provider: result.provider,
      model: result.model,
      latency: Math.round(latency),
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      conversationState: stats?.state || "initial",
      suggestedModeSwitch: suggestedMode,
      turnCount: stats?.turns || 1,
    },
  };
}, { requireAuth: true, bodySchema: aiSchemas.chat });