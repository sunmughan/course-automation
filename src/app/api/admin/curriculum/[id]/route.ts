import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import {
  getCurriculum,
  updateCurriculum,
  deleteCurriculum,
  listModules,
  logAudit,
} from "@/lib/enterprise";

const updateCurriculumSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const GET = apiHandler(async (ctx) => {
  const params = await ctx.params;
  const curriculumId = params.id;

  const curriculum = await getCurriculum(curriculumId);
  if (!curriculum) {
    return Response.json({ error: "Curriculum not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const modules = await listModules(curriculumId);

  return { curriculum, modules };
}, { requireAdmin: true });

export const PATCH = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const curriculumId = params.id;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof updateCurriculumSchema>;

  const existing = await getCurriculum(curriculumId);
  if (!existing) {
    return Response.json({ error: "Curriculum not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const curriculum = await updateCurriculum(curriculumId, body);

  await logAudit({
    userId: user.id,
    action: "curriculum:update",
    resource: "curriculum",
    resourceId: curriculumId,
    organizationId: existing.organizationId,
    details: body,
  });

  return { curriculum };
}, { requireAdmin: true, bodySchema: updateCurriculumSchema });

export const DELETE = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const curriculumId = params.id;

  const existing = await getCurriculum(curriculumId);
  if (!existing) {
    return Response.json({ error: "Curriculum not found", code: "NOT_FOUND" }, { status: 404 });
  }

  await deleteCurriculum(curriculumId);

  await logAudit({
    userId: user.id,
    action: "curriculum:delete",
    resource: "curriculum",
    resourceId: curriculumId,
    organizationId: existing.organizationId,
  });

  return { success: true };
}, { requireAdmin: true });
