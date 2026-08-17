import { apiHandler } from "@/lib/api-handler";
import { PlaygroundService } from "@/lib/projects/playground-service";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  files: z.array(z.object({
    name: z.string(),
    path: z.string(),
    content: z.string(),
    language: z.string(),
    isFolder: z.boolean().optional(),
  })).optional(),
});

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { searchParams } = new URL(ctx.request.url);
  const defaultWorkspace = searchParams.get("default") === "true";
  const projectParam = searchParams.get("project") || searchParams.get("course");

  if (projectParam) {
    const project = await PlaygroundService.getOrCreateProjectForContext(user.id, projectParam);
    return { project };
  }

  if (defaultWorkspace) {
    const project = await PlaygroundService.getOrCreateDefaultProject(user.id);
    return { project };
  }

  const projects = await PlaygroundService.listProjects(user.id);
  return { projects };
}, { requireAuth: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as z.infer<typeof createProjectSchema>;

  const project = await PlaygroundService.createProject({
    userId: user.id,
    name: body.name,
    description: body.description,
    isPublic: body.isPublic,
    files: body.files,
  });

  return { project };
}, { requireAuth: true, bodySchema: createProjectSchema });
