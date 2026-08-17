import { prisma } from "@/lib/db";
import { aiRouter } from "@/lib/ai/router";
import { SkillEvaluationService } from "@/lib/adaptive/skill-evaluation";
import { z } from "zod";

export interface InterviewRubricScores {
  technicalAccuracy: number;
  problemSolving: number;
  depth: number;
  communication: number;
  overallTurnScore: number;
}

export interface InterviewTurnEvaluation extends InterviewRubricScores {
  evaluatorFeedback: string;
  strengths: string[];
  improvements: string[];
  followUpQuestion?: string;
  recommendedDifficultyAdjustment: "increase" | "maintain" | "decrease";
}

export interface StartInterviewParams {
  userId: string;
  topicId?: string;
  courseId?: string;
  role?: string;
  targetLevel?: "junior" | "mid" | "senior" | "staff";
  initialDifficulty?: number;
}

export interface SubmitAnswerParams {
  sessionId: string;
  turnId: string;
  userId: string;
  candidateAnswer: string;
}

const EvaluationOutputSchema = z.object({
  technicalAccuracy: z.number().min(0).max(100),
  problemSolving: z.number().min(0).max(100),
  depth: z.number().min(0).max(100),
  communication: z.number().min(0).max(100),
  overallTurnScore: z.number().min(0).max(100),
  evaluatorFeedback: z.string().min(10),
  strengths: z.array(z.string()).min(1),
  improvements: z.array(z.string()).min(1),
  followUpQuestion: z.string().optional(),
  recommendedDifficultyAdjustment: z.enum(["increase", "maintain", "decrease"]).default("maintain"),
});

const QuestionOutputSchema = z.object({
  question: z.string().min(15),
  questionType: z.enum(["conceptual", "system_design", "coding_analysis", "debugging_scenario", "behavioral_technical"]).default("conceptual"),
  focusTopic: z.string().default("general"),
});

export class InterviewEngine {
  /**
   * Generates an adaptive interview question tailored to role, level, difficulty, and conversation history.
   */
  static async generateQuestion(params: {
    role: string;
    targetLevel: string;
    topicTitle: string;
    difficulty: number;
    turnNumber: number;
    previousTurns?: Array<{ question: string; answer?: string | null; score?: number | null }>;
  }): Promise<{ question: string; questionType: string }> {
    const { role, targetLevel, topicTitle, difficulty, turnNumber, previousTurns = [] } = params;

    const historySummary = previousTurns.length > 0
      ? previousTurns.map((t, idx) => `Turn ${idx + 1}: Q: "${t.question}" | Ans: "${t.answer || 'N/A'}" (Score: ${t.score ?? 'N/A'}%)`).join("\n")
      : "Opening interview question.";

    const systemPrompt = `You are a Senior Principal Technical Interviewer conducting a mock interview for a ${targetLevel} ${role}.
Generate an insightful, realistic technical interview question.

CRITICAL REQUIREMENTS:
1. Return ONLY valid, raw JSON with no markdown wrapping or extra commentary.
2. The JSON must match this exact schema:
{
  "question": "The interview question for the candidate",
  "questionType": "conceptual" | "system_design" | "coding_analysis" | "debugging_scenario" | "behavioral_technical",
  "focusTopic": "Primary topic/concept being tested"
}
3. Difficulty scale: Level ${difficulty} of 5.
4. Target Topic: "${topicTitle}".
5. Do NOT repeat previous questions. Build logically on the interview progression.`;

    const userPrompt = `Generate interview question for Turn ${turnNumber}:
- Role: ${targetLevel} ${role}
- Focus Topic: ${topicTitle}
- Target Difficulty: Level ${difficulty}/5
- Previous Context:
${historySummary}`;

    try {
      const response = await aiRouter.executeWithFallback([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ], { complexity: "medium", temperature: 0.4 });

      const raw = response.content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(raw);
      const validated = QuestionOutputSchema.parse(parsed);

      return {
        question: validated.question,
        questionType: validated.questionType,
      };
    } catch (err) {
      console.warn("[InterviewEngine] Falling back to default question generator:", err);
      return this.createFallbackQuestion(topicTitle, difficulty, turnNumber);
    }
  }

