import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getTopicUnlockStatus } from "@/lib/curriculum/graph";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    const { searchParams } = new URL(request.url);
    const courseSlug = searchParams.get("courseSlug");

    if (!courseSlug) {
      return NextResponse.json(
        { error: "courseSlug query parameter is required" },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { slug: courseSlug },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      );
    }

    const modules = await prisma.module.findMany({
      where: { courseId: course.id, published: true },
      orderBy: { order: "asc" },
      include: {
        topics: {
          where: { published: true },
          orderBy: { order: "asc" },
          include: {
            lessons: {
              where: { published: true },
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                slug: true,
                order: true,
                difficultyLevel: true,
                content: true,
                explanation: true,
                examples: {
                  orderBy: { order: "asc" },
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    starterCode: true,
                    solutionCode: true,
                  },
                },
                exercises: {
                  orderBy: { order: "asc" },
                  select: {
                    id: true,
                    title: true,
                    description: true,
                    instructions: true,
                    starterCode: true,
                    hints: true,
                    difficulty: true,
                  },
                },
              },
            },
            prerequisites: {
              include: {
                prerequisite: {
                  select: { id: true, title: true, slug: true },
                },
              },
            },
          },
        },
      },
    });

    let unlockStatus: Map<string, { unlocked: boolean; completed: boolean }> | null = null;
    let lessonProgress: Map<string, string> = new Map();

    if (user) {
      unlockStatus = await getTopicUnlockStatus(user.id, course.id);

      const allLessonIds = modules.flatMap((m) =>
        m.topics.flatMap((t) => t.lessons.map((l) => l.id))
      );

      const progressRecords = await prisma.studentProgress.findMany({
        where: {
          userId: user.id,
          lessonId: { in: allLessonIds },
        },
        select: {
          lessonId: true,
          status: true,
        },
      });

      for (const record of progressRecords) {
        lessonProgress.set(record.lessonId, record.status);
      }
    }

    const curriculumTree = modules.map((module) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      slug: module.slug,
      order: module.order,
      topics: module.topics.map((topic) => {
        const topicStatus = unlockStatus?.get(topic.id) || { unlocked: topic.prerequisites.length === 0, completed: false };

        return {
          id: topic.id,
          title: topic.title,
          slug: topic.slug,
          description: topic.description,
          difficulty: topic.difficulty,
          order: topic.order,
          status: topicStatus.completed
            ? "completed"
            : topicStatus.unlocked
            ? "unlocked"
            : "locked",
          prerequisites: topic.prerequisites.map((p) => ({
            id: p.prerequisite.id,
            title: p.prerequisite.title,
            slug: p.prerequisite.slug,
          })),
          lessons: topic.lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            slug: lesson.slug,
            order: lesson.order,
            difficultyLevel: lesson.difficultyLevel,
            content: lesson.content,
            explanation: lesson.explanation,
            examples: lesson.examples,
            exercises: lesson.exercises,
            progress: lessonProgress.get(lesson.id) || null,
          })),
        };
      }),
    }));

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        slug: course.slug,
      },
      modules: curriculumTree,
    });
  } catch (error) {
    console.error("Curriculum fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch curriculum" },
      { status: 500 }
    );
  }
}