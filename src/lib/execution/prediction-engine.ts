/**
 * Predict -> Run -> Explain Active Learning Engine
 * Compares student's mental model prediction against real AST sandbox execution output,
 * evaluates discrepancies, and explains underlying runtime mechanics.
 */

import { executeJavaScript } from "@/lib/execution/sandbox";
import { aiRouter } from "@/lib/ai/router";
import { masteryEngine } from "@/lib/adaptive/mastery-engine";

export interface PredictionRequest {
  userId: string;
  topicId?: string;
  code: string;
  language: string;
  studentPrediction: string;
}

export interface PredictionResult {
  code: string;
  actualOutput: string;
  actualError?: string | null;
  studentPrediction: string;
  isAccurate: boolean;
  matchScore: number; // 0 - 100
  runtimeExplanation: string;
  misconceptionDetected?: string;
}

export class PredictionEngine {
  public async evaluatePrediction(req: PredictionRequest): Promise<PredictionResult> {
    // 1. Run actual code in real execution sandbox
    const execResult = await executeJavaScript(req.code, req.language, {
      trace: true,
    });

    const actualOutput = execResult.output?.trim() || "";
    const actualError = execResult.error?.trim() || null;
    const predictionTrimmed = req.studentPrediction.trim().toLowerCase();
    const outputTrimmed = actualOutput.toLowerCase();

    // 2. Compute similarity match
    const isDirectMatch = outputTrimmed.includes(predictionTrimmed) || predictionTrimmed.includes(outputTrimmed);
    let matchScore = isDirectMatch ? 90 : 35;
    if (actualError && predictionTrimmed.includes("error")) matchScore = 85;

    const isAccurate = matchScore >= 75;

    // 3. AI analysis of mental model vs runtime reality
    let runtimeExplanation = "";
    let misconceptionDetected: string | undefined;

    const prompt = `A student made a mental prediction about code execution:
CODE:
\`\`\`${req.language}
${req.code}
\`\`\`

STUDENT PREDICTION: "${req.studentPrediction}"
ACTUAL RUNTIME OUTPUT: "${actualOutput || actualError || "No output"}"
ACCURATE: ${isAccurate ? "Yes" : "No"}

Explain in 2-3 concise sentences:
1. Why the runtime produced the actual output (mention call stack, event loop, or scope if relevant).
2. If the student was incorrect, explain the mental model gap.`;

    try {
      const aiRes = await aiRouter.executeWithFallback(
        [
          { role: "system", content: "You are an expert compiler & execution analyzer. Explain runtime discrepancies with crystal clarity." },
          { role: "user", content: prompt },
        ],
        { complexity: "low", userId: req.userId, agent: "debugger", mode: "explain" }
      );
      runtimeExplanation = aiRes.content;
      if (!isAccurate) {
        misconceptionDetected = "Mental model diverged from asynchronous execution order or scope evaluation";
      }
    } catch {
      runtimeExplanation = isAccurate
        ? `Spot on! The runtime executed the code exactly as you anticipated, producing: ${actualOutput}.`
        : `The code produced "${actualOutput || actualError}" because JavaScript evaluates expressions sequentially and handles asynchronous turns in microtask/macrotask queues.`;
    }

    // 4. Record genuine learning evidence in mastery engine
    if (req.topicId) {
      await masteryEngine.recordEvidence({
        userId: req.userId,
        topicId: req.topicId,
        type: "code_execution",
        score: matchScore,
        passed: isAccurate,
      });
    }

    return {
      code: req.code,
      actualOutput,
      actualError,
      studentPrediction: req.studentPrediction,
      isAccurate,
      matchScore,
      runtimeExplanation,
      misconceptionDetected,
    };
  }
}

export const predictionEngine = new PredictionEngine();
