import { prisma } from "@/lib/db";
import { detectWeakTopics } from "@/lib/adaptive/weak-detection";
import { buildSkillGraph } from "@/lib/adaptive/skill-graph";

export interface BatchAnalytics {
  batchId: string;
  batchName: string;
  totalStudents: number;
  activeStudents: number;
  overallCompletion: number;
  averageScore: number;
  skillDistribution: { level: string; count: number }[];
  topPerformers: { studentId: string; studentName: string; avgScore: number }[];
  needsAttention: { studentId: string; studentName: string; avgScore: number; reason: string }[];
  topicPerformance: { topicId: string; topicName: string; avgScore: number; completionRate: number }[];
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
  weakTopics: string[];
  recommendedActions: string[];
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

  if (!batch) throw new Error("Batch not found");

  const studentIds = batch.students.map((s) => s.studentId);

  const [progress, skills, mistakes] = await Promise.all([
    prisma.studentProgress.findMany({
      where: { userId: { in: studentIds } },
      select: { userId: true, status: true, score: true, completedAt: true },
    }),
    prisma.studentSkill.findMany({
      where: { userId: { in: studentIds } },
      include: { topic: { select: { id: true, title: true } } },
    }),
    prisma.studentMistake.findMany({
      where: { userId: { in: studentIds } },
      select: { userId: true, topicId: true, count: true },
    }),
  ]);

  const studentProgressMap = new Map<string, { status: string; score: number }[]>();
  for (const p of progress) {
    if (!studentProgressMap.has(p.userId)) studentProgressMap.set(p.userId, []);
    studentProgressMap.get(p.userId)!.push({ status: p.status, score: p.score ?? 0 });
  }

