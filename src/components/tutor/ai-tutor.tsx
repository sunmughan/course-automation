"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Wand2, Trash2, ArrowDown, Sparkles, HelpCircle, Code, Play, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ImageGeneratorModal } from "@/components/ai/image-generator-modal";
import type { TutorMode, ExecutionResult } from "@/types";

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

const QUICK_PROMPTS = [
  { icon: Sparkles, text: "Explain this topic in simple terms" },
  { icon: Code, text: "Show me a real-world code example" },
  { icon: Play, text: "Trace how this code executes step by step" },
  { icon: HelpCircle, text: "Give me an interview question on this" },
];

interface AITutorProps {
  userId?: string | null;
  code?: string;
  topicId?: string;
  lessonId?: string;
  executionResult?: ExecutionResult | null;
  selectedLine?: number | null;
  selectedEventIndex?: number | null;
  onHighlightLine?: (line: number) => void;
  onHighlightEvent?: (eventIndex: number) => void;
  className?: string;
}

export function AITutor({
  userId,
  code,
  topicId,
  lessonId,
  executionResult,
  selectedLine,
  selectedEventIndex,
  onHighlightLine,
  onHighlightEvent,
  className,
}: AITutorProps) {
  const { messages, loading, error, sendMessage, clearChat } = useAiTutor(userId);
  const [inputValue, setInputValue] = useState("");
  const [mode, setMode] = useState<TutorMode>("explain");
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [visualStudioOpen, setVisualStudioOpen] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "end" });
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  }, []);

  // Track scroll position to show/hide "Scroll to bottom" button
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 120;
    setShowScrollBottom(isScrolledUp);
  }, []);

  // Automatically scroll to bottom when new messages arrive or loading begins
  useEffect(() => {
    scrollToBottom(true);
  }, [messages, loading, scrollToBottom]);

  const handleSendText = useCallback((textToSend: string) => {
    if (!textToSend.trim() || loading) return;
    sendMessage({
      message: textToSend,
      mode,
      code,
      topicId,
      lessonId,
      executionResult,
      selectedLine,
      selectedEventIndex,
    });
    setInputValue("");
    setTimeout(() => scrollToBottom(true), 50);
  }, [
    loading,
    mode,
    code,
    topicId,
    lessonId,
    executionResult,
    selectedLine,
    selectedEventIndex,
    sendMessage,
    scrollToBottom,
  ]);

  const handleSend = useCallback(() => {
    handleSendText(inputValue);
  }, [handleSendText, inputValue]);

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
    <div className={cn("flex h-full flex-col bg-card overflow-hidden relative", className)}>
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 shrink-0 bg-card/80 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <Wand2 className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">AI Tutor</span>
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
            onClick={() => setVisualStudioOpen(true)}
            title="Zyloo AI Visual Studio (Generate Diagrams & UI Mockups)"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={handleClear}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ImageGeneratorModal
        open={visualStudioOpen}
        onOpenChange={setVisualStudioOpen}
        onInsertToChat={(visualMd) => {
          sendMessage({
            message: `Please explain this generated architectural blueprint/diagram:${visualMd}`,
            mode,
            code,
            topicId,
            lessonId,
          });
        }}
      />

      {/* Active mode banner */}
      {selectedMode && selectedMode.value !== "explain" && (
        <div className="px-4 py-2 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
          <Badge variant="secondary" className="text-[10px]">
            {selectedMode.label} Mode
          </Badge>
          {selectedLine && (
            <Badge variant="outline" className="text-[10px] font-mono">
              Line {selectedLine} selected
            </Badge>
          )}
        </div>
      )}

      {/* Main scrollable message container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-border/40 scroll-smooth"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {error && (
          <div className="px-4 py-3 m-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {messages.length === 0 && !error ? (
          <div className="flex min-h-full flex-col items-center justify-center px-6 py-10 text-center">
            <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
              <Wand2 className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Ask AI Tutor</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Get instant explanations, step-by-step code breakdowns, debugging help, or practice challenges.
            </p>

            {/* Quick suggested prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full max-w-md">
              {QUICK_PROMPTS.map((qp, idx) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSendText(qp.text)}
                    className="flex items-center gap-2 p-2.5 rounded-lg border border-border/80 bg-card hover:bg-muted/60 text-left text-xs transition-colors group cursor-pointer"
                  >
                    <Icon className="size-3.5 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-foreground/90 leading-tight">{qp.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-2">
            {messages.map((message) => (
              <AIChatMessage
                key={message.id}
                message={message}
                onHighlightLine={onHighlightLine}
                onHighlightEvent={onHighlightEvent}
              />
            ))}
            {loading && (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>Thinking & generating response...</span>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} className="h-px w-full" />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-18 right-6 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all z-20 flex items-center gap-1 text-xs cursor-pointer animate-bounce"
          title="Scroll to latest message"
        >
          <ArrowDown className="size-4" />
        </button>
      )}

      {/* Input bar */}
      <div className="border-t border-border p-3 shrink-0 bg-card">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedLine
                ? `Ask about line ${selectedLine}...`
                : "Ask about this lesson, code, or concept..."
            }
            disabled={loading}
            className="flex-1 text-xs bg-background"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}
            className="h-8 w-8 shrink-0 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}