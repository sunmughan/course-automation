import { prisma } from "@/lib/db";
import { executeMultiLanguage } from "@/lib/execution/multi-lang-sandbox";
import { parseTestCases, runExerciseTests } from "@/lib/curriculum/exercise-runner";
import { SkillEvaluationService } from "@/lib/adaptive/skill-evaluation";

export type QuestionType =
  | "mcq"
  | "predict_output"
  | "coding"
  | "debugging"
  | "architecture"
  | "explain_code";

export interface QuestionEvaluationResult {
  questionId: string;
  type: string;
  passed: boolean;
  score: number;
  maxPoints: number;
  feedback: string;
  expected?: string;
  actual?: string;
  executionDetails?: {
    output?: string;
    error?: string;
    totalTests?: number;
    passedTests?: number;
  };
}

export interface AssessmentEvaluationResult {
  assessmentId: string;
  title: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  timeSpent?: number;
  attempts: number;
  results: QuestionEvaluationResult[];
  feedback: string;
}

export interface AssessmentAnalytics {
  assessmentId: string;
  title: string;
  totalSubmissions: number;
  passedCount: number;
  passRate: number;
  averageScore: number;
  averagePercentage: number;
  averageTimeSpentSeconds: number;
  questionAnalytics: Array<{
    questionId: string;
    type: string;
    question: string;
    correctCount: number;
    totalAttempts: number;
    accuracyPercent: number;
  }>;
}

