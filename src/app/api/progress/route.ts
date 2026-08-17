import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { NotFoundError } from "@/lib/errors";
import { synchronizeTopicSkill } from "@/lib/adaptive/skill-evaluation";

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;

  const url = new URL(ctx.request.url);
  const type = url.searchParams.get("type");
  const courseSlug = url.searchParams.get("courseSlug");

  if (type === "skills") {
    try {
      const skills = await prisma.studentSkill.findMany({
        where: { userId: user.id },
        orderBy: { score: "desc" },
      });
      return skills || [];
    } catch {
      return [];
    }
  }

  if (type === "assessments") {
    try {
      const assessments = await prisma.assessment.findMany({
        include: {
          questions: { orderBy: { order: "asc" } },
          lesson: {
            select: { title: true, topic: { select: { title: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (assessments && assessments.length > 0) {
        return assessments;
      }
    } catch {}

    const { BASELINE_ASSESSMENTS } = await import("@/lib/assessments/engine");
    return BASELINE_ASSESSMENTS || [];
  }

  try {
    const progress = await prisma.studentProgress.findMany({
      where: {
        userId: user.id,
      },
      orderBy: { updatedAt: "desc" },
    });

    const progressLessonIds = progress.map((p) => p.lessonId);

    const lessons = progressLessonIds.length > 0
      ? await prisma.lesson.findMany({
          where: { id: { in: progressLessonIds } },
          select: {
            id: true,
            title: true,
            slug: true,
            topic: {
              select: {
                id: true,
                title: true,
                slug: true,
                module: {
                  select: {
                    id: true,
                    title: true,
                    course: { select: { id: true, title: true } },
                  },
                },
              },
            },
          },
        })
      : [];

    const lessonMap = new Map(lessons.map((l) => [l.id, l]));

    let totalLessons = 120;
    try {
      const count = await prisma.lesson.count();
      if (count > 0) totalLessons = count;
    } catch {}

    const completedCount = progress.filter((p) => p.status === "completed").length;
    const inProgressCount = progress.filter((p) => p.status === "in_progress").length;
    const totalTimeSpent = progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    const records = progress.map((p) => {
      const lesson = lessonMap.get(p.lessonId);
      return {
        id: p.id,
        lessonId: p.lessonId,
        lessonTitle: lesson?.title || "Lesson",
        topicTitle: lesson?.topic?.title || "Topic",
        moduleTitle: lesson?.topic?.module?.title || "Module",
        courseTitle: lesson?.topic?.module?.course?.title || "Course",
        status: p.status,
        score: p.score,
        timeSpent: p.timeSpent,
        completedAt: p.completedAt?.toISOString() || null,
      };
    });

    return {
      records,
      stats: {
        total: totalLessons,
        completed: completedCount,
        inProgress: inProgressCount,
        completionPercentage: totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0,
        totalTimeSpent,
      },
    };
  } catch (error) {
    console.error("Failed to load progress:", error);
    return {
      records: [],
      stats: {
        total: 120,
        completed: 0,
        inProgress: 0,
        completionPercentage: 0,
        totalTimeSpent: 0,
      },
    };
  }
}, { requireAuth: true });

export const POST = apiHandler(async (ctx) => {
  const user = ctx.user!;

  const body = await ctx.request.json();

  if (body.type === "assessment" && body.assessmentId && body.answers) {
    const { AssessmentEngine } = await import("@/lib/assessments/engine");
    const result = await AssessmentEngine.evaluateAssessment({
      assessmentId: body.assessmentId,
      userId: user.id,
      answers: body.answers,
      timeSpent: body.timeSpent,
      language: body.language || "javascript",
    });

    return {
      score: result.score,
      totalPoints: result.totalPoints,
      percentage: result.percentage,
      passed: result.passed,
      feedback: result.feedback,
      results: result.results,
      attempts: result.attempts,
    };
  }

  const { lessonId, status, score: lessonScore, timeSpent } = body;

  if (!lessonId) {
    return { error: "lessonId is required" };
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      topic: {
        select: { id: true, title: true, module: { select: { courseId: true } } },
      },
    },
  });

  if (!lesson) {
    throw new NotFoundError("Lesson");
  }

  const existing = await prisma.studentProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  });

  const progress = await prisma.studentProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: {
      userId: user.id,
      lessonId,
      status: status || "in_progress",
      score: lessonScore ?? null,
      timeSpent: timeSpent ?? 0,
      completedAt: status === "completed" ? new Date() : null,
    },
    update: {
      status: status || existing?.status || "in_progress",
      score: lessonScore ?? existing?.score ?? null,
      timeSpent: timeSpent ?? existing?.timeSpent ?? 0,
      completedAt: status === "completed" ? existing?.completedAt || new Date() : existing?.completedAt || null,
    },
  });

  if (progress.status === "completed") {
    await synchronizeTopicSkill(user.id, lesson.topic.id);
  }

  return {
    progress: {
      id: progress.id,
      lessonId: progress.lessonId,
      status: progress.status,
      score: progress.score,
      timeSpent: progress.timeSpent,
      completedAt: progress.completedAt?.toISOString() || null,
    },
  };
}, { requireAuth: true });