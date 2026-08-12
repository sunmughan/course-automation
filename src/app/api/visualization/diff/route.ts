import { z } from "zod";
import { apiHandler } from "@/lib/api-handler";
import { computeDiff } from "@/lib/visualization/diff-engine";

const diffSchema = z.object({
  original: z.string().min(1, "Original code is required").max(50000),
  modified: z.string().min(1, "Modified code is required").max(50000),
  title: z.string().optional(),
});

export const POST = apiHandler(async (ctx) => {
  const body = (ctx as any).body as z.infer<typeof diffSchema>;

  const diff = computeDiff(
    body.original,
    body.modified,
    body.title || "Code Changes"
  );

  return { diff };
}, { requireAuth: true, bodySchema: diffSchema });