import { apiHandler } from "@/lib/api-handler";
import { AssessmentEngine } from "@/lib/assessments/engine";
import { z } from "zod";

const evaluateAssessmentSchema = z.object({
  answers: z.record(z.string(), z.string()),
  timeSpent: z.number().min(0).optional(),
  language: z.string().optional(),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { id } = await ctx.params;
  const body = (ctx as any).body as z.infer<typeof evaluateAssessmentSchema>;

  const result = await AssessmentEngine.evaluateAssessment({
    assessmentId: id,
    userId: user.id,
    answers: body.answers,
    timeSpent: body.timeSpent,
    language: body.language || "javascript",
  });

  return result;
}, { requireAuth: true, bodySchema: evaluateAssessmentSchema });
