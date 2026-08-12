import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    const courses = await prisma.course.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
      include: {
        modules: {
          where: { published: true },
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            slug: true,
            order: true,
            _count: {
              select: {
                topics: { where: { published: true } },
              },
            },
          },
        },
        _count: {
          select: {
            modules: { where: { published: true } },
          },
        },
      },
    });

    const coursesWithStatus = await Promise.all(
      courses.map(async (course) => {
        const allTopicIds = await prisma.topic.findMany({
          where: {
            module: { courseId: course.id, published: true },
            published: true,
          },
          select: {
            id: true,
            lessons: {
              select: { id: true },
              where: { published: true },
            },
          },
        });

        const allLessonIds = allTopicIds.flatMap((t) => t.lessons.map((l) => l.id));
        const totalLessons = allLessonIds.length;

        let completedLessons = 0;
        let isEnrolled = false;

        if (user) {
          const progress = await prisma.studentProgress.findMany({
            where: {
              userId: user.id,
              lessonId: { in: allLessonIds },
              status: "completed",
            },
          });
          completedLessons = progress.length;
          isEnrolled = progress.length > 0;
        }

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
            topicCount: m._count.topics,
          })),
        };
      })
    );

    return NextResponse.json({ courses: coursesWithStatus });
  } catch (error) {
    console.error("Courses fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses" },
      { status: 500 }
    );
  }
}