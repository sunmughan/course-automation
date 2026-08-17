"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ExecutionEvent, VariableSnapshot } from "@/types";

interface MemoryViewProps {
  events: ExecutionEvent[];
  currentStep: number;
  className?: string;
}

interface VariableEntry {
  name: string;
  value: unknown;
  type: string;
  scope?: "global" | "function" | "block";
  prevValue?: unknown;
  changed: boolean;
}

const VARIABLE_EVENT_TYPES = new Set([
  "VARIABLE_DECLARE",
  "VARIABLE_ASSIGN",
  "OBJECT_CREATE",
  "OBJECT_UPDATE",
  "variable_declare",
  "variable_declaration",
  "variable_assign",
  "assignment",
  "variable",
]);

function getVariableType(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function formatValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function MemoryView({ events, currentStep, className }: MemoryViewProps) {
  const variableMap = new Map<string, VariableEntry>();
  const activeEvent = events[currentStep];

  // If the active event contains a direct snapshot of the memory/heap, prioritize it
  if (activeEvent?.snapshot && activeEvent.snapshot.length > 0) {
    for (const snap of activeEvent.snapshot) {
      variableMap.set(snap.name, {
        name: snap.name,
        value: snap.value,
        type: snap.type || getVariableType(snap.value),
        scope: snap.scope,
        prevValue: snap.previousValue,
        changed: Boolean(snap.changed),
      });
    }
  } else {
    // Otherwise, accumulate variable events sequentially up to currentStep
    for (let i = 0; i <= currentStep && i < events.length; i++) {
      const event = events[i];
      if (!event) continue;

      const varName =
        event.variable ||
        (event.payload?.name as string) ||
        (event.payload?.variable as string);

      if (varName && VARIABLE_EVENT_TYPES.has(event.type)) {
        const val = event.value !== undefined ? event.value : event.payload?.value;
        const prev = variableMap.get(varName);
        const payloadPrev = event.payload?.previousValue;

        variableMap.set(varName, {
          name: varName,
          value: val,
          type: getVariableType(val),
          scope: event.scope as "global" | "function" | "block",
          prevValue: payloadPrev !== undefined ? payloadPrev : prev?.value,
          changed: prev !== undefined && prev.value !== val,
        });
      }
    }
  }

  const heapVariables: VariableEntry[] = [];
  const stackVariables: VariableEntry[] = [];

  for (const entry of variableMap.values()) {
    if (entry.type === "object" || entry.type === "array") {
      heapVariables.push(entry);
    } else {
      stackVariables.push(entry);
    }
  }

  if (variableMap.size === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <p className="text-sm text-muted-foreground">No variables in memory</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-card", className)}>
      <div className="border-b border-border px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Memory State
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">
          {variableMap.size} variable{variableMap.size !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {stackVariables.length > 0 && (
            <div>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Stack
              </h4>
              <div className="space-y-1">
                <AnimatePresence>
                  {stackVariables.map((entry) => (
                    <motion.div
                      key={entry.name}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-mono border",
                        entry.changed
                          ? "border-primary/30 bg-primary/5"
                          : "border-transparent bg-muted/50"
                      )}
                    >
                      <span
                        className={cn(
                          "text-[10px] uppercase px-1 py-0.5 rounded font-medium",
                          "bg-muted text-muted-foreground"
                        )}
                      >
                        {entry.type}
                      </span>
                      <span className="font-semibold text-foreground">
                        {entry.name}
                      </span>
                      <span className="text-muted-foreground">=</span>
                      <motion.span
                        key={String(entry.value)}
                        initial={{ color: "#22c55e" }}
                        animate={{ color: "var(--foreground)" }}
                        transition={{ duration: 0.5 }}
                        className="truncate"
                      >
                        {formatValue(entry.value)}
                      </motion.span>
                      {entry.changed && entry.prevValue !== undefined && (
                        <span className="text-[10px] text-muted-foreground/60">
                          (was {formatValue(entry.prevValue)})
                        </span>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {heapVariables.length > 0 && (
            <div>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Heap
              </h4>
              <div className="grid gap-2">
                <AnimatePresence>
                  {heapVariables.map((entry) => (
                    <motion.div
                      key={entry.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "rounded-md border p-3",
                        entry.changed
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase px-1 py-0.5 rounded font-medium bg-muted text-muted-foreground">
                          {entry.type}
                        </span>
                        <span className="text-sm font-semibold font-mono">
                          {entry.name}
                        </span>
                      </div>
                      <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                        {formatValue(entry.value)}
                      </pre>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}