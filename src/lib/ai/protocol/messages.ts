import { z } from "zod";
import type { TutorMode } from "@/types";

export const MessageRole = z.enum(["system", "user", "assistant", "tool", "feedback"]);
export type MessageRole = z.infer<typeof MessageRole>;

export const MessagePriority = z.enum(["critical", "high", "medium", "low"]);
export type MessagePriority = z.infer<typeof MessagePriority>;

export const CodeBlock = z.object({
  language: z.string().default("javascript"),
  code: z.string(),
  filename: z.string().optional(),
  lineStart: z.number().optional(),
  lineEnd: z.number().optional(),
});
export type CodeBlock = z.infer<typeof CodeBlock>;

export const DiagramBlock = z.object({
  type: z.enum(["mermaid", "flowchart", "sequence", "class", "state", "er"]),
  content: z.string(),
  caption: z.string().optional(),
});
export type DiagramBlock = z.infer<typeof DiagramBlock>;

export const StructuredHint = z.object({
  level: z.number().min(1).max(5),
  content: z.string(),
  reveals: z.string().optional(),
  requiresUnderstanding: z.boolean().default(false),
});
export type StructuredHint = z.infer<typeof StructuredHint>;

export const SocraticQuestion = z.object({
  type: z.enum(["clarifying", "probing", "challenging", "redirecting", "summarizing"]),
  question: z.string(),
  purpose: z.string(),
  expectedInsight: z.string().optional(),
});
export type SocraticQuestion = z.infer<typeof SocraticQuestion>;

export const FeedbackBlock = z.object({
  type: z.enum(["positive", "constructive", "correction", "encouragement"]),
  message: z.string(),
  target: z.string().optional(),
  suggestion: z.string().optional(),
});
export type FeedbackBlock = z.infer<typeof FeedbackBlock>;

export const ToolCallRequest = z.object({
  id: z.string(),
  name: z.string(),
  arguments: z.record(z.string(), z.unknown()),
});
export type ToolCallRequest = z.infer<typeof ToolCallRequest>;

export const ToolCallResult = z.object({
  id: z.string(),
  name: z.string(),
  result: z.unknown(),
  error: z.string().optional(),
});
export type ToolCallResult = z.infer<typeof ToolCallResult>;

export const ConceptReference = z.object({
  name: z.string(),
  topicId: z.string().optional(),
  lessonId: z.string().optional(),
  relevance: z.number().min(0).max(1),
});
export type ConceptReference = z.infer<typeof ConceptReference>;

export const StructuredContext = z.object({
  courseId: z.string().optional(),
  moduleId: z.string().optional(),
  topicId: z.string().optional(),
  lessonId: z.string().optional(),
  difficulty: z.number().min(1).max(5).optional(),
  studentLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  language: z.string().optional(),
  concepts: z.array(ConceptReference).optional(),
  recentTopics: z.array(z.string()).optional(),
  skillGaps: z.array(z.string()).optional(),
});
export type StructuredContext = z.infer<typeof StructuredContext>;

export const UnifiedMessage = z.object({
  id: z.string().optional(),
  role: MessageRole,
  content: z.string(),
  mode: z.string().optional(),
  timestamp: z.number().optional(),
  metadata: z.object({
    sessionId: z.string().optional(),
    messageIndex: z.number().optional(),
    priority: MessagePriority.optional().default("medium"),
    tags: z.array(z.string()).default([]),
  }).optional().default({ priority: "medium" as const, tags: [] }),
  blocks: z.object({
    code: z.array(CodeBlock).default([]),
    diagrams: z.array(DiagramBlock).default([]),
    hints: z.array(StructuredHint).default([]),
    questions: z.array(SocraticQuestion).default([]),
    feedback: z.array(FeedbackBlock).default([]),
    toolCalls: z.array(ToolCallRequest).default([]),
    toolResults: z.array(ToolCallResult).default([]),
  }).optional().default({ code: [], diagrams: [], hints: [], questions: [], feedback: [], toolCalls: [], toolResults: [] }),
  context: StructuredContext.optional(),
  tokenUsage: z.object({
    prompt: z.number().optional(),
    completion: z.number().optional(),
    total: z.number().optional(),
  }).optional(),
});
export type UnifiedMessage = z.infer<typeof UnifiedMessage>;

export function createSystemMessage(
  content: string,
  options?: {
    tags?: string[];
    priority?: MessagePriority;
  }
): UnifiedMessage {
  return {
    role: "system",
    content,
    metadata: {
      priority: (options?.priority || "high") as MessagePriority,
      tags: options?.tags || [],
    },
    blocks: { code: [], diagrams: [], hints: [], questions: [], feedback: [], toolCalls: [], toolResults: [] },
  };
}

