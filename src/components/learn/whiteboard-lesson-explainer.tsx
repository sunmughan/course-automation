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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { speakText, stopSpeaking } from "@/lib/speech";
import { getAuthHeaders } from "@/lib/fetch-helpers";

export type ExplanationLanguage = "en" | "hi";

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
  diagramNodes?: Array<{
    id: string;
    labelEn: string;
    labelHi: string;
    sublabelEn?: string;
    sublabelHi?: string;
    color: string;
    activeOnStep?: number;
  }>;
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

  // Generate multi-lingual scenes
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
        ? `${currentScene.titleHi}. ${currentScene.handwrittenNotesHi.join(". ")}. ${currentScene.explanationHi}`
        : `${currentScene.titleEn}. ${currentScene.handwrittenNotesEn.join(". ")}. ${currentScene.explanationEn}`;

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
      recognitionRef.current?.stop();
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
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join("");
        setSpokenTranscript(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListeningMic(false);
      };

      recognition.onend = () => {
        setIsListeningMic(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListeningMic(false);
    }
  }, [isListeningMic, language]);

  const handleAskVoiceQuestion = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsAiAnswering(true);
    try {
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: `[Instruction: Student is asking a question while viewing the lesson "${lessonTitle}" - "${topicTitle}". Answer concisely in 2-3 sentences in ${
            language === "hi" ? "natural Hindi/Hinglish" : "clear English"
          } with a warm teacher tone]: ${queryText}`,
          mode: "explain",
        }),
      });

      if (!res.ok) throw new Error("AI response failed");
      const data = await res.json();
      const answer = data.content || data.message || "Great question! Keep exploring the concepts and test your code in the playground.";
      setAiQuickAnswer(answer);

      // Auto speak the AI response
      speakText({
        text: answer,
        lang: language,
        rate: 1.0,
      });
    } catch {
      setAiQuickAnswer("Doubt received! Please open the AI Tutor tab on the right for an in-depth conversation.");
    } finally {
      setIsAiAnswering(false);
    }
  };

  // Auto-play timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      const duration = 10000 / playbackSpeed;
      timer = setTimeout(() => {
        if (currentSceneIndex < scenes.length - 1) {
          setCurrentSceneIndex((prev) => prev + 1);
          setSelectedQuizAnswer(null);
          setShowQuizFeedback(false);
          setActiveFlowStep((prev) => (prev + 1) % 4);
        } else {
          setIsPlaying(false);
        }
      }, duration);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentSceneIndex, scenes.length, playbackSpeed]);

  const handleNext = () => {
    stopSpeaking();
    setIsVoiceNarrationActive(false);
    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex((prev) => prev + 1);
      setSelectedQuizAnswer(null);
      setShowQuizFeedback(false);
      setActiveFlowStep((prev) => (prev + 1) % 4);
    }
  };

  const handlePrev = () => {
    stopSpeaking();
    setIsVoiceNarrationActive(false);
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex((prev) => prev - 1);
      setSelectedQuizAnswer(null);
      setShowQuizFeedback(false);
      setActiveFlowStep((prev) => (prev - 1 + 4) % 4);
    }
  };

  const handleRestart = () => {
    stopSpeaking();
    setIsVoiceNarrationActive(false);
    setCurrentSceneIndex(0);
    setSelectedQuizAnswer(null);
    setShowQuizFeedback(false);
    setIsPlaying(false);
    setActiveFlowStep(0);
  };

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

  const activeTitle = language === "hi" ? currentScene.titleHi : currentScene.titleEn;
  const activeSubtitle = language === "hi" ? currentScene.subtitleHi : currentScene.subtitleEn;
  const activeNotes = language === "hi" ? currentScene.handwrittenNotesHi : currentScene.handwrittenNotesEn;
  const activeExplanation = language === "hi" ? currentScene.explanationHi : currentScene.explanationEn;
  const activeAnalogy = language === "hi" ? currentScene.analogyHi : currentScene.analogyEn;
  const activeTakeaways = language === "hi" ? currentScene.keyTakeawaysHi : currentScene.keyTakeawaysEn;

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-800/90 bg-[#0B0F19] text-white flex flex-col shadow-2xl transition-all ${
        isFullscreen ? "h-screen w-screen rounded-none p-4 sm:p-6" : "min-h-[640px]"
      }`}
    >
      {/* ── 1. Top Professional Classroom Toolbar ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md shrink-0">
        {/* Left: Teacher Branding & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20 shrink-0">
            <GraduationCap className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 font-mono">
                {language === "hi" ? "इंटरैक्टिव क्लासरूम स्टूडियो" : "Interactive Classroom Studio"}
              </span>
              <Badge variant="outline" className="text-[10px] px-2 py-0 h-4 border-slate-700 bg-slate-800/60 text-slate-300">
                Scene {currentSceneIndex + 1} / {scenes.length}
              </Badge>
            </div>
            <h2 className="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-xs sm:max-w-md">
              {lessonTitle} · {topicTitle}
            </h2>
          </div>
        </div>

        {/* Right: Language, Voice Narrator, Mic, Visualizer, Fullscreen */}
        <div className="flex items-center gap-2 flex-wrap">
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
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
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
        <div className="mx-5 sm:mx-8 mt-3 p-4 rounded-xl bg-slate-900/95 border border-sky-500/30 text-xs text-white space-y-2.5 shadow-xl animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sky-400 flex items-center gap-1.5">
              <Radio className="size-3.5 animate-pulse text-sky-400" />
              {isListeningMic ? "Listening to your voice..." : "Voice Question:"}
            </span>
            <button
              onClick={() => {
                setSpokenTranscript("");
                setAiQuickAnswer(null);
              }}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕ Close
            </button>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-sans italic">
            {spokenTranscript || "Kripya mic me bole (e.g. 'Node.js event loop kya hota hai?')..."}
          </div>

          {!aiQuickAnswer && spokenTranscript && (
            <Button
              size="sm"
              onClick={() => handleAskVoiceQuestion(spokenTranscript)}
              disabled={isAiAnswering}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs h-8 gap-1.5"
            >
              {isAiAnswering ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Ask Teacher AI
            </Button>
          )}

          {aiQuickAnswer && (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 space-y-1">
              <span className="font-bold text-emerald-400 block text-xs">Teacher AI Response:</span>
              <p className="leading-relaxed font-sans text-xs sm:text-sm text-slate-200">{aiQuickAnswer}</p>
            </div>
          )}
        </div>
      )}

      {/* ── 2. Main Classroom Canvas Area ────────────────────────────────────── */}
      <div className="flex-1 relative p-6 sm:p-8 overflow-y-auto flex flex-col justify-between space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentScene.id}_${language}`}
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
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                {activeTitle}
              </h1>
            </div>

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

            {/* Interactive Data Flow Pipeline (No annoying duplicate outlines) */}
            {showVisualizerFlow && currentScene.diagramNodes && currentScene.diagramNodes.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 relative shadow-inner"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono flex items-center gap-1.5">
                    <Workflow className="size-3.5 text-indigo-400" />
                    {language === "hi" ? "आर्किटेक्चरल डेटा फ्लो (Live Execution Flow)" : "Architectural Execution Flow"}
                  </span>
                  <Badge variant="outline" className="text-[10px] border-indigo-500/30 text-indigo-300">
                    Step {activeFlowStep + 1} / {currentScene.diagramNodes.length}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 py-3">
                  {currentScene.diagramNodes.map((node: any, nIdx: number) => {
                    const isStepActive = activeFlowStep === nIdx;
                    return (
                      <div key={node.id} className="flex items-center gap-3">
                        <button
                          onClick={() => setActiveFlowStep(nIdx)}
                          className={`px-4 py-3 rounded-xl border flex flex-col items-center justify-center min-w-[140px] shadow-sm transition-all cursor-pointer ${
                            isStepActive
                              ? "ring-2 ring-sky-400 scale-105 border-sky-400 bg-slate-900 text-white font-bold"
                              : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                          }`}
                        >
                          <span className="text-xs font-bold font-mono tracking-tight">
                            {language === "hi" ? node.labelHi : node.labelEn}
                          </span>
                          {(node.sublabelHi || node.sublabelEn) && (
                            <span className="text-[10px] text-slate-400 font-sans mt-0.5">
                              {language === "hi" ? node.sublabelHi : node.sublabelEn}
                            </span>
                          )}
                        </button>
                        {nIdx < (currentScene.diagramNodes?.length || 0) - 1 && (
                          <div className="flex items-center gap-1">
                            <span className="size-1.5 rounded-full bg-sky-400 animate-ping" />
                            <ArrowRight className="size-4 text-sky-400 shrink-0" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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

            {/* Teacher Mental Model & Explanation */}
            <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5 shadow-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                <Lightbulb className="size-4 text-amber-400" />
                <span>
                  {language === "hi" ? "शिक्षक की व्याख्या और मेंटल मॉडल:" : "Teacher Explanation & Mental Model:"}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                <MarkdownRenderer content={activeExplanation} />
              </div>
              {activeAnalogy && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 text-xs sm:text-sm text-amber-300/90 italic flex items-start gap-2">
                  <span className="font-bold shrink-0 font-mono text-amber-400">💡 {language === "hi" ? "उदाहरण:" : "Analogy:"}</span>
                  <span>{activeAnalogy}</span>
                </div>
              )}
            </div>

            {/* Interactive Knowledge Checkpoint / Quiz Scene */}
            {currentScene.quizQuestion && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl bg-slate-900/80 border border-purple-500/30 space-y-4 shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-md bg-purple-500/20 text-purple-400">
                    <HelpCircle className="size-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono">
                    {language === "hi" ? "व्हाइटबोर्ड समझ की जांच (Quick Quiz Check)" : "Whiteboard Knowledge Check"}
                  </span>
                </div>

                <p className="text-sm font-semibold text-white">
                  {language === "hi" ? currentScene.quizQuestion.questionHi : currentScene.quizQuestion.questionEn}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(language === "hi" ? currentScene.quizQuestion.optionsHi : currentScene.quizQuestion.optionsEn).map((opt: string, optIdx: number) => {
                    const isSelected = selectedQuizAnswer === optIdx;
                    const isCorrect = optIdx === currentScene.quizQuestion?.correctIndex;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => {
                          setSelectedQuizAnswer(optIdx);
                          setShowQuizFeedback(true);
                        }}
                        className={`p-3.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          showQuizFeedback
                            ? isCorrect
                              ? "bg-emerald-500/20 border-emerald-500 text-emerald-200 font-bold"
                              : isSelected
                              ? "bg-rose-500/20 border-rose-500 text-rose-200"
                              : "bg-slate-950 border-slate-800 text-slate-400 opacity-60"
                            : isSelected
                            ? "bg-purple-500/20 border-purple-500 text-purple-200"
                            : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        <span className="font-mono font-bold mr-2 text-slate-500">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {showQuizFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-400 block mb-0.5">
                        {selectedQuizAnswer === currentScene.quizQuestion.correctIndex
                          ? language === "hi" ? "बिल्कुल सही जवाब! बहुत शानदार समझ!" : "Correct! Excellent understanding!"
                          : language === "hi" ? "कोई बात नहीं, मुख्य बात यह है:" : "Not quite, but here is the key takeaway:"}
                      </span>
                      <span className="text-slate-300 leading-relaxed font-sans">
                        {language === "hi" ? currentScene.quizQuestion.explanationHi : currentScene.quizQuestion.explanationEn}
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Bottom Key Takeaways Pills */}
            {activeTakeaways && activeTakeaways.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <span className="text-[11px] text-slate-400 font-mono font-semibold mr-1">
                  {language === "hi" ? "मुख्य बिंदु (Takeaways):" : "Takeaways:"}
                </span>
                {activeTakeaways.map((t: string, tIdx: number) => (
                  <Badge
                    key={tIdx}
                    variant="outline"
                    className="text-[10px] bg-slate-900/80 border-slate-800 text-sky-300 font-sans"
                  >
                    ✓ {t}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── 3. Bottom Classroom Playback & Controller Bar ─────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-slate-800/80 bg-slate-900/70 backdrop-blur-md shrink-0">
        {/* Play / Pause / Reset */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`h-8 text-xs font-semibold gap-1.5 transition-colors ${
              isPlaying
                ? "bg-amber-600 hover:bg-amber-500 text-white"
                : "bg-sky-600 hover:bg-sky-500 text-white font-bold"
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="size-3.5" /> {language === "hi" ? "रोकें (Pause)" : "Pause"}
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" /> {language === "hi" ? "ऑटो-व्याख्या (Auto-Explain)" : "Auto-Explain"}
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRestart}
            className="h-8 w-8 text-slate-400 hover:text-white"
            title="Restart from Scene 1"
          >
            <RotateCcw className="size-3.5" />
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
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Bilingual Scene Generator (English & Hindi / Hinglish)
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

  // Scene 1: Introduction & Mental Model
  scenes.push({
    id: `scene_${sceneNum}`,
    sceneNumber: sceneNum++,
    titleEn: `Introduction to ${lessonTitle}`,
    titleHi: `${lessonTitle} का परिचय और फंडामेंटल`,
    subtitleEn: `Core Architecture & Pipeline`,
    subtitleHi: `मुख्य आर्किटेक्चर और पाइपलाइन`,
    type: "concept",
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
    analogyEn: `Think of this concept like the blueprint of a skyscraper: before laying the foundation, we must understand the load-bearing beams and execution pipeline.`,
    analogyHi: `इसे एक ऑटोमेटेड डिलीवरी सिस्टम की तरह समझें: जैसे ही पार्सल आता है, उसे सही काउंटर पर भेजा जाता है और बिना रुके तुरंत डिलीवर किया जाता है।`,
    diagramNodes: [
      { id: "client", labelEn: "Client Request", labelHi: "क्लाइंट रिक्वेस्ट", sublabelEn: "Browser / App", sublabelHi: "ब्राउज़र / मोबाइल", color: "border-sky-500/50 bg-sky-500/10" },
      { id: "engine", labelEn: `${topicTitle}`, labelHi: `${topicTitle} इंजन`, sublabelEn: "Processing Engine", sublabelHi: "डेटा प्रोसेसिंग", color: "border-indigo-500/50 bg-indigo-500/10" },
      { id: "output", labelEn: "Result Output", labelHi: "रिस्पॉन्स स्टेट", sublabelEn: "State / Response", sublabelHi: "सक्सेसफुल स्टेट", color: "border-emerald-500/50 bg-emerald-500/10" },
    ],
    keyTakeawaysEn: ["Core Mental Model", "Foundation Principles", "Pipeline Architecture"],
    keyTakeawaysHi: ["मूल मेंटल मॉडल", "फाउंडेशन सिद्धांत", "आर्किटेक्चर पाइपलाइन"],
  });

  // Scene 2..N: Deep Dive into Each Concept
  if (concepts && concepts.length > 0) {
    concepts.forEach((concept, cIdx) => {
      scenes.push({
        id: `scene_${sceneNum}`,
        sceneNumber: sceneNum++,
        titleEn: concept.title,
        titleHi: `${concept.title} (गहराई से समझें)`,
        subtitleEn: `Concept 0${cIdx + 1} Breakdown`,
        subtitleHi: `कॉन्सेप्ट 0${cIdx + 1} का विश्लेषण`,
        type: "deep_dive",
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
        explanationHi: `${concept.description}\n\n**टीचर टिप:** इस कॉन्सेप्ट को कोड में इस्तेमाल करते वक्त हमेशा ध्यान रखें कि फंक्शनल प्योरिटी और डेटा सेफ्टी बनी रहे।`,
        analogyEn: `Imagine a postal distribution center: every packet is verified, labeled with metadata, and routed through non-blocking queues.`,
        analogyHi: `जैसे रेलवे सिग्नल सिस्टम में हर ट्रेन को ट्रैक पर बिना टकराए सही प्लेटफॉर्म पर भेजा जाता है, वैसे ही यह कॉन्सेप्ट काम करता है।`,
        diagramNodes: [
          { id: `c_in_${cIdx}`, labelEn: "Input Event", labelHi: "इनपुट इवेंट", sublabelEn: "Initial State", sublabelHi: "शुरुआती स्टेट", color: "border-amber-500/50 bg-amber-500/10" },
          { id: `c_core_${cIdx}`, labelEn: concept.title, labelHi: concept.title, sublabelEn: "Transformation Logic", sublabelHi: "लॉजिक निष्पादन", color: "border-sky-500/50 bg-sky-500/10" },
          { id: `c_out_${cIdx}`, labelEn: "Resolved State", labelHi: "सुलझा हुआ स्टेट", sublabelEn: "Safe & Validated", sublabelHi: "सुरक्षित डेटा", color: "border-emerald-500/50 bg-emerald-500/10" },
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
      questionEn: `What is the primary architectural principle demonstrated in ${lessonTitle}?`,
      questionHi: `${lessonTitle} में सबसे मुख्य आर्किटेक्चरल सिद्धांत क्या है?`,
      optionsEn: [
        `Strict separation of concerns with predictable state transitions and error handling`,
        `Writing all logic in a single monolithic function for faster execution`,
        `Ignoring edge cases and relying solely on global mutable state`,
        `Bypassing runtime validation to reduce lines of code`,
      ],
      optionsHi: [
        `साफ-सुथरा सेपरेशन, प्रेडिक्टेबल स्टेट फ्लो और मजबूत एरर हैंडलिंग`,
        `सारे कोड को एक ही विशाल फंक्शन में बिना किसी स्ट्रक्चर के लिखना`,
        `एज केसेस को नजरअंदाज करके केवल ग्लोबल वेरिएबल्स पर निर्भर रहना`,
        `कम कोड लिखने के चक्कर में इनपुट वैलिडेशन को पूरी तरह छोड़ देना`,
      ],
      correctIndex: 0,
      explanationEn: `Correct! Modern software engineering relies on strict separation of concerns, defensive programming against edge cases, and predictable data flow.`,
      explanationHi: `बिल्कुल सही! आधुनिक सॉफ्टवेयर इंजीनियरिंग में मॉड्यूलरिटी, एरर सेफ्टी और प्रेडिक्टेबल डेटा फ्लो सबसे महत्वपूर्ण होता है।`,
    },
    keyTakeawaysEn: ["Mastery Check Complete", "Ready for Code Playground", "100% Prepared"],
    keyTakeawaysHi: ["मास्टरी चेक पूरा", "प्लेग्राउंड के लिए तैयार", "100% रेडी"],
  });

  return scenes;
}
