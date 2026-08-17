import { z } from "zod";
import type { TutorMode } from "@/types";

export const ExplainOutput = z.object({
  type: z.literal("explain"),
  summary: z.string().describe("A one-sentence summary of the explanation"),
  explanation: z.string().describe("The main explanation content"),
  keyPoints: z.array(z.string()).describe("3-5 key takeaways"),
  analogies: z.array(z.string()).optional().describe("Real-world analogies used"),
  relatedConcepts: z.array(z.string()).optional().describe("Related concepts to explore"),
  commonMisconceptions: z.array(z.string()).optional().describe("Common misunderstandings to avoid"),
});
export type ExplainOutput = z.infer<typeof ExplainOutput>;

export const CodeBreakdownOutput = z.object({
  type: z.literal("code-breakdown"),
  overview: z.string().describe("What the code does overall"),
  breakdown: z.array(z.object({
    lineRange: z.string().describe("e.g., '1-5' or '12'"),
    code: z.string().describe("The code snippet being explained"),
    explanation: z.string().describe("What this section does"),
    purpose: z.string().describe("Why this code exists"),
    gotchas: z.array(z.string()).optional().describe("Potential pitfalls"),
  })).describe("Line-by-line or block-by-block breakdown"),
  patterns: z.array(z.string()).optional().describe("Design patterns or idioms used"),
  improvements: z.array(z.string()).optional().describe("Suggested improvements"),
});
export type CodeBreakdownOutput = z.infer<typeof CodeBreakdownOutput>;

export const ExecutionTraceOutput = z.object({
  type: z.literal("execution"),
  steps: z.array(z.object({
    step: z.number(),
    line: z.number().optional(),
    description: z.string().describe("What happens at this step"),
    state: z.record(z.string(), z.unknown()).optional().describe("Variable state after this step"),
    callStack: z.array(z.string()).optional().describe("Current call stack"),
    memory: z.string().optional().describe("Memory state (heap, stack)"),
  })).describe("Step-by-step execution trace"),
  finalState: z.record(z.string(), z.unknown()).optional().describe("Final variable state"),
  output: z.string().optional().describe("Program output"),
  summary: z.string().describe("Summary of the execution flow"),
});
export type ExecutionTraceOutput = z.infer<typeof ExecutionTraceOutput>;

export const DebugOutput = z.object({
  type: z.literal("debug"),
  errorAnalysis: z.object({
    type: z.string().describe("Error type (syntax, runtime, logic, etc.)"),
    message: z.string().describe("What the error says"),
    severity: z.enum(["critical", "warning", "info"]),
  }).describe("Error analysis"),
  rootCause: z.string().describe("The root cause of the issue"),
  impactedCode: z.string().optional().describe("The problematic code section"),
  fix: z.object({
    description: z.string().describe("How to fix the issue"),
    code: z.string().optional().describe("The fixed code"),
    explanation: z.string().describe("Why the fix works"),
  }).describe("Fix description"),
  debuggingSteps: z.array(z.string()).describe("Steps to debug similar issues"),
  prevention: z.array(z.string()).optional().describe("How to prevent this in the future"),
});
export type DebugOutput = z.infer<typeof DebugOutput>;

export const HintOutput = z.object({
  type: z.literal("hint"),
  hints: z.array(z.object({
    level: z.number().min(1).max(5),
    hint: z.string().describe("The hint content"),
    reveals: z.string().optional().describe("What concept this hint reveals"),
    followUp: z.string().optional().describe("What to ask if they still need help"),
  })).describe("Progressive hints from subtle to specific"),
  currentLevel: z.number().describe("Which hint level was given"),
  nextLevelHint: z.string().optional().describe("Slightly more specific hint if needed"),
});
export type HintOutput = z.infer<typeof HintOutput>;

export const SocraticOutput = z.object({
  type: z.literal("socratic"),
  questions: z.array(z.object({
    type: z.enum(["clarifying", "probing", "challenging", "redirecting"]),
    question: z.string(),
    purpose: z.string().describe("What this question aims to reveal"),
    expectedResponse: z.string().optional().describe("What a good answer looks like"),
  })).describe("Socratic questions to guide learning"),
  guidance: z.string().describe("How to navigate these questions"),
  followUp: z.string().optional().describe("What to explore after answering"),
});
export type SocraticOutput = z.infer<typeof SocraticOutput>;

