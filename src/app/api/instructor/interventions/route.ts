import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { generateAIInterventions } from "@/lib/instructor";

const createInterventionSchema = z.object({
  studentId: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
});

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const request = ctx.request;
  const url = new URL(request.url);
  const batchId = url.searchParams.get("batchId");
  const generate = url.searchParams.get("generate") === "true";

  if (generate) {
    if (!batchId) {
      return Response.json({ error: "batchId query parameter is required when generate=true", code: "VALIDATION_ERROR" }, { status: 400 });
    }

    const batch = await prisma.batch.findFirst({
      where: { id: batchId, instructorId: user.id },
    });
    if (!batch) {
      return Response.json({ error: "Batch not found", code: "NOT_FOUND" }, { status: 404 });
    }

    const interventions = await generateAIInterventions(batchId, user.id);
    return { interventions };
  }

  const where: Record<string, unknown> = {};
  if (batchId) {
    const batch = await prisma.batch.findFirst({
      where: { id: batchId, instructorId: user.id },
      include: { students: { select: { studentId: true } } },
    });
    if (!batch) {
      return Response.json({ error: "Batch not found", code: "NOT_FOUND" }, { status: 404 });
    }
    where.studentId = { in: batch.students.map((s) => s.studentId) };
  } else {
    const batches = await prisma.batch.findMany({
      where: { instructorId: user.id },
      include: { students: { select: { studentId: true } } },
    });
    const allStudentIds = batches.flatMap((b) => b.students.map((s) => s.studentId));
    where.studentId = { in: allStudentIds };
  }

  const interventions = await prisma.intervention.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { interventions };
}, { requireInstructor: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof createInterventionSchema>;

  const intervention = await prisma.intervention.create({
    data: {
      studentId: body.studentId,
      instructorId: user.id,
      type: body.type,
      title: body.title,
      description: body.description,
    },
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
  });

  return { intervention };
}, { requireInstructor: true, bodySchema: createInterventionSchema });