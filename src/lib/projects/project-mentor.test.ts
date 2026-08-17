import { describe, expect, it, vi, beforeEach } from "vitest";
import { ProjectMentor } from "./project-mentor";

const { prismaMock, aiRouterMock } = vi.hoisted(() => ({
  prismaMock: {
    playgroundProject: {
      findUnique: vi.fn(),
    },
    studentSkill: {
      findMany: vi.fn(),
    },
  },
  aiRouterMock: {
    executeWithFallback: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/ai/router", () => ({ aiRouter: aiRouterMock }));

describe("Wave 18: AI Project Mentor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockProject = {
    id: "proj-1",
    userId: "user-1",
    name: "Analytics Dashboard",
    files: [
      {
        id: "f1",
        name: "main.js",
        path: "src/main.js",
        language: "javascript",
        content: "import { calc } from './utils.js';\nconsole.log(calc([1, 2, 3]));",
        isFolder: false,
      },
      {
        id: "f2",
        name: "utils.js",
        path: "src/utils.js",
        language: "javascript",
        content: "export function calc(arr) { return arr.reduce((a, b) => a + b, 0); }",
        isFolder: false,
      },
    ],
    sessions: [{ activeFileId: "src/main.js" }],
    executions: [
      {
        status: "error",
        error: "TypeError: Cannot read properties of undefined",
        output: "",
        exitCode: 1,
        language: "javascript",
      },
    ],
  };

  const mockSkills = [
    { topic: { title: "JavaScript Fundamentals" }, score: 85, status: "mastered" },
    { topic: { title: "Async Programming" }, score: 60, status: "competent" },
  ];

  describe("Architecture & Code Review", () => {
    it("performs comprehensive architecture review with structured findings", async () => {
      prismaMock.playgroundProject.findUnique.mockResolvedValue(mockProject);
      prismaMock.studentSkill.findMany.mockResolvedValue(mockSkills);

      aiRouterMock.executeWithFallback.mockResolvedValue({
        content: JSON.stringify({
          summary: "Solid modular architecture with clean separation of calculation logic into utils.",
          strengths: ["Clear module boundaries", "ES Module syntax"],
          findings: [
            {
              title: "Lack of input validation in calculation module",
              severity: "warning",
              description: "Array reduce assumes valid numbers without checking for non-array inputs.",
              file: "src/utils.js",
              lineRange: "lines 1-3",
              suggestedCodeSnippet: "if (!Array.isArray(arr)) return 0;",
            },
          ],
          recommendations: ["Add boundary input guards", "Add automated test harness"],
          suggestedNextAction: "Add array type verification in src/utils.js",
        }),
      });

      const response = await ProjectMentor.reviewProject({
        projectId: "proj-1",
        userId: "user-1",
        action: "architecture_review",
      });

      expect(response.mode).toBe("architecture_review");
      expect(response.summary).toContain("Solid modular architecture");
      expect(response.analysis.findings).toHaveLength(1);
      expect(response.analysis.findings[0].severity).toBe("warning");
      expect(response.suggestedNextAction).toContain("src/utils.js");
      expect(aiRouterMock.executeWithFallback).toHaveBeenCalledTimes(1);
    });
  });

  describe("Debugging & Runtime Diagnosis", () => {
    it("diagnoses runtime execution errors from project history", async () => {
      prismaMock.playgroundProject.findUnique.mockResolvedValue(mockProject);
      prismaMock.studentSkill.findMany.mockResolvedValue(mockSkills);

      aiRouterMock.executeWithFallback.mockResolvedValue({
        content: JSON.stringify({
          summary: "Identified undefined property access during main execution run.",
          strengths: ["Clean export syntax"],
          findings: [
            {
              title: "Null Pointer Dereference",
              severity: "critical",
              description: "The calculation function received an undefined parameter during invocation.",
              file: "src/main.js",
            },
          ],
          recommendations: ["Provide default parameters in calc"],
          codeChanges: [
            {
              file: "src/utils.js",
              modifiedSnippet: "export function calc(arr = []) { return arr.reduce((a, b) => a + b, 0); }",
              explanation: "Default parameter prevents undefined errors.",
            },
          ],
          suggestedNextAction: "Apply default parameter fix in src/utils.js",
        }),
      });

      const response = await ProjectMentor.reviewProject({
        projectId: "proj-1",
        userId: "user-1",
        action: "debugging",
      });

      expect(response.mode).toBe("debugging");
      expect(response.analysis.findings[0].severity).toBe("critical");
      expect(response.codeChanges).toHaveLength(1);
      expect(response.codeChanges![0].modifiedSnippet).toContain("arr = []");
    });
  });

  describe("Testing & Milestone Planning", () => {
    it("generates runnable test suites and milestone roadmaps", async () => {
      prismaMock.playgroundProject.findUnique.mockResolvedValue(mockProject);
      prismaMock.studentSkill.findMany.mockResolvedValue(mockSkills);

      aiRouterMock.executeWithFallback.mockResolvedValue({
        content: JSON.stringify({
          summary: "Generated comprehensive unit test suite and milestone roadmap.",
          strengths: ["Testable pure functions"],
          findings: [],
          recommendations: ["Run tests before every milestone commit"],
          suggestedTests: [
            {
              title: "Calculates sum of positive integers",
              code: "assert.equal(calc([1, 2, 3]), 6);",
              description: "Verifies standard addition calculation",
            },
          ],
          milestones: [
            {
              id: "m1",
              title: "Core Calculator Logic",
              description: "Verify mathematical utility methods",
              completed: true,
              tasks: ["Implement calc", "Verify assertions"],
            },
            {
              id: "m2",
              title: "UI Visualization",
              description: "Render results dynamically",
              completed: false,
              tasks: ["Create DOM components", "Connect event listeners"],
            },
          ],
          suggestedNextAction: "Run test suite on calculation utility",
        }),
      });

      const response = await ProjectMentor.reviewProject({
        projectId: "proj-1",
        userId: "user-1",
        action: "milestone_planning",
      });

      expect(response.mode).toBe("milestone_planning");
      expect(response.milestones).toHaveLength(2);
      expect(response.milestones![0].completed).toBe(true);
      expect(response.suggestedTests).toHaveLength(1);
    });
  });

  describe("Fallback Heuristic Analysis", () => {
    it("produces deterministic static analysis if LLM is offline", async () => {
      prismaMock.playgroundProject.findUnique.mockResolvedValue(mockProject);
      prismaMock.studentSkill.findMany.mockResolvedValue(mockSkills);
      aiRouterMock.executeWithFallback.mockRejectedValue(new Error("LLM offline"));

      const response = await ProjectMentor.reviewProject({
        projectId: "proj-1",
        userId: "user-1",
        action: "debugging",
      });

      expect(response.mode).toBe("debugging");
      expect(response.summary).toContain("TypeError");
      expect(response.analysis.findings).toBeDefined();
      expect(response.suggestedNextAction).toBeDefined();
    });
  });
});
