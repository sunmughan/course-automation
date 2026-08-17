import { describe, expect, it, vi, beforeEach } from "vitest";
import { InterviewEngine } from "./engine";

const { prismaMock, aiRouterMock, skillEvaluationServiceMock } = vi.hoisted(() => ({
  prismaMock: {
    interviewSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    interviewTurn: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    topic: {
      findUnique: vi.fn(),
    },
  },
  aiRouterMock: {
    executeWithFallback: vi.fn(),
  },
  skillEvaluationServiceMock: {
    synchronizeTopicSkill: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/ai/router", () => ({ aiRouter: aiRouterMock }));
vi.mock("@/lib/adaptive/skill-evaluation", () => ({
  SkillEvaluationService: skillEvaluationServiceMock,
}));

describe("Wave 14: AI-Driven Technical Interview Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateQuestion", () => {
    it("generates structured questions conforming to the interview schema", async () => {
      aiRouterMock.executeWithFallback.mockResolvedValue({
        content: JSON.stringify({
          question: "Explain how React reconciles virtual DOM trees and when keys matter.",
          questionType: "conceptual",
          focusTopic: "Virtual DOM Reconciliation",
        }),
      });

      const result = await InterviewEngine.generateQuestion({
        role: "Frontend Engineer",
        targetLevel: "senior",
        topicTitle: "React Fundamentals",
        difficulty: 3,
        turnNumber: 1,
      });

      expect(result.question).toContain("virtual DOM");
      expect(result.questionType).toBe("conceptual");
      expect(aiRouterMock.executeWithFallback).toHaveBeenCalledTimes(1);
    });

    it("falls back gracefully to robust question generator if AI output fails parsing", async () => {
      aiRouterMock.executeWithFallback.mockRejectedValue(new Error("LLM timeout"));

      const result = await InterviewEngine.generateQuestion({
        role: "Full-Stack Engineer",
        targetLevel: "mid",
        topicTitle: "State Management",
        difficulty: 2,
        turnNumber: 1,
      });

      expect(result.question).toBeDefined();
      expect(result.question.length).toBeGreaterThan(15);
    });
  });

  describe("evaluateAnswer", () => {
    it("evaluates answer across the 4 core dimensions and provides actionable feedback", async () => {
      aiRouterMock.executeWithFallback.mockResolvedValue({
        content: JSON.stringify({
          technicalAccuracy: 90,
          problemSolving: 85,
          depth: 80,
          communication: 95,
          overallTurnScore: 88,
          evaluatorFeedback: "Excellent explanation of virtual DOM diffing and key props.",
          strengths: ["Clear terminology", "Accurate description of O(n) heuristic"],
          improvements: ["Mention fiber architecture concurrency"],
          followUpQuestion: "How does React 18 concurrent rendering change this reconciliation process?",
          recommendedDifficultyAdjustment: "increase",
        }),
      });

      const evaluation = await InterviewEngine.evaluateAnswer({
        role: "Frontend Engineer",
        targetLevel: "senior",
        topicTitle: "React Fundamentals",
        question: "How does reconciliation work?",
        candidateAnswer: "React uses a virtual DOM representation and applies a heuristic O(n) diffing algorithm comparing element types and keys.",
        difficulty: 3,
      });

      expect(evaluation.technicalAccuracy).toBe(90);
      expect(evaluation.problemSolving).toBe(85);
      expect(evaluation.depth).toBe(80);
      expect(evaluation.communication).toBe(95);
      expect(evaluation.overallTurnScore).toBe(88);
      expect(evaluation.strengths).toHaveLength(2);
      expect(evaluation.followUpQuestion).toBeDefined();
      expect(evaluation.recommendedDifficultyAdjustment).toBe("increase");
    });
  });

  describe("startSession", () => {
    it("initializes an interview session with opening turn in database", async () => {
      prismaMock.topic.findUnique.mockResolvedValue({
        id: "topic-1",
        title: "Frontend Architecture",
      });

      prismaMock.interviewSession.create.mockResolvedValue({
        id: "session-1",
        userId: "user-1",
        role: "Frontend Architect",
        targetLevel: "senior",
        currentDifficulty: 3,
        status: "in_progress",
        startedAt: new Date(),
      });

      prismaMock.interviewTurn.create.mockResolvedValue({
        id: "turn-1",
        sessionId: "session-1",
        turnNumber: 1,
        question: "How do you architect state management across micro-frontends?",
        questionType: "system_design",
        difficulty: 3,
      });

      aiRouterMock.executeWithFallback.mockResolvedValue({
        content: JSON.stringify({
          question: "How do you architect state management across micro-frontends?",
          questionType: "system_design",
          focusTopic: "Micro-Frontend State",
        }),
      });

      const session = await InterviewEngine.startSession({
        userId: "user-1",
        topicId: "topic-1",
        role: "Frontend Architect",
        targetLevel: "senior",
        initialDifficulty: 3,
      });

      expect(session.session.id).toBe("session-1");
      expect(session.currentTurn.turnNumber).toBe(1);
      expect(session.currentTurn.question).toContain("micro-frontends");
      expect(prismaMock.interviewSession.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.interviewTurn.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("submitAnswer & adaptive progression", () => {
    it("evaluates answer, updates difficulty, and creates next turn when turns remain", async () => {
      prismaMock.interviewSession.findUnique.mockResolvedValue({
        id: "session-1",
        userId: "user-1",
        role: "Full-Stack Engineer",
        targetLevel: "mid",
        currentDifficulty: 2,
        topicId: "topic-1",
        turns: [
          {
            id: "turn-1",
            turnNumber: 1,
            question: "Question 1",
            difficulty: 2,
          },
        ],
      });

      prismaMock.interviewTurn.update.mockResolvedValue({});
      prismaMock.interviewSession.update.mockResolvedValue({});
      prismaMock.interviewTurn.create.mockResolvedValue({
        id: "turn-2",
        sessionId: "session-1",
        turnNumber: 2,
        question: "Follow-up question 2",
        questionType: "technical",
        difficulty: 3,
      });

      aiRouterMock.executeWithFallback.mockResolvedValue({
        content: JSON.stringify({
          technicalAccuracy: 90,
          problemSolving: 90,
          depth: 85,
          communication: 90,
          overallTurnScore: 89,
          evaluatorFeedback: "Great answer.",
          strengths: ["Strong points"],
          improvements: ["Minor items"],
          followUpQuestion: "Follow-up question 2",
          recommendedDifficultyAdjustment: "increase",
        }),
      });

      const result = await InterviewEngine.submitAnswer({
        sessionId: "session-1",
        turnId: "turn-1",
        userId: "user-1",
        candidateAnswer: "Detailed candidate answer with code analysis.",
      }, 3);

      expect(result.sessionStatus).toBe("in_progress");
      expect(result.turnEvaluation.overallTurnScore).toBe(89);
      expect(result.nextTurn?.turnNumber).toBe(2);
      expect(prismaMock.interviewSession.update).toHaveBeenCalledWith({
        where: { id: "session-1" },
        data: { currentDifficulty: 3 }, // Difficulty increased
      });
    });

    it("completes session on final turn, calculates aggregates, and syncs skill", async () => {
      prismaMock.interviewSession.findUnique.mockResolvedValue({
        id: "session-1",
        userId: "user-1",
        role: "Full-Stack Engineer",
        targetLevel: "mid",
        currentDifficulty: 3,
        topicId: "topic-1",
        turns: [
          { id: "turn-1", turnNumber: 1, question: "Q1", difficulty: 3 },
          { id: "turn-2", turnNumber: 2, question: "Q2", difficulty: 3 },
        ],
      });

      prismaMock.interviewTurn.update.mockResolvedValue({});
      prismaMock.interviewTurn.findMany.mockResolvedValue([
        { technicalAccuracy: 80, problemSolving: 80, depth: 70, communication: 90 },
        { technicalAccuracy: 90, problemSolving: 85, depth: 80, communication: 95 },
      ]);
      prismaMock.interviewSession.update.mockResolvedValue({});

      aiRouterMock.executeWithFallback.mockResolvedValue({
        content: JSON.stringify({
          technicalAccuracy: 90,
          problemSolving: 85,
          depth: 80,
          communication: 95,
          overallTurnScore: 88,
          evaluatorFeedback: "Superb finale.",
          strengths: ["Strong closure"],
          improvements: ["None"],
          recommendedDifficultyAdjustment: "maintain",
        }),
      });

      const result = await InterviewEngine.submitAnswer({
        sessionId: "session-1",
        turnId: "turn-2",
        userId: "user-1",
        candidateAnswer: "Final answer.",
      }, 2); // maxTurns = 2

      expect(result.sessionStatus).toBe("completed");
      expect(result.finalSessionSummary).toBeDefined();
      expect(result.finalSessionSummary?.overallScore).toBeGreaterThanOrEqual(75);
      expect(prismaMock.interviewSession.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: "session-1" },
        data: expect.objectContaining({
          status: "completed",
        }),
      }));
      expect(skillEvaluationServiceMock.synchronizeTopicSkill).toHaveBeenCalledWith("user-1", "topic-1");
    });
  });
});
