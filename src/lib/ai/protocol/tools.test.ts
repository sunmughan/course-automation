import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, routerMock } = vi.hoisted(() => ({
  prismaMock: {
    lesson: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    topic: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
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
  },
  routerMock: {
    executeWithFallback: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("../router", () => ({ aiRouter: routerMock }));

import {
  executeTool,
  TOOL_REGISTRY,
  getToolDefinitions,
  getToolDefinitionsForMode,
  parseToolCallFromResponse,
  formatToolsForSystemPrompt,
} from "./tools";

describe("Wave 3: AI Tool Safety and Sandbox Routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Task 3.1: Remove new Function() and execute via Sandbox", () => {
    it("executes safe JavaScript code through the sandbox and captures output", async () => {
      const toolResult = await executeTool("execute_code", {
        code: 'console.log("Hello from sandbox"); console.log(2 + 2);',
        language: "javascript",
      });

      expect(toolResult.success).toBe(true);
      const res = toolResult.result as { output: string; error: string | null; executionTime: number };
      expect(res.output).toContain("Hello from sandbox");
      expect(res.output).toContain("4");
      expect(res.error).toBeNull();
    });

    it("blocks access to Node process or dangerous globals via sandbox sanitization", async () => {
      const toolResult = await executeTool("execute_code", {
        code: 'process.exit(1);',
        language: "javascript",
      });

      expect(toolResult.success).toBe(true);
      const res = toolResult.result as { output: string; error: string | null };
      expect(res.error).toContain("disallowed API: process");
    });

    it("blocks eval and Function calls via sandbox sanitization", async () => {
      const toolResult = await executeTool("execute_code", {
        code: 'eval("console.log(123)");',
        language: "javascript",
      });

      expect(toolResult.success).toBe(true);
      const res = toolResult.result as { output: string; error: string | null };
      expect(res.error).toContain("disallowed API: eval()");
    });

    it("catches runtime errors in sandboxed execution without crashing process", async () => {
      const toolResult = await executeTool("execute_code", {
        code: 'const x = null; x.someMethod();',
        language: "javascript",
      });

      expect(toolResult.success).toBe(true);
      const res = toolResult.result as { output: string; error: string | null };
      expect(res.error).toBeTruthy();
    });
  });

  describe("Task 3.2: Real Concept Explanation via AI Gateway", () => {
    it("generates real concept explanation by delegating to AI Router with context", async () => {
      routerMock.executeWithFallback.mockResolvedValue({
        content: "A closure is a function bundled together with references to its surrounding lexical environment.",
        provider: "gemini",
        model: "gemini-3.7-flash",
        inputTokens: 80,
        outputTokens: 60,
        latency: 350,
        cost: 0.0002,
      });

      const toolResult = await executeTool("explain_concept", {
        concept: "Closures",
        level: "intermediate",
        course: "Advanced JavaScript",
        code: "function outer() { let x = 10; return function inner() { return x; }; }",
      });

      expect(toolResult.success).toBe(true);
      const res = toolResult.result as {
        concept: string;
        level: string;
        explanation: string;
        meta: { provider: string; model: string; latency: number };
      };

      expect(res.concept).toBe("Closures");
      expect(res.level).toBe("intermediate");
      expect(res.explanation).toContain("A closure is a function");
      expect(res.meta.provider).toBe("gemini");
      expect(routerMock.executeWithFallback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining('Please explain the concept: "Closures"'),
          }),
        ]),
        expect.objectContaining({
          complexity: "medium",
          agent: "teacher",
          mode: "explain",
        })
      );
    });

    it("includes lesson database context when lessonId is supplied", async () => {
      prismaMock.lesson.findUnique.mockResolvedValue({
        id: "les-1",
        title: "Introduction to Recursion",
        content: "Recursion is a method of solving problems where the solution depends on solutions to smaller instances.",
      });

      routerMock.executeWithFallback.mockResolvedValue({
        content: "Recursion is when a function calls itself until reaching a base condition.",
        provider: "nvidia",
        model: "deepseek-ai/deepseek-r1",
        inputTokens: 100,
        outputTokens: 75,
        latency: 400,
        cost: 0.0003,
      });

      const toolResult = await executeTool("explain_concept", {
        concept: "Base Case",
        level: "beginner",
        lessonId: "les-1",
      });

      expect(toolResult.success).toBe(true);
      expect(prismaMock.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: "les-1" },
        select: { title: true, content: true },
      });
      expect(routerMock.executeWithFallback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("Introduction to Recursion"),
          }),
        ]),
        expect.anything()
      );
    });
  });

  describe("Tool Registry & Protocol Utilities", () => {
    it("retrieves allowed tools by tutor mode", () => {
      const debugTools = getToolDefinitionsForMode("debug");
      expect(debugTools.map((t) => t.name)).toContain("execute_code");

      const explainTools = getToolDefinitionsForMode("explain");
      expect(explainTools.map((t) => t.name)).toContain("explain_concept");
      expect(explainTools.map((t) => t.name)).toContain("get_lesson_content");
    });

    it("parses valid tool call from model response text", () => {
      const response = 'Here is what happens:\n```json\n{ "tool_call": { "name": "execute_code", "arguments": { "code": "console.log(1)" } } }\n```';
      const parsed = parseToolCallFromResponse(response);
      expect(parsed).not.toBeNull();
      expect(parsed?.name).toBe("execute_code");
      expect(parsed?.arguments.code).toBe("console.log(1)");
    });

    it("returns null when model response has no tool call", () => {
      const response = "This is a direct answer with no tool call.";
      const parsed = parseToolCallFromResponse(response);
      expect(parsed).toBeNull();
    });

    it("formats tool definitions for system prompt with json instructions", () => {
      const tools = getToolDefinitions();
      const formatted = formatToolsForSystemPrompt(tools);
      expect(formatted).toContain("## Available Tools");
      expect(formatted).toContain("### execute_code");
      expect(formatted).toContain("### explain_concept");
      expect(formatted).toContain("tool_call");
    });

    it("returns error for unrecognized tool invocation", async () => {
      const res = await executeTool("non_existent_tool", {});
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unknown tool: non_existent_tool");
    });
  });
});
