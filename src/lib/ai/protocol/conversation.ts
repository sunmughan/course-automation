import { prisma } from "@/lib/db";
import type { TutorMode } from "@/types";
import type { UnifiedMessage } from "./messages";
import { createUserMessage, createAssistantMessage, estimateMessageTokens } from "./messages";

export type ConversationState =
  | "initial"
  | "exploring"
  | "focused"
  | "confused"
  | "stuck"
  | "progressing"
  | "mastering"
  | "reviewing";

export interface ConversationTurn {
  index: number;
  userMessage: UnifiedMessage;
  assistantMessage: UnifiedMessage | null;
  mode: TutorMode;
  state: ConversationState;
  timestamp: number;
  tokensUsed: number;
  toolCalls: number;
}

export interface ConversationSession {
  id: string;
  userId: string;
  lessonId?: string;
  topicId?: string;
  mode: TutorMode;
  state: ConversationState;
  turns: ConversationTurn[];
  summary: string;
  startedAt: number;
  lastActiveAt: number;
  totalTokens: number;
  averageResponseTime: number;
}

export interface ConversationConfig {
  maxTurns: number;
  maxTokens: number;
  summarizationThreshold: number;
  contextWindowTurns: number;
  autoSummarize: boolean;
  stateTransitionThreshold: number;
}

const DEFAULT_CONVERSATION_CONFIG: ConversationConfig = {
  maxTurns: 50,
  maxTokens: 100000,
  summarizationThreshold: 10,
  contextWindowTurns: 8,
  autoSummarize: true,
  stateTransitionThreshold: 3,
};

export class ConversationManager {
  private sessions: Map<string, ConversationSession> = new Map();
  private config: ConversationConfig;

  constructor(configOverride?: Partial<ConversationConfig>) {
    this.config = { ...DEFAULT_CONVERSATION_CONFIG, ...configOverride };
  }

  createSession(
    userId: string,
    mode: TutorMode,
    options?: { lessonId?: string; topicId?: string }
  ): ConversationSession {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const session: ConversationSession = {
      id,
      userId,
      lessonId: options?.lessonId,
      topicId: options?.topicId,
      mode,
      state: "initial",
      turns: [],
      summary: "",
      startedAt: Date.now(),
      lastActiveAt: Date.now(),
      totalTokens: 0,
      averageResponseTime: 0,
    };
    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): ConversationSession | undefined {
    return this.sessions.get(id);
  }

  addTurn(
    sessionId: string,
    userMessage: UnifiedMessage,
    assistantMessage: UnifiedMessage | null,
    tokensUsed: number,
    responseTime: number,
    toolCalls: number = 0
  ): ConversationTurn | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    if (session.turns.length >= this.config.maxTurns) return null;

    const turnIndex = session.turns.length;
    const turn: ConversationTurn = {
      index: turnIndex,
      userMessage,
      assistantMessage,
      mode: session.mode,
      state: session.state,
      timestamp: Date.now(),
      tokensUsed,
      toolCalls,
    };

    session.turns.push(turn);
    session.lastActiveAt = Date.now();
    session.totalTokens += tokensUsed;

    const totalResponseTime = session.averageResponseTime * (session.turns.length - 1) + responseTime;
    session.averageResponseTime = session.turns.length > 0
      ? totalResponseTime / session.turns.length
      : responseTime;

    this.updateState(session, turn);

    if (this.config.autoSummarize && session.turns.length >= this.config.summarizationThreshold) {
      this.generateSummary(session);
    }

