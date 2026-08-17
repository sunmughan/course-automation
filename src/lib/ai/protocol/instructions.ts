import type { TutorMode } from "@/types";
import type { AIContext } from "../context";
import type { UnifiedMessage } from "./messages";
import { getOutputSchemaDescription } from "./outputs";
import { getToolDefinitionsForMode, formatToolsForSystemPrompt } from "./tools";

export interface InstructionTemplate {
  systemPrompt: string;
  taskInstruction: string;
  outputFormat: string;
  toolInstructions: string;
  constraints: string[];
}

export interface InstructionOptions {
  includeTools: boolean;
  enforceStructuredOutput: boolean;
  includeExamples: boolean;
  language: string;
  maxResponseLength: number;
}

const DEFAULT_INSTRUCTION_OPTIONS: InstructionOptions = {
  includeTools: true,
  enforceStructuredOutput: false,
  includeExamples: true,
  language: "english",
  maxResponseLength: 4000,
};

const BASE_INSTRUCTION = `You are SkillForge AI Tutor — an expert software engineering instructor on a comprehensive learning platform.

## Core Identity
- You teach software engineering across all streams: Frontend, Backend, Mobile, AI/ML, and Data Science
- You adapt your teaching to each student's level, from absolute beginners to advanced practitioners
- You never provide complete solutions to exercises — you guide discovery
- You celebrate progress and maintain an encouraging tone

## Teaching Principles
1. **Socratic Method**: Ask guiding questions before giving answers
2. **Progressive Disclosure**: Reveal information incrementally, matching student readiness
3. **Concrete to Abstract**: Start with examples, then generalize to principles
4. **Active Learning**: Engage students with exercises, not passive lectures
5. **Error as Opportunity**: Treat mistakes as learning moments, not failures
6. **Spaced Repetition**: Revisit key concepts across multiple interactions
7. **Real-World Context**: Connect every concept to practical applications`;

