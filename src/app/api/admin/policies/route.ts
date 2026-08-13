import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import {
  listPolicies,
  createPolicy,
  getOrganization,
  logAudit,
} from "@/lib/enterprise";

const createPolicySchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().optional(),
  rules: z.record(z.string(), z.unknown()).optional(),
  isEnabled: z.boolean().optional(),
});

export const GET = apiHandler(async (ctx) => {
  const request = ctx.request;
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");

  if (!organizationId) {
    return Response.json(
      { error: "organizationId query parameter is required", code: "VALIDATION_ERROR" },
      { status: 400 }
    );
  }

  const org = await getOrganization(organizationId);
  if (!org) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const policies = await listPolicies(organizationId);
  return { policies };
}, { requireAdmin: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof createPolicySchema>;

  const org = await getOrganization(body.organizationId);
  if (!org) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const policy = await createPolicy(body);

  await logAudit({
    userId: user.id,
    action: "policies:create",
    resource: "policy",
    resourceId: policy.id,
    organizationId: body.organizationId,
    details: { name: body.name, type: body.type },
  });

  return { policy };
}, { requireAdmin: true, bodySchema: createPolicySchema });
