"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Wand2, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAiTutor } from "@/hooks/use-ai-tutor";
import { AIChatMessage } from "@/components/tutor/ai-chat-message";
import type { TutorMode } from "@/types";

const TUTOR_MODES: { value: TutorMode; label: string; description: string }[] =
  [
    { value: "explain", label: "Explain", description: "Explain concepts clearly" },
    { value: "code-breakdown", label: "Code Breakdown", description: "Break down code line by line" },
    { value: "execution", label: "Execution", description: "Trace code execution step by step" },
    { value: "debug", label: "Debug", description: "Help find and fix bugs" },
    { value: "hint", label: "Hint", description: "Give hints without spoiling the answer" },
    { value: "socratic", label: "Socratic", description: "Guide through questions" },
    { value: "simplify", label: "Simplify", description: "Explain in simple terms" },
    { value: "deep-dive", label: "Deep Dive", description: "Comprehensive detailed analysis" },
    { value: "visualize", label: "Visualize", description: "Visual representation of concepts" },
    { value: "compare", label: "Compare", description: "Compare different approaches" },
    { value: "interview", label: "Interview", description: "Practice interview questions" },
    { value: "practice", label: "Practice", description: "Generate practice exercises" },
    { value: "review", label: "Review", description: "Review your code and suggest improvements" },
  ];

interface AITutorProps {
  userId?: string | null;
  code?: string;
  topicId?: string;
  lessonId?: string;
  className?: string;
}

export function AITutor({
  userId,
  code,
  topicId,
  lessonId,
  className,
}: AITutorProps) {
  const { messages, loading, error, sendMessage, clearChat } = useAiTutor(userId);
  const [inputValue, setInputValue] = useState("");
  const [mode, setMode] = useState<TutorMode>("explain");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || loading) return;
    sendMessage({
      message: inputValue,
      mode,
      code,
      topicId,
      lessonId,
    });
    setInputValue("");
  }, [inputValue, loading, mode, code, topicId, lessonId, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleClear = useCallback(() => {
    clearChat();
  }, [clearChat]);

  const selectedMode = TUTOR_MODES.find((m) => m.value === mode);

  return (
    <div className={cn("flex h-full flex-col bg-card", className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">AI Tutor</span>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={mode}
            onValueChange={(v) => setMode(v as TutorMode)}
          >
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TUTOR_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-xs">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClear}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {selectedMode && selectedMode.value !== "explain" && (
        <div className="px-4 py-2 border-b border-border">
          <Badge variant="secondary" className="text-[10px]">
            {selectedMode.label} Mode
          </Badge>
        </div>
      )}

      <ScrollArea className="flex-1" ref={scrollRef}>
        {error && (
          <div className="px-4 py-3 m-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}
        {messages.length === 0 && !error ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
            <Wand2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Ask me anything about the code
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Select a mode above to get started
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AIChatMessage message={msg} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {loading && (
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40" />
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40 [animation-delay:0.2s]" />
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-muted-foreground/40 [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </ScrollArea>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about the code..."
            className="h-9 text-sm"
            disabled={loading}
          />
          <Button
            size="icon"
            className="h-9 w-9 flex-shrink-0"
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}