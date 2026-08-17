import { describe, expect, it } from "vitest";
import {
  evaluateSkill,
  getMasteryLevel,
  evaluateTopicEvidence,
  type SkillEvidence,
} from "./skill-evaluation";
import {
  calculateNextReview,
  getQualityFromScore,
  DEFAULT_EASE,
  MIN_EASE,
} from "./spaced-repetition";

describe("Wave 11: Adaptive Learning Engine", () => {
  describe("Skill Evaluation & Mastery Tracking", () => {
    it("correctly maps score ranges to canonical mastery levels", () => {
      expect(getMasteryLevel(0)).toBe("NOT_STARTED");
      expect(getMasteryLevel(19)).toBe("NOT_STARTED");
      expect(getMasteryLevel(20)).toBe("BEGINNER");
      expect(getMasteryLevel(39)).toBe("BEGINNER");
      expect(getMasteryLevel(40)).toBe("DEVELOPING");
      expect(getMasteryLevel(59)).toBe("DEVELOPING");
      expect(getMasteryLevel(60)).toBe("COMPETENT");
      expect(getMasteryLevel(74)).toBe("COMPETENT");
      expect(getMasteryLevel(75)).toBe("STRONG");
      expect(getMasteryLevel(89)).toBe("STRONG");
      expect(getMasteryLevel(90)).toBe("MASTERED");
      expect(getMasteryLevel(100)).toBe("MASTERED");
    });

    it("applies hint usage penalties without dropping below 0", () => {
      // 0 hints -> full score
      const clean = evaluateSkill({ score: 90, hintsUsed: 0 });
      expect(clean.score).toBe(90);
      expect(clean.level).toBe("MASTERED");

      // 2 hints -> -10% penalty
      const withHints = evaluateSkill({ score: 90, hintsUsed: 2 });
      expect(withHints.score).toBe(80);
      expect(withHints.level).toBe("STRONG");

      // Excessive hints capped at -25%
      const excessiveHints = evaluateSkill({ score: 90, hintsUsed: 10 });
      expect(excessiveHints.score).toBe(65);
      expect(excessiveHints.level).toBe("COMPETENT");
    });

    it("adjusts score when prerequisite mastery is poor (<60%)", () => {
      const solidPrereq = evaluateSkill({ score: 80, prerequisiteMastery: 90 });
      expect(solidPrereq.score).toBe(80);

      const weakPrereq = evaluateSkill({ score: 80, prerequisiteMastery: 40 });
      expect(weakPrereq.score).toBeLessThan(80);
    });

    it("aggregates multiple evidence items idempotently", () => {
      const evidence: SkillEvidence[] = [
        { id: "l1", type: "lesson", score: 90 },
        { id: "l1", type: "lesson", score: 90 }, // duplicate should be deduplicated
        { id: "ex1", type: "exercise", score: 70 },
        { id: "a1", type: "assessment", score: 80 },
      ];

      const result = evaluateTopicEvidence(evidence);
      expect(result.attempts).toBe(3);
      expect(result.score).toBe(80);
      expect(result.level).toBe("STRONG");
    });
  });

  describe("Spaced Repetition (SuperMemo SM-2)", () => {
    it("maps percentage scores to SM-2 quality grades (0-5)", () => {
      expect(getQualityFromScore(98)).toBe(5);
      expect(getQualityFromScore(88)).toBe(4);
      expect(getQualityFromScore(75)).toBe(3);
      expect(getQualityFromScore(55)).toBe(2);
      expect(getQualityFromScore(35)).toBe(1);
      expect(getQualityFromScore(10)).toBe(0);
    });

    it("schedules first review (repetition 0) at interval 1 day", () => {
      const result = calculateNextReview(5, 0, DEFAULT_EASE, 0);
      expect(result.interval).toBe(1);
      expect(result.ease).toBeGreaterThan(DEFAULT_EASE);
    });

    it("schedules second review (repetition 1) at interval 6 days", () => {
      const result = calculateNextReview(4, 1, DEFAULT_EASE, 1);
      expect(result.interval).toBe(6);
    });

    it("scales interval by ease factor on subsequent successful repetitions (>=2)", () => {
      const result = calculateNextReview(5, 6, 2.5, 2);
      expect(result.interval).toBeGreaterThanOrEqual(15);
      expect(result.ease).toBeGreaterThan(2.5);
    });

    it("resets interval to 1 on review failure (quality < 3)", () => {
      const failed = calculateNextReview(1, 20, 2.5, 5);
      expect(failed.interval).toBe(1);
      expect(failed.ease).toBeLessThan(2.5);
    });

    it("clamps ease factor to minimum floor (MIN_EASE = 1.3)", () => {
      let ease = 1.4;
      for (let i = 0; i < 5; i++) {
        const res = calculateNextReview(0, 1, ease, 0);
        ease = res.ease;
      }
      expect(ease).toBe(MIN_EASE);
    });
  });
});
