import { apiHandler } from "@/lib/api-handler";
import { InterviewEngine } from "@/lib/interviews/engine";
import { z } from "zod";

const submitAnswerSchema = z.object({
  sessionId: z.string().min(1),
  turnId: z.string().min(1),
  candidateAnswer: z.string().min(1, "Candidate answer is required"),
  maxTurns: z.number().int().min(1).max(10).optional(),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as z.infer<typeof submitAnswerSchema>;

  const result = await InterviewEngine.submitAnswer({
    sessionId: body.sessionId,
    turnId: body.turnId,
    userId: user.id,
    candidateAnswer: body.candidateAnswer,
  }, body.maxTurns || 4);

  return result;
}, { requireAuth: true, bodySchema: submitAnswerSchema });
