"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, XCircle, Timer, Layers, ArrowRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { AsyncTrace, AsyncEvent } from "@/types";

interface AsyncVisualizerProps {
  trace: AsyncTrace;
  className?: string;
}

const eventTypeIcons: Record<string, typeof Clock> = {
  promise_create: Clock,
  promise_resolve: CheckCircle2,
  promise_reject: XCircle,
  timeout_set: Timer,
  timeout_fire: Timer,
  microtask: Layers,
  macrotask: Layers,
};

const eventTypeColors: Record<string, string> = {
  promise_create: "border-l-blue-500 bg-blue-500/5",
  promise_resolve: "border-l-emerald-500 bg-emerald-500/5",
  promise_reject: "border-l-red-500 bg-red-500/5",
  timeout_set: "border-l-amber-500 bg-amber-500/5",
  timeout_fire: "border-l-orange-500 bg-orange-500/5",
  microtask: "border-l-purple-500 bg-purple-500/5",
  macrotask: "border-l-violet-500 bg-violet-500/5",
};

const eventTypeLabels: Record<string, string> = {
  promise_create: "Promise Created",
  promise_resolve: "Promise Resolved",
  promise_reject: "Promise Rejected",
  timeout_set: "Timeout Set",
  timeout_fire: "Timeout Fired",
  microtask: "Microtask",
  macrotask: "Macrotask",
};

export function AsyncVisualizer({ trace, className }: AsyncVisualizerProps) {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  const phases = useMemo(() => {
    if (trace.timeline.length > 0) return trace.timeline;
    return [
      { phase: "Execution", events: trace.events },
    ];
  }, [trace]);

  const filteredEvents = selectedPhase
    ? phases.find((p) => p.phase === selectedPhase)?.events || trace.events
    : trace.events;

  const timelineStart = trace.events[0]?.timestamp || 0;
  const timelineEnd = trace.events[trace.events.length - 1]?.timestamp || 0;
  const timelineDuration = Math.max(timelineEnd - timelineStart, 1);

  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Async Trace</span>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="h-4 text-[9px] px-1 gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {trace.summary.totalPromises} promises
            </Badge>
            <Badge variant="outline" className="h-4 text-[9px] px-1 gap-0.5">
              <Timer className="h-2.5 w-2.5" />
              {trace.summary.totalTimeouts} timeouts
            </Badge>
            <Badge variant="outline" className="h-4 text-[9px] px-1 gap-0.5">
              <Layers className="h-2.5 w-2.5" />
              {trace.summary.microtasks + trace.summary.macrotasks} tasks
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {phases.map((phase) => (
            <button
              key={phase.phase}
              onClick={() => setSelectedPhase(selectedPhase === phase.phase ? null : phase.phase)}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded transition-colors",
                selectedPhase === phase.phase
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {phase.phase}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border/50" />

          <div className="space-y-1">
            <AnimatePresence>
              {filteredEvents.map((event, index) => {
                const Icon = eventTypeIcons[event.type] || Play;
                const relativeTime = event.timestamp - timelineStart;
                const leftPercent = (relativeTime / timelineDuration) * 100;

                return (
                  <motion.div
                    key={event.id || index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "relative flex items-start gap-3 rounded-md border-l-2 px-3 py-2 ml-4",
                      eventTypeColors[event.type] || "border-l-slate-500"
                    )}
                  >
                    <div className="absolute left-[-1.15rem] top-3">
                      <div className={cn(
                        "h-2.5 w-2.5 rounded-full border-2 border-background",
                        event.type.includes("resolve") ? "bg-emerald-500" :
                        event.type.includes("reject") ? "bg-red-500" :
                        event.type.includes("create") ? "bg-blue-500" :
                        "bg-muted-foreground/50"
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <Badge variant="outline" className="h-4 text-[9px] px-1">
                          {eventTypeLabels[event.type] || event.type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          +{relativeTime}ms
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-foreground">{event.description}</p>
                      {event.source && (
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          Source: {event.source}
                        </p>
                      )}
                      {event.result !== undefined && (
                        <p className="text-[10px] text-emerald-500 font-mono mt-0.5">
                          Result: {JSON.stringify(event.result)}
                        </p>
                      )}
                      {event.error && (
                        <p className="text-[10px] text-red-500 font-mono mt-0.5">
                          Error: {event.error}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0 w-16">
                      <div className="relative h-1 mt-2 rounded-full bg-muted">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-primary/30"
                          style={{ width: `${leftPercent}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-2">
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            {trace.summary.resolvedPromises} resolved
          </span>
          {trace.summary.rejectedPromises > 0 && (
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" />
              {trace.summary.rejectedPromises} rejected
            </span>
          )}
          <span className="flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            {timelineDuration}ms total
          </span>
        </div>
      </div>
    </div>
  );
}