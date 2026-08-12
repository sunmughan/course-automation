import { apiHandler } from "@/lib/api-handler";
import { detectWeakTopics, assessDifficulty } from "@/lib/adaptive/weak-detection";

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;

  const { searchParams } = new URL(ctx.request.url);
  const courseId = searchParams.get("courseId") || undefined;
  const topicId = searchParams.get("topicId");
  const defaultDifficulty = parseInt(searchParams.get("defaultDifficulty") || "2", 10);

  const weakTopics = await detectWeakTopics(user.id, courseId);

  let difficultyAssessment = null;
  if (topicId) {
    difficultyAssessment = await assessDifficulty(user.id, topicId, defaultDifficulty);
  }

  return {
    weakTopics: weakTopics.map((w) => ({
      topicId: w.topicId,
      topicName: w.topicName,
      skillLevel: w.skillLevel,
      score: w.score,
      masteryPercent: w.masteryPercent,
      mistakeCount: w.mistakeCount,
      reasons: w.reasons,
      priority: w.priority,
      recommendedActions: w.recommendedActions,
    })),
    difficultyAssessment,
    summary: {
      totalWeak: weakTopics.length,
      highPriority: weakTopics.filter((w) => w.priority >= 70).length,
      mediumPriority: weakTopics.filter((w) => w.priority >= 40 && w.priority < 70).length,
      lowPriority: weakTopics.filter((w) => w.priority < 40).length,
    },
  };
}, { requireAuth: true });