"use client";

import { useMemo } from "react";
import {
  Terminal,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CallStack } from "@/components/visualization/call-stack";
import { MemoryView } from "@/components/visualization/memory-view";
import { cn } from "@/lib/utils";
import type { ExecutionEvent } from "@/types";

interface CodeOutputProps {
  output: string;
  error: string | null;
  events: ExecutionEvent[];
  loading: boolean;
  executionTime: number;
  language?: string;
  className?: string;
}

interface TestCase {
  name: string;
  passed: boolean;
  message?: string;
}

function parseTestCases(events: ExecutionEvent[]): TestCase[] {
  const testEvents = events.filter((e) => e.type === "test" || e.type === "assert");
  if (testEvents.length > 0) {
    return testEvents.map((e) => ({
      name: e.variable || e.message || "Test",
      passed: e.type !== "error",
      message: e.message,
    }));
  }
  return [];
}

export function CodeOutput({
  output,
  error,
  events,
  loading,
  executionTime,
  className,
}: CodeOutputProps) {
  const consoleOutput = useMemo(() => {
    return events
      .filter(
        (e) =>
          e.type === "OUTPUT" ||
          e.type === "output" ||
          e.type === "log" ||
          e.type === "console_output"
      )
      .map((e) => e.message || (e.payload?.message as string) || "")
      .filter(Boolean);
  }, [events]);

  const testCases = useMemo(() => parseTestCases(events), [events]);

  const hasOutput = output.length > 0;
  const hasConsole = consoleOutput.length > 0;
  const hasTests = testCases.length > 0;
  const currentStep = events.length - 1;

  return (
    <div className={cn("flex flex-col bg-card", className)}>
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Terminal className="size-3.5" />
          <span>Output</span>
        </div>
        {executionTime > 0 && !loading && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            <span>{executionTime}ms</span>
          </div>
        )}
      </div>

      <Tabs className="flex flex-1 flex-col min-h-0" defaultValue="output">
        <TabsList className="mx-2 mt-1 h-7 w-fit shrink-0" variant="default">
          <TabsTrigger value="output" className="text-xs">
            Output
          </TabsTrigger>
          <TabsTrigger value="console" className="text-xs">
            Console
            {hasConsole && (
              <span className="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-0 text-[10px]">
                {consoleOutput.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tests" className="text-xs">
            Tests
            {hasTests && (
              <span className="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-0 text-[10px]">
                {testCases.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="memory" className="text-xs">
            Memory
          </TabsTrigger>
          <TabsTrigger value="call-stack" className="text-xs">
            Call Stack
          </TabsTrigger>
        </TabsList>

        <TabsContent value="output" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-3">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Running...</span>
                </div>
              ) : error ? (
                <div className="rounded-md bg-destructive/10 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <div>
                      <p className="text-sm font-medium text-destructive">
                        {error.startsWith("Compilation Error") ? "Compilation Error" : error.startsWith("Runtime") ? "Runtime Error" : "Error"}
                      </p>
                      <pre className="mt-1 whitespace-pre-wrap text-sm text-destructive/80 font-mono">
                        {error}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : hasOutput ? (
                <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">
                  {output}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Run your code to see output here.
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="console" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-3">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Running...</span>
                </div>
              ) : hasConsole ? (
                <div className="space-y-1">
                  {consoleOutput.map((line, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 font-mono text-sm"
                    >
                      <span className="select-none text-muted-foreground shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-foreground">{line}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No console output. Use console.log() to see messages here.
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="tests" className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="p-3">
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  <span>Running tests...</span>
                </div>
              ) : hasTests ? (
                <div className="space-y-2">
                  {testCases.map((test, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-start gap-2 rounded-md p-2 text-sm",
                        test.passed
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {test.passed ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                      ) : (
                        <XCircle className="mt-0.5 size-4 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">{test.name}</p>
                        {test.message && (
                          <p className="mt-0.5 text-xs opacity-80">
                            {test.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No test cases defined for this code.
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="memory" className="flex-1 min-h-0">
          <MemoryView
            events={events}
            currentStep={currentStep}
            className="h-full rounded-none border-0"
          />
        </TabsContent>

        <TabsContent value="call-stack" className="flex-1 min-h-0">
          <CallStack
            events={events}
            currentStep={currentStep}
            className="h-full rounded-none border-0"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}