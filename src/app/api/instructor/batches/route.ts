import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";

const createBatchSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  courseId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;

  const batches = await prisma.batch.findMany({
    where: { instructorId: user.id },
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { students: true, assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { batches };
}, { requireInstructor: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof createBatchSchema>;

  const batch = await prisma.batch.create({
    data: {
      name: body.name,
      description: body.description,
      courseId: body.courseId,
      instructorId: user.id,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
    include: {
      course: { select: { id: true, title: true } },
      _count: { select: { students: true } },
    },
  });

  return { batch };
}, { requireInstructor: true, bodySchema: createBatchSchema });