  /**
   * Evaluates a candidate's answer against the 4 core dimensions.
   */
  static async evaluateAnswer(params: {
    role: string;
    targetLevel: string;
    topicTitle: string;
    question: string;
    candidateAnswer: string;
    difficulty: number;
  }): Promise<InterviewTurnEvaluation> {
    const { role, targetLevel, topicTitle, question, candidateAnswer, difficulty } = params;

    const systemPrompt = `You are an expert technical hiring manager evaluating a ${targetLevel} ${role} candidate.
Grade the candidate's response across 4 distinct dimensions on a 0-100 scale:
1. technicalAccuracy: Precision of technical facts, correct APIs, algorithms, and syntax.
2. problemSolving: Logical reasoning, handling of constraints, architectural decomposition.
3. depth: Awareness of trade-offs, internal implementation details, edge cases, performance.
4. communication: Clarity, structure, terminology, and conciseness.

CRITICAL REQUIREMENTS:
1. Return ONLY valid, raw JSON with no markdown wrapping or extra commentary.
2. JSON schema:
{
  "technicalAccuracy": number (0-100),
  "problemSolving": number (0-100),
  "depth": number (0-100),
  "communication": number (0-100),
  "overallTurnScore": number (0-100, weighted average),
  "evaluatorFeedback": "Constructive 2-4 sentence appraisal",
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "improvements": ["Actionable improvement 1", "Actionable improvement 2"],
  "followUpQuestion": "An intelligent follow-up question digging into edge cases or trade-offs",
  "recommendedDifficultyAdjustment": "increase" | "maintain" | "decrease"
}`;

    const userPrompt = `Evaluate the candidate's answer:
- Question: "${question}"
- Topic: "${topicTitle}"
- Target Level: ${targetLevel} ${role} (Difficulty: Level ${difficulty}/5)
- Candidate's Answer:
"${candidateAnswer}"`;

    try {
      const response = await aiRouter.executeWithFallback([
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ], { complexity: "medium", temperature: 0.2 });

      const raw = response.content.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(raw);
      return EvaluationOutputSchema.parse(parsed);
    } catch (err) {
      console.warn("[InterviewEngine] Falling back to heuristic answer evaluation:", err);
      return this.createFallbackEvaluation(candidateAnswer, difficulty);
    }
  }

  /**
   * Starts a new adaptive technical interview session.
   */
  static async startSession(params: StartInterviewParams) {
    const {
      userId,
      topicId,
      courseId,
      role = "Full-Stack Engineer",
      targetLevel = "mid",
      initialDifficulty = 2,
    } = params;

    const topic = topicId
      ? await prisma.topic.findUnique({ where: { id: topicId }, select: { id: true, title: true } })
      : null;

    const topicTitle = topic?.title || "Full-Stack Software Architecture";

    const session = await prisma.interviewSession.create({
      data: {
        userId,
        topicId: topic?.id || null,
        courseId: courseId || null,
        role,
        targetLevel,
        currentDifficulty: initialDifficulty,
        status: "in_progress",
      },
    });

    const firstQuestion = await this.generateQuestion({
      role,
      targetLevel,
      topicTitle,
      difficulty: initialDifficulty,
      turnNumber: 1,
      previousTurns: [],
    });

    const firstTurn = await prisma.interviewTurn.create({
      data: {
        sessionId: session.id,
        turnNumber: 1,
        question: firstQuestion.question,
        questionType: firstQuestion.questionType,
        difficulty: initialDifficulty,
      },
    });

    return {
      session: {
        id: session.id,
        role: session.role,
        targetLevel: session.targetLevel,
        currentDifficulty: session.currentDifficulty,
        status: session.status,
        startedAt: session.startedAt,
      },
      currentTurn: {
        id: firstTurn.id,
        turnNumber: firstTurn.turnNumber,
        question: firstTurn.question,
        questionType: firstTurn.questionType,
        difficulty: firstTurn.difficulty,
      },
    };
  }

