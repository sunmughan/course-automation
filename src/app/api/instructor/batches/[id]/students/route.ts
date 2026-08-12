import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";

const addStudentSchema = z.object({
  studentId: z.string().min(1),
});

const removeStudentSchema = z.object({
  studentId: z.string().min(1),
});

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const batchId = params.id;

  const batch = await prisma.batch.findFirst({
    where: { id: batchId, instructorId: user.id },
  });
  if (!batch) {
    return Response.json({ error: "Batch not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const students = await prisma.batchStudent.findMany({
    where: { batchId },
    include: {
      student: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return { students };
}, { requireInstructor: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const batchId = params.id;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof addStudentSchema>;

  const batch = await prisma.batch.findFirst({
    where: { id: batchId, instructorId: user.id },
  });
  if (!batch) {
    return Response.json({ error: "Batch not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const existing = await prisma.batchStudent.findUnique({
    where: { batchId_studentId: { batchId, studentId: body.studentId } },
  });
  if (existing) {
    return Response.json({ error: "Student already in batch", code: "CONFLICT" }, { status: 409 });
  }

  const membership = await prisma.batchStudent.create({
    data: { batchId, studentId: body.studentId },
    include: {
      student: { select: { id: true, name: true, email: true } },
    },
  });

  return { membership };
}, { requireInstructor: true, bodySchema: addStudentSchema });

export const DELETE = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const batchId = params.id;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof removeStudentSchema>;

  const batch = await prisma.batch.findFirst({
    where: { id: batchId, instructorId: user.id },
  });
  if (!batch) {
    return Response.json({ error: "Batch not found", code: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.batchStudent.deleteMany({
    where: { batchId, studentId: body.studentId },
  });

  return { success: true };
}, { requireInstructor: true, bodySchema: removeStudentSchema });