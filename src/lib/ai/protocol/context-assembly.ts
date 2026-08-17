import { prisma } from "@/lib/db";
import type { AIContext, ContextBuildOptions } from "../context";
import { buildContext as buildBaseContext } from "../context";
import type { UnifiedMessage } from "./messages";
import { estimateMessageTokens } from "./messages";

export interface ContextAssemblyOptions extends ContextBuildOptions {
  maxContextTokens?: number;
  prioritizeRecent?: boolean;
  includeRelatedTopics?: boolean;
  includeSkillMap?: boolean;
  compressHistory?: boolean;
}

export interface AssembledContext {
  aiContext: AIContext;
  messages: UnifiedMessage[];
  metadata: {
    totalTokens: number;
    contextTokens: number;
    messageTokens: number;
    truncated: boolean;
    components: {
      course: boolean;
      topic: boolean;
      lesson: boolean;
      skills: boolean;
      mistakes: boolean;
      history: boolean;
      relatedTopics: boolean;
      skillMap: boolean;
    };
  };
}

const DEFAULT_MAX_CONTEXT_TOKENS = 8000;

export async function assembleContext(
  options: ContextAssemblyOptions
): Promise<AssembledContext> {
  const {
    maxContextTokens = DEFAULT_MAX_CONTEXT_TOKENS,
    prioritizeRecent = true,
    includeRelatedTopics = true,
    includeSkillMap = true,
    compressHistory = true,
    ...baseOptions
  } = options;

  const aiContext = await buildBaseContext(baseOptions);
  const messages: UnifiedMessage[] = [];
  const components = {
    course: false,
    topic: false,
    lesson: false,
    skills: false,
    mistakes: false,
    history: false,
    relatedTopics: false,
    skillMap: false,
  };

  let tokenBudget = maxContextTokens;

  if (aiContext.courseContext) {
    const content = `## Course: ${aiContext.courseContext.title}\nStream: ${aiContext.courseContext.stream}\n${aiContext.courseContext.description}`;
    const tokens = Math.ceil(content.length / 4);
    if (tokens < tokenBudget) {
      messages.push({
        role: "system",
        content,
        metadata: { priority: "high", tags: ["course"] },
        blocks: { code: [], diagrams: [], hints: [], questions: [], feedback: [], toolCalls: [], toolResults: [] },
      });
      tokenBudget -= tokens;
      components.course = true;
    }
  }

  if (aiContext.currentTopic) {
    const content = [
      `## Current Topic: ${aiContext.currentTopic.title}`,
      `Module: ${aiContext.currentTopic.moduleTitle}`,
      `Difficulty: ${aiContext.currentTopic.difficulty}/5`,
      aiContext.currentTopic.description,
      aiContext.currentTopic.prerequisites.length > 0
        ? `Prerequisites: ${aiContext.currentTopic.prerequisites.join(", ")}`
        : "",
    ].join("\n");
    const tokens = Math.ceil(content.length / 4);
    if (tokens < tokenBudget * 0.5) {
      messages.push({
        role: "system",
        content,
        metadata: { priority: "high", tags: ["topic"] },
        blocks: { code: [], diagrams: [], hints: [], questions: [], feedback: [], toolCalls: [], toolResults: [] },
      });
      tokenBudget -= tokens;
      components.topic = true;
    }
  }

  if (aiContext.currentLesson && tokenBudget > 500) {
    const content = [
      `## Current Lesson: ${aiContext.currentLesson.title}`,
      aiContext.currentLesson.explanation.substring(0, 1000),
      aiContext.currentLesson.concepts.length > 0
        ? `Concepts: ${aiContext.currentLesson.concepts.join("; ")}`
        : "",
    ].join("\n");
    const tokens = Math.ceil(content.length / 4);
    if (tokens < tokenBudget * 0.3) {
      messages.push({
        role: "system",
        content,
        metadata: { priority: "medium", tags: ["lesson"] },
        blocks: { code: [], diagrams: [], hints: [], questions: [], feedback: [], toolCalls: [], toolResults: [] },
      });
      tokenBudget -= tokens;
      components.lesson = true;
    }
  }

  if (aiContext.studentSkillLevel && tokenBudget > 300) {
    const content = [
      "## Student Profile",
      `Level: ${aiContext.studentSkillLevel.status}`,
      `Skill: ${aiContext.studentSkillLevel.skillName}`,
      `Proficiency: ${aiContext.studentSkillLevel.score}%`,
      `Attempts: ${aiContext.studentSkillLevel.attempts}`,
    ].join("\n");
    messages.push({
      role: "system",
      content,
      metadata: { priority: "medium", tags: ["student"] },
      blocks: { code: [], diagrams: [], hints: [], questions: [], feedback: [], toolCalls: [], toolResults: [] },
    });
    tokenBudget -= Math.ceil(content.length / 4);
    components.skills = true;
  }

  if (aiContext.previousMistakes.length > 0 && tokenBudget > 300) {
    const content = [
      "## Previous Mistakes",
      ...aiContext.previousMistakes.slice(0, 5).map((m) => `- ${m.error} (${m.count}x)`),
    ].join("\n");
    messages.push({
      role: "system",
      content,
      metadata: { priority: "low", tags: ["mistakes"] },
      blocks: { code: [], diagrams: [], hints: [], questions: [], feedback: [], toolCalls: [], toolResults: [] },
    });
    tokenBudget -= Math.ceil(content.length / 4);
    components.mistakes = true;
  }

  if (includeRelatedTopics && aiContext.currentTopic && tokenBudget > 500) {
    try {
      const relatedTopics = await prisma.topic.findMany({
        where: {
          moduleId: (
            await prisma.topic.findUnique({
              where: { id: aiContext.currentTopic.id },
              select: { moduleId: true },
            })
          )?.moduleId,
          id: { not: aiContext.currentTopic.id },
        },
        select: { title: true },
        take: 5,
      });

      if (relatedTopics.length > 0) {
        const content = [
          "## Related Topics",
          ...relatedTopics.map((t) => `- ${t.title}`),
        ].join("\n");
        messages.push({
          role: "system",
          content,
          metadata: { priority: "low", tags: ["related"] },
          blocks: { code: [], diagrams: [], hints: [], questions: [], feedback: [], toolCalls: [], toolResults: [] },
        });
        tokenBudget -= Math.ceil(content.length / 4);
        components.relatedTopics = true;
      }
    } catch {
      // Non-critical
    }
  }

  if (includeSkillMap && aiContext.studentSkillLevel && tokenBudget > 400) {
    try {
      const skills = await prisma.studentSkill.findMany({
        where: {
          userId: options.userId,
          status: { in: ["learning", "practicing"] },
        },
        select: { skillName: true, score: true },
        orderBy: { score: "asc" },
        take: 5,
      });

      if (skills.length > 0) {
        const content = [
          "## Skill Gaps (Focus Areas)",
          ...skills.map((s) => `- ${s.skillName}: ${s.score}%`),
        ].join("\n");
        messages.push({
          role: "system",
          content,
          metadata: { priority: "low", tags: ["skill-gaps"] },
          blocks: { code: [], diagrams: [], hints: [], questions: [], feedback: [], toolCalls: [], toolResults: [] },
        });
        tokenBudget -= Math.ceil(content.length / 4);
        components.skillMap = true;
      }
    } catch {
      // Non-critical
    }
  }

  if (aiContext.currentCode) {
    const content = `## Current Code\n\`\`\`\n${aiContext.currentCode.substring(0, 2000)}\n\`\`\``;
    messages.push({
      role: "user",
      content,
      metadata: { priority: "high", tags: ["code"] },
      blocks: {
        code: [{ language: "javascript", code: aiContext.currentCode }],
        diagrams: [],
        hints: [],
        questions: [],
        feedback: [],
        toolCalls: [],
        toolResults: [],
      },
    });
    tokenBudget -= Math.ceil(content.length / 4);
  }

  if (aiContext.executionResult) {
    const exec = aiContext.executionResult;
    const parts = ["## Execution Result & Trace"];
    if (exec.output) {
      parts.push(`Output:\n\`\`\`\n${exec.output.substring(0, 1000)}\n\`\`\``);
    }
    if (exec.error) {
      parts.push(`Error:\n\`\`\`\n${exec.error.substring(0, 1000)}\n\`\`\``);
    }
    if (exec.selectedLine) {
      parts.push(`**User Query Focus**: Student is asking about **Line ${exec.selectedLine}**.`);
    }
    if (exec.selectedEvent) {
      parts.push(
        `**Selected Event Focus**: Event #${exec.selectedEvent.sequence ?? exec.selectedEvent.step} [${exec.selectedEvent.type}] at Line ${exec.selectedEvent.line} (Variable: ${exec.selectedEvent.variable || "none"}, Value: ${JSON.stringify(exec.selectedEvent.value)}).`
      );
    }
    if (exec.events && exec.events.length > 0) {
      parts.push("### Execution Trace Events:");
      const eventLines = exec.events.slice(0, 35).map((e, idx) => {
        const stepNum = e.sequence ?? e.step ?? idx;
        const lineStr = e.line ? `Ln ${e.line}` : "global";
        const varStr = e.variable ? `| var: ${e.variable} = ${JSON.stringify(e.value)}` : "";
        const callStr = e.callStack && e.callStack.length > 0 ? `| stack: [${e.callStack.join(" > ")}]` : "";
        const msgStr = e.message || e.payload?.message ? `| msg: "${e.message || e.payload?.message}"` : "";
        return `- Step ${stepNum} [${e.type}] at ${lineStr} ${varStr} ${callStr} ${msgStr}`.trim();
      });
      parts.push(eventLines.join("\n"));
      if (exec.events.length > 35) {
        parts.push(`... (+${exec.events.length - 35} more execution events)`);
      }
    }
    if (exec.executionTime !== undefined) {
      parts.push(`Execution Duration: ${exec.executionTime}ms`);
    }

    const content = parts.join("\n\n");
    messages.push({
      role: "user",
      content,
      metadata: { priority: "high", tags: ["execution"] },
      blocks: {
        code: [],
        diagrams: [],
        hints: [],
        questions: [],
        feedback: [],
        toolCalls: [],
        toolResults: [],
      },
    });
    tokenBudget -= Math.ceil(content.length / 4);
  }

  if (aiContext.conversationHistory.length > 0) {
    let history = aiContext.conversationHistory;
    let historyTokens = history.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);

    if (compressHistory && historyTokens > tokenBudget * 0.3) {
      history = history.slice(-4);
      historyTokens = history.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
    }

    const content = [
      "## Recent Conversation",
      ...history.map((m) => {
        const label = m.role === "user" ? "Student" : "Tutor";
        const truncated = m.content.length > 400 ? m.content.substring(0, 400) + "..." : m.content;
        return `${label}: ${truncated}`;
      }),
    ].join("\n");

    messages.push({
      role: "user",
      content,
      metadata: { priority: "medium", tags: ["history"] },
      blocks: { code: [], diagrams: [], hints: [], questions: [], feedback: [], toolCalls: [], toolResults: [] },
    });
    tokenBudget -= Math.ceil(content.length / 4);
    components.history = true;
  }

  messages.push({
    role: "user",
    content: aiContext.currentQuestion,
    metadata: { priority: "critical", tags: ["question"] },
    blocks: { code: [], diagrams: [], hints: [], questions: [], feedback: [], toolCalls: [], toolResults: [] },
  });

  let totalTokens = 0;
  for (const msg of messages) {
    totalTokens += estimateMessageTokens(msg);
  }

  return {
    aiContext,
    messages,
    metadata: {
      totalTokens,
      contextTokens: totalTokens - Math.ceil(aiContext.currentQuestion.length / 4),
      messageTokens: totalTokens,
      truncated: totalTokens > maxContextTokens,
      components,
    },
  };
}

export function computeContextPriority(
  context: AIContext
): {
  topics: Array<{ name: string; priority: number }>;
  overallPriority: number;
} {
  let priority = 50;

  if (context.studentSkillLevel) {
    if (context.studentSkillLevel.score < 40) priority += 30;
    else if (context.studentSkillLevel.score < 70) priority += 15;
  }

  if (context.previousMistakes.length > 3) priority += 20;
  if (context.currentCode) priority += 10;
  if (context.executionResult?.error) priority += 25;

  if (context.currentTopic) {
    if (context.currentTopic.difficulty >= 4) priority += 10;
  }

  const topics: Array<{ name: string; priority: number }> = [];

  if (context.currentTopic) {
    topics.push({ name: context.currentTopic.title, priority: 80 });
  }
  if (context.currentLesson) {
    topics.push({ name: context.currentLesson.title, priority: 70 });
  }
  if (context.previousMistakes.length > 0) {
    topics.push({
      name: `Mistakes: ${context.previousMistakes[0].error}`,
      priority: 60,
    });
  }

  return { topics, overallPriority: Math.min(100, priority) };
}