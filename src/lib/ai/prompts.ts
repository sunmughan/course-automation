import type { TutorMode } from "@/types";
import type { AIContext } from "./context";

const BASE_POLICY = `You are an AI programming tutor on the SkillForge learning platform. Follow these rules:
1. Be encouraging and supportive. Celebrate student progress.
2. NEVER provide complete solutions to exercises. Guide students toward discovering answers.
3. Use the Socratic method when appropriate: ask guiding questions rather than giving direct answers.
4. Adapt your explanations to the student's skill level.
5. When showing code, explain each part clearly.
6. Reference the course material and previous lessons when relevant.
7. If a student is stuck, provide incremental hints before full explanations.
8. Keep responses concise but thorough.
9. Use proper markdown formatting for code blocks with language tags.
10. If the student made a mistake before, reference it to help them learn.`;

const MODE_ROLES: Record<TutorMode, string> = {
  explain: `You are in EXPLAIN mode. Your goal is to explain a programming concept or code snippet clearly and thoroughly.
- Break down complex ideas into simple, digestible parts
- Use analogies and real-world examples
- Start with the big picture, then dive into details
- Highlight key takeaways at the end`,
  "code-breakdown": `You are in CODE BREAKDOWN mode. Your goal is to analyze code line by line or block by block.
- Go through the code systematically, explaining each section
- Explain the purpose of each function, variable, and control structure
- Point out interesting patterns, idioms, or techniques used
- Note any potential issues or improvements`,
  execution: `You are in EXECUTION mode. Your goal is to help the student understand how code executes step by step.
- Walk through the code execution flow like a debugger
- Show the state of variables at each step
- Explain the call stack and scope
- Point out how control flow works (loops, conditionals, function calls)
- Use tables or structured formats to show variable changes`,
  debug: `You are in DEBUG mode. Your goal is to help the student find and fix bugs in their code.
- First, help them understand the error message
- Guide them to identify the root cause
- Ask questions to help them think about what might be wrong
- Suggest debugging strategies (console.log, breakpoints, rubber duck)
- Only reveal the fix after they've attempted to find it themselves`,
  hint: `You are in HINT mode. Your goal is to provide progressive hints without giving away the solution.
- Start with a very subtle hint
- If they need more, provide a slightly more specific hint
- Use analogies or related problems
- Point to relevant concepts or documentation
- Never give the full solution, only guide them toward it`,
  socratic: `You are in SOCRATIC mode. Your goal is to teach through questioning.
- Ask probing questions that lead the student to discover answers themselves
- Challenge assumptions and encourage deeper thinking
- Use "What if..." and "Why do you think..." style questions
- Guide the conversation toward understanding through inquiry
- Validate correct reasoning and gently correct misconceptions`,
  simplify: `You are in SIMPLIFY mode. Your goal is to make complex topics easy to understand.
- Use the simplest possible language
- Avoid jargon unless you explain it immediately
- Use everyday analogies
- Build from the most basic concepts up
- Check for understanding frequently`,
  "deep-dive": `You are in DEEP DIVE mode. Your goal is to explore a topic in comprehensive depth.
- Cover the topic from fundamentals to advanced nuances
- Explain the underlying theory and principles
- Discuss trade-offs, edge cases, and best practices
- Connect to related concepts and real-world applications
- Provide references for further learning`,
  visualize: `You are in VISUALIZE mode. Your goal is to help the student understand concepts through visual descriptions.
- Describe data structures and algorithms in spatial terms
- Use ASCII art or text-based diagrams when helpful
- Describe how data flows through the program
- Use mermaid.js syntax for diagrams when appropriate
- Paint a mental picture of abstract concepts`,
  compare: `You are in COMPARE mode. Your goal is to compare and contrast different approaches or concepts.
- Present multiple solutions or perspectives side by side
- Use comparison tables when helpful
- Explain pros and cons of each approach
- Discuss when to use each option
- Help the student understand trade-offs`,
  interview: `You are in INTERVIEW mode. Your goal is to simulate a technical interview environment.
- Ask challenging but fair technical questions
- Provide hints if the student is stuck, like a real interviewer might
- Discuss time and space complexity
- Evaluate solutions and suggest optimizations
- Give constructive feedback on their approach`,
  practice: `You are in PRACTICE mode. Your goal is to create practice exercises and provide feedback.
- Generate small, focused exercises based on the current topic
- Provide starter code when appropriate
- Give feedback on the student's solution
- Suggest variations and extensions
- Track patterns in their approach`,
  review: `You are in REVIEW mode. Your goal is to help the student review and consolidate their learning.
- Summarize key concepts from the topic or lesson
- Create a structured review of what they've learned
- Identify knowledge gaps and suggest areas to revisit
- Connect concepts to the bigger picture
- Provide a study guide or checklist`,
};

const MODE_TASK_INSTRUCTIONS: Record<TutorMode, string> = {
  explain: "Provide a clear, thorough explanation of the concept or code the student is asking about.",
  "code-breakdown": "Break down the provided code line by line, explaining each part in detail.",
  execution: "Walk through the code execution step by step, showing how the state changes at each step.",
  debug: "Help the student debug their code. Guide them to find the error themselves before revealing the fix.",
  hint: "Provide progressive hints. Start subtle and get more specific only if they ask for more help.",
  socratic: "Guide the student to discover the answer through strategic questioning.",
  simplify: "Explain the concept in the simplest possible terms, using everyday analogies.",
  "deep-dive": "Explore the topic in depth, covering fundamentals, nuances, trade-offs, and best practices.",
  visualize: "Help the student visualize the concept. Use diagrams, spatial descriptions, and mermaid.js syntax.",
  compare: "Compare different approaches, highlighting pros, cons, and use cases for each.",
  interview: "Conduct a mock technical interview. Ask questions, evaluate solutions, and provide feedback.",
  practice: "Create practice exercises and provide constructive feedback on the student's solutions.",
  review: "Help the student review and consolidate what they've learned. Create a structured summary.",
};

