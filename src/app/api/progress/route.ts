import { prisma } from "@/lib/db";
import { apiHandler } from "@/lib/api-handler";
import { NotFoundError } from "@/lib/errors";

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
    return assessments;
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

  const progress = await prisma.studentProgress.findMany({
    where: {
      userId: user.id,
      lessonId: {
        in: (await prisma.lesson.findMany({ where: lessonWhere as any, select: { id: true } })).map((l) => l.id),
      },
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

  const totalLessons = await prisma.lesson.count({ where: lessonWhere as any });
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
    const assessment = await prisma.assessment.findUnique({
      where: { id: body.assessmentId },
      include: { questions: true },
    });

    if (!assessment) {
      throw new NotFoundError("Assessment");
    }

    let score = 0;
    let totalPoints = 0;
    const answerResults: Array<{ questionId: string; correct: boolean; points: number }> = [];

    for (const q of assessment.questions) {
      totalPoints += q.points;
      const userAnswer = body.answers[q.id] || "";
      const correct = userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      if (correct) score += q.points;
      answerResults.push({ questionId: q.id, correct, points: q.points });
    }

    const percentage = Math.round((score / totalPoints) * 100);
    const passed = percentage >= assessment.passingScore;

    await prisma.assessmentScore.upsert({
      where: {
        userId_assessmentId: {
          userId: user.id,
          assessmentId: assessment.id,
        },
      },
      create: {
        userId: user.id,
        assessmentId: assessment.id,
        score,
        totalPoints,
        answers: JSON.stringify(answerResults),
        timeSpent: body.timeSpent || null,
      },
      update: {
        score,
        totalPoints,
        answers: JSON.stringify(answerResults),
        timeSpent: body.timeSpent || null,
        completedAt: new Date(),
      },
    });

    const feedback = passed
      ? "Excellent work! You've demonstrated strong understanding of this topic. Keep up the great progress!"
      : "Good effort! Review the concepts you missed and try again. Practice makes perfect!";

    return { score, totalPoints, passed, feedback };
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

  if (status === "completed") {
    const topicSkill = await prisma.studentSkill.findUnique({
      where: { userId_topicId: { userId: user.id, topicId: lesson.topic.id } },
    });

    const newScore = (topicSkill?.score || 0) + 10;
    let newStatus = "beginner";
    if (newScore >= 90) newStatus = "mastered";
    else if (newScore >= 75) newStatus = "strong";
    else if (newScore >= 60) newStatus = "competent";
    else if (newScore >= 40) newStatus = "developing";

    if (topicSkill) {
      await prisma.studentSkill.update({
        where: { userId_topicId: { userId: user.id, topicId: lesson.topic.id } },
        data: {
          score: newScore,
          status: newStatus,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
    } else {
      await prisma.studentSkill.create({
        data: {
          userId: user.id,
          topicId: lesson.topic.id,
          skillName: lesson.topic.title,
          score: 10,
          status: "beginner",
          attempts: 1,
          lastAttemptAt: new Date(),
        },
      });
    }
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
      timeSpent: existing ? existing.timeSpent + (timeSpent ?? 0) : timeSpent ?? 0,
      completedAt: status === "completed" ? existing?.completedAt || new Date() : existing?.completedAt || null,
    },
  });

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