export const BASELINE_ASSESSMENTS = [
  {
    id: "baseline-frontend-arch",
    title: "Frontend Engineering & Modern Web Architecture Assessment",
    lessonId: "frontend-baseline",
    timeLimit: 15,
    passingScore: 70,
    lesson: {
      title: "Frontend Architecture Core",
      topic: { title: "Frontend Architecture" },
    },
    questions: [
      {
        id: "q-fe-1",
        type: "mcq",
        question: "Which of the following best describes the fundamental difference between React Server Components (RSC) and standard Client Components?",
        options: JSON.stringify([
          "RSCs re-render on every state change on the client",
          "RSCs execute exclusively on the server and ship zero JavaScript bundle to the browser",
          "Client Components cannot use useEffect or useState",
          "RSCs replace HTML elements with native WebSockets",
        ]),
        correctAnswer: "RSCs execute exclusively on the server and ship zero JavaScript bundle to the browser",
        explanation: "React Server Components run only on the server, streaming lightweight serialized UI description to the client with 0KB added to the JS bundle.",
        points: 20,
      },
      {
        id: "q-fe-2",
        type: "mcq",
        question: "In the JavaScript Event Loop, which queue has highest priority and executes immediately after the currently running script completes?",
        options: JSON.stringify([
          "Macrotask Queue (setTimeout/setInterval)",
          "Microtask Queue (Promise.then, queueMicrotask)",
          "I/O Callback Queue",
          "Check/setImmediate Queue",
        ]),
        correctAnswer: "Microtask Queue (Promise.then, queueMicrotask)",
        explanation: "The microtask queue is drained completely after the synchronous call stack empties, before any macrotask is processed.",
        points: 20,
      },
      {
        id: "q-fe-3",
        type: "predict_output",
        question: "What is the exact output of this code snippet?",
        code: "const arr = [1, 2, 3];\nconst mapped = arr.map(x => x * 2);\nconsole.log(arr.length + mapped.length);",
        options: null,
        correctAnswer: "6",
        explanation: "Array.prototype.map produces a new 3-element array without modifying original arr (3 + 3 = 6).",
        points: 20,
      },
      {
        id: "q-fe-4",
        type: "mcq",
        question: "Why is passing raw unescaped user input into innerHTML dangerous in frontend applications?",
        options: JSON.stringify([
          "It causes excessive memory leaks in V8",
          "It exposes the application to Cross-Site Scripting (XSS) attacks",
          "It forces full page reload on every mutation",
          "It prevents CSS styles from being applied",
        ]),
        correctAnswer: "It exposes the application to Cross-Site Scripting (XSS) attacks",
        explanation: "Setting innerHTML allows attackers to inject malicious <script> tags or onerror handlers into the DOM.",
        points: 20,
      },
      {
        id: "q-fe-5",
        type: "mcq",
        question: "Which CSS layout mechanism is designed for two-dimensional grid layouts with simultaneous row and column track sizing?",
        options: JSON.stringify([
          "CSS Flexbox",
          "CSS Grid Layout",
          "CSS Float Positioning",
          "CSS Table Display",
        ]),
        correctAnswer: "CSS Grid Layout",
        explanation: "CSS Grid is inherently 2D (rows + columns), whereas Flexbox is 1D (either row or column at a time).",
        points: 20,
      },
    ],
  },
  {
    id: "baseline-nodejs-arch",
    title: "Node.js Backend & Distributed Systems Assessment",
    lessonId: "backend-baseline",
    timeLimit: 15,
    passingScore: 70,
    lesson: {
      title: "Node.js Runtime & Streams",
      topic: { title: "Backend Architecture" },
    },
    questions: [
      {
        id: "q-be-1",
        type: "mcq",
        question: "Which component of the Node.js architecture provides the cross-platform asynchronous I/O event loop and thread pool?",
        options: JSON.stringify([
          "V8 JavaScript Engine",
          "libuv C library",
          "Babel Transpiler",
          "NPM Package Manager",
        ]),
        correctAnswer: "libuv C library",
        explanation: "libuv is the multi-platform C library that handles the event loop, thread pool (for file I/O and crypto), and non-blocking sockets.",
        points: 20,
      },
      {
        id: "q-be-2",
        type: "mcq",
        question: "What happens when a writable stream returns 'false' on a write() call in Node.js?",
        options: JSON.stringify([
          "The process throws a fatal unhandled stream error",
          "The internal highWaterMark buffer is full and the producer must wait for the 'drain' event (Backpressure)",
          "The file on disk has been corrupted",
          "The socket has been permanently closed by the peer",
        ]),
        correctAnswer: "The internal highWaterMark buffer is full and the producer must wait for the 'drain' event (Backpressure)",
        explanation: "Returning false is Node.js's backpressure mechanism indicating the internal buffer has exceeded highWaterMark.",
        points: 20,
      },
      {
        id: "q-be-3",
        type: "mcq",
        question: "Why should refresh tokens be stored in HttpOnly, Secure, SameSite=Strict cookies rather than localStorage?",
        options: JSON.stringify([
          "localStorage has a 5MB storage limit",
          "HttpOnly cookies cannot be accessed by client-side JavaScript, mitigating XSS token theft",
          "localStorage causes CORS preflight errors",
          "Cookies are automatically compressed with gzip",
        ]),
        correctAnswer: "HttpOnly cookies cannot be accessed by client-side JavaScript, mitigating XSS token theft",
        explanation: "HttpOnly cookies are inaccessible to document.cookie in JS, preventing malicious injected scripts from reading them.",
        points: 20,
      },
      {
        id: "q-be-4",
        type: "mcq",
        question: "What is the primary benefit of using Redis Cache-Aside with Single-Flight locks?",
        options: JSON.stringify([
          "It eliminates the need for SQL database backups",
          "It prevents Cache Stampede (Thundering Herd) when a hot key expires simultaneously under heavy traffic",
          "It compiles Node.js bytecode into C++",
          "It automatically partitions PostgreSQL tables",
        ]),
        correctAnswer: "It prevents Cache Stampede (Thundering Herd) when a hot key expires simultaneously under heavy traffic",
        explanation: "Single-flight mutex locks ensure only one request hits the database to re-warm the cache, preventing database saturation.",
        points: 20,
      },
      {
        id: "q-be-5",
        type: "predict_output",
        question: "What is logged to the console by this code?",
        code: "const status = 200;\nconst msg = status === 200 ? 'OK' : 'ERR';\nconsole.log(`${msg}:${status}`);",
        options: null,
        correctAnswer: "OK:200",
        explanation: "Ternary expression evaluates to 'OK', outputting 'OK:200'.",
        points: 20,
      },
    ],
  },
  {
    id: "baseline-ai-llm",
    title: "AI, LLMs & Retrieval-Augmented Generation (RAG) Assessment",
    lessonId: "ai-baseline",
    timeLimit: 15,
    passingScore: 70,
    lesson: {
      title: "Transformers & Vector Embeddings",
      topic: { title: "AI & Prompt Engineering" },
    },
    questions: [
      {
        id: "q-ai-1",
        type: "mcq",
        question: "In the Scaled Dot-Product Attention formula Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V, why do we scale by sqrt(d_k)?",
        options: JSON.stringify([
          "To reduce the GPU memory usage by half",
          "To prevent the dot products from growing excessively large for large dimensions, which would push softmax into regions with vanishingly small gradients",
          "To convert token IDs into word embeddings",
          "To enforce causal masking on the output tokens",
        ]),
        correctAnswer: "To prevent the dot products from growing excessively large for large dimensions, which would push softmax into regions with vanishingly small gradients",
        explanation: "Dividing by sqrt(d_k) stabilizes the variance of the dot products to 1, preventing softmax saturation and vanishing gradients.",
        points: 20,
      },
      {
        id: "q-ai-2",
        type: "mcq",
        question: "What is the primary memory and latency saving mechanism of KV-Caching during LLM autoregressive token generation?",
        options: JSON.stringify([
          "It compresses the prompt using gzip",
          "It reuses previously computed Key and Value tensors for past tokens instead of recomputing full attention over the entire sequence on each step",
          "It quantizes the model weights from FP32 to 1-bit",
          "It routes queries to local CPU cores",
        ]),
        correctAnswer: "It reuses previously computed Key and Value tensors for past tokens instead of recomputing full attention over the entire sequence on each step",
        explanation: "KV-caching avoids redundant O(N^2) past-token attention calculations by caching previous K and V states.",
        points: 20,
      },
      {
        id: "q-ai-3",
        type: "mcq",
        question: "Which prompting technique instructs the language model to generate intermediate reasoning steps before arriving at the final answer?",
        options: JSON.stringify([
          "Zero-Shot Direct Classification",
          "Chain-of-Thought (CoT) Prompting",
          "Temperature Jittering",
          "Greedy Token Decoding",
        ]),
        correctAnswer: "Chain-of-Thought (CoT) Prompting",
        explanation: "Chain-of-Thought (CoT) prompts the model to output step-by-step reasoning tokens before generating the final conclusion.",
        points: 20,
      },
      {
        id: "q-ai-4",
        type: "mcq",
        question: "Why is Hybrid Search (combining BM25 lexical search with Dense Vector similarity) preferred in enterprise RAG pipelines?",
        options: JSON.stringify([
          "It eliminates the need for a database index",
          "It captures both exact keyword matches (product codes, IDs, jargon) and semantic meaning",
          "It runs entirely without CPU or GPU computation",
          "It automatically translates text into 100 languages",
        ]),
        correctAnswer: "It captures both exact keyword matches (product codes, IDs, jargon) and semantic meaning",
        explanation: "BM25 handles exact tokens/acronyms that embeddings might compress, while dense embeddings capture conceptual semantic similarity.",
        points: 20,
      },
      {
        id: "q-ai-5",
        type: "predict_output",
        question: "What is the result of computing cosine similarity between two identical normalized vectors [0.6, 0.8] and [0.6, 0.8]?",
        code: "const v1 = [0.6, 0.8];\nconst v2 = [0.6, 0.8];\nconst dot = v1[0]*v2[0] + v1[1]*v2[1];\nconsole.log(Math.round(dot));",
        options: null,
        correctAnswer: "1",
        explanation: "0.6*0.6 + 0.8*0.8 = 0.36 + 0.64 = 1.0 (exact match cosine similarity = 1).",
        points: 20,
      },
    ],
  },
];

