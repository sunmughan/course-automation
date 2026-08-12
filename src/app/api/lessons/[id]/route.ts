import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        topic: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            module: {
              select: {
                id: true,
                title: true,
                course: {
                  select: { id: true, title: true, slug: true },
                },
              },
            },
            prerequisites: {
              select: {
                prerequisite: {
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
        concepts: { orderBy: { order: "asc" } },
        examples: { orderBy: { order: "asc" } },
        exercises: { orderBy: { order: "asc" } },
        visualizations: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const typedLesson = lesson as unknown as {
      id: string; title: string; slug: string; content: string; explanation: string;
      order: number; difficultyLevel: number;
      topic: {
        id: string; title: string; slug: string; difficulty: number;
        module: { id: string; title: string; course: { id: string; title: string; slug: string } };
        prerequisites: { prerequisite: { id: string; title: string } }[];
      };
      concepts: { id: string; title: string; description: string }[];
      examples: { id: string; title: string; description: string; starterCode: string; solutionCode: string }[];
      exercises: { id: string; title: string; description: string; starterCode: string; testCases: string }[];
      visualizations: { id: string; type: string; title: string; config: string }[];
    };

    const courseId = typedLesson.topic.module.course.id;

    let progress = null;
    let nextLessonId: string | null = null;
    let prevLessonId: string | null = null;

    if (user) {
      progress = await prisma.studentProgress.findUnique({
        where: {
          userId_lessonId: { userId: user.id, lessonId: id },
        },
      });

      if (!progress) {
        await prisma.studentProgress.create({
          data: {
            userId: user.id,
            lessonId: id,
            status: "in_progress",
          },
        });
        progress = await prisma.studentProgress.findUnique({
          where: {
            userId_lessonId: { userId: user.id, lessonId: id },
          },
        });
      } else if (progress.status === "not_started") {
        await prisma.studentProgress.update({
          where: { id: progress.id },
          data: { status: "in_progress" },
        });
        progress = { ...progress, status: "in_progress" };
      }
    }

    const allLessons = await prisma.lesson.findMany({
      where: {
        topic: { module: { courseId } },
        published: true,
      },
      orderBy: [
        { topic: { module: { order: "asc" } } },
        { topic: { order: "asc" } },
        { order: "asc" },
      ],
      select: { id: true, title: true },
    });

    const currentIndex = allLessons.findIndex((l) => l.id === id);
    prevLessonId = currentIndex > 0 ? allLessons[currentIndex - 1].id : null;
    nextLessonId = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].id : null;

    const prerequisites = typedLesson.topic.prerequisites.map((p) => ({
      id: p.prerequisite.id,
      title: p.prerequisite.title,
      completed: false,
    }));

    if (user && prerequisites.length > 0) {
      const prereqTopicIds = prerequisites.map((p) => p.id);
      const prereqLessons = await prisma.lesson.findMany({
        where: {
          topicId: { in: prereqTopicIds },
          published: true,
        },
        select: { id: true, topicId: true },
      });

      const prereqLessonIds = prereqLessons.map((l) => l.id);
      const completed = await prisma.studentProgress.findMany({
        where: {
          userId: user.id,
          lessonId: { in: prereqLessonIds },
          status: "completed",
        },
        select: { lessonId: true },
      });

      const completedLessonIds = new Set(completed.map((c) => c.lessonId));

      for (const prereq of prerequisites) {
        const topicLessons = prereqLessons.filter((l) => l.topicId === prereq.id);
        const topicCompleted = topicLessons.every((l) => completedLessonIds.has(l.id));
        prereq.completed = topicCompleted;
      }
    }

    return NextResponse.json({
      lesson: {
        id: typedLesson.id,
        title: typedLesson.title,
        slug: typedLesson.slug,
        content: typedLesson.content,
        explanation: typedLesson.explanation,
        order: typedLesson.order,
        difficultyLevel: typedLesson.difficultyLevel,
        topic: {
          id: typedLesson.topic.id,
          title: typedLesson.topic.title,
          difficulty: typedLesson.topic.difficulty,
        },
        course: {
          id: typedLesson.topic.module.course.id,
          title: typedLesson.topic.module.course.title,
          slug: typedLesson.topic.module.course.slug,
        },
        module: {
          id: typedLesson.topic.module.id,
          title: typedLesson.topic.module.title,
        },
        concepts: typedLesson.concepts,
        examples: typedLesson.examples,
        exercises: typedLesson.exercises,
        visualizations: typedLesson.visualizations,
        prerequisites,
      },
      navigation: {
        prevLessonId,
        nextLessonId,
        currentIndex,
        totalLessons: allLessons.length,
      },
      progress: progress
        ? {
            status: progress.status,
            score: progress.score,
            timeSpent: progress.timeSpent,
          }
        : null,
    });
  } catch (error) {
    console.error("Lesson fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    );
  }
}