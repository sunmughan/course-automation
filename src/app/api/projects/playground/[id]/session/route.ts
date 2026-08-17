import { apiHandler } from "@/lib/api-handler";
import { PlaygroundService } from "@/lib/projects/playground-service";
import { z } from "zod";

const saveSessionSchema = z.object({
  activeFileId: z.string().optional(),
  cursorPos: z.object({ line: z.number(), column: z.number() }).optional(),
  openTabs: z.array(z.string()).optional(),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const { id: projectId } = await ctx.params;
  const body = (ctx as any).body as z.infer<typeof saveSessionSchema>;

  const session = await PlaygroundService.saveSession({
    projectId,
    userId: user.id,
    activeFileId: body.activeFileId,
    cursorPos: body.cursorPos,
    openTabs: body.openTabs,
  });

  return { session };
}, { requireAuth: true, bodySchema: saveSessionSchema });
