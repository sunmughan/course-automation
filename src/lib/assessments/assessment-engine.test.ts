import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  evaluateMCQ,
  evaluatePredictOutput,
  evaluateConceptualRubric,
  AssessmentEngine,
} from "./engine";

const { prismaMock, skillEvaluationServiceMock } = vi.hoisted(() => ({
  prismaMock: {
    assessment: {
      findUnique: vi.fn(),
    },
    assessmentScore: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    studentMistake: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
  skillEvaluationServiceMock: {
    recordMistake: vi.fn(),
    synchronizeTopicSkill: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/adaptive/skill-evaluation", () => ({
  SkillEvaluationService: skillEvaluationServiceMock,
}));

describe("Wave 13: Assessment Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("evaluateMCQ", () => {
    it("matches exact text case-insensitively", () => {
      expect(evaluateMCQ(null, "const", "const")).toBe(true);
      expect(evaluateMCQ(null, "Const", "const")).toBe(true);
      expect(evaluateMCQ(null, "let", "const")).toBe(false);
    });

    it("matches options by option index or letter", () => {
      const options = JSON.stringify(["var", "let", "const"]);
      expect(evaluateMCQ(options, "const", "C")).toBe(true);
      expect(evaluateMCQ(options, "const", "2")).toBe(true);
      expect(evaluateMCQ(options, "const", "A")).toBe(false);
    });
  });

  describe("evaluatePredictOutput", () => {
    it("matches exact output after whitespace normalization", () => {
      expect(evaluatePredictOutput("42", "42")).toBe(true);
      expect(evaluatePredictOutput("Hello World\n", "Hello World")).toBe(true);
      expect(evaluatePredictOutput("foo", "bar")).toBe(false);
    });

    it("matches equivalent JSON structures", () => {
      const expected = '{"a": 1, "b": 2}';
      const actual = '{\n  "a": 1,\n  "b": 2\n}';
      expect(evaluatePredictOutput(expected, actual)).toBe(true);
    });
  });

  describe("evaluateConceptualRubric", () => {
    it("rewards comprehensive answers containing key architectural concepts", () => {
      const answer = "We use a central Redux store with unidirectional data flow and immutable actions for state predictability and separation of concerns.";
      const concepts = ["store", "unidirectional", "immutable", "separation"];
      const result = evaluateConceptualRubric(answer, concepts, 3);

      expect(result.scoreFraction).toBe(1);
      expect(result.feedback).toContain("Comprehensive answer");
    });

    it("penalizes answers with missing key concepts", () => {
      const answer = "We just put everything into a global variable.";
      const concepts = ["store", "unidirectional", "immutable", "separation"];
      const result = evaluateConceptualRubric(answer, concepts, 3);

      expect(result.scoreFraction).toBeLessThan(0.5);
      expect(result.feedback).toContain("technical depth");
    });
  });

  describe("AssessmentEngine.evaluateQuestion", () => {
    it("evaluates MCQ questions accurately", async () => {
      const q = {
        id: "q-1",
        type: "mcq",
        question: "Which keyword creates immutable variable binding?",
        options: JSON.stringify(["var", "let", "const"]),
        correctAnswer: "const",
        points: 2,
      };

      const correct = await AssessmentEngine.evaluateQuestion(q, "const");
      expect(correct.passed).toBe(true);
      expect(correct.score).toBe(2);

      const wrong = await AssessmentEngine.evaluateQuestion(q, "let");
      expect(wrong.passed).toBe(false);
      expect(wrong.score).toBe(0);
    });

    it("evaluates predict_output questions accurately", async () => {
      const q = {
        id: "q-2",
        type: "predict_output",
        question: "What will console.log(typeof NaN) print?",
        correctAnswer: "number",
        points: 3,
      };

      const result = await AssessmentEngine.evaluateQuestion(q, "number");
      expect(result.passed).toBe(true);
      expect(result.score).toBe(3);
    });

    it("evaluates coding questions by running code in sandbox against assertions", async () => {
      const q = {
        id: "q-3",
        type: "coding",
        question: "Write a function sum(a, b) that returns their sum",
        code: "function sum(a, b) {\n}",
        correctAnswer: "sum(2, 3) returns 5; sum(-1, 1) returns 0",
        testCases: "sum(10, 20) returns 30",
        points: 10,
      };

      const validCode = "function sum(a, b) { return a + b; }\nconsole.log(sum(2, 3));";
      const result = await AssessmentEngine.evaluateQuestion(q, validCode, "javascript");

      expect(result.passed).toBe(true);
      expect(result.score).toBe(10);
      expect(result.executionDetails?.passedTests).toBeGreaterThanOrEqual(1);
    });

    it("evaluates architecture questions using rubric grading", async () => {
      const q = {
        id: "q-4",
        type: "architecture",
        question: "Explain micro-frontend architecture advantages.",
        correctAnswer: "independent, deployment, isolation, scalability, teams",
        points: 5,
      };

      const answer = "Micro-frontends allow independent deployment, team isolation, and scalability across autonomous teams.";
      const result = await AssessmentEngine.evaluateQuestion(q, answer);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(5);
    });
  });

  describe("AssessmentEngine.evaluateAssessment", () => {
    it("evaluates complete multi-question assessment and persists score", async () => {
      prismaMock.assessment.findUnique.mockResolvedValue({
        id: "assess-1",
        title: "Frontend Architecture Exam",
        passingScore: 70,
        questions: [
          {
            id: "q1",
            type: "mcq",
            question: "Question 1",
            correctAnswer: "A",
            points: 5,
            order: 1,
          },
          {
            id: "q2",
            type: "predict_output",
            question: "Question 2",
            correctAnswer: "output",
            points: 5,
            order: 2,
          },
        ],
        lesson: { id: "l-1", topicId: "topic-1" },
      });

      prismaMock.assessmentScore.findUnique.mockResolvedValue(null);
      prismaMock.assessmentScore.upsert.mockResolvedValue({});

      const result = await AssessmentEngine.evaluateAssessment({
        assessmentId: "assess-1",
        userId: "user-123",
        answers: {
          q1: "A",
          q2: "output",
        },
        timeSpent: 120,
      });

      expect(result.score).toBe(10);
      expect(result.totalPoints).toBe(10);
      expect(result.percentage).toBe(100);
      expect(result.passed).toBe(true);
      expect(prismaMock.assessmentScore.upsert).toHaveBeenCalledTimes(1);
      expect(skillEvaluationServiceMock.synchronizeTopicSkill).toHaveBeenCalledWith("user-123", "topic-1");
    });
  });

  describe("AssessmentEngine.getAssessmentAnalytics", () => {
    it("aggregates analytics across all submissions", async () => {
      prismaMock.assessment.findUnique.mockResolvedValue({
        id: "assess-1",
        title: "Exam 1",
        passingScore: 70,
        questions: [
          { id: "q1", type: "mcq", question: "Q1", points: 10, order: 1 },
        ],
      });

      prismaMock.assessmentScore.findMany.mockResolvedValue([
        {
          userId: "u1",
          assessmentId: "assess-1",
          score: 10,
          totalPoints: 10,
          passed: true,
          timeSpent: 60,
          answers: JSON.stringify([{ questionId: "q1", passed: true, score: 10 }]),
        },
        {
          userId: "u2",
          assessmentId: "assess-1",
          score: 0,
          totalPoints: 10,
          passed: false,
          timeSpent: 90,
          answers: JSON.stringify([{ questionId: "q1", passed: false, score: 0 }]),
        },
      ]);

      const analytics = await AssessmentEngine.getAssessmentAnalytics("assess-1");

      expect(analytics.totalSubmissions).toBe(2);
      expect(analytics.passedCount).toBe(1);
      expect(analytics.passRate).toBe(50);
      expect(analytics.averageScore).toBe(5);
      expect(analytics.averageTimeSpentSeconds).toBe(75);
      expect(analytics.questionAnalytics).toHaveLength(1);
      expect(analytics.questionAnalytics[0].accuracyPercent).toBe(50);
    });
  });
});
