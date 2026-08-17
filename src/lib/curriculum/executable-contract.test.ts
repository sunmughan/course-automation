import { describe, expect, it } from "vitest";
import {
  validateExecutableExample,
  validateExecutableExercise,
  validateExecutableTopic,
  assertExecutableTopic,
  type ExecutableExample,
  type ExecutableExercise,
  type ExecutableTopic,
} from "./executable-contract";
import { parseTestCases, runExerciseTests, verifyExerciseSolution } from "./exercise-runner";
import { phase5, phase6, phase7 } from "./frontend-phases";
import { phase3AdvancedAI } from "./ai-phases";

describe("Wave 10: Executable Lesson Content Contract", () => {
  describe("validateExecutableExample", () => {
    it("accepts a well-formed example with runnable starter and solution code", () => {
      const example: ExecutableExample = {
        title: "Two Sum Function",
        description: "Implements two sum algorithm in JavaScript",
        starterCode: "function twoSum(nums, target) {\n  // TODO\n}",
        solutionCode: "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}",
      };

      const result = validateExecutableExample(example);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects examples with empty or placeholder solutionCode", () => {
      const badExample: ExecutableExample = {
        title: "Bad Example",
        description: "A short description that has ten chars",
        starterCode: "function foo() {}",
        solutionCode: "TODO",
      };

      const result = validateExecutableExample(badExample);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("rejects examples with short titles or descriptions", () => {
      const invalid: ExecutableExample = {
        title: "A",
        description: "short",
        starterCode: "let x = 1;",
        solutionCode: "let x = 1; let y = 2;",
      };

      const result = validateExecutableExample(invalid);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateExecutableExercise", () => {
    it("accepts a complete exercise adhering to the contract", () => {
      const exercise: ExecutableExercise = {
        title: "Filter Active Users",
        description: "Write a function to filter active users from a list",
        instructions: "Return an array of user objects where user.active is true.",
        starterCode: "function getActiveUsers(users) {\n  // your code\n}",
        solutionCode: "function getActiveUsers(users) {\n  return users.filter(u => Boolean(u && u.active));\n}",
        testCases: "Returns empty array for empty input; Filters out inactive users; Keeps active users",
        hints: "Use Array.prototype.filter to check the active property of each user.",
        difficulty: 2,
      };

      const result = validateExecutableExercise(exercise);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("rejects exercises without solutionCode", () => {
      const noSolution: ExecutableExercise = {
        title: "No Solution",
        description: "Exercise without working solution code",
        starterCode: "function test() {}",
        solutionCode: "",
        testCases: "Test 1 passes",
        hints: "Try using a loop to solve this problem.",
      };

      const result = validateExecutableExercise(noSolution);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Exercise solutionCode is required and must contain working code");
    });

    it("rejects exercises with placeholder solutionCode", () => {
      const placeholder: ExecutableExercise = {
        title: "Placeholder Solution",
        description: "Exercise with placeholder solution code",
        starterCode: "function test() {}",
        solutionCode: "// TODO implement here",
        testCases: "Test 1 passes",
        hints: "Check the documentation for hints.",
      };

      const result = validateExecutableExercise(placeholder);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Exercise solutionCode cannot be a placeholder string");
    });

    it("rejects exercises without testCases or hints", () => {
      const incomplete: ExecutableExercise = {
        title: "Incomplete Exercise",
        description: "Missing tests and hints",
        starterCode: "function calc() {}",
        solutionCode: "function calc() { return 42; }",
        testCases: "",
        hints: "",
      };

      const result = validateExecutableExercise(incomplete);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("validateExecutableTopic & assertExecutableTopic", () => {
    it("validates a complete topic object", () => {
      const topic: ExecutableTopic = {
        title: "ES Modules & Exports",
        description: "Learn modular JavaScript architecture with ES Modules",
        slug: "es-modules-exports",
        difficulty: 2,
        concepts: [
          { title: "Named Exports", description: "Export multiple variables or functions from a single module file." },
        ],
        examples: [
          {
            title: "Export Utility",
            description: "Exporting helper functions from math module",
            starterCode: "export function add(a, b) {}",
            solutionCode: "export function add(a, b) { return a + b; }",
          },
        ],
        exercises: [
          {
            title: "Build Math Module",
            description: "Create add and subtract functions with exports",
            instructions: "Export named functions add and subtract.",
            starterCode: "export function add(a, b) {}\nexport function subtract(a, b) {}",
            solutionCode: "export function add(a, b) { return a + b; }\nexport function subtract(a, b) { return a - b; }",
            testCases: "add(2, 3) returns 5; subtract(5, 2) returns 3",
            hints: "Use export function syntax and return computed values.",
            difficulty: 2,
          },
        ],
        lesson: {
          title: "ES Modules",
          content: "ES Modules provide a standardized format for modularizing JavaScript applications.",
          explanation: "This lesson covers named and default exports in ES modules.",
        },
      };

      const result = validateExecutableTopic(topic);
      expect(result.valid).toBe(true);
      expect(() => assertExecutableTopic(topic)).not.toThrow();
    });

    it("throws an error on contract violation", () => {
      const invalidTopic: any = {
        title: "Bad Topic",
        description: "Too short",
        slug: "",
        difficulty: 10,
        concepts: [],
        examples: [],
        exercises: [],
      };

      expect(() => assertExecutableTopic(invalidTopic)).toThrow("Executable Contract Violation");
    });
  });

  describe("parseTestCases", () => {
    it("parses semicolon-separated test cases", () => {
      const raw = "First test case; Second test case; Third test case";
      const parsed = parseTestCases(raw);
      expect(parsed).toHaveLength(3);
      expect(parsed[0].description).toBe("First test case");
      expect(parsed[1].description).toBe("Second test case");
      expect(parsed[2].description).toBe("Third test case");
    });

    it("parses newline-separated test cases", () => {
      const raw = "Line 1 test\nLine 2 test\nLine 3 test";
      const parsed = parseTestCases(raw);
      expect(parsed).toHaveLength(3);
      expect(parsed[0].description).toBe("Line 1 test");
    });

    it("handles empty or whitespace strings gracefully", () => {
      expect(parseTestCases("")).toEqual([]);
      expect(parseTestCases("   ")).toEqual([]);
    });
  });

  describe("Exercise Test Runner", () => {
    it("runs exercise tests and validates clean execution", async () => {
      const exercise: ExecutableExercise = {
        title: "Add Numbers",
        description: "Add two numbers and return sum",
        starterCode: "function add(a, b) {}",
        solutionCode: "function add(a, b) { return a + b; }\nconsole.log(add(2, 3));",
        testCases: "add(2, 3) returns 5; handles negative numbers",
        hints: "Use the plus operator to return the sum.",
        difficulty: 1,
      };

      const report = await verifyExerciseSolution(exercise, "javascript");
      expect(report.passed).toBe(true);
      expect(report.totalTests).toBe(2);
      expect(report.passedTests).toBe(2);
      expect(report.results).toHaveLength(2);
    });

    it("reports failure when code throws a runtime error", async () => {
      const exercise: ExecutableExercise = {
        title: "Error Exercise",
        description: "Code that throws an error",
        starterCode: "throw new Error('boom');",
        solutionCode: "throw new Error('boom');",
        testCases: "Should not crash",
        hints: "Fix the syntax or runtime error.",
        difficulty: 1,
      };

      const report = await runExerciseTests(exercise, "throw new Error('broken code');", "javascript");
      expect(report.passed).toBe(false);
      expect(report.passedTests).toBe(0);
      expect(report.error).toBeDefined();
    });
  });

  describe("Curriculum Phases Executable Contract Compliance", () => {
    it("all Phase 5 topics pass the executable contract", () => {
      for (const topic of phase5.topics) {
        const result = validateExecutableTopic(topic as any);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it("all Phase 6 topics pass the executable contract", () => {
      for (const topic of phase6.topics) {
        const result = validateExecutableTopic(topic as any);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it("all Phase 7 topics pass the executable contract", () => {
      for (const topic of phase7.topics) {
        const result = validateExecutableTopic(topic as any);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    it("all relocated Phase 3 AI topics pass the executable contract", () => {
      for (const topic of phase3AdvancedAI.topics) {
        const result = validateExecutableTopic(topic as any);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });
  });
});
