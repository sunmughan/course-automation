/**
 * Predict -> Run -> Explain Active Learning Engine (Full Runtime Trace & State Evaluation)
 * Compares student's mental prediction & conceptual reasoning against actual AST sandbox
 * execution events, variable transitions, call stacks, and control flows.
 */

import { executeJavaScript } from "@/lib/execution/sandbox";
import { aiRouter } from "@/lib/ai/router";
import { masteryEngine } from "@/lib/adaptive/mastery-engine";
import type { ExecutionEvent, TraceStep } from "@/types";

export interface PredictionRequest {
  userId: string;
  topicId?: string;
  code: string;
  language: string;
  studentPrediction: string;
  predictedReasoning?: string;
  predictedError?: string;
  predictedControlFlow?: string[];
  predictedVariables?: Record<string, any>;
}

export interface StructuredStateComparison {
  outputAccuracy: number; // 0 - 100
  errorAccuracy: number; // 0 - 100
  controlFlowAccuracy: number; // 0 - 100
  stateAccuracy: number; // 0 - 100
  reasoningAccuracy: number; // 0 - 100
  overallAccuracy: number; // 0 - 100
  outputExactMatch: boolean;
  errorPredictedCorrectly: boolean;
  runtimeDivergenceReason?: string;
  misconceptionDetected?: string;
}

export interface PredictionResult {
  code: string;
  actualOutput: string;
  actualError?: string | null;
  studentPrediction: string;
  studentReasoning?: string;
  isAccurate: boolean;
  matchScore: number; // 0 - 100 (Overall Accuracy)
  runtimeExplanation: string;
  structuredComparison: StructuredStateComparison;
  executionEvents: ExecutionEvent[];
  traceSummary?: {
    totalSteps: number;
    functionCalls: number;
    variableChanges: number;
    loopIterations: number;
  };
  misconceptionDetected?: string;
}

