import { apiHandler } from "@/lib/api-handler";
import { PlaygroundService } from "@/lib/projects/playground-service";
import { executeMultiLanguage } from "@/lib/execution/multi-lang-sandbox";
import { z } from "zod";

const executeProjectSchema = z.object({
  code: z.string(),
  language: z.string().default("javascript"),
  entryFile: z.string().default("src/main.js"),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { id: projectId } = await ctx.params;
  const body = (ctx as any).body as z.infer<typeof executeProjectSchema>;

  const startTime = Date.now();
  let executionResult: any;

  try {
    executionResult = await executeMultiLanguage({
      code: body.code,
      language: body.language,
      userId: user.id,
    });
  } catch (err: any) {
    executionResult = {
      output: "",
      error: err.message || "Execution failed",
      status: "error",
      exitCode: 1,
      executionTime: 0,
      memoryUsed: 0,
    };
  }

  const duration = (Date.now() - startTime) / 1000;

  const execution = await PlaygroundService.recordExecution({
    projectId,
    userId: user.id,
    entryFile: body.entryFile,
    language: body.language,
    code: body.code,
    output: executionResult.output || "",
    error: executionResult.error,
    status: executionResult.error ? "error" : "success",
    exitCode: executionResult.exitCode ?? (executionResult.error ? 1 : 0),
    executionTime: executionResult.executionTime ?? duration,
    memoryUsed: executionResult.memoryUsed ?? 0,
  });

  return {
    result: executionResult,
    executionId: execution.id,
  };
}, { requireAuth: true, bodySchema: executeProjectSchema });
