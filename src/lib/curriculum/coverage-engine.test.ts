import { describe, expect, it } from "vitest";
import {
  evaluateTopicDimensions,
  analyzeTopicCoverage,
  analyzeModuleCoverage,
  COVERAGE_DIMENSIONS,
  TOTAL_DIMENSIONS_COUNT,
  MANDATORY_DIMENSIONS,
  type CoverageDimension,
} from "@/lib/curriculum/coverage-engine";

// ── Helpers ──────────────────────────────────────────────────────────────

function makeFullTopic(overrides: Record<string, unknown> = {}) {
  return {
    id: "topic-full",
    title: "Closures in JavaScript",
    slug: "closures",
    difficulty: 3,
    prerequisites: [{ prerequisite: { id: "p1", title: "Functions" } }],
    lessons: [
      {
        id: "lesson-1",
        title: "Understanding Closures",
        content:
          "A closure is a function that retains access to its lexical scope even when the function is executed outside that scope. This is a foundational concept in JavaScript that appears in real-world production code, interviews, and advanced patterns.",
        explanation:
          "Closures allow inner functions to remember the environment in which they were created. This is practical in industry and avoids common mistakes and pitfalls.",
        concepts: [
          { title: "Lexical Scope", description: "Scope determined at author time" },
          { title: "Free Variables", description: "Variables from enclosing scope" },
          { title: "Closure Lifecycle", description: "When closures are garbage collected" },
        ],
        examples: [
          {
            title: "Counter Factory",
            description: "Demonstrates closure over a count variable",
            starterCode: "function makeCounter() {\n  // Your code here\n}",
            solutionCode:
              "function makeCounter() {\n  let count = 0;\n  return () => ++count;\n}\nconst counter = makeCounter();\nconsole.log(counter()); // 1",
          },
          {
            title: "Private State",
            description: "Closures for encapsulation",
            starterCode: "function createWallet(initial) {\n  // Your code here\n}",
            solutionCode:
              "function createWallet(initial) {\n  let balance = initial;\n  return { deposit(n) { balance += n; }, getBalance() { return balance; } };\n}",
          },
        ],
        exercises: [
          {
            title: "Build a Memoizer",
            description: "Use closures to cache function results",
            instructions: "Implement a memoize function",
            starterCode: "function memoize(fn) { /* ... */ }",
            solutionCode: "function memoize(fn) { const cache = {}; return (...args) => { const key = JSON.stringify(args); if (!(key in cache)) cache[key] = fn(...args); return cache[key]; }; }",
            testCases: "Test memoize caches results; Test cache hit returns same value; Test different arguments produce different results",
            hints: "Avoid re-computing expensive calculations. Common mistake: forgetting to serialize arguments correctly.",
            difficulty: 2,
          },
        ],
        visualizations: [
          {
            type: "flowchart",
            title: "Closure Memory Model",
            config: '{"nodes":[{"id":"outer","label":"Outer Scope"},{"id":"inner","label":"Inner Function"}],"edges":[{"from":"inner","to":"outer","label":"closure reference"}]}',
          },
        ],
        assessments: [
          {
            id: "a1",
            title: "Closure Quiz",
            questions: [{ question: "What is a closure?", correctAnswer: "A function with its lexical environment" }],
          },
        ],
      },
    ],
    ...overrides,
  };
}

function makeEmptyTopic(overrides: Record<string, unknown> = {}) {
  return {
    id: "topic-empty",
    title: "Empty Topic",
    slug: "empty-topic",
    difficulty: 2,
    prerequisites: [],
    lessons: [],
    ...overrides,
  };
}

