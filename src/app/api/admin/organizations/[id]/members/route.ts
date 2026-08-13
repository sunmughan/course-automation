import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { getOrganization, getOrganizationMembers, addOrganizationMember, removeOrganizationMember, updateMemberRole } from "@/lib/enterprise";
import { logAudit } from "@/lib/enterprise";

const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

const updateMemberSchema = z.object({
  role: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

const removeMemberSchema = z.object({
  userId: z.string().min(1),
});

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const orgId = params.id;

  const org = await getOrganization(orgId);
  if (!org) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const members = await getOrganizationMembers(orgId);

  await logAudit({
    userId: user.id,
    action: "members:list",
    resource: "organization",
    resourceId: orgId,
    organizationId: orgId,
  });

  return { members };
}, { requireAdmin: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const orgId = params.id;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof addMemberSchema>;

  const org = await getOrganization(orgId);
  if (!org) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const member = await addOrganizationMember(
    orgId,
    body.userId,
    body.role || "member",
    body.permissions || []
  );

  await logAudit({
    userId: user.id,
    action: "members:add",
    resource: "organization",
    resourceId: orgId,
    organizationId: orgId,
    details: { userId: body.userId, role: body.role },
  });

  return { member };
}, { requireAdmin: true, bodySchema: addMemberSchema });

export const PATCH = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const orgId = params.id;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof updateMemberSchema>;

  const request = ctx.request;
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return Response.json({ error: "userId query parameter is required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const org = await getOrganization(orgId);
  if (!org) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const member = await updateMemberRole(orgId, userId, body.role || "member", body.permissions);

  await logAudit({
    userId: user.id,
    action: "members:update",
    resource: "organization",
    resourceId: orgId,
    organizationId: orgId,
    details: { userId, ...body },
  });

  return { member };
}, { requireAdmin: true, bodySchema: updateMemberSchema });

export const DELETE = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const orgId = params.id;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof removeMemberSchema>;

  const org = await getOrganization(orgId);
  if (!org) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  await removeOrganizationMember(orgId, body.userId);

  await logAudit({
    userId: user.id,
    action: "members:remove",
    resource: "organization",
    resourceId: orgId,
    organizationId: orgId,
    details: { userId: body.userId },
  });

  return { success: true };
}, { requireAdmin: true, bodySchema: removeMemberSchema });