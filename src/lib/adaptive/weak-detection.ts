import { prisma } from "@/lib/db";
import { buildSkillGraph, type SkillNode } from "./skill-graph";

export interface WeakTopic {
  topicId: string;
  topicName: string;
  skillLevel: string;
  score: number;
  masteryPercent: number;
  mistakeCount: number;
  reasons: string[];
  priority: number;
  recommendedActions: string[];
}

export interface DifficultyAssessment {
  currentLevel: number;
  recommendedLevel: number;
  shouldAdjust: boolean;
  reason: string;
}

export async function detectWeakTopics(userId: string, courseId?: string): Promise<WeakTopic[]> {
  const graph = await buildSkillGraph(userId, courseId);

  const mistakeWhere: Record<string, unknown> = { userId };
  if (courseId) {
    mistakeWhere.topic = { module: { courseId } };
  }

  const assessmentWhere: Record<string, unknown> = { userId };
  if (courseId) {
    assessmentWhere.assessment = { lesson: { topic: { module: { courseId } } } };
  }

  const [mistakes, assessments] = await Promise.all([
    prisma.studentMistake.findMany({ where: mistakeWhere as any }),
    prisma.assessmentScore.findMany({
      where: assessmentWhere as any,
      include: { assessment: { include: { lesson: { select: { topicId: true } } } } },
    }),
  ]);

  const mistakeMap = new Map<string, { count: number; errors: string[] }>();
  for (const m of mistakes) {
    const entry = mistakeMap.get(m.topicId) || { count: 0, errors: [] };
    entry.count += m.count;
    entry.errors.push(m.error);
    mistakeMap.set(m.topicId, entry);
  }

  const assessmentScores = new Map<string, number[]>();
  for (const a of assessments) {
    const topicId = a.assessment?.lesson?.topicId;
    if (topicId) {
      const scores = assessmentScores.get(topicId) || [];
      scores.push(a.score);
      assessmentScores.set(topicId, scores);
    }
  }

  const weakTopics: WeakTopic[] = [];

  for (const [topicId, node] of graph.nodes) {
    const reasons: string[] = [];
    const mistakeInfo = mistakeMap.get(topicId);
    const scores = assessmentScores.get(topicId);

    if (node.level === "beginner") {
      reasons.push("Skill level is beginner");
    }

    if (node.level === "developing") {
      reasons.push("Still developing this skill");
    }

    if (mistakeInfo && mistakeInfo.count >= 3) {
      reasons.push(`High mistake count (${mistakeInfo.count} repeated errors)`);
    }

    if (scores && scores.length > 0) {
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      if (avgScore < 50) {
        reasons.push(`Low assessment average (${avgScore}%)`);
      }
    }

    if (node.score < 30) {
      reasons.push("Very low skill score");
    }

    const hasMasteredPrereqs = node.dependencies.length > 0 &&
      node.dependencies.every((depId) => {
        const depNode = graph.nodes.get(depId);
        return depNode && depNode.level === "mastered";
      });

    if (node.lastAttemptAt) {
      const daysSinceLastAttempt = (Date.now() - node.lastAttemptAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastAttempt > 30 && node.level !== "mastered") {
        reasons.push(`Last practiced ${Math.round(daysSinceLastAttempt)} days ago`);
      }
    }

    if (reasons.length >= 2) {
      const priority = computePriority(node, mistakeInfo?.count ?? 0, reasons.length);
      const actions = generateRecommendedActions(node, mistakeInfo?.errors ?? [], reasons);

      weakTopics.push({
        topicId: node.topicId,
        topicName: node.topicName,
        skillLevel: node.level,
        score: node.score,
        masteryPercent: node.masteryPercent,
        mistakeCount: mistakeInfo?.count ?? 0,
        reasons,
        priority,
        recommendedActions: actions,
      });
    }
  }

  return weakTopics.sort((a, b) => b.priority - a.priority);
}

function computePriority(node: SkillNode, mistakeCount: number, reasonCount: number): number {
  let priority = 0;

  if (node.level === "beginner") priority += 40;
  else if (node.level === "developing") priority += 30;
  else if (node.level === "competent") priority += 10;

  priority += Math.min(mistakeCount * 5, 25);
  priority += reasonCount * 5;
  priority += Math.round((100 - node.score) * 0.1);

  return Math.min(priority, 100);
}

function generateRecommendedActions(
  node: SkillNode,
  errors: string[],
  reasons: string[]
): string[] {
  const actions: string[] = [];

  if (node.level === "beginner" || node.level === "developing") {
    actions.push("Review the core concepts and re-read the lesson content");
    actions.push("Complete the practice exercises for this topic");
  }

  if (reasons.some((r) => r.includes("assessment"))) {
    actions.push("Retake the assessment after reviewing the material");
  }

  if (reasons.some((r) => r.includes("days ago"))) {
    actions.push("Schedule a revision session to refresh your knowledge");
  }

  if (node.dependencies.length > 0) {
    actions.push("Review prerequisite topics to strengthen your foundation");
  }

  const uniqueErrors = [...new Set(errors)];
  if (uniqueErrors.length > 0) {
    actions.push(`Focus on fixing: ${uniqueErrors.slice(0, 2).join(", ")}`);
  }

  return actions.slice(0, 5);
}

export async function assessDifficulty(
  userId: string,
  topicId: string,
  defaultDifficulty: number = 2
): Promise<DifficultyAssessment> {
  const [skill, graph] = await Promise.all([
    prisma.studentSkill.findUnique({ where: { userId_topicId: { userId, topicId } } }),
    buildSkillGraph(userId),
  ]);

  const node = graph.nodes.get(topicId);
  const score = skill?.score ?? 0;

  const prereqMastery = node?.dependencies
    ? node.dependencies.reduce((sum, depId) => {
        const depNode = graph.nodes.get(depId);
        return sum + (depNode?.masteryPercent ?? 0);
      }, 0) / Math.max(node.dependencies.length, 1)
    : 100;

  let recommendedLevel = defaultDifficulty;

  if (score >= 80 && prereqMastery >= 80) {
    recommendedLevel = Math.min(4, defaultDifficulty + 1);
  } else if (score >= 60) {
    recommendedLevel = defaultDifficulty;
  } else if (score >= 30) {
    recommendedLevel = Math.max(1, defaultDifficulty - 1);
  } else {
    recommendedLevel = 1;
  }

  const shouldAdjust = recommendedLevel !== defaultDifficulty;
  let reason = "";

  if (shouldAdjust) {
    if (recommendedLevel > defaultDifficulty) {
      reason = `You've mastered this topic (${score}%). Increasing difficulty to challenge you.`;
    } else {
      reason = `You're still learning this topic (${score}%). Reducing difficulty to build confidence.`;
    }
  } else {
    reason = `Current difficulty is appropriate for your skill level (${score}%).`;
  }

  return { currentLevel: defaultDifficulty, recommendedLevel, shouldAdjust, reason };
}