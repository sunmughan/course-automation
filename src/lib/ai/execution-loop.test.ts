import { describe, expect, it, vi } from "vitest";
import { executeJavaScript } from "@/lib/execution/sandbox";
import { assembleContext } from "@/lib/ai/protocol/context-assembly";
import { buildUserPrompt, buildSystemPrompt } from "@/lib/ai/protocol/instructions";
import { parseEducationalExplanation, formatStructuredOutputForDisplay } from "@/lib/ai/protocol/outputs";
import type { ExecutionResult, EducationalAIResponse } from "@/types";

describe("Wave 7: AI + Execution + Visualization Loop", () => {
  describe("End-to-End Teaching Loop Flow", () => {
    it("connects student code execution, event tracing, and contextual AI explanation", async () => {
      // Step 1: Student writes and runs code
      const studentCode = `
function calculateTax(income) {
  if (income > 50000) {
    return income * 0.2;
  }
  return income * 0.1;
}

const myTax = calculateTax(60000);
console.log(myTax);
`.trim();

      const executionResult = await executeJavaScript(studentCode, "javascript", { trace: true });

      // Verify execution output and events
      expect(executionResult.error).toBeNull();
      expect(executionResult.output).toContain("12000");
      expect(executionResult.events.length).toBeGreaterThan(0);

      // Step 2: Student asks about a specific line in the execution
      // Query: "Why did line 3 execute?" (return income * 0.2)
      const selectedLine = 3;
      const question = "Why did line 3 execute instead of line 5?";

      // Step 3: Context is assembled with code, execution result, events, and focus line
      const assembled = await assembleContext({
        userId: "test-student-123",
        code: studentCode,
        question,
        executionResult: {
          output: executionResult.output,
          error: executionResult.error,
          executionTime: executionResult.executionTime,
          memoryUsed: executionResult.memoryUsed,
          events: executionResult.events,
          selectedLine,
        },
      });

      // Verify that assembled context incorporates code, execution events, and the focus line
      expect(assembled.aiContext.currentCode).toBe(studentCode);
      expect(assembled.aiContext.executionResult?.output).toContain("12000");
      expect(assembled.aiContext.executionResult?.selectedLine).toBe(3);
      expect(assembled.aiContext.executionResult?.events?.length).toBeGreaterThan(0);

      // Step 4: Verify User & System Prompts carry the execution trace and causality context
      const userPrompt = buildUserPrompt(assembled.aiContext);
      expect(userPrompt).toContain("## Execution Context");
      expect(userPrompt).toContain("Output:");
      expect(userPrompt).toContain("12000");
      expect(userPrompt).toContain("Student is asking specifically about Line 3");
      expect(userPrompt).toContain("FUNCTION_CALL");
      expect(userPrompt).toContain(question);

      const systemPrompt = buildSystemPrompt("explain", assembled.aiContext);
      expect(systemPrompt).toContain("SkillForge AI Tutor");

      // Step 5: Simulate AI generating a structured educational response
      const mockAiOutput = JSON.stringify({
        type: "educational-explanation",
        answer: "Line 3 executed because the condition `income > 50000` evaluated to true when `income` was 60000.",
        explanation: "When `calculateTax(60000)` was called, the argument 60000 was passed as `income`. The `if` condition checked `60000 > 50000`, which is true, so the program entered the `if` branch at line 3 and returned 12000 immediately.",
        steps: [
          "calculateTax(60000) is called with income = 60000.",
          "Condition `income > 50000` evaluates to true (60000 > 50000).",
          "Line 3 `return income * 0.2` executes, computing 12000.",
          "The function exits immediately, skipping line 5.",
        ],
        visualization: {
          highlightLines: [3, 2],
          highlightEvents: [1, 2],
          focusVariable: "myTax",
        },
        executionExplanation: {
          whyExecuted: "Condition (income > 50000) evaluated to true (60000 > 50000).",
          variableChanges: [
            { variable: "income", to: 60000, reason: "Function argument passed" },
            { variable: "myTax", to: 12000, reason: "Return value assigned" },
          ],
          callStackExplanation: "calculateTax was top of the stack during execution of line 3.",
        },
        mistakes: ["Assuming the code after the if-block (line 5) always executes even after a return."],
        hints: ["Remember that a return statement immediately terminates the function."],
        practice: ["What would calculateTax(40000) return and which line would execute?"],
      });

      // Step 6: Parse structured educational response and verify visual highlights
      const parsed = parseEducationalExplanation(mockAiOutput);
      expect(parsed).not.toBeNull();
      expect(parsed?.answer).toContain("Line 3 executed");
      expect(parsed?.visualization?.highlightLines).toEqual([3, 2]);
      expect(parsed?.visualization?.focusVariable).toBe("myTax");
      expect(parsed?.executionExplanation?.whyExecuted).toContain("income > 50000");

      // Verify display formatting
      const display = formatStructuredOutputForDisplay(parsed!);
      expect(display).toContain("Line 3 executed");
      expect(display).toContain("Why This Executed");
      expect(display).toContain("Variable Changes");
      expect(display).toContain("Common Mistakes to Avoid");
    });
  });

  describe("Educational Response Schema & Visualization Target Parsing", () => {
    it("parses structured educational responses with line and event highlights", () => {
      const responseJson = {
        type: "educational-explanation",
        answer: "The loop terminated after 3 iterations.",
        explanation: "The loop variable `i` started at 0 and was incremented by 1 until `i < 3` became false at `i = 3`.",
        steps: ["i = 0", "i = 1", "i = 2", "i = 3 -> terminates"],
        visualization: {
          highlightLines: [1, 2],
          highlightEvents: [3, 5],
          focusVariable: "i",
        },
        executionExplanation: {
          whyExecuted: "Loop condition i < 3 was checked on each iteration.",
          variableChanges: [{ variable: "i", from: 2, to: 3, reason: "Increment operation" }],
        },
        mistakes: ["Off-by-one errors (using <= instead of <)"],
      };

      const parsed = parseEducationalExplanation(JSON.stringify(responseJson));
      expect(parsed).not.toBeNull();
      expect(parsed?.visualization?.highlightLines).toEqual([1, 2]);
      expect(parsed?.visualization?.highlightEvents).toEqual([3, 5]);
      expect(parsed?.executionExplanation?.variableChanges?.[0].variable).toBe("i");
    });

    it("gracefully handles unstructured or empty content", () => {
      const parsed = parseEducationalExplanation("Plain text response without json");
      expect(parsed).toBeNull();
    });
  });
});
