"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, Gauge, Variable, FunctionSquare, ArrowRight, AlertCircle, Terminal, GitBranch, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ExecutionEvent, ExecutionTrace, TraceStep, VariableSnapshot } from "@/types";

interface ExecutionTimelineProps {
  events: ExecutionEvent[];
  trace?: ExecutionTrace;
  className?: string;
  onStepChange?: (step: number) => void;
  highlightedLine?: number;
}

const typeIcons: Record<string, typeof Variable> = {
  variable_declare: Variable,
  variable_assign: Variable,
  function_call: FunctionSquare,
  function_return: ArrowRight,
  loop_start: Repeat,
  loop_iteration: Repeat,
  loop_end: Repeat,
  conditional: GitBranch,
  console_output: Terminal,
  error: AlertCircle,
  return: ArrowRight,
  expression: Gauge,
};

const typeColors: Record<string, string> = {
  variable_declare: "border-l-blue-500 text-blue-500",
  variable_assign: "border-l-cyan-500 text-cyan-500",
  function_call: "border-l-purple-500 text-purple-500",
  function_return: "border-l-violet-500 text-violet-500",
  loop_start: "border-l-orange-500 text-orange-500",
  loop_iteration: "border-l-amber-500 text-amber-500",
  loop_end: "border-l-orange-500 text-orange-500",
  conditional: "border-l-yellow-500 text-yellow-500",
  console_output: "border-l-emerald-500 text-emerald-500",
  error: "border-l-red-500 text-red-500",
  return: "border-l-pink-500 text-pink-500",
  expression: "border-l-slate-500 text-slate-500",
};

const typeLabels: Record<string, string> = {
  variable_declare: "Declare",
  variable_assign: "Assign",
  function_call: "Call",
  function_return: "Return",
  loop_start: "Loop",
  loop_iteration: "Iteration",
  loop_end: "Loop End",
  conditional: "Condition",
  console_output: "Output",
  error: "Error",
  return: "Return",
  expression: "Expr",
};

