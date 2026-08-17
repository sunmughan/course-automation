"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Lightbulb,
  Code2,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Workflow,
  Radio,
  Send,
  Loader2,
  GraduationCap,
  BookOpen,
  Check,
  Flame,
  Zap,
  Activity,
  Cpu,
  Layers,
  ShieldCheck,
  FastForward,
  Smile,
  BrainCircuit,
  AlertTriangle,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { speakText, stopSpeaking } from "@/lib/speech";
import { getAuthHeaders } from "@/lib/fetch-helpers";

export type ExplanationLanguage = "en" | "hi";
export type ExplanationSimplicityMode = "easy" | "standard";

export interface FlowStepNode {
  id: string;
  stepNumber: number;
  labelEn: string;
  labelHi: string;
  sublabelEn?: string;
  sublabelHi?: string;
  phaseEn: string;
  phaseHi: string;
  whatHappensEn: string;
  whatHappensHi: string;
  dataStateEn: string;
  dataStateHi: string;
  ruleEn: string;
  ruleHi: string;
  color: string;
}

export interface WhiteboardScene {
  id: string;
  sceneNumber: number;
  titleEn: string;
  titleHi: string;
  subtitleEn?: string;
  subtitleHi?: string;
  type: "concept" | "architecture" | "code_breakdown" | "deep_dive" | "quiz";
  handwrittenNotesEn: string[];
  handwrittenNotesHi: string[];
  explanationEn: string;
  explanationHi: string;
  analogyEn?: string;
  analogyHi?: string;
  // Easy Learning & Memory Fields
  easySummaryEn?: string;
  easySummaryHi?: string;
  memoryTrickEn?: string;
  memoryTrickHi?: string;
  problemVsSolutionEn?: { without: string; with: string };
  problemVsSolutionHi?: { without: string; with: string };
  diagramNodes?: FlowStepNode[];
  codeSnippet?: {
    language: string;
    code: string;
    highlightLines?: number[];
  };
  keyTakeawaysEn: string[];
  keyTakeawaysHi: string[];
  quizQuestion?: {
    questionEn: string;
    questionHi: string;
    optionsEn: string[];
    optionsHi: string[];
    correctIndex: number;
    explanationEn: string;
    explanationHi: string;
  };
}

interface WhiteboardLessonExplainerProps {
  lessonTitle: string;
  topicTitle: string;
  courseTitle: string;
  moduleTitle: string;
  lessonContent: string;
  lessonExplanation?: string;
  concepts: Array<{ id: string; title: string; description: string }>;
  examples: Array<{ id: string; title: string; description: string; starterCode: string; solutionCode: string }>;
  visualizations?: Array<{ id: string; type: string; title: string; config: string }>;
  onOpenPlayground?: () => void;
  onOpenAITutor?: (prompt?: string) => void;
}

