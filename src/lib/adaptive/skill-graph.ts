import { prisma } from "@/lib/db";
import {
  MASTERY_LEVELS,
  getMasteryLevel,
  synchronizeTopicSkill,
  type MasteryLevel,
} from "@/lib/adaptive/skill-evaluation";

export type SkillLevel = MasteryLevel;

export interface SkillNode {
  topicId: string;
  topicName: string;
  skillName: string;
  score: number;
  level: SkillLevel;
  attempts: number;
  lastAttemptAt: Date | null;
  dependencies: string[];
  dependents: string[];
  isWeak: boolean;
  masteryPercent: number;
}

export interface SkillGraph {
  nodes: Map<string, SkillNode>;
  edges: Array<{ from: string; to: string }>;
  overallLevel: SkillLevel;
  overallScore: number;
  totalTopics: number;
  masteredTopics: number;
  weakTopics: string[];
  strongestTopics: string[];
}

const SCORE_THRESHOLDS: Record<SkillLevel, number> = {
  NOT_STARTED: 0,
  BEGINNER: 20,
  DEVELOPING: 40,
  COMPETENT: 60,
  STRONG: 75,
  MASTERED: 90,
};

const LEVEL_ORDER: SkillLevel[] = [...MASTERY_LEVELS];

export function computeSkillLevel(score: number): SkillLevel {
  return getMasteryLevel(score);
}

export function computeMasteryPercent(score: number): number {
  return Math.min(Math.round(Math.max(score, 0)), 100);
}

export function getLevelProgress(score: number): number {
  const currentLevel = computeSkillLevel(score);
  const currentThreshold = SCORE_THRESHOLDS[currentLevel];
  const currentIndex = LEVEL_ORDER.indexOf(currentLevel);

  if (currentIndex >= LEVEL_ORDER.length - 1) return 100;

  const nextThreshold = SCORE_THRESHOLDS[LEVEL_ORDER[currentIndex + 1]];
  return Math.round(((score - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
}

export function getNextLevel(currentLevel: SkillLevel): SkillLevel | null {
  const index = LEVEL_ORDER.indexOf(currentLevel);
  if (index >= LEVEL_ORDER.length - 1) return null;
  return LEVEL_ORDER[index + 1];
}

export function getPointsToNextLevel(score: number): number {
  const currentLevel = computeSkillLevel(score);
  if (currentLevel === "MASTERED") return 0;
  const nextThreshold = SCORE_THRESHOLDS[LEVEL_ORDER[LEVEL_ORDER.indexOf(currentLevel) + 1]];
  return Math.max(0, nextThreshold - score);
}

export async function buildSkillGraph(userId: string, courseId?: string): Promise<SkillGraph> {
  const courseFilter = courseId ? { module: { courseId } } : {};

  const [skills, topics, mistakes] = await Promise.all([
    prisma.studentSkill.findMany({
      where: { userId },
      orderBy: { score: "desc" },
    }),
    prisma.topic.findMany({
      where: { published: true, ...courseFilter },
      include: {
        prerequisites: { include: { prerequisite: true } },
        dependedBy: { include: { topic: true } },
      },
    }),
    prisma.studentMistake.findMany({
      where: { userId, ...(courseId ? { topic: { module: { courseId } } } : {}) },
    }),
  ]);

  const skillMap = new Map(skills.map((s) => [s.topicId, s]));
  const mistakeCounts = new Map<string, number>();
  for (const m of mistakes) {
    mistakeCounts.set(m.topicId, (mistakeCounts.get(m.topicId) || 0) + m.count);
  }

  const nodes = new Map<string, SkillNode>();
  const edges: Array<{ from: string; to: string }> = [];

  for (const topic of topics) {
    const skill = skillMap.get(topic.id);
    const score = skill?.score ?? 0;
    const level = computeSkillLevel(score);
    const mistakeCount = mistakeCounts.get(topic.id) || 0;
    const isWeak = level === "NOT_STARTED" || level === "BEGINNER" || (level === "DEVELOPING" && mistakeCount > 2);

    const node: SkillNode = {
      topicId: topic.id,
      topicName: topic.title,
      skillName: skill?.skillName || topic.title,
      score,
      level,
      attempts: skill?.attempts ?? 0,
      lastAttemptAt: skill?.lastAttemptAt ?? null,
      dependencies: topic.prerequisites.map((p) => p.prerequisiteId),
      dependents: topic.dependedBy.map((d) => d.topicId),
      isWeak,
      masteryPercent: computeMasteryPercent(score),
    };

    nodes.set(topic.id, node);

    for (const dep of topic.prerequisites) {
      edges.push({ from: dep.prerequisiteId, to: topic.id });
    }
  }

  const masteredTopics = Array.from(nodes.values()).filter((n) => n.level === "MASTERED").length;
  const overallScore = nodes.size > 0
    ? Math.round(Array.from(nodes.values()).reduce((sum, n) => sum + n.score, 0) / nodes.size)
    : 0;

  const sortedNodes = Array.from(nodes.values()).sort((a, b) => b.score - a.score);

  return {
    nodes,
    edges,
    overallLevel: computeSkillLevel(overallScore),
    overallScore,
    totalTopics: nodes.size,
    masteredTopics,
    weakTopics: sortedNodes.filter((n) => n.isWeak).map((n) => n.topicId),
    strongestTopics: sortedNodes.slice(0, 3).map((n) => n.topicId),
  };
}

export async function updateSkillAfterLesson(
  userId: string,
  topicId: string,
  lessonScore: number,
  timeSpent: number
): Promise<{ skill: SkillNode; leveledUp: boolean }> {
  void lessonScore;
  void timeSpent;
  const existing = await prisma.studentSkill.findUnique({
    where: { userId_topicId: { userId, topicId } },
  });
  const oldLevel = computeSkillLevel(existing?.score ?? 0);
  const evaluation = await synchronizeTopicSkill(userId, topicId);
  const [topic, skill] = await Promise.all([
    prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        title: true,
        prerequisites: { select: { prerequisiteId: true } },
        dependedBy: { select: { topicId: true } },
      },
    }),
    prisma.studentSkill.findUnique({
      where: { userId_topicId: { userId, topicId } },
    }),
  ]);

  if (!topic || !skill) {
    throw new Error(`Topic ${topicId} not found`);
  }

  return {
    skill: {
      topicId: skill.topicId,
      topicName: topic.title,
      skillName: skill.skillName,
      score: skill.score,
      level: evaluation.level,
      attempts: skill.attempts,
      lastAttemptAt: skill.lastAttemptAt,
      dependencies: topic.prerequisites.map((item) => item.prerequisiteId),
      dependents: topic.dependedBy.map((item) => item.topicId),
      isWeak: evaluation.level === "NOT_STARTED" || evaluation.level === "BEGINNER" || evaluation.level === "DEVELOPING",
      masteryPercent: computeMasteryPercent(skill.score),
    },
    leveledUp: LEVEL_ORDER.indexOf(evaluation.level) > LEVEL_ORDER.indexOf(oldLevel),
  };
}

