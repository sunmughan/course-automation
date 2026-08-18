import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { courseSchemas, NotFoundError } from "@/lib/errors";

export const POST = apiHandler(async (ctx) => {
  const { id } = await ctx.params;
  const user = ctx.user!;

  const course = await prisma.course.findFirst({
    where: {
      OR: [
        { id },
        { slug: id },
      ],
    },
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

  // 1. Record enrollment in EnrolledCourse table
  await prisma.enrolledCourse.upsert({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: course.id,
      },
    },
    create: {
      userId: user.id,
      courseId: course.id,
      status: "active",
      progress: 0,
    },
    update: {
      status: "active",
    },
  });

  return {
    enrolled: true,
    courseId: course.id,
    courseTitle: course.title,
    slug: course.slug,
    totalLessons: allLessonIds.length,
  };
}, { requireAuth: true });