export const SimplifyOutput = z.object({
  type: z.literal("simplify"),
  eli5: z.string().describe("Explain Like I'm 5 version"),
  simpleExplanation: z.string().describe("Simplified but accurate explanation"),
  analogy: z.string().describe("Everyday analogy to understand the concept"),
  keyTerms: z.array(z.object({
    term: z.string(),
    simpleDefinition: z.string(),
  })).describe("Key terms with simple definitions"),
  visualDescription: z.string().optional().describe("How to visualize this concept"),
});
export type SimplifyOutput = z.infer<typeof SimplifyOutput>;

export const DeepDiveOutput = z.object({
  type: z.literal("deep-dive"),
  fundamentals: z.string().describe("Core theoretical foundations"),
  mechanics: z.string().describe("How it works under the hood"),
  advancedConcepts: z.array(z.string()).describe("Advanced concepts and nuances"),
  tradeoffs: z.array(z.object({
    approach: z.string(),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
  })).describe("Trade-offs between different approaches"),
  bestPractices: z.array(z.string()).describe("Industry best practices"),
  edgeCases: z.array(z.string()).describe("Edge cases and gotchas"),
  furtherReading: z.array(z.string()).optional().describe("References for further learning"),
});
export type DeepDiveOutput = z.infer<typeof DeepDiveOutput>;

export const VisualizeOutput = z.object({
  type: z.literal("visualize"),
  mentalModel: z.string().describe("Mental model or metaphor to understand the concept"),
  diagrams: z.array(z.object({
    type: z.enum(["mermaid", "flowchart", "sequence", "class", "state", "er"]),
    content: z.string().describe("Mermaid.js diagram syntax"),
    caption: z.string().describe("What the diagram shows"),
  })).describe("Visual diagrams"),
  spatialDescription: z.string().describe("Spatial/dimensional description of the concept"),
  animationDescription: z.string().optional().describe("How this would look animated"),
  stepByStep: z.array(z.string()).optional().describe("Step-by-step visual progression"),
});
export type VisualizeOutput = z.infer<typeof VisualizeOutput>;

