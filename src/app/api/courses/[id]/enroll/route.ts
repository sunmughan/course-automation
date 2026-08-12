import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { courseSchemas, NotFoundError } from "@/lib/errors";

export const POST = apiHandler(async (ctx) => {
  const { id } = await ctx.params;
  const user = ctx.user!;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        where: { published: true },
        include: {
          topics: {
            where: { published: true },
            include: {
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

  if (!course) {
    throw new NotFoundError("Course");
  }

  const allLessonIds = course.modules.flatMap((m) =>
    m.topics.flatMap((t) => t.lessons.map((l) => l.id))
  );

  if (allLessonIds.length === 0) {
    return { error: "No lessons available in this course" };
  }

  const existingProgress = await prisma.studentProgress.findMany({
    where: {
      userId: user.id,
      lessonId: { in: allLessonIds },
    },
    select: { lessonId: true },
  });

  const existingIds = new Set(existingProgress.map((p) => p.lessonId));
  const newLessonIds = allLessonIds.filter((id) => !existingIds.has(id));

  if (newLessonIds.length > 0) {
    await prisma.$transaction(
      newLessonIds.map((lessonId) =>
        prisma.studentProgress.upsert({
          where: { userId_lessonId: { userId: user.id, lessonId } },
          create: { userId: user.id, lessonId, status: "not_started" },
          update: {},
        })
      )
    );
  }

  return {
    enrolled: true,
    totalLessons: allLessonIds.length,
    newlyEnrolled: newLessonIds.length,
    alreadyEnrolled: existingIds.size,
  };
}, { requireAuth: true, bodySchema: courseSchemas.enroll });