export function ExecutionTimeline({
  events,
  trace,
  className,
  onStepChange,
  highlightedLine,
}: ExecutionTimelineProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const [showVariables, setShowVariables] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const traceSteps = trace?.steps || [];
  const totalSteps = Math.max(events.length, traceSteps.length);
  const currentEvent = events[currentStep];
  const currentTraceStep = traceSteps[currentStep];

  useEffect(() => {
    if (isPlaying && currentStep < totalSteps - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          const next = prev + 1;
          onStepChange?.(next);
          return next;
        });
      }, speed);
    } else if (isPlaying && currentStep >= totalSteps - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, currentStep, totalSteps, speed, onStepChange]);

  const handlePlayPause = useCallback(() => {
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(0);
      onStepChange?.(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentStep, totalSteps, onStepChange]);

  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => {
      const next = Math.min(prev + 1, totalSteps - 1);
      onStepChange?.(next);
      return next;
    });
  }, [totalSteps, onStepChange]);

  const handleStepBack = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => {
      const next = Math.max(prev - 1, 0);
      onStepChange?.(next);
      return next;
    });
  }, [onStepChange]);

  if (totalSteps === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <p className="text-sm text-muted-foreground">No execution trace available</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Execution Timeline</span>
          {trace?.summary && (
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="h-4 text-[9px] px-1 gap-0.5">
                <FunctionSquare className="h-2.5 w-2.5" />
                {trace.summary.functionCalls}
              </Badge>
              <Badge variant="outline" className="h-4 text-[9px] px-1 gap-0.5">
                <Variable className="h-2.5 w-2.5" />
                {trace.summary.variableChanges}
              </Badge>
              <Badge variant="outline" className="h-4 text-[9px] px-1 gap-0.5">
                <Repeat className="h-2.5 w-2.5" />
                {trace.summary.loopIterations}
              </Badge>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setCurrentStep(0); onStepChange?.(0); setIsPlaying(false); }}>
            <SkipBack className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleStepBack} disabled={currentStep === 0}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePlayPause}>
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleStepForward} disabled={currentStep >= totalSteps - 1}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setCurrentStep(totalSteps - 1); onStepChange?.(totalSteps - 1); setIsPlaying(false); }} disabled={currentStep >= totalSteps - 1}>
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-7 text-[10px]", showVariables && "bg-primary/10 text-primary")}
            onClick={() => setShowVariables(!showVariables)}
          >
            <Variable className="h-3 w-3 mr-1" />
            Vars
          </Button>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="h-7 text-[10px] bg-transparent border border-border rounded px-1 text-muted-foreground"
          >
            <option value={400}>0.5x</option>
            <option value={800}>1x</option>
            <option value={1600}>2x</option>
            <option value={3200}>4x</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="divide-y divide-border/50">
          {events.map((event, index) => {
            const isCurrent = index === currentStep;
            const isPast = index < currentStep;
            const isFuture = index > currentStep;
            const traceStep = traceSteps[index];
            const Icon = typeIcons[event.type] || Gauge;
            const colorClass = typeColors[event.type] || "border-l-slate-500 text-slate-500";
            const isHighlighted = highlightedLine !== undefined && event.line === highlightedLine;

            return (
              <motion.div
                key={`${event.step}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: isFuture ? 0.3 : 1,
                  x: 0,
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex items-start gap-3 px-4 py-2.5 text-sm transition-all border-l-2",
                  isCurrent && "bg-primary/5 border-l-primary ring-1 ring-primary/10",
                  isPast && "border-l-transparent",
                  !isCurrent && !isPast && colorClass,
                  isHighlighted && "ring-1 ring-yellow-500/30"
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isCurrent ? (
                    <motion.div layoutId="timeline-current" className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {index + 1}
                    </motion.div>
                  ) : (
                    <div className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium", isPast ? "bg-muted text-muted-foreground" : "bg-muted/40 text-muted-foreground/50")}>
                      {index + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon className={cn("h-3.5 w-3.5", isCurrent ? "text-primary" : isPast ? "text-muted-foreground/50" : "")} />
                    <Badge variant="outline" className={cn("h-4 text-[9px] px-1 font-mono", isPast && "opacity-50")}>
                      {typeLabels[event.type] || event.type}
                    </Badge>
                    {event.line !== undefined && (
                      <span className={cn("text-[10px] font-mono", isCurrent ? "text-primary" : "text-muted-foreground")}>
                        Ln {event.line}
                      </span>
                    )}
                    {event.scope && event.scope !== "global" && (
                      <span className="text-[10px] text-muted-foreground/70">{event.scope}</span>
                    )}
                  </div>

                  {traceStep?.description && (
                    <p className={cn("mt-0.5 text-xs font-mono", isPast ? "text-muted-foreground/60" : "text-foreground")}>
                      {traceStep.description}
                    </p>
                  )}

                  {event.variable && (
                    <p className="mt-0.5 text-xs font-mono">
                      <span className={cn(isCurrent ? "text-primary" : "text-muted-foreground")}>{event.variable}</span>
                      {event.value !== undefined && (
                        <span className="text-muted-foreground">
                          {" = "}
                          <span className="text-foreground">{JSON.stringify(event.value)}</span>
                        </span>
                      )}
                    </p>
                  )}

                  {event.message && !traceStep?.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">{event.message}</p>
                  )}

                  {showVariables && isCurrent && traceStep?.state && traceStep.state.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-2 pt-2 border-t border-border/50"
                    >
                      <p className="text-[10px] text-muted-foreground mb-1 font-medium">Variable State</p>
                      <div className="grid grid-cols-2 gap-1">
                        {traceStep.state.map((v: VariableSnapshot, vi: number) => (
                          <div key={vi} className={cn("flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono", v.changed && "bg-primary/5")}>
                            <span className="text-muted-foreground">{v.name}</span>
                            <span className="text-muted-foreground/50">=</span>
                            <span className={cn("truncate", v.changed ? "text-primary" : "text-foreground")}>
                              {JSON.stringify(v.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <div className="flex-1 mx-4">
            <div className="relative h-1.5 rounded-full bg-muted">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          {trace?.maxDepth !== undefined && (
            <span className="text-[10px] text-muted-foreground">
              Depth: {trace.maxDepth}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}