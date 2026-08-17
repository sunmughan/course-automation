import { describe, expect, it } from "vitest";
import {
  evaluateAssessment,
  evaluateExercise,
  evaluateInterview,
  evaluateLesson,
  evaluateProject,
  evaluateTopicEvidence,
  getMasteryLevel,
} from "@/lib/adaptive/skill-evaluation";

describe("skill evaluation", () => {
  it("uses the canonical mastery scale", () => {
    expect(getMasteryLevel(0)).toBe("NOT_STARTED");
    expect(getMasteryLevel(19)).toBe("NOT_STARTED");
    expect(getMasteryLevel(20)).toBe("BEGINNER");
    expect(getMasteryLevel(40)).toBe("DEVELOPING");
    expect(getMasteryLevel(60)).toBe("COMPETENT");
    expect(getMasteryLevel(75)).toBe("STRONG");
    expect(getMasteryLevel(90)).toBe("MASTERED");
  });

  it("evaluates every supported learning event with the same result shape", () => {
    const evaluations = [
      evaluateLesson({ score: 80 }),
      evaluateExercise({ score: 80 }),
      evaluateAssessment({ score: 80 }),
      evaluateProject({ score: 80 }),
      evaluateInterview({ score: 80 }),
    ];

    for (const evaluation of evaluations) {
      expect(evaluation).toEqual({ score: 80, level: "STRONG", confidence: 80, accuracy: 80 });
    }
  });

  it("clamps scores to the canonical range", () => {
    expect(evaluateLesson({ score: -5 })).toEqual({ score: 0, level: "NOT_STARTED", confidence: 0, accuracy: 0 });
    expect(evaluateLesson({ score: 120 })).toEqual({ score: 100, level: "MASTERED", confidence: 100, accuracy: 100 });
  });

  it("aggregates unique learning evidence idempotently", () => {
    const evaluation = evaluateTopicEvidence([
      { id: "lesson-1", type: "lesson", score: 80 },
      { id: "lesson-1", type: "lesson", score: 80 },
      { id: "assessment-1", type: "assessment", score: 60 },
    ]);

    expect(evaluation).toEqual({ score: 70, level: "COMPETENT", attempts: 2 });
  });

  it("returns not started when a topic has no learning evidence", () => {
    expect(evaluateTopicEvidence([])).toEqual({
      score: 0,
      level: "NOT_STARTED",
      attempts: 0,
    });
  });
});
