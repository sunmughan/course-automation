import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import {
  listCustomAIModels,
  createCustomAIModel,
  getOrganization,
  logAudit,
} from "@/lib/enterprise";

const createAIModelSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  capabilities: z.array(z.string()).optional(),
  maxTokens: z.number().int().optional(),
  costPer1K: z.number().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
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

  const models = await listCustomAIModels(organizationId);
  return { models };
}, { requireAdmin: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof createAIModelSchema>;

  const org = await getOrganization(body.organizationId);
  if (!org) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const model = await createCustomAIModel(body);

  await logAudit({
    userId: user.id,
    action: "ai-models:create",
    resource: "ai-model",
    resourceId: model.id,
    organizationId: body.organizationId,
    details: { name: body.name, provider: body.provider, model: body.model },
  });

  return { model };
}, { requireAdmin: true, bodySchema: createAIModelSchema });
