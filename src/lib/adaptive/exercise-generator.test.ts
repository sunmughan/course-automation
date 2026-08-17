import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  buildExerciseGenerationPrompt,
  extractFocusAreas,
  createVerifiedFallbackExercise,
  generatePersonalizedExercises,
} from "./exercise-generator";
import { validateExecutableExercise } from "@/lib/curriculum/executable-contract";

const { prismaMock, aiRouterMock } = vi.hoisted(() => ({
  prismaMock: {
    studentSkill: {
      findUnique: vi.fn(),
    },
    studentMistake: {
      findMany: vi.fn(),
    },
    topic: {
      findUnique: vi.fn(),
    },
    exercise: {
      create: vi.fn(),
    },
  },
  aiRouterMock: {
    executeWithFallback: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/ai/router", () => ({ aiRouter: aiRouterMock }));

describe("Wave 12: AI-Generated Practice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildExerciseGenerationPrompt", () => {
    it("builds a structured prompt containing student skill, topic, difficulty, and past mistakes", () => {
      const messages = buildExerciseGenerationPrompt({
        topicTitle: "Asynchronous JavaScript & Promises",
        language: "javascript",
        difficulty: 3,
        skillScore: 45,
        skillLevel: "DEVELOPING",
        mistakes: [
          { error: "UnhandledPromiseRejection: fetch failed", count: 3, code: "fetch(url).then(res => res.json())" },
          { error: "TypeError: Cannot read properties of undefined (reading 'data')", count: 2 },
        ],
        focusArea: "async-flow",
      });

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe("system");
      expect(messages[0].content).toContain("CRITICAL REQUIREMENTS");
      expect(messages[0].content).toContain("starterCode");
      expect(messages[0].content).toContain("solutionCode");

      expect(messages[1].role).toBe("user");
      expect(messages[1].content).toContain("Asynchronous JavaScript & Promises");
      expect(messages[1].content).toContain("DEVELOPING (45% score)");
      expect(messages[1].content).toContain("UnhandledPromiseRejection");
      expect(messages[1].content).toContain("async-flow");
    });
  });

  describe("extractFocusAreas", () => {
    it("extracts targeted focus areas from student mistake patterns", () => {
      const mistakes = [
        { error: "TypeError: fn is not a function", count: 4 },
        { error: "Uncaught ReferenceError: x is not defined", count: 2 },
        { error: "TypeError: Cannot read property 'map' of undefined", count: 5 },
      ];

      const areas = extractFocusAreas(mistakes, { score: 70 });
      expect(areas).toContain("type-coercion");
      expect(areas).toContain("variable-scoping");
      expect(areas).toContain("null-safety");
    });

    it("adds 'fundamentals' focus area when student skill score is low (<40)", () => {
      const areas = extractFocusAreas([], { score: 25 });
      expect(areas).toContain("fundamentals");
    });

    it("provides default focus areas when no mistakes exist", () => {
      const areas = extractFocusAreas([], null);
      expect(areas.length).toBeGreaterThan(0);
      expect(areas).toContain("algorithmic-logic");
    });
  });

  describe("createVerifiedFallbackExercise", () => {
    it("creates an exercise that strictly adheres to the Executable Learning Contract", () => {
      const exercise = createVerifiedFallbackExercise({
        topicTitle: "Data Structures",
        topicId: "data-structures",
        difficulty: 3,
        language: "javascript",
        focusArea: "null-safety",
      });

      expect(exercise.title).toContain("Data Structures");
      expect(exercise.starterCode).toBeDefined();
      expect(exercise.solutionCode).toBeDefined();
      expect(exercise.testCases).toBeDefined();
      expect(exercise.hints.length).toBeGreaterThanOrEqual(1);

      const contractCheck = validateExecutableExercise({
        title: exercise.title,
        description: exercise.description,
        instructions: exercise.instructions,
        starterCode: exercise.starterCode,
        solutionCode: exercise.solutionCode,
        testCases: exercise.testCases,
        hints: exercise.hints.join("; "),
        difficulty: exercise.difficulty,
      });

      expect(contractCheck.valid).toBe(true);
      expect(contractCheck.errors).toHaveLength(0);
    });
  });

  describe("generatePersonalizedExercises", () => {
    it("generates AI-assisted exercises and validates them before persistence", async () => {
      prismaMock.studentSkill.findUnique.mockResolvedValue({
        score: 60,
        status: "COMPETENT",
      });
      prismaMock.studentMistake.findMany.mockResolvedValue([
        { error: "TypeError: undefined is not an object", count: 3 },
      ]);
      prismaMock.topic.findUnique.mockResolvedValue({
        id: "topic-123",
        title: "React State & Hooks",
        slug: "react-state-hooks",
        difficulty: 3,
        lessons: [{ id: "lesson-123" }],
      });

      aiRouterMock.executeWithFallback.mockResolvedValue({
        content: JSON.stringify({
          title: "Custom State Hook",
          description: "Build a custom hook for state persistence",
          instructions: "Create usePersistedState hook that handles nulls gracefully.",
          starterCode: "function usePersistedState(key, initialValue) {\n  // TODO\n}",
          solutionCode: "function usePersistedState(key, initialValue) {\n  const [val, setVal] = React.useState(initialValue);\n  return [val, setVal];\n}",
          testCases: "usePersistedState initial state matches; updates cleanly",
          hints: ["Use React.useState under the hood."],
          explanation: "Encapsulates state management in a reusable hook.",
          difficulty: 3,
          focusArea: "null-safety",
        }),
      });

      prismaMock.exercise.create.mockResolvedValue({
        id: "persisted-ex-1",
      });

      const exercises = await generatePersonalizedExercises({
        userId: "test-student-1",
        topicId: "topic-123",
        count: 1,
        difficulty: 3,
        language: "javascript",
        persist: true,
      });

      expect(exercises).toHaveLength(1);
      expect(exercises[0].title).toBe("Custom State Hook");
      expect(exercises[0].id).toBe("persisted-ex-1");
      expect(exercises[0].isPersisted).toBe(true);
      expect(prismaMock.exercise.create).toHaveBeenCalledTimes(1);
    });

    it("falls back to verified fallback exercise if AI gateway outputs invalid JSON", async () => {
      prismaMock.studentSkill.findUnique.mockResolvedValue(null);
      prismaMock.studentMistake.findMany.mockResolvedValue([]);
      prismaMock.topic.findUnique.mockResolvedValue({
        id: "topic-999",
        title: "DOM Manipulation",
        slug: "dom-manipulation",
        difficulty: 2,
        lessons: [],
      });

      aiRouterMock.executeWithFallback.mockResolvedValue({
        content: "Not valid json output from LLM",
      });

      const exercises = await generatePersonalizedExercises({
        userId: "test-student-2",
        topicId: "topic-999",
        count: 1,
        persist: false,
      });

      expect(exercises).toHaveLength(1);
      expect(exercises[0].title).toContain("DOM Manipulation");
      expect(exercises[0].solutionCode).toBeDefined();
    });
  });
});
