"use client";

import { useState, useCallback, useRef } from "react";
import type { ExecutionResult, ExecutionEvent } from "@/types";

interface ExecutionHistoryEntry {
  id: string;
  code: string;
  output: string;
  error: string | null;
  events: ExecutionEvent[];
  executionTime: number;
  timestamp: number;
}

interface UseExecutionReturn {
  output: string;
  error: string | null;
  events: ExecutionEvent[];
  loading: boolean;
  executionTime: number;
  history: ExecutionHistoryEntry[];
  executeCode: (code: string, language?: string) => Promise<ExecutionResult | null>;
  clearOutput: () => void;
  clearHistory: () => void;
}

let idCounter = 0;

export function useExecution(): UseExecutionReturn {
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<ExecutionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const [history, setHistory] = useState<ExecutionHistoryEntry[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeCode = useCallback(
    async (code: string, language: string = "javascript"): Promise<ExecutionResult | null> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setLoading(true);
      setError(null);
      setOutput("");
      setEvents([]);
      setExecutionTime(0);

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

        const res = await fetch("/api/code/run", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ code, language }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = await res.json();
          const errorMsg = data.error || `Execution failed with status ${res.status}`;
          setError(errorMsg);
          setLoading(false);
          return null;
        }

        const data: ExecutionResult = await res.json();

        if (controller.signal.aborted) return null;

        setOutput(data.output);
        setError(data.error);
        setEvents(data.events);
        setExecutionTime(data.executionTime);

        const entry: ExecutionHistoryEntry = {
          id: `exec_${++idCounter}`,
          code,
          output: data.output,
          error: data.error,
          events: data.events,
          executionTime: data.executionTime,
          timestamp: Date.now(),
        };

        setHistory((prev) => [entry, ...prev].slice(0, 50));

        return data;
      } catch (err) {
        if ((err as Error).name === "AbortError") return null;
        const message = err instanceof Error ? err.message : "Network error";
        setError(message);
        return null;
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  const clearOutput = useCallback(() => {
    setOutput("");
    setError(null);
    setEvents([]);
    setExecutionTime(0);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    output,
    error,
    events,
    loading,
    executionTime,
    history,
    executeCode,
    clearOutput,
    clearHistory,
  };
}