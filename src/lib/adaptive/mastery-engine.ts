/**
 * Adaptive Student Model & Mastery Evidence Engine
 * Quantifies mastery from genuine learning evidence (quiz answers, code executions,
 * mistake resolutions, practice test suites) and updates SM-2 spaced repetition schedules.
 */

import { prisma } from "@/lib/db";
import { calculateNextReview, getQualityFromScore } from "@/lib/adaptive/spaced-repetition";

export interface LearningEvidence {
  userId: string;
  topicId: string;
  type: "quiz" | "practice_pass" | "code_execution" | "mistake_resolved" | "assessment";
  score?: number; // 0 - 100
  passed: boolean;
  timeSpentMs?: number;
}

export interface MasteryEvaluation {
  topicId: string;
  score: number;
  status: "beginner" | "developing" | "proficient" | "mastered";
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewAt: Date;
  confidence: "low" | "medium" | "high" | "expert";
}

export class MasteryEngine {
  /**
   * Evaluates evidence, recalculates SM-2 interval, and persists student skill state.
   */
  public async recordEvidence(evidence: LearningEvidence): Promise<MasteryEvaluation> {
    const existingSkill = await prisma.studentSkill.findUnique({
      where: {
        userId_topicId: {
          userId: evidence.userId,
          topicId: evidence.topicId,
        },
      },
    });

    const currentScore = existingSkill?.score ?? 0;
    const currentAttempts = (existingSkill?.attempts ?? 0) + 1;
    const currentEase = existingSkill?.easeFactor ?? 2.5;
    const currentInterval = existingSkill?.interval ?? 0;
    const currentReps = existingSkill?.repetitions ?? 0;

    // Calculate quality score (0 to 5 for SM-2)
    let sm2Quality = 3;
    if (evidence.passed) {
      if ((evidence.score ?? 100) >= 90) sm2Quality = 5;
      else if ((evidence.score ?? 100) >= 75) sm2Quality = 4;
      else sm2Quality = 3;
    } else {
      if ((evidence.score ?? 0) >= 50) sm2Quality = 2;
      else sm2Quality = 1;
    }

    // Apply SM-2 spaced repetition calculation
    const sm2Result = calculateNextReview(
      sm2Quality,
      currentInterval,
      currentEase,
      currentReps
    );

    // Weighted skill score adjustment
    const weight = evidence.type === "practice_pass" ? 15 : evidence.type === "assessment" ? 25 : 8;
    const delta = evidence.passed ? weight : -Math.min(weight / 2, currentScore);
    const newScore = Math.max(0, Math.min(100, currentScore + delta));

    let status = "beginner";
    let confidence: MasteryEvaluation["confidence"] = "low";

    if (newScore >= 85 && currentReps >= 3) {
      status = "mastered";
      confidence = "expert";
    } else if (newScore >= 70) {
      status = "proficient";
      confidence = "high";
    } else if (newScore >= 40) {
      status = "developing";
      confidence = "medium";
    }

    const nextReps = evidence.passed ? currentReps + 1 : 0;

    // Persist updated mastery record
    await prisma.studentSkill.upsert({
      where: {
        userId_topicId: {
          userId: evidence.userId,
          topicId: evidence.topicId,
        },
      },
      update: {
        score: newScore,
        status,
        attempts: currentAttempts,
        lastAttemptAt: new Date(),
        easeFactor: sm2Result.ease,
        interval: sm2Result.interval,
        repetitions: nextReps,
        nextReviewAt: sm2Result.nextReview,
      },
      create: {
        userId: evidence.userId,
        topicId: evidence.topicId,
        skillName: evidence.topicId,
        score: newScore,
        status,
        attempts: 1,
        lastAttemptAt: new Date(),
        easeFactor: sm2Result.ease,
        interval: sm2Result.interval,
        repetitions: nextReps,
        nextReviewAt: sm2Result.nextReview,
      },
    });

    return {
      topicId: evidence.topicId,
      score: newScore,
      status: status as any,
      easeFactor: sm2Result.ease,
      interval: sm2Result.interval,
      repetitions: nextReps,
      nextReviewAt: sm2Result.nextReview,
      confidence,
    };
  }

  /**
   * Retrieves all concepts due for spaced review for a specific student.
   */
  public async getDueReviews(userId: string): Promise<Array<{
    topicId: string;
    skillName: string;
    score: number;
    daysOverdue: number;
    status: string;
  }>> {
    const skills = await prisma.studentSkill.findMany({
      where: {
        userId,
        nextReviewAt: {
          lte: new Date(),
        },
      },
      include: {
        topic: true,
      },
    });

    const now = Date.now();
    return skills.map((s) => {
      const dueTime = s.nextReviewAt ? s.nextReviewAt.getTime() : now;
      const daysOverdue = Math.max(0, Math.round((now - dueTime) / (1000 * 60 * 60 * 24)));
      return {
        topicId: s.topicId,
        skillName: s.topic?.title || s.skillName,
        score: s.score,
        daysOverdue,
        status: s.status,
      };
    });
  }
}

export const masteryEngine = new MasteryEngine();
