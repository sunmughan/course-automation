import { describe, it, expect } from "vitest";
import { predictionEngine } from "@/lib/execution/prediction-engine";

describe("Predict -> Run -> Explain Active Learning Engine", () => {
  it("evaluates student predictions against actual sandbox execution output", async () => {
    const code = `
const a = 10;
const b = 20;
console.log("SUM:", a + b);
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_student_pred",
      code,
      language: "javascript",
      studentPrediction: "SUM: 30",
    });

    expect(result.actualOutput).toContain("SUM: 30");
    expect(result.isAccurate).toBe(true);
    expect(result.matchScore).toBeGreaterThanOrEqual(75);
    expect(result.runtimeExplanation).toBeTruthy();
  });

  it("identifies misconception when prediction diverges from runtime execution output", async () => {
    const code = `
let x = "5" + 2;
console.log("RESULT:", x);
`;

    const result = await predictionEngine.evaluatePrediction({
      userId: "test_student_coercion",
      code,
      language: "javascript",
      studentPrediction: "RESULT: 7",
    });

    expect(result.actualOutput).toContain("RESULT: 52");
    expect(result.isAccurate).toBe(false);
    expect(result.runtimeExplanation).toBeTruthy();
  });
});
