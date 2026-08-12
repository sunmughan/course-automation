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

    const body = await request.json().catch(() => ({}));
    const { score, timeSpent } = body as { score?: number; timeSpent?: number };

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
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Lesson completion error:", error);
    return NextResponse.json(
      { error: "Failed to complete lesson" },
      { status: 500 }
    );
  }
}