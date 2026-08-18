"use client";

// Global safe interceptor for harmless Monaco Editor cancellation exceptions
if (typeof window !== "undefined") {
  const origConsoleError = console.error;
  console.error = function (...args: any[]) {
    const text = args.map((a) => (a?.stack || a?.message || String(a))).join(" ");
    if (
      text.includes("Canceled") ||
      text.includes("canceled") ||
      text.includes("of.cancel") ||
      text.includes("off.cancel") ||
      text.includes("CalNCsUg") ||
      text.includes("editor.api")
    ) {
      return;
    }
    origConsoleError.apply(console, args);
  };
}


// Helper to clean chapter prefix and capitalize title
function getPhaseSortNumber(phaseTitle: string): number {
  if (!phaseTitle) return 999;
  const match = phaseTitle.match(/Phase\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : 999;
}

function formatCleanLessonTitle(rawTitle: string): string {
  if (!rawTitle) return "";
  // Strip "Chapter X: ", "Section X: ", etc.
  let clean = rawTitle.replace(/^(Chapter|Section|Phase)\s+[\d\.]+\s*:\s*/i, "").trim();
  // Capitalize first letter of each major word
  return clean
    .split(" ")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}



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
  PanelTop,
  Award,
  ArrowDown,
  CornerDownRight,
  Server,
  Monitor,
  Search,
  ListOrdered,
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
export type FloatingPanelType = "flow" | "vscode_guide" | "ai_tutor" | "memory" | "quiz" | "interview";
export type ActiveEditorFile = "app" | "html" | "css" | "server";

export interface ChapterItem {
  id: string;
  title: string;
  order: number;
  moduleTitle: string;
  isCompleted?: boolean;
}

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
  currentLessonId?: string;
  lessonTitle: string;
  topicTitle: string;
  courseTitle: string;
  moduleTitle: string;
  lessonContent: string;
  lessonExplanation?: string;
  concepts: ConceptItem[];
  examples: ExampleItem[];
  chaptersList?: ChapterItem[];
  onCompleteLesson?: () => void;
  isCompleted?: boolean;
  onNextLesson?: () => void;
  onPrevLesson?: () => void;
  hasNextLesson?: boolean;
  hasPrevLesson?: boolean;
  onSelectChapter?: (id: string) => void;
}

