"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CornerDownLeft, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CallStackFrame, ExecutionEvent } from "@/types";

interface CallStackProps {
  frames?: CallStackFrame[];
  events?: ExecutionEvent[];
  currentStep?: number;
  className?: string;
}

const CALL_EVENT_TYPES = new Set([
  "FUNCTION_CALL",
  "CALLSTACK_PUSH",
  "function_call",
  "callstack_push",
]);

const RETURN_EVENT_TYPES = new Set([
  "FUNCTION_RETURN",
  "CALLSTACK_POP",
  "function_return",
  "callstack_pop",
]);

function getFramesFromEvents(
  events: ExecutionEvent[],
  currentStep: number
): CallStackFrame[] {
  const visibleEvents = events.slice(0, currentStep + 1);
  const activeNames = visibleEvents.at(-1)?.callStack ?? [];

  return activeNames.map((name, index) => {
    const callEvent = visibleEvents.findLast(
      (event) =>
        CALL_EVENT_TYPES.has(event.type) &&
        (event.variable === name || event.payload?.name === name)
    );

    const returnEvent = visibleEvents.findLast(
      (event) =>
        RETURN_EVENT_TYPES.has(event.type) &&
        (event.variable === name || event.payload?.name === name)
    );

    const rawArgs = callEvent?.payload?.args;
    const args = Array.isArray(rawArgs)
      ? rawArgs.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
      : undefined;

    const returnValue =
      returnEvent?.value !== undefined
        ? returnEvent.value
        : returnEvent?.payload?.returnValue;

    return {
      id: `${name}-${index}`,
      name,
      line: callEvent?.line,
      args,
      returnValue,
      isExecuting: index === activeNames.length - 1,
      depth: index,
    };
  });
}

export function CallStack({
  frames,
  events = [],
  currentStep = events.length - 1,
  className,
}: CallStackProps) {
  const visibleFrames = frames ?? getFramesFromEvents(events, currentStep);

  if (visibleFrames.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <p className="text-sm text-muted-foreground">Call stack is empty</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-card", className)}>
      <div className="border-b border-border px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Call Stack
        </span>
        <span className="text-[10px] text-muted-foreground font-mono">
          Depth: {visibleFrames.length}
        </span>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="flex flex-col-reverse space-y-reverse space-y-1">
          <AnimatePresence>
            {visibleFrames.map((frame, index) => (
              <motion.div
                key={frame.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className={cn(
                  "rounded-md border px-3 py-2.5",
                  frame.isExecuting
                    ? "border-primary/50 bg-primary/10 ring-1 ring-primary/20"
                    : "border-border bg-muted/30"
                )}
              >
                <div className="flex items-center gap-2">
                  {frame.isExecuting ? (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="h-2 w-2 rounded-full bg-primary flex-shrink-0"
                    />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                  )}

                  <span
                    className={cn(
                      "text-sm font-mono font-medium",
                      frame.isExecuting
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {frame.name}
                  </span>

                  {frame.args && frame.args.length > 0 && (
                    <span className="text-xs text-muted-foreground font-mono">
                      ({frame.args.join(", ")})
                    </span>
                  )}

                  {frame.line !== undefined && (
                    <span className="text-[10px] text-muted-foreground/70 font-mono ml-auto">
                      Ln {frame.line}
                    </span>
                  )}
                </div>

                {frame.isExecuting && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1.5 flex items-center gap-1 text-[10px] text-primary/70"
                  >
                    <ArrowRight className="h-3 w-3" />
                    <span>Executing...</span>
                  </motion.div>
                )}

                {frame.returnValue !== undefined && !frame.isExecuting && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground"
                  >
                    <CornerDownLeft className="h-3 w-3" />
                    <span className="font-mono">
                      returns {JSON.stringify(frame.returnValue)}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="border-t border-border px-4 py-2">
        <span className="text-[10px] text-muted-foreground">
          {visibleFrames.length} frame{visibleFrames.length !== 1 ? "s" : ""} on the stack
        </span>
      </div>
    </div>
  );
}
