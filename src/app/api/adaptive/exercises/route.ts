import { apiHandler } from "@/lib/api-handler";
import { generatePersonalizedExercises } from "@/lib/adaptive/exercise-generator";

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;

  const body = await ctx.request.json();
  const { topicId, count, difficulty, language } = body;

  const exercises = await generatePersonalizedExercises({
    userId: user.id,
    topicId: topicId || undefined,
    count: count || 3,
    difficulty: difficulty || undefined,
    language: language || "javascript",
  });

  return {
    exercises: exercises.map((e) => ({
      title: e.title,
      description: e.description,
      instructions: e.instructions,
      starterCode: e.starterCode,
      difficulty: e.difficulty,
      focusArea: e.focusArea,
      hints: e.hints,
      topicId: e.topicId,
      topicName: e.topicName,
    })),
    total: exercises.length,
  };
}, { requireAuth: true });