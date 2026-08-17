import { prisma } from "@/lib/db";
import { detectWeakTopics } from "@/lib/adaptive/weak-detection";

export interface BatchAnalytics {
  batchId: string;
  batchName: string;
  totalStudents: number;
  activeStudents: number;
  overallCompletion: number;
  averageScore: number;
  totalCodingTimeMinutes: number;
  totalCodeExecutions: number;
  totalAiQuestions: number;
  skillDistribution: { level: string; count: number }[];
  topPerformers: { studentId: string; studentName: string; avgScore: number; completionRate: number }[];
  needsAttention: { studentId: string; studentName: string; avgScore: number; riskLevel: string; reason: string }[];
  topicPerformance: {
    topicId: string;
    topicName: string;
    avgScore: number;
    completionRate: number;
    failureRate: number;
    mistakeCount: number;
    isDifficult: boolean;
  }[];
  commonErrors: {
    error: string;
    count: number;
    affectedStudents: number;
    sampleCode?: string;
    topicId?: string;
  }[];
  difficultTopics: {
    topicId: string;
    topicName: string;
    failureRate: number;
    avgScore: number;
    mistakeCount: number;
  }[];
  completionTrend: { date: string; completions: number }[];
}

export interface AtRiskStudent {
  studentId: string;
  studentName: string;
  email: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: string[];
  lastActive: string | null;
  completionRate: number;
  averageScore: number;
  weakTopics: string[];
  mistakeCount: number;
  recommendedActions: string[];
}

export interface StudentDrillDownEvidence {
  student: {
    id: string;
    name: string;
    email: string;
  };
  overview: {
    completionRate: number;
    averageScore: number;
    totalTimeSpentMinutes: number;
    totalExecutions: number;
    totalAiQuestions: number;
    riskScore: number;
    riskLevel: string;
  };
  skills: Array<{
    topicId: string;
    topicName: string;
    score: number;
    status: string;
    attempts: number;
    lastAttemptAt: string | null;
  }>;
  recentMistakes: Array<{
    id: string;
    topicId: string;
    error: string;
    code: string;
    fix: string | null;
    count: number;
    createdAt: string;
  }>;
  assessments: Array<{
    assessmentId: string;
    title: string;
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    completedAt: string;
  }>;
  recentProgress: Array<{
    lessonId: string;
    status: string;
    score: number | null;
    timeSpent: number;
    completedAt: string | null;
  }>;
}

export interface TopicDrillDownEvidence {
  topic: {
    id: string;
    title: string;
    description: string;
  };
  stats: {
    totalStudents: number;
    completedCount: number;
    completionRate: number;
    averageScore: number;
    failureRate: number;
    totalMistakes: number;
  };
  strugglingStudents: Array<{
    studentId: string;
    studentName: string;
    score: number;
    status: string;
    mistakeCount: number;
  }>;
  topErrors: Array<{
    error: string;
    count: number;
    sampleCode: string;
  }>;
}

export interface AIIntervention {
  studentId: string;
  studentName: string;
  type: string;
  title: string;
  description: string;
  suggestedActions: string[];
  priority: "low" | "medium" | "high" | "urgent";
}

export interface TeachingReport {
  batchId: string;
  batchName: string;
  generatedAt: string;
  period: { start: string; end: string };
  overview: {
    totalStudents: number;
    activeStudents: number;
    overallCompletion: number;
    overallScore: number;
    atRiskCount: number;
    interventionsActive: number;
  };
  progress: {
    completed: number;
    inProgress: number;
    notStarted: number;
    pace: string;
    comparison: string;
  };
  skills: {
    strongest: string[];
    weakest: string[];
    improving: string[];
    declining: string[];
  };
  recommendations: {
    forBatch: string[];
    forIndividual: { studentId: string; studentName: string; recommendation: string }[];
  };
  nextSteps: string[];
}

export function computeSkillLevel(score: number): string {
  if (score >= 90) return "mastered";
  if (score >= 75) return "strong";
  if (score >= 60) return "competent";
  if (score >= 40) return "developing";
  return "beginner";
}

/**
 * Calculates comprehensive real-data analytics for an instructor's batch.
 */
