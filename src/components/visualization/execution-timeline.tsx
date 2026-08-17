"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Variable,
  FunctionSquare,
  ArrowRight,
  AlertCircle,
  Terminal,
  GitBranch,
  Repeat,
  Layers,
  Clock,
  Timer,
  Globe,
  Wifi,
  CheckCircle2,
  Sliders,
} from "lucide-react";
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
  PROGRAM_START: Terminal,
  LINE_EXECUTED: Gauge,
  VARIABLE_DECLARE: Variable,
  VARIABLE_ASSIGN: Variable,
  FUNCTION_CALL: FunctionSquare,
  FUNCTION_RETURN: ArrowRight,
  CONDITION_CHECK: GitBranch,
  LOOP_START: Repeat,
  LOOP_ITERATION: Repeat,
  LOOP_END: Repeat,
  OBJECT_CREATE: Layers,
  OBJECT_UPDATE: Layers,
  CALLSTACK_PUSH: Layers,
  CALLSTACK_POP: Layers,
  ASYNC_START: Clock,
  ASYNC_WAIT: Timer,
  ASYNC_RESUME: Play,
  NETWORK_REQUEST: Globe,
  NETWORK_RESPONSE: Wifi,
  ERROR: AlertCircle,
  OUTPUT: Terminal,
  PROGRAM_END: CheckCircle2,

  // Legacy mappings
  variable_declare: Variable,
  variable_declaration: Variable,
  variable_assign: Variable,
  assignment: Variable,
  function_call: FunctionSquare,
  function_return: ArrowRight,
  loop_start: Repeat,
  loop_iteration: Repeat,
  loop_end: Repeat,
  conditional: GitBranch,
  condition_check: GitBranch,
  console_output: Terminal,
  output: Terminal,
  error: AlertCircle,
  return: ArrowRight,
  expression: Gauge,
};

const typeColors: Record<string, string> = {
  PROGRAM_START: "border-l-blue-500 text-blue-500",
  LINE_EXECUTED: "border-l-slate-400 text-slate-400",
  VARIABLE_DECLARE: "border-l-blue-500 text-blue-500",
  VARIABLE_ASSIGN: "border-l-cyan-500 text-cyan-500",
  FUNCTION_CALL: "border-l-purple-500 text-purple-500",
  FUNCTION_RETURN: "border-l-violet-500 text-violet-500",
  CONDITION_CHECK: "border-l-yellow-500 text-yellow-500",
  LOOP_START: "border-l-orange-500 text-orange-500",
  LOOP_ITERATION: "border-l-amber-500 text-amber-500",
  LOOP_END: "border-l-orange-500 text-orange-500",
  OBJECT_CREATE: "border-l-emerald-500 text-emerald-500",
  OBJECT_UPDATE: "border-l-teal-500 text-teal-500",
  CALLSTACK_PUSH: "border-l-indigo-500 text-indigo-500",
  CALLSTACK_POP: "border-l-indigo-400 text-indigo-400",
  ASYNC_START: "border-l-sky-500 text-sky-500",
  ASYNC_WAIT: "border-l-amber-500 text-amber-500",
  ASYNC_RESUME: "border-l-green-500 text-green-500",
  NETWORK_REQUEST: "border-l-blue-600 text-blue-600",
  NETWORK_RESPONSE: "border-l-emerald-600 text-emerald-600",
  ERROR: "border-l-red-500 text-red-500",
  OUTPUT: "border-l-emerald-500 text-emerald-500",
  PROGRAM_END: "border-l-zinc-500 text-zinc-500",

  // Legacy mappings
  variable_declare: "border-l-blue-500 text-blue-500",
  variable_declaration: "border-l-blue-500 text-blue-500",
  variable_assign: "border-l-cyan-500 text-cyan-500",
  assignment: "border-l-cyan-500 text-cyan-500",
  function_call: "border-l-purple-500 text-purple-500",
  function_return: "border-l-violet-500 text-violet-500",
  loop_start: "border-l-orange-500 text-orange-500",
  loop_iteration: "border-l-amber-500 text-amber-500",
  loop_end: "border-l-orange-500 text-orange-500",
  conditional: "border-l-yellow-500 text-yellow-500",
  condition_check: "border-l-yellow-500 text-yellow-500",
  console_output: "border-l-emerald-500 text-emerald-500",
  output: "border-l-emerald-500 text-emerald-500",
  error: "border-l-red-500 text-red-500",
  return: "border-l-pink-500 text-pink-500",
  expression: "border-l-slate-500 text-slate-500",
};

