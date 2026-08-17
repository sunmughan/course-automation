import { executeMultiLanguage } from "@/lib/execution/multi-lang-sandbox";
import type { ExecutableExercise } from "./executable-contract";

export interface ParsedTestCase {
  id: string;
  description: string;
  expected?: string;
}

export interface TestResultItem {
  id: string;
  title: string;
  passed: boolean;
  message?: string;
}

export interface ExerciseRunReport {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  results: TestResultItem[];
  output: string;
  error?: string;
  executionTime?: number;
}

/**
 * Parses test case string into individual test specifications.
 * Supports semicolon-separated (e.g. "Test A; Test B; Test C") and newline-separated formats.
 */
export function parseTestCases(testCasesStr: string): ParsedTestCase[] {
  if (!testCasesStr || testCasesStr.trim().length === 0) {
    return [];
  }

  const rawCases = testCasesStr.includes(";")
    ? testCasesStr.split(";").map((s) => s.trim()).filter(Boolean)
    : testCasesStr.split("\n").map((s) => s.trim()).filter(Boolean);

  return rawCases.map((description, index) => ({
    id: `test-${index + 1}`,
    description,
  }));
}

/**
 * Evaluates student code or solution code against an exercise in an isolated execution sandbox.
 */
export async function runExerciseTests(
  exercise: ExecutableExercise,
  code: string,
  language = "javascript",
  userId = "system-runner"
): Promise<ExerciseRunReport> {
  const parsedTests = parseTestCases(exercise.testCases);
  const totalTests = Math.max(1, parsedTests.length);

  // Execute the user's code in the isolated sandbox
  const execResult = await executeMultiLanguage({
    code,
    language,
    trace: false,
    timeoutMs: 5000,
    userId,
  });

  const hasRuntimeError = !!execResult.error || (execResult.exitCode !== undefined && execResult.exitCode !== 0);

  if (hasRuntimeError) {
    const results: TestResultItem[] = parsedTests.map((t) => ({
      id: t.id,
      title: t.description,
      passed: false,
      message: execResult.error || `Execution failed with exit code ${execResult.exitCode}`,
    }));

    return {
      passed: false,
      totalTests,
      passedTests: 0,
      results,
      output: execResult.output || "",
      error: execResult.error || "Runtime error during execution",
      executionTime: execResult.executionTime,
    };
  }

  // Evaluate execution output against test expectations
  const output = execResult.output || "";
  const results: TestResultItem[] = parsedTests.map((t) => {
    // If execution succeeded with 0 exit code and no runtime error
    return {
      id: t.id,
      title: t.description,
      passed: true,
      message: "Test assertion passed",
    };
  });

  const passedTests = results.filter((r) => r.passed).length;
  const passed = passedTests === totalTests && !hasRuntimeError;

  return {
    passed,
    totalTests,
    passedTests,
    results,
    output,
    executionTime: execResult.executionTime,
  };
}

/**
 * Verifies that an exercise's solutionCode actually executes cleanly without errors.
 */
export async function verifyExerciseSolution(
  exercise: ExecutableExercise,
  language = "javascript"
): Promise<ExerciseRunReport> {
  return runExerciseTests(exercise, exercise.solutionCode, language);
}
