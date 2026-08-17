import { apiHandler } from "@/lib/api-handler";
import { PlaygroundService } from "@/lib/projects/playground-service";
import { z } from "zod";

const saveFileSchema = z.object({
  path: z.string().min(1, "Path is required"),
  name: z.string().optional(),
  content: z.string(),
  language: z.string().optional(),
  isFolder: z.boolean().optional(),
});

const deleteFileSchema = z.object({
  path: z.string().min(1, "Path is required"),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { id: projectId } = await ctx.params;
  const body = (ctx as any).body as z.infer<typeof saveFileSchema>;

  const file = await PlaygroundService.saveFile({
    projectId,
    userId: user.id,
    path: body.path,
    name: body.name,
    content: body.content,
    language: body.language,
    isFolder: body.isFolder,
  });

  return { file };
}, { requireAuth: true, bodySchema: saveFileSchema });

export const DELETE = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { id: projectId } = await ctx.params;
  const body = (ctx as any).body as z.infer<typeof deleteFileSchema>;

  const result = await PlaygroundService.deleteFile(projectId, user.id, body.path);
  return result;
}, { requireAuth: true, bodySchema: deleteFileSchema });
