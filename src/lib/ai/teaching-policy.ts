/**
 * Configurable Professor Teaching Policy & Pedagogical Presence Layer
 * Defines versioned, structured teaching principles and execution policies.
 */

export interface TeachingPolicy {
  version: string;
  principles: {
    simpleFirst: boolean;
    whyBeforeHow: boolean;
    syntaxAfterConcept: boolean;
    visualWhenUseful: boolean;
    preventOverwhelm: boolean;
    verifyUnderstandingBeforeMoving: boolean;
  };
  analogyPreference: "real_world" | "system_metaphor" | "minimal";
  questioningStyle: "socratic" | "direct" | "diagnostic";
  difficultyRamp: "gradual" | "steep" | "adaptive";
  solutionPolicy: "never_reveal_full" | "guided_hints_only" | "reveal_after_3_attempts";
  misconceptionPolicy: "immediate_gentle_correction" | "socratic_counter_example";
  visualPolicy: "always_diagram_flows" | "on_request";
  masteryPolicy: {
    minPassRate: number;
    requireActiveVerification: boolean;
    requireCodeExecutionProof: boolean;
  };
}

export const DEFAULT_PROFESSOR_POLICY: TeachingPolicy = {
  version: "2026.1",
  principles: {
    simpleFirst: true,
    whyBeforeHow: true,
    syntaxAfterConcept: true,
    visualWhenUseful: true,
    preventOverwhelm: true,
    verifyUnderstandingBeforeMoving: true,
  },
  analogyPreference: "real_world",
  questioningStyle: "diagnostic",
  difficultyRamp: "adaptive",
  solutionPolicy: "guided_hints_only",
  misconceptionPolicy: "socratic_counter_example",
  visualPolicy: "always_diagram_flows",
  masteryPolicy: {
    minPassRate: 0.8,
    requireActiveVerification: true,
    requireCodeExecutionProof: true,
  },
};
