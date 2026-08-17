"use client";

import { useState, useCallback, useRef } from "react";
import { MonacoEditor } from "@/components/editor/monaco-editor";
import { CodeToolbar } from "@/components/editor/code-toolbar";
import { useExecution } from "@/hooks/use-execution";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Laptop,
  FolderTree,
  FileCode,
  Cpu,
  Sparkles,
  ExternalLink,
  BookOpen,
  HelpCircle,
  ChevronRight,
  Info,
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
export type GuideCategory = "frontend_vanilla" | "frontend_react" | "backend_node" | "backend_express" | "backend_prisma";

export function LessonPlaygroundStudio({
  initialCode = "",
  defaultLanguage = "javascript",
  examples,
  lessonTitle,
}: LessonPlaygroundStudioProps) {
  const [activeSubTab, setActiveSubTab] = useState<"editor" | "examples" | "instructions">("editor");
  const [code, setCode] = useState(
    initialCode || examples[0]?.solutionCode || examples[0]?.starterCode || "// Write your code here\n"
  );
  const [language, setLanguage] = useState(defaultLanguage);
  const [fontSize, setFontSize] = useState(14);
  const [consoleTab, setConsoleTab] = useState<"terminal" | "memory" | "timeline">("terminal");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewLayout, setViewLayout] = useState<StudioViewLayout>("split");
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<GuideCategory>("frontend_vanilla");
  const [selectedExampleCode, setSelectedExampleCode] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const { output, error, events, loading, executionTime, executeCode, clearOutput } = useExecution();

  const handleRun = useCallback(async () => {
    setActiveSubTab("editor");
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
    executeCode(exampleCode, language, language === "javascript");
  };

  const handleOpenGuideForExample = (exampleCode: string) => {
    setSelectedExampleCode(exampleCode);
    setActiveSubTab("instructions");
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
              Live Playground
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
            <button
              onClick={() => setActiveSubTab("instructions")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "instructions"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                  : "text-amber-400/90 hover:text-amber-300 hover:bg-slate-900"
              }`}
            >
              <Laptop className="size-3.5" />
              VS Code Local Setup Guide
              <span className="bg-amber-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                Step-by-Step
              </span>
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

        {/* Right Action: Quick Guide Button, Run & Fullscreen */}
        <div className="flex items-center gap-2">
          {activeSubTab === "editor" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveSubTab("instructions")}
              className="text-xs h-8 gap-1.5 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hidden md:flex"
            >
              <Laptop className="size-3.5 text-amber-400" />
              How to Run in VS Code?
            </Button>
          )}

          {activeSubTab === "editor" && (
            <Button
              size="sm"
              onClick={handleRun}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs h-8 gap-1.5 shadow-md"
            >
              <Play className="size-3.5 fill-current" />
              {loading ? "Executing..." : "Run Code (Ctrl+Enter)"}
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
          {/* Quick Helper Banner for Local VS Code Execution */}
          <div className="px-4 py-1.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300 shrink-0">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-[11px] text-slate-400">
                In-browser sandbox runtime active.
              </span>
            </div>
            <button
              onClick={() => setActiveSubTab("instructions")}
              className="text-amber-400 hover:text-amber-300 underline font-medium flex items-center gap-1 cursor-pointer text-[11px]"
            >
              <span>Click here for VS Code (Local Machine) Step-by-Step Run Instructions &rarr;</span>
            </button>
          </div>

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
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 font-mono">
                        {stackFrames.length} frames
                      </span>
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
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 font-mono">
                        {events.length} steps
                      </span>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {executionTime !== undefined && (
                    <span className="text-slate-500 font-mono text-[11px]">
                      {executionTime.toFixed(1)}ms
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearOutput}
                    className="text-xs text-slate-400 hover:text-white h-7 px-2"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewLayout(viewLayout === "output_max" ? "split" : "output_max")}
                    className="text-xs text-slate-400 hover:text-white h-7 px-2 gap-1"
                    title={viewLayout === "output_max" ? "Restore Split View" : "Maximize Output"}
                  >
                    {viewLayout === "output_max" ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
                  </Button>
                </div>
              </div>

              {/* Console Output Body */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 font-mono text-xs">
                {consoleTab === "terminal" && (
                  <div>
                    {error && (
                      <div className="mb-3 p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 whitespace-pre-wrap font-mono">
                        <span className="font-bold block mb-1">Execution Error:</span>
                        {error}
                      </div>
                    )}
                    {output ? (
                      <pre className="whitespace-pre-wrap text-emerald-300 font-mono leading-relaxed">
                        {output}
                      </pre>
                    ) : !error ? (
                      <div className="text-slate-500 italic py-4">
                        Click "Run Code" above to execute and view stdout logs here.
                      </div>
                    ) : null}
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
      ) : activeSubTab === "examples" ? (
        /* Examples Library View - Fully Scrollable */
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6 pb-20">
            {/* Header Callout Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-indigo-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <Laptop className="size-4 text-amber-400" />
                  Want to run these examples locally in VS Code (5s Code)?
                </h2>
                <p className="text-xs text-slate-300">
                  Follow our complete guide to create files, configure <code>package.json</code>, and run in your terminal.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setActiveSubTab("instructions")}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs h-8 gap-1.5"
              >
                Open VS Code Instructions &rarr;
              </Button>
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-bold text-white">Lesson Code Blueprints &amp; Examples</h2>
              <p className="text-xs text-slate-400">
                Click <strong>"Load &amp; Run Live &rarr;"</strong> to execute in the playground or <strong>"VS Code Steps"</strong> to run on your local machine.
              </p>
            </div>

            {examples.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Code2 className="size-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No examples available for this lesson.</p>
              </div>
            ) : (
              examples.map((ex, idx) => (
                <Card key={ex.id || idx} className="bg-slate-900 border-slate-800 text-white shadow-md">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-sm font-bold text-sky-400">
                        Example 0{idx + 1}: {ex.title}
                      </CardTitle>
                      <p className="text-xs text-slate-400 mt-0.5">{ex.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenGuideForExample(ex.solutionCode || ex.starterCode)}
                        className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs h-8 gap-1"
                      >
                        <Laptop className="size-3.5 text-amber-400" />
                        VS Code Steps
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleLoadExample(ex.solutionCode || ex.starterCode)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs h-8 gap-1.5"
                      >
                        <Play className="size-3.5 fill-current" />
                        Load &amp; Run Live &rarr;
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    {ex.solutionCode && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-semibold text-emerald-400">Solution Code:</span>
                          <button
                            onClick={() => handleCopyCode(`sol_${idx}`, ex.solutionCode)}
                            className="hover:text-white flex items-center gap-1 cursor-pointer text-xs"
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
      ) : (
        /* Dedicated VS Code Step-by-Step Execution Guide */
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6 pb-24 text-slate-200">
            {/* Guide Header */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500 text-slate-950 font-bold text-xs px-2 py-0.5">
                  VS Code (5s Code) Local Setup
                </Badge>
                <Badge variant="outline" className="border-sky-500/40 text-sky-300 text-xs">
                  {lessonTitle}
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                How to Run Course Example Code on your Local Computer in VS Code
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Follow these exact steps to create files, configure dependencies, and execute any Frontend or Backend code snippet on your laptop/PC.
              </p>
            </div>

            {/* Category Navigation Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
              <button
                onClick={() => setSelectedGuide("frontend_vanilla")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedGuide === "frontend_vanilla"
                    ? "bg-sky-600 text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileCode className="size-3.5 text-sky-300" />
                Frontend (HTML / CSS / JS)
              </button>
              <button
                onClick={() => setSelectedGuide("frontend_react")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedGuide === "frontend_react"
                    ? "bg-sky-600 text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="size-3.5 text-cyan-300" />
                Frontend (React + Vite)
              </button>
              <button
                onClick={() => setSelectedGuide("backend_node")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedGuide === "backend_node"
                    ? "bg-sky-600 text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Cpu className="size-3.5 text-emerald-300" />
                Backend (Node.js Script)
              </button>
              <button
                onClick={() => setSelectedGuide("backend_express")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedGuide === "backend_express"
                    ? "bg-sky-600 text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FolderTree className="size-3.5 text-amber-300" />
                Backend (Express REST API)
              </button>
              <button
                onClick={() => setSelectedGuide("backend_prisma")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedGuide === "backend_prisma"
                    ? "bg-sky-600 text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="size-3.5 text-purple-300" />
                Database (Prisma ORM)
              </button>
            </div>

            {/* Guide Body Content Based on Selection */}
            {selectedGuide === "frontend_vanilla" && (
              <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 text-white">
                  <CardHeader>
                    <CardTitle className="text-base text-sky-400 flex items-center gap-2">
                      <FileCode className="size-4" />
                      1. Folder Structure Setup
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      Create a project folder on your computer (e.g. <code>frontend-demo</code>) and create these 3 files inside it:
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
                      {`frontend-demo/
├── index.html     <-- Main UI page
├── style.css      <-- Styling rules
└── script.js      <-- Paste your JavaScript course example code here`}
                    </pre>

                    {/* index.html Code Block */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="font-bold text-sky-300">📄 File 1: index.html</span>
                        <button
                          onClick={() =>
                            handleCopyCode(
                              "html_snippet",
                              `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>Frontend Practice</title>\n  <link rel="stylesheet" href="style.css" />\n</head>\n<body>\n  <div id="app">\n    <h1>SkillForge Course Practice</h1>\n    <button id="demo-btn">Click Me</button>\n    <div id="output"></div>\n  </div>\n  <script src="script.js"></script>\n</body>\n</html>`
                            )
                          }
                          className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === "html_snippet" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          {copiedId === "html_snippet" ? "Copied" : "Copy index.html"}
                        </button>
                      </div>
                      <pre className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                        {`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Frontend Practice</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="app">
    <h1>SkillForge Course Practice</h1>
    <button id="demo-btn">Click Me</button>
    <div id="output"></div>
  </div>

  <script src="script.js"></script>
</body>
</html>`}
                      </pre>
                    </div>

                    {/* script.js Code Block */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="font-bold text-emerald-300">📄 File 2: script.js (Course Example Code)</span>
                        <button
                          onClick={() => handleCopyCode("js_snippet", selectedExampleCode || code)}
                          className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === "js_snippet" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          {copiedId === "js_snippet" ? "Copied Current Code" : "Copy Current Code"}
                        </button>
                      </div>
                      <pre className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-48">
                        <code>{selectedExampleCode || code}</code>
                      </pre>
                    </div>

                    {/* Execution Instructions */}
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        🚀 How to Run in VS Code:
                      </h4>
                      <ol className="list-decimal list-inside text-xs space-y-1 text-slate-300">
                        <li>Install <strong>Live Server</strong> extension in VS Code.</li>
                        <li>Right-click on <code>index.html</code> &rarr; select <strong>"Open with Live Server"</strong>.</li>
                        <li>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">F12</kbd> in your browser &rarr; open <strong>Console</strong> tab to view logs.</li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedGuide === "frontend_react" && (
              <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 text-white">
                  <CardHeader>
                    <CardTitle className="text-base text-cyan-400 flex items-center gap-2">
                      <Sparkles className="size-4" />
                      React + Vite Modern Project Setup
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      Run React hooks, components, and interactive state examples locally.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-sky-300 font-mono">Step 1: Open VS Code Terminal &amp; Initialize Vite</span>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-amber-300">
                        {`# 1. Create a new React Vite project
npm create vite@latest my-react-app -- --template react-ts

# 2. Navigate into project folder
cd my-react-app

# 3. Install dependencies
npm install`}
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-emerald-300 font-mono">Step 2: Paste Example in <code>src/App.tsx</code></span>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300 max-h-48 overflow-x-auto">
                        <code>{selectedExampleCode || code}</code>
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-amber-400 font-mono">Step 3: Run Dev Server</span>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-white">
                        npm run dev
                      </pre>
                      <p className="text-xs text-slate-400">
                        Open <code className="text-sky-400">http://localhost:5173</code> in your browser to view your live React app.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedGuide === "backend_node" && (
              <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 text-white">
                  <CardHeader>
                    <CardTitle className="text-base text-emerald-400 flex items-center gap-2">
                      <Cpu className="size-4" />
                      Node.js Script Execution (Closures, Loops, Async/Await)
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      Run standalone algorithms and backend logic scripts directly in VS Code terminal.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="font-bold text-emerald-300">📄 Create file: app.js</span>
                        <button
                          onClick={() => handleCopyCode("node_script", selectedExampleCode || code)}
                          className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === "node_script" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          {copiedId === "node_script" ? "Copied" : "Copy Code"}
                        </button>
                      </div>
                      <pre className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-56">
                        <code>{selectedExampleCode || code}</code>
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-amber-400 font-mono">Terminal Execution Command:</span>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-amber-300">
                        node app.js
                      </pre>
                      <p className="text-xs text-slate-400">
                        Your output and <code>console.log()</code> statements will print directly in your VS Code terminal window.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedGuide === "backend_express" && (
              <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 text-white">
                  <CardHeader>
                    <CardTitle className="text-base text-amber-400 flex items-center gap-2">
                      <FolderTree className="size-4" />
                      Express.js REST API Server Configuration
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      Build full HTTP servers, routes, JSON APIs, and auth endpoints.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-sky-300 font-mono">Step 1: Install Express &amp; Dependencies</span>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-sky-300">
                        {`npm init -y
npm install express dotenv cors
npm install -D nodemon`}
                      </pre>
                    </div>

                    {/* server.js template */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="font-bold text-amber-300">📄 File 1: server.js</span>
                        <button
                          onClick={() =>
                            handleCopyCode(
                              "express_server",
                              `const express = require("express");\nconst cors = require("cors");\nrequire("dotenv").config();\n\nconst app = express();\nconst PORT = process.env.PORT || 5000;\n\napp.use(cors());\napp.use(express.json());\n\n// Health Check\napp.get("/api/health", (req, res) => {\n  res.json({ status: "ok", time: new Date() });\n});\n\n// Course Example Endpoint\napp.post("/api/data", (req, res) => {\n  res.json({ success: true, received: req.body });\n});\n\napp.listen(PORT, () => {\n  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);\n});`
                            )
                          }
                          className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === "express_server" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          {copiedId === "express_server" ? "Copied" : "Copy server.js"}
                        </button>
                      </div>
                      <pre className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-56">
                        {`const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// Example Endpoint
app.post("/api/data", (req, res) => {
  res.json({ success: true, received: req.body });
});

app.listen(PORT, () => {
  console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
});`}
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-emerald-400 font-mono">Step 2: Add Script to <code>package.json</code> &amp; Run</span>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300">
                        {`"scripts": {
  "dev": "nodemon server.js"
}`}
                      </pre>
                      <pre className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-white">
                        npm run dev
                      </pre>
                      <p className="text-xs text-slate-400">
                        Test in your browser or VS Code <strong>Thunder Client</strong> at <code className="text-sky-400">http://localhost:5000/api/health</code>.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedGuide === "backend_prisma" && (
              <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 text-white">
                  <CardHeader>
                    <CardTitle className="text-base text-purple-400 flex items-center gap-2">
                      <Layers className="size-4" />
                      Prisma ORM &amp; Database Integration
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      Connect to SQLite or PostgreSQL, write schemas, and run type-safe database queries.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-purple-300 font-mono">Step 1: Install Prisma &amp; Initialize</span>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-purple-300">
                        {`npm install @prisma/client
npm install -D prisma tsx typescript @types/node
npx prisma init`}
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-sky-300 font-mono">Step 2: Synchronize Database &amp; Generate Client</span>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-sky-300">
                        {`npx prisma db push
npx prisma generate`}
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-emerald-300 font-mono">Step 3: Run Database Queries Script</span>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300">
                        npx tsx src/db-test.ts
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Back to Playground Action Bar */}
            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-300">
                Ready to code? Jump right back into the live in-browser playground.
              </span>
              <Button
                size="sm"
                onClick={() => setActiveSubTab("editor")}
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold gap-1.5"
              >
                <Code2 className="size-3.5" />
                Back to Live Playground &rarr;
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