// ── Normalization Helpers ───────────────────────────────────────────────────

export function normalizeOutput(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trim()
    .toLowerCase();
}

export function evaluateMCQ(optionsStr: string | null, correctAnswer: string, studentAnswer: string): boolean {
  if (!studentAnswer) return false;
  const normStudent = studentAnswer.trim().toLowerCase();
  const normCorrect = correctAnswer.trim().toLowerCase();

  if (normStudent === normCorrect) return true;

  if (optionsStr) {
    try {
      const options: string[] = JSON.parse(optionsStr);
      // Check if student provided index or letter
      const letterIndex = normStudent.charCodeAt(0) - "a".charCodeAt(0);
      if (letterIndex >= 0 && letterIndex < options.length) {
        if (options[letterIndex]?.trim().toLowerCase() === normCorrect) return true;
      }
      const numIndex = parseInt(normStudent, 10);
      if (!isNaN(numIndex) && numIndex >= 0 && numIndex < options.length) {
        if (options[numIndex]?.trim().toLowerCase() === normCorrect) return true;
      }
    } catch {
      // Options wasn't JSON, ignore
    }
  }

  return false;
}

export function evaluatePredictOutput(expected: string, studentAnswer: string): boolean {
  const normExpected = normalizeOutput(expected);
  const normActual = normalizeOutput(studentAnswer);
  if (normExpected === normActual) return true;

  // Try JSON canonical comparison
  try {
    const jsonExpected = JSON.stringify(JSON.parse(normExpected));
    const jsonActual = JSON.stringify(JSON.parse(normActual));
    if (jsonExpected === jsonActual) return true;
  } catch {
    // Non-JSON comparison
  }

  return false;
}