    return turn;
  }

  private updateState(session: ConversationSession, latestTurn: ConversationTurn): void {
    const recentTurns = session.turns.slice(-this.config.stateTransitionThreshold);
    const userMessages = recentTurns.map((t) => t.userMessage.content.toLowerCase());

    const confusionIndicators = [
      "don't understand", "confused", "what does", "i'm lost",
      "can you explain", "not clear", "still don't get", "huh",
    ];
    const stuckIndicators = [
      "can't figure out", "stuck", "not working", "help me",
      "i give up", "too hard", "impossible",
    ];
    const progressIndicators = [
      "i think i got it", "let me try", "i understand", "so basically",
      "that makes sense", "oh i see", "got it",
    ];
    const masteryIndicators = [
      "i can explain", "i built", "i solved", "easy",
      "i know", "i remember", "next topic",
    ];

    const isConfused = userMessages.some((m) => confusionIndicators.some((i) => m.includes(i)));
    const isStuck = userMessages.some((m) => stuckIndicators.some((i) => m.includes(i)));
    const isProgressing = userMessages.some((m) => progressIndicators.some((i) => m.includes(i)));
    const isMastering = userMessages.some((m) => masteryIndicators.some((i) => m.includes(i)));

    if (isStuck) {
      session.state = "stuck";
    } else if (isConfused) {
      session.state = "confused";
    } else if (isMastering) {
      session.state = "mastering";
    } else if (isProgressing) {
      session.state = "progressing";
    } else if (session.turns.length > 8) {
      session.state = "focused";
    } else if (session.turns.length > 2) {
      session.state = "exploring";
    }
  }

  private generateSummary(session: ConversationSession): void {
    const recentTurns = session.turns.slice(-this.config.summarizationThreshold);
    const topics = new Set<string>();
    const questions: string[] = [];

    for (const turn of recentTurns) {
      const userContent = turn.userMessage.content;
      if (userContent.endsWith("?")) {
        questions.push(userContent.substring(0, 100));
      }
      const words = userContent.split(/\s+/);
      for (const word of words) {
        if (word.length > 4 && word[0] === word[0].toUpperCase()) {
          topics.add(word);
        }
      }
    }

    session.summary = [
      `Conversation with ${session.turns.length} turns`,
      `Mode: ${session.mode}`,
      `State: ${session.state}`,
      topics.size > 0 ? `Topics: ${Array.from(topics).join(", ")}` : "",
      questions.length > 0 ? `Questions: ${questions.join("; ")}` : "",
    ].filter(Boolean).join("\n");
  }

  getContextTurns(
    sessionId: string,
    count?: number
  ): ConversationTurn[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    const limit = count || this.config.contextWindowTurns;
    return session.turns.slice(-limit);
  }

  getRecentMessages(
    sessionId: string,
    count?: number
  ): UnifiedMessage[] {
    const turns = this.getContextTurns(sessionId, count);
    const messages: UnifiedMessage[] = [];
    for (const turn of turns) {
      messages.push(turn.userMessage);
      if (turn.assistantMessage) {
        messages.push(turn.assistantMessage);
      }
    }
    return messages;
  }

  suggestModeSwitch(sessionId: string): TutorMode | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.turns.length < 3) return null;

    const userMessages = session.turns.slice(-3).map((t) => t.userMessage.content.toLowerCase());
    const combined = userMessages.join(" ");

    const modeTriggers: Array<{ pattern: RegExp; mode: TutorMode }> = [
      { pattern: /explain|what is|how does|tell me about/i, mode: "explain" },
      { pattern: /break.?down|analyze.*code|explain.*line/i, mode: "code-breakdown" },
      { pattern: /debug|error|bug|not working|fix/i, mode: "debug" },
      { pattern: /hint|clue|give me a hint|help me/i, mode: "hint" },
      { pattern: /why.*think|what if|how would you/i, mode: "socratic" },
      { pattern: /simple|eli5|basic|dumb.*down|beginner/i, mode: "simplify" },
      { pattern: /deep.*dive|in depth|comprehensive|detailed/i, mode: "deep-dive" },
      { pattern: /visualize|diagram|draw|picture|see.*how/i, mode: "visualize" },
      { pattern: /compare|vs|versus|difference|better.*or/i, mode: "compare" },
      { pattern: /interview|ask me|test me|challenge/i, mode: "interview" },
      { pattern: /practice|exercise|give me.*problem|try/i, mode: "practice" },
      { pattern: /review|summary|recap|what.*learned/i, mode: "review" },
    ];

    for (const { pattern, mode } of modeTriggers) {
      if (pattern.test(combined) && mode !== session.mode) {
        return mode;
      }
    }

    return null;
  }

  getStats(sessionId: string): {
    turns: number;
    totalTokens: number;
    avgResponseTime: number;
    state: ConversationState;
    mode: TutorMode;
    duration: number;
    summary: string;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    return {
      turns: session.turns.length,
      totalTokens: session.totalTokens,
      avgResponseTime: session.averageResponseTime,
      state: session.state,
      mode: session.mode,
      duration: Date.now() - session.startedAt,
      summary: session.summary,
    };
  }

  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}

export const conversationManager = new ConversationManager();