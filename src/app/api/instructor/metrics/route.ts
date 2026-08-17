import { apiHandler } from "@/lib/api-handler";
import { getInstructorMetrics } from "@/lib/metrics";

export const GET = apiHandler(async (ctx) => {
  const metrics = await getInstructorMetrics(ctx.user!.id);
  return { metrics };
}, { requireInstructor: true });
