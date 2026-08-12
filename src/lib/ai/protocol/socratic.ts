import type { TutorMode } from "@/types";

export type SocraticQuestionType =
  | "clarifying"
  | "probing_assumptions"
  | "probing_reasons"
  | "probing_implications"
  | "challenging_viewpoint"
  | "examining_evidence"
  | "questioning_question"
  | "redirecting"
  | "summarizing"
  | "connecting";

export interface SocraticQuestionTemplate {
  type: SocraticQuestionType;
  template: string;
  purpose: string;
  example: string;
}

export interface SocraticStrategy {
  name: string;
  description: string;
  whenToUse: string[];
  questionSequence: SocraticQuestionType[];
  fallbackQuestions: string[];
}

export const SOCRATIC_QUESTION_TEMPLATES: SocraticQuestionTemplate[] = [
  {
    type: "clarifying",
    template: "What do you mean when you say '{concept}'?",
    purpose: "Ensure understanding of the student's current knowledge",
    example: "What do you mean when you say 'asynchronous programming'?",
  },
  {
    type: "probing_assumptions",
    template: "What assumptions are you making about {concept}?",
    purpose: "Surface hidden assumptions the student may have",
    example: "What assumptions are you making about how the event loop works?",
  },
  {
    type: "probing_reasons",
    template: "Why do you think {statement} is the case?",
    purpose: "Explore the reasoning behind the student's statements",
    example: "Why do you think using a for loop is better than forEach here?",
  },
  {
    type: "probing_implications",
    template: "What would happen if {scenario}?",
    purpose: "Explore consequences and edge cases",
    example: "What would happen if the API call fails and we don't handle the error?",
  },
  {
    type: "challenging_viewpoint",
    template: "What would someone who disagrees with {statement} say?",
    purpose: "Encourage considering alternative perspectives",
    example: "What would someone who prefers functional programming say about your solution?",
  },
  {
    type: "examining_evidence",
    template: "How could you verify that {statement}?",
    purpose: "Encourage evidence-based thinking",
    example: "How could you verify that your code handles all edge cases?",
  },
  {
    type: "questioning_question",
    template: "Why is {question} important to you?",
    purpose: "Understand the student's motivation and goals",
    example: "Why is understanding closures important to you?",
  },
  {
    type: "redirecting",
    template: "Before we explore {topic}, let's first consider {prerequisite}.",
    purpose: "Guide the student to foundational knowledge",
    example: "Before we explore React hooks, let's first consider how JavaScript functions work.",
  },
  {
    type: "summarizing",
    template: "So from what you've said, {summary}. Is that correct?",
    purpose: "Confirm understanding and consolidate learning",
    example: "So from what you've said, you understand that promises handle async operations. Is that correct?",
  },
  {
    type: "connecting",
    template: "How does {concept} relate to {related_concept} that you've already learned?",
    purpose: "Build connections between concepts",
    example: "How does the virtual DOM relate to the actual DOM that you've already learned about?",
  },
];

export const SOCRATIC_STRATEGIES: SocraticStrategy[] = [
  {
    name: "Concept Introduction",
    description: "Guide the student to discover a new concept through questioning",
    whenToUse: ["student is learning a new topic", "concept is not yet understood"],
    questionSequence: [
      "clarifying",
      "probing_assumptions",
      "probing_reasons",
      "summarizing",
      "connecting",
    ],
    fallbackQuestions: [
      "What do you already know about this topic?",
      "Can you think of a real-world example of this?",
      "What would you like to understand better?",
    ],
  },
  {
    name: "Misconception Correction",
    description: "Gently guide the student away from a misconception",
    whenToUse: ["student has wrong understanding", "concept is misunderstood"],
    questionSequence: [
      "clarifying",
      "probing_assumptions",
      "challenging_viewpoint",
      "examining_evidence",
      "summarizing",
    ],
    fallbackQuestions: [
      "What evidence do you have for that?",
      "What if we tested that assumption?",
      "Can you think of a counterexample?",
    ],
  },
  {
    name: "Problem Solving",
    description: "Guide the student to solve a problem through questioning",
    whenToUse: ["student is stuck on a problem", "trying to solve code challenge"],
    questionSequence: [
      "clarifying",
      "probing_reasons",
      "probing_implications",
      "redirecting",
      "summarizing",
    ],
    fallbackQuestions: [
      "What have you tried so far?",
      "What's the simplest case you can think of?",
      "What would happen if you broke this into smaller steps?",
    ],
  },
  {
    name: "Deep Understanding",
    description: "Push the student to deeper levels of understanding",
    whenToUse: ["student has surface-level understanding", "ready for deeper knowledge"],
    questionSequence: [
      "clarifying",
      "probing_implications",
      "challenging_viewpoint",
      "examining_evidence",
      "connecting",
    ],
    fallbackQuestions: [
      "Why is this the best approach?",
      "What are the trade-offs here?",
      "How would this scale?",
    ],
  },
];

export function generateSocraticQuestions(
  topic: string,
  studentLevel: string,
  count: number = 3
): Array<{ type: SocraticQuestionType; question: string; purpose: string }> {
  const questions: Array<{ type: SocraticQuestionType; question: string; purpose: string }> = [];

  const shuffled = [...SOCRATIC_QUESTION_TEMPLATES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  for (const template of selected) {
    questions.push({
      type: template.type,
      question: template.template
        .replace("{concept}", topic)
        .replace("{topic}", topic)
        .replace("{related_concept}", "related concepts")
        .replace("{statement}", `your understanding of ${topic}`)
        .replace("{scenario}", `we changed the approach to ${topic}`)
        .replace("{question}", `learning about ${topic}`)
        .replace("{summary}", `you're learning about ${topic} and have some initial understanding`),
      purpose: template.purpose,
    });
  }

  return questions;
}

export function selectSocraticStrategy(
  studentState: string,
  topicDifficulty: number
): SocraticStrategy {
  if (studentState === "stuck" || studentState === "confused") {
    return SOCRATIC_STRATEGIES.find((s) => s.name === "Problem Solving")!;
  }
  if (topicDifficulty <= 2) {
    return SOCRATIC_STRATEGIES.find((s) => s.name === "Concept Introduction")!;
  }
  if (topicDifficulty >= 4) {
    return SOCRATIC_STRATEGIES.find((s) => s.name === "Deep Understanding")!;
  }
  return SOCRATIC_STRATEGIES.find((s) => s.name === "Misconception Correction")!;
}

export function evaluateStudentResponse(
  response: string,
  expectedConcepts: string[]
): {
  understanding: "high" | "medium" | "low";
  coveredConcepts: string[];
  missingConcepts: string[];
  nextQuestionType: SocraticQuestionType;
} {
  const lowerResponse = response.toLowerCase();
  const coveredConcepts = expectedConcepts.filter((c) =>
    lowerResponse.includes(c.toLowerCase())
  );
  const missingConcepts = expectedConcepts.filter(
    (c) => !lowerResponse.includes(c.toLowerCase())
  );

  const coverage = coveredConcepts.length / Math.max(expectedConcepts.length, 1);

  let understanding: "high" | "medium" | "low";
  let nextQuestionType: SocraticQuestionType;

  if (coverage >= 0.7) {
    understanding = "high";
    nextQuestionType = "connecting";
  } else if (coverage >= 0.4) {
    understanding = "medium";
    nextQuestionType = "probing_implications";
  } else {
    understanding = "low";
    nextQuestionType = "clarifying";
  }

  return { understanding, coveredConcepts, missingConcepts, nextQuestionType };
}