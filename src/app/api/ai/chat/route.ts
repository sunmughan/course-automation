import { prisma } from "@/lib/db";
import { aiGateway } from "@/lib/ai/gateway";
import { aiRouter } from "@/lib/ai/router";
import { assembleContext } from "@/lib/ai/protocol/context-assembly";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/ai/protocol/instructions";
import { conversationManager } from "@/lib/ai/protocol/conversation";
import { createUserMessage, createAssistantMessage, flattenToOpenAI } from "@/lib/ai/protocol/messages";
import { parseStructuredOutput, formatStructuredOutputForDisplay, parseEducationalExplanation } from "@/lib/ai/protocol/outputs";
import { executeTool, parseToolCallFromResponse } from "@/lib/ai/protocol/tools";
import { detectErrorCategory, generateErrorExplanation } from "@/lib/ai/protocol/error-correction";
import { getAIOrganizationId } from "@/lib/ai/request-context";
import { apiHandler } from "@/lib/api-handler";
import { aiSchemas, AppError } from "@/lib/errors";
import type { TutorMode } from "@/types";
import { validateAIQuality } from "@/lib/ai/quality-guard";

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as {
    message: string;
    lessonId?: string;
    topicId?: string;
    mode: TutorMode;
    conversationId?: string;
    code?: string;
    executionResult?: any;
    selectedLine?: number;
    selectedEventIndex?: number;
    enforceStructuredOutput?: boolean;
  };

  const {
    message,
    lessonId,
    topicId,
    mode,
    conversationId,
    code,
    executionResult,
    selectedLine,
    selectedEventIndex,
    enforceStructuredOutput,
  } = body;

  const activeProviders = aiGateway.getActiveProviders();
  // Note: Even if no external providers are active, the AI router
  // will fall back to the local knowledge-base, so we don't block here.

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

  const assembledExecution = executionResult
    ? {
        ...executionResult,
        selectedLine: selectedLine !== undefined ? selectedLine : executionResult.selectedLine,
        selectedEventIndex:
          selectedEventIndex !== undefined ? selectedEventIndex : executionResult.selectedEventIndex,
        selectedEvent:
          selectedEventIndex !== undefined && Array.isArray(executionResult.events)
            ? executionResult.events[selectedEventIndex]
            : executionResult.selectedEvent,
      }
    : undefined;

  const assembled = await assembleContext({
    userId: user.id,
    sessionId: currentSessionId,
    lessonId,
    topicId,
    code,
    question: message,
    executionResult: assembledExecution,
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
  const organizationId = await getAIOrganizationId(user.id);

  let result;
  try {
    result = await aiRouter.executeWithFallback(messages, {
      complexity: "medium",
      userId: user.id,
      organizationId,
      requestId: ctx.requestId,
      sessionId: currentSessionId,
      agent: "tutor",
      mode,
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

  // AI Quality Guard & Safety Validation
  const { sanitizedContent } = validateAIQuality({
    content: displayContent,
    mode,
  });
  displayContent = sanitizedContent;

  const educationalResponse = parseEducationalExplanation(displayContent);

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
      educationalResponse: educationalResponse || undefined,
      visualization: educationalResponse?.visualization || undefined,
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