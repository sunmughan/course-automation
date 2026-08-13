import { z } from "zod";
import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { getOrganization } from "@/lib/enterprise";
import { logAudit } from "@/lib/enterprise";

const createTeamSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  departmentId: z.string().optional(),
});

const updateTeamSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  departmentId: z.string().optional(),
});

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const orgId = params.id;

  const org = await getOrganization(orgId);
  if (!org) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const teams = await prisma.team.findMany({
    where: { organizationId: orgId },
    include: {
      _count: { select: { members: true } },
      department: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return { teams };
}, { requireAdmin: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const orgId = params.id;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof createTeamSchema>;

  const org = await getOrganization(orgId);
  if (!org) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const team = await prisma.team.create({
    data: {
      name: body.name,
      description: body.description,
      organizationId: orgId,
      departmentId: body.departmentId || null,
    },
    include: {
      _count: { select: { members: true } },
    },
  });

  await logAudit({
    userId: user.id,
    action: "teams:create",
    resource: "team",
    resourceId: team.id,
    organizationId: orgId,
    details: { name: body.name },
  });

  return { team };
}, { requireAdmin: true, bodySchema: createTeamSchema });