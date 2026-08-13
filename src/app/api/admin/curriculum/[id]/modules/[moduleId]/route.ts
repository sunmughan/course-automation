import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import {
  getCurriculum,
  updateModule,
  removeModule,
  logAudit,
} from "@/lib/enterprise";

const updateModuleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  order: z.number().int().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const PATCH = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const curriculumId = params.id;
  const moduleId = params.moduleId;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof updateModuleSchema>;

  const curriculum = await getCurriculum(curriculumId);
  if (!curriculum) {
    return Response.json({ error: "Curriculum not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const updatedModule = await updateModule(moduleId, body);

  await logAudit({
    userId: user.id,
    action: "curriculum:update-module",
    resource: "module",
    resourceId: moduleId,
    organizationId: curriculum.organizationId,
    details: body,
  });

  return { module: updatedModule };
}, { requireAdmin: true, bodySchema: updateModuleSchema });

export const DELETE = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const curriculumId = params.id;
  const moduleId = params.moduleId;

  const curriculum = await getCurriculum(curriculumId);
  if (!curriculum) {
    return Response.json({ error: "Curriculum not found", code: "NOT_FOUND" }, { status: 404 });
  }

  await removeModule(moduleId);

  await logAudit({
    userId: user.id,
    action: "curriculum:remove-module",
    resource: "module",
    resourceId: moduleId,
    organizationId: curriculum.organizationId,
  });

  return { success: true };
}, { requireAdmin: true });
