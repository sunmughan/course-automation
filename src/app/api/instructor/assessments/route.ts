import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { generateAssessment } from "@/lib/instructor";

const generateAssessmentSchema = z.object({
  batchId: z.string().min(1),
  topicId: z.string().optional(),
  questionCount: z.number().min(1).max(20).optional(),
  types: z.array(z.string()).optional(),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof generateAssessmentSchema>;

  const batch = await prisma.batch.findFirst({
    where: { id: body.batchId, instructorId: user.id },
  });
  if (!batch) {
    return Response.json({ error: "Batch not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const assessment = await generateAssessment({
    batchId: body.batchId,
    instructorId: user.id,
    topicId: body.topicId,
    questionCount: body.questionCount,
    types: body.types,
  });

  return { assessment };
}, { requireInstructor: true, bodySchema: generateAssessmentSchema });