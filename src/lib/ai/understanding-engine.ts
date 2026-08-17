/**
 * Interactive Understanding Check & Diagnostic Evaluation Engine
 * Evaluates student answers to formative check questions, diagnoses misconceptions,
 * awards genuine mastery evidence, or triggers adaptive re-explanation with counter-examples.
 */

import { masteryEngine } from "@/lib/adaptive/mastery-engine";
import { aiRouter } from "@/lib/ai/router";

export interface UnderstandingCheckSubmission {
  userId: string;
  topicId: string;
  question: string;
  studentAnswer: string;
  selectedOptionIndex?: number;
  correctOptionIndex: number;
  options: string[];
}

export interface UnderstandingEvaluationResult {
  isCorrect: boolean;
  score: number;
  feedback: string;
  diagnosedMisconception?: string;
  reExplanation?: string;
  followUpQuestion?: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

export class UnderstandingEngine {
  public async evaluateAnswer(sub: UnderstandingCheckSubmission): Promise<UnderstandingEvaluationResult> {
    const isCorrect = sub.selectedOptionIndex === sub.correctOptionIndex;
    const score = isCorrect ? 100 : 30;

    // Record evidence in student mastery engine
    await masteryEngine.recordEvidence({
      userId: sub.userId,
      topicId: sub.topicId,
      type: "quiz",
      score,
      passed: isCorrect,
    });

    if (isCorrect) {
      return {
        isCorrect: true,
        score: 100,
        feedback: `Spot on! You correctly identified the core principle. Your mastery score has been updated.`,
      };
    }

    // If incorrect, diagnose student misconception via AI
    const studentChoice = sub.selectedOptionIndex !== undefined ? sub.options[sub.selectedOptionIndex] : sub.studentAnswer;
    const correctChoice = sub.options[sub.correctOptionIndex];

    const prompt = `A student answered an understanding-check question incorrectly.
QUESTION: "${sub.question}"
STUDENT ANSWER: "${studentChoice}"
CORRECT ANSWER: "${correctChoice}"

1. Diagnose why the student might have chosen their answer (identify the underlying misconception).
2. Provide a 2-sentence clarifying explanation with a simple analogy or counter-example.`;

    let feedback = "That option is not quite right because it does not maintain the expected invariant.";
    let diagnosedMisconception = "Assumed loose behavior without strict boundary checks";
    let reExplanation = "";

    try {
      const aiRes = await aiRouter.executeWithFallback(
        [
          { role: "system", content: "You are a master computer science tutor. Diagnose student misunderstandings with utmost empathy and precision." },
          { role: "user", content: prompt },
        ],
        { complexity: "low", userId: sub.userId, agent: "tutor", mode: "explain" }
      );
      feedback = aiRes.content;
      diagnosedMisconception = `Confused "${studentChoice}" with the guaranteed behavior of "${correctChoice}"`;
      reExplanation = aiRes.content;
    } catch {}

    return {
      isCorrect: false,
      score: 30,
      feedback,
      diagnosedMisconception,
      reExplanation,
      followUpQuestion: {
        question: `Let's verify again: Which mechanism directly prevents this mistake?`,
        options: [correctChoice, studentChoice, "None of the above", "Bypassing the check"],
        correctIndex: 0,
      },
    };
  }
}

export const understandingEngine = new UnderstandingEngine();