export function evaluateConceptualRubric(
  studentAnswer: string,
  keyConcepts: string[],
  minMatches = 2
): { scoreFraction: number; feedback: string } {
  if (!studentAnswer || studentAnswer.trim().length < 15) {
    return { scoreFraction: 0, feedback: "Answer is too brief to demonstrate full conceptual understanding." };
  }

  const lowerAnswer = studentAnswer.toLowerCase();
  let matches = 0;
  const missing: string[] = [];

  for (const concept of keyConcepts) {
    if (lowerAnswer.includes(concept.toLowerCase())) {
      matches++;
    } else {
      missing.push(concept);
    }
  }

  const required = Math.max(1, Math.min(minMatches, keyConcepts.length));
  const fraction = Math.min(1, matches / required);

  if (fraction >= 1) {
    return { scoreFraction: 1, feedback: "Comprehensive answer covering the core design and architectural considerations." };
  } else if (fraction >= 0.5) {
    return {
      scoreFraction: fraction,
      feedback: `Good attempt, but missing key concepts: ${missing.slice(0, 2).join(", ")}.`,
    };
  } else {
    return {
      scoreFraction: fraction,
      feedback: `Needs more technical depth. Consider mentioning: ${keyConcepts.slice(0, 3).join(", ")}.`,
    };
  }
}

// ── Assessment Engine Service ───────────────────────────────────────────────