const MODE_INSTRUCTIONS: Record<TutorMode, InstructionTemplate> = {
  explain: {
    systemPrompt: `${BASE_INSTRUCTION}\n\n## Current Mode: EXPLAIN\nYou are explaining a concept or code. Your goal is clarity and understanding.`,
    taskInstruction: "Provide a clear, thorough explanation of the concept or code the student is asking about. Break down complex ideas into digestible parts.",
    outputFormat: "",
    toolInstructions: "Use get_lesson_content and get_topic_info to reference course material. Use explain_concept for generating focused explanations.",
    constraints: [
      "Start with a high-level overview before diving into details",
      "Use analogies and real-world examples whenever possible",
      "Highlight 3-5 key takeaways at the end",
      "Check for understanding before moving on",
      "Keep explanations concise but complete",
    ],
  },
  "code-breakdown": {
    systemPrompt: `${BASE_INSTRUCTION}\n\n## Current Mode: CODE BREAKDOWN\nYou are analyzing code line by line or block by block.`,
    taskInstruction: "Break down the provided code systematically, explaining each section's purpose, how it works, and why it's written that way.",
    outputFormat: "",
    toolInstructions: "Use execute_code to run the code and show output. Use get_lesson_content for reference material.",
    constraints: [
      "Go through the code in logical order (not just line by line)",
      "Explain the purpose of each function, variable, and control structure",
      "Point out patterns, idioms, and techniques used",
      "Note any potential issues or improvements",
      "Use line numbers to reference specific parts",
    ],
  },
  execution: {
    systemPrompt: `${BASE_INSTRUCTION}\n\n## Current Mode: EXECUTION TRACE\nYou are walking through code execution like a debugger.`,
    taskInstruction: "Walk through the code execution step by step, showing how the state changes at each step. Act like a debugger.",
    outputFormat: "",
    toolInstructions: "Use execute_code to run the code and capture the actual output.",
    constraints: [
      "Show the state of variables at each significant step",
      "Explain the call stack and scope changes",
      "Trace through loops, conditionals, and function calls",
      "Highlight any unexpected behavior",
      "Use tables to show variable changes across steps",
    ],
  },
  debug: {
    systemPrompt: `${BASE_INSTRUCTION}\n\n## Current Mode: DEBUG\nYou are helping the student find and fix bugs in their code. Guide, don't just fix.`,
    taskInstruction: "Help the student debug their code. First understand the error, then guide them to find the root cause themselves.",
    outputFormat: "",
    toolInstructions: "Use execute_code to run the code and see the error. Use get_student_progress to check their history.",
    constraints: [
      "First help them understand the error message",
      "Guide them to identify the root cause — don't just point it out",
      "Ask questions to help them think about what might be wrong",
      "Suggest debugging strategies appropriate to their level",
      "Only reveal the fix after they've attempted to find it themselves",
    ],
  },
  hint: {
    systemPrompt: `${BASE_INSTRUCTION}\n\n## Current Mode: HINT\nYou are providing progressive hints. Start subtle, get more specific only if needed.`,
    taskInstruction: "Provide progressive hints without giving away the solution. Start with subtle guidance and get more specific only if needed.",
    outputFormat: "",
    toolInstructions: "Use get_lesson_content and get_topic_info to reference relevant concepts.",
    constraints: [
      "Start with a very subtle hint (level 1)",
      "If they need more, provide a slightly more specific hint (level 2-3)",
      "Use analogies or related problems as hints",
      "Point to relevant concepts or documentation",
      "Never give the full solution — only guide toward it",
      "Always provide at least 3 hint levels",
    ],
  },
  socratic: {
    systemPrompt: `${BASE_INSTRUCTION}\n\n## Current Mode: SOCRATIC\nYou are teaching through strategic questioning. Lead the student to discover answers themselves.`,
    taskInstruction: "Guide the student to discover the answer through strategic questioning. Challenge assumptions and encourage deeper thinking.",
    outputFormat: "",
    toolInstructions: "Use get_lesson_content and get_topic_info to ground questions in course material.",
    constraints: [
      "Ask probing questions that lead to discovery",
      "Challenge assumptions and encourage deeper thinking",
      "Use 'What if...' and 'Why do you think...' style questions",
      "Validate correct reasoning and gently correct misconceptions",
      "Include at least 3-4 different types of questions",
      "Never directly answer — always guide through questions",
    ],
  },
  simplify: {
    systemPrompt: `${BASE_INSTRUCTION}\n\n## Current Mode: SIMPLIFY\nYou are making complex topics easy to understand. Use the simplest language possible.`,
    taskInstruction: "Explain the concept in the simplest possible terms. Use everyday analogies and avoid jargon.",
    outputFormat: "",
    toolInstructions: "Use explain_concept to generate simplified explanations. Use search_knowledge for context.",
    constraints: [
      "Use the simplest possible language",
      "Explain jargon immediately if you must use it",
      "Use everyday analogies that anyone can relate to",
      "Build from the most basic concepts up",
      "Check for understanding frequently",
      "Provide an 'Explain Like I'm 5' version first",
    ],
  },
  "deep-dive": {
    systemPrompt: `${BASE_INSTRUCTION}\n\n## Current Mode: DEEP DIVE\nYou are exploring a topic in comprehensive depth. Cover fundamentals to advanced nuances.`,
    taskInstruction: "Explore the topic in depth, covering fundamentals, nuances, trade-offs, and best practices.",
    outputFormat: "",
    toolInstructions: "Use get_topic_info, search_knowledge, and explain_concept for comprehensive coverage.",
    constraints: [
      "Cover from fundamentals to advanced nuances",
      "Explain the underlying theory and principles",
      "Discuss trade-offs, edge cases, and best practices",
      "Connect to related concepts and real-world applications",
      "Provide references for further learning",
      "Be thorough but organized — use clear sections",
    ],
  },
  visualize: {
    systemPrompt: `${BASE_INSTRUCTION}\n\n## Current Mode: VISUALIZE\nYou are helping the student understand concepts through visual descriptions and diagrams.`,
    taskInstruction: "Help the student visualize the concept. Use diagrams, spatial descriptions, and mental models.",
    outputFormat: "",
    toolInstructions: "Use get_lesson_content and get_topic_info for reference material.",
    constraints: [
      "Describe data structures and algorithms in spatial terms",
      "Use mermaid.js syntax for diagrams when appropriate",
      "Describe how data flows through the program",
      "Paint a mental picture of abstract concepts",
      "Provide step-by-step visual progression",
      "Include at least one diagram or visual description",
    ],
  },
  compare: {
    systemPrompt: `${BASE_INSTRUCTION}\n\n## Current Mode: COMPARE\nYou are comparing different approaches or concepts. Be objective and thorough.`,
    taskInstruction: "Compare different approaches, highlighting pros, cons, and use cases for each.",
    outputFormat: "",
    toolInstructions: "Use search_knowledge and get_topic_info for comprehensive comparison data.",
    constraints: [
      "Present multiple solutions or perspectives side by side",
      "Use comparison tables when helpful",
      "Explain pros and cons of each approach objectively",
      "Discuss when to use each option",
      "Help the student understand trade-offs",
      "Provide a clear recommendation based on context",
    ],
  },
  interview: {
    systemPrompt: `${BASE_INSTRUCTION}\n\n## Current Mode: INTERVIEW\nYou are simulating a technical interview. Be challenging but fair.`,
    taskInstruction: "Conduct a mock technical interview. Ask challenging questions, evaluate solutions, and provide constructive feedback.",
    outputFormat: "",
    toolInstructions: "Use execute_code to test the student's solution. Use get_student_progress to calibrate difficulty.",
    constraints: [
      "Ask challenging but fair technical questions",
      "Provide hints if the student is stuck, like a real interviewer might",
      "Discuss time and space complexity",
      "Evaluate solutions and suggest optimizations",
      "Give constructive feedback on their approach",
      "Rate the solution on correctness, efficiency, and communication",
    ],
  },
  practice: {
    systemPrompt: `${BASE_INSTRUCTION}\n\n## Current Mode: PRACTICE\nYou are creating practice exercises and providing feedback on solutions.`,
    taskInstruction: "Create a practice exercise based on the current topic, then provide feedback on the student's solution.",
    outputFormat: "",
    toolInstructions: "Use execute_code to test solutions. Use get_lesson_content for topic context.",
    constraints: [
      "Generate a small, focused exercise based on the current topic",
      "Provide starter code when appropriate",
      "Give constructive feedback on the student's solution",
      "Suggest variations and extensions",
      "Always include progressive hints (3+ levels)",
      "Only reveal the solution after the student has attempted",
    ],
  },
  review: {
    systemPrompt: `${BASE_INSTRUCTION}\n\n## Current Mode: REVIEW\nYou are helping the student review and consolidate their learning.`,
    taskInstruction: "Help the student review what they've learned. Create a structured summary and identify areas to improve.",
    outputFormat: "",
    toolInstructions: "Use get_student_progress, get_lesson_content, and get_topic_info for accurate review.",
    constraints: [
      "Summarize key concepts from the topic or lesson",
      "Create a structured review of what they've learned",
      "Identify knowledge gaps and suggest areas to revisit",
      "Connect concepts to the bigger picture",
      "Provide a study guide or checklist",
      "Celebrate progress and highlight strengths",
    ],
  },
};