export function createUserMessage(
  content: string,
  options?: {
    code?: CodeBlock[];
    mode?: TutorMode;
    context?: StructuredContext;
    sessionId?: string;
    messageIndex?: number;
  }
): UnifiedMessage {
  return {
    role: "user",
    content,
    mode: options?.mode,
    metadata: {
      sessionId: options?.sessionId,
      messageIndex: options?.messageIndex,
      priority: "high" as MessagePriority,
      tags: ["user-message"],
    },
    blocks: {
      code: options?.code || [],
      diagrams: [],
      hints: [],
      questions: [],
      feedback: [],
      toolCalls: [],
      toolResults: [],
    },
    context: options?.context,
  };
}

export function createAssistantMessage(
  content: string,
  options?: {
    code?: CodeBlock[];
    diagrams?: DiagramBlock[];
    hints?: StructuredHint[];
    questions?: SocraticQuestion[];
    feedback?: FeedbackBlock[];
    toolCalls?: ToolCallRequest[];
    toolResults?: ToolCallResult[];
    sessionId?: string;
    messageIndex?: number;
    tokenUsage?: { prompt?: number; completion?: number; total?: number };
  }
): UnifiedMessage {
  return {
    role: "assistant",
    content,
    metadata: {
      sessionId: options?.sessionId,
      messageIndex: options?.messageIndex,
      priority: "medium" as MessagePriority,
      tags: ["assistant-response"],
    },
    blocks: {
      code: options?.code || [],
      diagrams: options?.diagrams || [],
      hints: options?.hints || [],
      questions: options?.questions || [],
      feedback: options?.feedback || [],
      toolCalls: options?.toolCalls || [],
      toolResults: options?.toolResults || [],
    },
    tokenUsage: options?.tokenUsage,
  };
}

export function createToolCallMessage(
  toolCalls: ToolCallRequest[]
): UnifiedMessage {
  return {
    role: "assistant",
    content: "",
    metadata: { priority: "high" as MessagePriority, tags: ["tool-call"] },
    blocks: { code: [], diagrams: [], hints: [], questions: [], feedback: [], toolCalls, toolResults: [] },
  };
}

export function createToolResultMessage(
  toolResults: ToolCallResult[]
): UnifiedMessage {
  return {
    role: "tool",
    content: JSON.stringify(toolResults.map((t) => t.result)),
    metadata: { priority: "high" as MessagePriority, tags: ["tool-result"] },
    blocks: { code: [], diagrams: [], hints: [], questions: [], feedback: [], toolCalls: [], toolResults },
  };
}

export function extractCodeBlocks(message: UnifiedMessage): CodeBlock[] {
  if (message.blocks?.code?.length) return message.blocks.code;

  const blocks: CodeBlock[] = [];
  const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = codeRegex.exec(message.content)) !== null) {
    blocks.push({
      language: match[1] || "javascript",
      code: match[2].trim(),
    });
  }
  return blocks;
}

export function extractDiagrams(message: UnifiedMessage): DiagramBlock[] {
  if (message.blocks?.diagrams?.length) return message.blocks.diagrams;

  const blocks: DiagramBlock[] = [];
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
  let match;
  while ((match = mermaidRegex.exec(message.content)) !== null) {
    blocks.push({
      type: "mermaid",
      content: match[1].trim(),
    });
  }
  return blocks;
}

export function extractHints(message: UnifiedMessage): StructuredHint[] {
  return message.blocks?.hints || [];
}

export function extractSocraticQuestions(message: UnifiedMessage): SocraticQuestion[] {
  return message.blocks?.questions || [];
}

export function extractFeedback(message: UnifiedMessage): FeedbackBlock[] {
  return message.blocks?.feedback || [];
}

export function flattenToOpenAI(
  messages: UnifiedMessage[]
): { role: string; content: string }[] {
  return messages.map((m) => {
    let content = m.content;

    if (m.blocks?.code?.length) {
      content += "\n\n" + m.blocks.code
        .map((c) => `\`\`\`${c.language}\n${c.code}\n\`\`\``)
        .join("\n\n");
    }

    if (m.blocks?.hints?.length) {
      content += "\n\n## Hints\n" + m.blocks.hints
        .map((h) => `[Level ${h.level}] ${h.content}`)
        .join("\n");
    }

    if (m.blocks?.questions?.length) {
      content += "\n\n## Questions\n" + m.blocks.questions
        .map((q) => `[${q.type}] ${q.question}`)
        .join("\n");
    }

    return { role: m.role, content };
  });
}

export function estimateMessageTokens(message: UnifiedMessage): number {
  let tokens = Math.ceil(message.content.length / 4);

  if (message.blocks?.code) {
    for (const c of message.blocks.code) {
      tokens += Math.ceil(c.code.length / 4);
    }
  }

  return tokens;
}