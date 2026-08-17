"use client";

import { format } from "date-fns";
import { User, Bot, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import type { AIChatMessage as AIChatMessageType } from "@/types";

interface AIChatMessageProps {
  message: AIChatMessageType;
  onHighlightLine?: (line: number) => void;
  onHighlightEvent?: (eventIndex: number) => void;
}

export function AIChatMessage({
  message,
  onHighlightLine,
  onHighlightEvent,
}: AIChatMessageProps) {
  const isUser = message.role === "user";
  const timestamp = format(new Date(message.timestamp), "h:mm a");
  const viz = message.visualization || message.structured?.visualization;

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3.5 transition-colors",
        isUser ? "justify-end bg-transparent" : "justify-start bg-muted/20"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shadow-xs">
            <Bot className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[90%] md:max-w-[85%] flex-col",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm shadow-xs",
            isUser
              ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
              : "bg-card border border-border/80 text-card-foreground rounded-tl-xs w-full"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
              <MarkdownRenderer content={message.content} />
            </div>
          )}

          {/* Visual highlight actions from AI */}
          {viz && (
            <div className="mt-3 pt-2.5 border-t border-border/40 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Eye className="h-3.5 w-3.5 text-primary" />
                Visual Targets:
              </span>
              {viz.highlightLines?.map((line) => (
                <button
                  key={line}
                  onClick={() => onHighlightLine?.(line)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-mono transition-colors cursor-pointer"
                  title={`Highlight Line ${line} in editor`}
                >
                  Line {line}
                </button>
              ))}
              {viz.highlightEvents?.map((evtIdx) => (
                <button
                  key={evtIdx}
                  onClick={() => onHighlightEvent?.(evtIdx)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-mono transition-colors cursor-pointer"
                  title={`Focus event Step ${evtIdx} in timeline`}
                >
                  Step {evtIdx}
                </button>
              ))}
              {viz.focusVariable && (
                <Badge variant="outline" className="text-[10px] h-4.5 font-mono">
                  Var: {viz.focusVariable}
                </Badge>
              )}
            </div>
          )}
        </div>
        <span className="mt-1 text-[10px] text-muted-foreground px-1 font-mono">
          {timestamp}
        </span>
      </div>

      {isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary border border-border shadow-xs">
            <User className="h-4 w-4 text-secondary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}