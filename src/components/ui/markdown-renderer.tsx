"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content) return null;

  const elements = parseMarkdown(content);

  return (
    <div className={cn("space-y-4 text-foreground/90 text-sm leading-relaxed", className)}>
      {elements}
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl border border-border/80 bg-zinc-950 text-zinc-100 overflow-hidden shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-zinc-800 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-zinc-400" />
          <span className="uppercase font-semibold tracking-wider">{language || "code"}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors text-xs"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-xs leading-5">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function formatInlineText(text: string): React.ReactNode[] {
  // Parse inline code, bold, italic, and links
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-primary font-medium border border-border/50"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic text-foreground/90">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function parseMarkdown(markdown: string): React.ReactNode[] {
  const lines = markdown.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced Code Block
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      elements.push(
        <CodeBlock key={`code-${i}`} code={codeLines.join("\n")} language={language} />
      );
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      const text = line.slice(4).trim();
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-base font-bold tracking-tight text-foreground mt-6 mb-2 flex items-center gap-2 border-b border-border/40 pb-1.5"
        >
          {formatInlineText(text)}
        </h3>
      );
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      const text = line.slice(3).trim();
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-lg font-bold tracking-tight text-foreground mt-8 mb-3 pb-2 border-b border-border"
        >
          {formatInlineText(text)}
        </h2>
      );
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      const text = line.slice(2).trim();
      elements.push(
        <h1 key={`h1-${i}`} className="text-xl font-extrabold tracking-tight text-foreground mt-4 mb-4">
          {formatInlineText(text)}
        </h1>
      );
      i++;
      continue;
    }

    // Horizontal Rule
    if (line.trim() === "---" || line.trim() === "***") {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-border/60" />);
      i++;
      continue;
    }

    // Blockquote / Callout
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [line.slice(2)];
      i++;
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <div
          key={`quote-${i}`}
          className="my-3 rounded-lg border-l-4 border-primary bg-primary/5 px-4 py-3 text-sm text-foreground/90"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx} className="my-1">
              {formatInlineText(ql)}
            </p>
          ))}
        </div>
      );
      continue;
    }

    // Unordered List (- or *)
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-3 space-y-1.5 pl-6 list-disc text-foreground/90">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {formatInlineText(item)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered List (1. 2. 3.)
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="my-3 space-y-1.5 pl-6 list-decimal text-foreground/90">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {formatInlineText(item)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed text-foreground/90 my-2">
        {formatInlineText(line)}
      </p>
    );
    i++;
  }

  return elements;
}
