import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  getBatchAnalytics,
  detectAtRiskStudents,
  getStudentEvidenceDrillDown,
  generateAIInterventions,
  generateTeachingReport,
  computeSkillLevel,
} from "./analytics";

const { prismaMock, weakDetectionMock } = vi.hoisted(() => ({
  prismaMock: {
    batch: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    studentProgress: {
      findMany: vi.fn(),
    },
    studentSkill: {
      findMany: vi.fn(),
    },
    studentMistake: {
      findMany: vi.fn(),
    },
    assessmentScore: {
      findMany: vi.fn(),
    },
    aISession: {
      count: vi.fn(),
      findFirst: vi.fn(),
    },
    analyticsEvent: {
      count: vi.fn(),
    },
    intervention: {
      findMany: vi.fn(),
    },
  },
  weakDetectionMock: {
    detectWeakTopics: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/adaptive/weak-detection", () => ({
  detectWeakTopics: weakDetectionMock.detectWeakTopics,
}));

describe("Wave 15: Instructor Intelligence & Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("computeSkillLevel", () => {
    it("maps percentage score to appropriate label", () => {
      expect(computeSkillLevel(95)).toBe("mastered");
      expect(computeSkillLevel(80)).toBe("strong");
      expect(computeSkillLevel(65)).toBe("competent");
      expect(computeSkillLevel(45)).toBe("developing");
      expect(computeSkillLevel(20)).toBe("beginner");
    });
  });

  describe("getBatchAnalytics", () => {
    it("calculates real completion, common errors, difficult topics, and coding activity", async () => {
      prismaMock.batch.findFirst.mockResolvedValue({
        id: "batch-1",
        name: "Full-Stack Cohort 1",
        students: [
          { studentId: "s1", status: "active", student: { id: "s1", name: "Alice", email: "alice@test.com" } },
          { studentId: "s2", status: "active", student: { id: "s2", name: "Bob", email: "bob@test.com" } },
        ],
      });

      prismaMock.studentProgress.findMany.mockResolvedValue([
        { userId: "s1", lessonId: "l1", status: "completed", score: 90, timeSpent: 1200, completedAt: new Date() },
        { userId: "s1", lessonId: "l2", status: "completed", score: 85, timeSpent: 1800, completedAt: new Date() },
        { userId: "s2", lessonId: "l1", status: "completed", score: 40, timeSpent: 600, completedAt: new Date() },
        { userId: "s2", lessonId: "l2", status: "in_progress", score: null, timeSpent: 300, completedAt: null },
      ]);

      prismaMock.studentSkill.findMany.mockResolvedValue([
        { userId: "s1", topicId: "t1", score: 88, topic: { id: "t1", title: "React Hooks", difficulty: 3 } },
        { userId: "s2", topicId: "t1", score: 35, topic: { id: "t1", title: "React Hooks", difficulty: 3 } },
      ]);

      prismaMock.studentMistake.findMany.mockResolvedValue([
        { id: "m1", userId: "s2", topicId: "t1", error: "TypeError: undefined is not a function", code: "fn()", count: 4 },
        { id: "m2", userId: "s1", topicId: "t1", error: "TypeError: undefined is not a function", code: "fn()", count: 1 },
      ]);

      prismaMock.assessmentScore.findMany.mockResolvedValue([
        { userId: "s1", score: 90, totalPoints: 100, passed: true, timeSpent: 300 },
        { userId: "s2", score: 45, totalPoints: 100, passed: false, timeSpent: 200 },
      ]);

      prismaMock.aISession.count.mockResolvedValue(15);
      prismaMock.analyticsEvent.count.mockResolvedValue(42);

      const analytics = await getBatchAnalytics("batch-1", "instructor-1");

      expect(analytics.totalStudents).toBe(2);
      expect(analytics.activeStudents).toBe(2);
      expect(analytics.overallCompletion).toBe(75); // 3 of 4 completed = 75%
      expect(analytics.averageScore).toBe(72); // (90+85+40)/3 = 71.66 -> 72
      expect(analytics.totalCodeExecutions).toBe(42);
      expect(analytics.totalAiQuestions).toBe(15);
      expect(analytics.totalCodingTimeMinutes).toBe(65); // (1200+1800+600+300)/60 = 65 mins

      // Common errors
      expect(analytics.commonErrors).toHaveLength(1);
      expect(analytics.commonErrors[0].error).toContain("TypeError");
      expect(analytics.commonErrors[0].count).toBe(5);
      expect(analytics.commonErrors[0].affectedStudents).toBe(2);

      // Difficult topics
      expect(analytics.topicPerformance).toHaveLength(1);
      expect(analytics.topicPerformance[0].topicName).toBe("React Hooks");
      expect(analytics.topicPerformance[0].avgScore).toBe(62);
      expect(analytics.topicPerformance[0].isDifficult).toBe(true); // mistakeCount >= 5

      // Top performers & attention list
      expect(analytics.topPerformers[0].studentName).toBe("Alice");
      expect(analytics.needsAttention[0].studentName).toBe("Bob");
    });
  });

  describe("detectAtRiskStudents", () => {
    it("flags students with low completion, failing assessments, and high mistakes", async () => {
      prismaMock.batch.findFirst.mockResolvedValue({
        id: "batch-1",
        students: [
          { studentId: "s-struggling", student: { id: "s-struggling", name: "Charlie", email: "charlie@test.com" } },
        ],
      });

      prismaMock.studentProgress.findMany.mockResolvedValue([
        { status: "not_started", score: 20, completedAt: null },
        { status: "in_progress", score: null, completedAt: null },
      ]);

      prismaMock.studentSkill.findMany.mockResolvedValue([
        { score: 25, status: "beginner" },
      ]);

      weakDetectionMock.detectWeakTopics.mockResolvedValue([
        { topicName: "Async JavaScript", priority: 80 },
        { topicName: "Closures", priority: 75 },
      ]);

      prismaMock.aISession.findFirst.mockResolvedValue({
        createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), // 16 days ago
      });

      prismaMock.studentMistake.findMany.mockResolvedValue([
        { count: 6 },
      ]);

      prismaMock.assessmentScore.findMany.mockResolvedValue([
        { score: 30, totalPoints: 100, passed: false },
      ]);

      const atRisk = await detectAtRiskStudents("batch-1", "instructor-1");

      expect(atRisk).toHaveLength(1);
      const student = atRisk[0];
      expect(student.studentName).toBe("Charlie");
      expect(student.riskScore).toBeGreaterThanOrEqual(70);
      expect(student.riskLevel).toBe("critical");
      expect(student.factors.length).toBeGreaterThanOrEqual(3);
      expect(student.recommendedActions.length).toBeGreaterThanOrEqual(2);
      expect(student.weakTopics).toContain("Async JavaScript");
    });
  });

  describe("getStudentEvidenceDrillDown", () => {
    it("returns comprehensive evidence for a single student", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: "s1",
        name: "Alice",
        email: "alice@test.com",
      });

      prismaMock.studentSkill.findMany.mockResolvedValue([
        { topicId: "t1", score: 85, status: "strong", attempts: 3, lastAttemptAt: new Date(), topic: { title: "TypeScript" } },
      ]);

      prismaMock.studentMistake.findMany.mockResolvedValue([
        { id: "m1", topicId: "t1", error: "Type mismatch", code: "let x: number = 'a';", fix: "let x: string = 'a';", count: 2, createdAt: new Date() },
      ]);

      prismaMock.assessmentScore.findMany.mockResolvedValue([
        { assessmentId: "a1", score: 90, totalPoints: 100, passed: true, completedAt: new Date(), assessment: { title: "TS Exam" } },
      ]);

      prismaMock.studentProgress.findMany.mockResolvedValue([
        { lessonId: "l1", status: "completed", score: 90, timeSpent: 1200, completedAt: new Date() },
      ]);

      prismaMock.aISession.count.mockResolvedValue(10);
      prismaMock.analyticsEvent.count.mockResolvedValue(25);

      const drillDown = await getStudentEvidenceDrillDown("s1", "instructor-1");

      expect(drillDown.student.name).toBe("Alice");
      expect(drillDown.overview.completionRate).toBe(100);
      expect(drillDown.overview.totalExecutions).toBe(25);
      expect(drillDown.skills).toHaveLength(1);
      expect(drillDown.skills[0].topicName).toBe("TypeScript");
      expect(drillDown.recentMistakes).toHaveLength(1);
      expect(drillDown.recentMistakes[0].error).toBe("Type mismatch");
      expect(drillDown.assessments).toHaveLength(1);
      expect(drillDown.assessments[0].percentage).toBe(90);
    });
  });
});
