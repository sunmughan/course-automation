import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import {
  getPolicy,
  updatePolicy,
  deletePolicy,
  logAudit,
} from "@/lib/enterprise";

const updatePolicySchema = z.object({
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  description: z.string().optional(),
  rules: z.record(z.string(), z.unknown()).optional(),
  isEnabled: z.boolean().optional(),
});

export const GET = apiHandler(async (ctx) => {
  const params = await ctx.params;
  const policyId = params.id;

  const policy = await getPolicy(policyId);
  if (!policy) {
    return Response.json({ error: "Policy not found", code: "NOT_FOUND" }, { status: 404 });
  }

  return { policy };
}, { requireAdmin: true });

export const PATCH = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const policyId = params.id;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof updatePolicySchema>;

  const existing = await getPolicy(policyId);
  if (!existing) {
    return Response.json({ error: "Policy not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const policy = await updatePolicy(policyId, body);

  await logAudit({
    userId: user.id,
    action: "policies:update",
    resource: "policy",
    resourceId: policyId,
    organizationId: existing.organizationId,
    details: body,
  });

  return { policy };
}, { requireAdmin: true, bodySchema: updatePolicySchema });

export const DELETE = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const policyId = params.id;

  const existing = await getPolicy(policyId);
  if (!existing) {
    return Response.json({ error: "Policy not found", code: "NOT_FOUND" }, { status: 404 });
  }

  await deletePolicy(policyId);

  await logAudit({
    userId: user.id,
    action: "policies:delete",
    resource: "policy",
    resourceId: policyId,
    organizationId: existing.organizationId,
  });

  return { success: true };
}, { requireAdmin: true });
