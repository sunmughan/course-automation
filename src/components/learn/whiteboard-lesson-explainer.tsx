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
  Theater,
  Dice5,
  MessageSquare,
  PartyPopper,
  Film,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { speakText, stopSpeaking } from "@/lib/speech";
import { getAuthHeaders } from "@/lib/fetch-helpers";

export type ExplanationLanguage = "en" | "hi";
export type ExplanationSimplicityMode = "easy" | "standard";
export type ExplainerViewTab = "story" | "whiteboard" | "flow";
export type StoryTheme = "cricket" | "restaurant" | "detective" | "bollywood" | "space" | "startup";

export interface StoryDialogue {
  speaker: string;
  emoji: string;
  text: string;
}

export interface StoryChoiceOption {
  text: string;
  outcome: string;
  isCorrect: boolean;
}

export interface StoryEpisode {
  title: string;
  theme: StoryTheme;
  setting: string;
  characters: Array<{ name: string; role: string; emoji: string }>;
  dialogues: StoryDialogue[];
  choiceMoment: {
    question: string;
    options: StoryChoiceOption[];
  };
  moral: string;
  tinyCode: string;
}

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
  easySummaryEn?: string;
  easySummaryHi?: string;
  memoryTrickEn?: string;
  memoryTrickHi?: string;
  problemVsSolutionEn?: { without: string; with: string };
  problemVsSolutionHi?: { without: string; with: string };
  storyEpisode?: StoryEpisode;
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
  // Default to interactive Story Mode for maximum engagement
  const [viewTab, setViewTab] = useState<ExplainerViewTab>("story");
  const [simplicityMode, setSimplicityMode] = useState<ExplanationSimplicityMode>("easy");
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [selectedStoryTheme, setSelectedStoryTheme] = useState<StoryTheme>("cricket");
  const [dynamicStory, setDynamicStory] = useState<StoryEpisode | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [selectedStoryChoice, setSelectedStoryChoice] = useState<number | null>(null);
  const [showStoryChoiceFeedback, setShowStoryChoiceFeedback] = useState(false);

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

  // Generate multi-lingual scenes with topic-specific tailored stories
  const scenes = useMemo(() => {
    return generateBilingualWhiteboardScenes({
      lessonTitle,
      topicTitle,
      courseTitle,
      moduleTitle,
      lessonContent,
      lessonExplanation,
      concepts,
      examples,
    });
  }, [lessonTitle, topicTitle, courseTitle, moduleTitle, lessonContent, lessonExplanation, concepts, examples]);

  const currentScene = scenes[currentSceneIndex] || scenes[0];
  const activeStory = dynamicStory || currentScene.storyEpisode;

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

  // Fetch AI Dynamic Storyteller Twist
  const handleGenerateNewAIStory = async (themeToUse: StoryTheme = selectedStoryTheme) => {
    setIsGeneratingStory(true);
    setSelectedStoryChoice(null);
    setShowStoryChoiceFeedback(false);
    try {
      const res = await fetch("/api/ai/storyteller", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          lessonTitle,
          topicTitle,
          courseTitle,
          theme: themeToUse,
          language,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.story) {
          setDynamicStory(data.story);
        }
      }
    } catch {
      // Keep existing fallback
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleSpeakCurrentScene = useCallback(() => {
    if (isVoiceNarrationActive) {
      stopSpeaking();
      setIsVoiceNarrationActive(false);
      return;
    }

    let textToSpeak = "";
    if (viewTab === "story" && activeStory) {
      textToSpeak = `${activeStory.title}. ${activeStory.setting}. ` +
        activeStory.dialogues.map((d) => `${d.speaker} says: ${d.text}`).join(". ") +
        `. Moral of the story: ${activeStory.moral}`;
    } else {
      textToSpeak =
        language === "hi"
          ? `${currentScene.titleHi}. ${currentScene.easySummaryHi || ""}. ${currentScene.handwrittenNotesHi.join(". ")}. ${currentScene.explanationHi}`
          : `${currentScene.titleEn}. ${currentScene.easySummaryEn || ""}. ${currentScene.handwrittenNotesEn.join(". ")}. ${currentScene.explanationEn}`;
    }

    speakText({
      text: textToSpeak,
      lang: language,
      rate: playbackSpeed,
      onStart: () => setIsVoiceNarrationActive(true),
      onEnd: () => setIsVoiceNarrationActive(false),
      onError: () => setIsVoiceNarrationActive(false),
    });
  }, [currentScene, activeStory, viewTab, language, playbackSpeed, isVoiceNarrationActive]);

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
          message: `Explain as a fun interactive story with characters: ${question}`,
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
      setDynamicStory(null);
      setSelectedStoryChoice(null);
      setShowStoryChoiceFeedback(false);
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
      setDynamicStory(null);
      setSelectedStoryChoice(null);
      setShowStoryChoiceFeedback(false);
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
      {/* Top Classroom Mode Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md shrink-0">
        {/* Left: View Tabs (Story / Whiteboard / Flow) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewTab("story")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewTab === "story"
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Theater className="size-3.5 text-pink-300" />
              <span>{language === "hi" ? "🎭 कहानी मोड (Story Comic)" : "🎭 Story Mode"}</span>
              <span className="bg-pink-400 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                Fun
              </span>
            </button>

            <button
              onClick={() => setViewTab("whiteboard")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewTab === "whiteboard"
                  ? "bg-sky-600 text-white shadow-md font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smile className="size-3.5 text-sky-300" />
              <span>{language === "hi" ? "📝 आसान फॉर्मूले (Notes)" : "📝 Whiteboard"}</span>
            </button>

            <button
              onClick={() => setViewTab("flow")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewTab === "flow"
                  ? "bg-indigo-600 text-white shadow-md font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Workflow className="size-3.5 text-indigo-300" />
              <span>{language === "hi" ? "⚡ लाइव डेटा फ्लो (Flow)" : "⚡ Live Flow"}</span>
            </button>
          </div>
        </div>

        {/* Right: Language, Voice Narrator, Mic, Fullscreen */}
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
            title="Read Scene Aloud with Voice"
          >
            {isVoiceNarrationActive ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5 text-pink-400" />}
            <span className="hidden sm:inline">{isVoiceNarrationActive ? "Stop Voice" : "Story Voice"}</span>
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
                  ? "AI स्टोरीटेलर का जवाब:"
                  : "AI Storyteller Response:"}
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
              <div className="flex items-center gap-1.5 text-pink-400 font-medium">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Creating a captivating story response...</span>
              </div>
            )}
            {aiQuickAnswer && (
              <p className="text-emerald-300 font-sans leading-relaxed pt-1">{aiQuickAnswer}</p>
            )}
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-y-auto p-6 relative flex flex-col justify-between">
        {/* Ambient Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-5xl mx-auto w-full">
          {/* TAB 1: 🎭 INTERACTIVE STORY & COMIC STUDIO */}
          {viewTab === "story" && activeStory && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Story Header & Theme Selector */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-pink-950/80 border border-purple-500/30 shadow-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xs px-2.5 py-0.5">
                      🎬 Story Episode
                    </Badge>
                    <span className="text-xs text-purple-300 font-mono font-medium">
                      {lessonTitle} · {topicTitle}
                    </span>
                  </div>

                  {/* AI Generate Story Themes */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-400 font-mono">Theme:</span>
                    {(["cricket", "restaurant", "detective", "bollywood", "space"] as StoryTheme[]).map((thm) => (
                      <button
                        key={thm}
                        onClick={() => {
                          setSelectedStoryTheme(thm);
                          handleGenerateNewAIStory(thm);
                        }}
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold capitalize transition-all cursor-pointer ${
                          selectedStoryTheme === thm
                            ? "bg-pink-500 text-white shadow-xs"
                            : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        {thm === "cricket" ? "🏏 Cricket" : thm === "restaurant" ? "🍕 Pizza Shop" : thm === "detective" ? "🕵️ Detective" : thm === "bollywood" ? "🎬 Bollywood" : "🚀 Space"}
                      </button>
                    ))}
                    <Button
                      size="sm"
                      onClick={() => handleGenerateNewAIStory()}
                      disabled={isGeneratingStory}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-7 px-2.5 gap-1 shadow-md"
                    >
                      {isGeneratingStory ? <Loader2 className="size-3 animate-spin" /> : <Dice5 className="size-3 text-pink-300" />}
                      {isGeneratingStory ? "Crafting..." : "AI se Nayi Kahani"}
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    {activeStory.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-purple-200/90 italic font-sans">
                    "{activeStory.setting}"
                  </p>
                </div>

                {/* Character Cast Avatars */}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-purple-500/20">
                  <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                    Characters:
                  </span>
                  {activeStory.characters.map((char, cIdx) => (
                    <Badge
                      key={cIdx}
                      variant="outline"
                      className="bg-slate-950/80 border-purple-500/30 text-slate-200 text-xs py-0.5 px-2 gap-1.5"
                    >
                      <span>{char.emoji}</span>
                      <strong className="text-purple-300">{char.name}</strong>
                      <span className="text-[10px] text-slate-400">({char.role})</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Story Dialogues Comic Strip */}
              <div className="space-y-3.5">
                {activeStory.dialogues.map((dlg, dIdx) => (
                  <motion.div
                    key={dIdx}
                    initial={{ opacity: 0, x: dIdx % 2 === 0 ? -15 : 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: dIdx * 0.15 + 0.1 }}
                    className={`flex items-start gap-3 p-4 rounded-2xl border shadow-lg ${
                      dIdx % 2 === 0
                        ? "bg-slate-900/90 border-slate-800 mr-4 sm:mr-12"
                        : "bg-slate-900/90 border-purple-500/30 ml-4 sm:ml-12"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/40 text-xl shadow-md">
                      {dlg.emoji}
                    </div>
                    <div className="space-y-1 flex-1">
                      <span className="text-xs font-bold text-purple-300 font-mono">
                        {dlg.speaker}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed font-medium">
                        "{dlg.text}"
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Interactive Story Choice Moment */}
              {activeStory.choiceMoment && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-indigo-500/30 shadow-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                      🎮 Decision Moment: Ab aap kahani aage badhayein!
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {activeStory.choiceMoment.question}
                  </h3>

                  <div className="grid gap-2.5">
                    {activeStory.choiceMoment.options.map((opt, optIdx) => {
                      const isSelected = selectedStoryChoice === optIdx;
                      let btnStyle = "bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500";
                      if (showStoryChoiceFeedback) {
                        if (opt.isCorrect) {
                          btnStyle = "bg-emerald-950/70 border-emerald-500 text-emerald-100 font-semibold shadow-emerald-500/10";
                        } else if (isSelected && !opt.isCorrect) {
                          btnStyle = "bg-rose-950/70 border-rose-500 text-rose-100";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-purple-950/60 border-purple-500 text-purple-200";
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => {
                            setSelectedStoryChoice(optIdx);
                            setShowStoryChoiceFeedback(true);
                          }}
                          className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${btnStyle}`}
                        >
                          <span className="font-mono">{opt.text}</span>
                          {showStoryChoiceFeedback && opt.isCorrect && <Check className="size-4 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {showStoryChoiceFeedback && selectedStoryChoice !== null && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 space-y-1"
                    >
                      <span className="font-bold text-amber-300 block font-mono text-xs">
                        🎬 Story Outcome:
                      </span>
                      <p className="font-sans leading-relaxed text-slate-200">
                        {activeStory.choiceMoment.options[selectedStoryChoice]?.outcome}
                      </p>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Moral of the Story & Tiny 3-Line Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold font-mono">
                    <Trophy className="size-4 text-amber-400" />
                    <span>🏆 Moral of the Story (Never Forget):</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-100 font-sans font-medium leading-relaxed">
                    {activeStory.moral}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="font-bold text-emerald-400 flex items-center gap-1">
                      <Code2 className="size-3.5" />
                      3-Line Code Pattern
                    </span>
                    {onOpenPlayground && (
                      <button
                        onClick={onOpenPlayground}
                        className="text-sky-400 hover:underline cursor-pointer text-[11px]"
                      >
                        Run in Playground &rarr;
                      </button>
                    )}
                  </div>
                  <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                    <code>{activeStory.tinyCode}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: 📝 WHITEBOARD EASY FORMULAS & PROBLEM VS SOLUTION */}
          {viewTab === "whiteboard" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-sky-500/20 text-sky-300 border-sky-500/40 text-[10px]">
                    {currentScene.type.replace("_", " ")}
                  </Badge>
                  {activeSubtitle && (
                    <span className="text-xs text-slate-400 italic font-mono">
                      // {activeSubtitle}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {activeTitle}
                </h1>
              </div>

              {/* 1-Line Core Summary Banner */}
              {activeEasySummary && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-500/30 shadow-lg flex items-start gap-3">
                  <Sparkles className="size-4 text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 font-mono block">
                      🎯 1-लाइन में सीधा मतलब:
                    </span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed">
                      {activeEasySummary}
                    </p>
                  </div>
                </div>
              )}

              {/* 5-Second Memory Card */}
              {activeMemoryTrick && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/50 border border-amber-500/40 shadow-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold font-mono">
                    <Lightbulb className="size-4 text-amber-400 animate-pulse" />
                    <span>💡 5-Second Memory Formula:</span>
                  </div>
                  <pre className="text-xs sm:text-sm font-mono font-bold text-amber-200 bg-slate-950/80 p-3 rounded-lg border border-amber-500/30 overflow-x-auto whitespace-pre-wrap">
                    <code>{activeMemoryTrick}</code>
                  </pre>
                </div>
              )}

              {/* Problem vs Solution Side-by-Side */}
              {activeProblemVsSolution && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold font-mono">
                      <AlertTriangle className="size-3.5" />
                      <span>❌ इसके बिना क्या मुसीबत थी?</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {activeProblemVsSolution.without}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono">
                      <CheckCircle2 className="size-3.5" />
                      <span>✅ इससे क्या जादू हुआ?</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {activeProblemVsSolution.with}
                    </p>
                  </div>
                </div>
              )}

              {/* Concept Notes Cards */}
              {activeNotes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {activeNotes.map((note: string, i: number) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-slate-200 shadow-md flex items-start gap-3"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 text-xs font-mono font-bold shrink-0 mt-0.5">
                        0{i + 1}
                      </span>
                      <p className="text-xs sm:text-sm leading-relaxed font-sans font-medium text-slate-200">
                        {note}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Real World Analogy */}
              {activeAnalogy && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="size-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                      🍰 देसी रियल-लाइफ उदाहरण (Mental Model)
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans italic">
                    "{activeAnalogy}"
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: ⚡ LIVE FLOW ANIMATION PIPELINE */}
          {viewTab === "flow" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border border-slate-800 space-y-4 relative shadow-2xl"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 font-mono flex items-center gap-1.5">
                  <Zap className="size-4 text-amber-400 fill-amber-400/20" />
                  {language === "hi"
                    ? "आर्किटेक्चरल एग्जीक्यूशन फ्लो (Step-by-Step Animation)"
                    : "Architectural Execution Flow"}
                </span>

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

              {/* Flow Stage Node Pills */}
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
                            ? "ring-2 ring-sky-400 scale-105 border-sky-400 bg-slate-900 text-white font-bold"
                            : "bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                        }`}
                      >
                        {isStepActive && (
                          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-sky-400 to-indigo-500" />
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

              {/* Active Step Deep Breakdown Card */}
              {currentActiveNode && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                    <h4 className="text-xs sm:text-sm font-bold text-amber-300 font-mono">
                      {language === "hi" ? currentActiveNode.phaseHi : currentActiveNode.phaseEn}
                    </h4>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={activeFlowStep === 0}
                        onClick={() => setActiveFlowStep((prev) => Math.max(0, prev - 1))}
                        className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
                      >
                        <ChevronLeft className="size-3 mr-0.5" />
                        Prev
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={activeFlowStep === activeNodes.length - 1}
                        onClick={() => setActiveFlowStep((prev) => Math.min(activeNodes.length - 1, prev + 1))}
                        className="h-6 px-2 text-[10px] text-slate-400 hover:text-white"
                      >
                        Next
                        <ChevronRight className="size-3 ml-0.5" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans font-medium">
                    {language === "hi" ? currentActiveNode.whatHappensHi : currentActiveNode.whatHappensEn}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase font-mono">
                        ⚡ {language === "hi" ? "डेटा और मेमोरी स्टेट:" : "Data & Memory State:"}
                      </span>
                      <pre className="text-[11px] font-mono text-indigo-200 overflow-x-auto whitespace-pre-wrap">
                        <code>{language === "hi" ? currentActiveNode.dataStateHi : currentActiveNode.dataStateEn}</code>
                      </pre>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">
                        💡 {language === "hi" ? "सीनियर डेवलपर रूल:" : "Senior Developer Rule:"}
                      </span>
                      <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                        {language === "hi" ? currentActiveNode.ruleHi : currentActiveNode.ruleEn}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Bottom Classroom Controls (Timeline & Prev/Next) */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 relative z-10 max-w-5xl mx-auto w-full">
          {/* Left: Voice Playback */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSpeakCurrentScene}
              className="h-8 text-xs border-slate-800 text-slate-300 hover:text-white"
            >
              {isVoiceNarrationActive ? <Pause className="size-3.5 mr-1" /> : <Play className="size-3.5 mr-1 fill-current text-pink-400" />}
              {isVoiceNarrationActive ? "Pause Voice" : "Play Story Voice"}
            </Button>
          </div>

          {/* Scene Navigation Step Indicators */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-xs sm:max-w-md py-1">
            {scenes.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentSceneIndex(i);
                  setDynamicStory(null);
                  setSelectedStoryChoice(null);
                  setShowStoryChoiceFeedback(false);
                  setActiveFlowStep(0);
                  setIsFlowAutoPlaying(false);
                }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentSceneIndex === i
                    ? "w-8 bg-pink-500"
                    : i < currentSceneIndex
                    ? "w-3 bg-purple-700"
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
// Dynamic Contextual Topic Story Generator for ALL Courses & Topics
// ─────────────────────────────────────────────────────────────────────────────
function buildTopicStoryEpisode({
  lessonTitle,
  topicTitle,
  courseTitle = "",
  moduleTitle = "",
  conceptTitle = "",
}: {
  lessonTitle: string;
  topicTitle: string;
  courseTitle?: string;
  moduleTitle?: string;
  conceptTitle?: string;
}): StoryEpisode {
  const combined = `${lessonTitle} ${topicTitle} ${moduleTitle} ${courseTitle} ${conceptTitle}`.toLowerCase();

  // 1. React State / useState
  if (combined.includes("state") || combined.includes("usestate")) {
    return {
      title: `Episode: The Case of the Frozen Cricket Scoreboard (useState)`,
      theme: "cricket",
      setting: "IPL Final match chal raha hai aur stadium me lakho fans live scoreboard dekh rahe hain!",
      characters: [
        { name: "रोहन (Junior Coder)", role: "Scoreboard Developer", emoji: "👨‍💻" },
        { name: "अंपायर React", role: "Decision Engine", emoji: "🧠" },
        { name: "स्टेडियम स्क्रीन", role: "Browser DOM", emoji: "🖥️" },
      ],
      dialogues: [
        {
          speaker: "रोहन (Junior Coder)",
          emoji: "👨‍💻",
          text: "धोनी ने छक्का मारा! मैंने कोड में runs = runs + 6 लिख दिया, लेकिन स्क्रीन पर अभी भी 0 रन क्यों दिख रहा है?",
        },
        {
          speaker: "अंपायर React",
          emoji: "🧠",
          text: "अरे रोहन! तूने नॉर्मल variable बदला! मुझे कैसे पता चलेगा? तुझे setCount(runs + 6) का रिमोट कंट्रोल दबाना था!",
        },
        {
          speaker: "स्टेडियम स्क्रीन",
          emoji: "🖥️",
          text: "जैसे ही रोहन ने रिमोट दबाया, मैंने 1 मिलीसेकंड में पूरे स्टेडियम को नया स्कोर दिखा दिया! 🏏🎉",
        },
      ],
      choiceMoment: {
        question: "रोहन को स्क्रीन अपडेट करने के लिए कौन सा कोड लिखना चाहिए?",
        options: [
          {
            text: "runs = runs + 6 (Direct change)",
            outcome: "❌ स्क्रीन फ्रीज हो गई! फैंस नाराज़ हो गए क्योंकि React को खबर ही नहीं हुई!",
            isCorrect: false,
          },
          {
            text: "setRuns(runs + 6) (State Setter)",
            outcome: "✅ स्टेडियम में जश्न मन गया! स्क्रीन तुरंत अपडेट हुई और सबने तालियाँ बजाईं! 🎉",
            isCorrect: true,
          },
        ],
      },
      moral: "💡 नियम: React में कभी direct mutation मत करो, हमेशा setter function से React को इन्फॉर्म करो!",
      tinyCode: `const [runs, setRuns] = useState(0);\n// Correct State Update\nsetRuns(runs + 6);`,
    };
  }

  // 2. React Components & JSX
  if (combined.includes("jsx") || combined.includes("component") || combined.includes("element")) {
    return {
      title: `Episode: The LEGO Master Builder Championship (Components & JSX)`,
      theme: "startup",
      setting: "एक इंटरनेशनल आर्किटेक्चर कॉम्पिटिशन जहाँ 1 घंटे में पूरी वेबसाइट की बिल्डिंग खड़ी करनी है!",
      characters: [
        { name: "बॉब (Master Builder)", role: "Frontend Engineer", emoji: "👷‍♂️" },
        { name: "जादुई ईंट (JSX Block)", role: "Reusable Component", emoji: "🧱" },
        { name: "क्लाइंट (Investor)", role: "CEO", emoji: "💼" },
      ],
      dialogues: [
        {
          speaker: "क्लाइंट (Investor)",
          emoji: "💼",
          text: "मुझे 100 पेजों की वेबसाइट चाहिए, पर डेवलपर कह रहा है कि 6 महीने लगेंगे हर पेज का बटन दोबारा बनाने में!",
        },
        {
          speaker: "बॉब (Master Builder)",
          emoji: "👷‍♂️",
          text: "सर! मैंने 1 बार <CustomButton /> और <Navbar /> का LEGO ब्लॉक बना लिया है, अब मैं 2 मिनट में 100 पेज असेंबल कर दूंगा!",
        },
        {
          speaker: "जादुई ईंट (JSX Block)",
          emoji: "🧱",
          text: "JSX की शक्ति देखो: JS के अंदर HTML लिखो और Babel से सुपरफास्ट रेंडर करो! 🚀",
        },
      ],
      choiceMoment: {
        question: "बॉब को हर पेज पर नया बटन बनाने के लिए क्या करना चाहिए?",
        options: [
          {
            text: "हर पेज में 50 लाइन का HTML कॉपी-पेस्ट करना",
            outcome: "❌ कोड इतना बड़ा हो गया कि बग्स ठीक करने में पूरा हफ्ता बर्बाद हो गया!",
            isCorrect: false,
          },
          {
            text: "1 Reusable <Button title='Click' /> Component बनाकर कॉल करना",
            outcome: "✅ इन्वेस्टर हैरान रह गया! वेबसाइट 5 मिनट में लाइव हो गई! 🎉",
            isCorrect: true,
          },
        ],
      },
      moral: "💡 नियम: UI को हमेशा छोटे Reusable Components में तोड़ो — Don't Repeat Yourself (DRY)!",
      tinyCode: `function Card({ title }) {\n  return <div className="card"><h3>{title}</h3></div>;\n}`,
    };
  }

  // 3. React Props
  if (combined.includes("prop")) {
    return {
      title: `Episode: Delhi University Smart ID Card Machine (React Props)`,
      theme: "startup",
      setting: "कॉलेज एडमिशन का पहला दिन और 5,000 नए स्टूडेंट्स का ID कार्ड 10 मिनट में प्रिंट करना है!",
      characters: [
        { name: "मशीन ऑपरेटर (Dev)", role: "Frontend Coder", emoji: "👨‍💻" },
        { name: "मास्टर ID टेम्प्लेट", role: "Child Component", emoji: "🖨️" },
        { name: "स्टूडेंट अमन", role: "Incoming Data (Props)", emoji: "👨‍🎓" },
      ],
      dialogues: [
        {
          speaker: "मशीन ऑपरेटर (Dev)",
          emoji: "👨‍💻",
          text: "5000 कार्ड बनाने हैं! क्या मुझे हर बच्चे के लिए अलग डिज़ाइन बनाना पड़ेगा?",
        },
        {
          speaker: "मास्टर ID टेम्प्लेट",
          emoji: "🖨️",
          text: "अरे नहीं! डिज़ाइन सबका सेम रहेगा। बस तुम मुझे Props में { name: 'Aman', roll: 101 } पास करते जाओ!",
        },
        {
          speaker: "स्टूडेंट अमन",
          emoji: "👨‍🎓",
          text: "अरे वाह! मेरा नाम और फोटो कार्ड पर प्रिंट होकर तुरंत बाहर आ गया!",
        },
      ],
      choiceMoment: {
        question: "Child component के अंदर props का डेटा कैसे इस्तेमाल करना चाहिए?",
        options: [
          {
            text: "props.name = 'Rahul' (Props को अंदर से बदलने की कोशिश करना)",
            outcome: "❌ Error! Props Read-Only (Immutable) होते हैं, उन्हें डायरेक्ट नहीं बदला जा सकता!",
            isCorrect: false,
          },
          {
            text: "<h1>{props.name}</h1> (Props को सिर्फ रीड करके डिस्प्ले करना)",
            outcome: "✅ सभी 5,000 स्टूडेंट्स के ID कार्ड बिना किसी एरर के प्रिंट हो गए! 🎉",
            isCorrect: true,
          },
        ],
      },
      moral: "💡 नियम: Props हमेशा Parent से Child में एक तरफा (Unidirectional) बहते हैं और Read-Only होते हैं!",
      tinyCode: `function StudentCard({ name, role }) {\n  return <h2>{name} - {role}</h2>;\n}`,
    };
  }

  // 4. React Events & Event Handlers
  if (combined.includes("event") || combined.includes("click") || combined.includes("handle")) {
    return {
      title: `Episode: Smart Home Doorbell & Burglar Alarm (Event Handling)`,
      theme: "detective",
      setting: "एक हाई-सिक्योरिटी विला जहाँ स्मार्ट डोरबेल और अलार्म सिस्टम लगा है!",
      characters: [
        { name: "सिक्योरिटी गार्ड (Browser)", role: "Event Listener", emoji: "👮‍♂️" },
        { name: "स्मार्ट डोरबेल", role: "SyntheticEvent Trigger", emoji: "🔔" },
        { name: "मालिक (Handler)", role: "Action Function", emoji: "🎩" },
      ],
      dialogues: [
        {
          speaker: "सिक्योरिटी गार्ड (Browser)",
          emoji: "👮‍♂️",
          text: "साहब! किसी ने गेट पर बटन दबाया है! अलार्म बजाऊँ या दरवाज़ा खोलूं?",
        },
        {
          speaker: "मालिक (Handler)",
          emoji: "🎩",
          text: "मैंने onClick={openDoor} का रिमोट लगा रखा है। जैसे ही क्लिक होगा, फंक्शन खुद चलेगा!",
        },
        {
          speaker: "स्मार्ट डोरबेल",
          emoji: "🔔",
          text: "डिंग-डोंग! क्लिक हुआ, SyntheticEvent बना और 1 सेकंड में एक्शन पूरा हो गया!",
        },
      ],
      choiceMoment: {
        question: "बटन में onClick लगाते वक्त कौन सा तरीका सही है?",
        options: [
          {
            text: "onClick={handleClick()} (ब्रैकेट लगाकर कॉल करना)",
            outcome: "❌ पेज लोड होते ही बिना क्लिक किए अलार्म बज गया और पुलिस आ गई!",
            isCorrect: false,
          },
          {
            text: "onClick={handleClick} (सिर्फ फंक्शन का नाम/रेफरेंस पास करना)",
            outcome: "✅ परफेक्ट! जब बटन दबाया गया तभी सही समय पर दरवाज़ा खुला! 🎉",
            isCorrect: true,
          },
        ],
      },
      moral: "💡 नियम: Event handler में फंक्शन का reference पास करो `onClick={handleClick}`, ब्रैकेट मत लगाओ!",
      tinyCode: `<button onClick={() => alert("Welcome!")}>Click Me</button>`,
    };
  }

  // 5. Node.js & Event Loop
  if (combined.includes("node") || combined.includes("event loop") || combined.includes("runtime")) {
    return {
      title: `Episode: The Non-Blocking Midnight Dhaba (Node.js & Event Loop)`,
      theme: "restaurant",
      setting: "मुंबई का सबसे बिजी मिडनाइट ढाबा जहाँ एक साथ 1000 ग्राहक आर्डर दे रहे हैं!",
      characters: [
        { name: "मास्टर शेफ (V8 Engine)", role: "Single Thread Master", emoji: "👨‍🍳" },
        { name: "स्मार्ट वेटर (Event Loop)", role: "Non-Blocking Manager", emoji: "🤵" },
        { name: "तंदूर हेल्पर (Libuv Pool)", role: "Background Worker", emoji: "🔥" },
      ],
      dialogues: [
        {
          speaker: "स्मार्ट वेटर (Event Loop)",
          emoji: "🤵",
          text: "शेफ साहब! टेबल 5 ने नान ऑर्डर की है जिसे पकने में 5 मिनट लगेंगे!",
        },
        {
          speaker: "मास्टर शेफ (V8 Engine)",
          emoji: "👨‍🍳",
          text: "नान को तंदूर हेल्पर (Worker) के पास भेजो! मैं 5 मिनट खाली नहीं बैठूंगा, लाओ टेबल 6 का चाय आर्डर दो!",
        },
        {
          speaker: "तंदूर हेल्पर (Libuv Pool)",
          emoji: "🔥",
          text: "नान तैयार होते ही मैंने कॉलबैक भेजा और वेटर ने तुरंत टेबल 5 पर पहुंचा दिया!",
        },
      ],
      choiceMoment: {
        question: "Node.js में भारी डेटाबेस या फाइल पढ़ने के काम को कैसे हैंडल करना चाहिए?",
        options: [
          {
            text: "Main Thread को ब्लॉक करके इंतजार करना",
            outcome: "❌ पूरा ढाबा जाम हो गया! बाकी 999 कस्टमर्स भूखे रह गए!",
            isCorrect: false,
          },
          {
            text: "Non-blocking Async/Await या Callback से बैकग्राउंड में भेजना",
            outcome: "✅ सुपरफास्ट! ढाबे ने 1 सेकंड में 1000 ऑर्डर्स निपटा दिए! 🎉",
            isCorrect: true,
          },
        ],
      },
      moral: "💡 नियम: Node.js Single Threaded है — कभी CPU को ब्लॉक मत करो, भारी काम को Non-Blocking Async रखो!",
      tinyCode: `const fs = require('fs/promises');\n// Non-blocking async reading\nconst data = await fs.readFile('notes.txt', 'utf8');`,
    };
  }

  // 6. Express Server & Routing
  if (combined.includes("express") || combined.includes("route") || combined.includes("api")) {
    return {
      title: `Episode: The 5-Star Hotel Reception Desk (Express REST API)`,
      theme: "restaurant",
      setting: "एक लक्ज़री 5-स्टार होटल का रिसेप्शन जहाँ हर सेकंड सैकड़ों गेस्ट आ रहे हैं!",
      characters: [
        { name: "होटल मैनेजर (Express app)", role: "Main Server", emoji: "🏨" },
        { name: "दरवाजे का गार्ड (Route /api)", role: "Endpoint Router", emoji: "🚪" },
        { name: "गेस्ट (Client)", role: "Frontend Request", emoji: "🧳" },
      ],
      dialogues: [
        {
          speaker: "गेस्ट (Client)",
          emoji: "🧳",
          text: "मुझे रूम नंबर 201 की चाबी चाहिए, मैंने GET /api/rooms/201 रिक्वेस्ट की है!",
        },
        {
          speaker: "होटल मैनेजर (Express app)",
          emoji: "🏨",
          text: "मैंने `app.get('/api/rooms/:id')` का काउंटर खोल रखा है। तुरंत ID चेक करके JSON रिस्पॉन्स दिया जाए!",
        },
        {
          speaker: "दरवाजे का गार्ड (Route /api)",
          emoji: "🚪",
          text: "200 OK! रूम मिल गया और गेस्ट को JSON में चाबी सौंप दी गई!",
        },
      ],
      choiceMoment: {
        question: "Express में नया यूजर डाटा सेव करने के लिए कौन सा HTTP मेथड यूज़ करेंगे?",
        options: [
          {
            text: "app.get('/api/users') से डाटा यूआरएल में भेजना",
            outcome: "❌ पासवर्ड और पर्सनल डाटा यूआरएल में लीक हो गया! सिक्योरिटी फेल!",
            isCorrect: false,
          },
          {
            text: "app.post('/api/users') और req.body से सुरक्षित JSON रिसीव करना",
            outcome: "✅ 201 Created! नया यूजर सुरक्षित तरीके से डेटाबेस में सेव हो गया! 🎉",
            isCorrect: true,
          },
        ],
      },
      moral: "💡 नियम: डेटा मंगाने के लिए GET, नया डेटा सेव करने के लिए POST और JSON Body का इस्तेमाल करो!",
      tinyCode: `app.get('/api/users', (req, res) => {\n  res.json([{ id: 1, name: 'Aman' }]);\n});`,
    };
  }

  // 7. Route Params (:id) & Query Params (?search=)
  if (combined.includes("param") || combined.includes("query") || combined.includes("search")) {
    return {
      title: `Episode: CID Crime Records Investigation (:id vs ?search)`,
      theme: "detective",
      setting: "CID हेडक्वार्टर में ACP प्रद्युमन और दया 10,000 अपराधियों की फाइलों में सर्च कर रहे हैं!",
      characters: [
        { name: "ACP प्रद्युमन", role: "Chief Detective", emoji: "🕵️‍♂️" },
        { name: "दया (Route Params :id)", role: "Exact Target Matcher", emoji: "💪" },
        { name: "अभिजीत (Query Params ?)", role: "Filter & Search Master", emoji: "🧠" },
      ],
      dialogues: [
        {
          speaker: "ACP प्रद्युमन",
          emoji: "🕵️‍♂️",
          text: "दया! मुझे क्रिमिनल नंबर 420 की फाइल लाओ, और अभिजीत तुम दिल्ली वाले सारे चोर फिल्टर करो!",
        },
        {
          speaker: "दया (Route Params :id)",
          emoji: "💪",
          text: "सर! मैंने `/api/criminals/:id` लगाया और `req.params.id` से सीधे 420 की फाइल पकड़ ली!",
        },
        {
          speaker: "अभिजीत (Query Params ?)",
          emoji: "🧠",
          text: "सर! मैंने `/api/criminals?city=delhi` लगाया और `req.query.city` से सारे दिल्ली वाले निकाल लिए!",
        },
      ],
      choiceMoment: {
        question: "किसी एक स्पेसिफिक यूजर को ID से निकालने के लिए क्या यूज़ करना चाहिए?",
        options: [
          {
            text: "/users?id=5 (Query param se dhoondna)",
            outcome: "❌ काम तो कर गया पर REST API स्टैंडर्ड टूट गया!",
            isCorrect: false,
          },
          {
            text: "/users/:id (Route parameter - /users/5)",
            outcome: "✅ बिल्कुल सही! ACP साहब ने दया को शाबाशी दी! क्रिमिनल पकड़ा गया! 🎉",
            isCorrect: true,
          },
        ],
      },
      moral: "💡 नियम: एक खास आइटम के लिए Route Param (`/users/:id`), और सर्च/फिल्टर के लिए Query Param (`/users?role=admin`)!",
      tinyCode: `app.get('/users/:id', (req, res) => {\n  const id = Number(req.params.id);\n  res.json({ id, name: "Found" });\n});`,
    };
  }

  // 8. Express Middleware & next()
  if (combined.includes("middleware") || combined.includes("next") || combined.includes("cors")) {
    return {
      title: `Episode: International Airport Security & Visa Check (Middlewares & CORS)`,
      theme: "space",
      setting: "इंटरनेशनल एयरपोर्ट का बोर्डिंग गेट जहाँ फ्लाइट में बैठने से पहले कड़ी चेकिंग चल रही है!",
      characters: [
        { name: "यात्री (Client Request)", role: "Incoming Request", emoji: "👨‍🚀" },
        { name: "सिक्योरिटी ऑफिसर (Middleware)", role: "Auth & CORS Scanner", emoji: "👮‍♂️" },
        { name: "फ्लाइट कैप्टन (Route Handler)", role: "Final Response", emoji: "✈️" },
      ],
      dialogues: [
        {
          speaker: "यात्री (Client Request)",
          emoji: "👨‍🚀",
          text: "मुझे फ्लाइट में बैठना है, क्या मैं सीधे अंदर जा सकता हूँ?",
        },
        {
          speaker: "सिक्योरिटी ऑफिसर (Middleware)",
          emoji: "👮‍♂️",
          text: "रुकिए! पहले टिकट चेक (Auth) और लगेज स्कैन (Body Parser) होगा! अगर सब सही है, तभी मैं `next()` बोलूंगा!",
        },
        {
          speaker: "फ्लाइट कैप्टन (Route Handler)",
          emoji: "✈️",
          text: "जैसे ही ऑफिसर ने `next()` बोला, यात्री को सीट मिल गई और फ्लाइट 200 OK के साथ उड़ गई!",
        },
      ],
      choiceMoment: {
        question: "Middleware के अंदर अगर काम पूरा हो जाए तो अगला कदम क्या होना चाहिए?",
        options: [
          {
            text: "कुछ मत करो, खाली छोड़ दो",
            outcome: "❌ Request वहीं लटक गई! ब्राउज़र गोल-गोल घूमता रहा और टाइमआउट हो गया!",
            isCorrect: false,
          },
          {
            text: "next() फंक्शन को कॉल करो ताकि रिक्वेस्ट आगे बढ़े",
            outcome: "✅ परफेक्ट! पैसेंजर बिना रुके अपनी फ्लाइट में पहुँच गया! 🎉",
            isCorrect: true,
          },
        ],
      },
      moral: "💡 नियम: Middleware के अंत में `next()` कॉल करना अनिवार्य है, वरना रिक्वेस्ट बीच में ही अटक जाएगी!",
      tinyCode: `app.use((req, res, next) => {\n  console.log("Logged:", req.path);\n  next(); // Pass to next route\n});`,
    };
  }

  // 9. Generic Smart Story Fallback for any other custom topic
  return {
    title: `Episode: The Great Tech Adventure of ${lessonTitle}`,
    theme: "startup",
    setting: `एक हलचल भरी टेक कंपनी जहाँ ${lessonTitle} के ज़रिए एक बड़ा मिशन पूरा करना है!`,
    characters: [
      { name: "रोहन (Junior Engineer)", role: "Curious Builder", emoji: "👨‍💻" },
      { name: "प्रिया (Senior Architect)", role: "Tech Mentor", emoji: "👩‍🏫" },
      { name: "सिस्टम कोर", role: "Production Engine", emoji: "⚡" },
    ],
    dialogues: [
      {
        speaker: "रोहन (Junior Engineer)",
        emoji: "👨‍💻",
        text: `मैम, मुझे ${lessonTitle} को कोड में लागू करना है, पर समझ नहीं आ रहा कि सही तरीका क्या है?`,
      },
      {
        speaker: "प्रिया (Senior Architect)",
        emoji: "👩‍🏫",
        text: `रोहन, ${lessonTitle} का बुनियादी सिद्धांत यह है कि इनपुट को साफ़ रखो, लॉजिक को मॉड्यूलर बनाओ और सही आउटपुट रिटर्न करो!`,
      },
      {
        speaker: "सिस्टम कोर",
        emoji: "⚡",
        text: "जैसे ही सही आर्किटेक्चर फॉलो किया गया, पूरा सिस्टम 10x तेज और बिना किसी क्रैश के चलने लगा! 🚀",
      },
    ],
    choiceMoment: {
      question: `${lessonTitle} में सबसे बेहतरीन इंजीनियरिंग प्रैक्टिस क्या है?`,
      options: [
        {
          text: "बिना सोचे समझे शॉर्टकट लेना और एरर हैंडलिंग छोड़ देना",
          outcome: "❌ सिस्टम प्रोडक्शन में क्रैश हो गया!",
          isCorrect: false,
        },
        {
          text: "मॉड्यूलर, टाइप-सेफ और प्रेडिक्टेबल कोड लिखना",
          outcome: "✅ 100% सक्सेस! सिस्टम बिना किसी बग के सुपरफास्ट चला! 🎉",
          isCorrect: true,
        },
      ],
    },
    moral: `💡 नियम: ${lessonTitle} को छोटे-छोटे टेस्टेबल टुकड़ों में लिखो ताकि कोड हमेशा मेंटेन करना आसान रहे!`,
    tinyCode: `// ${lessonTitle} Core Pattern\nfunction runTask() {\n  return { success: true, topic: "${lessonTitle}" };\n}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Bilingual Scene Generator with Unique Stories per Concept
// ─────────────────────────────────────────────────────────────────────────────
function generateBilingualWhiteboardScenes({
  lessonTitle,
  topicTitle,
  courseTitle = "",
  moduleTitle = "",
  lessonContent,
  lessonExplanation,
  concepts,
  examples,
}: {
  lessonTitle: string;
  topicTitle: string;
  courseTitle?: string;
  moduleTitle?: string;
  lessonContent: string;
  lessonExplanation?: string;
  concepts: Array<{ id: string; title: string; description: string }>;
  examples: Array<{ id: string; title: string; description: string; starterCode: string; solutionCode: string }>;
}): WhiteboardScene[] {
  const scenes: WhiteboardScene[] = [];
  let sceneNum = 1;

  // Scene 1: Introduction Story Episode (Topic Tailored)
  const mainEpisode = buildTopicStoryEpisode({
    lessonTitle,
    topicTitle,
    courseTitle,
    moduleTitle,
  });

  scenes.push({
    id: `scene_${sceneNum}`,
    sceneNumber: sceneNum++,
    titleEn: `Mastering ${lessonTitle}`,
    titleHi: `${lessonTitle} की रोमांचक कहानी`,
    subtitleEn: `Episode 1: The Core Breakthrough`,
    subtitleHi: `एपिसोड 1: मुख्य रहस्य का पर्दाफाश`,
    type: "concept",
    easySummaryEn: `${lessonTitle} transforms complex engineering challenges into clean, predictable superpowers!`,
    easySummaryHi: `${lessonTitle} का काम है उलझे हुए कोड को जादू की तरह आसान और एरर-फ्री बनाना!`,
    memoryTrickEn: mainEpisode.moral,
    memoryTrickHi: mainEpisode.moral,
    problemVsSolutionEn: {
      without: "Fragile code where changing one part unexpectedly crashes other features.",
      with: "Clean modular building blocks that work predictably every single time!",
    },
    problemVsSolutionHi: {
      without: "एक जगह कोड बदलने पर दूसरी चीजें अपने आप क्रैश हो जाती थीं!",
      with: "साफ़-सुथरे ब्लॉक्स जो हमेशा सही और प्रेडिक्टेबल रिजल्ट देते हैं!",
    },
    storyEpisode: mainEpisode,
    handwrittenNotesEn: [
      `Why ${lessonTitle} is fundamental in modern engineering`,
      `Core mental model: Moving from theory to practical implementation`,
    ],
    handwrittenNotesHi: [
      `सॉफ्टवेयर इंजीनियरिंग में ${lessonTitle} इतना महत्वपूर्ण क्यों है?`,
      `मेंटल मॉडल: थ्योरी से सीधे प्रैक्टिकल कोडिंग और आर्किटेक्चर को समझना`,
    ],
    explanationEn:
      lessonExplanation ||
      `In this lesson, we break down **${lessonTitle}** step-by-step with interactive stories and practical patterns.`,
    explanationHi:
      `इस पाठ में हम **${lessonTitle}** को कहानी और किरदारों के ज़रिए बिल्कुल आसान भाषा में समझेंगे।`,
    analogyEn: mainEpisode.setting,
    analogyHi: mainEpisode.setting,
    diagramNodes: [
      {
        id: "step_1_trigger",
        stepNumber: 1,
        labelEn: "1. Trigger / Action",
        labelHi: "1. एक्शन ट्रिगर",
        sublabelEn: "User clicks or requests",
        sublabelHi: "यूजर ने बटन दबाया",
        phaseEn: "Phase 01: Event Trigger",
        phaseHi: "स्टेज 01: एक्शन शुरू हुआ",
        whatHappensEn: "The action initiates and enters the runtime execution queue.",
        whatHappensHi: "यूजर का एक्शन शुरू हुआ और इंजन में रजिस्टर हुआ।",
        dataStateEn: "Input: { event: 'TRIGGER', data: 'New Value' }",
        dataStateHi: "इनपुट: नया डेटा प्रोसेस होने के लिए तैयार।",
        ruleEn: "Always sanitize input at the boundary.",
        ruleHi: "इनपुट को हमेशा वैलिडेट करें।",
        color: "border-sky-500/50 bg-sky-500/10",
      },
      {
        id: "step_2_engine",
        stepNumber: 2,
        labelEn: "2. Engine Processing",
        labelHi: "2. इंजन प्रोसेसिंग",
        sublabelEn: "Logic Evaluation",
        sublabelHi: "लॉजिक इवैल्यूएशन",
        phaseEn: "Phase 02: Stack Execution",
        phaseHi: "स्टेज 02: लॉजिक चलना शुरू",
        whatHappensEn: "The core logic processes state and computes the outcome.",
        whatHappensHi: "कोर लॉजिक ने डेटा प्रोसेस किया।",
        dataStateEn: "State: { processed: true }",
        dataStateHi: "स्टेट: गणना पूरी हुई।",
        ruleEn: "Keep functions pure and predictable.",
        ruleHi: "फंक्शन्स को हमेशा प्रेडिक्टेबल रखें।",
        color: "border-indigo-500/50 bg-indigo-500/10",
      },
      {
        id: "step_3_output",
        stepNumber: 3,
        labelEn: "3. Screen / Response Output",
        labelHi: "3. फाइनल रिजल्ट",
        sublabelEn: "UI Paint / JSON 200",
        sublabelHi: "स्क्रीन अपडेट",
        phaseEn: "Phase 03: Output Render",
        phaseHi: "स्टेज 03: स्क्रीन पर डिस्प्ले",
        whatHappensEn: "The output is rendered to the user instantly.",
        whatHappensHi: "रिजल्ट यूजर को स्क्रीन पर दिखाई दिया।",
        dataStateEn: "Output: 200 OK / Painted",
        dataStateHi: "आउटपुट: सफलतापूर्वक रेंडर हुआ।",
        ruleEn: "Clean up unneeded timers or listeners.",
        ruleHi: "मेमोरी लीक से बचने के लिए क्लीनअप रखें।",
        color: "border-emerald-500/50 bg-emerald-500/10",
      },
    ],
    keyTakeawaysEn: ["Story Mental Model", "Predictable Architecture", "Instant Mastery"],
    keyTakeawaysHi: ["कहानी मेंटल मॉडल", "आसान आर्किटेक्चर", "100% समझ"],
  });

  // Scene 2..N: Concepts with Specific Story Episodes
  if (concepts && concepts.length > 0) {
    concepts.forEach((concept, cIdx) => {
      const conceptEpisode = buildTopicStoryEpisode({
        lessonTitle,
        topicTitle,
        courseTitle,
        moduleTitle,
        conceptTitle: concept.title,
      });

      scenes.push({
        id: `scene_${sceneNum}`,
        sceneNumber: sceneNum++,
        titleEn: concept.title,
        titleHi: `${concept.title} (कहानी से समझें)`,
        subtitleEn: `Episode 0${cIdx + 2}: ${concept.title}`,
        subtitleHi: `रोमांचक एपिसोड 0${cIdx + 2}`,
        type: "deep_dive",
        easySummaryEn: `Simple summary: ${concept.title} guarantees predictable state and clean logic.`,
        easySummaryHi: `सरल शब्दों में: ${concept.title} आपके कोड को तेज, सुरक्षित और आसान बनाता है।`,
        memoryTrickEn: conceptEpisode.moral,
        memoryTrickHi: conceptEpisode.moral,
        problemVsSolutionEn: {
          without: "Chaos and unmaintainable code that breaks in production.",
          with: "Clean, robust engineering patterns trusted by top tech companies.",
        },
        problemVsSolutionHi: {
          without: "बिना सोचे-समझे लिखा गया कोड जो प्रोडक्शन में क्रैश हो जाता था।",
          with: "साफ़-सुथरा कोड जिसे कोई भी आसानी से समझ और चला सकता है!",
        },
        storyEpisode: conceptEpisode,
        handwrittenNotesEn: [
          `Key rule: ${concept.title} dictates how state flows through the system`,
          `Internal mechanics: Execution lifecycle and memory boundaries`,
        ],
        handwrittenNotesHi: [
          `मुख्य नियम: ${concept.title} तय करता है कि डेटा कैसे मूव करेगा।`,
          `आंतरिक कार्यप्रणाली: मेमोरी और एग्जीक्यूशन लाइफसाइकिल।`,
        ],
        explanationEn: concept.description,
        explanationHi: `${concept.description}\n\n**टीचर टिप:** इस कॉन्सेप्ट को स्टोरी के किरदारों की तरह याद रखें!`,
        analogyEn: conceptEpisode.setting,
        analogyHi: conceptEpisode.setting,
        diagramNodes: [
          {
            id: `c_${cIdx}_s1`,
            stepNumber: 1,
            labelEn: "1. Scope Binding",
            labelHi: "1. स्कोप बाइंडिंग",
            sublabelEn: "Declaration",
            sublabelHi: "डिक्लेरेशन",
            phaseEn: "Phase 01: Declaration",
            phaseHi: "स्टेज 01: इनिशियलाइजेशन",
            whatHappensEn: `The engine identifies ${concept.title} and binds memory.`,
            whatHappensHi: `इंजन ने ${concept.title} को मेमोरी में रजिस्टर किया।`,
            dataStateEn: "State: Bound",
            dataStateHi: "स्टेट: मेमोरी एलोकेट हुई",
            ruleEn: "Use explicit keywords (const/let).",
            ruleHi: "हमेशा const/let का उपयोग करें।",
            color: "border-amber-500/50 bg-amber-500/10",
          },
          {
            id: `c_${cIdx}_s2`,
            stepNumber: 2,
            labelEn: "2. Execution",
            labelHi: "2. एग्जीक्यूशन",
            sublabelEn: "Evaluation",
            sublabelHi: "लॉजिक रन",
            phaseEn: "Phase 02: Execution",
            phaseHi: "स्टेज 02: लॉजिक रन",
            whatHappensEn: "The logic evaluates cleanly.",
            whatHappensHi: "लॉजिक सुरक्षित रूप से चला।",
            dataStateEn: "State: Computed",
            dataStateHi: "स्टेट: रिजल्ट तैयार",
            ruleEn: "Use strict equality (===).",
            ruleHi: "ट्रिपल इक्वल्स (===) का प्रयोग करें।",
            color: "border-sky-500/50 bg-sky-500/10",
          },
          {
            id: `c_${cIdx}_s3`,
            stepNumber: 3,
            labelEn: "3. Output",
            labelHi: "3. आउटपुट",
            sublabelEn: "Resolution",
            sublabelHi: "रिजल्ट",
            phaseEn: "Phase 03: Done",
            phaseHi: "स्टेज 03: पूरा हुआ",
            whatHappensEn: "The result is returned.",
            whatHappensHi: "रिजल्ट सफलतापूर्वक प्राप्त हुआ।",
            dataStateEn: "State: Clean",
            dataStateHi: "स्टेट: स्टैक साफ",
            ruleEn: "Avoid memory leaks in closures.",
            ruleHi: "मेमोरी साफ रखें।",
            color: "border-emerald-500/50 bg-emerald-500/10",
          },
        ],
        keyTakeawaysEn: [concept.title, "Predictable Code", "Mastery Check"],
        keyTakeawaysHi: [concept.title, "प्रेडिक्टेबल कोड", "मास्टरी चेक"],
      });
    });
  }

  return scenes;
}