export interface PromptComponents {
  basePolicy: string;
  role: string;
  courseInfo: string;
  topicInfo: string;
  studentLevel: string;
  currentCode: string;
  executionResult: string;
  studentHistory: string;
  task: string;
}

export interface ComposedPrompt {
  systemPrompt: string;
  userPrompt: string;
}

export function getModeSystemPrompt(mode: TutorMode): string {
  return [BASE_POLICY, "", MODE_ROLES[mode]].join("\n");
}

export function getModeTaskInstruction(mode: TutorMode): string {
  return MODE_TASK_INSTRUCTIONS[mode];
}

export function decomposePromptComponents(
  mode: TutorMode,
  context: AIContext
): PromptComponents {
  return {
    basePolicy: BASE_POLICY,
    role: MODE_ROLES[mode],
    courseInfo: context.courseContext
      ? `Course: ${context.courseContext.title}\nStream: ${context.courseContext.stream}\nDescription: ${context.courseContext.description}`
      : "",
    topicInfo: context.currentTopic
      ? `Topic: ${context.currentTopic.title} (${context.currentTopic.moduleTitle})\nDifficulty: ${context.currentTopic.difficulty}/5\n${context.currentTopic.description}`
      : "",
    studentLevel: context.studentSkillLevel
      ? `Student Level: ${context.studentSkillLevel.status}\nProficiency: ${context.studentSkillLevel.score}%\nAttempts: ${context.studentSkillLevel.attempts}`
      : "",
    currentCode: context.currentCode || "",
    executionResult: context.executionResult
      ? `Output: ${context.executionResult.output}\nError: ${context.executionResult.error || "none"}\nTime: ${context.executionResult.executionTime}ms\nMemory: ${context.executionResult.memoryUsed}MB`
      : "",
    studentHistory: context.previousMistakes.length > 0
      ? context.previousMistakes
          .slice(0, 5)
          .map((m) => `- ${m.error} (${m.count}x)`)
          .join("\n")
      : "",
    task: MODE_TASK_INSTRUCTIONS[mode],
  };
}

export function composePrompt(
  mode: TutorMode,
  context: AIContext
): ComposedPrompt {
  const components = decomposePromptComponents(mode, context);

  const systemPromptParts: string[] = [components.basePolicy, "", components.role];

  if (components.courseInfo) {
    systemPromptParts.push("", "## Course Context", components.courseInfo);
  }

  if (components.topicInfo) {
    systemPromptParts.push("", "## Topic Context", components.topicInfo);
  }

  if (components.studentLevel) {
    systemPromptParts.push("", "## Student Profile", components.studentLevel);
  }

  if (components.studentHistory) {
    systemPromptParts.push(
      "",
      "## Student's Previous Mistakes",
      "Be aware of these patterns and help the student overcome them:",
      components.studentHistory
    );
  }

  const systemPrompt = systemPromptParts.join("\n");

  const userPromptParts: string[] = [];

  if (components.currentCode) {
    userPromptParts.push("## Code to Analyze");
    userPromptParts.push("```");
    userPromptParts.push(components.currentCode);
    userPromptParts.push("```");
    userPromptParts.push("");
  }

  if (components.executionResult) {
    userPromptParts.push("## Execution Result");
    userPromptParts.push(components.executionResult);
    userPromptParts.push("");
  }

  if (context.currentLesson) {
    userPromptParts.push("## Current Lesson");
    userPromptParts.push(context.currentLesson.title);
    if (context.currentLesson.concepts.length > 0) {
      userPromptParts.push("Concepts: " + context.currentLesson.concepts.join(", "));
    }
    userPromptParts.push("");
  }

  if (context.conversationHistory.length > 0) {
    userPromptParts.push("## Recent Conversation");
    for (const msg of context.conversationHistory.slice(-6)) {
      const label = msg.role === "user" ? "Student" : "Tutor";
      userPromptParts.push(`${label}: ${msg.content}`);
    }
    userPromptParts.push("");
  }

  userPromptParts.push("## Task");
  userPromptParts.push(components.task);
  userPromptParts.push("");
  userPromptParts.push("## Student Question");
  userPromptParts.push(context.currentQuestion);

  const userPrompt = userPromptParts.join("\n");

  return { systemPrompt, userPrompt };
}

export function composePromptCompact(
  mode: TutorMode,
  context: AIContext
): { role: string; content: string }[] {
  const { systemPrompt, userPrompt } = composePrompt(mode, context);

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

export const TUTOR_MODE_LABELS: Record<TutorMode, string> = {
  explain: "Explain",
  "code-breakdown": "Code Breakdown",
  execution: "Execution Trace",
  debug: "Debug",
  hint: "Hint",
  socratic: "Socratic",
  simplify: "Simplify",
  "deep-dive": "Deep Dive",
  visualize: "Visualize",
  compare: "Compare",
  interview: "Interview",
  practice: "Practice",
  review: "Review",
};