export class AssessmentEngine {
  /**
   * Evaluates an individual assessment question based on its type.
   */
  static async evaluateQuestion(
    question: {
      id: string;
      type: string;
      question: string;
      code?: string | null;
      options?: string | null;
      correctAnswer: string;
      explanation?: string | null;
      testCases?: string | null;
      points: number;
    },
    studentAnswer: string,
    language = "javascript"
  ): Promise<QuestionEvaluationResult> {
    const type = (question.type || "mcq").toLowerCase() as QuestionType;
    const maxPoints = question.points || 1;

    switch (type) {
      case "mcq": {
        const passed = evaluateMCQ(question.options || null, question.correctAnswer, studentAnswer);
        return {
          questionId: question.id,
          type,
          passed,
          score: passed ? maxPoints : 0,
          maxPoints,
          feedback: passed
            ? "Correct answer!"
            : `Incorrect. ${question.explanation || `Expected answer: ${question.correctAnswer}`}`,
          expected: question.correctAnswer,
          actual: studentAnswer,
        };
      }

      case "predict_output": {
        const passed = evaluatePredictOutput(question.correctAnswer, studentAnswer);
        return {
          questionId: question.id,
          type,
          passed,
          score: passed ? maxPoints : 0,
          maxPoints,
          feedback: passed
            ? "Exact output predicted correctly!"
            : `Output mismatch. Expected: "${question.correctAnswer}". ${question.explanation || ""}`,
          expected: question.correctAnswer,
          actual: studentAnswer,
        };
      }

      case "coding":
      case "debugging": {
        if (!studentAnswer || studentAnswer.trim().length === 0) {
          return {
            questionId: question.id,
            type,
            passed: false,
            score: 0,
            maxPoints,
            feedback: "No code submitted.",
          };
        }

        const allTests = [question.testCases, question.correctAnswer].filter(Boolean).join("; ");
        const exerciseMock = {
          title: question.question,
          description: question.question,
          starterCode: question.code || "",
          solutionCode: studentAnswer,
          testCases: allTests || "console.log('test passed')",
          hints: question.explanation || "",
        };

        const testRun = await runExerciseTests(exerciseMock, studentAnswer, language);

        const scoreFraction = testRun.totalTests > 0 ? testRun.passedTests / testRun.totalTests : testRun.passed ? 1 : 0;
        const earnedScore = Math.round(scoreFraction * maxPoints);

        return {
          questionId: question.id,
          type,
          passed: testRun.passed,
          score: earnedScore,
          maxPoints,
          feedback: testRun.passed
            ? "All test assertions passed successfully!"
            : testRun.error
            ? `Runtime Error: ${testRun.error}`
            : `Passed ${testRun.passedTests} of ${testRun.totalTests} tests.`,
          executionDetails: {
            output: testRun.output,
            error: testRun.error,
            totalTests: testRun.totalTests,
            passedTests: testRun.passedTests,
          },
        };
      }

      case "architecture": {
        const keyConcepts = question.correctAnswer
          ? question.correctAnswer.split(",").map((s) => s.trim())
          : ["scalability", "modularity", "security", "state", "separation"];

        const rubric = evaluateConceptualRubric(studentAnswer, keyConcepts, 3);
        const earnedScore = Math.round(rubric.scoreFraction * maxPoints);

        return {
          questionId: question.id,
          type,
          passed: rubric.scoreFraction >= 0.7,
          score: earnedScore,
          maxPoints,
          feedback: rubric.feedback,
        };
      }

      case "explain_code": {
        const keyConcepts = question.correctAnswer
          ? question.correctAnswer.split(",").map((s) => s.trim())
          : ["complexity", "mutation", "scope", "closure", "performance"];

        const rubric = evaluateConceptualRubric(studentAnswer, keyConcepts, 2);
        const earnedScore = Math.round(rubric.scoreFraction * maxPoints);

        return {
          questionId: question.id,
          type,
          passed: rubric.scoreFraction >= 0.6,
          score: earnedScore,
          maxPoints,
          feedback: rubric.feedback,
        };
      }

      default: {
        const passed = studentAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
        return {
          questionId: question.id,
          type,
          passed,
          score: passed ? maxPoints : 0,
          maxPoints,
          feedback: passed ? "Correct!" : "Incorrect answer.",
        };
      }
    }
  }