function makePartialTopic(overrides: Record<string, unknown> = {}) {
  return {
    id: "topic-partial",
    title: "Partial Topic",
    slug: "partial-topic",
    difficulty: 1,
    prerequisites: [],
    lessons: [
      {
        id: "lesson-p",
        title: "Partial Lesson",
        content: "Some basic theory content that is long enough to pass length checks for the theory dimension.",
        explanation: "A brief explanation of the partial concept.",
        concepts: [],
        examples: [
          {
            title: "Single Example",
            description: "One example",
            starterCode: "const x = 1;",
            solutionCode: "const x = 1;\nconsole.log(x);",
          },
        ],
        exercises: [],
        visualizations: [],
        assessments: [],
      },
    ],
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────

describe("Wave 8: Curriculum Coverage Engine", () => {
  describe("Coverage Dimension Configuration", () => {
    it("defines exactly 14 coverage dimensions", () => {
      expect(TOTAL_DIMENSIONS_COUNT).toBe(14);
      expect(Object.keys(COVERAGE_DIMENSIONS)).toHaveLength(14);
    });

    it("identifies 8 mandatory dimensions", () => {
      expect(MANDATORY_DIMENSIONS).toContain("theory");
      expect(MANDATORY_DIMENSIONS).toContain("prerequisites");
      expect(MANDATORY_DIMENSIONS).toContain("simpleExample");
      expect(MANDATORY_DIMENSIONS).toContain("interactive");
      expect(MANDATORY_DIMENSIONS).toContain("visualization");
      expect(MANDATORY_DIMENSIONS).toContain("execution");
      expect(MANDATORY_DIMENSIONS).toContain("practice");
      expect(MANDATORY_DIMENSIONS).toContain("assessment");
      expect(MANDATORY_DIMENSIONS).toHaveLength(8);
    });

    it("identifies 6 optional (recommended) dimensions", () => {
      const optional = (Object.keys(COVERAGE_DIMENSIONS) as CoverageDimension[]).filter(
        (d) => !COVERAGE_DIMENSIONS[d].isMandatory
      );
      expect(optional).toContain("multipleExamples");
      expect(optional).toContain("commonMistakes");
      expect(optional).toContain("realWorld");
      expect(optional).toContain("advanced");
      expect(optional).toContain("production");
      expect(optional).toContain("interview");
      expect(optional).toHaveLength(6);
    });
  });

  describe("evaluateTopicDimensions", () => {
    it("evaluates a fully-covered topic as satisfied on all 14 dimensions", () => {
      const topic = makeFullTopic();
      const dims = evaluateTopicDimensions(topic);

      for (const [key, val] of Object.entries(dims)) {
        expect(val.satisfied, `Dimension ${key} should be satisfied`).toBe(true);
      }
    });

    it("evaluates an empty topic as unsatisfied on all mandatory dimensions", () => {
      const topic = makeEmptyTopic();
      const dims = evaluateTopicDimensions(topic);

      for (const mandatoryKey of MANDATORY_DIMENSIONS) {
        if (mandatoryKey === "prerequisites") continue; // difficulty=2 doesn't get auto-pass
        expect(
          dims[mandatoryKey].satisfied,
          `Mandatory dimension ${mandatoryKey} should NOT be satisfied`
        ).toBe(false);
      }
    });

    it("returns evidence strings for each dimension", () => {
      const topic = makeFullTopic();
      const dims = evaluateTopicDimensions(topic);

      for (const val of Object.values(dims)) {
        expect(val.evidence).toBeDefined();
        expect(typeof val.evidence).toBe("string");
        expect(val.evidence!.length).toBeGreaterThan(0);
      }
    });
  });

  describe("analyzeTopicCoverage", () => {
    it("gives complete status and high percentage for a fully-covered topic", () => {
      const report = analyzeTopicCoverage(makeFullTopic());
      expect(report.satisfiedCount).toBe(14);
      expect(report.percentage).toBe(100);
      expect(report.isComplete).toBe(true);
      expect(report.status).toBe("complete");
      expect(report.missingArtifacts).toHaveLength(0);
      expect(report.mandatoryMissing).toHaveLength(0);
    });

    it("gives minimal status and 0% for an empty topic", () => {
      const report = analyzeTopicCoverage(makeEmptyTopic());
      expect(report.percentage).toBeLessThan(40);
      expect(report.isComplete).toBe(false);
      expect(report.status).toBe("minimal");
      expect(report.missingArtifacts.length).toBeGreaterThan(0);
      expect(report.mandatoryMissing.length).toBeGreaterThan(0);
    });

    it("gives incomplete status for a partially-covered topic", () => {
      const report = analyzeTopicCoverage(makePartialTopic());
      expect(report.percentage).toBeGreaterThan(0);
      expect(report.percentage).toBeLessThan(100);
      expect(report.isComplete).toBe(false);
      expect(report.missingArtifacts.length).toBeGreaterThan(0);
    });

    it("lists specific mandatory missing artifacts by label", () => {
      const report = analyzeTopicCoverage(makeEmptyTopic());
      // Empty topic should be missing Theory, Simple Example, Interactive, etc.
      expect(report.mandatoryMissing).toContain("Theory");
      expect(report.mandatoryMissing).toContain("Simple Example");
      expect(report.mandatoryMissing).toContain("Practice");
    });

    it("correctly computes percentage as (satisfied / 14) * 100", () => {
      const report = analyzeTopicCoverage(makePartialTopic());
      const expectedPct = Math.round((report.satisfiedCount / 14) * 100);
      expect(report.percentage).toBe(expectedPct);
    });
  });

  describe("analyzeModuleCoverage", () => {
    it("aggregates multiple topics into a module report", () => {
      const module = {
        id: "mod-1",
        title: "JavaScript Core",
        slug: "javascript-core",
        topics: [makeFullTopic(), makeEmptyTopic(), makePartialTopic()],
      };

      const report = analyzeModuleCoverage(module);
      expect(report.topicCount).toBe(3);
      expect(report.completeTopicCount).toBe(1); // only the full topic
      expect(report.isComplete).toBe(false);
      expect(report.percentage).toBeGreaterThan(0);
      expect(report.percentage).toBeLessThan(100);
    });

    it("reports isComplete=true when all topics are complete", () => {
      const module = {
        id: "mod-2",
        title: "All Complete",
        slug: "all-complete",
        topics: [makeFullTopic(), makeFullTopic({ id: "topic-full-2", slug: "closures-2" })],
      };

      const report = analyzeModuleCoverage(module);
      expect(report.isComplete).toBe(true);
      expect(report.completeTopicCount).toBe(2);
      expect(report.percentage).toBe(100);
    });

    it("provides missingArtifactsSummary counting how many topics lack each artifact", () => {
      const module = {
        id: "mod-3",
        title: "Mixed",
        slug: "mixed",
        topics: [makeEmptyTopic(), makeEmptyTopic({ id: "topic-empty-2", slug: "empty-2" })],
      };

      const report = analyzeModuleCoverage(module);
      // Both topics are empty so "Theory" should appear 2x in summary
      expect(report.missingArtifactsSummary["Theory"]).toBe(2);
    });

    it("handles empty modules gracefully", () => {
      const report = analyzeModuleCoverage({ id: "mod-empty", title: "Empty", slug: "empty", topics: [] });
      expect(report.topicCount).toBe(0);
      expect(report.percentage).toBe(0);
      expect(report.isComplete).toBe(false);
    });
  });

  describe("Publishing guard logic", () => {
    it("prevents false complete status when mandatory artifacts are missing", () => {
      const topic = makePartialTopic();
      const report = analyzeTopicCoverage(topic);
      // Partial topic is missing mandatory items
      expect(report.mandatoryMissing.length).toBeGreaterThan(0);
      expect(report.isComplete).toBe(false);
    });

    it("does not block when all mandatory artifacts exist", () => {
      const report = analyzeTopicCoverage(makeFullTopic());
      expect(report.mandatoryMissing).toHaveLength(0);
      expect(report.isComplete).toBe(true);
    });
  });
});