export class PredictionEngine {
  public async evaluatePrediction(req: PredictionRequest): Promise<PredictionResult> {
    // 1. Run actual code in real execution sandbox WITH REAL TRACING ENABLED
    const execResult = await executeJavaScript(req.code, req.language, {
      trace: true,
    });

    const actualOutput = execResult.output?.trim() || "";
    const actualError = execResult.error?.trim() || null;
    const predictionTrimmed = req.studentPrediction.trim();
    const outputTrimmed = actualOutput;

    // 2. Compute exact output & error matching
    const outputExactMatch =
      outputTrimmed.length > 0 &&
      (outputTrimmed === predictionTrimmed ||
        outputTrimmed.toLowerCase() === predictionTrimmed.toLowerCase());

    const hasPredictedError = Boolean(
      req.predictedError ||
        predictionTrimmed.toLowerCase().includes("error") ||
        predictionTrimmed.toLowerCase().includes("throw")
    );
    const hasActualError = Boolean(actualError);

    let errorAccuracy = 100;
    if (hasActualError && hasPredictedError) errorAccuracy = 100;
    else if (!hasActualError && !hasPredictedError) errorAccuracy = 100;
    else if (hasActualError && !hasPredictedError) errorAccuracy = 0;
    else if (!hasActualError && hasPredictedError) errorAccuracy = 10;

    const outputAccuracy = outputExactMatch
      ? 100
      : outputTrimmed && predictionTrimmed && outputTrimmed.includes(predictionTrimmed)
      ? 60
      : hasActualError && hasPredictedError
      ? 100
      : 0;

    // 3. Extract real runtime trace steps & events
    const traceSteps: TraceStep[] = execResult.trace?.steps || [];
    const executionEvents: ExecutionEvent[] = execResult.events || [];

    const functionCalls = traceSteps.filter((s) => String(s.type).toLowerCase().includes("function_call") || String(s.type).toLowerCase().includes("callstack"));
    const varChanges = traceSteps.filter((s) => String(s.type).toLowerCase().includes("variable") || String(s.type).toLowerCase().includes("object"));
    const loopSteps = traceSteps.filter((s) => String(s.type).toLowerCase().includes("loop"));

    // 4. Deep AI Reasoning & State Comparison against real execution events
    const traceSummaryForAI = traceSteps.slice(0, 15).map((s) => ({
      step: s.step,
      line: s.line,
      type: s.type,
      description: s.description,
      callStack: s.callStack,
      state: s.state,
    }));

    const prompt = `You are a strict compiler and execution reasoning evaluator.
Evaluate a student's mental model prediction against real AST execution trace events.

SOURCE CODE:
\`\`\`${req.language}
${req.code}
\`\`\`

STUDENT PREDICTION: "${req.studentPrediction}"
STUDENT REASONING: "${req.predictedReasoning || "None provided"}"
ACTUAL RUNTIME OUTPUT: "${actualOutput || "No standard output"}"
ACTUAL RUNTIME ERROR: "${actualError || "None"}"

EXECUTION TRACE EVENTS:
${JSON.stringify(traceSummaryForAI, null, 2)}

EVALUATION CRITERIA:
1. Did the student's reasoning explain the TRUE runtime mechanism (lexical scope, call stack, async event loop, type coercion)?
2. If student gave the correct output but flawed reasoning (e.g., claiming a variable is global when it's closed-over), award high outputAccuracy but LOW reasoningAccuracy (<40).
3. If student gave incorrect output but showed sound conceptual understanding, award low outputAccuracy but MODERATE reasoningAccuracy (60-80).

Return ONLY valid JSON matching this schema:
{
  "reasoningAccuracy": number (0-100),
  "controlFlowAccuracy": number (0-100),
  "stateAccuracy": number (0-100),
  "misconceptionDetected": string or null,
  "runtimeExplanation": string
}`;

    let reasoningAccuracy = 50;
    let controlFlowAccuracy = outputExactMatch ? 90 : 40;
    let stateAccuracy = outputExactMatch ? 90 : 40;
    let misconceptionDetected: string | undefined;
    let runtimeExplanation = "";

    try {
      const aiRes = await aiRouter.executeWithFallback(
        [
          { role: "system", content: "You are an automated computer science execution evaluator. Output only valid JSON." },
          { role: "user", content: prompt },
        ],
        { complexity: "low", userId: req.userId, agent: "debugger", mode: "explain" }
      );

      const parsed = JSON.parse(aiRes.content.replace(/```json\n?|\n?```/g, "").trim());
      if (typeof parsed.reasoningAccuracy === "number") reasoningAccuracy = parsed.reasoningAccuracy;
      if (typeof parsed.controlFlowAccuracy === "number") controlFlowAccuracy = parsed.controlFlowAccuracy;
      if (typeof parsed.stateAccuracy === "number") stateAccuracy = parsed.stateAccuracy;
      if (parsed.misconceptionDetected) misconceptionDetected = parsed.misconceptionDetected;
      if (parsed.runtimeExplanation) runtimeExplanation = parsed.runtimeExplanation;
    } catch {
      // Deterministic rule-based evaluation fallback
      if (outputExactMatch) {
        const reasoningLower = (req.predictedReasoning || "").toLowerCase();
        // Check for common misconceptions in reasoning
        if (
          (req.code.includes("function") || req.code.includes("return")) &&
          reasoningLower.includes("global") &&
          !req.code.includes("global")
        ) {
          reasoningAccuracy = 20;
          misconceptionDetected = "Confused lexical/closure scope with global scope";
        } else {
          reasoningAccuracy = req.predictedReasoning ? 90 : 60;
        }
      } else {
        reasoningAccuracy = req.predictedReasoning && req.predictedReasoning.length > 10 ? 40 : 15;
        misconceptionDetected = `Expected "${predictionTrimmed}", but runtime evaluated to "${actualOutput || actualError}"`;
      }

      runtimeExplanation = outputExactMatch
        ? `Spot on! The runtime executed and produced "${actualOutput}".`
        : `The code produced "${actualOutput || actualError}" due to execution sequencing and state transitions.`;
    }

    // 5. Calculate composite Overall Accuracy
    // Formula: Output (35%) + Reasoning (35%) + Control Flow (15%) + State (15%)
    const overallAccuracy = Math.round(
      outputAccuracy * 0.35 +
        reasoningAccuracy * 0.35 +
        controlFlowAccuracy * 0.15 +
        stateAccuracy * 0.15
    );

    const isAccurate = overallAccuracy >= 75 && (!misconceptionDetected || reasoningAccuracy >= 60);

    const structuredComparison: StructuredStateComparison = {
      outputAccuracy,
      errorAccuracy,
      controlFlowAccuracy,
      stateAccuracy,
      reasoningAccuracy,
      overallAccuracy,
      outputExactMatch,
      errorPredictedCorrectly: hasActualError && hasPredictedError,
      runtimeDivergenceReason: !isAccurate ? misconceptionDetected : undefined,
      misconceptionDetected,
    };

    // 6. Record genuine learning evidence in mastery engine
    if (req.topicId) {
      await masteryEngine.recordEvidence({
        userId: req.userId,
        topicId: req.topicId,
        type: "code_execution",
        score: overallAccuracy,
        passed: isAccurate,
      });
    }

    return {
      code: req.code,
      actualOutput,
      actualError,
      studentPrediction: req.studentPrediction,
      studentReasoning: req.predictedReasoning,
      isAccurate,
      matchScore: overallAccuracy,
      runtimeExplanation,
      structuredComparison,
      executionEvents,
      traceSummary: {
        totalSteps: traceSteps.length,
        functionCalls: functionCalls.length,
        variableChanges: varChanges.length,
        loopIterations: loopSteps.length,
      },
      misconceptionDetected,
    };
  }
}

export const predictionEngine = new PredictionEngine();
