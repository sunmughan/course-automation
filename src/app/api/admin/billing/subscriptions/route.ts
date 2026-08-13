import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { getSubscription, createSubscription, cancelSubscription } from "@/lib/enterprise";
import { getOrganization } from "@/lib/enterprise";
import { logAudit } from "@/lib/enterprise";

const createSubSchema = z.object({
  organizationId: z.string().min(1),
  planId: z.string().min(1),
  billingCycle: z.enum(["monthly", "yearly"]).optional(),
});

export const GET = apiHandler(async (ctx) => {
  const request = ctx.request;
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");

  if (!organizationId) {
    return Response.json({ error: "organizationId query parameter is required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  const org = await getOrganization(organizationId);
  if (!org) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const subscription = await getSubscription(organizationId);
  return { subscription };
}, { requireAdmin: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof createSubSchema>;

  const org = await getOrganization(body.organizationId);
  if (!org) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const subscription = await createSubscription(
    body.organizationId,
    body.planId,
    body.billingCycle || "monthly"
  );

  await logAudit({
    userId: user.id,
    action: "billing:subscribe",
    resource: "subscription",
    resourceId: subscription.id,
    organizationId: body.organizationId,
    details: { planId: body.planId, billingCycle: body.billingCycle },
  });

  return { subscription };
}, { requireAdmin: true, bodySchema: createSubSchema });

export const DELETE = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const request = ctx.request;
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");

  if (!organizationId) {
    return Response.json({ error: "organizationId query parameter is required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  await cancelSubscription(organizationId);

  await logAudit({
    userId: user.id,
    action: "billing:cancel",
    resource: "subscription",
    organizationId,
  });

  return { success: true };
}, { requireAdmin: true });