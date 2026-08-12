import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { NotFoundError } from "@/lib/errors";

export const GET = apiHandler(async (ctx) => {
  const { id } = await ctx.params;
  const user = ctx.user;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        where: { published: true },
        orderBy: { order: "asc" },
        include: {
          topics: {
            where: { published: true },
            orderBy: { order: "asc" },
            include: {
              lessons: {
                where: { published: true },
                orderBy: { order: "asc" },
                select: { id: true, title: true, slug: true, difficultyLevel: true },
              },
              prerequisites: {
                select: {
                  prerequisite: {
                    select: { id: true, title: true, slug: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    throw new NotFoundError("Course");
  }

  const allLessonIds = course.modules.flatMap((m) =>
    m.topics.flatMap((t) => t.lessons.map((l) => l.id))
  );

  let completedLessonIds: string[] = [];
  let enrolled = false;

  if (user) {
    const progress = await prisma.studentProgress.findMany({
      where: {
        userId: user.id,
        lessonId: { in: allLessonIds },
        status: "completed",
      },
      select: { lessonId: true },
    });
    completedLessonIds = progress.map((p) => p.lessonId);
    enrolled = completedLessonIds.length > 0;
  }

  const totalLessons = allLessonIds.length;
  const completedLessons = completedLessonIds.length;
  const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const modules = course.modules.map((mod) => {
    const modLessonIds = mod.topics.flatMap((t) => t.lessons.map((l) => l.id));
    const modCompleted = modLessonIds.filter((id) => completedLessonIds.includes(id)).length;
    const modTotal = modLessonIds.length;
    const moduleProgress = modTotal > 0 ? Math.round((modCompleted / modTotal) * 100) : 0;

    return {
      id: mod.id,
      title: mod.title,
      description: mod.description,
      slug: mod.slug,
      order: mod.order,
      progress: moduleProgress,
      completedLessons: modCompleted,
      totalLessons: modTotal,
      topics: mod.topics.map((topic) => {
        const topicLessonIds = topic.lessons.map((l) => l.id);
        const topicCompleted = topicLessonIds.filter((id) =>
          completedLessonIds.includes(id)
        ).length;
        const topicTotal = topicLessonIds.length;
        const topicProgress = topicTotal > 0 ? Math.round((topicCompleted / topicTotal) * 100) : 0;

        return {
          id: topic.id,
          title: topic.title,
          description: topic.description,
          slug: topic.slug,
          difficulty: topic.difficulty,
          order: topic.order,
          progress: topicProgress,
          completedLessons: topicCompleted,
          totalLessons: topicTotal,
          lessons: topic.lessons,
          prerequisites: topic.prerequisites.map((p) => ({
            id: p.prerequisite.id,
            title: p.prerequisite.title,
            slug: p.prerequisite.slug,
          })),
        };
      }),
    };
  });

  return {
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      slug: course.slug,
      stream: course.stream,
      progress,
      totalLessons,
      completedLessons,
      isEnrolled: enrolled,
      modules,
    },
  };
});