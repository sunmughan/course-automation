import type { TutorMode } from "@/types";

export type HintLevel = 1 | 2 | 3 | 4 | 5;

export interface HintStrategy {
  level: HintLevel;
  name: string;
  description: string;
  template: string;
  revealAmount: number;
  requiresResponse: boolean;
}

export interface FeedbackTemplate {
  type: "positive" | "constructive" | "correction" | "encouragement";
  tone: string;
  template: string;
  whenToUse: string[];
}

export interface FeedbackContext {
  studentName?: string;
  concept: string;
  attempts: number;
  isCorrect: boolean;
  partialCorrect: boolean;
  commonMistake?: string;
  previousFeedback?: string;
}

export const HINT_STRATEGIES: HintStrategy[] = [
  {
    level: 1,
    name: "Nudge",
    description: "A very subtle hint that only points in the general direction",
    template: "Think about what {concept} means in this context. What is the core idea?",
    revealAmount: 0.1,
    requiresResponse: false,
  },
  {
    level: 2,
    name: "Conceptual Hint",
    description: "Reference a specific concept that applies",
    template: "This relates to {concept}. Remember that {key_insight}.",
    revealAmount: 0.25,
    requiresResponse: false,
  },
  {
    level: 3,
    name: "Directional Hint",
    description: "Point toward the specific approach",
    template: "Try approaching this by {approach}. For example, you might want to {suggestion}.",
    revealAmount: 0.5,
    requiresResponse: true,
  },
  {
    level: 4,
    name: "Structured Hint",
    description: "Provide a structured breakdown without full solution",
    template: "Here's the structure:\n1. {step1}\n2. {step2}\n3. {step3}\nNow fill in the details.",
    revealAmount: 0.75,
    requiresResponse: true,
  },
  {
    level: 5,
    name: "Near-Solution",
    description: "Almost complete solution with one step left for the student",
    template: "The solution looks like this:\n```\n{partial_code}\n```\nYou need to implement {missing_part}. Can you complete it?",
    revealAmount: 0.9,
    requiresResponse: true,
  },
];

export const FEEDBACK_TEMPLATES: FeedbackTemplate[] = [
  {
    type: "positive",
    tone: "celebratory",
    template: "Excellent work! {achievement}. You've clearly understood {concept}.",
    whenToUse: ["student solved correctly", "first attempt success", "showed improvement"],
  },
  {
    type: "constructive",
    tone: "supportive",
    template: "You're on the right track with {strength}. Let's refine {area_to_improve}.",
    whenToUse: ["partial solution", "close to correct", "minor mistakes"],
  },
  {
    type: "correction",
    tone: "gentle",
    template: "I see where you're going, but {correction_point}. Let me explain why...",
    whenToUse: ["incorrect approach", "misunderstanding", "fundamental error"],
  },
  {
    type: "encouragement",
    tone: "motivational",
    template: "Don't worry! {concept} is tricky. Many developers struggle with this. {encouragement}",
    whenToUse: ["student frustrated", "multiple attempts", "losing confidence"],
  },
];

export function getHintLevel(
  previousAttempts: number,
  hasShownLevel1: boolean,
  hasShownLevel2: boolean,
  hasShownLevel3: boolean,
  hasShownLevel4: boolean
): HintLevel {
  if (previousAttempts === 0) return 1;
  if (previousAttempts === 1 && !hasShownLevel2) return 2;
  if (previousAttempts === 2 && !hasShownLevel3) return 3;
  if (previousAttempts >= 3 && !hasShownLevel4) return 4;
  if (previousAttempts >= 5) return 5;
  return 3;
}

export function generateHint(
  level: HintLevel,
  context: {
    concept: string;
    keyInsight?: string;
    approach?: string;
    suggestion?: string;
    steps?: string[];
    partialCode?: string;
    missingPart?: string;
  }
): string {
  const strategy = HINT_STRATEGIES.find((s) => s.level === level)!;

  let hint = strategy.template
    .replace("{concept}", context.concept)
    .replace("{key_insight}", context.keyInsight || "the key is to think step by step")
    .replace("{approach}", context.approach || "breaking it down into smaller parts")
    .replace("{suggestion}", context.suggestion || "write out the logic in pseudocode first")
    .replace("{step1}", context.steps?.[0] || "Identify the input and output")
    .replace("{step2}", context.steps?.[1] || "Define the core logic")
    .replace("{step3}", context.steps?.[2] || "Handle edge cases")
    .replace("{partial_code}", context.partialCode || "// Your code goes here")
    .replace("{missing_part}", context.missingPart || "the final logic");

  return hint;
}

export function generateFeedback(
  context: FeedbackContext
): { type: string; message: string; followUp?: string } {
  let template: FeedbackTemplate;

  if (context.isCorrect && context.attempts === 1) {
    template = FEEDBACK_TEMPLATES[0];
  } else if (context.isCorrect && context.attempts > 1) {
    template = FEEDBACK_TEMPLATES[0];
  } else if (context.partialCorrect) {
    template = FEEDBACK_TEMPLATES[1];
  } else if (context.attempts >= 3) {
    template = FEEDBACK_TEMPLATES[3];
  } else {
    template = FEEDBACK_TEMPLATES[2];
  }

  let message = template.template
    .replace("{concept}", context.concept)
    .replace("{achievement}", context.isCorrect
      ? `You correctly implemented ${context.concept}`
      : "You're making progress")
    .replace("{strength}", context.partialCorrect
      ? "your approach direction"
      : "your effort")
    .replace("{area_to_improve}", context.commonMistake || "the implementation")
    .replace("{correction_point}", context.commonMistake || "there's a small issue")
    .replace("{encouragement}", "Keep practicing and it will click!");

  if (context.studentName) {
    message = `${context.studentName}, ${message.charAt(0).toLowerCase() + message.slice(1)}`;
  }

  return {
    type: template.type,
    message,
    followUp: context.isCorrect
      ? "Would you like to try a harder variation?"
      : "Would you like a hint to help you move forward?",
  };
}

export function calculateConfidence(
  attempts: number,
  isCorrect: boolean,
  timeSpent: number,
  previousAttemptsCorrect: number
): { score: number; level: "high" | "medium" | "low"; recommendation: string } {
  let score = 50;

  if (isCorrect) score += 20;
  if (attempts === 1) score += 10;
  if (timeSpent < 120) score += 10;
  if (previousAttemptsCorrect > 0) score += 10;
  if (attempts > 3) score -= 10;
  if (timeSpent > 300) score -= 10;

  const level = score >= 70 ? "high" : score >= 40 ? "medium" : "low";

  let recommendation: string;
  if (level === "high") {
    recommendation = "Student is confident. Consider moving to more challenging material.";
  } else if (level === "medium") {
    recommendation = "Student is moderately confident. Provide targeted practice.";
  } else {
    recommendation = "Student needs more support. Provide additional examples and guided practice.";
  }

  return { score, level, recommendation };
}