export async function getBatchAnalytics(
  batchId: string,
  instructorId: string
): Promise<BatchAnalytics> {
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, instructorId },
    include: {
      students: {
        include: {
          student: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!batch) throw new Error("Batch not found or unauthorized");

  const studentIds = batch.students.map((s) => s.studentId);
  const totalStudents = studentIds.length;

  if (totalStudents === 0) {
    return {
      batchId: batch.id,
      batchName: batch.name,
      totalStudents: 0,
      activeStudents: 0,
      overallCompletion: 0,
      averageScore: 0,
      totalCodingTimeMinutes: 0,
      totalCodeExecutions: 0,
      totalAiQuestions: 0,
      skillDistribution: [],
      topPerformers: [],
      needsAttention: [],
      topicPerformance: [],
      commonErrors: [],
      difficultTopics: [],
      completionTrend: [],
    };
  }

  // Fetch real data across all student signals
  const [progress, skills, mistakes, assessments, aiSessions, executionEvents] = await Promise.all([
    prisma.studentProgress.findMany({
      where: { userId: { in: studentIds } },
      select: { userId: true, lessonId: true, status: true, score: true, timeSpent: true, completedAt: true },
    }),
    prisma.studentSkill.findMany({
      where: { userId: { in: studentIds } },
      include: { topic: { select: { id: true, title: true, difficulty: true } } },
    }),
    prisma.studentMistake.findMany({
      where: { userId: { in: studentIds } },
      select: { id: true, userId: true, topicId: true, error: true, code: true, count: true },
    }),
    prisma.assessmentScore.findMany({
      where: { userId: { in: studentIds } },
      select: { userId: true, score: true, totalPoints: true, passed: true, timeSpent: true },
    }),
    prisma.aISession.count({
      where: { userId: { in: studentIds } },
    }),
    prisma.analyticsEvent.count({
      where: { userId: { in: studentIds }, event: "code_execution" },
    }),
  ]);

  // Aggregate student-level progress and scores
  const studentProgressMap = new Map<string, typeof progress>();
  for (const p of progress) {
    if (!studentProgressMap.has(p.userId)) studentProgressMap.set(p.userId, []);
    studentProgressMap.get(p.userId)!.push(p);
  }

  const studentPerformance: Array<{
    id: string;
    name: string;
    avgScore: number;
    completionRate: number;
    timeSpent: number;
  }> = [];

  for (const s of batch.students) {
    const studentRecords = studentProgressMap.get(s.studentId) || [];
    const completedCount = studentRecords.filter((r) => r.status === "completed").length;
    const completionRate = studentRecords.length > 0 ? Math.round((completedCount / studentRecords.length) * 100) : 0;
    const scores = studentRecords.filter((r) => r.score !== null).map((r) => r.score!);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const timeSpent = studentRecords.reduce((sum, r) => sum + (r.timeSpent || 0), 0);

    studentPerformance.push({
      id: s.studentId,
      name: s.student.name || "Unknown Student",
      avgScore,
      completionRate,
      timeSpent,
    });
  }

  // Top performers & needs attention
  const sortedByScore = [...studentPerformance].sort((a, b) => b.avgScore - a.avgScore);
  const topPerformers = sortedByScore.slice(0, 5).map((s) => ({
    studentId: s.id,
    studentName: s.name,
    avgScore: s.avgScore,
    completionRate: s.completionRate,
  }));

  const needsAttention = sortedByScore
    .filter((s) => s.avgScore < 60 || s.completionRate < 40)
    .slice(0, 5)
    .map((s) => ({
      studentId: s.id,
      studentName: s.name,
      avgScore: s.avgScore,
      riskLevel: s.avgScore < 40 || s.completionRate < 25 ? "high" : "medium",
      reason: s.avgScore < 40 ? "Low conceptual mastery" : "Falling behind on completion",
    }));

  // Overall batch statistics
  const completedLessons = progress.filter((p) => p.status === "completed").length;
  const overallCompletion = progress.length > 0 ? Math.round((completedLessons / progress.length) * 100) : 0;
  const scoredProgress = progress.filter((p) => p.score !== null);
  const averageScore = scoredProgress.length > 0
    ? Math.round(scoredProgress.reduce((sum, p) => sum + p.score!, 0) / scoredProgress.length)
    : 0;

  const totalCodingTimeMinutes = Math.round(progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0) / 60);

  // Skill distribution
  const levelCounts: Record<string, number> = {
    beginner: 0,
    developing: 0,
    competent: 0,
    strong: 0,
    mastered: 0,
  };
  for (const s of skills) {
    const lvl = computeSkillLevel(s.score);
    levelCounts[lvl] = (levelCounts[lvl] || 0) + 1;
  }
  const skillDistribution = Object.entries(levelCounts).map(([level, count]) => ({ level, count }));

  // Common errors aggregation
  const errorMap = new Map<string, { count: number; studentSet: Set<string>; sampleCode?: string; topicId?: string }>();
  for (const m of mistakes) {
    const cleanError = m.error.trim().split("\n")[0].slice(0, 120);
    const existing = errorMap.get(cleanError) || { count: 0, studentSet: new Set<string>(), sampleCode: m.code, topicId: m.topicId };
    existing.count += m.count;
    existing.studentSet.add(m.userId);
    if (!existing.sampleCode && m.code) existing.sampleCode = m.code;
    errorMap.set(cleanError, existing);
  }

  const commonErrors = Array.from(errorMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 8)
    .map(([error, data]) => ({
      error,
      count: data.count,
      affectedStudents: data.studentSet.size,
      sampleCode: data.sampleCode?.slice(0, 200),
      topicId: data.topicId,
    }));

  // Topic performance and failure rates
  const topicMap = new Map<string, { scores: number[]; completed: number; total: number; mistakes: number; title: string }>();
  for (const s of skills) {
    const existing = topicMap.get(s.topicId) || { scores: [], completed: 0, total: 0, mistakes: 0, title: s.topic.title };
    existing.scores.push(s.score);
    if (s.score >= 60) existing.completed++;
    existing.total++;
    topicMap.set(s.topicId, existing);
  }

  for (const m of mistakes) {
    if (topicMap.has(m.topicId)) {
      topicMap.get(m.topicId)!.mistakes += m.count;
    }
  }

  const topicPerformance = Array.from(topicMap.entries()).map(([topicId, data]) => {
    const avg = data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0;
    const compRate = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
    const failRate = Math.max(0, 100 - compRate);
    const isDiff = avg < 55 || failRate > 40 || data.mistakes >= 5;

    return {
      topicId,
      topicName: data.title,
      avgScore: avg,
      completionRate: compRate,
      failureRate: failRate,
      mistakeCount: data.mistakes,
      isDifficult: isDiff,
    };
  });

  const difficultTopics = topicPerformance
    .filter((t) => t.isDifficult)
    .sort((a, b) => b.failureRate - a.failureRate)
    .slice(0, 5)
    .map((t) => ({
      topicId: t.topicId,
      topicName: t.topicName,
      failureRate: t.failureRate,
      avgScore: t.avgScore,
      mistakeCount: t.mistakeCount,
    }));

  // Completion trend over time
  const completionsByDate = new Map<string, number>();
  for (const p of progress) {
    if (p.completedAt) {
      const dateStr = p.completedAt.toISOString().split("T")[0];
      completionsByDate.set(dateStr, (completionsByDate.get(dateStr) || 0) + 1);
    }
  }
  const completionTrend = Array.from(completionsByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, completions: count }));

  const activeStudents = batch.students.filter((s) => s.status === "active").length;

  return {
    batchId: batch.id,
    batchName: batch.name,
    totalStudents,
    activeStudents,
    overallCompletion,
    averageScore,
    totalCodingTimeMinutes,
    totalCodeExecutions: executionEvents,
    totalAiQuestions: aiSessions,
    skillDistribution,
    topPerformers,
    needsAttention,
    topicPerformance,
    commonErrors,
    difficultTopics,
    completionTrend,
  };
}

