import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { generateDiagram } from "@/lib/visualization/mermaid-generator";
import { prisma } from "@/lib/db";

const diagramSchema = z.object({
  code: z.string().min(1, "Code is required").max(10000),
  type: z.enum(["flowchart", "sequence", "class", "state", "er"]),
  title: z.string().optional(),
  context: z.string().optional(),
  lessonId: z.string().optional(),
});

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;
  const body = (ctx as any).body as z.infer<typeof diagramSchema>;

  const diagram = generateDiagram({
    code: body.code,
    type: body.type,
    title: body.title,
    context: body.context,
  });

  if (body.lessonId) {
    await prisma.visualization.create({
      data: {
        type: diagram.type,
        title: diagram.caption || body.title || "Diagram",
        config: JSON.stringify(diagram),
        lessonId: body.lessonId,
      },
    });
  }

  return { diagram };
}, { requireAuth: true, bodySchema: diagramSchema });