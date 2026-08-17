import { describe, expect, it } from "vitest";
import {
  computeMasteryPercent,
  computeSkillLevel,
  getLevelProgress,
  getNextLevel,
  getPointsToNextLevel,
} from "@/lib/adaptive/skill-graph";

describe("skill graph mastery helpers", () => {
  it("uses the canonical mastery scale", () => {
    expect(computeSkillLevel(19)).toBe("NOT_STARTED");
    expect(computeSkillLevel(20)).toBe("BEGINNER");
    expect(computeSkillLevel(40)).toBe("DEVELOPING");
    expect(computeSkillLevel(60)).toBe("COMPETENT");
    expect(computeSkillLevel(75)).toBe("STRONG");
    expect(computeSkillLevel(90)).toBe("MASTERED");
  });

  it("reports progress against the canonical thresholds", () => {
    expect(computeMasteryPercent(75)).toBe(75);
    expect(getLevelProgress(30)).toBe(50);
    expect(getNextLevel("STRONG")).toBe("MASTERED");
    expect(getPointsToNextLevel(75)).toBe(15);
    expect(getPointsToNextLevel(90)).toBe(0);
  });
});
