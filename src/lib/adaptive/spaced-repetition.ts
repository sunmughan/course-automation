import { prisma } from "@/lib/db";

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

export const DEFAULT_EASE = 2.5;
export const MIN_EASE = 1.3;
export const INTERVAL_MODIFIER = 1.0;

/**
 * SuperMemo SM-2 Spaced Repetition calculation
 */
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
        ...(courseId ? { topic: { module: { courseId } } } : {}),
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

    // Use persisted SM-2 state if available, else compute on the fly
    let ease = skill.easeFactor ?? DEFAULT_EASE;
    let interval = skill.interval ?? 0;
    let repetitions = skill.repetitions ?? skill.attempts ?? 0;
    let nextReview = skill.nextReviewAt;

    if (!nextReview) {
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
      const sm2 = calculateNextReview(
        quality,
        Math.max(1, Math.round(daysSinceLast)),
        ease,
        repetitions
      );
      interval = sm2.interval;
      ease = sm2.ease;
      nextReview = sm2.nextReview;
    }

    const isDue = nextReview.getTime() <= now.getTime();
    const isOverdue = nextReview.getTime() < now.getTime() - 24 * 60 * 60 * 1000;

    items.push({
      id: `sr-${skill.topicId}-${repetitions}`,
      topicId: skill.topicId,
      topicName,
      reviewCount: repetitions,
      easeFactor: ease,
      interval,
      nextReview,
      lastReview: skill.lastAttemptAt,
      isDue,
      isOverdue,
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
  const { SkillEvaluationService } = await import("./skill-evaluation");
  await SkillEvaluationService.recordSpacedRepetitionReview(userId, topicId, quality);
}