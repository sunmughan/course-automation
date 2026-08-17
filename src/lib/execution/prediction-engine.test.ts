import { describe, it, expect } from "vitest";
import { predictionEngine } from "@/lib/execution/prediction-engine";

describe("Predict -> Run -> Explain Active Learning Engine (Phase 32 Real Execution Trace)", () => {

  // Test A: Correct output + correct reasoning
  it("A. awards high output and high reasoning accuracy for correct prediction and sound mental model", async () => {
    const code = `
const a = 10;
const b = 20;
console.log("SUM:", a + b);
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_std_A",
      code,
      language: "javascript",
      studentPrediction: "SUM: 30",
      predictedReasoning: "Variables a and b are summed sequentially and logged to standard output.",
    });

    expect(result.actualOutput).toBe("SUM: 30");
    expect(result.structuredComparison.outputAccuracy).toBe(100);
    expect(result.structuredComparison.reasoningAccuracy).toBeGreaterThanOrEqual(70);
    expect(result.isAccurate).toBe(true);
    expect(result.executionEvents.length).toBeGreaterThan(0);
  });

  // Test B: Correct output + wrong reasoning (Crucial edge case)
  it("B. detects misconception and lowers reasoning score when output is correct but explanation is flawed", async () => {
    const code = `
function createCounter() {
  let count = 5;
  return function() {
    count += 1;
    return count;
  };
}
const counter = createCounter();
console.log("COUNT:", counter());
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_std_B",
      code,
      language: "javascript",
      studentPrediction: "COUNT: 6",
      predictedReasoning: "count is a global variable shared across the entire window scope.",
    });

    expect(result.actualOutput).toBe("COUNT: 6");
    expect(result.structuredComparison.outputAccuracy).toBe(100);
    // Reasoning accuracy must be low due to flawed global variable assumption
    expect(result.structuredComparison.reasoningAccuracy).toBeLessThan(60);
    expect(result.misconceptionDetected).toBeTruthy();
  });

  // Test C: Wrong output + partially correct reasoning
  it("C. evaluates wrong output with partial reasoning soundness", async () => {
    const code = `
let x = "5" + 2;
console.log("RESULT:", x);
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_std_C",
      code,
      language: "javascript",
      studentPrediction: "RESULT: 7",
      predictedReasoning: "The + operator performs arithmetic addition on numeric operands.",
    });

    expect(result.actualOutput).toBe("RESULT: 52");
    expect(result.structuredComparison.outputAccuracy).toBe(0);
    expect(result.isAccurate).toBe(false);
  });

  // Test D: Wrong output + wrong reasoning
  it("D. assigns low composite score for both wrong output and wrong reasoning", async () => {
    const code = `
let y = 10 * 3;
console.log("VAL:", y);
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_std_D",
      code,
      language: "javascript",
      studentPrediction: "VAL: 13",
      predictedReasoning: "Multiplication adds 3 to 10.",
    });

    expect(result.actualOutput).toBe("VAL: 30");
    expect(result.structuredComparison.outputAccuracy).toBe(0);
    expect(result.structuredComparison.reasoningAccuracy).toBeLessThan(50);
    expect(result.isAccurate).toBe(false);
  });

  // Test E: Correctly predicted runtime error
  it("E. accurately evaluates predicted runtime errors", async () => {
    const code = `
const obj = null;
console.log(obj.nonExistentProperty.sub);
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_std_E",
      code,
      language: "javascript",
      studentPrediction: "Throws TypeError",
      predictedReasoning: "Cannot read properties of null object.",
    });

    expect(result.actualError).toBeTruthy();
    expect(result.structuredComparison.errorAccuracy).toBe(100);
    expect(result.structuredComparison.errorPredictedCorrectly).toBe(true);
  });

  // Test F: Incorrect error prediction
  it("F. detects when student mistakenly predicts an error for valid code", async () => {
    const code = `
const arr = [1, 2, 3];
console.log("LENGTH:", arr.length);
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_std_F",
      code,
      language: "javascript",
      studentPrediction: "Runtime error",
    });

    expect(result.actualError).toBeNull();
    expect(result.structuredComparison.errorAccuracy).toBeLessThanOrEqual(50);
  });

  // Test G: Closure / lexical scope execution trace
  it("G. captures real closure scope execution trace steps", async () => {
    const code = `
function outer() {
  const secret = 42;
  return () => secret;
}
const getSecret = outer();
console.log("SECRET:", getSecret());
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_std_G",
      code,
      language: "javascript",
      studentPrediction: "SECRET: 42",
      predictedReasoning: "Lexical closure preserves secret variable binding.",
    });

    expect(result.actualOutput).toBe("SECRET: 42");
    expect(result.executionEvents.length).toBeGreaterThan(0);
    expect(result.traceSummary).toBeDefined();
    expect(result.traceSummary?.totalSteps).toBeGreaterThan(0);
  });

  // Test H: Function call + return + call stack
  it("H. captures function call and return events in trace", async () => {
    const code = `
function double(n) {
  return n * 2;
}
console.log("RES:", double(4));
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_std_H",
      code,
      language: "javascript",
      studentPrediction: "RES: 8",
    });

    expect(result.actualOutput).toBe("RES: 8");
    expect(result.traceSummary?.functionCalls).toBeGreaterThanOrEqual(1);
  });

  // Test I: Condition branch
  it("I. verifies conditional branch evaluation trace", async () => {
    const code = `
const score = 85;
if (score >= 80) {
  console.log("GRADE: PASS");
} else {
  console.log("GRADE: FAIL");
}
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_std_I",
      code,
      language: "javascript",
      studentPrediction: "GRADE: PASS",
    });

    expect(result.actualOutput).toBe("GRADE: PASS");
    expect(result.structuredComparison.outputExactMatch).toBe(true);
  });

  // Test J: Loop iteration
  it("J. tracks loop iteration execution trace steps", async () => {
    const code = `
let sum = 0;
for (let i = 1; i <= 3; i++) {
  sum += i;
}
console.log("TOTAL:", sum);
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_std_J",
      code,
      language: "javascript",
      studentPrediction: "TOTAL: 6",
    });

    expect(result.actualOutput).toBe("TOTAL: 6");
    expect(result.traceSummary?.loopIterations).toBeGreaterThanOrEqual(1);
  });

  // Test K: Async / Promise execution
  it("K. traces asynchronous promise execution flow", async () => {
    const code = `
async function fetchNumber() {
  return 99;
}
const val = await fetchNumber();
console.log("PROMISE_VAL:", val);
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_std_K",
      code,
      language: "javascript",
      studentPrediction: "PROMISE_VAL: 99",
    });

    expect(result.actualOutput).toContain("PROMISE_VAL: 99");
  });

  // Test L: Multiple console outputs
  it("L. preserves sequence across multiple console outputs", async () => {
    const code = `
console.log("FIRST");
console.log("SECOND");
console.log("THIRD");
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_std_L",
      code,
      language: "javascript",
      studentPrediction: "FIRST\nSECOND\nTHIRD",
    });

    expect(result.actualOutput).toBe("FIRST\nSECOND\nTHIRD");
    expect(result.structuredComparison.outputExactMatch).toBe(true);
  });

  // Test M: Variable mutation
  it("M. tracks variable mutation and reassignments across execution steps", async () => {
    const code = `
let counter = 10;
counter = 20;
counter = counter + 5;
console.log("FINAL:", counter);
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_std_M",
      code,
      language: "javascript",
      studentPrediction: "FINAL: 25",
    });

    expect(result.actualOutput).toBe("FINAL: 25");
    expect(result.traceSummary?.variableChanges).toBeGreaterThanOrEqual(2);
  });
});
