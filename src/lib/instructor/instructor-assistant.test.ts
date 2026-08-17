import { describe, expect, it, vi, beforeEach } from "vitest";
import { AIInstructorAssistant } from "./assistant";

const { analyticsMock, aiRouterMock } = vi.hoisted(() => ({
  analyticsMock: {
    getBatchAnalytics: vi.fn(),
    detectAtRiskStudents: vi.fn(),
  },
  aiRouterMock: {
    executeWithFallback: vi.fn(),
  },
}));

vi.mock("./analytics", () => ({
  getBatchAnalytics: analyticsMock.getBatchAnalytics,
  detectAtRiskStudents: analyticsMock.detectAtRiskStudents,
}));

vi.mock("@/lib/ai/router", () => ({
  aiRouter: aiRouterMock,
}));

describe("Wave 16: AI Instructor Assistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("classifyIntent", () => {
    it("classifies intent accurately based on instructor queries", () => {
      expect(AIInstructorAssistant.classifyIntent("Which students are at risk?")).toBe("at_risk_query");
      expect(AIInstructorAssistant.classifyIntent("Which students need intervention?")).toBe("at_risk_query");
      expect(AIInstructorAssistant.classifyIntent("What is the hardest topic?")).toBe("difficult_topics_query");
      expect(AIInstructorAssistant.classifyIntent("Why are students failing?")).toBe("common_mistakes_query");
      expect(AIInstructorAssistant.classifyIntent("What are the most common mistakes?")).toBe("common_mistakes_query");
      expect(AIInstructorAssistant.classifyIntent("What should I teach tomorrow?")).toBe("teaching_recommendation_query");
      expect(AIInstructorAssistant.classifyIntent("What revision lesson should be assigned?")).toBe("teaching_recommendation_query");
      expect(AIInstructorAssistant.classifyIntent("Give me an overview of the batch.")).toBe("general_analytics_query");
    });
  });

  describe("AIInstructorAssistant.ask", () => {
    const mockAnalytics = {
      batchId: "batch-101",
      batchName: "Full-Stack Cohort Alpha",
      totalStudents: 25,
      activeStudents: 24,
      overallCompletion: 68,
      averageScore: 74,
      totalCodingTimeMinutes: 4200,
      totalCodeExecutions: 320,
      totalAiQuestions: 85,
      topPerformers: [
        { studentId: "s1", studentName: "Diana Prince", avgScore: 96, completionRate: 100 },
      ],
      difficultTopics: [
        { topicId: "t1", topicName: "React Hooks & State", failureRate: 42, avgScore: 54, mistakeCount: 18 },
      ],
      commonErrors: [
        { error: "TypeError: Cannot read properties of undefined", count: 14, affectedStudents: 8, sampleCode: "user.profile.name" },
      ],
    };

    const mockAtRisk = [
      {
        studentId: "s-risk",
        studentName: "Clark Kent",
        email: "clark@test.com",
        riskScore: 78,
        riskLevel: "critical",
        factors: ["Very low completion rate (20%)", "Failed 2 assessments"],
        averageScore: 42,
        completionRate: 20,
        weakTopics: ["React Hooks & State"],
        mistakeCount: 9,
        recommendedActions: ["Schedule 1:1 check-in meeting", "Assign remedial practice"],
      },
    ];

    it("answers at-risk queries grounded in real database records", async () => {
      analyticsMock.getBatchAnalytics.mockResolvedValue(mockAnalytics);
      analyticsMock.detectAtRiskStudents.mockResolvedValue(mockAtRisk);

      aiRouterMock.executeWithFallback.mockResolvedValue({
        content: JSON.stringify({
          answer: "Clark Kent is currently at critical risk with a score of 42% and 20% completion.",
          intent: "at_risk_query",
          keyTakeaways: ["Clark Kent needs immediate 1:1 check-in"],
          suggestedNextActions: ["Schedule 1:1 meeting with Clark Kent"],
        }),
      });

      const response = await AIInstructorAssistant.ask({
        instructorId: "inst-1",
        batchId: "batch-101",
        query: "Which students need intervention?",
      });

      expect(response.intent).toBe("at_risk_query");
      expect(response.answer).toContain("Clark Kent");
      expect(response.evidence.atRiskStudents).toHaveLength(1);
      expect(response.evidence.atRiskStudents![0].studentName).toBe("Clark Kent");
      expect(aiRouterMock.executeWithFallback).toHaveBeenCalledTimes(1);
    });

    it("answers difficult topic and mistake inquiries with real analytics evidence", async () => {
      analyticsMock.getBatchAnalytics.mockResolvedValue(mockAnalytics);
      analyticsMock.detectAtRiskStudents.mockResolvedValue(mockAtRisk);

      aiRouterMock.executeWithFallback.mockResolvedValue({
        content: JSON.stringify({
          answer: "The most difficult topic is React Hooks & State with a 42% failure rate.",
          intent: "difficult_topics_query",
          keyTakeaways: ["React Hooks & State has 18 recorded errors"],
          suggestedNextActions: ["Host a live coding review session on React Hooks"],
        }),
      });

      const response = await AIInstructorAssistant.ask({
        instructorId: "inst-1",
        batchId: "batch-101",
        query: "What is the hardest topic in the curriculum?",
      });

      expect(response.intent).toBe("difficult_topics_query");
      expect(response.evidence.difficultTopics).toHaveLength(1);
      expect(response.evidence.difficultTopics![0].topicName).toBe("React Hooks & State");
      expect(response.evidence.commonErrors![0].error).toContain("TypeError");
    });

    it("generates a data-backed teaching recommendation for tomorrow's class", async () => {
      analyticsMock.getBatchAnalytics.mockResolvedValue(mockAnalytics);
      analyticsMock.detectAtRiskStudents.mockResolvedValue(mockAtRisk);

      aiRouterMock.executeWithFallback.mockResolvedValue({
        content: JSON.stringify({
          answer: "Tomorrow you should teach React Hooks & State, focusing on resolving undefined object access.",
          intent: "teaching_recommendation_query",
          keyTakeaways: ["Focus on React Hooks & State"],
          suggestedNextActions: ["Assign practice on useState/useEffect"],
        }),
      });

      const response = await AIInstructorAssistant.ask({
        instructorId: "inst-1",
        batchId: "batch-101",
        query: "What should I teach tomorrow?",
      });

      expect(response.intent).toBe("teaching_recommendation_query");
      expect(response.evidence.recommendedLessonPlan).toBeDefined();
      expect(response.evidence.recommendedLessonPlan?.focusTopic).toBe("React Hooks & State");
      expect(response.evidence.recommendedLessonPlan?.remedialTargetStudents).toContain("Clark Kent");
    });

    it("falls back to deterministic data summary when AI model is offline", async () => {
      analyticsMock.getBatchAnalytics.mockResolvedValue(mockAnalytics);
      analyticsMock.detectAtRiskStudents.mockResolvedValue(mockAtRisk);
      aiRouterMock.executeWithFallback.mockRejectedValue(new Error("LLM unavailable"));

      const response = await AIInstructorAssistant.ask({
        instructorId: "inst-1",
        batchId: "batch-101",
        query: "Which students are at risk?",
      });

      expect(response.intent).toBe("at_risk_query");
      expect(response.answer).toContain("Clark Kent");
      expect(response.evidence.atRiskStudents).toBeDefined();
      expect(response.suggestedNextActions.length).toBeGreaterThan(0);
    });
  });
});