  const studentScores: { id: string; name: string; avgScore: number }[] = [];
  for (const s of batch.students) {
    const entries = studentProgressMap.get(s.studentId) || [];
    const avg = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.score, 0) / entries.length
      : 0;
    studentScores.push({ id: s.studentId, name: s.student.name || "Unknown", avgScore: Math.round(avg) });
  }

  const sorted = [...studentScores].sort((a, b) => b.avgScore - a.avgScore);
  const topPerformers = sorted.slice(0, 5).map((s) => ({
    studentId: s.id,
    studentName: s.name,
    avgScore: s.avgScore,
  }));
  const needsAttention = sorted
    .filter((s) => s.avgScore < 50)
    .slice(0, 5)
    .map((s) => ({
      studentId: s.id,
      studentName: s.name,
      avgScore: s.avgScore,
      reason: s.avgScore < 30 ? "Critically low performance" : "Below average, needs support",
    }));

  const allProgress = progress.flat();
  const completed = allProgress.filter((p) => p.status === "completed").length;
  const total = allProgress.length;
  const overallCompletion = total > 0 ? Math.round((completed / total) * 100) : 0;
  const averageScore = allProgress.length > 0
    ? Math.round(allProgress.reduce((sum, p) => sum + (p.score ?? 0), 0) / allProgress.length)
    : 0;

  const skillLevels = skills.reduce((acc, s) => {
    const level = computeSkillLevel(s.score);
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const skillDistribution = Object.entries(skillLevels).map(([level, count]) => ({ level, count }));

  const topicPerformanceMap = new Map<string, { scores: number[]; statuses: string[] }>();
  for (const s of skills) {
    if (!topicPerformanceMap.has(s.topicId)) {
      topicPerformanceMap.set(s.topicId, { scores: [], statuses: [] });
    }
    topicPerformanceMap.get(s.topicId)!.scores.push(s.score);
  }

  const topicPerformance = Array.from(topicPerformanceMap.entries()).map(([topicId, data]) => ({
    topicId,
    topicName: skills.find((s) => s.topicId === topicId)?.topic.title || "Unknown",
    avgScore: data.scores.length > 0
      ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
      : 0,
    completionRate: 0,
  }));

  const completionsByDate = new Map<string, number>();
  for (const p of progress) {
    if (p.completedAt) {
      const date = p.completedAt.toISOString().split("T")[0];
      completionsByDate.set(date, (completionsByDate.get(date) || 0) + 1);
    }
  }
  const completionTrend = Array.from(completionsByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, completions: count }));

  return {
    batchId: batch.id,
    batchName: batch.name,
    totalStudents: batch.students.length,
    activeStudents: batch.students.filter((s) => s.status === "active").length,
    overallCompletion,
    averageScore,
    skillDistribution,
    topPerformers,
    needsAttention,
    topicPerformance,
    completionTrend,
  };
}

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

  if (!batch) throw new Error("Batch not found");

  const results: AtRiskStudent[] = [];

  for (const member of batch.students) {
    const studentId = member.studentId;

    const [progress, skills, weakTopics, lastSession] = await Promise.all([
      prisma.studentProgress.findMany({
        where: { userId: studentId },
        select: { status: true, score: true, completedAt: true },
      }),
      prisma.studentSkill.findMany({
        where: { userId: studentId },
      }),
      detectWeakTopics(studentId),
      prisma.aISession.findFirst({
        where: { userId: studentId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const completedCount = progress.filter((p) => p.status === "completed").length;
    const totalCount = progress.length;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    const avgSkillScore = skills.length > 0
      ? skills.reduce((sum, s) => sum + s.score, 0) / skills.length
      : 0;

    const factors: string[] = [];
    let riskScore = 0;

    if (completionRate < 25) {
      riskScore += 30;
      factors.push("Very low completion rate");
    } else if (completionRate < 50) {
      riskScore += 15;
      factors.push("Low completion rate");
    }

    if (avgSkillScore < 30) {
      riskScore += 25;
      factors.push("Critically low skill scores");
    } else if (avgSkillScore < 50) {
      riskScore += 15;
      factors.push("Below average skill scores");
    }

    if (weakTopics.length >= 3) {
      riskScore += 20;
      factors.push(`${weakTopics.length} weak topics detected`);
    }

    const daysSinceActive = lastSession
      ? (Date.now() - lastSession.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      : 30;
    if (daysSinceActive > 14) {
      riskScore += 20;
      factors.push(`Inactive for ${Math.round(daysSinceActive)} days`);
    } else if (daysSinceActive > 7) {
      riskScore += 10;
      factors.push(`Inactive for ${Math.round(daysSinceActive)} days`);
    }

    let riskLevel: AtRiskStudent["riskLevel"] = "low";
    if (riskScore >= 70) riskLevel = "critical";
    else if (riskScore >= 50) riskLevel = "high";
    else if (riskScore >= 30) riskLevel = "medium";

    const recommendedActions: string[] = [];
    if (completionRate < 25) {
      recommendedActions.push("Schedule a 1:1 check-in meeting");
      recommendedActions.push("Create a personalized catch-up plan");
    }
    if (avgSkillScore < 50) {
      recommendedActions.push("Assign supplementary practice exercises");
      recommendedActions.push("Recommend peer tutoring or office hours");
    }
    if (weakTopics.length > 0) {
      recommendedActions.push(`Focus on weakest topics: ${weakTopics.slice(0, 3).map((w) => w.topicName).join(", ")}`);
    }
    if (daysSinceActive > 7) {
      recommendedActions.push("Send a re-engagement message");
    }

    results.push({
      studentId,
      studentName: member.student.name || "Unknown",
      email: member.student.email,
      riskScore,
      riskLevel,
      factors,
      lastActive: lastSession?.createdAt.toISOString() || null,
      completionRate: Math.round(completionRate),
      weakTopics: weakTopics.map((w) => w.topicName),
      recommendedActions,
    });
  }

  return results.sort((a, b) => b.riskScore - a.riskScore);
}

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
      ? `Urgent: ${student.studentName} needs immediate support`
      : student.riskLevel === "high"
      ? `High Priority: ${student.studentName} is falling behind`
      : `Follow-up: ${student.studentName} could benefit from extra support`;

    const description = [
      `${student.studentName} has a risk score of ${student.riskScore}/100.`,
      `Completion rate: ${student.completionRate}%.`,
      student.factors.map((f) => `- ${f}`).join("\n"),
      student.weakTopics.length > 0
        ? `Weak topics: ${student.weakTopics.join(", ")}`
        : "",
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
    recommendationsForBatch.push("Consider reducing the pace or adding more review sessions");
  }
  if (weakest.length > 0) {
    recommendationsForBatch.push(`Schedule review workshops for: ${weakest.join(", ")}`);
  }
  if (atRisk.filter((s) => s.riskLevel === "critical" || s.riskLevel === "high").length > 0) {
    recommendationsForBatch.push("Schedule individual check-ins with high-risk students");
  }
  if (analytics.activeStudents < analytics.totalStudents * 0.7) {
    recommendationsForBatch.push("Send batch-wide re-engagement announcement");
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
    nextSteps.push(`Investigate declining performance in: ${declining.join(", ")}`);
  }
  if (analytics.overallCompletion < 60) {
    nextSteps.push("Review and adjust curriculum pacing for the batch");
  }
  nextSteps.push("Schedule next batch review in 2 weeks");

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

function computeSkillLevel(score: number): string {
  if (score >= 80) return "mastered";
  if (score >= 60) return "strong";
  if (score >= 40) return "competent";
  if (score >= 20) return "developing";
  return "beginner";
}