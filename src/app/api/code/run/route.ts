import { executeJavaScript } from "@/lib/execution/sandbox";
import { analyzeTrace } from "@/lib/execution/tracer";
import { executeMultiLanguage } from "@/lib/execution/multi-lang-sandbox";
import { isExecutableLanguage } from "@/lib/execution/languages";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { codeSchemas } from "@/lib/errors";
import { SkillEvaluationService } from "@/lib/adaptive/skill-evaluation";

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as {
    code: string;
    language: string;
    timeout?: number;
    trace?: boolean;
    topicId?: string;
    lessonId?: string;
  };

  const { code, language = "javascript", timeout = 5000, trace = false, topicId, lessonId } = body;

  const result = await executeMultiLanguage({
    code,
    language,
    trace,
    timeoutMs: timeout,
    userId: user.id,
  });

  const status = result.status || (result.error ? (result.exitCode === 124 ? "timeout" : "error") : "success");

  if (result.error && topicId) {
    await SkillEvaluationService.recordMistake(
      user.id,
      topicId,
      lessonId || null,
      code.slice(0, 1000),
      result.error.slice(0, 500)
    );
  }

  await prisma.executionRun.create({
    data: {
      code: code.slice(0, 10000),
      language,
      output: (result.output || "").slice(0, 10000),
      error: result.error,
      executionTime: result.executionTime,
      exitCode: result.exitCode ?? (result.error ? 1 : 0),
      memoryUsed: result.memoryUsed || 0,
      status,
      events: JSON.stringify(result.events),
    },
  });

  await prisma.analyticsEvent.create({
    data: {
      userId: user.id,
      event: "code_execution",
      data: JSON.stringify({
        language,
        codeLength: code.length,
        duration: result.executionTime,
        exitCode: result.exitCode,
        memoryUsed: result.memoryUsed,
        status,
        hasError: !!result.error,
        outputLength: (result.output || "").length,
        traceEnabled: trace,
      }),
    },
  });

  return {
    output: result.output,
    events: result.events,
    executionTime: result.executionTime,
    error: result.error,
    exitCode: result.exitCode ?? (result.error ? 1 : 0),
    memoryUsed: result.memoryUsed || 0,
    status,
    trace: result.trace || null,
  };
}, { requireAuth: true, bodySchema: codeSchemas.run });