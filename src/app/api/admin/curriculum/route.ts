import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import {
  listCurriculums,
  createCurriculum,
  getOrganization,
  logAudit,
} from "@/lib/enterprise";

const createCurriculumSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
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

  const curriculums = await listCurriculums(organizationId);
  return { curriculums };
}, { requireAdmin: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as unknown as Record<string, unknown>).body as z.infer<typeof createCurriculumSchema>;

  const org = await getOrganization(body.organizationId);
  if (!org) {
    return Response.json({ error: "Organization not found", code: "NOT_FOUND" }, { status: 404 });
  }

  const curriculum = await createCurriculum(body);

  await logAudit({
    userId: user.id,
    action: "curriculum:create",
    resource: "curriculum",
    resourceId: curriculum.id,
    organizationId: body.organizationId,
    details: { name: body.name },
  });

  return { curriculum };
}, { requireAdmin: true, bodySchema: createCurriculumSchema });
