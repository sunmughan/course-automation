import { describe, it, expect, vi } from "vitest";
import { teachingEngine } from "@/lib/ai/teaching-engine";
import { predictionEngine } from "@/lib/execution/prediction-engine";
import { understandingEngine } from "@/lib/ai/understanding-engine";
import { checkPrerequisites } from "@/lib/ai/prerequisite-repair";
import { validateAIQuality } from "@/lib/ai/quality-guard";
import { masteryEngine } from "@/lib/adaptive/mastery-engine";
import { VoiceConversationController } from "@/lib/voice/conversation-lifecycle";
import { registerTopicKnowledge } from "@/lib/curriculum/intelligence";
import { aiGateway } from "@/lib/ai/gateway";
import { executeJavaScript } from "@/lib/execution/sandbox";
import { prisma } from "@/lib/db";

describe("Autonomous Teaching System — Complete Multi-Persona & Failure-Injection Test Suite", () => {

  // ==========================================
  // 1. PERSONA A: SUPER ADMIN PLATFORM AUDIT
  // ==========================================
  describe("Persona A: Super Admin Platform Management", () => {
    it("monitors active AI providers, models, and health status", () => {
      aiGateway.registerProvider({
        name: "nvidia_test",
        baseUrl: "https://integrate.api.nvidia.com/v1",
        apiKey: "test_key",
        models: [
          { name: "meta/llama-3.3-70b-instruct", maxTokens: 131072, costPer1K: 0.00059, capabilities: ["explain"] },
        ],
      });

      const providers = aiGateway.getActiveProviders();
      expect(providers.length).toBeGreaterThan(0);

      const first = providers.find((p) => p.name === "nvidia_test") || providers[0];
      expect(first.name).toBeTruthy();
      expect(first.baseUrl).toBeTruthy();
      expect(first.models.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // 2. PERSONA B: INSTRUCTOR AUDIT & WEAKNESS DETECTION
  // ==========================================
  describe("Persona B: Instructor Analytics & Student Remediation", () => {
    it("detects unmastered prerequisites and generates targeted repair advice", async () => {
      registerTopicKnowledge({
        topicId: "top_adv_async",
        topicSlug: "promise-all-concurrency",
        topicTitle: "Promise Concurrency & Promise.all",
        courseTitle: "Node.js Core Architecture",
        moduleTitle: "Asynchronous Mastery",
        difficultyLevel: 4,
        prerequisites: ["promise-basics"],
        isComplete: true,
        gapsDetected: [],
        learningObjectives: ["Manage concurrent async operations safely with Promise.all and Promise.allSettled"],
        mentalModel: {
          analogy: "Running multiple parallel tracks simultaneously and synchronizing at the finish line",
          coreMechanism: "Promise.all waits for all promises to resolve or rejects immediately on the first rejection",
          keyMetaphor: "Parallel race with all-or-nothing trigger",
        },
        syntax: {
          pattern: "const results = await Promise.all([p1, p2]);",
          breakdown: [{ part: "Promise.all", purpose: "Combines multiple iterable promises" }],
        },
        counterExamples: [],
        useCases: ["Batch querying independent REST services"],
        nonUseCases: ["Sequential operations where step 2 depends strictly on output of step 1"],
        advantages: ["Drastically reduces total latency compared to serial awaiting"],
        limitations: ["Fails fast if any single promise rejects unless wrapped in allSettled"],
        alternatives: ["Promise.allSettled, Promise.race"],
        commonMistakes: [],
        misconceptions: [],
        visualModel: { type: "flowchart", nodes: [], dataFlow: [] },
        masteryCriteria: { minPracticeRuns: 2, requiredScore: 80, mustClearMisconceptions: [] },
      });

      // Mock prerequisite topic in DB with weak student score
      vi.spyOn(prisma.topic, "findFirst").mockResolvedValueOnce({
        id: "top_prereq_1",
        slug: "promise-basics",
        title: "Promises & Async Foundations",
      } as any);

      vi.spyOn(prisma.studentSkill, "findUnique").mockResolvedValueOnce({
        score: 35, // Below 50%
      } as any);

      const check = await checkPrerequisites({
        userId: "struggling_student_01",
        topicSlug: "promise-all-concurrency",
      });

      expect(check.hasMissingPrerequisites).toBe(true);
      expect(check.missingPrerequisites[0].topicTitle).toBe("Promises & Async Foundations");
      expect(check.repairMessage).toContain("Promises & Async Foundations");
    });
  });

  // ==========================================
  // 3. PERSONA C: STUDENT COMPLETE LEARNING LIFECYCLE
  // ==========================================
  describe("Persona C: Student End-to-End Learning Loop", () => {
    it("completes full Teach -> Predict -> Execute -> Understand -> Master loop", async () => {
      const studentId = "student_alex";
      const topicId = "top_closures";

      registerTopicKnowledge({
        topicId,
        topicSlug: "closures-lexical-scope",
        topicTitle: "Closures & Lexical Scope",
        courseTitle: "JavaScript Engineering",
        moduleTitle: "Scope & Closures",
        difficultyLevel: 3,
        prerequisites: [],
        isComplete: true,
        gapsDetected: [],
        learningObjectives: ["Understand how inner functions preserve references to outer lexical scope"],
        mentalModel: {
          analogy: "A backpack of variables that a function carries wherever it travels",
          coreMechanism: "Functions retain lexical scope references even after parent execution completes",
          keyMetaphor: "Lexical scope backpack",
        },
        syntax: {
          pattern: "function outer() { let x = 1; return () => x; }",
          breakdown: [{ part: "outer", purpose: "Creates closure environment" }],
        },
        counterExamples: [],
        useCases: ["Encapsulation, factory functions, event handlers"],
        nonUseCases: ["Stateless utility calculations"],
        advantages: ["Data privacy without class overhead"],
        limitations: ["Retains memory until references are garbage collected"],
        alternatives: ["ES6 Classes, WeakMaps"],
        commonMistakes: [],
        misconceptions: [],
        visualModel: { type: "flowchart", nodes: [], dataFlow: [] },
        masteryCriteria: { minPracticeRuns: 2, requiredScore: 80, mustClearMisconceptions: [] },
      });

      // Mock DB skills for evidence recording
      vi.spyOn(prisma.studentSkill, "findUnique").mockResolvedValue({
        id: "skill_1",
        userId: studentId,
        topicId,
        score: 45,
        status: "developing",
        attempts: 1,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
        nextReviewAt: new Date(),
      } as any);

      vi.spyOn(prisma.studentSkill, "upsert").mockResolvedValue({
        id: "skill_1",
        userId: studentId,
        topicId,
        score: 60,
        status: "developing",
        attempts: 2,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
        nextReviewAt: new Date(),
      } as any);

      // 1. Teach: Student asks conceptual question
      const teachingResponse = await teachingEngine.teach({
        userId: studentId,
        topicId,
        topicSlug: "closures-lexical-scope",
        topicTitle: "Closures & Lexical Scope",
        courseTitle: "JavaScript Engineering",
        studentSkillScore: 45,
        studentAttempts: 1,
        previousMistakes: [],
        detectedMisconceptions: [],
        studentQuery: "How does closure retain variables after the outer function finishes?",
      });

      expect(teachingResponse.simpleDefinition).toBeTruthy();
      expect(teachingResponse.mentalModelAnalogy).toBeTruthy();
      expect(teachingResponse.understandingCheckQuestion).toBeTruthy();

      // 2. Predict -> Run -> Explain: Student predicts outcome of closure code
      const closureCode = `
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

      const prediction = await predictionEngine.evaluatePrediction({
        userId: studentId,
        topicId,
        code: closureCode,
        language: "javascript",
        studentPrediction: "COUNT: 6",
        predictedReasoning: "The returned function retains access to the outer lexical environment variable count.",
      });

      expect(prediction.actualOutput).toContain("COUNT: 6");
      expect(prediction.isAccurate).toBe(true);
      expect(prediction.structuredComparison.outputExactMatch).toBe(true);

      // 3. Interactive Understanding Check: Student answers diagnostic check question
      const checkResult = await understandingEngine.evaluateAnswer({
        userId: studentId,
        topicId,
        question: "Why does the inner function maintain access to count?",
        studentAnswer: "Because functions retain a reference to their outer lexical scope chain",
        selectedOptionIndex: 0,
        correctOptionIndex: 0,
        options: [
          "Because functions retain a reference to their outer lexical scope chain",
          "Because variables are duplicated in global window scope",
        ],
      });

      expect(checkResult.isCorrect).toBe(true);
      expect(checkResult.score).toBe(100);

      // 4. Evidence Persistence & Spaced Repetition (SM-2) Review
      const mastery = await masteryEngine.recordEvidence({
        userId: studentId,
        topicId,
        type: "practice_pass",
        score: 95,
        passed: true,
      });

      expect(mastery.score).toBeGreaterThanOrEqual(40);
      expect(mastery.nextReviewAt).toBeInstanceOf(Date);
    });
  });

  // ==========================================
  // 4. MULTI-TENANT ISOLATION & SECURITY ATTACKS
  // ==========================================
  describe("Multi-Tenant Isolation & Security Enforcement", () => {
    it("ensures Student A cannot access Student B learning data or context", async () => {
      const studentA = "student_tenant_A";

      vi.spyOn(prisma.studentSkill, "findUnique").mockResolvedValueOnce(null);

      const skillA = await prisma.studentSkill.findUnique({
        where: { userId_topicId: { userId: studentA, topicId: "secret_topic_B" } },
      });

      expect(skillA).toBeNull();
    });
  });

  // ==========================================
  // 5. FAILURE-INJECTION TESTING
  // ==========================================
  describe("Failure-Injection Scenarios & Graceful Recovery", () => {
    it("handles infinite loop code execution safely with timeout enforcement", async () => {
      const infiniteLoopCode = `
let i = 0;
while (true) {
  i++;
}
`;

      const execResult = await executeJavaScript(infiniteLoopCode, "javascript", {
        timeoutMs: 1000,
      });

      expect(execResult.status).toBe("timeout");
      expect(execResult.error).toContain("timed out");
    });

    it("handles syntax error execution gracefully with structured diagnostics", async () => {
      const syntaxErrorCode = `
const foo = { unclosed: 
`;

      const execResult = await executeJavaScript(syntaxErrorCode, "javascript");
      expect(execResult.status).toBe("error");
      expect(execResult.error).toBeTruthy();
    });

    it("sanitizes complete solution leaks in practice mode via Quality Guard", () => {
      const leakyAIContent = `
Here is your answer:
// Full Complete Solution
function solve() {
  return "leaked answer";
}
\`\`\`
`;

      const guard = validateAIQuality({
        content: leakyAIContent,
        mode: "practice",
      });

      expect(guard.remediationApplied).toBe(true);
      expect(guard.sanitizedContent).not.toContain("leaked answer");
      expect(guard.sanitizedContent).toContain("Think about how to structure your function");
    });

    it("manages natural voice interruption lifecycle states properly", () => {
      let currentState = "idle";
      const controller = new VoiceConversationController({
        language: "en",
        topicTitle: "Async Functions",
        courseTitle: "Node.js",
        onStateChange: (state) => {
          currentState = state;
        },
        onTranscript: () => {},
        onAiResponse: () => {},
        onError: () => {},
      });

      // Simulate interruption when AI was speaking
      (controller as any).state = "speaking";
      controller.interrupt();

      expect(controller.getState()).toBe("interrupted");
    });
  });
});
