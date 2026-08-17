"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronLeft,
  Info,
  Globe,
  RefreshCw,
  FileText,
  Palette,
  Workflow,
  MessageCircle,
  Zap,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  X,
  Smile,
  Send,
  Loader2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Radio,
  Sliders,
  ArrowDown,
  CornerDownRight,
  Server,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MonacoEditor } from "@/components/editor/monaco-editor";
import { useExecution } from "@/hooks/use-execution";
import { speakText, stopSpeaking } from "@/lib/speech";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import { CallStack } from "@/components/visualization/call-stack";
import { MemoryView } from "@/components/visualization/memory-view";

export type ExplanationLanguage = "en" | "hi";
export type FloatingPanelType = "flow" | "vscode_guide" | "ai_tutor" | "memory";
export type ActiveEditorFile = "app" | "html" | "css" | "server";

interface ConceptItem {
  id: string;
  title: string;
  description: string;
}

interface ExampleItem {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  solutionCode: string;
}

interface UnifiedInteractiveClassroomProps {
  lessonTitle: string;
  topicTitle: string;
  courseTitle: string;
  moduleTitle: string;
  lessonContent: string;
  lessonExplanation?: string;
  concepts: ConceptItem[];
  examples: ExampleItem[];
  onCompleteLesson?: () => void;
  isCompleted?: boolean;
  onNextLesson?: () => void;
  onPrevLesson?: () => void;
  hasNextLesson?: boolean;
  hasPrevLesson?: boolean;
}