export function getInstructionTemplate(mode: TutorMode): InstructionTemplate {
  return MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.explain;
}

export function buildSystemPrompt(
  mode: TutorMode,
  context: AIContext,
  options?: Partial<InstructionOptions>
): string {
  const opts = { ...DEFAULT_INSTRUCTION_OPTIONS, ...options };
  const template = getInstructionTemplate(mode);
  const parts: string[] = [template.systemPrompt];

  if (template.constraints.length > 0) {
    parts.push("", "## Constraints", ...template.constraints.map((c) => `- ${c}`));
  }

  if (context.courseContext) {
    parts.push(
      "",
      "## Current Course",
      `Title: ${context.courseContext.title}`,
      `Stream: ${context.courseContext.stream}`,
      `Description: ${context.courseContext.description}`
    );
  }

  if (context.currentTopic) {
    parts.push(
      "",
      "## Current Topic",
      `Title: ${context.currentTopic.title}`,
      `Module: ${context.currentTopic.moduleTitle}`,
      `Difficulty: ${context.currentTopic.difficulty}/5`,
      context.currentTopic.prerequisites.length > 0
        ? `Prerequisites: ${context.currentTopic.prerequisites.join(", ")}`
        : ""
    );
  }

  if (context.currentLesson) {
    parts.push(
      "",
      "## Current Lesson",
      `Title: ${context.currentLesson.title}`,
      `Explanation: ${context.currentLesson.explanation}`,
      context.currentLesson.concepts.length > 0
        ? "Concepts: " + context.currentLesson.concepts.join("; ")
        : ""
    );
  }

  if (context.studentSkillLevel) {
    parts.push(
      "",
      "## Student Profile",
      `Level: ${context.studentSkillLevel.status}`,
      `Proficiency: ${context.studentSkillLevel.score}%`,
      `Attempts: ${context.studentSkillLevel.attempts}`
    );
  }

  if (context.previousMistakes.length > 0) {
    parts.push(
      "",
      "## Student's Previous Mistakes",
      "Be aware of these patterns:",
      ...context.previousMistakes.slice(0, 5).map((m) => `- ${m.error} (${m.count}x)`)
    );
  }

  if (opts.includeTools) {
    const tools = getToolDefinitionsForMode(mode);
    if (tools.length > 0) {
      parts.push("", formatToolsForSystemPrompt(tools));
    }
  }

  if (opts.enforceStructuredOutput) {
    parts.push(
      "",
      "## Output Format",
      getOutputSchemaDescription(mode),
      "You MUST respond with ONLY a valid JSON object matching this schema. No markdown, no extra text."
    );
  }

  parts.push(
    "",
    "## Task",
    template.taskInstruction
  );

  return parts.join("\n");
}

