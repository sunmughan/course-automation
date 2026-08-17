import { apiHandler } from "@/lib/api-handler";
import { OrganizationService } from "@/lib/organizations/org-service";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createOrgBatchSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  instructorId: z.string().min(1, "Instructor ID is required"),
  courseId: z.string().optional(),
  departmentId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { id: organizationId } = await ctx.params;

  const hasAccess = await OrganizationService.verifyOrgAccess(user.id, organizationId);
  if (!hasAccess) {
    return Response.json({ error: "Unauthorized access to organization", code: "FORBIDDEN" }, { status: 403 });
  }

  const batches = await prisma.batch.findMany({
    where: { organizationId },
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, title: true } },
      department: { select: { id: true, name: true } },
      _count: { select: { students: true, assignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { batches };
}, { requireAuth: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { id: organizationId } = await ctx.params;
  const body = (ctx as any).body as z.infer<typeof createOrgBatchSchema>;

  const hasAccess = await OrganizationService.verifyOrgAccess(user.id, organizationId, ["owner", "admin", "instructor"]);
  if (!hasAccess) {
    return Response.json({ error: "Unauthorized to create batch in this organization", code: "FORBIDDEN" }, { status: 403 });
  }

  const batch = await OrganizationService.createBatch({
    organizationId,
    departmentId: body.departmentId,
    instructorId: body.instructorId,
    courseId: body.courseId,
    name: body.name,
    description: body.description,
    startDate: body.startDate ? new Date(body.startDate) : undefined,
    endDate: body.endDate ? new Date(body.endDate) : undefined,
  });

  return { batch };
}, { requireAuth: true, bodySchema: createOrgBatchSchema });