export function UnifiedInteractiveClassroom({
  lessonTitle,
  topicTitle,
  courseTitle,
  moduleTitle,
  lessonContent,
  lessonExplanation,
  concepts,
  examples,
  onCompleteLesson,
  isCompleted = false,
  onNextLesson,
  onPrevLesson,
  hasNextLesson = false,
  hasPrevLesson = false,
}: UnifiedInteractiveClassroomProps) {
  // English is default language; persisted across all courses
  const [language, setLanguage] = useState<ExplanationLanguage>("en");
  // Floating Right Column Tool (Default: "flow", always stable)
  const [activeRightPanel, setActiveRightPanel] = useState<FloatingPanelType | null>("flow");
  const [activeFlowStep, setActiveFlowStep] = useState<number>(0);
  const [isFlowAutoPlaying, setIsFlowAutoPlaying] = useState<boolean>(false);
  const [isExecutionSyncing, setIsExecutionSyncing] = useState<boolean>(false);

  // Multi-File Code Editor State
  const [activeFile, setActiveFile] = useState<ActiveEditorFile>("app");
  const [appCode, setAppCode] = useState<string>(
    examples[0]?.solutionCode || examples[0]?.starterCode || "// Write code here\n"
  );
  const [htmlCode, setHtmlCode] = useState<string>('<div id="root"></div>');
  const [cssCode, setCssCode] = useState<string>(
    "body { font-family: sans-serif; padding: 16px; background: #0f172a; color: #f8fafc; }\n.card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; max-width: 440px; }\nbutton { background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; }\nbutton:hover { background: #0369a1; }"
  );
  const [serverCode, setServerCode] = useState<string>(
    "const express = require('express');\nconst cors = require('cors');\nrequire('dotenv').config();\n\nconst app = express();\nconst PORT = process.env.PORT || 5000;\n\napp.use(cors());\napp.use(express.json());\n\nlet items = [\n  { id: 1, name: 'Sample Item 1' },\n  { id: 2, name: 'Sample Item 2' }\n];\n\napp.get('/api/items', (req, res) => {\n  res.json(items);\n});\n\napp.listen(PORT, () => {\n  console.log(`🚀 Server active on http://localhost:${PORT}`);\n});"
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [outputTab, setOutputTab] = useState<"terminal" | "preview">("terminal");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeVsCodeTab, setActiveVsCodeTab] = useState<"react" | "node" | "fullstack">("react");

  // Microphone Speech Input State
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>("");
  const recognitionRef = useRef<any>(null);

  // AI Tutor Chat State inside Right Drawer
  const [aiChatMessages, setAiChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content:
        language === "hi"
          ? `नमस्ते! मैं आपका AI ट्यूटर हूँ। ${topicTitle} को लेकर कोई भी सवाल या डाउट हो तो माइक से बोलें या लिखकर पूछें!`
          : `Hello! I am your AI Tutor. Ask me any doubt about ${topicTitle} or speak via Mic!`,
    },
  ]);
  const [aiInputMessage, setAiInputMessage] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const { output, error, events, loading, executionTime, executeCode, clearOutput } = useExecution();

  // Sync language with persistent localStorage across all courses
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("preferred_explanation_language") as ExplanationLanguage;
      if (savedLang === "en" || savedLang === "hi") {
        setLanguage(savedLang);
      }
    }

    const handleLangChange = (e: any) => {
      const newLang = e.detail || (typeof window !== "undefined" ? localStorage.getItem("preferred_explanation_language") : null);
      if (newLang === "en" || newLang === "hi") {
        setLanguage(newLang as ExplanationLanguage);
      }
    };

    window.addEventListener("languagechange", handleLangChange);
    return () => window.removeEventListener("languagechange", handleLangChange);
  }, []);

  const handleSetLanguage = (newLang: ExplanationLanguage) => {
    setLanguage(newLang);
    stopSpeaking();
    setIsSpeaking(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_explanation_language", newLang);
      window.dispatchEvent(new CustomEvent("languagechange", { detail: newLang }));
    }
  };

  // Switch examples when lesson changes
  useEffect(() => {
    if (examples[0]?.solutionCode || examples[0]?.starterCode) {
      setAppCode(examples[0]?.solutionCode || examples[0]?.starterCode);
    }
    clearOutput();
  }, [lessonTitle, examples, clearOutput]);

  // Active code depending on selected file tab
  const currentEditorCode =
    activeFile === "app" ? appCode : activeFile === "html" ? htmlCode : activeFile === "css" ? cssCode : serverCode;
  const currentEditorLanguage =
    activeFile === "app" ? "javascript" : activeFile === "html" ? "html" : activeFile === "css" ? "css" : "javascript";

  const handleEditorChange = (newVal: string) => {
    if (activeFile === "app") setAppCode(newVal);
    else if (activeFile === "html") setHtmlCode(newVal);
    else if (activeFile === "css") setCssCode(newVal);
    else setServerCode(newVal);
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

  // Structured Pedagogical Breakdown (Definition, What Does It Do, Use Cases, Syntax)
  const topicData = useMemo(() => {
    return buildCleanTopicBreakdown({
      lessonTitle,
      topicTitle,
      lessonExplanation,
      concepts,
      examples,
      language,
    });
  }, [lessonTitle, topicTitle, lessonExplanation, concepts, examples, language]);

  // Handle Run Code with Real-Time Flow Pulse Sync
  const handleRunCode = useCallback(async () => {
    // Open flow panel if closed
    setActiveRightPanel("flow");
    setIsExecutionSyncing(true);
    setActiveFlowStep(0);

    // Sequence flow stage animations with laser pulse
    const stepsCount = topicData.flowSteps.length;
    let curStep = 0;
    const interval = setInterval(() => {
      curStep++;
      if (curStep < stepsCount) {
        setActiveFlowStep(curStep);
      } else {
        clearInterval(interval);
        setIsExecutionSyncing(false);
      }
    }, 600);

    await executeCode(appCode, "javascript", true);
  }, [appCode, executeCode, topicData.flowSteps.length]);

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Auto-advance flow steps when playing
  useEffect(() => {
    if (!isFlowAutoPlaying || !topicData.flowSteps || topicData.flowSteps.length <= 1) return;
    const interval = setInterval(() => {
      setActiveFlowStep((prev) => (prev + 1) % topicData.flowSteps.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [isFlowAutoPlaying, topicData.flowSteps]);

  // Voice narration for definition and core
  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    const textToSpeak = `${topicData.title}. ${topicData.definition}. ${topicData.whatItDoes.join(". ")}. Key rule: ${topicData.seniorRule}`;
    speakText({
      text: textToSpeak,
      lang: language,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  // Voice Microphone Input Handler
  const toggleListeningMic = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Microphone recognition is not supported in this browser. Please use Chrome, Edge, or Brave.");
      return;
    }

    if (isListeningMic) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListeningMic(false);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = language === "hi" ? "hi-IN" : "en-US";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListeningMic(true);
        setSpokenTranscript("");
        setActiveRightPanel("ai_tutor"); // Open AI panel immediately
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setSpokenTranscript(transcript);
      };

      recognition.onerror = () => {
        setIsListeningMic(false);
      };

      recognition.onend = async () => {
        setIsListeningMic(false);
        if (spokenTranscript.trim()) {
          await processVoiceQuestion(spokenTranscript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListeningMic(false);
    }
  }, [isListeningMic, language, spokenTranscript]);

  const processVoiceQuestion = async (queryText: string) => {
    setActiveRightPanel("ai_tutor");
    setAiChatMessages((prev) => [...prev, { role: "user", content: queryText }]);
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          message: `Student asked via Mic: "${queryText}". Explain in simple words for lesson "${lessonTitle}" - "${topicTitle}". Also suggest any code tweak if asked.`,
          mode: "explain",
          lessonTitle,
          topicTitle,
          code: appCode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.message?.content || data.response || "Concept explained clearly.";
        setAiChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        speakText({
          text: reply,
          lang: language,
        });
      }
    } catch {
      setAiChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            language === "hi"
              ? "माफ़ कीजिए, अभी जवाब नहीं मिल पाया। कृपया दोबारा पूछें।"
              : "Sorry, could not fetch answer right now. Please try again.",
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Chat send handler
  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInputMessage.trim() || isAiLoading) return;

    const userText = aiInputMessage.trim();
    setAiInputMessage("");
    setAiChatMessages((prev) => [...prev, { role: "user", content: userText }]);
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          message: userText,
          mode: "explain",
          lessonTitle,
          topicTitle,
          code: appCode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.message?.content || data.response || "Concept explained.";
        setAiChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      }
    } catch {
      setAiChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            language === "hi"
              ? "माफ़ कीजिए, अभी जवाब नहीं मिल पाया। कृपया दोबारा पूछें।"
              : "Sorry, could not fetch answer right now. Please try again.",
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTogglePanel = (panel: FloatingPanelType) => {
    setActiveRightPanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. TOP COMPACT BAR: ZERO WASTED SPACE (Breadcrumb + Title + Floating Actions)
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 shrink-0 gap-2 flex-wrap">
        {/* Left: Compact Breadcrumbs & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 text-xs text-slate-400 font-mono truncate">
            <span className="text-sky-400 font-bold">{courseTitle}</span>
            <span>/</span>
            <span className="truncate">{moduleTitle}</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <h1 className="text-sm font-bold text-white tracking-tight truncate flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            {lessonTitle} · {topicTitle}
          </h1>
        </div>

        {/* Center/Right: Floating Tools Toggles (Flow, VS Code, AI, Memory, Mic) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* ⚡ Live Visual Flow Toggle */}
          <button
            onClick={() => handleTogglePanel("flow")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeRightPanel === "flow"
                ? "bg-indigo-600 text-white shadow-md font-bold ring-1 ring-indigo-400"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Open Live Step-by-Step Execution Flow Diagram"
          >
            <Workflow className="size-3.5 text-indigo-300" />
            <span>Live Flow Diagram</span>
          </button>

          {/* 💻 How to Run in VS Code Guide */}
          <button
            onClick={() => handleTogglePanel("vscode_guide")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeRightPanel === "vscode_guide"
                ? "bg-amber-500 text-slate-950 shadow-md font-bold ring-1 ring-amber-300"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Where to create files and how to run in VS Code"
          >
            <Laptop className="size-3.5 text-amber-400" />
            <span>Run in VS Code Guide</span>
          </button>

          {/* 🤖 AI Tutor Assistant */}
          <button
            onClick={() => handleTogglePanel("ai_tutor")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeRightPanel === "ai_tutor"
                ? "bg-pink-600 text-white shadow-md font-bold ring-1 ring-pink-400"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Ask AI Tutor doubts in simple words"
          >
            <Sparkles className="size-3.5 text-pink-300" />
            <span>AI Tutor</span>
          </button>

          {/* 🥞 Call Stack / Memory */}
          <button
            onClick={() => handleTogglePanel("memory")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeRightPanel === "memory"
                ? "bg-purple-600 text-white shadow-md font-bold ring-1 ring-purple-400"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Call Stack & Heap Memory Inspector"
          >
            <Layers className="size-3.5 text-purple-300" />
            <span>Memory</span>
          </button>

          {/* 🎙️ Voice Microphone Assistant */}
          <button
            onClick={toggleListeningMic}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono border transition-all cursor-pointer ${
              isListeningMic
                ? "bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse font-bold"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Speak your doubt via microphone"
          >
            {isListeningMic ? <MicOff className="size-3.5" /> : <Mic className="size-3.5 text-rose-400" />}
            <span className="hidden sm:inline">{isListeningMic ? "Listening..." : "Mic Doubt"}</span>
          </button>

          {/* Language Switcher: English (Default) / Hindi */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 ml-1">
            <button
              onClick={() => handleSetLanguage("en")}
              className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-all cursor-pointer ${
                language === "en" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleSetLanguage("hi")}
              className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-all cursor-pointer ${
                language === "hi" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              HI
            </button>
          </div>

          {/* Voice Narration Button */}
          <button
            onClick={handleToggleVoice}
            className={`p-1.5 rounded-lg border border-slate-800 transition-all cursor-pointer ${
              isSpeaking ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "text-slate-400 hover:text-white"
            }`}
            title="Listen Voice Explanation"
          >
            {isSpeaking ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
          </button>

          {/* Mark Complete & Next */}
          {onCompleteLesson && (
            <Button
              size="sm"
              onClick={onCompleteLesson}
              className={`h-7 px-2.5 text-xs font-bold ${
                isCompleted ? "bg-emerald-700 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-slate-950"
              }`}
            >
              {isCompleted ? "Completed ✓" : "Mark Done"}
            </Button>
          )}

          {hasPrevLesson && onPrevLesson && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevLesson}
              className="h-7 px-2 border-slate-800 text-slate-300 hover:text-white"
              title="Previous Lesson"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
          )}

          {hasNextLesson && onNextLesson && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNextLesson}
              className="h-7 px-2 border-slate-800 text-slate-300 hover:text-white"
              title="Next Lesson"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Mic Live Feedback Banner */}
      {isListeningMic && (
        <div className="px-4 py-2 bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <Mic className="size-4 text-rose-400 animate-bounce" />
            <span className="font-bold">
              {language === "hi" ? "माइक सुन रहा है... अपना सवाल बोलें:" : "Listening to your voice... Speak your doubt:"}
            </span>
            <span className="font-mono text-white italic">"{spokenTranscript || "..."}"</span>
          </div>
          <button onClick={toggleListeningMic} className="text-rose-300 hover:text-white font-mono text-[11px] cursor-pointer">
            Stop ✕
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          2. MAIN UNIFIED 3-COLUMN WORKSPACE: FULL SCALE & SCROLLABLE
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* ═══════════════════════════════════════════════════════════════════════
            COLUMN 1 (LEFT): CONCEPT, DEFINITION, WHAT IT DOES & USE CASES
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="w-full md:w-[320px] lg:w-[360px] shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col min-h-0 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Section 1: Definition (What is it?) */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5">
                <BookOpen className="size-4 text-sky-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-sky-400 font-mono">
                  {language === "hi" ? "1. परिभाषा (What is it?)" : "1. Definition (What is it?)"}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans font-medium">
                {topicData.definition}
              </p>
            </div>

            {/* Section 2: What Does It Do? (Point by point) */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5">
                <Zap className="size-4 text-amber-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
                  {language === "hi" ? "2. यह क्या करता है? (What Does It Do?)" : "2. What Does It Do?"}
                </h2>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-sans">
                {topicData.whatItDoes.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 3: Why & When to Use? (Use Cases) */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="size-4 text-emerald-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  {language === "hi" ? "3. कब और क्यों यूज़ करें? (Use Cases)" : "3. When & Why to Use?"}
                </h2>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                {topicData.useCases.map((uc, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{uc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Section 4: Syntax & Highlighted Pattern */}
            <div className="space-y-2 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                  <Code2 className="size-3.5 text-indigo-400" />
                  {language === "hi" ? "4. सिंटैक्स और नियम" : "4. Syntax & Rules"}
                </span>
                <button
                  onClick={() => handleCopyCode("syntax_code", topicData.syntaxSnippet)}
                  className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  {copiedId === "syntax_code" ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  {copiedId === "syntax_code" ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                <code>{topicData.syntaxSnippet}</code>
              </pre>
              <p className="text-[11px] text-slate-400 italic">
                💡 <strong>Senior Rule:</strong> {topicData.seniorRule}
              </p>
            </div>

            {/* Quick Contrast: Without vs With */}
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 text-slate-300 space-y-1">
                <span className="font-bold text-rose-400 block font-mono text-[10px]">
                  ❌ {language === "hi" ? "इसके बिना क्या परेशानी थी?" : "Problem Without This:"}
                </span>
                <p className="text-[11px] leading-relaxed">{topicData.withoutThis}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-slate-300 space-y-1">
                <span className="font-bold text-emerald-400 block font-mono text-[10px]">
                  ✅ {language === "hi" ? "इससे क्या आसान हुआ?" : "Superpower With This:"}
                </span>
                <p className="text-[11px] leading-relaxed">{topicData.withThis}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            COLUMN 2 (CENTER): CODE WINDOW, MULTI-FILE TABS & RUNTIME PREVIEW
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-950 border-r border-slate-800">
          {/* File Switcher & Action Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs shrink-0 flex-wrap gap-2">
            {/* Multi-File Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveFile("app")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                  activeFile === "app"
                    ? "bg-sky-600 text-white font-bold"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="size-3 text-sky-300" />
                App.jsx
              </button>
              <button
                onClick={() => setActiveFile("html")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                  activeFile === "html"
                    ? "bg-amber-600 text-white font-bold"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="size-3 text-amber-300" />
                index.html
              </button>
              <button
                onClick={() => setActiveFile("css")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                  activeFile === "css"
                    ? "bg-indigo-600 text-white font-bold"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Palette className="size-3 text-indigo-300" />
                style.css
              </button>
              <button
                onClick={() => setActiveFile("server")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                  activeFile === "server"
                    ? "bg-emerald-600 text-white font-bold"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Cpu className="size-3 text-emerald-300" />
                server.js
              </button>
            </div>

            {/* Run & Execute Button */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleRunCode}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs h-7 px-3 gap-1.5 shadow-sm cursor-pointer"
              >
                <Play className="size-3 fill-current" />
                {loading || isExecutionSyncing ? "Running Flow..." : "Run & Preview (Ctrl+Enter)"}
              </Button>
            </div>
          </div>

          {/* Monaco Code Editor (Scrollable Center Area) */}
          <div className="flex-1 min-h-[200px]">
            <MonacoEditor
              value={currentEditorCode}
              onChange={(val) => handleEditorChange(val || "")}
              language={currentEditorLanguage}
            />
          </div>

          {/* Bottom Terminal & Browser Preview Splitter */}
          <div className="h-[230px] shrink-0 border-t border-slate-800 bg-slate-950 flex flex-col">
            <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-slate-800 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOutputTab("terminal")}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                    outputTab === "terminal" ? "bg-slate-800 text-emerald-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Terminal className="size-3" />
                  Terminal Logs
                  {output && <span className="size-1.5 rounded-full bg-emerald-400" />}
                </button>
                <button
                  onClick={() => setOutputTab("preview")}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                    outputTab === "preview" ? "bg-slate-800 text-sky-400" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Globe className="size-3" />
                  Live Browser Preview
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                {executionTime !== undefined && <span>{executionTime.toFixed(1)}ms</span>}
                <button onClick={clearOutput} className="hover:text-slate-300 cursor-pointer">
                  Clear
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {outputTab === "terminal" ? (
                <div className="p-3 text-xs font-mono">
                  {error && (
                    <div className="p-2.5 mb-2 rounded bg-rose-950/60 border border-rose-800 text-rose-300 whitespace-pre-wrap">
                      <strong>❌ Error:</strong> {error}
                    </div>
                  )}
                  {output ? (
                    <pre className="whitespace-pre-wrap text-emerald-300 leading-relaxed font-mono">
                      {output}
                    </pre>
                  ) : !error ? (
                    <span className="text-slate-500 italic">Click "Run &amp; Preview" to execute code and view logs.</span>
                  ) : null}
                </div>
              ) : (
                <iframe
                  title="Live Sandbox Preview"
                  srcDoc={liveSrcDoc}
                  sandbox="allow-scripts allow-same-origin allow-modals allow-forms"
                  className="w-full h-full border-0 bg-slate-950"
                />
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            COLUMN 3 (RIGHT): DYNAMIC FLOATING DRAWER (LIVE FLOW DIAGRAM, VS CODE GUIDE, AI)
            ═══════════════════════════════════════════════════════════════════════ */}
        {activeRightPanel !== null && (
          <div className="w-[340px] lg:w-[400px] shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col min-h-0 overflow-hidden shadow-2xl">
            {/* Header of Column 3 */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                {activeRightPanel === "flow" && (
                  <>
                    <Workflow className="size-4 text-indigo-400 animate-pulse" />
                    <span className="text-xs font-bold text-indigo-300 uppercase font-mono">
                      ⚡ Animated Flow Diagram
                    </span>
                  </>
                )}
                {activeRightPanel === "vscode_guide" && (
                  <>
                    <Laptop className="size-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300 uppercase font-mono">
                      💻 VS Code Project Setup Guide
                    </span>
                  </>
                )}
                {activeRightPanel === "ai_tutor" && (
                  <>
                    <Sparkles className="size-4 text-pink-400" />
                    <span className="text-xs font-bold text-pink-300 uppercase font-mono">
                      🤖 AI Tutor Assistant
                    </span>
                  </>
                )}
                {activeRightPanel === "memory" && (
                  <>
                    <Layers className="size-4 text-purple-400" />
                    <span className="text-xs font-bold text-purple-300 uppercase font-mono">
                      🥞 Call Stack &amp; Memory
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={() => setActiveRightPanel(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 cursor-pointer"
                title="Close Drawer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Content Body of Column 3 */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              {/* TOOL A: ⚡ ANIMATED CONNECTED DIAGRAMMATIC FLOW (WITH LASER PULSES) */}
              {activeRightPanel === "flow" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-indigo-300 font-mono font-bold flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                      {isExecutionSyncing
                        ? "⚡ Executing Code & Flow Sync..."
                        : `Stage ${activeFlowStep + 1} of ${topicData.flowSteps.length}`}
                    </span>
                    <button
                      onClick={() => setIsFlowAutoPlaying(!isFlowAutoPlaying)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all cursor-pointer ${
                        isFlowAutoPlaying
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse font-bold"
                          : "border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {isFlowAutoPlaying ? "Pause Flow" : "▶ Auto Play"}
                    </button>
                  </div>

                  {/* Connected Flow Diagram Nodes with Laser Connecting Lines */}
                  <div className="space-y-0 relative py-1">
                    {topicData.flowSteps.map((step, idx) => {
                      const isActive = activeFlowStep === idx;
                      const isPast = activeFlowStep > idx;
                      const isLast = idx === topicData.flowSteps.length - 1;

                      return (
                        <div key={idx} className="relative">
                          {/* Node Card */}
                          <div
                            onClick={() => {
                              setActiveFlowStep(idx);
                              setIsFlowAutoPlaying(false);
                            }}
                            className={`relative z-10 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                              isActive
                                ? "bg-slate-950 border-sky-400 text-white shadow-xl ring-2 ring-sky-400/40 scale-[1.02]"
                                : isPast
                                ? "bg-slate-950/90 border-indigo-500/40 text-slate-300"
                                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`flex size-6 items-center justify-center rounded-full text-xs font-mono font-bold ${
                                    isActive
                                      ? "bg-gradient-to-r from-sky-400 to-indigo-500 text-slate-950 shadow-md animate-bounce"
                                      : isPast
                                      ? "bg-indigo-600 text-white"
                                      : "bg-slate-800 text-slate-400"
                                  }`}
                                >
                                  {isPast ? "✓" : `0${idx + 1}`}
                                </span>
                                <span
                                  className={`text-xs font-bold font-mono tracking-tight ${
                                    isActive ? "text-sky-300" : isPast ? "text-indigo-300" : "text-slate-300"
                                  }`}
                                >
                                  {step.phase}
                                </span>
                              </div>

                              {isActive && (
                                <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[9px] px-1.5 py-0">
                                  Active Stage
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs text-slate-200 font-sans leading-relaxed pl-8">
                              {step.whatHappens}
                            </p>

                            {/* Active Inspection Box */}
                            {isActive && (
                              <div className="mt-2.5 ml-8 p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px] font-mono">
                                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                                  <span className="text-indigo-300 font-bold uppercase">⚡ Data &amp; Memory State:</span>
                                  <span className="text-emerald-400">Live Synced</span>
                                </div>
                                <pre className="text-sky-200 text-[11px] overflow-x-auto whitespace-pre-wrap">
                                  <code>{step.dataState}</code>
                                </pre>
                              </div>
                            )}
                          </div>

                          {/* Connecting Laser Pulse Line */}
                          {!isLast && (
                            <div className="flex flex-col items-center justify-center my-0.5 relative z-0">
                              <div className="h-6 w-1 relative flex items-center justify-center">
                                {/* Base vertical wire */}
                                <div
                                  className={`w-0.5 h-full ${
                                    isPast || isActive ? "bg-gradient-to-b from-sky-400 to-indigo-500" : "bg-slate-800"
                                  }`}
                                />
                                {/* Laser Current Pulse Glow Dot */}
                                {(isActive || isExecutionSyncing) && (
                                  <motion.div
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 10, opacity: [0, 1, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                    className="absolute size-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8]"
                                  />
                                )}
                              </div>
                              <ArrowDown
                                className={`size-3.5 -mt-1 ${
                                  isPast || isActive ? "text-indigo-400 animate-pulse" : "text-slate-700"
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TOOL B: 💻 HOW TO RUN IN VS CODE GUIDE (CLEAR LOCATION & RUN INSTRUCTIONS) */}
              {activeRightPanel === "vscode_guide" && (
                <div className="space-y-4 text-xs">
                  {/* Category Switcher: React / Node.js / Fullstack */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setActiveVsCodeTab("react")}
                      className={`flex-1 py-1 rounded-lg text-center font-mono font-bold transition-all cursor-pointer ${
                        activeVsCodeTab === "react"
                          ? "bg-sky-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      ⚛️ React Frontend
                    </button>
                    <button
                      onClick={() => setActiveVsCodeTab("node")}
                      className={`flex-1 py-1 rounded-lg text-center font-mono font-bold transition-all cursor-pointer ${
                        activeVsCodeTab === "node"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      🟢 Node.js Server
                    </button>
                    <button
                      onClick={() => setActiveVsCodeTab("fullstack")}
                      className={`flex-1 py-1 rounded-lg text-center font-mono font-bold transition-all cursor-pointer ${
                        activeVsCodeTab === "fullstack"
                          ? "bg-purple-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      🔗 Full-Stack
                    </button>
                  </div>

                  {/* TAB 1: REACT FRONTEND SETUP */}
                  {activeVsCodeTab === "react" && (
                    <div className="space-y-3">
                      {/* Step 1: Folder Tree */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-amber-300 font-mono block">
                          📁 1. Files Kahan Create Karni Hain:
                        </span>
                        <pre className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300 leading-relaxed">
                          {`my-react-app/
├── index.html        <-- Root folder me (Directly inside project)
├── package.json      <-- Root folder me
└── src/              <-- (src Folder banayein)
    ├── App.jsx       <-- [App.jsx Code yahan paste karein]
    ├── style.css     <-- [style.css Code yahan paste karein]
    └── main.jsx      <-- React Root Launcher`}
                        </pre>
                      </div>

                      {/* Step 2: Exact Terminal Commands */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-emerald-400 font-mono block">
                          🚀 2. VS Code Terminal me Run Karein:
                        </span>
                        <pre className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-300 leading-relaxed">
                          {`# 1. New React Project banayein
npm create vite@latest my-react-app -- --template react

# 2. Folder me enter karein aur install karein
cd my-react-app
npm install

# 3. React App Start Karein (Run File: main.jsx -> App.jsx)
npm run dev`}
                        </pre>
                        <p className="text-[11px] text-slate-300 font-sans">
                          👉 Browser me <strong>http://localhost:5173</strong> open ho jayega aur aapka code live chalega!
                        </p>
                      </div>

                      {/* Step 3: What to copy */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-sky-400 font-mono block">
                          📝 3. File Contents:
                        </span>
                        <div className="flex items-center justify-between text-[11px] bg-slate-900 p-2 rounded border border-slate-800">
                          <span className="font-mono text-slate-300">src/App.jsx</span>
                          <button
                            onClick={() => handleCopyCode("react_app", appCode)}
                            className="text-sky-400 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === "react_app" ? "Copied ✓" : "Copy App.jsx Code"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: NODE.JS BACKEND SETUP */}
                  {activeVsCodeTab === "node" && (
                    <div className="space-y-3">
                      {/* Step 1: Folder Tree */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-amber-300 font-mono block">
                          📁 1. Node.js Folder Structure:
                        </span>
                        <pre className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300 leading-relaxed">
                          {`my-node-api/
├── server.js         <-- Root folder me (Main backend file)
└── package.json      <-- Root folder me`}
                        </pre>
                      </div>

                      {/* Step 2: Exact Terminal Commands */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-emerald-400 font-mono block">
                          🚀 2. VS Code Terminal me Run Karein:
                        </span>
                        <pre className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-300 leading-relaxed">
                          {`# 1. New Folder banayein aur enter karein
mkdir my-node-api && cd my-node-api

# 2. Package.json create karein
npm init -y

# 3. Express & CORS install karein
npm install express cors dotenv

# 4. Run Server File (server.js ko run karein)
node server.js`}
                        </pre>
                        <p className="text-[11px] text-slate-300 font-sans">
                          👉 Terminal me aayega: <code>Server active on http://localhost:5000</code>!
                        </p>
                      </div>

                      {/* Step 3: What to copy */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-emerald-400 font-mono block">
                          📝 3. File Contents:
                        </span>
                        <div className="flex items-center justify-between text-[11px] bg-slate-900 p-2 rounded border border-slate-800">
                          <span className="font-mono text-slate-300">server.js</span>
                          <button
                            onClick={() => handleCopyCode("node_srv", serverCode)}
                            className="text-emerald-400 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedId === "node_srv" ? "Copied ✓" : "Copy server.js Code"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: FULLSTACK INTEGRATION */}
                  {activeVsCodeTab === "fullstack" && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-purple-300 font-mono block">
                          🔗 How React &amp; Node.js Work Together:
                        </span>
                        <div className="space-y-2 text-slate-300 text-[11px]">
                          <div className="p-2 bg-slate-900 rounded border border-slate-800">
                            <strong>Step 1:</strong> Node.js server ko Port 5000 par start karein (<code>node server.js</code>).
                          </div>
                          <div className="p-2 bg-slate-900 rounded border border-slate-800">
                            <strong>Step 2:</strong> React App me API call karein:
                            <pre className="mt-1 text-sky-300 font-mono">
                              {`fetch("http://localhost:5000/api/items")\n  .then(res => res.json())\n  .then(data => setItems(data));`}
                            </pre>
                          </div>
                          <div className="p-2 bg-slate-900 rounded border border-slate-800">
                            <strong>Step 3:</strong> React app start karein (<code>npm run dev</code>) ➔ Done! 🎉
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TOOL C: 🤖 AI TUTOR ASSISTANT */}
              {activeRightPanel === "ai_tutor" && (
                <div className="flex flex-col h-full space-y-3">
                  <div className="flex-1 min-h-[260px] space-y-2 overflow-y-auto pr-1">
                    {aiChatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-xl text-xs ${
                          msg.role === "user"
                            ? "bg-indigo-950/80 border border-indigo-800 text-indigo-100 ml-4"
                            : "bg-slate-950 border border-slate-800 text-slate-200 mr-4"
                        }`}
                      >
                        <span className="font-bold font-mono text-[10px] text-slate-400 block mb-1">
                          {msg.role === "user" ? "You:" : "AI Tutor:"}
                        </span>
                        <p className="font-sans leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                    {isAiLoading && (
                      <div className="flex items-center gap-1.5 text-xs text-pink-400 font-mono">
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    )}
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleSendAiMessage} className="flex gap-1.5 pt-2 border-t border-slate-800">
                    <input
                      type="text"
                      value={aiInputMessage}
                      onChange={(e) => setAiInputMessage(e.target.value)}
                      placeholder={language === "hi" ? "कोई सवाल पूछें..." : "Ask a doubt..."}
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-hidden focus:border-pink-500 font-sans"
                    />
                    <Button type="submit" size="sm" className="bg-pink-600 hover:bg-pink-500 text-white h-8 px-2.5 cursor-pointer">
                      <Send className="size-3.5" />
                    </Button>
                  </form>
                </div>
              )}

              {/* TOOL D: 🥞 CALL STACK & MEMORY */}
              {activeRightPanel === "memory" && (
                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-purple-300 font-mono uppercase block mb-2">
                      Active Call Stack
                    </span>
                    <CallStack
                      frames={events
                        .filter((e) => e.type === "call" || e.type === "return")
                        .map((e, i) => ({
                          id: `f_${i}`,
                          name: e.callStack?.[0] || "main",
                          args: [],
                          isExecuting: i === 0,
                          depth: i,
                        }))}
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[11px] font-bold text-purple-300 font-mono uppercase block mb-2">
                      Heap Memory
                    </span>
                    <MemoryView
                      events={events
                        .filter((e) => e.type === "variable" || Boolean(e.variable))
                        .map((e, idx) => ({
                          step: idx + 1,
                          type: "variable" as const,
                          variable: e.variable || "var",
                          value: e.value !== undefined ? String(e.value) : "undefined",
                        }))}
                      currentStep={events.length}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Clean Pedagogical Topic Breakdown Generator (Ultra-Simple Words)
// ─────────────────────────────────────────────────────────────────────────────
function buildCleanTopicBreakdown({
  lessonTitle,
  topicTitle,
  lessonExplanation,
  concepts,
  examples,
  language,
}: {
  lessonTitle: string;
  topicTitle: string;
  lessonExplanation?: string;
  concepts: ConceptItem[];
  examples: ExampleItem[];
  language: ExplanationLanguage;
}) {
  const combined = `${lessonTitle} ${topicTitle}`.toLowerCase();

  // 1. React State & useState
  if (combined.includes("state") || combined.includes("usestate")) {
    return {
      title: "State & useState",
      definition:
        language === "hi"
          ? "State कंपोनेंट की डिजिटल मेमोरी होती है। जब भी State बदलती है, React स्क्रीन को अपने आप नया डेटा दिखाने के लिए रिफ्रेश (Re-render) कर देता है।"
          : "State is a component's memory. Whenever state changes, React automatically re-renders the screen to show the fresh updated data.",
      whatItDoes:
        language === "hi"
          ? [
              "यह डेटा को याद रखता है (जैसे यूजर का इनपुट, स्कोर या लोडिंग स्टेटस).",
              "जब आप setter फंक्शन (जैसे setCount) चलाते हैं, यह स्क्रीन को तुरंत अपडेट करता है.",
              "यह डेटा को हमेशा सेफ और प्रेडिक्टेबल रखता है.",
            ]
          : [
              "Holds dynamic data (like scores, form inputs, or modal open status).",
              "Triggers an instant UI re-render whenever the setter function is called.",
              "Keeps component state self-contained and predictable.",
            ],
      useCases:
        language === "hi"
          ? ["काउंटर और स्कोरबोर्ड", "फॉर्म इनपुट और चेकबॉक्स", "डार्क/लाइट थीम टॉगल", "लोडिंग स्पिनर ऑन/ऑफ"]
          : ["Counters and live scoreboards", "Form typing and checkboxes", "Dark/Light theme toggles", "Loading spinners"],
      syntaxSnippet: `const [count, setCount] = useState(0);\n// To update:\nsetCount(count + 1);`,
      seniorRule:
        language === "hi"
          ? "State को कभी count = count + 1 करके डायरेक्ट मत बदलो, हमेशा setCount() का इस्तेमाल करो!"
          : "Never mutate state directly (count = count + 1); always use the setter function (setCount).",
      withoutThis:
        language === "hi"
          ? "नॉर्मल variable बदलने पर स्क्रीन पर पुराना डेटा ही दिखता रहता था!"
          : "Normal JS variables don't tell React to re-paint, leaving the screen frozen.",
      withThis:
        language === "hi"
          ? "State बदलते ही स्क्रीन पर नया डेटा 1 मिलीसेकंड में अपडेट हो जाता है!"
          : "React instantly re-paints the screen with zero manual DOM manipulation!",
      flowSteps: [
        {
          phase: "1. User Action / Trigger",
          whatHappens: language === "hi" ? "यूजर ने बटन पर क्लिक किया।" : "User clicks the interactive button in UI.",
          dataState: "Event: onClick(e) fired in Event Queue",
        },
        {
          phase: "2. State Setter Invoked",
          whatHappens: language === "hi" ? "setCount(prev => prev + 1) चला।" : "setCount(count + 1) schedules re-render in React Fiber.",
          dataState: "Memory: Component State updated in Heap",
        },
        {
          phase: "3. Virtual DOM Diffing",
          whatHappens: language === "hi" ? "React ने नया UI ट्री कैलकुलेट किया।" : "React executes component and compares old vs new VDOM tree.",
          dataState: "Reconciliation: Diff found on <h1> element",
        },
        {
          phase: "4. Screen Repainted",
          whatHappens: language === "hi" ? "ब्राउज़र स्क्रीन पर नया नंबर अपडेट हो गया!" : "DOM node patched on screen with zero flicker.",
          dataState: "Output: Screen displays new value smoothly",
        },
      ],
    };
  }

  // 2. React Components & Props
  if (combined.includes("component") || combined.includes("prop") || combined.includes("jsx")) {
    return {
      title: "Components & Props",
      definition:
        language === "hi"
          ? "Component एक स्वतंत्र LEGO ब्लॉक की तरह होता है जो UI बनाता है। Props उसके अंदर भेजा जाने वाला डेटा (Input) होता है।"
          : "A Component is a reusable building block that returns UI (JSX). Props are read-only inputs passed from parent to child.",
      whatItDoes:
        language === "hi"
          ? [
              "बड़ी वेबसाइट को छोटे-छोटे रियूजेबल ब्लॉक्स (Button, Card, Navbar) में तोड़ता है.",
              "Props के ज़रिए एक ही डिज़ाइन में अलग-अलग डेटा दिखाया जा सकता है.",
              "कोड को क्लीन और मेंटेन करने में आसान बनाता है.",
            ]
          : [
              "Breaks complex UIs into clean, reusable functions (Button, Card, Navbar).",
              "Allows passing custom data into the same visual template.",
              "Ensures unidirectional data flow from top to bottom.",
            ],
      useCases:
        language === "hi"
          ? ["यूजर प्रोफाइल कार्ड", "कस्टम बटन और मोडल", "प्रोडक्ट लिस्टिंग ग्रिड"]
          : ["User profile cards", "Custom reusable buttons", "E-commerce product cards"],
      syntaxSnippet: `function Card({ name, role }) {\n  return <div className="card"><h3>{name}</h3><p>{role}</p></div>;\n}`,
      seniorRule:
        language === "hi"
          ? "Props हमेशा Read-Only होते हैं — चाइल्ड कंपोनेंट उन्हें कभी डायरेक्ट नहीं बदल सकता!"
          : "Props are read-only (immutable). Never modify props inside child components.",
      withoutThis:
        language === "hi"
          ? "हर यूजर के लिए 100 बार अलग HTML कॉपी-पेस्ट करना पड़ता था!"
          : "Duplicating 100s of lines of identical HTML for every single card.",
      withThis:
        language === "hi"
          ? "1 मास्टर कंपोनेंट बनाकर लाखों कार्ड 1 सेकंड में बन जाते हैं!"
          : "Create 1 master component and render thousands of unique cards instantly!",
      flowSteps: [
        {
          phase: "1. Parent Component Passes Props",
          whatHappens: language === "hi" ? "Parent ने <Card name='Aman' /> रेंडर किया।" : "Parent passes { name: 'Aman' } to child.",
          dataState: "Props Object: { name: 'Aman', role: 'Dev' }",
        },
        {
          phase: "2. Child Receives & Evaluates",
          whatHappens: language === "hi" ? "Card(props) फंक्शन ने डेटा पढ़ा।" : "Child component function runs with injected props.",
          dataState: "Scope: Read-only Props bound to function",
        },
        {
          phase: "3. JSX Template Rendered",
          whatHappens: language === "hi" ? "HTML में डेटा इंजेक्ट होकर स्क्रीन पर दिखा।" : "JSX nodes compiled into Virtual DOM nodes.",
          dataState: "DOM: Painted on screen with customized text",
        },
      ],
    };
  }

  // 3. Express & Node.js REST API
  if (combined.includes("node") || combined.includes("express") || combined.includes("route") || combined.includes("api")) {
    return {
      title: "Express REST API & Routing",
      definition:
        language === "hi"
          ? "Express एक हल्का Node.js फ्रेमवर्क है जो HTTP रिक्वेस्ट (GET, POST) को सुनकर सही डेटा (JSON) रिटर्न करता है।"
          : "Express is a fast, unopinionated Node.js framework for building HTTP servers and REST API endpoints.",
      whatItDoes:
        language === "hi"
          ? [
              "किसी खास URL (जैसे /api/users) पर आने वाली रिक्वेस्ट को सुनता है.",
              "डेटाबेस से डेटा निकालकर JSON फॉर्मेट में रिस्पॉन्स भेजता है.",
              "मिडिलवेयर से ऑथेंटिकेशन और सिक्योरिटी चेक करता है.",
            ]
          : [
              "Listens for HTTP requests (GET, POST, PUT, DELETE) on specific URL paths.",
              "Processes data and returns structured JSON responses with HTTP status codes.",
              "Executes middleware pipelines for authentication, validation, and logging.",
            ],
      useCases:
        language === "hi"
          ? ["यूजर लॉगिन और रजिस्ट्रेशन API", "डेटाबेस से प्रोडक्ट्स लोड करना", "पेमेंट गेटवे इंटीग्रेशन"]
          : ["User auth & registration APIs", "Fetching database items", "Webhook and payment processing"],
      syntaxSnippet: `app.get('/api/users', (req, res) => {\n  res.json([{ id: 1, name: 'Aman' }]);\n});`,
      seniorRule:
        language === "hi"
          ? "Middleware के अंत में next() कॉल करना कभी मत भूलो, वरना रिक्वेस्ट लटक जाएगी!"
          : "Always call next() in custom middleware so the request doesn't hang indefinitely.",
      withoutThis:
        language === "hi"
          ? "रॉ Node http मॉड्यूल में 1 रूट बनाने के लिए 50 लाइन का भारी कोड लिखना पड़ता था!"
          : "Writing 50+ lines of low-level boilerplate just to parse URLs and bodies.",
      withThis:
        language === "hi"
          ? "1 लाइन में नया API रूट बन जाता है!"
          : "Define clean, readable REST endpoints in 3 lines of code!",
      flowSteps: [
        {
          phase: "1. HTTP Request Arrival",
          whatHappens: language === "hi" ? "क्लाइंट ने GET /api/users रिक्वेस्ट भेजी।" : "Browser / Client sends HTTP GET /api/users.",
          dataState: "Network: TCP packet received on Port 5000",
        },
        {
          phase: "2. Middleware & Router Match",
          whatHappens: language === "hi" ? "CORS और JSON पार्सर के बाद रूट मैच हुआ।" : "Express runs middleware pipeline and matches route handler.",
          dataState: "Router: Matched app.get('/api/users')",
        },
        {
          phase: "3. Controller & Database Fetch",
          whatHappens: language === "hi" ? "कंट्रोलर ने डेटाबेस से डेटा निकाला।" : "Handler queries array or DB for user objects.",
          dataState: "Payload: [{ id: 1, name: 'Aman' }]",
        },
        {
          phase: "4. HTTP 200 JSON Response",
          whatHappens: language === "hi" ? "200 OK के साथ JSON क्लाइंट को डिलीवर हुआ।" : "res.json(data) sends 200 OK back to browser.",
          dataState: "Network: HTTP 200 OK + application/json",
        },
      ],
    };
  }

  // 4. Default Clean Breakdown for any other topic
  return {
    title: topicTitle || lessonTitle,
    definition:
      lessonExplanation ||
      (language === "hi"
        ? `${topicTitle || lessonTitle} सॉफ्टवेयर इंजीनियरिंग का एक महत्वपूर्ण कॉन्सेप्ट है जो आपके कोड को तेज, सुरक्षित और मेंटेन करने में आसान बनाता है।`
        : `${topicTitle || lessonTitle} is an essential software engineering concept designed to make applications faster, reliable, and maintainable.`),
    whatItDoes:
      language === "hi"
        ? [
            "इनपुट डेटा को प्रोसेस करके सही आउटपुट देता है.",
            "कोड को छोटे-छोटे समझने लायक मॉड्यूल्स में बांटता है.",
            "एरर्स और अनपेक्षित बग्स को आने से रोकता है.",
          ]
        : [
            "Processes inputs predictably and outputs expected results.",
            "Divides complex code into clean, modular building blocks.",
            "Guards against runtime errors and state corruption.",
          ],
    useCases:
      language === "hi"
        ? ["रियल-वर्ल्ड प्रोडक्शन ऐप्स", "डेटा ट्रांसफॉर्मेशन और स्टोरेज", "यूजर इंटरफेस इंटरेक्शन"]
        : ["Production web applications", "Data transformation & storage", "Interactive UI workflows"],
    syntaxSnippet: `// ${topicTitle || lessonTitle} Pattern\nfunction handleAction() {\n  return { success: true };\n}`,
    seniorRule:
      language === "hi"
        ? "हमेशा साफ़, प्रेडिक्टेबल और टेस्टेबल कोड लिखें!"
        : "Always write clean, deterministic, and modular code with clear error handling.",
    withoutThis:
      language === "hi"
        ? "कोड उलझ जाता था और बग्स ढूंढना मुश्किल होता था।"
        : "Fragile monolithic code prone to runtime bugs.",
    withThis:
      language === "hi"
        ? "साफ़-सुथरा कोड जिसे कोई भी आसानी से समझ और चला सकता है!"
        : "Clean, testable code that scales smoothly!",
    flowSteps: [
      {
        phase: "1. Input Trigger",
        whatHappens: language === "hi" ? "इनपुट डेटा सिस्टम में आया।" : "Input data enters the execution pipeline.",
        dataState: "State: PENDING in Event Queue",
      },
      {
        phase: "2. Processing Logic",
        whatHappens: language === "hi" ? "कोर लॉजिक ने डेटा प्रोसेस किया।" : "Core algorithm processes logic in Call Stack.",
        dataState: "State: COMPUTING in Heap Memory",
      },
      {
        phase: "3. Output Resolution",
        whatHappens: language === "hi" ? "सफलतापूर्वक रिजल्ट मिला।" : "Clean result returned to caller and UI rendered.",
        dataState: "State: 200 OK / UI Painted",
      },
    ],
  };
}