const typeLabels: Record<string, string> = {
  PROGRAM_START: "Start",
  LINE_EXECUTED: "Line",
  VARIABLE_DECLARE: "Declare",
  VARIABLE_ASSIGN: "Assign",
  FUNCTION_CALL: "Call",
  FUNCTION_RETURN: "Return",
  CONDITION_CHECK: "Condition",
  LOOP_START: "Loop Start",
  LOOP_ITERATION: "Loop Step",
  LOOP_END: "Loop End",
  OBJECT_CREATE: "New Object",
  OBJECT_UPDATE: "Update Object",
  CALLSTACK_PUSH: "Stack Push",
  CALLSTACK_POP: "Stack Pop",
  ASYNC_START: "Async",
  ASYNC_WAIT: "Wait",
  ASYNC_RESUME: "Resume",
  NETWORK_REQUEST: "Network Req",
  NETWORK_RESPONSE: "Network Res",
  ERROR: "Error",
  OUTPUT: "Output",
  PROGRAM_END: "End",

  // Legacy mappings
  variable_declare: "Declare",
  variable_declaration: "Declare",
  variable_assign: "Assign",
  assignment: "Assign",
  function_call: "Call",
  function_return: "Return",
  loop_start: "Loop",
  loop_iteration: "Iteration",
  loop_end: "Loop End",
  conditional: "Condition",
  condition_check: "Condition",
  console_output: "Output",
  output: "Output",
  error: "Error",
  return: "Return",
  expression: "Expr",
};

const SPEED_OPTIONS = [
  { label: "0.5x", value: 1500 },
  { label: "1x", value: 800 },
  { label: "2x", value: 400 },
  { label: "4x", value: 200 },
];

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

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
    onStepChange?.(0);
  }, [onStepChange]);

  const handleJumpToEnd = useCallback(() => {
    setIsPlaying(false);
    const endStep = totalSteps - 1;
    setCurrentStep(endStep);
    onStepChange?.(endStep);
  }, [totalSteps, onStepChange]);

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
              <Badge variant="outline" className="h-4 text-[9px] px-1 gap-0.5">
                <GitBranch className="h-2.5 w-2.5" />
                {trace.summary.conditionals}
              </Badge>
              {trace.summary.errors > 0 && (
                <Badge variant="destructive" className="h-4 text-[9px] px-1 gap-0.5">
                  <AlertCircle className="h-2.5 w-2.5" />
                  {trace.summary.errors}
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Speed controls */}
          <div className="flex items-center gap-0.5 mr-2">
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSpeed(opt.value)}
                className={cn(
                  "px-1.5 py-0.5 text-[9px] rounded font-mono transition-colors",
                  speed === opt.value
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={`Playback speed ${opt.label}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleReset}
            disabled={currentStep === 0}
            title="Reset"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleStepBack}
            disabled={currentStep === 0}
            title="Previous step"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handlePlayPause}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleStepForward}
            disabled={currentStep >= totalSteps - 1}
            title="Next step"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleJumpToEnd}
            disabled={currentStep >= totalSteps - 1}
            title="Jump to end"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-1.5">
          {events.map((event, index) => {
            const isCurrent = index === currentStep;
            const isPast = index < currentStep;
            const isFuture = index > currentStep;
            const Icon = typeIcons[event.type] || Gauge;
            const colorClass = typeColors[event.type] || "border-l-slate-500 text-slate-500";
            const label = typeLabels[event.type] || event.type;

            return (
              <motion.div
                key={event.id || `${event.step || index}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: isFuture ? 0.35 : 1,
                  x: 0,
                }}
                transition={{ duration: 0.15 }}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStep(index);
                  onStepChange?.(index);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition-all cursor-pointer",
                  colorClass,
                  isCurrent
                    ? "bg-primary/10 ring-1 ring-primary/30"
                    : isPast
                    ? "hover:bg-muted/40"
                    : "opacity-40 hover:opacity-60"
                )}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Icon className="h-4 w-4 shrink-0" />
                  <Badge variant="outline" className="h-5 text-[10px] px-1 font-mono shrink-0">
                    {label}
                  </Badge>
                  {event.line !== undefined && (
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      Ln {event.line}
                    </span>
                  )}
                  <span className="text-xs truncate font-mono">
                    {event.message || event.payload?.message ? (
                      String(event.message || event.payload?.message)
                    ) : event.payload?.condition ? (
                      `if (${event.payload.condition}) -> ${Boolean(event.payload.result)}`
                    ) : event.payload?.iteration !== undefined ? (
                      `Iteration ${event.payload.iteration}`
                    ) : event.variable ? (
                      <>
                        <span className="text-primary font-semibold">{event.variable}</span>
                        {event.value !== undefined && (
                          <span className="text-muted-foreground"> = {JSON.stringify(event.value)}</span>
                        )}
                      </>
                    ) : (
                      label
                    )}
                  </span>
                </div>

                {isCurrent && (
                  <motion.div
                    layoutId="timeline-current"
                    className="h-2 w-2 rounded-full bg-primary shrink-0"
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
            Step {currentStep + 1} / {totalSteps}
          </span>
          <div className="flex-1">
            <div
              className="relative h-1.5 rounded-full bg-muted cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickPos = (e.clientX - rect.left) / rect.width;
                const targetStep = Math.min(
                  Math.max(0, Math.floor(clickPos * totalSteps)),
                  totalSteps - 1
                );
                setIsPlaying(false);
                setCurrentStep(targetStep);
                onStepChange?.(targetStep);
              }}
            >
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                animate={{
                  width: `${((currentStep + 1) / totalSteps) * 100}%`,
                }}
                transition={{ duration: 0.2 }}
              />
            </div>
          </div>
          {currentEvent?.scope && (
            <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0 font-mono">
              Scope: {currentEvent.scope}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}