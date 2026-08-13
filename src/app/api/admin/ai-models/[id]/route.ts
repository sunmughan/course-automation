import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import {
  getCustomAIModel,
  updateCustomAIModel,
  deleteCustomAIModel,
  logAudit,
} from "@/lib/enterprise";

const updateAIModelSchema = z.object({
  name: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  capabilities: z.array(z.string()).optional(),
  maxTokens: z.number().int().optional(),
  costPer1K: z.number().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const GET = apiHandler(async (ctx) => {
  const params = await ctx.params;
  const modelId = params.id;

  const model = await getCustomAIModel(modelId);
  if (!model) {
    return Response.json({ error: "AI model not found", code: "NOT_FOUND" }, { status: 404 });
  }

  return { model };
}, { requireAdmin: true });

export const PATCH = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const modelId = params.id;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof updateAIModelSchema>;

  const existing = await getCustomAIModel(modelId);
  if (!existing) {
    return Response.json({ error: "AI model not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const model = await updateCustomAIModel(modelId, body);

  await logAudit({
    userId: user.id,
    action: "ai-models:update",
    resource: "ai-model",
    resourceId: modelId,
    organizationId: existing.organizationId,
    details: body,
  });

  return { model };
}, { requireAdmin: true, bodySchema: updateAIModelSchema });

export const DELETE = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const modelId = params.id;

  const existing = await getCustomAIModel(modelId);
  if (!existing) {
    return Response.json({ error: "AI model not found", code: "NOT_FOUND" }, { status: 404 });
  }

  await deleteCustomAIModel(modelId);

  await logAudit({
    userId: user.id,
    action: "ai-models:delete",
    resource: "ai-model",
    resourceId: modelId,
    organizationId: existing.organizationId,
  });

  return { success: true };
}, { requireAdmin: true });