export function UnifiedInteractiveClassroom({
  currentLessonId,
  lessonTitle,
  topicTitle,
  courseTitle,
  moduleTitle,
  lessonContent,
  lessonExplanation,
  concepts,
  examples,
  chaptersList = [],
  onCompleteLesson,
  isCompleted = false,
  onNextLesson,
  onPrevLesson,
  hasNextLesson = false,
  hasPrevLesson = false,
  onSelectChapter,
}: UnifiedInteractiveClassroomProps) {
  // English is default language; persisted across all courses
  const [language, setLanguage] = useState<ExplanationLanguage>("en");
  // Floating Right Column Tool (Default: "flow", always stable)
  const [activeRightPanel, setActiveRightPanel] = useState<FloatingPanelType | null>("flow");
  const [activeFlowStep, setActiveFlowStep] = useState<number>(0);
  const [isFlowAutoPlaying, setIsFlowAutoPlaying] = useState<boolean>(false);
  const [isExecutionSyncing, setIsExecutionSyncing] = useState<boolean>(false);

  // Chapters Sidebar Drawer State
  const [isChaptersDrawerOpen, setIsChaptersDrawerOpen] = useState<boolean>(false);
  const [chapterSearchQuery, setChapterSearchQuery] = useState<string>("");

  // Quiz & Interview State
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [revealedInterviewQuestions, setRevealedInterviewQuestions] = useState<Record<number, boolean>>({});

  // Mobile View Switcher: "notes" | "code" | "output"
  const [mobileActiveView, setMobileActiveView] = useState<"notes" | "code" | "output">("notes");
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState<boolean>(false);
  const [showSubheaderCard, setShowSubheaderCard] = useState<boolean>(true);
  const [isFloatingToolsModalOpen, setIsFloatingToolsModalOpen] = useState<boolean>(false);


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
  const [activeVsCodeTab, setActiveVsCodeTab] = useState<"react" | "node" | "fullstack">("node");

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
      const initialCode = examples[0]?.solutionCode || examples[0]?.starterCode;
      setAppCode(initialCode);
      // If code starts with node/express, default serverCode to it as well
      if (initialCode.includes("express") || initialCode.includes("http") || initialCode.includes("require(")) {
        setServerCode(initialCode);
        setActiveVsCodeTab("node");
      } else {
        setActiveVsCodeTab("react");
      }
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

  // Filter chapters in sidebar drawer
  const filteredChapters = useMemo(() => {
    if (!chapterSearchQuery.trim()) return chaptersList;
    const q = chapterSearchQuery.toLowerCase();
    return chaptersList.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.moduleTitle.toLowerCase().includes(q) ||
        String(c.order).includes(q)
    );
  }, [chaptersList, chapterSearchQuery]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden select-none relative">
      {/* ─────────────────────────────────────────────────────────────────────────────
          1. TOP SLIM HEADER BAR (BRAND / CHAPTERS / SLIM PILL / DESKTOP TOOLS / SUBHEADER TOGGLE)
          ───────────────────────────────────────────────────────────────────────────── */}
      <header className="min-h-14 sm:h-14 py-2 px-3 sm:px-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 z-30">
        {/* Left: Back Button, Chapters Drawer Button, Slim Pill Title */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={() => { if (typeof window !== 'undefined') window.history.back(); }}
            className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-mono transition-colors p-1.5 rounded-lg hover:bg-slate-800 shrink-0 cursor-pointer"
            title="Back to Course Overview"
          >
            <ChevronLeft className="size-4" />
          </button>

          {/* 📚 Chapters Drawer Button */}
          <button
            onClick={() => setIsChaptersDrawerOpen(!isChaptersDrawerOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-sky-600/20 text-sky-300 border border-sky-500/40 hover:bg-sky-600 hover:text-white transition-all cursor-pointer shrink-0 shadow-xs"
            title="Open Curriculum & Learning Phases Drawer"
          >
            <ListOrdered className="size-3.5 text-sky-400" />
            <span>Chapters</span>
          </button>

          {/* Slim Pill Title */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono truncate max-w-[130px] sm:max-w-[220px] md:max-w-[300px]">
            <span className="size-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
            <span className="truncate font-semibold text-white">{lessonTitle || topicTitle}</span>
          </div>
        </div>

        {/* Desktop / Tablet Full Power Tools Row (All Options Visible on Desktop) */}
        <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
          {/* ⚡ Live Visual Flow Toggle */}
          <button
            onClick={() => handleTogglePanel("flow")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeRightPanel === "flow"
                ? "bg-indigo-600 text-white shadow-md font-bold ring-1 ring-indigo-400"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Open Live Step-by-Step Execution Flow Diagram"
          >
            <Workflow className="size-3.5 text-indigo-300" />
            <span>Flow</span>
          </button>

          {/* 💻 How to Run in VS Code Guide */}
          <button
            onClick={() => handleTogglePanel("vscode_guide")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeRightPanel === "vscode_guide"
                ? "bg-amber-500 text-slate-950 shadow-md font-bold ring-1 ring-amber-300"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Where to create files and how to run in VS Code"
          >
            <Laptop className="size-3.5 text-amber-400" />
            <span>VS Code</span>
          </button>

          {/* 🤖 AI Tutor Assistant */}
          <button
            onClick={() => handleTogglePanel("ai_tutor")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
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
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeRightPanel === "memory"
                ? "bg-purple-600 text-white shadow-md font-bold ring-1 ring-purple-400"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Call Stack & Heap Memory Inspector"
          >
            <Layers className="size-3.5 text-purple-300" />
            <span>Memory</span>
          </button>

          {/* 📝 Topic Quiz & Practice */}
          <button
            onClick={() => handleTogglePanel("quiz")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeRightPanel === "quiz"
                ? "bg-emerald-600 text-white shadow-md font-bold ring-1 ring-emerald-400"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Interactive Quiz & Knowledge Check"
          >
            <HelpCircle className="size-3.5 text-emerald-300" />
            <span>Quiz</span>
          </button>

          {/* 💼 Interview Questions & Answers */}
          <button
            onClick={() => handleTogglePanel("interview")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              activeRightPanel === "interview"
                ? "bg-cyan-600 text-white shadow-md font-bold ring-1 ring-cyan-400"
                : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Senior Interview Questions & Solutions"
          >
            <Award className="size-3.5 text-cyan-300" />
            <span>Interview</span>
          </button>

          {/* 🎙️ Voice Microphone Assistant */}
          <button
            onClick={toggleListeningMic}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold font-mono border transition-all cursor-pointer ${
              isListeningMic
                ? "bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse font-bold"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Speak your doubt via microphone"
          >
            {isListeningMic ? <MicOff className="size-3.5" /> : <Mic className="size-3.5 text-rose-400" />}
            <span>Mic</span>
          </button>

          {/* 🔊 Text-To-Speech Speaker */}
          <button
            onClick={handleToggleVoice}
            className={`p-1.5 rounded-lg border border-slate-800 transition-all cursor-pointer ${
              isSpeaking ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "text-slate-400 hover:text-white"
            }`}
            title={isSpeaking ? "Stop voice explanation" : "Listen to lesson explanation"}
          >
            {isSpeaking ? <VolumeX className="size-3.5 text-emerald-400 animate-pulse" /> : <Volume2 className="size-3.5 text-slate-400" />}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => handleSetLanguage("en")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                language === "en" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleSetLanguage("hi")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                language === "hi" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              HI
            </button>
          </div>

          {/* Navigation: Prev / Next / Mark Done */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-1.5 ml-0.5">
            {onPrevLesson && (
              <button
                onClick={onPrevLesson}
                className="p-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Previous Lesson"
              >
                <ChevronLeft className="size-3.5" />
              </button>
            )}
            {onNextLesson && (
              <button
                onClick={onNextLesson}
                className="p-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Next Lesson"
              >
                <ChevronRight className="size-3.5" />
              </button>
            )}
            {onCompleteLesson && (
              <button
                onClick={onCompleteLesson}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                  isCompleted
                    ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-emerald-600 text-slate-950 hover:bg-emerald-500 shadow-sm"
                }`}
                title="Mark this lesson as completed"
              >
                <CheckCircle2 className="size-3.5" />
                <span>{isCompleted ? "Done ✓" : "Mark Done"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Corner: Mobile Subheader Toggle (Mobile Only, Clean Show/Hide Text) */}
        <div className="flex sm:hidden items-center">
          <button
            onClick={() => setShowSubheaderCard(!showSubheaderCard)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
              showSubheaderCard
                ? "bg-sky-600/20 text-sky-300 border-sky-500/40"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
            }`}
            title="Toggle Subheader Bar"
          >
            <span>{showSubheaderCard ? "Hide" : "Show"}</span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────────────────────
          FULL-WIDTH SUBHEADER CARD (CENTERED NOTES | CODE | OUTPUT SWITCHER + [ MORE... ] FLOATING MODAL)
          ───────────────────────────────────────────────────────────────────────────── */}
      {showSubheaderCard && (
        <div className="bg-slate-950 border-b border-slate-800 px-3 py-1.5 flex items-center justify-center sm:justify-between gap-2 shrink-0 z-20 animate-in slide-in-from-top-1 w-full">
          {/* Chapter Breadcrumb (Desktop / Tablet Only - Hidden on Mobile) */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono truncate min-w-0">
            <span className="text-sky-400 font-bold truncate">{courseTitle}</span>
            <span>/</span>
            <span className="text-slate-300 truncate">{lessonTitle}</span>
          </div>

          {/* Centered Switcher: Notes, Code, Output + [ ⚡ More... ] Button */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 shrink-0 mx-auto sm:mx-0">
            <button
              onClick={() => setMobileActiveView("notes")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                mobileActiveView === "notes" ? "bg-sky-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              📖 Notes
            </button>
            <button
              onClick={() => setMobileActiveView("code")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                mobileActiveView === "code" ? "bg-sky-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              💻 Code
            </button>
            <button
              onClick={() => { setMobileActiveView("output"); if (!activeRightPanel) setActiveRightPanel("flow"); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                mobileActiveView === "output" ? "bg-sky-600 text-white shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              ⚡ Output
            </button>

            {/* ⚡ More Button for Floating Modal */}
            <button
              onClick={() => setIsFloatingToolsModalOpen(true)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-xs flex items-center gap-1 ml-1"
              title="Open All Tools & Actions Pop-up"
            >
              <Sparkles className="size-3.5 fill-current" />
              <span>More...</span>
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────────
          FLOATING MODAL POP-UP (CONTAINS ALL DESKTOP TOOLS FOR MOBILE & COMPACT SCREENS)
          ───────────────────────────────────────────────────────────────────────────── */}
      {isFloatingToolsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg bg-slate-900 border border-sky-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 text-white max-h-[85vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-sky-600 text-white font-bold">
                  ⚡
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">Classroom Power Tools</h3>
                  <span className="text-[10px] text-slate-400 font-sans">Select any tool to practice or inspect</span>
                </div>
              </div>
              <button
                onClick={() => setIsFloatingToolsModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => { setActiveRightPanel("flow"); setMobileActiveView("output"); setIsFloatingToolsModalOpen(false); }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                  activeRightPanel === "flow" ? "bg-indigo-950/80 border-indigo-400 text-indigo-200 font-bold ring-1 ring-indigo-400/40" : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-400">
                  <Workflow className="size-4 text-indigo-400" />
                  <span>Live Flow</span>
                </div>
                <p className="text-[10px] text-slate-400">Laser execution flow diagram</p>
              </button>

              <button
                onClick={() => { setActiveRightPanel("vscode_guide"); setMobileActiveView("output"); setIsFloatingToolsModalOpen(false); }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                  activeRightPanel === "vscode_guide" ? "bg-amber-950/80 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/40" : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                  <Laptop className="size-4 text-amber-400" />
                  <span>VS Code Guide</span>
                </div>
                <p className="text-[10px] text-slate-400">File structure & commands</p>
              </button>

              <button
                onClick={() => { setActiveRightPanel("ai_tutor"); setMobileActiveView("output"); setIsFloatingToolsModalOpen(false); }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                  activeRightPanel === "ai_tutor" ? "bg-pink-950/80 border-pink-400 text-pink-200 font-bold ring-1 ring-pink-400/40" : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-pink-400">
                  <Sparkles className="size-4 text-pink-400" />
                  <span>AI Tutor</span>
                </div>
                <p className="text-[10px] text-slate-400">Clear doubts in simple words</p>
              </button>

              <button
                onClick={() => { setActiveRightPanel("memory"); setMobileActiveView("output"); setIsFloatingToolsModalOpen(false); }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                  activeRightPanel === "memory" ? "bg-purple-950/80 border-purple-400 text-purple-200 font-bold ring-1 ring-purple-400/40" : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-400">
                  <Layers className="size-4 text-purple-400" />
                  <span>Call Stack</span>
                </div>
                <p className="text-[10px] text-slate-400">Memory & call frames view</p>
              </button>

              <button
                onClick={() => { setActiveRightPanel("quiz"); setMobileActiveView("output"); setIsFloatingToolsModalOpen(false); }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                  activeRightPanel === "quiz" ? "bg-emerald-950/80 border-emerald-400 text-emerald-200 font-bold ring-1 ring-emerald-400/40" : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
                  <HelpCircle className="size-4 text-emerald-400" />
                  <span>Practice Quiz</span>
                </div>
                <p className="text-[10px] text-slate-400">Topic knowledge practice</p>
              </button>

              <button
                onClick={() => { setActiveRightPanel("interview"); setMobileActiveView("output"); setIsFloatingToolsModalOpen(false); }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer space-y-1 ${
                  activeRightPanel === "interview" ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold ring-1 ring-cyan-400/40" : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400">
                  <Award className="size-4 text-cyan-400" />
                  <span>Interview Q&amp;A</span>
                </div>
                <p className="text-[10px] text-slate-400">FAANG senior model answers</p>
              </button>
            </div>

            {/* Language Switcher, Voice Mic & Speaker */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Language:</span>
                <button
                  onClick={() => handleSetLanguage(language === "en" ? "hi" : "en")}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-sky-600 text-white cursor-pointer"
                >
                  {language === "en" ? "English (Switch HI)" : "Hindi (Switch EN)"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleListeningMic}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border cursor-pointer ${
                    isListeningMic ? "bg-rose-600 text-white animate-pulse border-rose-500" : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  <Mic className="size-3.5 text-rose-400" />
                  <span>{isListeningMic ? "Listening..." : "Mic"}</span>
                </button>

                <button
                  onClick={handleToggleVoice}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border cursor-pointer ${
                    isSpeaking ? "bg-emerald-600 text-white" : "bg-slate-900 text-slate-300 border-slate-800"
                  }`}
                >
                  {isSpeaking ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5 text-emerald-400" />}
                  <span>{isSpeaking ? "Stop Voice" : "Read Aloud"}</span>
                </button>
              </div>
            </div>

            {/* Navigation & Mark Done Buttons */}
            <div className="flex items-center gap-2 pt-1">
              {onPrevLesson && (
                <button
                  onClick={() => { onPrevLesson(); setIsFloatingToolsModalOpen(false); }}
                  className="flex-1 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white font-mono text-xs cursor-pointer"
                >
                  ⬅ Prev Lesson
                </button>
              )}
              {onNextLesson && (
                <button
                  onClick={() => { onNextLesson(); setIsFloatingToolsModalOpen(false); }}
                  className="flex-1 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white font-mono text-xs cursor-pointer"
                >
                  Next Lesson ➡
                </button>
              )}
              {onCompleteLesson && (
                <button
                  onClick={() => { onCompleteLesson(); setIsFloatingToolsModalOpen(false); }}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold font-mono text-xs cursor-pointer"
                >
                  {isCompleted ? "Done ✓" : "Mark Done"}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
{/* ─────────────────────────────────────────────────────────────────────────────
          2. MAIN UNIFIED 3-COLUMN WORKSPACE: FULL SCALE & SCROLLABLE
          ───────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* ═══════════════════════════════════════════════════════════════════════
            COLUMN 1 (LEFT): CONCEPT, DEFINITION, WHAT IT DOES & USE CASES
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className={`w-full lg:w-[360px] shrink-0 border-r border-slate-800 bg-slate-950 flex-col min-h-0 overflow-y-auto ${mobileActiveView === "notes" ? "flex flex-1" : "hidden lg:flex"}`}>
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
        <div className={`flex-1 flex-col min-h-0 bg-slate-950 border-r border-slate-800 ${mobileActiveView === "code" ? "flex w-full" : "hidden lg:flex"}`}>
          {/* File Switcher & Action Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs shrink-0 flex-wrap gap-2">
            {/* Multi-File Tabs with Clean Tech Icons */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveFile("server")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeFile === "server"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Cpu className="size-3 text-emerald-300" />
                <span>server.js</span>
              </button>
              <button
                onClick={() => setActiveFile("app")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeFile === "app"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="size-3 text-sky-300" />
                <span>App.jsx</span>
              </button>
              <button
                onClick={() => setActiveFile("html")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeFile === "html"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <FileText className="size-3 text-amber-300" />
                <span>index.html</span>
              </button>
              <button
                onClick={() => setActiveFile("css")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeFile === "css"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                <Palette className="size-3 text-indigo-300" />
                <span>style.css</span>
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
          <div className={`w-full lg:w-[400px] shrink-0 bg-slate-900 border-l border-slate-800 flex-col min-h-0 overflow-hidden shadow-2xl ${mobileActiveView === "output" ? "flex flex-1" : "hidden lg:flex"}`}>
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
                {activeRightPanel === "quiz" && (
                  <>
                    <HelpCircle className="size-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300 uppercase font-mono">
                      📝 Topic Knowledge Quiz
                    </span>
                  </>
                )}
                {activeRightPanel === "interview" && (
                  <>
                    <Award className="size-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-300 uppercase font-mono">
                      💼 Senior Interview Q&amp;A
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={() => { setActiveRightPanel(null); setMobileActiveView("notes"); }}
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
                  {/* Category Switcher: Node.js / React / Fullstack */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
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

                  {/* TAB 1: NODE.JS BACKEND SETUP */}
                  {activeVsCodeTab === "node" && (
                    <div className="space-y-3">
                      {/* Step 1: Folder Tree */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 max-w-full overflow-hidden">
                        <span className="text-xs font-bold text-amber-300 font-mono block">
                          📁 1. Node.js Files Kahan Create Karni Hain:
                        </span>
                        <pre className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300 leading-relaxed overflow-x-auto max-w-full whitespace-pre-wrap break-words">
                          {`my-node-app/
├── server.js         <-- Root folder me (Main backend file)
└── package.json      <-- Root folder me (Config file)`}
                        </pre>
                      </div>

                      {/* Step 2: Exact Terminal Commands */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 max-w-full overflow-hidden">
                        <span className="text-xs font-bold text-emerald-400 font-mono block">
                          🚀 2. VS Code Terminal me Run Karein:
                        </span>
                        <pre className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-300 leading-relaxed overflow-x-auto max-w-full whitespace-pre-wrap break-words">
                          {`# 1. Folder create karein aur enter karein
mkdir my-node-app && cd my-node-app

# 2. Package.json initialize karein
npm init -y

# 3. Dependencies install karein
npm install express cors dotenv

# 4. Run server file (server.js ko run karein)
node server.js`}
                        </pre>
                        <p className="text-[11px] text-slate-300 font-sans">
                          👉 Terminal me aayega: <code>Server active on http://localhost:5000</code>!
                        </p>
                      </div>

                      {/* Step 3: What to copy */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 max-w-full overflow-hidden">
                        <span className="text-xs font-bold text-emerald-400 font-mono block">
                          📝 3. File Contents (Copy server.js):
                        </span>
                        <div className="flex items-center justify-between text-[11px] bg-slate-900 p-2 rounded border border-slate-800">
                          <span className="font-mono text-slate-300">server.js</span>
                          <button
                            onClick={() => handleCopyCode("node_srv", serverCode)}
                            className="text-emerald-400 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                          >
                            {copiedId === "node_srv" ? "Copied ✓" : "Copy server.js Code"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: REACT FRONTEND SETUP */}
                  {activeVsCodeTab === "react" && (
                    <div className="space-y-3">
                      {/* Step 1: Folder Tree */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 max-w-full overflow-hidden">
                        <span className="text-xs font-bold text-amber-300 font-mono block">
                          📁 1. React Files Kahan Create Karni Hain:
                        </span>
                        <pre className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-cyan-300 leading-relaxed overflow-x-auto max-w-full whitespace-pre-wrap break-words">
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
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 max-w-full overflow-hidden">
                        <span className="text-xs font-bold text-sky-400 font-mono block">
                          🚀 2. VS Code Terminal me Run Karein:
                        </span>
                        <pre className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-sky-300 leading-relaxed overflow-x-auto max-w-full whitespace-pre-wrap break-words">
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
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 max-w-full overflow-hidden">
                        <span className="text-xs font-bold text-sky-400 font-mono block">
                          📝 3. File Contents (Copy App.jsx):
                        </span>
                        <div className="flex items-center justify-between text-[11px] bg-slate-900 p-2 rounded border border-slate-800">
                          <span className="font-mono text-slate-300">src/App.jsx</span>
                          <button
                            onClick={() => handleCopyCode("react_app", appCode)}
                            className="text-sky-400 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                          >
                            {copiedId === "react_app" ? "Copied ✓" : "Copy App.jsx Code"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: FULLSTACK INTEGRATION */}
                  {activeVsCodeTab === "fullstack" && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 max-w-full overflow-hidden">
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

              {/* TOOL E: 📝 INTERACTIVE TOPIC QUIZ & PRACTICE */}
              {activeRightPanel === "quiz" && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 font-mono uppercase">
                        Question 1 of 1 · Practice Quiz
                      </span>
                      <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">
                        Instant Feedback
                      </Badge>
                    </div>

                    <p className="text-xs text-white font-sans font-medium leading-relaxed">
                      {language === "hi"
                        ? `इस टॉपिक (${topicData.title}) के संदर्भ में सबसे मुख्य और सही कथन कौन-सा है?`
                        : `What is the primary architectural purpose and rule for ${topicData.title}?`}
                    </p>

                    <div className="space-y-2">
                      {[
                        topicData.seniorRule,
                        "It blocks all concurrent user connections until memory is completely freed.",
                        "It is only used in frontend browsers and cannot run on server environments.",
                        "It replaces all database indexes and removes the need for error handling."
                      ].map((opt, optIdx) => {
                        const isSelected = selectedQuizOption === optIdx;
                        const isCorrect = optIdx === 0;

                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              setSelectedQuizOption(optIdx);
                              setIsQuizSubmitted(true);
                            }}
                            className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                              isQuizSubmitted
                                ? isCorrect
                                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold ring-1 ring-emerald-400/40"
                                  : isSelected
                                  ? "bg-rose-950/80 border-rose-500 text-rose-200 ring-1 ring-rose-400/40"
                                  : "bg-slate-900/40 border-slate-800 text-slate-500"
                                : isSelected
                                ? "bg-sky-950 border-sky-400 text-sky-200 font-bold"
                                : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="flex size-4 items-center justify-center rounded bg-slate-800 text-[10px] font-mono shrink-0 mt-0.5">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="leading-relaxed">{opt}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {isQuizSubmitted && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 animate-in fade-in">
                        <span className={`font-bold font-mono text-xs block ${selectedQuizOption === 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {selectedQuizOption === 0 ? "🎉 Correct Answer!" : "❌ Incorrect Choice!"}
                        </span>
                        <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                          <strong>Explanation:</strong> {topicData.seniorRule}. {topicData.definition}
                        </p>
                        <button
                          onClick={() => {
                            setIsQuizSubmitted(false);
                            setSelectedQuizOption(null);
                          }}
                          className="mt-1 text-[10px] text-sky-400 hover:text-sky-300 font-mono font-bold cursor-pointer"
                        >
                          ↻ Try Quiz Again
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TOOL F: 💼 TOP INTERVIEW QUESTIONS & MODEL ANSWERS */}
              {activeRightPanel === "interview" && (
                <div className="space-y-3 text-xs">
                  {[
                    {
                      q: `How does ${topicData.title} work under the hood in production?`,
                      a: `${topicData.definition} Under the hood, it executes predictably in the Call Stack and delegates async operations to non-blocking runtime workers, avoiding event loop deadlocks.`
                    },
                    {
                      q: `What is the biggest pitfall or mistake developers make with ${topicData.title}?`,
                      a: `Mistake: ${topicData.withoutThis} Senior developers follow this golden rule: "${topicData.seniorRule}".`
                    },
                    {
                      q: `Why should an engineering team adopt ${topicData.title}?`,
                      a: `Key Superpower: ${topicData.withThis} It provides high throughput, clean separation of concerns, and robust error resilience.`
                    }
                  ].map((qa, iIdx) => {
                    const isRevealed = Boolean(revealedInterviewQuestions[iIdx]);

                    return (
                      <div key={iIdx} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-white font-mono text-xs flex items-start gap-1.5">
                            <span className="text-cyan-400 font-extrabold">Q{iIdx + 1}:</span>
                            <span>{qa.q}</span>
                          </span>
                        </div>

                        <button
                          onClick={() => setRevealedInterviewQuestions(prev => ({ ...prev, [iIdx]: !prev[iIdx] }))}
                          className="text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1"
                        >
                          {isRevealed ? "Hide Answer ▲" : "Reveal Senior Answer ▼"}
                        </button>

                        {isRevealed && (
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-[11px] text-slate-300 font-sans leading-relaxed animate-in fade-in space-y-1">
                            <span className="text-[10px] font-mono font-bold text-emerald-400 block">
                              Model Answer (FAANG Standard):
                            </span>
                            <p>{qa.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────────
          7. CURRICULUM & CHAPTERS SIDEBAR DRAWER (SLIDE-IN FROM LEFT)
          ───────────────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isChaptersDrawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChaptersDrawerOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs cursor-pointer"
            />

            {/* Slide-in Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="relative w-full max-w-sm sm:max-w-md bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col h-full z-10 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                    <ListOrdered className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white font-mono truncate">
                      Course Curriculum
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      {courseTitle || "All Chapters & Learning Phases"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsChaptersDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Search Bar & Quick Stats */}
              <div className="p-3 border-b border-slate-800 bg-slate-950/50 space-y-2 shrink-0">
                <div className="relative">
                  <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={chapterSearchQuery}
                    onChange={(e) => setChapterSearchQuery(e.target.value)}
                    placeholder="Search React, JS, CSS, HTML..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                  />
                  {chapterSearchQuery && (
                    <button
                      onClick={() => setChapterSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                  <span>{filteredChapters.length} Lessons in Syllabus</span>
                  <span className="text-sky-400 font-bold">1-Click Jump</span>
                </div>
              </div>

              {/* Grouped Chapters List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {Object.entries(
                  filteredChapters.reduce((acc, ch) => {
                    const group = ch.moduleTitle || "General Curriculum";
                    if (!acc[group]) acc[group] = [];
                    acc[group].push(ch);
                    return acc;
                  }, {} as Record<string, typeof filteredChapters>)
                ).map(([groupTitle, chapters], gIdx) => {
                  const getTechBadge = (title: string) => {
                    const lower = title.toLowerCase();
                    if (lower.includes("html")) return { label: "HTML5", color: "bg-orange-500/10 text-orange-400 border-orange-500/30" };
                    if (lower.includes("css") || lower.includes("responsive")) return { label: "CSS3", color: "bg-sky-500/10 text-sky-400 border-sky-500/30" };
                    if (lower.includes("react")) return { label: "React.js", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" };
                    if (lower.includes("javascript") || lower.includes("js")) return { label: "JavaScript", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" };
                    if (lower.includes("node")) return { label: "Node.js", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" };
                    if (lower.includes("typescript")) return { label: "TypeScript", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" };
                    return { label: `Phase ${gIdx + 1}`, color: "bg-purple-500/10 text-purple-400 border-purple-500/30" };
                  };

                  const badge = getTechBadge(groupTitle);

                  return (
                    <div key={groupTitle} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 px-2 py-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs font-bold text-slate-300 font-mono truncate">
                            {groupTitle}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {chapters.length} topics
                        </span>
                      </div>

                      <div className="space-y-1">
                        {chapters.map((ch, cIdx) => {
                          const isCurrent = ch.id === currentLessonId;

                          return (
                            <button
                              key={ch.id}
                              onClick={() => {
                                setIsChaptersDrawerOpen(false);
                                if (onSelectChapter) {
                                  onSelectChapter(ch.id);
                                } else if (typeof window !== "undefined") {
                                  window.location.href = `/dashboard/learn/${ch.id}`;
                                }
                              }}
                              className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                                isCurrent
                                  ? "bg-sky-950/80 border-sky-500/80 text-sky-200 shadow-md ring-1 ring-sky-500/30"
                                  : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className={`size-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                                  isCurrent
                                    ? "bg-sky-500 text-slate-950 font-extrabold"
                                    : "bg-slate-800 text-slate-400"
                                }`}>
                                  {cIdx + 1}
                                </span>
                                <span className="text-xs font-semibold truncate leading-tight">
                                  {formatCleanLessonTitle(ch.title)}
                                </span>
                              </div>

                              <div className="shrink-0 flex items-center gap-1">
                                {isCurrent ? (
                                  <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20 animate-pulse">
                                    Current
                                  </span>
                                ) : (
                                  <Play className="size-3 text-slate-500 group-hover:text-white" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Clean Pedagogical Topic Breakdown Generator (Ultra-Simple Words for 110 Chapters)
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

  // 1. Chapter 1: Getting Started with Node.js & HTTP Server
  if (combined.includes("getting started") || combined.includes("chapter 1") || combined.includes("hello world")) {
    return {
      title: "Getting started with Node.js",
      definition:
        language === "hi"
          ? "Node.js एक ओपन-सोर्स JavaScript रनटाइम एनवायरनमेंट है जो Chrome के V8 इंजन पर चलता है। यह आपको ब्राउज़र के बाहर सर्वर पर JavaScript कोड चलाने की ताकत देता है।"
          : "Node.js is an open-source, cross-platform JavaScript runtime built on Chrome's V8 engine that executes JavaScript code outside a web browser to build fast backend servers.",
      whatItDoes:
        language === "hi"
          ? [
              "बिना किसी Apache या IIS के सीधे JavaScript से HTTP वेब सर्वर बनाता है.",
              "Non-blocking I/O मॉडल के ज़रिए एक ही समय में हज़ारों यूज़र्स की रिक्वेस्ट संभालता है.",
              "REPL और CLI कमांड्स के ज़रिए टर्मिनल में तुरंत कोड टेस्ट करने की सुविधा देता है.",
            ]
          : [
              "Creates lightweight, event-driven HTTP servers without complex server software.",
              "Handles thousands of concurrent connections using single-threaded non-blocking I/O.",
              "Provides an interactive REPL and command-line execution environment.",
            ],
      useCases:
        language === "hi"
          ? ["RESTful API बैकएंड सर्वर", "रीयल-टाइम चैट और स्ट्रीमिंग ऐप्स", "माइक्रोसर्विसेज़ आर्किटेक्चर"]
          : ["High-speed REST API servers", "Real-time chat & websocket backends", "Lightweight microservices"],
      syntaxSnippet: `const http = require('http');\nconst server = http.createServer((req, res) => {\n  res.writeHead(200, { 'Content-Type': 'text/plain' });\n  res.end('Hello World\\n');\n});\nserver.listen(1337, '127.0.0.1');`,
      seniorRule:
        language === "hi"
          ? "हमेशा सर्वर को किसी पोर्ट पर listen() कराएं और रिस्पॉन्स के अंत में res.end() लिखना न भूलें!"
          : "Always close HTTP response streams with res.end() or res.json() to prevent client socket hangs.",
      withoutThis:
        language === "hi"
          ? "JavaScript सिर्फ ब्राउज़र में चलती थी, बैकएंड के लिए PHP या Java सीखना पड़ता था!"
          : "JavaScript was strictly confined to browsers; backends required different languages.",
      withThis:
        language === "hi"
          ? "Frontend और Backend दोनों जगह एक ही भाषा (JavaScript) का इस्तेमाल होता है!"
          : "Full-stack development unified in a single, high-performance JavaScript language!",
      flowSteps: [
        {
          phase: "1. Server Initialization",
          whatHappens: language === "hi" ? "http.createServer() ने लिसनर रजिस्टर किया।" : "Node.js binds HTTP server to port 1337.",
          dataState: "Port: 1337 bound on 127.0.0.1",
        },
        {
          phase: "2. Incoming Connection",
          whatHappens: language === "hi" ? "क्लाइंट ने GET रिक्वेस्ट भेजी।" : "Client TCP handshake accepted into Event Loop.",
          dataState: "Req: IncomingMessage stream opened",
        },
        {
          phase: "3. Headers & Payload Writing",
          whatHappens: language === "hi" ? "res.writeHead(200) सेट हुआ।" : "HTTP 200 OK headers pushed to response buffer.",
          dataState: "Status: 200 OK Content-Type: text/plain",
        },
        {
          phase: "4. Response Termination",
          whatHappens: language === "hi" ? "res.end('Hello World') से डेटा डिलीवर हुआ।" : "Response body flushed and connection cleanly closed.",
          dataState: "Payload: 'Hello World\\n' delivered",
        },
      ],
    };
  }

  // 2. Chapter 2: npm (Node Package Manager)
  if (combined.includes("npm") || combined.includes("chapter 2") || combined.includes("package.json")) {
    return {
      title: "npm - Node Package Manager",
      definition:
        language === "hi"
          ? "npm दुनिया की सबसे बड़ी सॉफ्टवेयर रजिस्ट्री है। यह Node.js के लिए पैकेज मैनेजर है, जो बाहरी लाइब्रेरीज (Express, Mongoose, Lodash) को इंस्टॉल, शेयर और मैनेज करने में मदद करता है।"
          : "npm is the default package manager for Node.js and the world's largest software registry. It handles dependency resolution, installation, and semantic versioning.",
      whatItDoes:
        language === "hi"
          ? [
              "`npm install <package>` से लाखों ओपन-सोर्स पैकेजेस 1 सेकंड में डाउनलोड करता है.",
              "`package.json` में प्रोजेक्ट की सारी डिपेंडेंसीज और वर्जन रिकॉर्ड रखता है.",
              "`npm run <script>` से ऑटोमेशन और बिल्ड स्क्रिप्ट्स चलाता है.",
            ]
          : [
              "Downloads and manages third-party libraries inside node_modules directory.",
              "Maintains project metadata and dependencies in package.json.",
              "Executes custom lifecycle scripts like dev, build, and test.",
            ],
      useCases:
        language === "hi"
          ? ["Express, CORS, Dotenv जैसे पैकेजेस इंस्टॉल करना", "प्रोजेक्ट का वर्जन मैनेज करना", "NPM पर अपना पैकेज पब्लिश करना"]
          : ["Installing backend frameworks and utilities", "Managing semantic versioning (^1.0.0)", "Publishing custom enterprise modules"],
      syntaxSnippet: `# Install dependencies:\nnpm install express cors dotenv\n\n# Run development script:\nnpm run dev`,
      seniorRule:
        language === "hi"
          ? "node_modules फोल्डर को कभी Git पर पुश मत करो, हमेशा .gitignore में रखो!"
          : "Always add node_modules to .gitignore; commit package.json and package-lock.json instead.",
      withoutThis:
        language === "hi"
          ? "हर लाइब्रेरी को मैन्युअल डाउनलोड करके फाइलों को प्रोजेक्ट में कॉपी करना पड़ता था!"
          : "Manually downloading, linking, and maintaining versions of third-party zip files.",
      withThis:
        language === "hi"
          ? "1 कमांड में पूरी दुनिया के कोड को अपने प्रोजेक्ट में इस्तेमाल कर सकते हैं!"
          : "Instant dependency management and reproducible installs across all machines!",
      flowSteps: [
        {
          phase: "1. Read package.json",
          whatHappens: language === "hi" ? "npm ने dependencies लिस्ट को पढ़ा।" : "npm reads required packages from package.json.",
          dataState: "Dependencies: { express: '^4.18.2' }",
        },
        {
          phase: "2. Registry Resolution",
          whatHappens: language === "hi" ? "NPM रजिस्ट्री से tarball डाउनलोड हुआ।" : "Resolves exact versions and downloads tarballs from registry.",
          dataState: "Network: Fetching from registry.npmjs.org",
        },
        {
          phase: "3. Dependency Tree Extraction",
          whatHappens: language === "hi" ? "node_modules फोल्डर में पैकेज एक्सट्रेक्ट हुए।" : "Extracts code into node_modules and writes package-lock.json.",
          dataState: "Disk: node_modules tree written",
        },
      ],
    };
  }

  // 3. Chapter 3: Web Apps With Express
  if (combined.includes("express") || combined.includes("chapter 3") || combined.includes("middleware")) {
    return {
      title: "Web Apps With Express",
      definition:
        language === "hi"
          ? "Express एक तेज़, फ्लेक्सिबल और मिनिमल Node.js वेब फ्रेमवर्क है जो शक्तिशाली राउटिंग, मिडलवेयर और JSON API आर्किटेक्चर प्रदान करता है।"
          : "Express is a minimal and flexible Node.js web application framework that provides robust routing, middleware pipelines, and HTTP utilities.",
      whatItDoes:
        language === "hi"
          ? [
              "GET, POST, PUT, DELETE जैसे HTTP रूट्स को 1 लाइन में हैंडल करता है.",
              "मिडलवेयर (जैसे app.use(express.json())) से रिक्वेस्ट को प्रोसेस और वैलिडेट करता है.",
              "JSON API और स्टैटिक फाइल्स को सुपरफास्ट स्पीड से सर्व करता है.",
            ]
          : [
              "Simplifies HTTP routing for GET, POST, PUT, DELETE endpoints.",
              "Executes layered middleware pipelines for authentication and parsing.",
              "Serves dynamic JSON responses and static web assets seamlessly.",
            ],
      useCases:
        language === "hi"
          ? ["RESTful CRUD APIs", "यूजर ऑथेंटिकेशन और टोकन वेरिफिकेशन", "सिंगल पेज ऐप का बैकएंड सर्वर"]
          : ["Enterprise REST APIs", "JWT Auth and security filters", "Full-stack application backends"],
      syntaxSnippet: `const express = require('express');\nconst app = express();\n\napp.use(express.json());\n\napp.get('/api/users', (req, res) => {\n  res.json([{ id: 1, name: 'Aman' }]);\n});\n\napp.listen(5000);`,
      seniorRule:
        language === "hi"
          ? "Middleware के अंत में next() कॉल करना कभी न भूलें, वरना रिक्वेस्ट लटक जाएगी!"
          : "Always call next() in custom middleware to prevent request pipeline deadlocks.",
      withoutThis:
        language === "hi"
          ? "रॉ Node.js में URL पार्स करने और रिक्वेस्ट बॉडी पढ़ने में 50+ लाइन का कोड लिखना पड़ता था!"
          : "Writing 50+ lines of low-level boilerplate just to parse URLs and incoming request buffers.",
      withThis:
        language === "hi"
          ? "3 लाइन में पूरा REST API रूट तैयार हो जाता है!"
          : "Write production-ready, clean REST endpoints in 3 lines of readable code!",
      flowSteps: [
        {
          phase: "1. HTTP Request Arrival",
          whatHappens: language === "hi" ? "क्लाइंट ने GET /api/users भेजा।" : "Incoming HTTP request enters Express middleware stack.",
          dataState: "HTTP: GET /api/users Header",
        },
        {
          phase: "2. Middleware & Route Match",
          whatHappens: language === "hi" ? "CORS और JSON पार्सर के बाद रूट मैच हुआ।" : "Express matches path in route table.",
          dataState: "Handler: (req, res) invoked",
        },
        {
          phase: "3. Controller Resolution",
          whatHappens: language === "hi" ? "कंट्रोलर ने डेटाबेस से डेटा निकाला।" : "Business logic fetches requested JSON payload.",
          dataState: "Payload: [{ id: 1, name: 'Aman' }]",
        },
        {
          phase: "4. JSON Response Sent",
          whatHappens: language === "hi" ? "200 OK के साथ JSON रिटर्न हुआ।" : "res.json(data) returns HTTP 200 OK payload.",
          dataState: "Network: HTTP 200 OK application/json",
        },
      ],
    };
  }

  // 4. Chapter 4: Filesystem I/O
  if (combined.includes("filesystem") || combined.includes("chapter 4") || combined.includes("fs")) {
    return {
      title: "Filesystem I/O (fs module)",
      definition:
        language === "hi"
          ? "Node.js का `fs` (FileSystem) मॉड्यूल फाइलों को पढ़ने, लिखने, डिलीट करने और डायरेक्टरी स्कैन करने के लिए नॉन-ब्लॉकिंग Asynchronous मेथड्स प्रदान करता है।"
          : "The Node.js `fs` module provides asynchronous, non-blocking APIs to interact with the file system for reading, writing, updating, and streaming files.",
      whatItDoes:
        language === "hi"
          ? [
              "फाइलों को बिना सर्वर को रोके Asynchronously पढ़ता (`fs.readFile`) और लिखता है.",
              "बड़ी फाइलों को मेमोरी क्रैश किए बिना Streams (`fs.createReadStream`) से ट्रांसफर करता है.",
              "फोल्डर बनाने, रीनेम करने और फाइल डिलीट (`fs.unlink`) करने की सुविधा देता है.",
            ]
          : [
              "Reads and writes files asynchronously without blocking the event loop.",
              "Streams huge files chunk-by-chunk using minimal RAM.",
              "Provides directory traversal, file watching, and deletion utilities.",
            ],
      useCases:
        language === "hi"
          ? ["सर्वर लॉग्स फाइल में सेव करना", "यूजर की अपलोड की गई फाइल्स प्रोसेस करना", "कॉन्फिगरेशन JSON फाइल्स लोड करना"]
          : ["Writing application access logs", "Handling multipart file uploads", "Loading local configuration JSON"],
      syntaxSnippet: `const fs = require('fs/promises');\n\nasync function readFile() {\n  const data = await fs.readFile('notes.txt', 'utf8');\n  console.log(data);\n}`,
      seniorRule:
        language === "hi"
          ? "प्रोडक्शन में कभी Synchronous मेथड्स (जैसे readFileSync) मत यूज़ करो, वरना पूरे सर्वर की स्पीड धीमी हो जाएगी!"
          : "Never use synchronous methods (readFileSync) in production request paths as they block the V8 thread.",
      withoutThis:
        language === "hi"
          ? "बड़ी फाइल पढ़ते ही पूरा सर्वर फ्रीज हो जाता था और दूसरे यूजर्स इंतजार करते रहते थे!"
          : "File operations blocked the server thread, freezing response times for all users.",
      withThis:
        language === "hi"
          ? "लाखों फाइल्स बैकग्राउंड में नॉन-ब्लॉकिंग तरीके से प्रोसेस होती हैं!"
          : "Non-blocking background I/O handles file operations with zero impact on latency!",
      flowSteps: [
        {
          phase: "1. File Read Request",
          whatHappens: language === "hi" ? "fs.readFile() कॉल हुआ।" : "V8 delegates file read syscall to Libuv thread pool.",
          dataState: "Syscall: UV_FS_READ delegated",
        },
        {
          phase: "2. Non-blocking Background Read",
          whatHappens: language === "hi" ? "ऑपरेटिंग सिस्टम ने फाइल डिस्क से पढ़ी।" : "OS kernel reads bytes from SSD into buffer.",
          dataState: "Buffer: Chunks read into RAM",
        },
        {
          phase: "3. Callback Resolution",
          whatHappens: language === "hi" ? "डेटा UTF-8 स्ट्रिंग में कन्वर्ट होकर मिला।" : "Promise resolves with file string contents.",
          dataState: "Resolved: UTF-8 String output",
        },
      ],
    };
  }

  // 5. Default Clean Breakdown for any other chapter in 110 Chapters
  return {
    title: topicTitle || lessonTitle,
    definition:
      lessonExplanation ||
      (language === "hi"
        ? `${topicTitle || lessonTitle} Node.js एंटरप्राइज बैकएंड का एक महत्वपूर्ण चैप्टर है जो आपके कोड को स्केलेबल, तेज़ और सुरक्षित बनाता है।`
        : `${topicTitle || lessonTitle} is an essential chapter from the Node.js enterprise curriculum designed for high-performance backend engineering.`),
    whatItDoes:
      concepts && concepts.length > 0
        ? concepts.map((c) => (language === "hi" ? `${c.title}: ${c.description}` : `${c.title}: ${c.description}`))
        : [
            language === "hi"
              ? "इनपुट डेटा को प्रोसेस करके सही आउटपुट देता है."
              : "Processes inputs predictably and outputs expected results.",
            language === "hi"
              ? "कोड को समझने लायक मॉड्यूल्स में बांटता है."
              : "Divides complex code into clean, modular building blocks.",
            language === "hi"
              ? "एरर्स और अनपेक्षित बग्स को रोकता है."
              : "Guards against runtime errors and state corruption.",
          ],
    useCases:
      language === "hi"
        ? ["हाई-कन्करेंसी प्रोडक्शन बैकएंड्स", "डेटाबेस ट्रांजेक्शन और ऑथेंटिकेशन", "माइक्रोसर्विसेज और रीयल-टाइम कम्यूनिकेशन"]
        : ["High-concurrency production web servers", "Database transactions and caching", "Microservices & distributed architectures"],
    syntaxSnippet:
      examples[0]?.solutionCode ||
      examples[0]?.starterCode ||
      `// ${topicTitle || lessonTitle} Pattern\nconst express = require('express');\nconst app = express();\n\napp.use(express.json());\napp.listen(5000);`,
    seniorRule:
      language === "hi"
        ? "हमेशा साफ़, प्रेडिक्टेबल और टेस्टेबल कोड लिखें, और एरर्स को सही तरीके से कैच करें!"
        : "Always write clean, deterministic, and modular code with proper error boundaries.",
    withoutThis:
      language === "hi"
        ? "कोड उलझ जाता था और प्रोडक्शन में बग्स ढूंढना मुश्किल होता था।"
        : "Fragile monolithic code prone to unhandled exceptions and performance bottlenecks.",
    withThis:
      language === "hi"
        ? "साफ़-सुथरा कोड जिसे कोई भी आसानी से समझ, टेस्ट और डिप्लॉय कर सकता है!"
        : "Clean, enterprise-grade architecture that scales effortlessly!",
    flowSteps: [
      {
        phase: "1. Input Trigger & Call",
        whatHappens: language === "hi" ? "इनपुट डेटा सिस्टम में आया।" : "Input data enters the execution pipeline.",
        dataState: "State: PENDING in Event Queue",
      },
      {
        phase: "2. Business Logic Execution",
        whatHappens: language === "hi" ? "कोर लॉजिक ने डेटा प्रोसेस किया।" : "Core algorithm processes logic in Call Stack.",
        dataState: "State: COMPUTING in Heap Memory",
      },
      {
        phase: "3. Asynchronous Resolution",
        whatHappens: language === "hi" ? "सफलतापूर्वक रिजल्ट मिला।" : "Clean result returned to caller and UI rendered.",
        dataState: "State: 200 OK / Output Resolved",
      },
    ],
  };
}