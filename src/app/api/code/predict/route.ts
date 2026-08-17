import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { predictionEngine } from "@/lib/execution/prediction-engine";

const predictSchema = z.object({
  code: z.string().min(1),
  language: z.string().default("javascript"),
  studentPrediction: z.string().min(1),
  topicId: z.string().optional(),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as z.infer<typeof predictSchema>;

  const result = await predictionEngine.evaluatePrediction({
    userId: user.id,
    topicId: body.topicId,
    code: body.code,
    language: body.language,
    studentPrediction: body.studentPrediction,
  });

  return {
    success: true,
    result,
  };
}, { bodySchema: predictSchema });
