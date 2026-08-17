import { prisma } from "@/lib/db";
import { calculateNextReview, getQualityFromScore } from "./spaced-repetition";

export const MASTERY_LEVELS = [
  "NOT_STARTED",
  "BEGINNER",
  "DEVELOPING",
  "COMPETENT",
  "STRONG",
  "MASTERED",
] as const;

export type MasteryLevel = (typeof MASTERY_LEVELS)[number];
export type SkillEventType = "lesson" | "exercise" | "assessment" | "project" | "interview" | "review";

export interface SkillEvaluationInput {
  score: number;
  timeSpent?: number;
  hintsUsed?: number;
  mistakesCount?: number;
  prerequisiteMastery?: number;
}

export interface SkillEvaluation {
  score: number;
  level: MasteryLevel;
  confidence: number;
  accuracy: number;
}

export interface SkillEvidence {
  id: string;
  type: SkillEventType;
  score: number;
  timeSpent?: number;
  hintsUsed?: number;
}

export interface TopicSkillUpdate {
  score: number;
  level: MasteryLevel;
  attempts: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date | null;
}

export interface SpacedRepetitionState {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
  quality: number;
}

export function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.min(100, Math.max(0, score));
}

export function getMasteryLevel(score: number): MasteryLevel {
  const normalizedScore = clampScore(score);
  if (normalizedScore >= 90) return "MASTERED";
  if (normalizedScore >= 75) return "STRONG";
  if (normalizedScore >= 60) return "COMPETENT";
  if (normalizedScore >= 40) return "DEVELOPING";
  if (normalizedScore >= 20) return "BEGINNER";
  return "NOT_STARTED";
}

/**
 * Calculates a holistic mastery score taking into account raw score,
 * hint penalties, mistake density, and prerequisite foundation.
 */
export function evaluateSkill(input: SkillEvaluationInput): SkillEvaluation {
  let rawScore = clampScore(input.score);

  // Penalty for excessive hint usage (e.g. 5% per hint used, capped at 25%)
  if (input.hintsUsed && input.hintsUsed > 0) {
    const hintPenalty = Math.min(25, input.hintsUsed * 5);
    rawScore = Math.max(0, rawScore - hintPenalty);
  }

  // Weight by prerequisite mastery if available
  if (input.prerequisiteMastery !== undefined && input.prerequisiteMastery < 60) {
    const prereqFactor = Math.max(0.7, input.prerequisiteMastery / 100);
    rawScore = rawScore * prereqFactor;
  }

  const finalScore = Math.round(clampScore(rawScore));
  const level = getMasteryLevel(finalScore);
  const confidence = Math.min(100, Math.round(finalScore * (input.mistakesCount ? Math.max(0.5, 1 - input.mistakesCount * 0.1) : 1)));
  const accuracy = Math.min(100, Math.round(finalScore));

  return {
    score: finalScore,
    level,
    confidence,
    accuracy,
  };
}

export function evaluateLesson(input: SkillEvaluationInput): SkillEvaluation {
  return evaluateSkill(input);
}

export function evaluateExercise(input: SkillEvaluationInput): SkillEvaluation {
  return evaluateSkill(input);
}

export function evaluateAssessment(input: SkillEvaluationInput): SkillEvaluation {
  return evaluateSkill(input);
}

export function evaluateProject(input: SkillEvaluationInput): SkillEvaluation {
  return evaluateSkill(input);
}

export function evaluateInterview(input: SkillEvaluationInput): SkillEvaluation {
  return evaluateSkill(input);
}

export function evaluateTopicEvidence(evidence: SkillEvidence[]): { score: number; level: MasteryLevel; attempts: number } {
  const uniqueEvidence = new Map(evidence.map((item) => [`${item.type}:${item.id}`, item]));
  const evaluations = Array.from(uniqueEvidence.values()).map((item) => evaluateSkill({ score: item.score, hintsUsed: item.hintsUsed }));
  const score = evaluations.length === 0
    ? 0
    : Math.round(evaluations.reduce((sum, item) => sum + item.score, 0) / evaluations.length);

  return {
    score,
    level: getMasteryLevel(score),
    attempts: evaluations.length,
  };
}

// ── Canonical SkillEvaluationService ─────────────────────────────────────────

export class SkillEvaluationService {
  /**
   * Records a student mistake on a topic or lesson.
   */
  static async recordMistake(
    userId: string,
    topicId: string,
    lessonId: string | null,
    code: string,
    error: string,
    fix?: string | null
  ): Promise<void> {
    const existing = await prisma.studentMistake.findFirst({
      where: { userId, topicId, error },
    });

    if (existing) {
      await prisma.studentMistake.update({
        where: { id: existing.id },
        data: {
          count: { increment: 1 },
          code,
          fix: fix ?? existing.fix,
        },
      });
    } else {
      await prisma.studentMistake.create({
        data: {
          userId,
          topicId,
          lessonId,
          code,
          error,
          fix: fix ?? null,
          count: 1,
        },
      });
    }
  }

