import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { configureSSO, getSSOConfigs, disableSSO, deleteSSO, getSupportedProviders } from "@/lib/enterprise";
import { getOrganization } from "@/lib/enterprise";
import { logAudit } from "@/lib/enterprise";

const configureSSOSchema = z.object({
  organizationId: z.string().min(1),
  provider: z.string().min(1),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  issuerUrl: z.string().optional(),
  domain: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
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

  const configs = await getSSOConfigs(organizationId);
  const providers = getSupportedProviders();

  return { configs, supportedProviders: providers };
}, { requireAdmin: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof configureSSOSchema>;

  const org = await getOrganization(body.organizationId);
  if (!org) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const config = await configureSSO(body.organizationId, {
    provider: body.provider,
    clientId: body.clientId,
    clientSecret: body.clientSecret,
    issuerUrl: body.issuerUrl,
    domain: body.domain,
    settings: body.settings,
  });

  await logAudit({
    userId: user.id,
    action: "sso:configure",
    resource: "sso",
    resourceId: config.id,
    organizationId: body.organizationId,
    details: { provider: body.provider },
  });

  return { config };
}, { requireAdmin: true, bodySchema: configureSSOSchema });

export const PATCH = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const request = ctx.request;
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");
  const provider = url.searchParams.get("provider");

  if (!organizationId || !provider) {
    return Response.json({ error: "organizationId and provider query parameters are required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  await disableSSO(organizationId, provider);

  await logAudit({
    userId: user.id,
    action: "sso:disable",
    resource: "sso",
    organizationId,
    details: { provider },
  });

  return { success: true };
}, { requireAdmin: true });

export const DELETE = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const request = ctx.request;
  const url = new URL(request.url);
  const organizationId = url.searchParams.get("organizationId");
  const provider = url.searchParams.get("provider");

  if (!organizationId || !provider) {
    return Response.json({ error: "organizationId and provider query parameters are required", code: "VALIDATION_ERROR" }, { status: 400 });
  }

  await deleteSSO(organizationId, provider);

  await logAudit({
    userId: user.id,
    action: "sso:delete",
    resource: "sso",
    organizationId,
    details: { provider },
  });

  return { success: true };
}, { requireAdmin: true });