import { apiHandler } from "@/lib/api-handler";
import { AssessmentEngine } from "@/lib/assessments/engine";

export const GET = apiHandler(async (ctx) => {
  const { id } = await ctx.params;
  const analytics = await AssessmentEngine.getAssessmentAnalytics(id);
  return { analytics };
}, { requireAuth: true });
