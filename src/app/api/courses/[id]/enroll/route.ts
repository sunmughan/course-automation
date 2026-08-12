import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const allLessonIds = course.modules.flatMap((m) =>
      m.topics.flatMap((t) => t.lessons.map((l) => l.id))
    );

    if (allLessonIds.length === 0) {
      return NextResponse.json({ error: "No lessons available in this course" }, { status: 400 });
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

    return NextResponse.json({
      enrolled: true,
      totalLessons: allLessonIds.length,
      newlyEnrolled: newLessonIds.length,
      alreadyEnrolled: existingIds.size,
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json(
      { error: "Failed to enroll in course" },
      { status: 500 }
    );
  }
}