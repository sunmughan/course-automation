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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ExecutionEvent } from "@/types";

interface ExecutionVisualizerProps {
  events: ExecutionEvent[];
  className?: string;
}

export function ExecutionVisualizer({
  events,
  className,
}: ExecutionVisualizerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSteps = events.length;
  const currentEvent = events[currentStep] ?? null;

  useEffect(() => {
    if (isPlaying && currentStep < totalSteps - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 800);
    } else if (isPlaying && currentStep >= totalSteps - 1) {
      setIsPlaying(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, currentStep, totalSteps]);

  const handlePlayPause = useCallback(() => {
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentStep, totalSteps]);

  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const handleStepBack = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  if (totalSteps === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <p className="text-sm text-muted-foreground">
          No execution events to display
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          Execution Trace
        </span>
        <div className="flex items-center gap-1">
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
            onClick={() => {
              setIsPlaying(false);
              setCurrentStep(totalSteps - 1);
            }}
            disabled={currentStep >= totalSteps - 1}
            title="Go to end"
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

            return (
              <motion.div
                key={`${event.step}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{
                  opacity: isFuture ? 0.4 : 1,
                  x: 0,
                }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isCurrent && "bg-primary/10 ring-1 ring-primary/30",
                  isPast && "text-muted-foreground"
                )}
              >
                <div className="flex-shrink-0">
                  {isCurrent ? (
                    <motion.div
                      layoutId="current-step"
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
                    >
                      {index + 1}
                    </motion.div>
                  ) : (
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium",
                        isPast
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted/50 text-muted-foreground/50"
                      )}
                    >
                      {index + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="h-5 text-[10px] px-1.5 font-mono"
                    >
                      {event.type}
                    </Badge>
                    {event.line !== undefined && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Ln {event.line}
                      </span>
                    )}
                  </div>
                  {event.variable && (
                    <p className="mt-0.5 text-xs font-mono truncate">
                      <span className="text-primary">{event.variable}</span>
                      {event.value !== undefined && (
                        <span className="text-muted-foreground">
                          {" "}
                          ={" "}
                          <span className="text-foreground">
                            {JSON.stringify(event.value)}
                          </span>
                        </span>
                      )}
                    </p>
                  )}
                  {event.message && (
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {event.message}
                    </p>
                  )}
                </div>

                {isCurrent && (
                  <motion.div
                    layoutId="current-indicator"
                    className="h-2 w-2 rounded-full bg-primary flex-shrink-0"
                  />
                )}
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
                animate={{
                  width: `${((currentStep + 1) / totalSteps) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}