  /**
   * Submits candidate answer, evaluates it, adjusts difficulty, and either proceeds to next turn or completes the session.
   */
  static async submitAnswer(params: SubmitAnswerParams, maxTurns = 4) {
    const { sessionId, turnId, userId, candidateAnswer } = params;

    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      include: {
        turns: { orderBy: { turnNumber: "asc" } },
        user: { select: { id: true } },
      },
    });

    if (!session || session.userId !== userId) {
      throw new Error("Interview session not found or unauthorized");
    }

    const currentTurn = session.turns.find((t) => t.id === turnId);
    if (!currentTurn) {
      throw new Error(`Turn ${turnId} not found in session`);
    }

    const topic = session.topicId
      ? await prisma.topic.findUnique({ where: { id: session.topicId }, select: { id: true, title: true } })
      : null;
    const topicTitle = topic?.title || session.role;

    // Evaluate answer
    const evaluation = await this.evaluateAnswer({
      role: session.role,
      targetLevel: session.targetLevel,
      topicTitle,
      question: currentTurn.question,
      candidateAnswer,
      difficulty: currentTurn.difficulty,
    });

    // Update current turn with evaluation results
    await prisma.interviewTurn.update({
      where: { id: turnId },
      data: {
        candidateAnswer,
        technicalAccuracy: evaluation.technicalAccuracy,
        problemSolving: evaluation.problemSolving,
        depth: evaluation.depth,
        communication: evaluation.communication,
        turnScore: evaluation.overallTurnScore,
        evaluatorFeedback: evaluation.evaluatorFeedback,
        strengths: JSON.stringify(evaluation.strengths),
        improvements: JSON.stringify(evaluation.improvements),
        followUpQuestion: evaluation.followUpQuestion || null,
      },
    });

    // Compute next difficulty
    let nextDifficulty = session.currentDifficulty;
    if (evaluation.recommendedDifficultyAdjustment === "increase" || evaluation.overallTurnScore >= 85) {
      nextDifficulty = Math.min(5, session.currentDifficulty + 1);
    } else if (evaluation.recommendedDifficultyAdjustment === "decrease" || evaluation.overallTurnScore < 50) {
      nextDifficulty = Math.max(1, session.currentDifficulty - 1);
    }

    const isSessionComplete = currentTurn.turnNumber >= maxTurns;

    if (isSessionComplete) {
      // Calculate session aggregates
      const allTurns = await prisma.interviewTurn.findMany({
        where: { sessionId },
      });

      const avgAccuracy = Math.round(allTurns.reduce((sum, t) => sum + (t.technicalAccuracy || 0), 0) / allTurns.length);
      const avgProblemSolving = Math.round(allTurns.reduce((sum, t) => sum + (t.problemSolving || 0), 0) / allTurns.length);
      const avgDepth = Math.round(allTurns.reduce((sum, t) => sum + (t.depth || 0), 0) / allTurns.length);
      const avgCommunication = Math.round(allTurns.reduce((sum, t) => sum + (t.communication || 0), 0) / allTurns.length);
      const overallScore = Math.round((avgAccuracy * 0.35) + (avgProblemSolving * 0.30) + (avgDepth * 0.20) + (avgCommunication * 0.15));

      const summaryFeedback = overallScore >= 80
        ? `Strong performance! Demonstrated deep technical command and clear communication suitable for ${session.targetLevel} ${session.role}.`
        : overallScore >= 60
        ? `Solid foundation with opportunities to deepen edge-case analysis and problem decomposition.`
        : `Developing skills. Focus on fundamental concepts, API mechanics, and structured communication.`;

      await prisma.interviewSession.update({
        where: { id: sessionId },
        data: {
          status: "completed",
          overallScore,
          technicalAccuracy: avgAccuracy,
          problemSolving: avgProblemSolving,
          depth: avgDepth,
          communication: avgCommunication,
          summaryFeedback,
          completedAt: new Date(),
        },
      });

      // Synchronize topic skill if topicId is associated
      if (session.topicId) {
        await SkillEvaluationService.synchronizeTopicSkill(userId, session.topicId);
      }

      return {
        sessionStatus: "completed" as const,
        turnEvaluation: evaluation,
        finalSessionSummary: {
          overallScore,
          technicalAccuracy: avgAccuracy,
          problemSolving: avgProblemSolving,
          depth: avgDepth,
          communication: avgCommunication,
          summaryFeedback,
        },
      };
    }

    // Generate next question
    const nextTurnNumber = currentTurn.turnNumber + 1;
    const history = session.turns.map((t) => ({
      question: t.question,
      answer: t.id === turnId ? candidateAnswer : t.candidateAnswer,
      score: t.id === turnId ? evaluation.overallTurnScore : t.turnScore,
    }));

    // If follow up question was provided and relevant, we can use it as next question
    const nextQuestionText = evaluation.followUpQuestion && Math.random() > 0.3
      ? evaluation.followUpQuestion
      : (await this.generateQuestion({
          role: session.role,
          targetLevel: session.targetLevel,
          topicTitle,
          difficulty: nextDifficulty,
          turnNumber: nextTurnNumber,
          previousTurns: history,
        })).question;

    const nextTurn = await prisma.interviewTurn.create({
      data: {
        sessionId,
        turnNumber: nextTurnNumber,
        question: nextQuestionText,
        questionType: "technical",
        difficulty: nextDifficulty,
      },
    });

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { currentDifficulty: nextDifficulty },
    });

    return {
      sessionStatus: "in_progress" as const,
      turnEvaluation: evaluation,
      nextTurn: {
        id: nextTurn.id,
        turnNumber: nextTurn.turnNumber,
        question: nextTurn.question,
        questionType: nextTurn.questionType,
        difficulty: nextTurn.difficulty,
      },
    };
  }

  // ── Heuristic Fallbacks ───────────────────────────────────────────────────

  private static createFallbackQuestion(topic: string, difficulty: number, turn: number) {
    const questions: Record<number, string[]> = {
      1: [
        `Can you explain the core architectural principles of ${topic} and how it solves real-world problems?`,
        `What are the most common performance bottlenecks when working with ${topic}, and how do you mitigate them?`,
      ],
      2: [
        `How would you design a scalable module for ${topic} considering error handling and testability?`,
        `Compare different design patterns commonly used in ${topic}. What are the trade-offs?`,
      ],
      3: [
        `Walk me through how you would debug a subtle state synchronization issue in ${topic}.`,
        `How do you ensure accessibility, security, and type safety when developing with ${topic}?`,
      ],
    };

    const pool = questions[difficulty] || questions[2];
    return {
      question: pool[turn % pool.length] || `Explain your approach to implementing scalable solutions in ${topic}.`,
      questionType: "conceptual",
    };
  }

  private static createFallbackEvaluation(answer: string, difficulty: number): InterviewTurnEvaluation {
    const length = answer.trim().length;
    let score = 50;

    if (length > 200) score += 25;
    else if (length > 100) score += 15;
    else if (length < 30) score -= 20;

    score = Math.min(100, Math.max(20, score));

    return {
      technicalAccuracy: score,
      problemSolving: Math.max(20, score - 5),
      depth: Math.max(20, score - 10),
      communication: Math.min(100, score + 10),
      overallTurnScore: score,
      evaluatorFeedback: score >= 70
        ? "Good technical explanation with solid structure."
        : "Answer is somewhat brief. Provide more concrete examples and explain underlying mechanisms.",
      strengths: ["Clear terminology", "Direct response"],
      improvements: ["Elaborate on edge cases and performance trade-offs"],
      followUpQuestion: `What edge cases might cause this approach to fail under high concurrency?`,
      recommendedDifficultyAdjustment: score >= 80 ? "increase" : score < 50 ? "decrease" : "maintain",
    };
  }
}
