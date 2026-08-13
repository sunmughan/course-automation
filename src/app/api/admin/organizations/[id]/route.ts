import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { getOrganization, updateOrganization, deleteOrganization } from "@/lib/enterprise";
import { logAudit } from "@/lib/enterprise";

const updateOrgSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  customDomain: z.string().optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const orgId = params.id;

  const organization = await getOrganization(orgId);
  if (!organization) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  await logAudit({
    userId: user.id,
    action: "organizations:view",
    resource: "organization",
    resourceId: orgId,
    organizationId: orgId,
  });

  return { organization };
}, { requireAdmin: true });

export const PATCH = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const orgId = params.id;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof updateOrgSchema>;

  const existing = await getOrganization(orgId);
  if (!existing) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const organization = await updateOrganization(orgId, body);

  await logAudit({
    userId: user.id,
    action: "organizations:update",
    resource: "organization",
    resourceId: orgId,
    organizationId: orgId,
    details: body,
  });

  return { organization };
}, { requireAdmin: true, bodySchema: updateOrgSchema });

export const DELETE = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const orgId = params.id;

  const existing = await getOrganization(orgId);
  if (!existing) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  await deleteOrganization(orgId);

  await logAudit({
    userId: user.id,
    action: "organizations:delete",
    resource: "organization",
    resourceId: orgId,
    organizationId: orgId,
  });

  return { success: true };
}, { requireAdmin: true });