  /**
   * Records a learning attempt and updates progress and skill evaluation.
   */
  static async recordAttempt(
    userId: string,
    topicId: string,
    lessonId: string,
    score: number,
    timeSpent = 0,
    hintsUsed = 0
  ): Promise<TopicSkillUpdate> {
    await prisma.studentProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        status: "completed",
        score,
        timeSpent,
        completedAt: new Date(),
      },
      update: {
        status: "completed",
        score,
        timeSpent: { increment: timeSpent },
        completedAt: new Date(),
      },
    });

    return this.synchronizeTopicSkill(userId, topicId);
  }

  /**
   * Records a spaced repetition review using SM-2 algorithm and persists nextReviewAt.
   */
  static async recordSpacedRepetitionReview(
    userId: string,
    topicId: string,
    quality: number
  ): Promise<SpacedRepetitionState> {
    const skill = await prisma.studentSkill.findUnique({
      where: { userId_topicId: { userId, topicId } },
    });

    const previousEase = skill?.easeFactor ?? 2.5;
    const previousInterval = skill?.interval ?? 0;
    const previousReps = skill?.repetitions ?? 0;

    const { interval, ease, nextReview } = calculateNextReview(
      quality,
      previousInterval,
      previousEase,
      previousReps
    );

    const scoreDelta = quality >= 4 ? 5 : quality === 3 ? 2 : quality === 2 ? -2 : -5;
    const newScore = Math.min(100, Math.max(0, (skill?.score ?? 50) + scoreDelta));
    const newStatus = getMasteryLevel(newScore);

    await prisma.studentSkill.upsert({
      where: { userId_topicId: { userId, topicId } },
      create: {
        userId,
        topicId,
        skillName: "Topic Skill",
        score: newScore,
        status: newStatus,
        attempts: 1,
        lastAttemptAt: new Date(),
        easeFactor: ease,
        interval,
        repetitions: quality >= 3 ? previousReps + 1 : 0,
        nextReviewAt: nextReview,
      },
      update: {
        score: newScore,
        status: newStatus,
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
        easeFactor: ease,
        interval,
        repetitions: quality >= 3 ? previousReps + 1 : 0,
        nextReviewAt: nextReview,
      },
    });

    return {
      easeFactor: ease,
      interval,
      repetitions: quality >= 3 ? previousReps + 1 : 0,
      nextReviewAt: nextReview,
      quality,
    };
  }

  /**
   * Synchronizes topic skill evidence from completed lessons, exercises, and assessments.
   */
  static async synchronizeTopicSkill(userId: string, topicId: string): Promise<TopicSkillUpdate> {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: {
        title: true,
        lessons: {
          select: {
            id: true,
            assessments: { select: { id: true } },
          },
        },
      },
    });

    if (!topic) {
      throw new Error(`Topic ${topicId} not found`);
    }

    const lessonIds = topic.lessons.map((lesson) => lesson.id);
    const assessmentIds = topic.lessons.flatMap((lesson) => lesson.assessments.map((assessment) => assessment.id));

    const [progress, assessmentScores, existingSkill] = await Promise.all([
      prisma.studentProgress.findMany({
        where: { userId, lessonId: { in: lessonIds }, status: "completed" },
        select: { lessonId: true, score: true, timeSpent: true },
      }),
      prisma.assessmentScore.findMany({
        where: { userId, assessmentId: { in: assessmentIds } },
        select: { assessmentId: true, score: true, totalPoints: true },
      }),
      prisma.studentSkill.findUnique({
        where: { userId_topicId: { userId, topicId } },
      }),
    ]);

    const evidence: SkillEvidence[] = [
      ...progress.map((item) => ({
        id: item.lessonId,
        type: "lesson" as const,
        score: item.score ?? 100,
        timeSpent: item.timeSpent,
      })),
      ...assessmentScores.map((item) => ({
        id: item.assessmentId,
        type: "assessment" as const,
        score: item.totalPoints > 0 ? (item.score / item.totalPoints) * 100 : 0,
      })),
    ];

    const evaluation = evaluateTopicEvidence(evidence);

    // Compute or preserve SM-2 next review date
    let nextReviewAt = existingSkill?.nextReviewAt;
    let easeFactor = existingSkill?.easeFactor ?? 2.5;
    let interval = existingSkill?.interval ?? 0;
    let repetitions = existingSkill?.repetitions ?? 0;

    if (!nextReviewAt && evaluation.attempts > 0) {
      const quality = getQualityFromScore(evaluation.score);
      const sr = calculateNextReview(quality, 1, easeFactor, 0);
      easeFactor = sr.ease;
      interval = sr.interval;
      nextReviewAt = sr.nextReview;
    }

    await prisma.studentSkill.upsert({
      where: { userId_topicId: { userId, topicId } },
      create: {
        userId,
        topicId,
        skillName: topic.title,
        score: evaluation.score,
        status: evaluation.level,
        attempts: evaluation.attempts,
        lastAttemptAt: evaluation.attempts > 0 ? new Date() : null,
        easeFactor,
        interval,
        repetitions,
        nextReviewAt,
      },
      update: {
        skillName: topic.title,
        score: evaluation.score,
        status: evaluation.level,
        attempts: evaluation.attempts,
        lastAttemptAt: evaluation.attempts > 0 ? new Date() : null,
        easeFactor,
        interval,
        repetitions,
        nextReviewAt,
      },
    });

    return {
      score: evaluation.score,
      level: evaluation.level,
      attempts: evaluation.attempts,
      easeFactor,
      interval,
      repetitions,
      nextReviewAt: nextReviewAt ?? null,
    };
  }
}

// Backwards-compatible export
export const synchronizeTopicSkill = SkillEvaluationService.synchronizeTopicSkill.bind(SkillEvaluationService);
