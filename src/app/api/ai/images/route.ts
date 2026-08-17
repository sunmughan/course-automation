import { apiHandler } from "@/lib/api-handler";
import { generateAIImage, getAvailableImageModels, type ImageVisualType } from "@/lib/ai/images";
import { z } from "zod";

const imageGenerationSchema = z.object({
  prompt: z.string().min(3, "Prompt must be at least 3 characters"),
  visualType: z.enum(["diagram", "architecture", "ui-mockup", "flowchart", "concept-illustration", "code-visualization"]).optional(),
  model: z.string().optional(),
  size: z.enum(["256x256", "512x512", "1024x1024", "1792x1024", "1024x1792"]).optional(),
  quality: z.enum(["standard", "hd", "4k", "2k"]).optional(),
  style: z.enum(["realistic", "vivid", "technical-diagram", "minimalist-dark"]).optional(),
});

export const GET = apiHandler(async () => {
  const models = getAvailableImageModels();
  return {
    models,
    total: models.length,
    providers: ["Google", "OpenAI", "xAI"],
  };
});

export const POST = apiHandler(async (ctx) => {
  const body = (ctx as any).body as z.infer<typeof imageGenerationSchema>;

  const image = await generateAIImage({
    prompt: body.prompt,
    visualType: body.visualType as ImageVisualType | undefined,
    model: body.model,
    size: body.size,
    quality: body.quality,
    style: body.style,
  });

  return { image };
}, { bodySchema: imageGenerationSchema });
