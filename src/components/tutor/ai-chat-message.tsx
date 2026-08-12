"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { Copy, Check, User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIChatMessage } from "@/types";

interface AIChatMessageProps {
  message: AIChatMessage;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="relative my-2 rounded-lg border border-border bg-muted/50">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border">
        <span className="text-xs text-muted-foreground font-mono">code</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm font-mono leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderContent(content: string) {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const parts: { type: "text" | "code"; content: string; language?: string }[] =
    [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: content.slice(lastIndex, match.index),
      });
    }
    parts.push({
      type: "code",
      language: match[1] || "plaintext",
      content: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      content: content.slice(lastIndex),
    });
  }

  return parts.map((part, i) => {
    if (part.type === "code") {
      return <CodeBlock key={i} code={part.content} />;
    }
    return (
      <div
        key={i}
        className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words"
        dangerouslySetInnerHTML={{
          __html: part.content
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>")
            .replace(/`([^`]+)`/g, "<code class='bg-muted px-1 py-0.5 rounded text-sm font-mono'>$1</code>")
            .replace(/\n/g, "<br />"),
        }}
      />
    );
  });
}

export function AIChatMessage({ message }: AIChatMessageProps) {
  const isUser = message.role === "user";
  const timestamp = format(new Date(message.timestamp), "h:mm a");

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[85%] flex-col",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-lg px-4 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {renderContent(message.content)}
        </div>
        <span className="mt-1 text-[10px] text-muted-foreground">
          {timestamp}
        </span>
      </div>

      {isUser && (
        <div className="flex-shrink-0 mt-0.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary">
            <User className="h-4 w-4 text-secondary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}