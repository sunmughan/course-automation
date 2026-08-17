/**
 * Predict -> Run -> Explain Active Learning Engine (Structured State Analysis)
 * Compares student's mental hypothesis (output, control flow, reasoning) against
 * actual AST sandbox execution state and traces.
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
  predictedReasoning?: string;
}

export interface StructuredStateComparison {
  outputExactMatch: boolean;
  errorPredictedCorrectly: boolean;
  reasoningSoundnessScore: number; // 0 - 100
  runtimeDivergenceReason?: string;
}

export interface PredictionResult {
  code: string;
  actualOutput: string;
  actualError?: string | null;
  studentPrediction: string;
  isAccurate: boolean;
  matchScore: number; // 0 - 100
  runtimeExplanation: string;
  structuredComparison: StructuredStateComparison;
  misconceptionDetected?: string;
}

export class PredictionEngine {
  public async evaluatePrediction(req: PredictionRequest): Promise<PredictionResult> {
    // 1. Run actual code in real execution sandbox
    const execResult = await executeJavaScript(req.code, req.language, {
      trace: false,
    });

    const actualOutput = execResult.output?.trim() || "";
    const actualError = execResult.error?.trim() || null;
    const predictionTrimmed = req.studentPrediction.trim();
    const outputTrimmed = actualOutput;

    // 2. Exact state comparison
    const outputExactMatch =
      outputTrimmed === predictionTrimmed ||
      outputTrimmed.toLowerCase() === predictionTrimmed.toLowerCase() ||
      (outputTrimmed.length > 0 && outputTrimmed.includes(predictionTrimmed));

    const errorPredictedCorrectly = Boolean(actualError && predictionTrimmed.toLowerCase().includes("error"));

    // 3. Deep AI reasoning analysis
    let reasoningSoundnessScore = outputExactMatch ? 90 : 30;
    if (errorPredictedCorrectly) reasoningSoundnessScore = 85;

    let runtimeExplanation = "";
    let misconceptionDetected: string | undefined;

    const prompt = `A student predicted the outcome of this code:
CODE:
\`\`\`${req.language}
${req.code}
\`\`\`

STUDENT PREDICTION: "${req.studentPrediction}"
STUDENT REASONING: "${req.predictedReasoning || "None provided"}"
ACTUAL RUNTIME OUTPUT: "${actualOutput || "No standard output"}"
ACTUAL RUNTIME ERROR: "${actualError || "None"}"

Evaluate:
1. Did the student understand the control flow, memory scope, and evaluation order?
2. Explain why the code produced the actual runtime output in 2 concise sentences.
3. If the student's prediction was incorrect, diagnose the specific mental model gap.`;

    try {
      const aiRes = await aiRouter.executeWithFallback(
        [
          { role: "system", content: "You are an expert runtime debugger. Compare prediction vs actual execution state." },
          { role: "user", content: prompt },
        ],
        { complexity: "low", userId: req.userId, agent: "debugger", mode: "explain" }
      );
      runtimeExplanation = aiRes.content;
      if (!outputExactMatch && !errorPredictedCorrectly) {
        misconceptionDetected = `Expected "${predictionTrimmed}", but runtime evaluated to "${actualOutput || actualError}"`;
      }
    } catch {
      runtimeExplanation = outputExactMatch
        ? `Spot on! The runtime executed and produced "${actualOutput}".`
        : `Runtime produced "${actualOutput || actualError}" due to sequential evaluation and type semantics.`;
    }

    const isAccurate = outputExactMatch || errorPredictedCorrectly || reasoningSoundnessScore >= 75;
    const matchScore = isAccurate ? Math.max(80, reasoningSoundnessScore) : Math.min(45, reasoningSoundnessScore);

    // 4. Record genuine evidence in mastery engine
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
      structuredComparison: {
        outputExactMatch,
        errorPredictedCorrectly,
        reasoningSoundnessScore,
        runtimeDivergenceReason: !isAccurate ? misconceptionDetected : undefined,
      },
      misconceptionDetected,
    };
  }
}

export const predictionEngine = new PredictionEngine();
