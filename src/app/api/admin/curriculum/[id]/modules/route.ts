import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import {
  getCurriculum,
  listModules,
  addModule,
  logAudit,
} from "@/lib/enterprise";

const addModuleSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  order: z.number().int().optional(),
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
  return { modules };
}, { requireAdmin: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const params = await ctx.params;
  const curriculumId = params.id;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof addModuleSchema>;

  const curriculum = await getCurriculum(curriculumId);
  if (!curriculum) {
    return Response.json({ error: "Curriculum not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const newModule = await addModule({
    curriculumId,
    title: body.title,
    description: body.description,
    order: body.order,
    settings: body.settings,
  });

  await logAudit({
    userId: user.id,
    action: "curriculum:add-module",
    resource: "module",
    resourceId: newModule.id,
    organizationId: curriculum.organizationId,
    details: { title: body.title, curriculumId },
  });

  return { module: newModule };
}, { requireAdmin: true, bodySchema: addModuleSchema });
