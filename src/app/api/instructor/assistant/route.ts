import { apiHandler } from "@/lib/api-handler";
import { AIInstructorAssistant } from "@/lib/instructor";
import { z } from "zod";

const assistantQuerySchema = z.object({
  batchId: z.string().min(1, "batchId is required"),
  query: z.string().min(2, "query is required"),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
  })).optional(),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as z.infer<typeof assistantQuerySchema>;

  const response = await AIInstructorAssistant.ask({
    instructorId: user.id,
    batchId: body.batchId,
    query: body.query,
    history: body.history,
  });

  return response;
}, { requireInstructor: true, bodySchema: assistantQuerySchema });
