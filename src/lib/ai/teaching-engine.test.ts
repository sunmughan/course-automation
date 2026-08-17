import { describe, it, expect } from "vitest";
import { teachingEngine } from "@/lib/ai/teaching-engine";
import { buildTopicIntelligence } from "@/lib/curriculum/intelligence";

describe("Professor Teaching Engine (22-Point Pedagogical Framework)", () => {
  it("builds topic intelligence without hallucinating required metadata", () => {
    const node = buildTopicIntelligence({
      topicId: "topic_closures",
      topicSlug: "closures-lexical-scope",
      topicTitle: "Closures & Lexical Scope",
      courseTitle: "JavaScript & Node.js Core",
      prerequisites: ["variables-data-types", "functions-scope"],
    });

    expect(node.topicTitle).toBe("Closures & Lexical Scope");
    expect(node.prerequisites).toContain("functions-scope");
    expect(node.mentalModel.analogy).toBeTruthy();
    expect(node.syntax.breakdown.length).toBeGreaterThan(0);
    expect(node.counterExamples.length).toBeGreaterThan(0);
    expect(node.useCases.length).toBeGreaterThan(0);
    expect(node.misconceptions.length).toBeGreaterThan(0);
  });

  it("plans foundational depth with analogies for novice students", () => {
    const knowledge = buildTopicIntelligence({
      topicId: "topic_event_loop",
      topicSlug: "event-loop",
      topicTitle: "Node.js Event Loop",
    });

    const plan = teachingEngine.planPedagogy(
      {
        userId: "user_novice_1",
        topicId: "topic_event_loop",
        topicSlug: "event-loop",
        topicTitle: "Node.js Event Loop",
        courseTitle: "Node.js Architecture",
        studentSkillScore: 25,
        studentAttempts: 1,
        previousMistakes: [],
        detectedMisconceptions: [],
        studentQuery: "Sir, what is the event loop?",
      },
      knowledge
    );

    expect(plan.explanationDepth).toBe("foundational");
    expect(plan.includeAnalogy).toBe(true);
    expect(plan.includeSyntaxBreakdown).toBe(true);
  });

  it("generates structured 22-point pedagogical response with understanding check question", async () => {
    const response = await teachingEngine.teach({
      userId: "user_test_2",
      topicId: "topic_jwt",
      topicSlug: "jwt-authentication",
      topicTitle: "JWT Authentication & Security",
      courseTitle: "Backend Architecture",
      studentSkillScore: 60,
      studentAttempts: 3,
      previousMistakes: [{ error: "Missing token signature verification" }],
      detectedMisconceptions: ["JWT payload is encrypted by default"],
      studentQuery: "JWT kya hota hai aur isko kaise use karein?",
    });

    expect(response.simpleDefinition).toBeTruthy();
    expect(response.whyItExists).toBeTruthy();
    expect(response.mentalModelAnalogy).toBeTruthy();
    expect(response.howItWorks).toBeTruthy();
    expect(response.codeExample.code).toBeTruthy();
    expect(response.understandingCheckQuestion.options.length).toBe(4);
    expect(response.understandingCheckQuestion.correctIndex).toBe(0);
    expect(response.teacherNote).toContain("Professor Note");
  });
});