export function WhiteboardLessonExplainer({
  lessonTitle,
  topicTitle,
  courseTitle,
  moduleTitle,
  lessonContent,
  lessonExplanation,
  concepts,
  examples,
  visualizations,
  onOpenPlayground,
  onOpenAITutor,
}: WhiteboardLessonExplainerProps) {
  // English is default language; persisted across all courses until user changes it
  const [language, setLanguage] = useState<ExplanationLanguage>("en");
  // Default to "easy" simplicity mode for effortless understanding
  const [simplicityMode, setSimplicityMode] = useState<ExplanationSimplicityMode>("easy");
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [showQuizFeedback, setShowQuizFeedback] = useState(false);
  const [isVoiceNarrationActive, setIsVoiceNarrationActive] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [aiQuickAnswer, setAiQuickAnswer] = useState<string | null>(null);
  const [isAiAnswering, setIsAiAnswering] = useState(false);
  const [showVisualizerFlow, setShowVisualizerFlow] = useState(true);
  const [activeFlowStep, setActiveFlowStep] = useState(0);
  const [isFlowAutoPlaying, setIsFlowAutoPlaying] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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
    setIsVoiceNarrationActive(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred_explanation_language", newLang);
      window.dispatchEvent(new CustomEvent("languagechange", { detail: newLang }));
    }
  };

  // Generate multi-lingual scenes with easy memory tricks
  const scenes = useMemo(() => {
    return generateBilingualWhiteboardScenes({
      lessonTitle,
      topicTitle,
      lessonContent,
      lessonExplanation,
      concepts,
      examples,
    });
  }, [lessonTitle, topicTitle, lessonContent, lessonExplanation, concepts, examples]);

  const currentScene = scenes[currentSceneIndex] || scenes[0];

  // Auto-advance flow steps when isFlowAutoPlaying is true
  useEffect(() => {
    if (!isFlowAutoPlaying || !currentScene.diagramNodes || currentScene.diagramNodes.length <= 1) return;
    const interval = setInterval(() => {
      setActiveFlowStep((prev) => (prev + 1) % (currentScene.diagramNodes?.length || 1));
    }, 3500);
    return () => clearInterval(interval);
  }, [isFlowAutoPlaying, currentScene.diagramNodes]);

  // Stop voice narration on unmount or scene change
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handleSpeakCurrentScene = useCallback(() => {
    if (isVoiceNarrationActive) {
      stopSpeaking();
      setIsVoiceNarrationActive(false);
      return;
    }

    const textToSpeak =
      language === "hi"
        ? `${currentScene.titleHi}. ${currentScene.easySummaryHi || ""}. ${currentScene.handwrittenNotesHi.join(". ")}. ${currentScene.explanationHi}`
        : `${currentScene.titleEn}. ${currentScene.easySummaryEn || ""}. ${currentScene.handwrittenNotesEn.join(". ")}. ${currentScene.explanationEn}`;

    speakText({
      text: textToSpeak,
      lang: language,
      rate: playbackSpeed,
      onStart: () => setIsVoiceNarrationActive(true),
      onEnd: () => setIsVoiceNarrationActive(false),
      onError: () => setIsVoiceNarrationActive(false),
    });
  }, [currentScene, language, playbackSpeed, isVoiceNarrationActive]);

  // Voice Input (Microphone Assistant)
  const toggleListeningMic = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Microphone voice recognition is not supported in this browser. Please use Chrome, Edge, or Brave.");
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
        setAiQuickAnswer(null);
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
          await askAiVoiceDoubt(spokenTranscript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListeningMic(false);
    }
  }, [isListeningMic, language, spokenTranscript]);

  const askAiVoiceDoubt = async (question: string) => {
    setIsAiAnswering(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          message: `Explain in super simple words with an everyday real-life analogy: ${question}`,
          mode: "socratic",
          lessonTitle,
          topicTitle,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.message?.content || data.response || "Concept explained clearly.";
        setAiQuickAnswer(text);
        speakText({
          text,
          lang: language,
          rate: playbackSpeed,
        });
      }
    } catch {
      setAiQuickAnswer(
        language === "hi"
          ? "माफ़ कीजिए, अभी जवाब नहीं मिल पाया। कृपया दोबारा पूछें।"
          : "Sorry, could not fetch answer right now. Please try again."
      );
    } finally {
      setIsAiAnswering(false);
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Scene navigation
  const handleNext = () => {
    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex((prev) => prev + 1);
      setSelectedQuizAnswer(null);
      setShowQuizFeedback(false);
      setActiveFlowStep(0);
      setIsFlowAutoPlaying(false);
      stopSpeaking();
      setIsVoiceNarrationActive(false);
    }
  };

  const handlePrev = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex((prev) => prev - 1);
      setSelectedQuizAnswer(null);
      setShowQuizFeedback(false);
      setActiveFlowStep(0);
      setIsFlowAutoPlaying(false);
      stopSpeaking();
      setIsVoiceNarrationActive(false);
    }
  };

  const activeTitle = language === "hi" ? currentScene.titleHi : currentScene.titleEn;
  const activeSubtitle = language === "hi" ? currentScene.subtitleHi : currentScene.subtitleEn;
  const activeExplanation = language === "hi" ? currentScene.explanationHi : currentScene.explanationEn;
  const activeAnalogy = language === "hi" ? currentScene.analogyHi : currentScene.analogyEn;
  const activeNotes = language === "hi" ? currentScene.handwrittenNotesHi : currentScene.handwrittenNotesEn;
  const activeKeyTakeaways = language === "hi" ? currentScene.keyTakeawaysHi : currentScene.keyTakeawaysEn;
  const activeEasySummary = language === "hi" ? currentScene.easySummaryHi : currentScene.easySummaryEn;
  const activeMemoryTrick = language === "hi" ? currentScene.memoryTrickHi : currentScene.memoryTrickEn;
  const activeProblemVsSolution = language === "hi" ? currentScene.problemVsSolutionHi : currentScene.problemVsSolutionEn;
  const activeNodes = currentScene.diagramNodes || [];
  const currentActiveNode = activeNodes[activeFlowStep] || activeNodes[0];

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col h-full bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden select-none ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "min-h-[640px]"
      }`}
    >
      {/* Top Classroom Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md shrink-0">
        {/* Left: Course & Scene Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-md">
            <GraduationCap className="size-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 font-mono">
                {courseTitle}
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-xs text-slate-400 font-medium">{moduleTitle}</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {lessonTitle} · {topicTitle}
            </h2>
          </div>
        </div>

        {/* Right: Simplicity Mode, Language, Voice Narrator, Mic, Visualizer, Fullscreen */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Easy Learning Mode Switcher (ELI5) */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSimplicityMode("easy")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                simplicityMode === "easy"
                  ? "bg-amber-500 text-slate-950 shadow-xs font-extrabold"
                  : "text-amber-400 hover:text-white"
              }`}
              title="Super Simple Everyday Explanation & Memory Tricks"
            >
              <Smile className="size-3.5 fill-current" />
              <span>{language === "hi" ? "आसान भाषा (Easy)" : "Easy Mode (ELI5)"}</span>
            </button>
            <button
              onClick={() => setSimplicityMode("standard")}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                simplicityMode === "standard"
                  ? "bg-slate-800 text-sky-400 shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Standard Architectural Details"
            >
              <span>{language === "hi" ? "स्टैंडर्ड" : "Standard"}</span>
            </button>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleSetLanguage("hi")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                language === "hi"
                  ? "bg-sky-600 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              हिन्दी / Hinglish
            </button>
            <button
              onClick={() => handleSetLanguage("en")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                language === "en"
                  ? "bg-sky-600 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              English
            </button>
          </div>

          {/* Voice Narrator Button */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleSpeakCurrentScene}
            className={`h-8 text-xs gap-1.5 border-slate-800 transition-all ${
              isVoiceNarrationActive
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                : "text-slate-300 hover:text-white hover:bg-slate-900"
            }`}
            title="Read Scene Aloud"
          >
            {isVoiceNarrationActive ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5 text-sky-400" />}
            <span className="hidden sm:inline">{isVoiceNarrationActive ? "Stop Voice" : "Listen Voice"}</span>
          </Button>

          {/* Voice Mic Assistant */}
          <Button
            size="sm"
            variant="outline"
            onClick={toggleListeningMic}
            className={`h-8 text-xs gap-1.5 border-slate-800 transition-all ${
              isListeningMic
                ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-bounce"
                : "text-slate-300 hover:text-white hover:bg-slate-900"
            }`}
            title="Speak your doubt via microphone"
          >
            {isListeningMic ? <MicOff className="size-3.5" /> : <Mic className="size-3.5 text-rose-400" />}
            <span className="hidden sm:inline">{isListeningMic ? "Listening..." : "Ask Mic"}</span>
          </Button>

          {/* Flowchart View Toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowVisualizerFlow(!showVisualizerFlow)}
            className={`h-8 text-xs gap-1.5 border-slate-800 transition-all ${
              showVisualizerFlow
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
            title="Toggle Live Workflow Diagram"
          >
            <Workflow className="size-3.5 text-indigo-400" />
            <span className="hidden md:inline">Flow View</span>
          </Button>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 text-slate-400 hover:text-white"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Classroom"}
          >
            {isFullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
        </div>
      </div>

      {/* Mic Input / AI Voice Dialog Popup */}
      {(isListeningMic || spokenTranscript || aiQuickAnswer) && (
        <div className="mx-6 mt-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
            {isListeningMic ? <Mic className="size-4 animate-pulse" /> : <Sparkles className="size-4 text-sky-400" />}
          </div>
          <div className="flex-1 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200">
                {isListeningMic
                  ? language === "hi"
                    ? "माइक सुन रहा है... अपना सवाल पूछें"
                    : "Listening to your voice... Speak your doubt"
                  : language === "hi"
                  ? "AI टीचर का सरल उत्तर:"
                  : "AI Tutor Simple Answer:"}
              </span>
              <button
                onClick={() => {
                  setSpokenTranscript("");
                  setAiQuickAnswer(null);
                }}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>
            {spokenTranscript && (
              <p className="text-slate-400 italic font-mono">"{spokenTranscript}"</p>
            )}
            {isAiAnswering && (
              <div className="flex items-center gap-1.5 text-sky-400 font-medium">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Thinking &amp; formulating response...</span>
              </div>
            )}
            {aiQuickAnswer && (
              <p className="text-emerald-300 font-sans leading-relaxed pt-1">{aiQuickAnswer}</p>
            )}
          </div>
        </div>
      )}

      {/* Whiteboard Classroom Canvas Area */}
      <div className="flex-1 overflow-y-auto p-6 relative flex flex-col justify-between">
        {/* Animated Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene.id}
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-6 max-w-5xl mx-auto w-full"
            >
              {/* Header: Scene Title */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30 font-mono">
                    {currentScene.type.replace("_", " ")}
                  </span>
                  {activeSubtitle && (
                    <span className="text-xs text-slate-400 italic font-mono">
                      // {activeSubtitle}
                    </span>
                  )}
                  {simplicityMode === "easy" && (
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] gap-1">
                      <Smile className="size-3" />
                      {language === "hi" ? "आसान भाषा एक्टिव" : "Easy Mode Active"}
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                  {activeTitle}
                </h1>
              </div>

              {/* 🌟 1. "सरल शब्दों में (1-Line Ultra Simple Summary)" Callout Banner */}
              {activeEasySummary && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-500/30 shadow-lg flex items-start gap-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300 shrink-0 mt-0.5">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 font-mono block">
                      {language === "hi" ? "🎯 1-लाइन में सरल सारांश (Crystal Clear Core)" : "🎯 1-Line Core Summary:"}
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed font-sans">
                      {activeEasySummary}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* 🌟 2. "💡 दिमाग में बैठाने की ट्रिक & फॉर्मूला (5-Second Memory Card)" */}
              {activeMemoryTrick && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/50 border border-amber-500/40 shadow-xl space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="size-4 text-amber-400 animate-pulse" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 font-mono">
                        {language === "hi" ? "💡 दिमाग में बैठाने का फॉर्मूला (5-Second Memory Trick)" : "💡 5-Second Memory Formula (Never Forget):"}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-300 bg-amber-500/10">
                      Exam &amp; Interview Trick
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm font-mono font-bold text-amber-200 bg-slate-950/80 p-3 rounded-lg border border-amber-500/30 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {activeMemoryTrick}
                  </p>
                </motion.div>
              )}

              {/* 🌟 3. "❌ इसके बिना क्या मुसीबत थी? ➔ ✅ इससे क्या आसान हुआ?" (Problem vs Solution) */}
              {activeProblemVsSolution && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold font-mono">
                      <AlertTriangle className="size-3.5" />
                      <span>{language === "hi" ? "❌ इसके बिना क्या दिक्कत थी?" : "❌ Problem Without This:"}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {activeProblemVsSolution.without}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono">
                      <CheckCircle2 className="size-3.5" />
                      <span>{language === "hi" ? "✅ इसको लगाने से क्या जादू हुआ?" : "✅ Magic Solution With This:"}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {activeProblemVsSolution.with}
                    </p>
                  </div>
                </div>
              )}

              {/* Clean Structured Concept Cards */}
              {activeNotes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {activeNotes.map((note: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 + 0.1 }}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-200 shadow-md relative overflow-hidden group hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 text-xs font-mono font-bold shrink-0 mt-0.5">
                          0{i + 1}
                        </span>
                        <p className="text-xs sm:text-sm leading-relaxed font-sans font-medium text-slate-200">
                          {note}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Interactive Deep Step-by-Step Architectural Execution Flow */}
              {showVisualizerFlow && activeNodes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border border-slate-800 space-y-4 relative shadow-2xl"
                >
                  {/* Flow Header with Step Progress & Auto-Play Controls */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono flex items-center gap-1.5">
                        <Zap className="size-4 text-amber-400 fill-amber-400/20" />
                        {language === "hi"
                          ? "आर्किटेक्चरल एग्जीक्यूशन फ्लो (Step-by-Step Animation)"
                          : "Architectural Execution Flow (Step-by-Step Deep Breakdown)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] border-indigo-500/40 text-indigo-300 bg-indigo-950/40">
                        Stage {activeFlowStep + 1} of {activeNodes.length}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsFlowAutoPlaying(!isFlowAutoPlaying)}
                        className={`h-7 px-2.5 text-[11px] gap-1 border-slate-800 ${
                          isFlowAutoPlaying
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        {isFlowAutoPlaying ? <Pause className="size-3" /> : <Play className="size-3 fill-current text-emerald-400" />}
                        {isFlowAutoPlaying ? "Pause Auto Flow" : "Auto Animate"}
                      </Button>
                    </div>
                  </div>

                  {/* Flow Stage Node Pills with Active Pulse & Connector Lines */}
                  <div className="flex flex-wrap items-center justify-center gap-3 py-2">
                    {activeNodes.map((node: FlowStepNode, nIdx: number) => {
                      const isStepActive = activeFlowStep === nIdx;
                      return (
                        <div key={node.id || nIdx} className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setActiveFlowStep(nIdx);
                              setIsFlowAutoPlaying(false);
                            }}
                            className={`px-4 py-3 rounded-xl border flex flex-col items-center justify-center min-w-[150px] shadow-md transition-all cursor-pointer relative overflow-hidden ${
                              isStepActive
                                ? "ring-2 ring-sky-400 scale-105 border-sky-400 bg-slate-900 text-white font-bold shadow-sky-500/10"
                                : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                            }`}
                          >
                            {/* Active Step Glowing Glow Bar */}
                            {isStepActive && (
                              <motion.div
                                layoutId="activeFlowIndicator"
                                className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 to-indigo-500"
                              />
                            )}
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono font-bold">
                                0{nIdx + 1}
                              </span>
                              <span className="text-xs font-bold font-mono tracking-tight text-slate-200">
                                {language === "hi" ? node.labelHi : node.labelEn}
                              </span>
                            </div>
                            {(node.sublabelHi || node.sublabelEn) && (
                              <span className="text-[10px] text-slate-400 font-sans">
                                {language === "hi" ? node.sublabelHi : node.sublabelEn}
                              </span>
                            )}
                          </button>

                          {/* Connecting Arrow with Laser Beam Pulse */}
                          {nIdx < activeNodes.length - 1 && (
                            <div className="flex items-center gap-1 px-1">
                              <span className={`size-2 rounded-full ${isStepActive ? "bg-sky-400 animate-ping" : "bg-slate-700"}`} />
                              <ArrowRight className={`size-4 ${isStepActive ? "text-sky-400" : "text-slate-600"} shrink-0`} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Active Step Deep Breakdown Card (गहराई से समझें) */}
                  {currentActiveNode && (
                    <motion.div
                      key={currentActiveNode.id || activeFlowStep}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
                    >
                      {/* Step Stage Title & Phase */}
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">
                            {activeFlowStep + 1}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-amber-300 font-mono">
                            {language === "hi" ? currentActiveNode.phaseHi : currentActiveNode.phaseEn}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={activeFlowStep === 0}
                            onClick={() => setActiveFlowStep((prev) => Math.max(0, prev - 1))}
                            className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
                          >
                            <ChevronLeft className="size-3 mr-0.5" />
                            {language === "hi" ? "पिछला स्टेज" : "Prev"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={activeFlowStep === activeNodes.length - 1}
                            onClick={() => setActiveFlowStep((prev) => Math.min(activeNodes.length - 1, prev + 1))}
                            className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
                          >
                            {language === "hi" ? "अगला स्टेज" : "Next"}
                            <ChevronRight className="size-3 ml-0.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Under-The-Hood Mechanics Paragraph */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 block font-mono">
                          🔍 {language === "hi" ? "अंदर क्या हो रहा है? (Under The Hood Mechanics)" : "What Happens Under The Hood:"}
                        </span>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans font-medium">
                          {language === "hi" ? currentActiveNode.whatHappensHi : currentActiveNode.whatHappensEn}
                        </p>
                      </div>

                      {/* Live Data & State Mutation Transformation Box */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block font-mono">
                            ⚡ {language === "hi" ? "डेटा और मेमोरी स्टेट:" : "Data & Memory State:"}
                          </span>
                          <pre className="text-[11px] font-mono text-indigo-200 overflow-x-auto whitespace-pre-wrap">
                            <code>{language === "hi" ? currentActiveNode.dataStateHi : currentActiveNode.dataStateEn}</code>
                          </pre>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block font-mono">
                            💡 {language === "hi" ? "सीनियर डेवलपर रूल:" : "Senior Developer Rule:"}
                          </span>
                          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                            {language === "hi" ? currentActiveNode.ruleHi : currentActiveNode.ruleEn}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* Live Code Blueprint Box */}
              {currentScene.codeSnippet && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="size-2.5 rounded-full bg-rose-500/80" />
                        <span className="size-2.5 rounded-full bg-amber-500/80" />
                        <span className="size-2.5 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="font-mono font-medium text-slate-300 ml-2">
                        classroom_code.{currentScene.codeSnippet.language === "python" ? "py" : "js"}
                      </span>
                    </div>
                    {onOpenPlayground && (
                      <button
                        onClick={onOpenPlayground}
                        className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Code2 className="size-3.5" />
                        {language === "hi" ? "प्लेग्राउंड में टेस्ट करें &rarr;" : "Run in Playground &rarr;"}
                      </button>
                    )}
                  </div>
                  <pre className="p-4 text-xs font-mono overflow-x-auto text-emerald-300 leading-relaxed">
                    <code>{currentScene.codeSnippet.code}</code>
                  </pre>
                </motion.div>
              )}

              {/* Interactive Quiz Check Scene */}
              {currentScene.quizQuestion && (
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="size-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                      {language === "hi" ? "क्विक नॉलेज चेक" : "Quick Knowledge Check"}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-white">
                    {language === "hi" ? currentScene.quizQuestion.questionHi : currentScene.quizQuestion.questionEn}
                  </h3>

                  <div className="grid gap-2 pt-2">
                    {(language === "hi"
                      ? currentScene.quizQuestion.optionsHi
                      : currentScene.quizQuestion.optionsEn
                    ).map((option: string, optIdx: number) => {
                      const isSelected = selectedQuizAnswer === optIdx;
                      const isCorrect = optIdx === currentScene.quizQuestion?.correctIndex;
                      const showResult = showQuizFeedback;

                      let btnStyle = "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700";
                      if (showResult) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold";
                        } else if (isSelected && !isCorrect) {
                          btnStyle = "bg-rose-950/60 border-rose-500 text-rose-200";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-sky-950/60 border-sky-500 text-sky-200";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => {
                            setSelectedQuizAnswer(optIdx);
                            setShowQuizFeedback(true);
                          }}
                          className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                        >
                          <span>{option}</span>
                          {showResult && isCorrect && <Check className="size-4 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {showQuizFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1"
                    >
                      <span className="font-bold text-sky-400 block font-mono">
                        {selectedQuizAnswer === currentScene.quizQuestion.correctIndex
                          ? "✓ " + (language === "hi" ? "बिल्कुल सही!" : "Excellent!")
                          : "✕ " + (language === "hi" ? "गलत उत्तर" : "Incorrect")}
                      </span>
                      <p>
                        {language === "hi"
                          ? currentScene.quizQuestion.explanationHi
                          : currentScene.quizQuestion.explanationEn}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Master Explanation & Real-World Desi Analogy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-sky-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-sky-400 font-mono">
                      {language === "hi" ? "टीचर एक्सप्लेनेशन" : "Teacher Explanation"}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    <MarkdownRenderer content={activeExplanation} />
                  </div>
                </div>

                {activeAnalogy && (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="size-4 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                        {language === "hi" ? "🍰 देसी रियल-लाइफ उदाहरण (Mental Model)" : "🍰 Real-World Mental Model & Analogy"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans italic">
                      "{activeAnalogy}"
                    </p>
                  </div>
                )}
              </div>

              {/* Key Takeaways Badges */}
              {activeKeyTakeaways.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-xs font-semibold text-slate-400 font-mono">
                    {language === "hi" ? "की-टेकअवे:" : "Key Takeaways:"}
                  </span>
                  {activeKeyTakeaways.map((takeaway: string, idx: number) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="bg-slate-900 border-slate-800 text-slate-300 text-xs py-1 px-2.5 font-normal"
                    >
                      <CheckCircle2 className="size-3 text-emerald-400 mr-1.5" />
                      {takeaway}
                    </Badge>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Classroom Controls (Prev/Next, Playback, Scene Timeline) */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10">
          {/* Left: Playback & Speed */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSpeakCurrentScene}
              className="h-8 text-xs border-slate-800 text-slate-300 hover:text-white"
            >
              {isVoiceNarrationActive ? <Pause className="size-3.5 mr-1" /> : <Play className="size-3.5 mr-1 fill-current" />}
              {isVoiceNarrationActive ? "Pause Voice" : "Play Scene"}
            </Button>

            {/* Speed Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              {[1, 1.5, 2].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    playbackSpeed === spd
                      ? "bg-slate-800 text-sky-400"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Scene Navigation Step Indicators */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs sm:max-w-md py-1">
            {scenes.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentSceneIndex(i);
                  setSelectedQuizAnswer(null);
                  setShowQuizFeedback(false);
                  setActiveFlowStep(0);
                  setIsFlowAutoPlaying(false);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSceneIndex === i
                    ? "w-8 bg-sky-400"
                    : i < currentSceneIndex
                    ? "w-3 bg-sky-700"
                    : "w-3 bg-slate-800"
                }`}
                title={`Jump to Scene ${i + 1}`}
              />
            ))}
          </div>

          {/* Step Forward / Backward */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentSceneIndex === 0}
              className="h-8 text-xs border-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="size-3.5 mr-1" />
              {language === "hi" ? "पिछला" : "Previous"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentSceneIndex === scenes.length - 1}
              className="h-8 text-xs border-slate-800 text-slate-300 hover:text-white disabled:opacity-30"
            >
              {language === "hi" ? "अगला सीन" : "Next Scene"}
              <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Bilingual Scene Generator with Easy Memory Tricks & Desi Analogies
// ─────────────────────────────────────────────────────────────────────────────
function generateBilingualWhiteboardScenes({
  lessonTitle,
  topicTitle,
  lessonContent,
  lessonExplanation,
  concepts,
  examples,
}: {
  lessonTitle: string;
  topicTitle: string;
  lessonContent: string;
  lessonExplanation?: string;
  concepts: Array<{ id: string; title: string; description: string }>;
  examples: Array<{ id: string; title: string; description: string; starterCode: string; solutionCode: string }>;
}): WhiteboardScene[] {
  const scenes: WhiteboardScene[] = [];
  let sceneNum = 1;

  // Scene 1: Introduction & Mental Model (Ultra-Clear)
  scenes.push({
    id: `scene_${sceneNum}`,
    sceneNumber: sceneNum++,
    titleEn: `Mastering ${lessonTitle}`,
    titleHi: `${lessonTitle} को समझें बिल्कुल आसान भाषा में`,
    subtitleEn: `Core Mental Model & 5-Second Memory Trick`,
    subtitleHi: `मेंटल मॉडल और याद रखने की ट्रिक`,
    type: "concept",
    easySummaryEn: `${lessonTitle} is simply a proven design pattern to turn raw inputs into predictable, fast, and bug-free software.`,
    easySummaryHi: `${lessonTitle} का सीधा मतलब है: कम मेहनत में तेज, साफ़ और बिना एरर वाला कोड लिखना जो कभी क्रैश न हो!`,
    memoryTrickEn: `💡 FORMULA: Input (User/Client) ➔ Pure Logic Transformation ➔ Output UI / JSON Response`,
    memoryTrickHi: `💡 याद रखने का फॉर्मूला: इनपुट आया ➔ लॉजिक प्रोसेस हुआ ➔ रिजल्ट स्क्रीन पर दिखा! (Input ➔ Process ➔ Output)`,
    problemVsSolutionEn: {
      without: "Messy spaghetti code, unpredictable bugs, page freeze, and slow re-renders.",
      with: "Modular, reusable components and clean API endpoints that are 10x easier to maintain.",
    },
    problemVsSolutionHi: {
      without: "हजारों लाइनों का उलझा हुआ कोड, बार-बार पेज का हैंग होना और एरर ढूंढने में घंटों बर्बाद होना।",
      with: "साफ़-सुथरे छोटे ब्लॉक्स (Components/APIs) जिन्हें एक बार बनाओ और कहीं भी बार-बार यूज़ करो!",
    },
    handwrittenNotesEn: [
      `Why ${lessonTitle} is fundamental in modern engineering`,
      `Core mental model: Moving from theory to practical implementation`,
      `Key goal: High throughput and predictable state management`,
    ],
    handwrittenNotesHi: [
      `सॉफ्टवेयर इंजीनियरिंग में ${lessonTitle} इतना महत्वपूर्ण क्यों है?`,
      `मेंटल मॉडल: थ्योरी से सीधे प्रैक्टिकल कोडिंग और आर्किटेक्चर को समझना`,
      `मुख्य लक्ष्य: फास्ट परफॉर्मेंस और प्रेडिक्टेबल डेटा फ्लो तैयार करना`,
    ],
    explanationEn:
      lessonExplanation ||
      `In this lesson, we break down **${lessonTitle}** step-by-step. Master the underlying mechanics, data flow, and industry best practices.`,
    explanationHi:
      `इस पाठ में हम **${lessonTitle}** को बिल्कुल बेसिक से लेकर एडवांस लेवल तक स्टेप-बाय-स्टेप समझेंगे। ध्यान से देखें कि कैसे क्लाइंट का रिक्वेस्ट सिस्टम के अंदर प्रोसेस होता है और सही डेटा रिटर्न करता है।`,
    analogyEn: `Think of LEGO blocks: instead of carving an entire house from a single massive rock, you assemble tiny, reusable blocks (Button, Card, API). If one block needs repair, you replace only that block without tearing down the house!`,
    analogyHi: `जैसे LEGO के छोटे-छोटे प्लास्टिक ब्लॉक्स को जोड़कर पूरा घर बनाया जाता है, वैसे ही कोडिंग में हम छोटे-छोटे फंक्शन्स और कंपोनेंट्स जोड़कर पूरी बड़ी वेबसाइट या ऐप बनाते हैं!`,
    diagramNodes: [
      {
        id: "step_1_trigger",
        stepNumber: 1,
        labelEn: "1. Trigger / Input",
        labelHi: "1. इनपुट ट्रिगर",
        sublabelEn: "Browser / Event / Request",
        sublabelHi: "ब्राउज़र / यूजर एक्शन",
        phaseEn: "Phase 01: Event Dispatch & Capture",
        phaseHi: "स्टेज 01: यूजर एक्शन और इवेंट डिस्पैच",
        whatHappensEn: "The user triggers an action (such as clicking a button, making an HTTP call, or declaring a variable). The runtime captures this event and pushes it into the non-blocking execution queue.",
        whatHappensHi: "यूजर बटन क्लिक करता है या API रिक्वेस्ट भेजता है। ब्राउज़र/नोड इंजन इस इवेंट को कैप्चर करके तुरंत एग्जीक्यूशन क्यू में डालता है।",
        dataStateEn: "Payload State: { event: 'INIT_REQUEST', payload: rawData, timestamp: Date.now() }",
        dataStateHi: "शुरुआती स्टेट: { event: 'INIT_REQUEST', rawInput: 'User Value', status: 'PENDING' }",
        ruleEn: "Always sanitize and validate raw inputs at the system boundary before passing to inner core logic.",
        ruleHi: "कच्चे इनपुट को कोर लॉजिक में भेजने से पहले हमेशा सिस्टम बाउंड्री पर वैलिडेट करें।",
        color: "border-sky-500/50 bg-sky-500/10",
      },
      {
        id: "step_2_engine",
        stepNumber: 2,
        labelEn: "2. Engine Processing",
        labelHi: "2. इंजन प्रोसेसिंग",
        sublabelEn: "Call Stack & AST",
        sublabelHi: "कॉल स्टैक और पार्सर",
        phaseEn: "Phase 02: AST Parsing & Execution Frame Push",
        phaseHi: "स्टेज 02: सिंटैक्स पार्सिंग और स्टैक फ्रेम एलोकेशन",
        whatHappensEn: "The JavaScript V8 / Node runtime allocates an execution context on the Call Stack. Lexical scope and closure variables are bound in local heap memory.",
        whatHappensHi: "V8 इंजन कॉल स्टैक पर नया एग्जीक्यूशन कॉन्टेक्स्ट पुश करता है। फंक्शन के अंदर के लोकल वेरिएबल्स और स्कोप को मेमोरी में एलोकेट किया जाता है।",
        dataStateEn: "Stack State: [ Frame: main() -> executeTopicEngine() ]\nMemory: Heap { scope: 'Lexical', variablesAllocated: true }",
        dataStateHi: "स्टैक स्टेट: [ executeFunction() ]\nमेमोरी: हीप में लोकल वेरिएबल्स रजिस्टर हो गए हैं।",
        ruleEn: "Avoid deep nested synchronous calls that can cause Call Stack Overflow.",
        ruleHi: "जरूरत से ज्यादा नेस्टेड सिंक्रोनस कॉल्स से बचें ताकि स्टैक ओवरफ्लो न हो।",
        color: "border-indigo-500/50 bg-indigo-500/10",
      },
      {
        id: "step_3_logic",
        stepNumber: 3,
        labelEn: "3. Transformation",
        labelHi: "3. लॉजिक ट्रांसफॉर्मेशन",
        sublabelEn: "State Mutation / Logic",
        sublabelHi: "डेटा ट्रांसफॉर्मेशन",
        phaseEn: "Phase 03: Core Algorithm Execution & State Mutation",
        phaseHi: "स्टेज 03: कोर एल्गोरिदम और डेटा ट्रांसफॉर्मेशन",
        whatHappensEn: "The core business logic runs. Data is filtered, transformed, or updated immutably. If asynchronous operations occur, promises are awaited via the microtask queue.",
        whatHappensHi: "यहाँ असली लॉजिक एग्जीक्यूट होता है। डेटा को क्लीन, मॉडिफाई या ट्रांसफॉर्म किया जाता है। एसिंक्रोनस टास्क माइक्रो-टास्क क्यू में रिजॉल्व होते हैं।",
        dataStateEn: "Transform: compute(a, b) => Result: { success: true, transformedData: ... }",
        dataStateHi: "ट्रांसफॉर्मेशन: कैलकुलेशन पूरा हुआ => रिजल्ट: { success: true, processed: true }",
        ruleEn: "Prefer pure functions without unintended side effects to ensure deterministic output.",
        ruleHi: "प्योर फंक्शन्स का इस्तेमाल करें ताकि आउटपुट हमेशा प्रेडिक्टेबल और एरर-फ्री रहे।",
        color: "border-purple-500/50 bg-purple-500/10",
      },
      {
        id: "step_4_output",
        stepNumber: 4,
        labelEn: "4. Result Output",
        labelHi: "4. आउटपुट रिस्पॉन्स",
        sublabelEn: "UI Re-render / HTTP 200",
        sublabelHi: "UI रेंडर / रिजल्ट",
        phaseEn: "Phase 04: Lifecycle Resolution & UI / Response Sync",
        phaseHi: "स्टेज 04: लाइफसाइकिल समाप्ति और फाइनल आउटपुट",
        whatHappensEn: "The stack frame is popped. The final state is emitted to the UI for re-rendering (DOM update) or returned as a structured HTTP JSON response.",
        whatHappensHi: "कॉल स्टैक से फंक्शन पॉप हो जाता है। फाइनल रिजल्ट यूजर के स्क्रीन (DOM) पर अपडेट होता है या API रिस्पॉन्स रिटर्न होता है।",
        dataStateEn: "Final Output: 200 OK / DOM Node Rendered with Updated Virtual Tree",
        dataStateHi: "फाइनल आउटपुट: 200 OK / स्क्रीन पर नया डेटा सफलतापूर्वक रेंडर हुआ।",
        ruleEn: "Ensure UI clean-up handlers (unsubscribers, timers) to prevent memory leaks.",
        ruleHi: "मेमोरी लीक से बचने के लिए हमेशा अनमाउंट या क्लीन-अप हैंडलर का ध्यान रखें।",
        color: "border-emerald-500/50 bg-emerald-500/10",
      },
    ],
    keyTakeawaysEn: ["Core Mental Model", "Foundation Principles", "Pipeline Architecture"],
    keyTakeawaysHi: ["मूल मेंटल मॉडल", "फाउंडेशन सिद्धांत", "आर्किटेक्चर पाइपलाइन"],
  });

  // Scene 2..N: Deep Dive into Each Concept with Custom Desi Analogies
  if (concepts && concepts.length > 0) {
    concepts.forEach((concept, cIdx) => {
      // Generate custom analogies based on concept title
      const titleLower = concept.title.toLowerCase();
      let desiAnalogy = "जैसे एक रेस्टोरेंट में वेटर (Handler) कस्टमर से आर्डर लेता है और शेफ (Logic) को देता है!";
      let memoryFormula = `const [state, setState] = useState(initialValue); // Rule: Never mutate direct!`;
      let withoutText = "मैन्युअल DOM अपडेट करने में कोड बिखर जाता था और बग्स आते थे।";
      let withText = "React/Node ऑटोमेटिक सब कुछ सिंक में रखता है!";

      if (titleLower.includes("state") || titleLower.includes("usestate")) {
        desiAnalogy = "🏏 क्रिकेट मैच का स्कोरबोर्ड: जैसे-जैसे रन बनते हैं, स्कोरबोर्ड पर नंबर बदलता है और सबको नया स्कोर दिखता है। State वही स्कोरबोर्ड है!";
        memoryFormula = "💡 FORMULA: const [data, setData] = useState(शुरुआती_वैल्यू); // setData(नया_डेटा)";
        withoutText = "नॉर्मल variable (let count = 0) बदलने पर स्क्रीन पर नंबर नहीं बदलता था!";
        withText = "useState लगाते ही बटन दबाते ही स्क्रीन अपने आप नया नंबर दिखाती है!";
      } else if (titleLower.includes("prop")) {
        desiAnalogy = "🆔 स्कूल/कॉलेज का ID कार्ड: ID कार्ड का फॉर्मेट (Design) सबका सेम होता है, लेकिन नाम और फोटो (Props) सबका अलग होता है!";
        memoryFormula = "💡 FORMULA: <Component name=\"Aman\" role=\"Dev\" /> ➔ function Card(props) { return props.name }";
        withoutText = "हर स्टूडेंट के लिए अलग से 100 HTML कार्ड कॉपी-पेस्ट करने पड़ते थे।";
        withText = "1 मास्टर कंपोनेंट बनाया और Props भेजकर लाखों कार्ड 1 सेकंड में बन गए!";
      } else if (titleLower.includes("event") || titleLower.includes("click")) {
        desiAnalogy = "🔔 घर की डोरबेल: जब कोई घंटी दबाता है (Event: Click), तो आवाज़ आती है और आप दरवाज़ा खोलते हैं (Handler function)!";
        memoryFormula = "💡 FORMULA: onClick={handleClick} // DHYAN: onClick={handleClick()} ब्रैकेट मत लगाना!";
        withoutText = "यूजर के बटन दबाने पर वेबसाइट कोई रिस्पॉन्स नहीं दे पाती थी।";
        withText = "क्लिक, टाइपिंग और माउस मूवमेंट्स पर मनचाहा एक्शन तुरंत ट्रिगर होता है!";
      } else if (titleLower.includes("route") || titleLower.includes("express")) {
        desiAnalogy = "🗄️ अलमारी के अलग-अलग दराज: कपड़े के लिए अलग दराज (/clothes) और किताबों के लिए अलग (/books). Express routes वही दराज हैं!";
        memoryFormula = "💡 FORMULA: app.get('/path', (req, res) => res.json(data));";
        withoutText = "हर URL के लिए भारी-भरकम कोड लिखना पड़ता था।";
        withText = "1 लाइन में नया API endpoint बन जाता है!";
      } else if (titleLower.includes("middleware")) {
        desiAnalogy = "✈️ एयरपोर्ट सिक्योरिटी चेक: फ्लाइट में बैठने से पहले लगेज स्कैन और टिकट चेक (Middleware) होता है, फिर वो बोलते हैं 'Next Gate Jao' (next())!";
        memoryFormula = "💡 FORMULA: function auth(req, res, next) { if(ok) next(); else res.status(401); }";
        withoutText = "हर एक API route में बार-बार वही 50 लाइनों का सिक्योरिटी कोड कॉपी-पेस्ट करना पड़ता था।";
        withText = "1 Middleware लगाया और सारे routes अपने आप सुरक्षित हो गए!";
      }

      scenes.push({
        id: `scene_${sceneNum}`,
        sceneNumber: sceneNum++,
        titleEn: concept.title,
        titleHi: `${concept.title} (सरल समझ)`,
        subtitleEn: `Concept 0${cIdx + 1} Breakdown`,
        subtitleHi: `कॉन्सेप्ट 0${cIdx + 1} का विश्लेषण`,
        type: "deep_dive",
        easySummaryEn: `In simple terms: ${concept.title} solves a specific problem so you write less code with zero confusion.`,
        easySummaryHi: `सरल शब्दों में: ${concept.title} का काम है आपके कोड को छोटा, आसान और एरर-फ्री बनाना।`,
        memoryTrickEn: memoryFormula,
        memoryTrickHi: memoryFormula,
        problemVsSolutionEn: {
          without: withoutText,
          with: withText,
        },
        problemVsSolutionHi: {
          without: withoutText,
          with: withText,
        },
        handwrittenNotesEn: [
          `Key rule: ${concept.title} dictates how state flows through the system`,
          `Internal mechanics: Execution lifecycle and memory boundaries`,
          `Common developer mistake: Overlooking edge conditions`,
        ],
        handwrittenNotesHi: [
          `मुख्य नियम: ${concept.title} तय करता है कि सिस्टम में डेटा कैसे मूव करेगा।`,
          `आंतरिक कार्यप्रणाली: मेमोरी और एग्जीक्यूशन लाइफसाइकिल की सीमाएं।`,
          `आम गलतियां: बिगिनर्स अक्सर एज केसेस और एरर हैंडलिंग मिस कर देते हैं।`,
        ],
        explanationEn: concept.description,
        explanationHi: `${concept.description}\n\n**💡 टीचर टिप:** इस कॉन्सेप्ट को कोड में इस्तेमाल करते वक्त हमेशा ध्यान रखें कि फंक्शनल प्योरिटी और डेटा सेफ्टी बनी रहे।`,
        analogyEn: desiAnalogy,
        analogyHi: desiAnalogy,
        diagramNodes: [
          {
            id: `c_${cIdx}_s1`,
            stepNumber: 1,
            labelEn: "1. Scope Binding",
            labelHi: "1. स्कोप बाइंडिंग",
            sublabelEn: "Variable Declaration",
            sublabelHi: "वेरिएबल डिक्लेरेशन",
            phaseEn: `Phase 01: Declaration & Environment Record Creation`,
            phaseHi: `स्टेज 01: ${concept.title} का इनिशियलाइजेशन`,
            whatHappensEn: `The JavaScript engine identifies ${concept.title} during the compilation phase. Memory is reserved in the environment record.`,
            whatHappensHi: `कंपाइल फेज के दौरान इंजन ${concept.title} की पहचान करता है और मेमोरी में इसका स्कोप रिकॉर्ड तैयार करता है।`,
            dataStateEn: `Record: { binding: '${concept.title}', initialized: true, value: undefined }`,
            dataStateHi: `मेमोरी रिकॉर्ड: { name: '${concept.title}', status: 'ALLOCATED' }`,
            ruleEn: "Always declare variables with explicit keywords (const/let) to avoid global pollution.",
            ruleHi: "हमेशा const या let का इस्तेमाल करें ताकि ग्लोबल स्कोप दूषित न हो।",
            color: "border-amber-500/50 bg-amber-500/10",
          },
          {
            id: `c_${cIdx}_s2`,
            stepNumber: 2,
            labelEn: "2. Logic Execution",
            labelHi: "2. लॉजिक एग्जीक्यूशन",
            sublabelEn: "Stack Evaluation",
            sublabelHi: "स्टैक इवैल्यूएशन",
            phaseEn: `Phase 02: Expression Evaluation & Type Verification`,
            phaseHi: `स्टेज 02: एक्सप्रेशन इवैल्यूएशन और टाइप चेकिंग`,
            whatHappensEn: `Expressions are evaluated line-by-line. If type conversions or condition checks occur, the runtime strictly applies language semantics.`,
            whatHappensHi: `लाइनों को एक-एक करके एग्जीक्यूट किया जाता है। टाइप चेकिंग और कंडीशनल ऑपरेशन्स प्रोसेस होते हैं।`,
            dataStateEn: `Evaluation: evaluating expressions => operands coerced safely`,
            dataStateHi: `इवैल्यूएशन: ऑपरेंड्स को सही टाइप में प्रोसेस किया जा रहा है।`,
            ruleEn: "Use strict equality (===) to avoid subtle bugs from implicit type coercion.",
            ruleHi: "हमेशा ट्रिपल इक्वल्स (===) का प्रयोग करें ताकि टाइप मिसमैच से बचा जा सके।",
            color: "border-sky-500/50 bg-sky-500/10",
          },
          {
            id: `c_${cIdx}_s3`,
            stepNumber: 3,
            labelEn: "3. State Transition",
            labelHi: "3. स्टेट ट्रांजिशन",
            sublabelEn: "Immutable Mutate",
            sublabelHi: "सुरक्षित डेटा म्यूटेशन",
            phaseEn: `Phase 03: Deterministic State Transition`,
            phaseHi: `स्टेज 03: प्रेडिक्टेबल स्टेट बदलाव`,
            whatHappensEn: `The value is updated deterministically. Previous state remains uncorrupted, following immutable software design patterns.`,
            whatHappensHi: `नया वैल्यू सुरक्षित रूप से सेव होता है। पुराना डेटा बिना करप्ट हुए नया स्टेट तैयार करता है।`,
            dataStateEn: `State: { previousState: 'old', currentState: 'updated', immutable: true }`,
            dataStateHi: `स्टेट: { previous: 'पुराना', current: 'अपडेटेड', valid: true }`,
            ruleEn: "Treat state as read-only and return new copies rather than mutating in place.",
            ruleHi: "स्टेट को सीधे मॉडिफाई करने के बजाय नई कॉपी बनाकर रिटर्न करें।",
            color: "border-indigo-500/50 bg-indigo-500/10",
          },
          {
            id: `c_${cIdx}_s4`,
            stepNumber: 4,
            labelEn: "4. Output & Cleanup",
            labelHi: "4. फाइनल आउटपुट",
            sublabelEn: "Popped from Stack",
            sublabelHi: "मेमोरी फ्री / आउटपुट",
            phaseEn: `Phase 04: Frame Pop & Garbage Collection`,
            phaseHi: `स्टेज 04: स्टैक से पॉप और आउटपुट डिलीवरी`,
            whatHappensEn: `The function execution concludes. The return value is passed to caller and unreferenced memory is queued for garbage collection.`,
            whatHappensHi: `फंक्शन अपना काम पूरा करके कॉलर को वैल्यू देता है और अप्रयुक्त मेमोरी गार्बेज कलेक्टर द्वारा साफ हो जाती है।`,
            dataStateEn: `Return: Output resolved => Stack clean`,
            dataStateHi: `रिटर्न: सही रिजल्ट प्राप्त हुआ => स्टैक साफ हुआ।`,
            ruleEn: "Ensure closures do not accidentally capture large objects that prevent garbage collection.",
            ruleHi: "क्लोजर में बड़े अनचाहे ऑब्जेक्ट्स न रखें ताकि मेमोरी लीक न हो।",
            color: "border-emerald-500/50 bg-emerald-500/10",
          },
        ],
        keyTakeawaysEn: [concept.title, "Predictable State", "Low Latency"],
        keyTakeawaysHi: [concept.title, "प्रेडिक्टेबल स्टेट", "फास्ट एग्जीक्यूशन"],
      });
    });
  }

  // Scene N+1: Live Code Blueprint / Example Walkthrough
  if (examples && examples.length > 0) {
    const ex = examples[0];
    scenes.push({
      id: `scene_${sceneNum}`,
      sceneNumber: sceneNum++,
      titleEn: `Code Blueprint: ${ex.title}`,
      titleHi: `कोड ब्लूप्रिंट: ${ex.title}`,
      subtitleEn: `Hands-On Implementation Walkthrough`,
      subtitleHi: `स्टेप-बाय-स्टेप कोडिंग विश्लेषण`,
      type: "code_breakdown",
      easySummaryEn: `Look at this 3-step practical pattern: clean inputs, safe processing, clean return.`,
      easySummaryHi: `इस कोड में बस 3 मुख्य बातें हैं: सही इनपुट लेना, सुरक्षित गणना करना, और साफ़ रिजल्ट दिखाना।`,
      memoryTrickEn: `💡 BLUEPRINT: Guard Clause (if invalid return error) ➔ Execute Logic ➔ Return Result`,
      memoryTrickHi: `💡 याद रखने का नियम: गलत इनपुट रोको ➔ लॉजिक चलाओ ➔ रिजल्ट स्क्रीन पर दो!`,
      handwrittenNotesEn: [
        `Observe the clean separation of concerns and type-safe variables`,
        `Notice the error boundary handling invalid inputs gracefully`,
        `Pattern used: Idiomatic modern engineering best practices`,
      ],
      handwrittenNotesHi: [
        `कोड की स्वच्छता: वेरिएबल्स और फंक्शन्स का सही तरीके से सेपरेशन।`,
        `एरर हैंडलिंग: गलत इनपुट आने पर सिस्टम क्रैश होने से बचता है।`,
        `प्रोडक्शन ग्रेड पैटर्न: इंडस्ट्री में सीनियर डेवलपर्स इसी स्टाइल में कोड लिखते हैं।`,
      ],
      explanationEn: ex.description || `Here is the production-grade implementation for **${ex.title}**. Study the execution flow carefully.`,
      explanationHi: `यहाँ **${ex.title}** का पूरा प्रोडक्शन कोड दिया गया है। ध्यान से देखें कि कैसे हर लाइन अपना काम करती है। इसे तुरंत प्लेग्राउंड में टेस्ट करें।`,
      diagramNodes: [
        {
          id: "ex_s1",
          stepNumber: 1,
          labelEn: "1. Code Parsing",
          labelHi: "1. कोड पार्सिंग",
          sublabelEn: "Compile Phase",
          sublabelHi: "कंपाइल फेज",
          phaseEn: "Phase 01: Tokenization & Bytecode Generation",
          phaseHi: "स्टेज 01: कोड टोकनाइजेशन और बाइटकोड जनरेशन",
          whatHappensEn: "The JavaScript engine parses the source code into an Abstract Syntax Tree (AST) and generates optimized bytecode.",
          whatHappensHi: "इंजन कोड को पढ़कर AST (Abstract Syntax Tree) तैयार करता है और ऑप्टिमाइज्ड बाइटकोड बनाता है।",
          dataStateEn: "AST: { type: 'Program', body: [FunctionDeclaration, Expression] }",
          dataStateHi: "AST: सोर्स कोड को पार्स करके नोड्स तैयार किए गए।",
          ruleEn: "Clean, consistent formatting allows JS engines to optimize compilation faster.",
          ruleHi: "क्लीन सिंटैक्स से JS इंजन तेजी से बाइटकोड ऑप्टिमाइज करता है।",
          color: "border-sky-500/50 bg-sky-500/10",
        },
        {
          id: "ex_s2",
          stepNumber: 2,
          labelEn: "2. Input Validation",
          labelHi: "2. इनपुट चेकिंग",
          sublabelEn: "Defensive Check",
          sublabelHi: "सुरक्षा जांच",
          phaseEn: "Phase 02: Defensive Parameter Verification",
          phaseHi: "स्टेज 02: पैरामीटर और टाइप वैलिडेशन",
          whatHappensEn: "The function immediately guards against null, undefined, or malformed parameters before performing any computations.",
          whatHappensHi: "फंक्शन यह चेक करता है कि इनपुट नल या अमान्य तो नहीं है। यदि है, तो तुरंत सुरक्षित एरर देता है।",
          dataStateEn: "Guard: if (isNaN(a) || isNaN(b)) => early return safe error message",
          dataStateHi: "गार्ड: यदि इनपुट गलत है => सुरक्षित एरर मैसेज रिटर्न होगा।",
          ruleEn: "Use early returns (guard clauses) to keep nesting shallow and code readable.",
          ruleHi: "गार्ड क्लॉज (Early Return) का प्रयोग करके कोड को सरल और पठनीय रखें।",
          color: "border-amber-500/50 bg-amber-500/10",
        },
        {
          id: "ex_s3",
          stepNumber: 3,
          labelEn: "3. Execution",
          labelHi: "3. एग्जीक्यूशन",
          sublabelEn: "Core Logic",
          sublabelHi: "मुख्य लॉजिक",
          phaseEn: "Phase 03: Computation & Memory State Update",
          phaseHi: "स्टेज 03: मुख्य कंप्यूटेशन और रिजल्ट निर्माण",
          whatHappensEn: "The core logic runs smoothly with valid inputs. The result is calculated and stored in a temporary return register.",
          whatHappensHi: "सटीक इनपुट के साथ मुख्य लॉजिक चलता है और सही रिजल्ट तैयार होता है।",
          dataStateEn: "Result: output = a + b => computedValue: 8",
          dataStateHi: "रिजल्ट: आउटपुट की गणना सफलतापूर्वक पूरी हुई।",
          ruleEn: "Never trust external input without type conversion or sanity checks.",
          ruleHi: "बिना टाइप कन्वर्जन के किसी भी बाहरी डेटा पर भरोसा न करें।",
          color: "border-indigo-500/50 bg-indigo-500/10",
        },
        {
          id: "ex_s4",
          stepNumber: 4,
          labelEn: "4. Stdout Output",
          labelHi: "4. टर्मिनल आउटपुट",
          sublabelEn: "Console / UI",
          sublabelHi: "कंसोल लॉग",
          phaseEn: "Phase 04: Standard Output & Caller Return",
          phaseHi: "स्टेज 04: कंसोल आउटपुट और कॉलर को रिटर्न",
          whatHappensEn: "The result is printed to the console output stream (stdout) and returned cleanly to the calling environment.",
          whatHappensHi: "रिजल्ट टर्मिनल/कंसोल में प्रिंट होता है और यूजर को सही आउटपुट दिखाई देता है।",
          dataStateEn: "stdout: '8' => Process exit code 0",
          dataStateHi: "कंसोल आउटपुट: 8 => एग्जीक्यूशन सफलतापूर्वक समाप्त।",
          ruleEn: "In production, use structured loggers instead of raw console.log statements.",
          ruleHi: "प्रोडक्शन में कच्चे console.log के बजाय स्ट्रक्चर्ड लॉगर का उपयोग करें।",
          color: "border-emerald-500/50 bg-emerald-500/10",
        },
      ],
      codeSnippet: {
        language: "javascript",
        code: ex.solutionCode || ex.starterCode || "// Implementation blueprint",
      },
      keyTakeawaysEn: ["Clean Code", "Error Boundaries", "Executable Solution"],
      keyTakeawaysHi: ["क्लीन कोड", "सुरक्षित एरर हैंडलिंग", "एग्जीक्यूटेबल सॉल्यूशन"],
    });
  }

  // Final Scene: Interactive Quick Knowledge Check
  scenes.push({
    id: `scene_${sceneNum}`,
    sceneNumber: sceneNum++,
    titleEn: `Whiteboard Knowledge Check`,
    titleHi: `व्हाइटबोर्ड ज्ञान परीक्षण (Knowledge Check)`,
    subtitleEn: `Verify Your Mastery Before Coding`,
    subtitleHi: `कोडिंग शुरू करने से पहले अपनी समझ परखें`,
    type: "quiz",
    handwrittenNotesEn: [
      `Test your understanding of the core concepts covered above`,
      `Select the best answer and review the teacher explanation`,
      `Ready to write code? Launch the interactive playground!`,
    ],
    handwrittenNotesHi: [
      `ऊपर पढ़े गए सभी कॉन्सेप्ट्स का तुरंत टेस्ट लें।`,
      `सही विकल्प चुनें और टीचर का फीडबैक देखें।`,
      `क्या आप कोड लिखने के लिए तैयार हैं? प्लेग्राउंड पर जाएं!`,
    ],
    explanationEn: `Let's make sure you have solid clarity on **${lessonTitle}** before heading into the coding exercises.`,
    explanationHi: `कोडिंग एक्सरसाइज शुरू करने से पहले आइए सुनिश्चित करें कि आपका फंडामेंटल कॉन्सेप्ट बिल्कुल क्रिस्टल क्लियर है।`,
    quizQuestion: {
      questionEn: `What is the easiest way to remember ${lessonTitle}?`,
      questionHi: `${lessonTitle} को सबसे आसानी से याद रखने का क्या नियम है?`,
      optionsEn: [
        `Break big problems into small, reusable pieces that take inputs and produce predictable outputs`,
        `Memorize 1000 lines of complex syntax without understanding the mental model`,
        `Avoid using functions or components and write all logic in a single file`,
        `Ignore error handling and assume data will never be empty`,
      ],
      optionsHi: [
        `बड़ी समस्या को छोटे-छोटे रियूजेबल टुकड़ों (Components/APIs) में तोड़ना जो सही इनपुट पर सही आउटपुट देते हैं`,
        `बिना समझे 1000 लाइनों का कठिन सिंटैक्स रट्टा मारना`,
        `फंक्शन्स को छोड़ कर सारा कोड एक ही फाइल में बिना स्ट्रक्चर के लिखना`,
        `एरर हैंडलिंग को नजरअंदाज कर देना`,
      ],
      correctIndex: 0,
      explanationEn: `Correct! Breaking complexity into simple, modular pieces is the fundamental secret of senior software engineering.`,
      explanationHi: `बिल्कुल सही! बड़ी और कठिन चीज़ों को छोटे-छोटे आसान ब्लॉक्स में तोड़ना ही अच्छे सॉफ्टवेयर इंजीनियर की पहचान है।`,
    },
    keyTakeawaysEn: ["Mastery Check Complete", "Ready for Code Playground", "100% Prepared"],
    keyTakeawaysHi: ["मास्टरी चेक पूरा", "प्लेग्राउंड के लिए तैयार", "100% रेडी"],
  });

  return scenes;
}
