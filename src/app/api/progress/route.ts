import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { NotFoundError } from "@/lib/errors";
import { synchronizeTopicSkill } from "@/lib/adaptive/skill-evaluation";

export const GET = apiHandler(async (ctx) => {
  const user = ctx.user!;

  const { searchParams } = new URL(ctx.request.url);
  const type = searchParams.get("type");
  const courseSlug = searchParams.get("courseSlug");

  if (type === "skills") {
    const skills = await prisma.studentSkill.findMany({
      where: { userId: user.id },
      orderBy: { score: "desc" },
    });
    return skills;
  }

  if (type === "assessments") {
    const assessments = await prisma.assessment.findMany({
      where: {
        lesson: { published: true },
      },
      include: {
        questions: { orderBy: { order: "asc" } },
        lesson: {
          select: { title: true, topic: { select: { title: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (assessments.length > 0) {
      return assessments;
    }

    const { BASELINE_ASSESSMENTS } = await import("@/lib/assessments/engine");
    return BASELINE_ASSESSMENTS;
  }

  let courseId: string | null = null;
  if (courseSlug) {
    const course = await prisma.course.findUnique({
      where: { slug: courseSlug },
      select: { id: true },
    });
    if (!course) {
      throw new NotFoundError("Course");
    }
    courseId = course.id;
  }

  const lessonWhere: Record<string, unknown> = { published: true };
  if (courseId) {
    lessonWhere.topic = { module: { courseId } };
  }

  const lessonIds = (await prisma.lesson.findMany({
    where: lessonWhere,
    select: { id: true },
  })).map((lesson) => lesson.id);
  const progress = await prisma.studentProgress.findMany({
    where: {
      userId: user.id,
      lessonId: { in: lessonIds },
    },
    orderBy: { updatedAt: "desc" },
  });

  const progressLessonIds = progress.map((p) => p.lessonId);

  const lessons = await prisma.lesson.findMany({
    where: { id: { in: progressLessonIds }, published: true },
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
  });

  const lessonMap = new Map(lessons.map((l) => [l.id, l]));

  const totalLessons = await prisma.lesson.count({ where: lessonWhere });
  const completedCount = progress.filter((p) => p.status === "completed").length;
  const inProgressCount = progress.filter((p) => p.status === "in_progress").length;
  const totalTimeSpent = progress.reduce((sum, p) => sum + p.timeSpent, 0);

  const records = progress.map((p) => {
    const lesson = lessonMap.get(p.lessonId);
    return {
      id: p.id,
      lessonId: p.lessonId,
      lessonTitle: lesson?.title || "Unknown",
      topicTitle: lesson?.topic?.title || "Unknown",
      moduleTitle: lesson?.topic?.module?.title || "Unknown",
      courseTitle: lesson?.topic?.module?.course?.title || "Unknown",
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