  /**
   * Evaluates an entire assessment submitted by a student.
   */
  static async evaluateAssessment(params: {
    assessmentId: string;
    userId: string;
    answers: Record<string, string>;
    timeSpent?: number;
    language?: string;
  }): Promise<AssessmentEvaluationResult> {
    const { assessmentId, userId, answers, timeSpent = 0, language = "javascript" } = params;

    let assessment: any = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: { orderBy: { order: "asc" } },
        lesson: { select: { id: true, topicId: true } },
      },
    });

    if (!assessment) {
      const baseline = BASELINE_ASSESSMENTS.find((a) => a.id === assessmentId);
      if (baseline) {
        assessment = {
          ...baseline,
          lesson: { id: baseline.lessonId, topicId: "general" },
        };
      } else {
        throw new Error(`Assessment ${assessmentId} not found`);
      }
    }

    let earnedPoints = 0;
    let totalPoints = 0;
    const results: QuestionEvaluationResult[] = [];

    for (const q of assessment.questions) {
      totalPoints += q.points;
      const studentAnswer = answers[q.id] || "";
      const evaluation = await this.evaluateQuestion(q, studentAnswer, language);
      earnedPoints += evaluation.score;
      results.push(evaluation);

      // If coding/debugging question threw an error, record as student mistake
      if (!evaluation.passed && (q.type === "coding" || q.type === "debugging")) {
        const errorMsg = evaluation.executionDetails?.error || evaluation.feedback;
        await SkillEvaluationService.recordMistake(
          userId,
          assessment.lesson.topicId,
          assessment.lesson.id,
          studentAnswer.slice(0, 1000),
          errorMsg.slice(0, 500)
        );
      }
    }

    const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = percentage >= assessment.passingScore;

    let attemptCount = 1;

    if (!assessment.id.startsWith("baseline-")) {
      // Check previous attempts
      const existingScore = await prisma.assessmentScore.findUnique({
        where: { userId_assessmentId: { userId, assessmentId } },
      });
      attemptCount = (existingScore?.attempts ?? 0) + 1;

      // Persist assessment score
      await prisma.assessmentScore.upsert({
        where: { userId_assessmentId: { userId, assessmentId } },
        create: {
          userId,
          assessmentId,
          score: earnedPoints,
          totalPoints,
          answers: JSON.stringify(results),
          timeSpent,
          passed,
          attempts: 1,
          completedAt: new Date(),
        },
        update: {
          score: earnedPoints,
          totalPoints,
          answers: JSON.stringify(results),
          timeSpent: { increment: timeSpent },
          passed,
          attempts: { increment: 1 },
          completedAt: new Date(),
        },
      });

      // Synchronize skill evaluation
      if (assessment.lesson?.topicId && assessment.lesson.topicId !== "general") {
        await SkillEvaluationService.synchronizeTopicSkill(userId, assessment.lesson.topicId);
      }
    }

    const feedback = passed
      ? `Outstanding! You achieved ${percentage}% (Passing threshold: ${assessment.passingScore}%). Topic mastery updated.`
      : `You scored ${percentage}% (Passing threshold: ${assessment.passingScore}%). Review missed concepts and try again.`;

    return {
      assessmentId: assessment.id,
      title: assessment.title,
      score: earnedPoints,
      totalPoints,
      percentage,
      passed,
      passingScore: assessment.passingScore,
      timeSpent,
      attempts: attemptCount,
      results,
      feedback,
    };
  }

  /**
   * Retrieves aggregate analytics for an assessment.
   */
  static async getAssessmentAnalytics(assessmentId: string): Promise<AssessmentAnalytics> {
    const [assessment, scores] = await Promise.all([
      prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: { questions: { orderBy: { order: "asc" } } },
      }),
      prisma.assessmentScore.findMany({
        where: { assessmentId },
      }),
    ]);

    if (!assessment) {
      throw new Error(`Assessment ${assessmentId} not found`);
    }

    const totalSubmissions = scores.length;
    const passedCount = scores.filter((s) => s.passed || (s.totalPoints > 0 && (s.score / s.totalPoints) * 100 >= assessment.passingScore)).length;
    const passRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;
    const averageScore = totalSubmissions > 0 ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / totalSubmissions) : 0;
    const averagePercentage = totalSubmissions > 0
      ? Math.round(scores.reduce((sum, s) => sum + (s.totalPoints > 0 ? (s.score / s.totalPoints) * 100 : 0), 0) / totalSubmissions)
      : 0;
    const averageTimeSpentSeconds = totalSubmissions > 0
      ? Math.round(scores.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / totalSubmissions)
      : 0;

    // Per-question accuracy analytics
    const questionAnalytics = assessment.questions.map((q) => {
      let correctCount = 0;
      let questionAttempts = 0;

      for (const s of scores) {
        try {
          const parsedAnswers: QuestionEvaluationResult[] = JSON.parse(s.answers);
          const match = parsedAnswers.find((a) => a.questionId === q.id);
          if (match) {
            questionAttempts++;
            if (match.passed || match.score >= q.points) {
              correctCount++;
            }
          }
        } catch {
          // ignore corrupted JSON
        }
      }

      const accuracyPercent = questionAttempts > 0 ? Math.round((correctCount / questionAttempts) * 100) : 0;

      return {
        questionId: q.id,
        type: q.type,
        question: q.question,
        correctCount,
        totalAttempts: questionAttempts,
        accuracyPercent,
      };
    });

    return {
      assessmentId: assessment.id,
      title: assessment.title,
      totalSubmissions,
      passedCount,
      passRate,
      averageScore,
      averagePercentage,
      averageTimeSpentSeconds,
      questionAnalytics,
    };
  }
}
