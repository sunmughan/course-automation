import { apiHandler } from "@/lib/api-handler";
import { PlaygroundService } from "@/lib/projects/playground-service";

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { id } = await ctx.params;

  const project = await PlaygroundService.getProject(id, user.id);
  if (!project) {
    return Response.json({ error: "Project not found", code: "NOT_FOUND" }, { status: 404 });
  }

  return { project };
}, { requireAuth: true });

export const DELETE = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { id } = await ctx.params;

  await PlaygroundService.deleteProject(id, user.id);
  return { success: true };
}, { requireAuth: true });
