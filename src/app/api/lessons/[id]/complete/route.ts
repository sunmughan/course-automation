import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { lessonSchemas, NotFoundError } from "@/lib/errors";

export const POST = apiHandler(async (ctx) => {
  const { id } = await ctx.params;
  const user = ctx.user!;
  const { score, timeSpent } = (ctx as any).body as {
    score?: number;
    timeSpent?: number;
  };

  const lesson = await prisma.lesson.findUnique({
    where: { id },
    select: {
      id: true,
      topic: {
        select: {
          id: true,
          module: {
            select: {
              courseId: true,
            },
          },
        },
      },
    },
  });

  if (!lesson) {
    throw new NotFoundError("Lesson");
  }

  const progress = await prisma.studentProgress.upsert({
    where: {
      userId_lessonId: { userId: user.id, lessonId: id },
    },
    create: {
      userId: user.id,
      lessonId: id,
      status: "completed",
      score: score ?? null,
      timeSpent: timeSpent ?? 0,
      completedAt: new Date(),
    },
    update: {
      status: "completed",
      score: score ?? undefined,
      timeSpent: timeSpent ? { increment: timeSpent } : undefined,
      completedAt: new Date(),
    },
  });

  const courseId = lesson.topic.module.courseId;

  const allLessonIds = (
    await prisma.lesson.findMany({
      where: {
        topic: { module: { courseId } },
        published: true,
      },
      select: { id: true },
    })
  ).map((l) => l.id);

  const completedCount = await prisma.studentProgress.count({
    where: {
      userId: user.id,
      lessonId: { in: allLessonIds },
      status: "completed",
    },
  });

  const courseProgress = allLessonIds.length > 0
    ? Math.round((completedCount / allLessonIds.length) * 100)
    : 0;

  return {
    status: "completed",
    lessonProgress: {
      score: progress.score,
      timeSpent: progress.timeSpent,
      completedAt: progress.completedAt,
    },
    courseProgress: {
      completed: completedCount,
      total: allLessonIds.length,
      percentage: courseProgress,
    },
  };
}, { requireAuth: true, bodySchema: lessonSchemas.complete });