import { prisma } from "@/lib/db";
import type { WeakTopic } from "./weak-detection";

export interface SpacedRepetitionItem {
  id: string;
  topicId: string;
  topicName: string;
  reviewCount: number;
  easeFactor: number;
  interval: number;
  nextReview: Date;
  lastReview: Date | null;
  isDue: boolean;
  isOverdue: boolean;
}

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const EASE_BONUS = 0.15;
const EASE_PENALTY = 0.2;
const INTERVAL_MODIFIER = 1.0;

export function calculateNextReview(
  quality: number,
  previousInterval: number,
  previousEase: number,
  repetitionCount: number
): { interval: number; ease: number; nextReview: Date } {
  const clampedQuality = Math.max(0, Math.min(5, quality));

  let newEase = previousEase + (0.1 - (5 - clampedQuality) * (0.08 + (5 - clampedQuality) * 0.02));
  newEase = Math.max(MIN_EASE, newEase);

  let newInterval: number;

  if (clampedQuality < 3) {
    newInterval = 1;
    repetitionCount = 0;
  } else {
    switch (repetitionCount) {
      case 0:
        newInterval = 1;
        break;
      case 1:
        newInterval = 6;
        break;
      default:
        newInterval = Math.round(previousInterval * newEase * INTERVAL_MODIFIER);
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return { interval: newInterval, ease: newEase, nextReview };
}

export function getQualityFromScore(score: number): number {
  if (score >= 95) return 5;
  if (score >= 85) return 4;
  if (score >= 70) return 3;
  if (score >= 50) return 2;
  if (score >= 30) return 1;
  return 0;
}

export async function getDueReviews(userId: string, courseId?: string): Promise<SpacedRepetitionItem[]> {
  const [skills, topics] = await Promise.all([
    prisma.studentSkill.findMany({
      where: {
        userId,
        ...(courseId ? {} : {}),
      },
      orderBy: { lastAttemptAt: "asc" },
    }),
    prisma.topic.findMany({
      where: {
        published: true,
        ...(courseId ? { module: { courseId } } : {}),
      },
      select: { id: true, title: true },
    }),
  ]);

  const topicMap = new Map(topics.map((t) => [t.id, t.title]));
  const now = new Date();
  const items: SpacedRepetitionItem[] = [];

  for (const skill of skills) {
    const topicName = topicMap.get(skill.topicId) || skill.skillName;

    if (!skill.lastAttemptAt) {
      items.push({
        id: `sr-${skill.topicId}-0`,
        topicId: skill.topicId,
        topicName,
        reviewCount: 0,
        easeFactor: DEFAULT_EASE,
        interval: 0,
        nextReview: now,
        lastReview: null,
        isDue: true,
        isOverdue: false,
      });
      continue;
    }

    const daysSinceLast = (now.getTime() - skill.lastAttemptAt.getTime()) / (1000 * 60 * 60 * 24);
    const quality = getQualityFromScore(skill.score);
    const { interval, ease, nextReview } = calculateNextReview(
      quality,
      Math.max(1, Math.round(daysSinceLast)),
      DEFAULT_EASE,
      skill.attempts
    );

    items.push({
      id: `sr-${skill.topicId}-${skill.attempts}`,
      topicId: skill.topicId,
      topicName,
      reviewCount: skill.attempts,
      easeFactor: ease,
      interval,
      nextReview,
      lastReview: skill.lastAttemptAt,
      isDue: nextReview <= now,
      isOverdue: nextReview < new Date(now.getTime() - 24 * 60 * 60 * 1000),
    });
  }

  return items.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    if (a.isDue && !b.isDue) return -1;
    if (!a.isDue && b.isDue) return 1;
    return a.nextReview.getTime() - b.nextReview.getTime();
  });
}

export async function getRevisionSchedule(userId: string, courseId?: string, days: number = 7): Promise<{
  schedule: Array<{ date: string; items: SpacedRepetitionItem[] }>;
  totalDue: number;
  totalOverdue: number;
}> {
  const allItems = await getDueReviews(userId, courseId);
  const now = new Date();
  const schedule: Array<{ date: string; items: SpacedRepetitionItem[] }> = [];

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split("T")[0];

    const dayItems = allItems.filter((item) => {
      const itemDate = item.nextReview.toISOString().split("T")[0];
      return itemDate === dateStr;
    });

    schedule.push({ date: dateStr, items: dayItems });
  }

  const totalDue = allItems.filter((i) => i.isDue).length;
  const totalOverdue = allItems.filter((i) => i.isOverdue).length;

  return {
    schedule,
    totalDue,
    totalOverdue,
  };
}

export async function markTopicReviewed(
  userId: string,
  topicId: string,
  quality: number
): Promise<void> {
  const skill = await prisma.studentSkill.findUnique({
    where: { userId_topicId: { userId, topicId } },
  });

  if (!skill) return;

  const { ease } = calculateNextReview(
    quality,
    1,
    skill.score > 0 ? DEFAULT_EASE : DEFAULT_EASE,
    skill.attempts
  );

  const scoreBoost = quality >= 3 ? 5 : quality >= 2 ? 2 : 0;

  await prisma.studentSkill.update({
    where: { userId_topicId: { userId, topicId } },
    data: {
      score: Math.min(100, skill.score + scoreBoost),
      lastAttemptAt: new Date(),
      attempts: { increment: 1 },
    },
  });
}