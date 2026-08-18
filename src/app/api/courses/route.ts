import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user;

  // Single optimized query to get courses with full structure
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    include: {
      modules: {
        where: { published: true },
        orderBy: { order: "asc" },
        include: {
          topics: {
            where: { published: true },
            select: {
              id: true,
              lessons: {
                where: { published: true },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  // Single fast query for user's progress records
  const userProgress = user
    ? await prisma.studentProgress.findMany({
        where: { userId: user.id },
        select: { lessonId: true, status: true },
      })
    : [];

  const completedLessonIdSet = new Set(
    userProgress.filter((p) => p.status === "completed").map((p) => p.lessonId)
  );
  const enrolledLessonIdSet = new Set(
    userProgress.map((p) => p.lessonId)
  );

  const coursesWithStatus = courses.map((course) => {
    const allLessonIds = course.modules.flatMap((m) =>
      m.topics.flatMap((t) => t.lessons.map((l) => l.id))
    );
    const totalLessons = allLessonIds.length;
    const completedLessons = allLessonIds.filter((id) => completedLessonIdSet.has(id)).length;
    const isEnrolled = allLessonIds.some((id) => enrolledLessonIdSet.has(id));

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      slug: course.slug,
      stream: course.stream,
      published: course.published,
      totalLessons,
      completedLessons,
      progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      isEnrolled,
      modules: course.modules.map((m) => ({
        id: m.id,
        title: m.title,
        slug: m.slug,
        order: m.order,
        topicCount: m.topics.length,
      })),
    };
  });

  return { courses: coursesWithStatus };
});