export async function recordMistake(
  userId: string,
  topicId: string,
  lessonId: string,
  code: string,
  error: string,
  fix?: string
): Promise<void> {
  const existing = await prisma.studentMistake.findFirst({
    where: { userId, topicId, error },
  });

  if (existing) {
    await prisma.studentMistake.update({
      where: { id: existing.id },
      data: { count: { increment: 1 }, code, fix: fix || existing.fix },
    });
  } else {
    await prisma.studentMistake.create({
      data: { userId, topicId, lessonId, code, error, fix, count: 1 },
    });
  }
}

export async function getTopicSkillBreakdown(userId: string, topicId: string) {
  const lessonIds = await prisma.lesson.findMany({
    where: { topicId },
    select: { id: true },
  }).then((lessons) => lessons.map((l) => l.id));

  const [skill, progress, mistakes] = await Promise.all([
    prisma.studentSkill.findUnique({ where: { userId_topicId: { userId, topicId } } }),
    prisma.studentProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { status: true, score: true, timeSpent: true },
    }),
    prisma.studentMistake.findMany({
      where: { userId, topicId },
      orderBy: { count: "desc" },
      take: 10,
    }),
  ]);

  const completedLessons = progress.filter((p) => p.status === "completed").length;
  const totalLessons = progress.length;
  const avgScore = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + (p.score ?? 0), 0) / progress.length)
    : 0;
  const totalTimeSpent = progress.reduce((sum, p) => sum + p.timeSpent, 0);

  return {
    skill: skill ? {
      score: skill.score,
      level: computeSkillLevel(skill.score),
      attempts: skill.attempts,
      masteryPercent: computeMasteryPercent(skill.score),
      nextLevel: getNextLevel(computeSkillLevel(skill.score)),
      pointsToNext: getPointsToNextLevel(skill.score),
    } : null,
    progress: {
      completedLessons,
      totalLessons,
      completionPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
      avgScore,
      totalTimeSpent,
    },
    mistakes: mistakes.map((m) => ({
      error: m.error,
      count: m.count,
      fix: m.fix,
    })),
  };
}