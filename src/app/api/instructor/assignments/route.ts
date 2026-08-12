import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { generateAssignments } from "@/lib/instructor";

const generateAssignmentSchema = z.object({
  batchId: z.string().min(1),
  topicId: z.string().optional(),
  type: z.string().optional(),
  difficulty: z.number().min(1).max(5).optional(),
  count: z.number().min(1).max(10).optional(),
  save: z.boolean().optional(),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof generateAssignmentSchema>;

  const batch = await prisma.batch.findFirst({
    where: { id: body.batchId, instructorId: user.id },
  });
  if (!batch) {
    return Response.json({ error: "Batch not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const assignments = await generateAssignments({
    batchId: body.batchId,
    instructorId: user.id,
    topicId: body.topicId,
    type: body.type,
    difficulty: body.difficulty,
    count: body.count,
  });

  if (body.save) {
    const saved = [];
    for (const a of assignments) {
      const created = await prisma.assignment.create({
        data: {
          title: a.title,
          description: a.description,
          instructions: a.instructions,
          batchId: body.batchId,
          type: a.type,
          difficulty: a.difficulty,
          maxScore: a.maxScore,
          starterCode: a.starterCode,
          rubric: JSON.stringify(a.rubric),
        },
      });
      saved.push(created);
    }
    return { assignments: saved, generated: assignments };
  }

  return { assignments };
}, { requireInstructor: true, bodySchema: generateAssignmentSchema });