import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";

const updateBatchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  courseId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const batchId = params.id;

  const batch = await prisma.batch.findFirst({
    where: { id: batchId, instructorId: user.id },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      students: {
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: "desc" },
      },
      assignments: {
        include: {
          _count: { select: { submissions: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      announcements: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!batch) {
    return Response.json({ error: "Batch not found", code: "NOT_FOUND" }, { status: 404 });
  }

  return { batch };
}, { requireInstructor: true });

export const PATCH = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const batchId = params.id;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof updateBatchSchema>;

  const existing = await prisma.batch.findFirst({
    where: { id: batchId, instructorId: user.id },
  });
  if (!existing) {
    return Response.json({ error: "Batch not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const batch = await prisma.batch.update({
    where: { id: batchId },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.courseId !== undefined && { courseId: body.courseId }),
      ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
      ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { students: true } },
    },
  });

  return { batch };
}, { requireInstructor: true, bodySchema: updateBatchSchema });

export const DELETE = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const batchId = params.id;

  const existing = await prisma.batch.findFirst({
    where: { id: batchId, instructorId: user.id },
  });
  if (!existing) {
    return Response.json({ error: "Batch not found", code: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.batch.delete({ where: { id: batchId } });

  return { success: true };
}, { requireInstructor: true });