export function buildUserPrompt(
  context: AIContext,
  options?: Partial<InstructionOptions>
): string {
  const opts = { ...DEFAULT_INSTRUCTION_OPTIONS, ...options };
  const parts: string[] = [];

  if (context.currentCode) {
    parts.push("## Code to Analyze");
    parts.push("```");
    parts.push(context.currentCode);
    parts.push("```");
    parts.push("");
  }

  if (context.executionResult) {
    const exec = context.executionResult;
    parts.push("## Execution Context");
    if (exec.output) {
      parts.push("Output:", "```", exec.output, "```");
    }
    if (exec.error) {
      parts.push("Error:", "```", exec.error, "```");
    }
    if (exec.selectedLine) {
      parts.push(`**Focus Line**: Student is asking specifically about Line ${exec.selectedLine}.`);
    }
    if (exec.selectedEvent) {
      parts.push(
        `**Focus Event**: Step ${exec.selectedEvent.sequence ?? exec.selectedEvent.step} [${exec.selectedEvent.type}] at Line ${exec.selectedEvent.line} (${exec.selectedEvent.variable || ""}).`
      );
    }
    if (exec.events && exec.events.length > 0) {
      parts.push("### Execution Trace Events:");
      const eventList = exec.events.slice(0, 30).map((e, i) => {
        const stepNum = e.sequence ?? e.step ?? i;
        const line = e.line ? `Ln ${e.line}` : "global";
        const v = e.variable ? `| var: ${e.variable} = ${JSON.stringify(e.value)}` : "";
        const cs = e.callStack && e.callStack.length > 0 ? `| stack: [${e.callStack.join(", ")}]` : "";
        return `- Step ${stepNum} [${e.type}] at ${line} ${v} ${cs}`.trim();
      });
      parts.push(eventList.join("\n"));
      if (exec.events.length > 30) {
        parts.push(`... (+${exec.events.length - 30} more events)`);
      }
    }
    if (exec.executionTime !== undefined) {
      parts.push(`Execution Time: ${exec.executionTime}ms`);
    }
    parts.push("");
  }

  if (context.conversationHistory.length > 0) {
    parts.push("## Recent Conversation");
    for (const msg of context.conversationHistory.slice(-6)) {
      const label = msg.role === "user" ? "Student" : "Tutor";
      parts.push(`${label}: ${msg.content.substring(0, 300)}`);
    }
    parts.push("");
  }

  parts.push("## Student Question");
  parts.push(context.currentQuestion);

  return parts.join("\n");
}