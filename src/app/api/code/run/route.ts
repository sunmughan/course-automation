import { executeJavaScript } from "@/lib/execution/sandbox";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { codeSchemas } from "@/lib/errors";

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as {
    code: string;
    language: string;
  };

  const { code, language = "javascript" } = body;

  const result = await executeJavaScript(code, language);

  await prisma.executionRun.create({
    data: {
      code: code.slice(0, 10000),
      language,
      output: (result.output || "").slice(0, 10000),
      error: result.error,
      executionTime: result.executionTime,
      status: result.error ? "error" : "success",
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
        hasError: !!result.error,
        outputLength: (result.output || "").length,
      }),
    },
  });

  return {
    output: result.output,
    events: result.events,
    executionTime: result.executionTime,
    error: result.error,
  };
}, { requireAuth: true, bodySchema: codeSchemas.run });