export const CompareOutput = z.object({
  type: z.literal("compare"),
  items: z.array(z.object({
    name: z.string(),
    description: z.string(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    bestFor: z.array(z.string()),
    notIdealFor: z.array(z.string()),
  })).describe("Items being compared"),
  comparisonMatrix: z.array(z.object({
    aspect: z.string(),
    ratings: z.record(z.string(), z.number()).describe("Rating per item"),
  })).optional().describe("Comparison matrix"),
  recommendation: z.string().describe("Which to use when"),
  summary: z.string().describe("Overall comparison summary"),
});
export type CompareOutput = z.infer<typeof CompareOutput>;

export const InterviewOutput = z.object({
  type: z.literal("interview"),
  question: z.string().describe("The interview question"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  expectedApproach: z.string().describe("Expected approach to solve"),
  evaluation: z.object({
    correctness: z.number().min(0).max(10),
    efficiency: z.number().min(0).max(10),
    communication: z.number().min(0).max(10),
  }).optional().describe("Evaluation of student's answer"),
  optimalSolution: z.object({
    description: z.string(),
    code: z.string().optional(),
    complexity: z.string().describe("Time and space complexity"),
  }).describe("Optimal solution"),
  feedback: z.string().describe("Constructive feedback"),
  followUp: z.string().optional().describe("Follow-up question"),
});
export type InterviewOutput = z.infer<typeof InterviewOutput>;

export const PracticeOutput = z.object({
  type: z.literal("practice"),
  exercise: z.object({
    title: z.string(),
    description: z.string(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    starterCode: z.string().optional(),
    constraints: z.array(z.string()).optional(),
    expectedOutput: z.string().optional(),
  }).describe("Practice exercise"),
  hints: z.array(z.object({
    level: z.number().min(1).max(5),
    hint: z.string(),
  })).describe("Progressive hints"),
  solution: z.object({
    code: z.string(),
    explanation: z.string(),
    complexity: z.string().optional(),
  }).describe("Solution (only show after student attempts)"),
  variants: z.array(z.string()).optional().describe("Variations of the exercise"),
});
export type PracticeOutput = z.infer<typeof PracticeOutput>;

export const ReviewOutput = z.object({
  type: z.literal("review"),
  summary: z.string().describe("Summary of what was covered"),
  keyConcepts: z.array(z.object({
    concept: z.string(),
    understanding: z.string().describe("Brief explanation"),
    mastered: z.boolean().describe("Whether student appears to have mastered this"),
  })).describe("Key concepts review"),
  strengths: z.array(z.string()).describe("Areas of strength"),
  gaps: z.array(z.string()).describe("Knowledge gaps to address"),
  studyPlan: z.array(z.object({
    topic: z.string(),
    priority: z.enum(["high", "medium", "low"]),
    action: z.string(),
  })).describe("Suggested study plan"),
  nextSteps: z.array(z.string()).describe("Recommended next topics"),
});
export type ReviewOutput = z.infer<typeof ReviewOutput>;

export const EducationalExplanationOutput = z.object({
  type: z.literal("educational-explanation").default("educational-explanation"),
  answer: z.string().describe("Direct concise answer to the student's question"),
  explanation: z.string().describe("Clear, in-depth educational explanation"),
  steps: z.array(z.string()).default([]).describe("Step-by-step reasoning or execution steps"),
  examples: z.array(z.string()).optional().describe("Illustrative code examples"),
  visualization: z
    .object({
      highlightLines: z.array(z.number()).optional().describe("Line numbers in student code to visually highlight"),
      highlightEvents: z.array(z.number()).optional().describe("Sequence indices of events to highlight in the timeline"),
      focusVariable: z.string().optional().describe("Variable name to focus in Memory View"),
      diagramType: z.string().optional().describe("Type of diagram if relevant (e.g. 'flowchart', 'mermaid')"),
      diagramContent: z.string().optional().describe("Diagram code/definition"),
    })
    .optional()
    .describe("Visual highlight instructions for the frontend visualizer"),
  executionExplanation: z
    .object({
      whyExecuted: z.string().optional().describe("Why the specific line/block executed based on previous state"),
      variableChanges: z
        .array(
          z.object({
            variable: z.string(),
            from: z.unknown().optional(),
            to: z.unknown().optional(),
            reason: z.string(),
          })
        )
        .optional()
        .describe("Variable mutations that triggered or resulted from this execution"),
      callStackExplanation: z.string().optional().describe("Explanation of active call stack state"),
    })
    .optional()
    .describe("Execution-specific details"),
  mistakes: z.array(z.string()).optional().describe("Common mistakes or misconceptions related to this"),
  hints: z.array(z.string()).optional().describe("Hints for next steps or related exercises"),
  practice: z.array(z.string()).optional().describe("Follow-up practice questions or challenges"),
});
export type EducationalExplanationOutput = z.infer<typeof EducationalExplanationOutput>;

export const StructuredOutput = z.discriminatedUnion("type", [
  ExplainOutput,
  CodeBreakdownOutput,
  ExecutionTraceOutput,
  DebugOutput,
  HintOutput,
  SocraticOutput,
  SimplifyOutput,
  DeepDiveOutput,
  VisualizeOutput,
  CompareOutput,
  InterviewOutput,
  PracticeOutput,
  ReviewOutput,
  EducationalExplanationOutput,
]);
export type StructuredOutput = z.infer<typeof StructuredOutput>;

export const OutputSchemaMap: Record<TutorMode, z.ZodType> = {
  explain: ExplainOutput,
  "code-breakdown": CodeBreakdownOutput,
  execution: ExecutionTraceOutput,
  debug: DebugOutput,
  hint: HintOutput,
  socratic: SocraticOutput,
  simplify: SimplifyOutput,
  "deep-dive": DeepDiveOutput,
  visualize: VisualizeOutput,
  compare: CompareOutput,
  interview: InterviewOutput,
  practice: PracticeOutput,
  review: ReviewOutput,
};

export function getOutputSchema(mode: TutorMode): z.ZodType {
  return OutputSchemaMap[mode] || ExplainOutput;
}

export function getOutputSchemaDescription(mode: TutorMode): string {
  const schema = getOutputSchema(mode);
  const shape = (schema as any).shape || {};

  const fields = Object.entries(shape)
    .filter(([key]) => key !== "type")
    .map(([key, field]: [string, any]) => {
      const desc = field.description || "";
      const isOptional = field instanceof z.ZodOptional;
      return `${key}${isOptional ? "?" : ""}: ${desc}`;
    });

  return `Respond with a JSON object of type "${mode}" with these fields:\n${fields.join("\n")}`;
}

export const OutputFormatInstruction = `You MUST respond with a valid JSON object. The response must follow this exact structure based on the mode. Do NOT include markdown code fences around the JSON. Do NOT include any text outside the JSON object.`;

export function parseStructuredOutput(
  content: string,
  mode: TutorMode
): StructuredOutput | null {
  try {
    const schema = getOutputSchema(mode);
    let json: unknown;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      json = JSON.parse(jsonMatch[0]);
    } else {
      json = JSON.parse(content);
    }

    return schema.parse(json) as StructuredOutput;
  } catch {
    return null;
  }
}

export function formatStructuredOutputForDisplay(output: StructuredOutput): string {
  switch (output.type) {
    case "explain":
      return `## ${output.summary}\n\n${output.explanation}\n\n### Key Points\n${output.keyPoints.map((p) => `- ${p}`).join("\n")}`;

    case "code-breakdown":
      return `## Overview\n${output.overview}\n\n${output.breakdown.map((b) => `### Lines ${b.lineRange}\n\`\`\`\n${b.code}\n\`\`\`\n${b.explanation}\n**Purpose:** ${b.purpose}`).join("\n\n")}`;

    case "debug":
      return `## Error: ${output.errorAnalysis.message}\n\n**Root Cause:** ${output.rootCause}\n\n### Fix\n${output.fix.description}\n\n${output.fix.code ? `\`\`\`\n${output.fix.code}\n\`\`\`` : ""}\n\n**Why:** ${output.fix.explanation}`;

    case "hint":
      return output.hints.map((h) => `### Hint Level ${h.level}\n${h.hint}`).join("\n\n");

    case "socratic":
      return output.questions.map((q) => `**${q.type}:** ${q.question}`).join("\n\n");

    case "simplify":
      return `## ELI5\n${output.eli5}\n\n## Explanation\n${output.simpleExplanation}\n\n## Analogy\n${output.analogy}`;

    case "educational-explanation": {
      const parts = [`## ${output.answer}`, output.explanation];
      if (output.steps && output.steps.length > 0) {
        parts.push(`### Steps\n${output.steps.map((s, idx) => `${idx + 1}. ${s}`).join("\n")}`);
      }
      if (output.executionExplanation?.whyExecuted) {
        parts.push(`### Why This Executed\n${output.executionExplanation.whyExecuted}`);
      }
      if (output.executionExplanation?.variableChanges && output.executionExplanation.variableChanges.length > 0) {
        parts.push(
          `### Variable Changes\n${output.executionExplanation.variableChanges.map((vc) => `- **${vc.variable}**: ${vc.from !== undefined ? `${JSON.stringify(vc.from)} → ` : ""}${JSON.stringify(vc.to)} (${vc.reason})`).join("\n")}`
        );
      }
      if (output.mistakes && output.mistakes.length > 0) {
        parts.push(`### Common Mistakes to Avoid\n${output.mistakes.map((m) => `- ${m}`).join("\n")}`);
      }
      if (output.hints && output.hints.length > 0) {
        parts.push(`### Hints\n${output.hints.map((h) => `- ${h}`).join("\n")}`);
      }
      if (output.practice && output.practice.length > 0) {
        parts.push(`### Practice Challenges\n${output.practice.map((p) => `- ${p}`).join("\n")}`);
      }
      return parts.join("\n\n");
    }

    default:
      return JSON.stringify(output, null, 2);
  }
}

export function parseEducationalExplanation(
  content: string
): EducationalExplanationOutput | null {
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const json = JSON.parse(jsonMatch[0]);
    if (!json.type) json.type = "educational-explanation";
    return EducationalExplanationOutput.parse(json);
  } catch {
    return null;
  }
}