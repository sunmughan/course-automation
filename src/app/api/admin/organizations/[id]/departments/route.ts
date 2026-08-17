import { apiHandler } from "@/lib/api-handler";
import { OrganizationService } from "@/lib/organizations/org-service";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parentId: z.string().optional(),
});

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { id: organizationId } = await ctx.params;

  const hasAccess = await OrganizationService.verifyOrgAccess(user.id, organizationId);
  if (!hasAccess) {
    return Response.json({ error: "Unauthorized access to organization", code: "FORBIDDEN" }, { status: 403 });
  }

  const departments = await prisma.department.findMany({
    where: { organizationId },
    include: {
      teams: { select: { id: true, name: true } },
      batches: { select: { id: true, name: true } },
      _count: { select: { teams: true, batches: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { departments };
}, { requireAuth: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { id: organizationId } = await ctx.params;
  const body = (ctx as any).body as z.infer<typeof createDepartmentSchema>;

  const hasAccess = await OrganizationService.verifyOrgAccess(user.id, organizationId, ["owner", "admin"]);
  if (!hasAccess) {
    return Response.json({ error: "Unauthorized to create department in this organization", code: "FORBIDDEN" }, { status: 403 });
  }

  const department = await OrganizationService.createDepartment({
    organizationId,
    name: body.name,
    description: body.description,
    parentId: body.parentId,
  });

  return { department };
}, { requireAuth: true, bodySchema: createDepartmentSchema });
