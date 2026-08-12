"use client";

import { useState, useCallback, useRef } from "react";
import { nanoid } from "nanoid";
import type { TutorMode, AIChatMessage, ExecutionResult } from "@/types";

interface SendMessagePayload {
  message: string;
  mode: TutorMode;
  code?: string;
  topicId?: string;
  lessonId?: string;
  executionResult?: ExecutionResult;
}

interface ChatResponse {
  sessionId: string;
  message: {
    role: "assistant";
    content: string;
  };
  meta?: {
    provider: string;
    model: string;
    latency: number;
    inputTokens: number;
    outputTokens: number;
  };
}

export function useAiTutor(userId?: string | null) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async ({
      message,
      mode,
      code,
      topicId,
      lessonId,
      executionResult,
    }: SendMessagePayload) => {
      if (!userId) {
        setError("You must be logged in to use the AI tutor");
        return;
      }

      const trimmedMessage = message.trim();
      if (!trimmedMessage) return;

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const userMessage: AIChatMessage = {
        id: nanoid(),
        role: "user",
        content: trimmedMessage,
        code,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: trimmedMessage,
            sessionId,
            mode,
            code,
            topicId,
            lessonId,
            userId,
            executionResult,
          }),
          signal: abortRef.current.signal,
        });

        const data = (await res.json()) as ChatResponse & {
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error || "Failed to get AI response");
        }

        setSessionId(data.sessionId);

        const assistantMessage: AIChatMessage = {
          id: nanoid(),
          role: "assistant",
          content: data.message.content,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const errorMessage =
          err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);

        const errorAssistantMessage: AIChatMessage = {
          id: nanoid(),
          role: "assistant",
          content:
            "I'm sorry, I encountered an error while processing your request. Please try again.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorAssistantMessage]);
      } finally {
        setLoading(false);
      }
    },
    [userId, sessionId]
  );

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    sessionId,
    clearChat,
  };
}