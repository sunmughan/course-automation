"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, AlertTriangle, Info, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { CodeDiff, DiffSuggestion } from "@/types";

interface CodeDiffViewerProps {
  diff: CodeDiff;
  className?: string;
}

const severityColors: Record<string, string> = {
  critical: "border-red-500/50 bg-red-500/5",
  warning: "border-amber-500/50 bg-amber-500/5",
  info: "border-blue-500/50 bg-blue-500/5",
};

const severityIcons: Record<string, typeof AlertTriangle> = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

const suggestionTypeLabels: Record<string, string> = {
  performance: "Performance",
  readability: "Readability",
  security: "Security",
  best_practice: "Best Practice",
  bug_fix: "Bug Fix",
};

export function CodeDiffViewer({ diff, className }: CodeDiffViewerProps) {
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [expandedHunks, setExpandedHunks] = useState<Set<number>>(new Set());

  const toggleHunk = (index: number) => {
    setExpandedHunks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {diff.title}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-0.5 text-[10px] text-emerald-500">
              <Plus className="h-3 w-3" />
              {diff.stats.additions}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] text-red-500">
              <Minus className="h-3 w-3" />
              {diff.stats.deletions}
            </span>
          </div>
        </div>
        {diff.suggestions.length > 0 && (
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSuggestions ? "Hide" : "Show"} {diff.suggestions.length} suggestion{diff.suggestions.length !== 1 ? "s" : ""}
          </button>
        )}
      </div>

      {showSuggestions && diff.suggestions.length > 0 && (
        <div className="border-b border-border px-4 py-2 space-y-1.5">
          <AnimatePresence>
            {diff.suggestions.map((suggestion, i) => {
              const Icon = severityIcons[suggestion.severity] || Info;
              const severityColor = suggestion.severity === "critical" ? "text-red-500" : suggestion.severity === "warning" ? "text-amber-500" : "text-blue-500";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn("flex items-start gap-2 rounded-md border px-3 py-2 text-xs", severityColors[suggestion.severity])}
                >
                  <Icon className={cn("h-3.5 w-3.5 mt-0.5 flex-shrink-0", severityColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{suggestion.title}</span>
                      <Badge variant="outline" className="h-4 text-[9px] px-1">
                        {suggestionTypeLabels[suggestion.type] || suggestion.type}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-0.5">{suggestion.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <div className="font-mono text-xs leading-relaxed">
          {diff.hunks.map((hunk, index) => {
            const isExpanded = expandedHunks.has(index) || hunk.type !== "unchanged" || diff.hunks.length <= 3;

            return (
              <div key={index}>
                {hunk.type === "unchanged" && diff.hunks.length > 3 && (
                  <button
                    onClick={() => toggleHunk(index)}
                    className="w-full flex items-center gap-1 px-3 py-1 text-[10px] text-muted-foreground bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {hunk.lines.length} unchanged line{hunk.lines.length !== 1 ? "s" : ""}
                  </button>
                )}

                <AnimatePresence>
                  {isExpanded &&
                    hunk.lines.map((line, lineIndex) => {
                      const lineNum = hunk.type === "added" ? hunk.lineStart + lineIndex : hunk.type === "removed" ? hunk.lineStart + lineIndex : hunk.lineStart + lineIndex;
                      return (
                        <motion.div
                          key={`${index}-${lineIndex}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={cn(
                            "flex items-start border-l-2 px-3 py-0.5",
                            hunk.type === "added" && "border-l-emerald-500 bg-emerald-500/5",
                            hunk.type === "removed" && "border-l-red-500 bg-red-500/5",
                            hunk.type === "unchanged" && "border-l-transparent"
                          )}
                        >
                          <span className="text-muted-foreground/50 w-10 text-right pr-3 select-none flex-shrink-0">
                            {lineNum}
                          </span>
                          <span className="w-4 text-center flex-shrink-0 select-none">
                            {hunk.type === "added" && <span className="text-emerald-500">+</span>}
                            {hunk.type === "removed" && <span className="text-red-500">-</span>}
                          </span>
                          <span className={cn(
                            "whitespace-pre-wrap break-all",
                            hunk.type === "added" && "text-emerald-600",
                            hunk.type === "removed" && "text-red-600",
                            hunk.type === "unchanged" && "text-muted-foreground"
                          )}>
                            {line || " "}
                          </span>
                        </motion.div>
                      );
                    })}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}