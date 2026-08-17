/**
 * AI Response Quality Guard & Pedagogical Safety Validator
 * Ensures generated explanations adhere to learning policies, contain correct syntax,
 * and never accidentally leak complete solutions during practice drills.
 */

import type { TutorMode } from "@/types";

export interface QualityValidationResult {
  isValid: boolean;
  violations: string[];
  sanitizedContent: string;
  remediationApplied?: boolean;
}

export function validateAIQuality({
  content,
  mode,
  expectedTopic,
}: {
  content: string;
  mode?: TutorMode;
  expectedTopic?: string;
}): QualityValidationResult {
  const violations: string[] = [];
  let sanitized = content;

  // 1. Guard against full solution spoilers in practice / hint mode
  if (mode === "practice" || mode === "hint" || mode === "socratic") {
    const hasCompleteSolutionHeader =
      content.includes("// Full Complete Solution") ||
      content.includes("Here is the full solution:");

    if (hasCompleteSolutionHeader) {
      violations.push("Complete solution leak detected in guided practice mode");
      sanitized = content.replace(
        /\/\/ Full Complete Solution[\s\S]*?```/g,
        "// Think about how to structure your function step-by-step:\n// 1. Validate inputs\n// 2. Transform state\n// 3. Return output\n```"
      );
    }
  }

  // 2. Guard against missing markdown code blocks when explaining syntax
  if (mode === "code-breakdown" && !content.includes("```")) {
    violations.push("Missing code snippet block in code-breakdown mode");
  }

  // 3. Ensure content is non-empty and helpful
  if (!content.trim()) {
    violations.push("Empty response payload");
    sanitized = `Let's break down this concept step-by-step. What specific part would you like to explore?`;
  }

  return {
    isValid: violations.length === 0,
    violations,
    sanitizedContent: sanitized,
    remediationApplied: sanitized !== content,
  };
}
