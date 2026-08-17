"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, XCircle, Timer, Layers, ArrowRight, Play, Globe, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { AsyncTrace, AsyncEvent } from "@/types";

interface AsyncVisualizerProps {
  trace: AsyncTrace;
  className?: string;
}

const eventTypeIcons: Record<string, typeof Clock> = {
  ASYNC_START: Clock,
  ASYNC_WAIT: Timer,
  ASYNC_RESUME: Play,
  NETWORK_REQUEST: Globe,
  NETWORK_RESPONSE: Wifi,
  promise_create: Clock,
  promise_resolve: CheckCircle2,
  promise_reject: XCircle,
  timeout_set: Timer,
  timeout_fire: Timer,
  microtask: Layers,
  macrotask: Layers,
};

const eventTypeColors: Record<string, string> = {
  ASYNC_START: "border-l-blue-500 bg-blue-500/5",
  ASYNC_WAIT: "border-l-amber-500 bg-amber-500/5",
  ASYNC_RESUME: "border-l-green-500 bg-green-500/5",
  NETWORK_REQUEST: "border-l-sky-500 bg-sky-500/5",
  NETWORK_RESPONSE: "border-l-emerald-500 bg-emerald-500/5",
  promise_create: "border-l-blue-500 bg-blue-500/5",
  promise_resolve: "border-l-emerald-500 bg-emerald-500/5",
  promise_reject: "border-l-red-500 bg-red-500/5",
  timeout_set: "border-l-amber-500 bg-amber-500/5",
  timeout_fire: "border-l-orange-500 bg-orange-500/5",
  microtask: "border-l-purple-500 bg-purple-500/5",
  macrotask: "border-l-violet-500 bg-violet-500/5",
};

const eventTypeLabels: Record<string, string> = {
  ASYNC_START: "Async Start",
  ASYNC_WAIT: "Async Wait",
  ASYNC_RESUME: "Async Resume",
  NETWORK_REQUEST: "Network Request",
  NETWORK_RESPONSE: "Network Response",
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
    if (trace.timeline && trace.timeline.length > 0) return trace.timeline;
    return [
      { phase: "Execution", events: trace.events || [] },
    ];
  }, [trace]);

  const filteredEvents = selectedPhase
    ? phases.find((p) => p.phase === selectedPhase)?.events || trace.events || []
    : trace.events || [];

  const timelineStart = trace.events?.[0]?.timestamp || 0;
  const timelineEnd = trace.events?.[trace.events.length - 1]?.timestamp || 0;
  const timelineDuration = Math.max(timelineEnd - timelineStart, 1);

  if (!trace.events || trace.events.length === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8 rounded-lg border border-border bg-card", className)}>
        <p className="text-sm text-muted-foreground">No async events in trace</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Async Trace</span>
          {trace.summary && (
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
          )}
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
                const label = eventTypeLabels[event.type] || event.type;

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
                    <div className="absolute -left-[19px] top-3 h-2 w-2 rounded-full border border-background bg-border" />

                    <Icon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                          {label}
                        </Badge>
                        <span className="text-xs font-mono font-medium truncate">
                          {event.description || event.type}
                        </span>
                        {event.duration !== undefined && (
                          <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                            {event.duration}ms
                          </span>
                        )}
                      </div>

                      {event.source && (
                        <div className="mt-1 text-[10px] font-mono text-muted-foreground/70">
                          src: {event.source}
                        </div>
                      )}

                      {event.error && (
                        <div className="mt-1 text-xs text-red-500 font-mono">
                          {event.error}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}