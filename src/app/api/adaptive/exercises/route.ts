import { apiHandler } from "@/lib/api-handler";
import { generatePersonalizedExercises } from "@/lib/adaptive/exercise-generator";
import { prisma } from "@/lib/db";

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;

  // Look for recent exercises in the database
  const exercises = await prisma.exercise.findMany({
    where: {
      lesson: { published: true },
    },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      lesson: {
        select: {
          topic: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (exercises.length > 0) {
    return {
      exercises: exercises.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        instructions: e.instructions || e.description,
        starterCode: e.starterCode,
        solutionCode: e.solutionCode || "",
        testCases: e.testCases,
        difficulty: e.difficulty,
        focusArea: "core-practice",
        hints: e.hints ? e.hints.split(";").map(h => h.trim()) : [],
        explanation: e.description,
        topicId: e.lesson?.topic?.id || "general",
        topicName: e.lesson?.topic?.title || "Practice",
        isPersisted: true,
      })),
      total: exercises.length,
    };
  }

  // If no saved exercises exist, dynamically generate personalized exercises
  const generated = await generatePersonalizedExercises({
    userId: user.id,
    count: 3,
    language: "javascript",
    persist: false,
  });

  return {
    exercises: generated,
    total: generated.length,
  };
}, { requireAuth: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;

  let body: Record<string, unknown> = {};
  try {
    body = await ctx.request.json();
  } catch {
    body = {};
  }

  const { topicId, count, difficulty, language, focusArea, persist } = body as {
    topicId?: string;
    count?: number;
    difficulty?: number;
    language?: string;
    focusArea?: string;
    persist?: boolean;
  };

  const exercises = await generatePersonalizedExercises({
    userId: user.id,
    topicId: topicId || undefined,
    count: count || 3,
    difficulty: difficulty || undefined,
    language: language || "javascript",
    focusArea: focusArea || undefined,
    persist: persist ?? true,
  });

  return {
    exercises: exercises.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      instructions: e.instructions,
      starterCode: e.starterCode,
      solutionCode: e.solutionCode,
      testCases: e.testCases,
      difficulty: e.difficulty,
      focusArea: e.focusArea,
      hints: e.hints,
      explanation: e.explanation,
      topicId: e.topicId,
      topicName: e.topicName,
      isPersisted: e.isPersisted,
    })),
    total: exercises.length,
  };
}, { requireAuth: true });