/**
 * Identifies at-risk students using multi-factor real evidence analysis.
 */
export async function detectAtRiskStudents(
  batchId: string,
  instructorId: string
): Promise<AtRiskStudent[]> {
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, instructorId },
    include: {
      students: {
        include: {
          student: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!batch) throw new Error("Batch not found or unauthorized");

  const results: AtRiskStudent[] = [];

  for (const member of batch.students) {
    const studentId = member.studentId;

    const [progress, skills, weakTopics, lastSession, mistakes, assessments] = await Promise.all([
      prisma.studentProgress.findMany({
        where: { userId: studentId },
        select: { status: true, score: true, completedAt: true },
      }),
      prisma.studentSkill.findMany({
        where: { userId: studentId },
        select: { score: true, status: true },
      }),
      detectWeakTopics(studentId),
      prisma.aISession.findFirst({
        where: { userId: studentId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.studentMistake.findMany({
        where: { userId: studentId },
        select: { count: true },
      }),
      prisma.assessmentScore.findMany({
        where: { userId: studentId },
        select: { score: true, totalPoints: true, passed: true },
      }),
    ]);

    const completedCount = progress.filter((p) => p.status === "completed").length;
    const totalProgressCount = progress.length;
    const completionRate = totalProgressCount > 0 ? (completedCount / totalProgressCount) * 100 : 0;

    const scores = progress.filter((p) => p.score !== null).map((p) => p.score!);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const totalMistakes = mistakes.reduce((sum, m) => sum + m.count, 0);

    const factors: string[] = [];
    let riskScore = 0;

    if (completionRate < 25) {
      riskScore += 30;
      factors.push("Very low lesson completion rate (<25%)");
    } else if (completionRate < 50) {
      riskScore += 15;
      factors.push("Lagging behind course completion pace (<50%)");
    }

    if (avgScore < 35) {
      riskScore += 30;
      factors.push("Critically low average score (<35%)");
    } else if (avgScore < 55) {
      riskScore += 15;
      factors.push("Below passing mastery average (<55%)");
    }

    if (totalMistakes >= 5) {
      riskScore += 15;
      factors.push(`High error density (${totalMistakes} recorded code errors)`);
    }

    const failedAssessments = assessments.filter((a) => !a.passed && (a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 < 60 : true)).length;
    if (failedAssessments > 0) {
      riskScore += 15;
      factors.push(`Failed ${failedAssessments} assessment(s)`);
    }

    const daysSinceActive = lastSession
      ? (Date.now() - lastSession.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      : 30;
    if (daysSinceActive > 14) {
      riskScore += 20;
      factors.push(`Inactive on platform for ${Math.round(daysSinceActive)} days`);
    } else if (daysSinceActive > 7) {
      riskScore += 10;
      factors.push(`No activity in past ${Math.round(daysSinceActive)} days`);
    }

    let riskLevel: AtRiskStudent["riskLevel"] = "low";
    if (riskScore >= 70) riskLevel = "critical";
    else if (riskScore >= 50) riskLevel = "high";
    else if (riskScore >= 30) riskLevel = "medium";

    const recommendedActions: string[] = [];
    if (riskLevel === "critical") {
      recommendedActions.push("Schedule immediate 1:1 intervention check-in");
      recommendedActions.push("Assign structured catch-up revision modules");
    }
    if (failedAssessments > 0 || avgScore < 50) {
      recommendedActions.push("Assign targeted remedial practice exercises");
      recommendedActions.push("Offer instructor office hours support");
    }
    if (weakTopics.length > 0) {
      recommendedActions.push(`Focus on foundational topics: ${weakTopics.slice(0, 2).map((w) => w.topicName).join(", ")}`);
    }
    if (daysSinceActive > 7) {
      recommendedActions.push("Send automated re-engagement notification");
    }

    results.push({
      studentId,
      studentName: member.student.name || "Unknown",
      email: member.student.email,
      riskScore: Math.min(100, riskScore),
      riskLevel,
      factors,
      lastActive: lastSession?.createdAt.toISOString() || null,
      completionRate: Math.round(completionRate),
      averageScore: Math.round(avgScore),
      weakTopics: weakTopics.map((w) => w.topicName),
      mistakeCount: totalMistakes,
      recommendedActions,
    });
  }

  return results.sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Retrieves granular evidence for a specific student drill-down.
 */
export async function getStudentEvidenceDrillDown(
  studentId: string,
  instructorId: string
): Promise<StudentDrillDownEvidence> {
  const [student, skills, mistakes, assessments, progress, aiSessions, executionEvents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, email: true },
    }),
    prisma.studentSkill.findMany({
      where: { userId: studentId },
      include: { topic: { select: { title: true } } },
    }),
    prisma.studentMistake.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.assessmentScore.findMany({
      where: { userId: studentId },
      include: { assessment: { select: { title: true } } },
      orderBy: { completedAt: "desc" },
    }),
    prisma.studentProgress.findMany({
      where: { userId: studentId },
      orderBy: { updatedAt: "desc" },
      take: 15,
    }),
    prisma.aISession.count({
      where: { userId: studentId },
    }),
    prisma.analyticsEvent.count({
      where: { userId: studentId, event: "code_execution" },
    }),
  ]);

  if (!student) throw new Error(`Student ${studentId} not found`);

  const completedCount = progress.filter((p) => p.status === "completed").length;
  const completionRate = progress.length > 0 ? Math.round((completedCount / progress.length) * 100) : 0;
  const scoredProgress = progress.filter((p) => p.score !== null);
  const avgScore = scoredProgress.length > 0 ? Math.round(scoredProgress.reduce((sum, p) => sum + p.score!, 0) / scoredProgress.length) : 0;
  const totalTimeSpent = Math.round(progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0) / 60);

  let riskScore = 0;
  if (completionRate < 25) riskScore += 30;
  if (avgScore < 40) riskScore += 30;
  if (mistakes.length >= 5) riskScore += 20;

  const riskLevel = riskScore >= 70 ? "critical" : riskScore >= 50 ? "high" : riskScore >= 30 ? "medium" : "low";

  return {
    student: {
      id: student.id,
      name: student.name || "Unknown",
      email: student.email,
    },
    overview: {
      completionRate,
      averageScore: avgScore,
      totalTimeSpentMinutes: totalTimeSpent,
      totalExecutions: executionEvents,
      totalAiQuestions: aiSessions,
      riskScore,
      riskLevel,
    },
    skills: skills.map((s) => ({
      topicId: s.topicId,
      topicName: s.topic.title,
      score: s.score,
      status: s.status,
      attempts: s.attempts,
      lastAttemptAt: s.lastAttemptAt?.toISOString() || null,
    })),
    recentMistakes: mistakes.map((m) => ({
      id: m.id,
      topicId: m.topicId,
      error: m.error,
      code: m.code,
      fix: m.fix,
      count: m.count,
      createdAt: m.createdAt.toISOString(),
    })),
    assessments: assessments.map((a) => ({
      assessmentId: a.assessmentId,
      title: a.assessment.title,
      score: a.score,
      totalPoints: a.totalPoints,
      percentage: a.totalPoints > 0 ? Math.round((a.score / a.totalPoints) * 100) : 0,
      passed: a.passed,
      completedAt: a.completedAt.toISOString(),
    })),
    recentProgress: progress.map((p) => ({
      lessonId: p.lessonId,
      status: p.status,
      score: p.score,
      timeSpent: p.timeSpent,
      completedAt: p.completedAt?.toISOString() || null,
    })),
  };
}

/**
 * Generates automated AI intervention recommendations for at-risk students.
 */
export async function generateAIInterventions(
  batchId: string,
  instructorId: string
): Promise<AIIntervention[]> {
  const atRiskStudents = await detectAtRiskStudents(batchId, instructorId);
  const interventions: AIIntervention[] = [];

  for (const student of atRiskStudents) {
    if (student.riskLevel === "low") continue;

    const type = student.riskLevel === "critical" || student.riskLevel === "high"
      ? "urgent_intervention"
      : "standard_intervention";

    const title = student.riskLevel === "critical"
      ? `Urgent: ${student.studentName} requires immediate intervention`
      : student.riskLevel === "high"
      ? `High Priority: ${student.studentName} is falling behind pace`
      : `Check-in: ${student.studentName} could benefit from extra guidance`;

    const description = [
      `${student.studentName} (Risk Score: ${student.riskScore}/100, Average Mastery: ${student.averageScore}%).`,
      `Completion rate: ${student.completionRate}%.`,
      student.factors.map((f) => `- ${f}`).join("\n"),
      student.weakTopics.length > 0 ? `Weak topics needing focus: ${student.weakTopics.join(", ")}` : "",
    ].filter(Boolean).join("\n\n");

    interventions.push({
      studentId: student.studentId,
      studentName: student.studentName,
      type,
      title,
      description,
      suggestedActions: student.recommendedActions,
      priority: student.riskLevel === "critical" ? "urgent" : student.riskLevel === "high" ? "high" : "medium",
    });
  }

  return interventions;
}

/**
 * Generates structured teaching report based on real aggregated data.
 */
export async function generateTeachingReport(
  batchId: string,
  instructorId: string
): Promise<TeachingReport> {
  const batch = await prisma.batch.findFirst({
    where: { id: batchId, instructorId },
    include: {
      students: {
        include: {
          student: {
            select: { id: true, name: true },
          },
        },
      },
    },
  });

  if (!batch) throw new Error("Batch not found");

  const [analytics, atRisk, interventions, skills] = await Promise.all([
    getBatchAnalytics(batchId, instructorId),
    detectAtRiskStudents(batchId, instructorId),
    prisma.intervention.findMany({
      where: { studentId: { in: batch.students.map((s) => s.studentId) } },
    }),
    prisma.studentSkill.findMany({
      where: { userId: { in: batch.students.map((s) => s.studentId) } },
      include: { topic: { select: { title: true } } },
    }),
  ]);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentSkills = skills.filter((s) => s.lastAttemptAt && s.lastAttemptAt > thirtyDaysAgo);
  const oldSkills = skills.filter((s) => !s.lastAttemptAt || s.lastAttemptAt <= thirtyDaysAgo);

  const skillByTopic = new Map<string, { recent: number[]; old: number[] }>();
  for (const s of recentSkills) {
    if (!skillByTopic.has(s.topicId)) skillByTopic.set(s.topicId, { recent: [], old: [] });
    skillByTopic.get(s.topicId)!.recent.push(s.score);
  }
  for (const s of oldSkills) {
    if (!skillByTopic.has(s.topicId)) skillByTopic.set(s.topicId, { recent: [], old: [] });
    skillByTopic.get(s.topicId)!.old.push(s.score);
  }

  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  const improving: string[] = [];
  const declining: string[] = [];
  for (const [topicId, data] of skillByTopic) {
    const topicName = skills.find((s) => s.topicId === topicId)?.topic.title || topicId;
    const recentAvg = avg(data.recent);
    const oldAvg = avg(data.old);
    if (recentAvg > oldAvg + 5) improving.push(topicName);
    if (recentAvg < oldAvg - 5) declining.push(topicName);
  }

  const allTopics = Array.from(skillByTopic.keys());
  const topicAvgs = allTopics.map((t) => {
    const d = skillByTopic.get(t)!;
    return { name: skills.find((s) => s.topicId === t)?.topic.title || t, avg: avg([...d.recent, ...d.old]) };
  });
  const sortedTopics = topicAvgs.sort((a, b) => b.avg - a.avg);
  const strongest = sortedTopics.slice(0, 3).map((t) => t.name);
  const weakest = sortedTopics.slice(-3).map((t) => t.name);

  const recommendationsForBatch: string[] = [];
  if (analytics.overallCompletion < 50) {
    recommendationsForBatch.push("Consider adjusting lecture pacing or adding review workshops");
  }
  if (weakest.length > 0) {
    recommendationsForBatch.push(`Schedule focused problem-solving sessions for: ${weakest.join(", ")}`);
  }
  if (atRisk.filter((s) => s.riskLevel === "critical" || s.riskLevel === "high").length > 0) {
    recommendationsForBatch.push("Initiate proactive 1:1 check-ins with at-risk students");
  }

  const recommendationsForIndividual = atRisk
    .filter((s) => s.riskLevel === "critical" || s.riskLevel === "high")
    .slice(0, 5)
    .map((s) => ({
      studentId: s.studentId,
      studentName: s.studentName,
      recommendation: s.recommendedActions[0] || "Schedule a check-in meeting",
    }));

  const nextSteps: string[] = [];
  if (atRisk.filter((s) => s.riskLevel === "critical").length > 0) {
    nextSteps.push(`Address ${atRisk.filter((s) => s.riskLevel === "critical").length} critical-risk students immediately`);
  }
  if (declining.length > 0) {
    nextSteps.push(`Review declining performance topics: ${declining.join(", ")}`);
  }
  nextSteps.push("Re-evaluate batch metrics in 2 weeks");

  return {
    batchId,
    batchName: batch.name,
    generatedAt: now.toISOString(),
    period: {
      start: thirtyDaysAgo.toISOString(),
      end: now.toISOString(),
    },
    overview: {
      totalStudents: analytics.totalStudents,
      activeStudents: analytics.activeStudents,
      overallCompletion: analytics.overallCompletion,
      overallScore: analytics.averageScore,
      atRiskCount: atRisk.filter((s) => s.riskLevel !== "low").length,
      interventionsActive: interventions.filter((i) => i.status === "active").length,
    },
    progress: {
      completed: analytics.overallCompletion,
      inProgress: 100 - analytics.overallCompletion,
      notStarted: 0,
      pace: analytics.overallCompletion > 60 ? "On track" : analytics.overallCompletion > 30 ? "Slightly behind" : "Behind schedule",
      comparison: analytics.overallCompletion > 50 ? "Above platform average" : "Below platform average",
    },
    skills: {
      strongest,
      weakest,
      improving,
      declining,
    },
    recommendations: {
      forBatch: recommendationsForBatch,
      forIndividual: recommendationsForIndividual,
    },
    nextSteps,
  };
}