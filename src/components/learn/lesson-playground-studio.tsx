"use client";

import { useState, useCallback, useRef } from "react";
import { MonacoEditor } from "@/components/editor/monaco-editor";
import { CodeToolbar } from "@/components/editor/code-toolbar";
import { useExecution } from "@/hooks/use-execution";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CallStack } from "@/components/visualization/call-stack";
import { MemoryView } from "@/components/visualization/memory-view";
import { ExecutionTimeline } from "@/components/visualization/execution-timeline";
import {
  Play,
  Terminal,
  Layers,
  Activity,
  Code2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Columns,
  SquareCode,
  LayoutTemplate,
  Trash2,
} from "lucide-react";

interface ExampleItem {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  solutionCode: string;
}

interface LessonPlaygroundStudioProps {
  initialCode?: string;
  defaultLanguage?: string;
  examples: ExampleItem[];
  lessonTitle: string;
}

export type StudioViewLayout = "split" | "editor_max" | "output_max";

export function LessonPlaygroundStudio({
  initialCode = "",
  defaultLanguage = "javascript",
  examples,
  lessonTitle,
}: LessonPlaygroundStudioProps) {
  const [activeSubTab, setActiveSubTab] = useState<"editor" | "examples">("editor");
  const [code, setCode] = useState(
    initialCode || examples[0]?.solutionCode || examples[0]?.starterCode || "// Write your code here\n"
  );
  const [language, setLanguage] = useState(defaultLanguage);
  const [fontSize, setFontSize] = useState(14);
  const [consoleTab, setConsoleTab] = useState<"terminal" | "memory" | "timeline">("terminal");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewLayout, setViewLayout] = useState<StudioViewLayout>("split");
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const { output, error, events, loading, executionTime, executeCode, clearOutput } = useExecution();

  const handleRun = useCallback(async () => {
    setActiveSubTab("editor");
    // If output is minimized, set back to split or output_max so student sees results
    if (viewLayout === "editor_max") {
      setViewLayout("split");
    }
    await executeCode(code, language, language === "javascript");
  }, [code, language, executeCode, viewLayout]);

  const handleReset = useCallback(() => {
    setCode(initialCode || examples[0]?.starterCode || "// Reset code\n");
    clearOutput();
  }, [initialCode, examples, clearOutput]);

  const handleFormat = useCallback(() => {
    try {
      const formatted = JSON.stringify({ _: code }, null, 2);
      const lines = formatted.split("\n");
      lines.shift();
      lines.pop();
      const trimmed = lines.map((l) => l.slice(2)).join("\n");
      setCode(trimmed);
    } catch {
      // ignore
    }
  }, [code]);

  const handleLoadExample = (exampleCode: string) => {
    setCode(exampleCode);
    setActiveSubTab("editor");
    setViewLayout("split");
    // Auto-run loaded example
    executeCode(exampleCode, language, language === "javascript");
  };

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleBrowserFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsBrowserFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsBrowserFullscreen(false);
    }
  };

  // Construct stack frames and memory events from execution events
  const stackFrames = events
    .filter((e) => e.type === "call" || e.type === "return" || e.callStack)
    .map((e, idx) => ({
      id: `frame_${idx}`,
      name: e.callStack?.[0] || e.message || "main",
      args: [],
      returnValue: e.value !== undefined ? String(e.value) : undefined,
      isExecuting: idx === 0,
      depth: idx,
    }));

  const memoryEvents = events
    .filter((e) => e.type === "variable" || Boolean(e.variable))
    .map((e, idx) => ({
      step: idx + 1,
      type: "variable" as const,
      variable: e.variable || "var",
      value: e.value !== undefined ? String(e.value) : "undefined",
    }));

  return (
    <div
      ref={containerRef}
      className={`flex h-full flex-col bg-slate-950 text-white overflow-hidden ${
        isBrowserFullscreen ? "fixed inset-0 z-50 p-4" : ""
      }`}
    >
      {/* Top Studio Nav Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Main Mode Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab("editor")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "editor"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Code2 className="size-3.5" />
              Live Code Playground
            </button>
            <button
              onClick={() => setActiveSubTab("examples")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "examples"
                  ? "bg-sky-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="size-3.5" />
              Lesson Examples ({examples.length})
            </button>
          </div>

          {/* Layout Presets (Split / Editor Full / Output Full) */}
          {activeSubTab === "editor" && (
            <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewLayout("split")}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                  viewLayout === "split"
                    ? "bg-slate-800 text-sky-400 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Split View (Editor & Output)"
              >
                <Columns className="size-3" />
                Split
              </button>
              <button
                onClick={() => setViewLayout("editor_max")}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                  viewLayout === "editor_max"
                    ? "bg-slate-800 text-sky-400 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Maximize Code Editor (100% Height)"
              >
                <SquareCode className="size-3" />
                Editor Max
              </button>
              <button
                onClick={() => setViewLayout("output_max")}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                  viewLayout === "output_max"
                    ? "bg-slate-800 text-sky-400 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Maximize Output & Call Stack (100% Height)"
              >
                <Terminal className="size-3" />
                Output Max
              </button>
            </div>
          )}
        </div>

        {/* Right Action: Run & Fullscreen */}
        <div className="flex items-center gap-2">
          {activeSubTab === "editor" && (
            <Button
              size="sm"
              onClick={handleRun}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs h-8 gap-1.5 px-3.5"
            >
              <Play className="size-3.5 fill-current" />
              {loading ? "Running..." : "Run Code (Ctrl+Enter)"}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleBrowserFullscreen}
            className="h-8 w-8 text-slate-400 hover:text-white"
            title={isBrowserFullscreen ? "Exit Fullscreen" : "Fullscreen Playground"}
          >
            {isBrowserFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Main Studio Body */}
      {activeSubTab === "editor" ? (
        <div className="flex flex-1 flex-col min-h-0">
          {/* Editor Area */}
          {viewLayout !== "output_max" && (
            <div
              className={`flex flex-col border-b border-slate-800 transition-all ${
                viewLayout === "editor_max" ? "flex-1 min-h-0" : "flex-1 min-h-[220px]"
              }`}
            >
              <div className="flex items-center justify-between bg-slate-900 border-b border-slate-800 px-3">
                <CodeToolbar
                  onRun={handleRun}
                  onReset={handleReset}
                  onFormat={handleFormat}
                  language={language}
                  onLanguageChange={setLanguage}
                  fontSize={fontSize}
                  onFontSizeChange={setFontSize}
                  running={loading}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewLayout(viewLayout === "editor_max" ? "split" : "editor_max")}
                  className="text-xs text-slate-400 hover:text-white h-7 px-2 gap-1"
                  title={viewLayout === "editor_max" ? "Restore Split View" : "Maximize Editor"}
                >
                  {viewLayout === "editor_max" ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
                  <span className="hidden md:inline">{viewLayout === "editor_max" ? "Restore" : "Maximize"}</span>
                </Button>
              </div>

              <div className="flex-1 min-h-0">
                <MonacoEditor
                  value={code}
                  onChange={(val) => setCode(val || "")}
                  language={language}
                />
              </div>
            </div>
          )}

          {/* Multi-Tab Execution & Memory Results Console */}
          {viewLayout !== "editor_max" && (
            <div
              className={`flex flex-col bg-slate-950 transition-all ${
                viewLayout === "output_max" ? "flex-1 min-h-0" : "h-[280px] shrink-0"
              }`}
            >
              {/* Output Console Toolbar Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/95 text-xs shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setConsoleTab("terminal")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                      consoleTab === "terminal"
                        ? "bg-slate-800 text-white font-bold shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Terminal className="size-3.5 text-emerald-400" />
                    Terminal Output
                    {output && <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  </button>
                  <button
                    onClick={() => setConsoleTab("memory")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                      consoleTab === "memory"
                        ? "bg-slate-800 text-white font-bold shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Layers className="size-3.5 text-purple-400" />
                    Call Stack &amp; Memory
                    {stackFrames.length > 0 && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-purple-500/30 text-purple-300">
                        {stackFrames.length} Frames
                      </Badge>
                    )}
                  </button>
                  <button
                    onClick={() => setConsoleTab("timeline")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                      consoleTab === "timeline"
                        ? "bg-slate-800 text-white font-bold shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Activity className="size-3.5 text-amber-400" />
                    Execution Timeline
                    {events.length > 0 && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-300">
                        {events.length} Events
                      </Badge>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {executionTime !== null && (
                    <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                      Executed in <strong className="text-emerald-400">{executionTime}ms</strong>
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearOutput}
                    className="h-6 text-[10px] text-slate-400 hover:text-white gap-1 px-1.5"
                    title="Clear console output"
                  >
                    <Trash2 className="size-3" />
                    Clear
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewLayout(viewLayout === "output_max" ? "split" : "output_max")}
                    className="h-6 text-[10px] text-sky-400 hover:text-sky-300 gap-1 px-1.5"
                    title={viewLayout === "output_max" ? "Restore Split View" : "Maximize Output Window"}
                  >
                    {viewLayout === "output_max" ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
                    {viewLayout === "output_max" ? "Restore" : "Maximize Output"}
                  </Button>
                </div>
              </div>

              {/* Output Content Area */}
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
                {consoleTab === "terminal" && (
                  <div>
                    {error ? (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                        <strong className="block mb-1 font-bold">Execution Error:</strong>
                        <pre className="whitespace-pre-wrap">{error}</pre>
                      </div>
                    ) : output ? (
                      <pre className="whitespace-pre-wrap text-emerald-300 leading-relaxed font-mono">{output}</pre>
                    ) : (
                      <div className="text-slate-500 italic py-6 text-center">
                        Click <strong>"Run Code"</strong> to execute and view stdout logs &amp; memory allocations...
                      </div>
                    )}
                  </div>
                )}

                {consoleTab === "memory" && (
                  <div className="space-y-4">
                    {stackFrames.length === 0 && memoryEvents.length === 0 ? (
                      <div className="text-slate-500 italic py-6 text-center">
                        No active stack frames or variables recorded. Run your code to visualize real-time call stack frames and heap memory.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-sans">
                            Active Call Stack Frames
                          </span>
                          <CallStack frames={stackFrames} />
                        </div>
                        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-sans">
                            Heap Memory Variables
                          </span>
                          <MemoryView events={memoryEvents} currentStep={memoryEvents.length} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {consoleTab === "timeline" && (
                  <div>
                    {events.length === 0 ? (
                      <div className="text-slate-500 italic py-6 text-center">
                        Run code to record step-by-step execution timeline events.
                      </div>
                    ) : (
                      <ExecutionTimeline events={events} />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Examples Library View - Fully Scrollable */
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6 pb-20">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">Lesson Code Blueprints &amp; Examples</h2>
              <p className="text-xs text-slate-400">
                Click <strong>"Load &amp; Run Live &rarr;"</strong> on any example below to immediately execute it in the code editor.
              </p>
            </div>

            {examples.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Code2 className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No examples available for this lesson.</p>
              </div>
            ) : (
              examples.map((ex, idx) => (
                <Card key={ex.id || idx} className="bg-slate-900 border-slate-800 text-white">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-sky-400">
                        Example 0{idx + 1}: {ex.title}
                      </CardTitle>
                      <p className="text-xs text-slate-400 mt-0.5">{ex.description}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleLoadExample(ex.solutionCode || ex.starterCode)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs h-8 gap-1.5"
                    >
                      <Play className="size-3.5 fill-current" />
                      Load &amp; Run Live &rarr;
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {ex.solutionCode && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-semibold text-emerald-400">Solution Code:</span>
                          <button
                            onClick={() => handleCopyCode(`sol_${idx}`, ex.solutionCode)}
                            className="hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === `sol_${idx}` ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                            {copiedId === `sol_${idx}` ? "Copied" : "Copy Code"}
                          </button>
                        </div>
                        <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono overflow-x-auto text-emerald-300">
                          <code>{ex.solutionCode}</code>
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
