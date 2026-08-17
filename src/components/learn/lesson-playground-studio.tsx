"use client";

import { useState, useCallback, useRef, useMemo } from "react";
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
  Globe,
  RefreshCw,
  FileText,
  Palette,
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
export type GuideCategory = "frontend_vanilla" | "frontend_react" | "backend_node" | "backend_express" | "fullstack_integration";
export type ActiveEditorFile = "app" | "html" | "css";

export function LessonPlaygroundStudio({
  initialCode = "",
  defaultLanguage = "javascript",
  examples,
  lessonTitle,
}: LessonPlaygroundStudioProps) {
  const [activeSubTab, setActiveSubTab] = useState<"editor" | "examples" | "instructions">("editor");
  const [activeFile, setActiveFile] = useState<ActiveEditorFile>("app");

  // Multi-File State: JSX/JS, HTML, and CSS
  const [appCode, setAppCode] = useState(
    initialCode || examples[0]?.solutionCode || examples[0]?.starterCode || "// Write your React component or JavaScript logic here\n"
  );
  const [htmlCode, setHtmlCode] = useState('<div id="root"></div>');
  const [cssCode, setCssCode] = useState(
    "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 16px; background: #0f172a; color: #f8fafc; }\n.card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; max-width: 480px; }\nbutton { background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }\nbutton:hover { background: #0369a1; }"
  );

  const [language, setLanguage] = useState(defaultLanguage);
  const [fontSize, setFontSize] = useState(14);
  const [consoleTab, setConsoleTab] = useState<"terminal" | "preview" | "memory" | "timeline">("terminal");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewLayout, setViewLayout] = useState<StudioViewLayout>("split");
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<GuideCategory>("frontend_react");
  const [selectedExampleCode, setSelectedExampleCode] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const { output, error, events, loading, executionTime, executeCode, clearOutput } = useExecution();

  // Active code depending on selected tab
  const currentEditorCode = activeFile === "app" ? appCode : activeFile === "html" ? htmlCode : cssCode;
  const currentEditorLanguage = activeFile === "app" ? "javascript" : activeFile === "html" ? "html" : "css";

  const handleEditorChange = (newVal: string) => {
    if (activeFile === "app") setAppCode(newVal);
    else if (activeFile === "html") setHtmlCode(newVal);
    else setCssCode(newVal);
  };

  // Build live srcdoc for multi-file iframe preview (React 18 + Babel + CSS + HTML)
  const liveSrcDoc = useMemo(() => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
  <style>
    ${cssCode}
  </style>
</head>
<body>
  ${htmlCode}
  <script type="text/plain" id="__rawScript">${appCode}</script>
  <script>
    (function(){
      try {
        var raw = document.getElementById('__rawScript').textContent;
        var transpiled = Babel.transform(raw, { presets: ['react', 'env'] }).code;
        var s = document.createElement('script');
        s.textContent = transpiled;
        document.body.appendChild(s);
      } catch(err) {
        var box = document.createElement('div');
        box.style = "background:#450a0a;color:#fca5a5;border:1px solid #ef4444;padding:12px;border-radius:8px;font-family:monospace;font-size:12px;margin:10px;";
        box.innerHTML = "<strong>❌ Render Error:</strong> " + err.message;
        document.body.appendChild(box);
      }
    })();
  </script>
</body>
</html>`;
  }, [appCode, htmlCode, cssCode]);

  const handleRun = useCallback(async () => {
    setActiveSubTab("editor");
    if (viewLayout === "editor_max") {
      setViewLayout("split");
    }
    // Execute JS sandbox trace
    await executeCode(appCode, "javascript", true);
  }, [appCode, executeCode, viewLayout]);

  const handleReset = useCallback(() => {
    setAppCode(initialCode || examples[0]?.starterCode || "// Reset code\n");
    setHtmlCode('<div id="root"></div>');
    setCssCode("body { font-family: sans-serif; padding: 16px; background: #0f172a; color: #f8fafc; }");
    clearOutput();
  }, [initialCode, examples, clearOutput]);

  const handleFormat = useCallback(() => {
    try {
      const formatted = JSON.stringify({ _: currentEditorCode }, null, 2);
      const lines = formatted.split("\n");
      lines.shift();
      lines.pop();
      const trimmed = lines.map((l) => l.slice(2)).join("\n");
      handleEditorChange(trimmed);
    } catch {
      // ignore
    }
  }, [currentEditorCode]);

  const handleLoadExample = (exampleCode: string) => {
    setAppCode(exampleCode);
    setActiveFile("app");
    setActiveSubTab("editor");
    setViewLayout("split");
    executeCode(exampleCode, "javascript", true);
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
                  ? "bg-sky-600 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Code2 className="size-3.5" />
              Multi-File Playground
            </button>
            <button
              onClick={() => setActiveSubTab("examples")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubTab === "examples"
                  ? "bg-sky-600 text-white shadow-xs font-bold"
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
              VS Code Multi-File Setup Guide
              <span className="bg-amber-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                JSX + HTML + CSS
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

        {/* Right Action: Run & Fullscreen */}
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
              {loading ? "Executing..." : "Run & Preview (Ctrl+Enter)"}
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
          {/* File Switcher Tabs Bar (App.jsx, index.html, style.css) */}
          <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase font-mono mr-1">
                Project Files:
              </span>
              <button
                onClick={() => setActiveFile("app")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  activeFile === "app"
                    ? "bg-sky-600 text-white font-bold shadow-xs"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="size-3.5 text-sky-300" />
                App.jsx (React)
              </button>
              <button
                onClick={() => setActiveFile("html")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  activeFile === "html"
                    ? "bg-amber-600 text-white font-bold shadow-xs"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="size-3.5 text-amber-300" />
                index.html
              </button>
              <button
                onClick={() => setActiveFile("css")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  activeFile === "css"
                    ? "bg-indigo-600 text-white font-bold shadow-xs"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Palette className="size-3.5 text-indigo-300" />
                style.css
              </button>
            </div>

            <button
              onClick={() => setActiveSubTab("instructions")}
              className="text-amber-400 hover:text-amber-300 underline font-medium flex items-center gap-1 cursor-pointer text-xs"
            >
              <span>See VS Code Multi-File Tree &rarr;</span>
            </button>
          </div>

          {/* Editor Area */}
          {viewLayout !== "output_max" && (
            <div
              className={`flex flex-col border-b border-slate-800 transition-all ${
                viewLayout === "editor_max" ? "flex-1 min-h-0" : "flex-1 min-h-[220px]"
              }`}
            >
              <div className="flex items-center justify-between bg-slate-900/90 border-b border-slate-800 px-3 py-1">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="font-bold text-sky-400">
                    Editing: {activeFile === "app" ? "App.jsx" : activeFile === "html" ? "index.html" : "style.css"}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span>{currentEditorLanguage.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFormat}
                    className="text-xs text-slate-400 hover:text-white h-7 px-2"
                  >
                    Format Code
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewLayout(viewLayout === "editor_max" ? "split" : "editor_max")}
                    className="text-xs text-slate-400 hover:text-white h-7 px-2 gap-1"
                    title={viewLayout === "editor_max" ? "Restore Split View" : "Maximize Editor"}
                  >
                    {viewLayout === "editor_max" ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
                  </Button>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <MonacoEditor
                  value={currentEditorCode}
                  onChange={(val) => handleEditorChange(val || "")}
                  language={currentEditorLanguage}
                />
              </div>
            </div>
          )}

          {/* Multi-Tab Execution, Live Browser Preview & Memory Results Console */}
          {viewLayout !== "editor_max" && (
            <div
              className={`flex flex-col bg-slate-950 transition-all ${
                viewLayout === "output_max" ? "flex-1 min-h-0" : "h-[300px] shrink-0"
              }`}
            >
              {/* Output Console Toolbar Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/95 text-xs shrink-0">
                <div className="flex items-center gap-1.5 flex-wrap">
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
                    onClick={() => setConsoleTab("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                      consoleTab === "preview"
                        ? "bg-sky-600 text-white font-bold shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Globe className="size-3.5 text-sky-300" />
                    Live Browser UI Preview
                    <span className="text-[9px] px-1 py-0.2 rounded bg-sky-400/30 text-sky-200 uppercase font-mono">
                      Live
                    </span>
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
              <div className="flex-1 min-h-0 overflow-y-auto">
                {consoleTab === "terminal" && (
                  <div className="p-4 font-mono text-xs">
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
                        Click "Run &amp; Preview" above to execute and view stdout logs here.
                      </div>
                    ) : null}
                  </div>
                )}

                {consoleTab === "preview" && (
                  <div className="h-full w-full bg-slate-900 relative">
                    <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-[11px] text-sky-400">
                        http://localhost:5173/ (Interactive Render)
                      </span>
                      <span className="text-[10px] text-slate-500">
                        React 18 + Babel Sandbox
                      </span>
                    </div>
                    <iframe
                      ref={previewIframeRef}
                      title="Live Multi-File Preview"
                      srcDoc={liveSrcDoc}
                      sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
                      className="w-full h-[calc(100%-29px)] border-0 bg-slate-950"
                    />
                  </div>
                )}

                {consoleTab === "memory" && (
                  <div className="p-4 space-y-4 text-xs font-mono">
                    {stackFrames.length === 0 && memoryEvents.length === 0 ? (
                      <div className="text-slate-500 italic py-6 text-center font-sans">
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
                  <div className="p-4 text-xs font-mono">
                    {events.length === 0 ? (
                      <div className="text-slate-500 italic py-6 text-center font-sans">
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
                  Want to run these Multi-File (JSX + HTML + CSS) examples in VS Code?
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
                Open VS Code Multi-File Guide &rarr;
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
        /* Dedicated VS Code Step-by-Step Execution Guide (Multi-File Focused) */
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6 pb-24 text-slate-200">
            {/* Guide Header */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500 text-slate-950 font-bold text-xs px-2 py-0.5">
                  Multi-File VS Code Guide (JSX + HTML + CSS)
                </Badge>
                <Badge variant="outline" className="border-sky-500/40 text-sky-300 text-xs">
                  {lessonTitle}
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                How to Run Multi-File React &amp; Node.js Code in VS Code
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Har topic ke andar 3 alag files (JSX, HTML aur CSS) hoti hain. Niche diye gaye structure se samjhein ki files kaise connect hoti hain aur unhe local machine par kaise execute karein.
              </p>
            </div>

            {/* Category Navigation Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto">
              <button
                onClick={() => setSelectedGuide("frontend_react")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedGuide === "frontend_react"
                    ? "bg-sky-600 text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="size-3.5 text-cyan-300" />
                ⚛️ React 18 (App.jsx + HTML + CSS)
              </button>
              <button
                onClick={() => setSelectedGuide("frontend_vanilla")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedGuide === "frontend_vanilla"
                    ? "bg-sky-600 text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FileCode className="size-3.5 text-sky-300" />
                ⚡ Vanilla JS (script.js + HTML + CSS)
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
                🟢 Node.js &amp; Express API
              </button>
              <button
                onClick={() => setSelectedGuide("fullstack_integration")}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedGuide === "fullstack_integration"
                    ? "bg-sky-600 text-white shadow-md font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="size-3.5 text-purple-300" />
                🚀 Full-Stack (React UI + Express API)
              </button>
            </div>

            {/* Guide Body Content */}
            {selectedGuide === "frontend_react" && (
              <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 text-white">
                  <CardHeader>
                    <CardTitle className="text-base text-cyan-400 flex items-center gap-2">
                      <Sparkles className="size-4" />
                      1. Multi-File React Project Folder Structure
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      React me har topic ke liye 3 files kaise aapas me connect hoti hain:
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <pre className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300">
                      {`my-react-app/
├── index.html       <-- Root container (<div id="root"></div>)
├── src/
│   ├── main.jsx     <-- Entry point: ReactDOM.createRoot(root).render(<App />)
│   ├── App.jsx      <-- Main component & JSX logic (Course example code)
│   ├── App.css      <-- Component specific styling (Course CSS code)
│   └── index.css    <-- Global base styles
├── package.json     <-- Dependencies (React, ReactDOM, Vite)
└── vite.config.js   <-- Fast Bundler configuration`}
                    </pre>

                    {/* Step-by-Step Code Snippets */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="font-bold text-sky-300">📄 File 1: src/App.jsx (Paste Course JSX Code)</span>
                        <button
                          onClick={() => handleCopyCode("app_jsx_snippet", selectedExampleCode || appCode)}
                          className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === "app_jsx_snippet" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          {copiedId === "app_jsx_snippet" ? "Copied JSX" : "Copy App.jsx"}
                        </button>
                      </div>
                      <pre className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-56">
                        <code>{selectedExampleCode || appCode}</code>
                      </pre>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="font-bold text-indigo-300">📄 File 2: src/App.css (Paste Course CSS Code)</span>
                        <button
                          onClick={() => handleCopyCode("app_css_snippet", cssCode)}
                          className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === "app_css_snippet" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          {copiedId === "app_css_snippet" ? "Copied CSS" : "Copy App.css"}
                        </button>
                      </div>
                      <pre className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-40">
                        <code>{cssCode}</code>
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-amber-400 font-mono">🚀 Terminal Commands to Run in VS Code:</span>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-amber-300">
                        {`# 1. Terminal open karein (Ctrl + ~) aur Vite project banayein:
npm create vite@latest my-react-app -- --template react

# 2. Folder me enter karein aur packages install karein:
cd my-react-app
npm install

# 3. Dev server start karein:
npm run dev`}
                      </pre>
                      <p className="text-xs text-slate-400">
                        Browser me <code className="text-sky-400">http://localhost:5173</code> open karein. JSX me jo bhi change karenge woh bina page reload hue instant update hoga (Hot Module Replacement)!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedGuide === "frontend_vanilla" && (
              <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 text-white">
                  <CardHeader>
                    <CardTitle className="text-base text-sky-400 flex items-center gap-2">
                      <FileCode className="size-4" />
                      Vanilla JavaScript (index.html + style.css + script.js)
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      Ek folder banayein aur usme ye 3 files save karein:
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
                      {`my-project/
├── index.html     <-- <link rel="stylesheet" href="style.css"> & <script src="script.js"></script>
├── style.css      <-- Styling rules
└── script.js      <-- JavaScript logic`}
                    </pre>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        🚀 Run Karne Ka Tarika:
                      </h4>
                      <ol className="list-decimal list-inside text-xs space-y-1 text-slate-300">
                        <li>VS Code me <strong>Live Server</strong> extension install karein.</li>
                        <li><code>index.html</code> par Right Click karein &rarr; <strong>"Open with Live Server"</strong> select karein.</li>
                        <li>Browser me <kbd className="px-1 py-0.5 bg-slate-800 rounded">F12</kbd> dabakar <strong>Console</strong> tab me execution logs dekhein.</li>
                      </ol>
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
                      Node.js &amp; Express REST API Server
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      Backend API routes, controllers, and JSON request/response pipelines.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-sky-300 font-mono">Step 1: Express Server Initialize Karein</span>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-sky-300">
                        {`npm init -y
npm install express dotenv cors
npm install -D nodemon`}
                      </pre>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="font-bold text-amber-300">📄 File: server.js</span>
                        <button
                          onClick={() =>
                            handleCopyCode(
                              "server_js_code",
                              `const express = require("express");\nconst cors = require("cors");\nrequire("dotenv").config();\n\nconst app = express();\nconst PORT = process.env.PORT || 5000;\n\napp.use(cors());\napp.use(express.json());\n\nlet notes = [\n  { id: 1, title: "Learn React & Node", done: false },\n  { id: 2, title: "Build Fullstack Project", done: true }\n];\n\napp.get("/api/notes", (req, res) => {\n  res.json(notes);\n});\n\napp.post("/api/notes", (req, res) => {\n  const newNote = { id: Date.now(), ...req.body };\n  notes.push(newNote);\n  res.status(201).json(newNote);\n});\n\napp.listen(PORT, () => {\n  console.log(\`🚀 Server active on http://localhost:\${PORT}\`);\n});`
                            )
                          }
                          className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === "server_js_code" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          {copiedId === "server_js_code" ? "Copied" : "Copy server.js"}
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

let notes = [
  { id: 1, title: "Learn React & Node", done: false },
  { id: 2, title: "Build Fullstack Project", done: true }
];

app.get("/api/notes", (req, res) => {
  res.json(notes);
});

app.post("/api/notes", (req, res) => {
  const newNote = { id: Date.now(), ...req.body };
  notes.push(newNote);
  res.status(201).json(newNote);
});

app.listen(PORT, () => {
  console.log(\`🚀 Server active on http://localhost:\${PORT}\`);
});`}
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-emerald-400 font-mono">Step 2: Server Run Karein</span>
                      <pre className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-white">
                        node server.js
                      </pre>
                      <p className="text-xs text-slate-400">
                        VS Code <strong>Thunder Client</strong> me <code>GET http://localhost:5000/api/notes</code> send karke response test karein!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {selectedGuide === "fullstack_integration" && (
              <div className="space-y-6">
                <Card className="bg-slate-900 border-slate-800 text-white">
                  <CardHeader>
                    <CardTitle className="text-base text-purple-400 flex items-center gap-2">
                      <Layers className="size-4" />
                      Full-Stack Architecture (React Frontend + Express Backend)
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-xs">
                      React Frontend se Express Backend API ko fetch() ke zariye connect karna:
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <pre className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-purple-300">
                      {`my-fullstack-app/
├── backend/          <-- Express Server (Port 5000)
│   ├── server.js
│   └── package.json
└── frontend/         <-- Vite React Client (Port 5173)
    ├── src/
    │   ├── App.jsx   <-- fetch("http://localhost:5000/api/notes")
    │   └── App.css
    └── package.json`}
                    </pre>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-sky-300 font-mono">React Frontend Component (Connecting to Backend):</span>
                      <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-48">
                        {`import { useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    // Backend Express API se data fetch karna
    fetch("http://localhost:5000/api/notes")
      .then((res) => res.json())
      .then((data) => setNotes(data))
      .catch((err) => console.error("API Error:", err));
  }, []);

  return (
    <div className="app-box">
      <h1>🚀 Fullstack React + Node Notes</h1>
      <ul>
        {notes.map((n) => (
          <li key={n.id}>{n.title} - {n.done ? "✅" : "⏳"}</li>
        ))}
      </ul>
    </div>
  );
}`}
                      </pre>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-amber-400 font-mono">Crucial Step: Enable CORS in Backend</span>
                      <p className="text-xs text-slate-300">
                        Kyunki React <code>http://localhost:5173</code> par chalta hai aur Express <code>http://localhost:5000</code> par, isliye Express me <code>app.use(cors())</code> lagana mandatory hai taaki browser cross-origin request block na kare.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Back to Playground Action Bar */}
            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-300">
                Ready to code? Jump right back into the multi-file live playground.
              </span>
              <Button
                size="sm"
                onClick={() => setActiveSubTab("editor")}
                className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold gap-1.5"
              >
                <Code2 className="size-3.5" />
                Back to Multi-File Playground &rarr;
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
