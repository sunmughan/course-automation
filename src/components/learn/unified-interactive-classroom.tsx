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
  Download,
  Package,
} from "lucide-react";
import JSZip from "jszip";
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
export type ActiveEditorFile = "app" | "html" | "css" | "server" | "package";

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
  const isPureBackend = useMemo(() => {
    const combined = `${courseTitle} ${moduleTitle} ${lessonTitle} ${topicTitle}`.toLowerCase();
    return (
      (combined.includes("node") || combined.includes("backend") || combined.includes("express")) &&
      !combined.includes("fullstack") &&
      !combined.includes("react")
    );
  }, [courseTitle, moduleTitle, lessonTitle, topicTitle]);

  const isFullstack = useMemo(() => {
    const combined = `${courseTitle} ${moduleTitle} ${lessonTitle} ${topicTitle}`.toLowerCase();
    return combined.includes("fullstack") || combined.includes("mern") || combined.includes("pern");
  }, [courseTitle, moduleTitle, lessonTitle, topicTitle]);

  const [activeFile, setActiveFile] = useState<ActiveEditorFile>(isPureBackend ? "server" : "app");
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
  const [packageJsonCode, setPackageJsonCode] = useState<string>(
    JSON.stringify(
      {
        name: "nodejs-express-app",
        version: "1.0.0",
        main: "server.js",
        scripts: {
          start: "node server.js",
          dev: "nodemon server.js",
        },
        dependencies: {
          express: "^4.18.2",
          cors: "^2.8.5",
          dotenv: "^16.0.3",
        },
      },
      null,
      2
    )
  );

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [outputTab, setOutputTab] = useState<"terminal" | "preview">("terminal");
  const [isOutputMaximized, setIsOutputMaximized] = useState(false);
  const [isAppFullscreen, setIsAppFullscreen] = useState(false);

  const toggleAppFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsAppFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsAppFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsAppFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);
  
  const isFrontendDomain = useMemo(() => {
    const combined = `${courseTitle} ${moduleTitle} ${lessonTitle} ${topicTitle}`.toLowerCase();
    return (
      combined.includes("frontend") ||
      combined.includes("react") ||
      combined.includes("html") ||
      combined.includes("css") ||
      combined.includes("javascript") ||
      combined.includes("ui") ||
      combined.includes("angular")
    );
  }, [courseTitle, moduleTitle, lessonTitle, topicTitle]);

  const [activeVsCodeTab, setActiveVsCodeTab] = useState<"react" | "node" | "fullstack" | "architecture">(
    isPureBackend ? "node" : "react"
  );

  useEffect(() => {
    if (isPureBackend) {
      setActiveFile("server");
      setActiveVsCodeTab("node");
    } else if (isFrontendDomain) {
      setActiveFile("app");
      setActiveVsCodeTab("react");
    }
  }, [isPureBackend, isFrontendDomain]);

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

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
    const initialCode = generateRichTopicCode({
      courseTitle,
      moduleTitle,
      lessonTitle,
      topicTitle,
      examples,
    });

    const isNode =
      (courseTitle + " " + moduleTitle + " " + lessonTitle).toLowerCase().includes("node") ||
      (courseTitle + " " + moduleTitle + " " + lessonTitle).toLowerCase().includes("backend") ||
      (courseTitle + " " + moduleTitle + " " + lessonTitle).toLowerCase().includes("express") ||
      initialCode.includes("express") ||
      initialCode.includes("require(") ||
      initialCode.includes("createServer");

    if (isNode) {
      setServerCode(initialCode);
      setAppCode(`// Frontend Client calling Node.js Server\nasync function testEndpoint() {\n  console.log('Sending request to server.js on port 5000...');\n}\ntestEndpoint();`);
      setActiveFile("server");
      setActiveVsCodeTab("node");
    } else {
      setAppCode(initialCode);
      setActiveFile("app");
      setActiveVsCodeTab("react");
    }
    clearOutput();
  }, [lessonTitle, topicTitle, courseTitle, moduleTitle, examples, clearOutput]);

  // Active code depending on selected file tab
  const currentEditorCode =
    activeFile === "server"
      ? serverCode
      : activeFile === "app"
      ? appCode
      : activeFile === "html"
      ? htmlCode
      : activeFile === "css"
      ? cssCode
      : packageJsonCode;
  const currentEditorLanguage =
    activeFile === "html" ? "html" : activeFile === "css" ? "css" : activeFile === "package" ? "json" : "javascript";

  const handleEditorChange = (newVal: string) => {
    if (activeFile === "server") setServerCode(newVal);
    else if (activeFile === "app") setAppCode(newVal);
    else if (activeFile === "html") setHtmlCode(newVal);
    else if (activeFile === "css") setCssCode(newVal);
    else if (activeFile === "package") setPackageJsonCode(newVal);
  };

  // Build live srcdoc for multi-file iframe preview (React 18 + Babel + CSS + HTML + Node.js Mock)
  const liveSrcDoc = useMemo(() => {
    const trimmedApp = (appCode || "").trim();
    const trimmedHtml = (htmlCode || "").trim();

    // 1. If code is a full HTML document (contains <!DOCTYPE html> or <html>)
    if (trimmedApp.startsWith("<!DOCTYPE") || trimmedApp.startsWith("<html") || trimmedHtml.startsWith("<!DOCTYPE") || trimmedHtml.startsWith("<html")) {
      return trimmedApp.startsWith("<!DOCTYPE") || trimmedApp.startsWith("<html") ? trimmedApp : trimmedHtml;
    }

    // 2. If code is Node.js Backend (uses require('express') or require('http'))
    const isNodeBackend =
      trimmedApp.includes("require('express')") ||
      trimmedApp.includes('require("express")') ||
      trimmedApp.includes("require('http')") ||
      trimmedApp.includes('require("http")') ||
      trimmedApp.includes("express()");

    if (isNodeBackend) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 p-6 font-sans">
  <div class="max-w-md mx-auto space-y-4">
    <div class="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-mono">
      <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
      <span class="font-bold">Node.js Express Server Active (Port 5000)</span>
    </div>
    <div class="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
      <span class="text-[10px] font-mono uppercase text-slate-400">Sample API Response Preview:</span>
      <pre class="p-3 bg-slate-950 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto">{
  "status": "success",
  "server": "Express.js 4.x",
  "endpoint": "/api/demo",
  "message": "Node.js REST API is running and responding with HTTP 200 OK!"
}</pre>
    </div>
    <p class="text-[11px] text-slate-400 font-mono text-center">
      👉 Click <strong>Run Code ▶</strong> or check the <strong>Terminal Output</strong> tab to execute live.
    </p>
  </div>
</body>
</html>`;
    }

    // 3. React / Pure Client-Side Component Preview
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ${cssCode || ""}
  </style>
</head>
<body class="bg-slate-950 text-slate-100 p-4 font-sans antialiased">
  ${htmlCode && !htmlCode.includes("<html") ? htmlCode : ""}
  <div id="root"></div>

  <script type="text/plain" id="__rawScript">${appCode || ""}</script>
  <script>
    window.exports = {};
    window.module = { exports: window.exports };
    window.require = function(mod) {
      if (mod === 'react') return window.React;
      if (mod === 'react-dom' || mod === 'react-dom/client') return window.ReactDOM;
      return {};
    };
    if (window.React) {
      window.useState = React.useState;
      window.useEffect = React.useEffect;
      window.useRef = React.useRef;
      window.useCallback = React.useCallback;
      window.useMemo = React.useMemo;
      window.useContext = React.useContext;
      window.useReducer = React.useReducer;
    }

    (function(){
      try {
        var raw = document.getElementById('__rawScript').textContent;
        if (!raw || !raw.trim()) return;

        // Clean module imports and export default
        var cleaned = raw
          .replace(/import\\s+[\\s\\S]*?from\\s+['"][^'"]+['"];?/g, '')
          .replace(/export\\s+default\\s+/g, 'window.App = ');

        var transpiled = Babel.transform(cleaned, {
          presets: [
            ['react', { runtime: 'classic' }],
            ['env', { modules: false }]
          ]
        }).code;

        var s = document.createElement('script');
        s.textContent = transpiled;
        document.body.appendChild(s);

        var TargetComponent = window.App || window.exports.default || window.module.exports || (typeof App !== 'undefined' ? App : null);
        if (TargetComponent && typeof TargetComponent === 'function') {
          var rootEl = document.getElementById('root');
          if (ReactDOM.createRoot) {
            ReactDOM.createRoot(rootEl).render(React.createElement(TargetComponent));
          } else {
            ReactDOM.render(React.createElement(TargetComponent), rootEl);
          }
        }
      } catch(err) {
        var box = document.createElement('div');
        box.style = "background:#450a0a;color:#fca5a5;border:1px solid #ef4444;padding:12px;border-radius:12px;font-family:monospace;font-size:12px;margin-top:12px;";
        box.innerHTML = "<strong>❌ Live Preview Note:</strong> " + err.message;
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
      courseTitle,
      moduleTitle,
      lessonTitle,
      topicTitle,
      lessonExplanation,
      concepts,
      examples,
      language,
    });
  }, [courseTitle, moduleTitle, lessonTitle, topicTitle, lessonExplanation, concepts, examples, language]);

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

    const execLang = currentEditorLanguage === "html" ? "html" : currentEditorLanguage === "json" ? "json" : "javascript";
    await executeCode(currentEditorCode, execLang, true);
  }, [currentEditorCode, currentEditorLanguage, executeCode, topicData.flowSteps.length]);

  const [isExportingZip, setIsExportingZip] = useState(false);

  const handleCopyCode = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadProjectZip = async () => {
    try {
      setIsExportingZip(true);
      const zip = new JSZip();
      const cleanSlug = (topicData.title || "project")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      if (activeVsCodeTab === "node" || isPureBackend) {
        // Node.js Backend Project
        zip.file("server.js", serverCode || "// server.js\nconst express = require('express');\nconst app = express();\napp.get('/', (req, res) => res.json({ status: 'active' }));\napp.listen(5000, () => console.log('Server running on 5000'));\n");
        zip.file(
          "package.json",
          JSON.stringify(
            {
              name: cleanSlug || "my-node-app",
              version: "1.0.0",
              description: topicData.title,
              main: "server.js",
              scripts: {
                start: "node server.js",
                dev: "node --watch server.js",
              },
              dependencies: {
                express: "^4.19.2",
                cors: "^2.8.5",
                dotenv: "^16.4.5",
              },
            },
            null,
            2
          )
        );
        zip.file(".env.example", "PORT=5000\nNODE_ENV=development\n");
        zip.file(".gitignore", "node_modules/\n.env\n.DS_Store\n");
        zip.file(
          "README.md",
          `# ${topicData.title}\n\nEnterprise Node.js Backend Project generated from SkillForge Classroom.\n\n## 🚀 Quick Start (Run on your system):\n\n1. **Install dependencies:**\n   \`\`\`bash\n   npm install\n   \`\`\`\n2. **Start the server:**\n   \`\`\`bash\n   npm start\n   \`\`\`\n3. **Test API in Browser/Postman:**\n   Open [http://localhost:5000](http://localhost:5000)\n\n*Zero-clutter project: node_modules is automatically installed when you run \`npm install\`.*`
        );
      } else if (activeVsCodeTab === "react") {
        // React Frontend Project (Vite + React 19)
        const src = zip.folder("src");
        src?.file("App.jsx", appCode || "// App.jsx\nexport default function App() { return <h1>React App</h1>; }");
        src?.file("style.css", cssCode || "/* style.css */\nbody { margin: 0; font-family: system-ui, sans-serif; }");
        src?.file(
          "main.jsx",
          `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App.jsx';\nimport './style.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`
        );
        zip.file(
          "index.html",
          htmlCode && htmlCode.includes("<html")
            ? htmlCode
            : `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${topicData.title}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>`
        );
        zip.file(
          "package.json",
          JSON.stringify(
            {
              name: cleanSlug || "my-react-app",
              private: true,
              version: "1.0.0",
              type: "module",
              scripts: {
                dev: "vite",
                build: "vite build",
                preview: "vite preview",
              },
              dependencies: {
                react: "^19.0.0",
                "react-dom": "^19.0.0",
                "lucide-react": "^0.468.0",
              },
              devDependencies: {
                "@vitejs/plugin-react": "^4.3.4",
                vite: "^6.0.0",
              },
            },
            null,
            2
          )
        );
        zip.file(
          "vite.config.js",
          `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n});\n`
        );
        zip.file(".gitignore", "node_modules/\ndist/\n.DS_Store\n");
        zip.file(
          "README.md",
          `# ${topicData.title}\n\nReact Application generated from SkillForge Classroom.\n\n## 🚀 Quick Start:\n\n1. **Install dependencies:**\n   \`\`\`bash\n   npm install\n   \`\`\`\n2. **Start development server:**\n   \`\`\`bash\n   npm run dev\n   \`\`\`\n3. **Open in Browser:**\n   [http://localhost:5173](http://localhost:5173)\n`
        );
      } else {
        // Fullstack Project
        const backend = zip.folder("backend");
        backend?.file("server.js", serverCode || "// server.js\nconsole.log('Server running');");
        backend?.file(
          "package.json",
          JSON.stringify(
            {
              name: `${cleanSlug}-backend`,
              version: "1.0.0",
              main: "server.js",
              scripts: { start: "node server.js" },
              dependencies: { express: "^4.19.2", cors: "^2.8.5", dotenv: "^16.4.5" },
            },
            null,
            2
          )
        );

        const frontend = zip.folder("frontend");
        const fSrc = frontend?.folder("src");
        fSrc?.file("App.jsx", appCode || "// App.jsx");
        fSrc?.file("style.css", cssCode || "/* style.css */");
        fSrc?.file(
          "main.jsx",
          `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App.jsx';\nimport './style.css';\n\nReactDOM.createRoot(document.getElementById('root')).render(<App />);\n`
        );
        frontend?.file(
          "index.html",
          `<!DOCTYPE html>\n<html><head><title>${topicData.title}</title></head><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>`
        );
        frontend?.file(
          "package.json",
          JSON.stringify(
            {
              name: `${cleanSlug}-frontend`,
              version: "1.0.0",
              type: "module",
              scripts: { dev: "vite" },
              dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
              devDependencies: { "@vitejs/plugin-react": "^4.3.4", vite: "^6.0.0" },
            },
            null,
            2
          )
        );

        zip.file(
          "README.md",
          `# ${topicData.title} - Fullstack Project\n\n## 🚀 Running the Fullstack App:\n\n### 1. Backend:\n\`\`\`bash\ncd backend\nnpm install\nnpm start\n\`\`\`\n\n### 2. Frontend:\n\`\`\`bash\ncd frontend\nnpm install\nnpm run dev\n\`\`\`\n`
        );
      }

      const content = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${cleanSlug || "project"}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Export zip error:", err);
      alert("Could not generate ZIP package. Please try again.");
    } finally {
      setIsExportingZip(false);
    }
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
            title="Open Curriculum & Chapters Drawer"
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

          {/* Fullscreen App Toggle */}
          <button
            onClick={toggleAppFullscreen}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold font-mono bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title={isAppFullscreen ? "Exit Fullscreen" : "Enter Distraction-Free Fullscreen"}
          >
            {isAppFullscreen ? <Minimize2 className="size-3.5 text-sky-400" /> : <Maximize2 className="size-3.5" />}
            <span className="hidden xl:inline">{isAppFullscreen ? "Exit" : "Full Screen"}</span>
          </button>

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
        <div className="bg-slate-950 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between gap-2 shrink-0 z-20 animate-in slide-in-from-top-1 w-full">
          {/* Chapter Breadcrumb (Desktop / Tablet / Mobile) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono truncate min-w-0">
            <span className="text-sky-400 font-bold truncate">{courseTitle}</span>
            <span>/</span>
            <span className="text-slate-300 truncate">{lessonTitle}</span>
          </div>

          {/* Centered Switcher: Notes, Code, Output + [ ⚡ More... ] Button (ONLY on Mobile/Tablet: lg:hidden) */}
          <div className="flex lg:hidden items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 shrink-0">
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

            {/* ⚡ More Button for Floating Modal (ONLY visible on Mobile/Tablet) */}
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
              {(isPureBackend || isFullstack) && (
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
              )}

              {(!isPureBackend || isFullstack) && (
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
              )}

              {(!isPureBackend || isFullstack) && (
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
              )}

              {(!isPureBackend || isFullstack) && (
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
              )}

              {(isPureBackend || isFullstack) && (
                <button
                  onClick={() => setActiveFile("package")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeFile === "package"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  <FileCode className="size-3 text-amber-300" />
                  <span>package.json</span>
                </button>
              )}
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
                {loading || isExecutionSyncing ? "Running..." : "Run"}
              </Button>
            </div>
          </div>

          {/* Monaco Code Editor (Scrollable Center Area - Collapsible when Output is Maximized) */}
          {!isOutputMaximized && (
            <div className="flex-1 min-h-[200px]">
              <MonacoEditor
                value={currentEditorCode}
                onChange={(val) => handleEditorChange(val || "")}
                language={currentEditorLanguage}
              />
            </div>
          )}

          {/* Bottom Terminal & Browser Preview Splitter (Expands to Full Column when Maximized) */}
          <div className={`${isOutputMaximized ? "flex-1 min-h-0" : "h-[240px] shrink-0 border-t border-slate-800"} bg-slate-950 flex flex-col`}>
            <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-slate-800 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOutputTab("terminal")}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                    outputTab === "terminal" ? "bg-slate-800 text-emerald-400 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Terminal className="size-3" />
                  Terminal Logs
                  {output && <span className="size-1.5 rounded-full bg-emerald-400" />}
                </button>
                <button
                  onClick={() => setOutputTab("preview")}
                  className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-semibold transition-all cursor-pointer ${
                    outputTab === "preview" ? "bg-slate-800 text-sky-400 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Globe className="size-3" />
                  Live Browser Preview
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                {executionTime !== undefined && <span>{executionTime.toFixed(1)}ms</span>}
                <button
                  onClick={() => setIsOutputMaximized(!isOutputMaximized)}
                  className="flex items-center gap-1 text-slate-400 hover:text-sky-300 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 transition-colors cursor-pointer"
                  title={isOutputMaximized ? "Restore Default Split View" : "Maximize Output & Live Preview Column"}
                >
                  {isOutputMaximized ? <Minimize2 className="size-3 text-sky-400" /> : <Maximize2 className="size-3" />}
                  <span>{isOutputMaximized ? "Restore" : "Expand"}</span>
                </button>
                <button onClick={clearOutput} className="hover:text-white cursor-pointer px-1">
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
                    <span className="text-slate-500 italic">Click "Run" to execute code and view output.</span>
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
                  {/* Category Switcher: Node.js / React / Fullstack / Multi-File Guide */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
                    <button
                      onClick={() => setActiveVsCodeTab("node")}
                      className={`flex-1 min-w-[75px] py-1 rounded-lg text-center font-mono font-bold text-[11px] transition-all cursor-pointer ${
                        activeVsCodeTab === "node"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      🟢 Node Server
                    </button>
                    <button
                      onClick={() => setActiveVsCodeTab("react")}
                      className={`flex-1 min-w-[75px] py-1 rounded-lg text-center font-mono font-bold text-[11px] transition-all cursor-pointer ${
                        activeVsCodeTab === "react"
                          ? "bg-sky-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      ⚛️ React UI
                    </button>
                    <button
                      onClick={() => setActiveVsCodeTab("fullstack")}
                      className={`flex-1 min-w-[75px] py-1 rounded-lg text-center font-mono font-bold text-[11px] transition-all cursor-pointer ${
                        activeVsCodeTab === "fullstack"
                          ? "bg-purple-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      🔗 Fullstack
                    </button>
                    <button
                      onClick={() => setActiveVsCodeTab("architecture")}
                      className={`flex-1 min-w-[95px] py-1 rounded-lg text-center font-mono font-bold text-[11px] transition-all cursor-pointer ${
                        activeVsCodeTab === "architecture"
                          ? "bg-amber-600 text-white shadow-xs"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      📁 Multi-File Guide
                    </button>
                  </div>

                  {/* ONE-CLICK PROJECT EXPORT BANNER */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-950 via-slate-900 to-sky-950 border border-sky-500/40 flex items-center justify-between gap-3 shadow-lg">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300 font-mono">
                        <Package className="size-4 text-sky-400 shrink-0" />
                        <span>Export Ready-to-Run Project</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                        Clean ZIP with project files &amp; README (no heavy node_modules).
                      </p>
                    </div>
                    <Button
                      onClick={handleDownloadProjectZip}
                      disabled={isExportingZip}
                      size="sm"
                      className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-mono text-xs font-bold px-3 py-1.5 shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      {isExportingZip ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Packaging...</span>
                        </>
                      ) : (
                        <>
                          <Download className="size-3.5" />
                          <span>Download .ZIP</span>
                        </>
                      )}
                    </Button>
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
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            🚀 2. VS Code Terminal me Run Karein:
                          </span>
                          <button
                            onClick={() =>
                              handleCopyCode(
                                "node_cmds",
                                "mkdir my-node-app && cd my-node-app\nnpm init -y\nnpm install express cors dotenv\nnode server.js"
                              )
                            }
                            className="text-[10px] font-mono text-emerald-400 hover:text-white flex items-center gap-1 cursor-pointer bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                          >
                            <Copy className="size-3" />
                            <span>{copiedId === "node_cmds" ? "Copied ✓" : "Copy"}</span>
                          </button>
                        </div>
                        <div
                          onDoubleClick={() =>
                            handleCopyCode(
                              "node_cmds",
                              "mkdir my-node-app && cd my-node-app\nnpm init -y\nnpm install express cors dotenv\nnode server.js"
                            )
                          }
                          title="Double-click to copy commands"
                          className="group relative cursor-pointer"
                        >
                          <pre className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-emerald-300 leading-relaxed overflow-x-auto max-w-full whitespace-pre-wrap break-words group-hover:border-emerald-500/50 transition-colors">
                            {`# 1. Folder create karein aur enter karein
mkdir my-node-app && cd my-node-app

# 2. Package.json initialize karein
npm init -y

# 3. Dependencies install karein
npm install express cors dotenv

# 4. Run server file (server.js ko run karein)
node server.js`}
                          </pre>
                          <span className="absolute bottom-1.5 right-2 text-[9px] text-slate-500 font-mono group-hover:text-emerald-400 transition-colors">
                            💡 Double-click to copy
                          </span>
                        </div>
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
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-sky-400 font-mono">
                            🚀 2. VS Code Terminal me Run Karein:
                          </span>
                          <button
                            onClick={() =>
                              handleCopyCode(
                                "react_cmds",
                                "npm create vite@latest my-react-app -- --template react\ncd my-react-app\nnpm install\nnpm run dev"
                              )
                            }
                            className="text-[10px] font-mono text-sky-400 hover:text-white flex items-center gap-1 cursor-pointer bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                          >
                            <Copy className="size-3" />
                            <span>{copiedId === "react_cmds" ? "Copied ✓" : "Copy"}</span>
                          </button>
                        </div>
                        <div
                          onDoubleClick={() =>
                            handleCopyCode(
                              "react_cmds",
                              "npm create vite@latest my-react-app -- --template react\ncd my-react-app\nnpm install\nnpm run dev"
                            )
                          }
                          title="Double-click to copy commands"
                          className="group relative cursor-pointer"
                        >
                          <pre className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-sky-300 leading-relaxed overflow-x-auto max-w-full whitespace-pre-wrap break-words group-hover:border-sky-500/50 transition-colors">
                            {`# 1. New React Project banayein
npm create vite@latest my-react-app -- --template react

# 2. Folder me enter karein aur install karein
cd my-react-app
npm install

# 3. React App Start Karein (Run File: main.jsx -> App.jsx)
npm run dev`}
                          </pre>
                          <span className="absolute bottom-1.5 right-2 text-[9px] text-slate-500 font-mono group-hover:text-sky-400 transition-colors">
                            💡 Double-click to copy
                          </span>
                        </div>
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

                  {/* TAB 4: 📁 MULTI-FILE LINKING & ARCHITECTURE GUIDE */}
                  {activeVsCodeTab === "architecture" && (
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 max-w-full overflow-hidden">
                        <span className="text-xs font-bold text-amber-400 font-mono block flex items-center gap-1.5">
                          <span>📁 Multi-File Architecture: How Files Connect</span>
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                          Jab project me multiple files hoti hain (jaise <code>server.js</code>, <code>App.jsx</code>, <code>index.html</code>, <code>style.css</code>), unka execution flow neeche diye hierarchy ke anusar chalta hai:
                        </p>

                        <div className="space-y-2 text-[11px] font-mono">
                          {/* Item 1: index.html */}
                          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                            <div className="text-amber-300 font-bold flex items-center gap-1">
                              <span>1. index.html (Root Entry Point)</span>
                            </div>
                            <p className="text-slate-400 font-sans text-[10px]">
                              Browser sabse pehle <code>index.html</code> ko load karta hai. Iske andar:
                            </p>
                            <code className="text-cyan-300 block bg-slate-950 p-1.5 rounded text-[10px]">
                              {`<link rel="stylesheet" href="/src/style.css">\n<script type="module" src="/src/main.jsx"></script>`}
                            </code>
                          </div>

                          {/* Item 2: main.jsx */}
                          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                            <div className="text-sky-300 font-bold flex items-center gap-1">
                              <span>2. src/main.jsx (React Root Launcher)</span>
                            </div>
                            <p className="text-slate-400 font-sans text-[10px]">
                              <code>main.jsx</code> App component ko import karta hai aur <code>#root</code> me render karta hai:
                            </p>
                            <code className="text-cyan-300 block bg-slate-950 p-1.5 rounded text-[10px]">
                              {`import App from './App.jsx';\nReactDOM.createRoot(document.getElementById('root')).render(<App />);`}
                            </code>
                          </div>

                          {/* Item 3: App.jsx */}
                          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                            <div className="text-indigo-300 font-bold flex items-center gap-1">
                              <span>3. src/App.jsx (Frontend Logic & State)</span>
                            </div>
                            <p className="text-slate-400 font-sans text-[10px]">
                              Yahan UI elements, Hooks (<code>useState</code>, <code>useEffect</code>), aur Backend API calls hoti hain:
                            </p>
                            <code className="text-cyan-300 block bg-slate-950 p-1.5 rounded text-[10px]">
                              {`// Backend server.js se live data connect karna:\nuseEffect(() => {\n  fetch('http://localhost:5000/api/data')\n    .then(r => r.json())\n    .then(data => setData(data));\n}, []);`}
                            </code>
                          </div>

                          {/* Item 4: server.js */}
                          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                            <div className="text-emerald-300 font-bold flex items-center gap-1">
                              <span>4. server.js (Node.js REST API Server)</span>
                            </div>
                            <p className="text-slate-400 font-sans text-[10px]">
                              Express server Port 5000 par launch hota hai aur CORS enable karke React ko JSON send karta hai:
                            </p>
                            <code className="text-cyan-300 block bg-slate-950 p-1.5 rounded text-[10px]">
                              {`const express = require('express');\nconst cors = require('cors');\nconst app = express();\napp.use(cors());\napp.get('/api/data', (req, res) => res.json({ status: 'ok' }));\napp.listen(5000);`}
                            </code>
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
                      {courseTitle || "All Chapters & Topics"}
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
// Action-Oriented Bullet Generator for "What Does It Do?" (No Questions, Clear Points)
// ─────────────────────────────────────────────────────────────────────────────
function generateWhatItDoesPoints({
  courseTitle = "",
  moduleTitle = "",
  lessonTitle = "",
  topicTitle = "",
  concepts = [],
  language,
}: {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  topicTitle: string;
  concepts: ConceptItem[];
  language: ExplanationLanguage;
}): string[] {
  const combined = `${courseTitle} ${moduleTitle} ${lessonTitle} ${topicTitle}`.toLowerCase();

  // 1. React.js Specific Points
  if (combined.includes("react")) {
    if (
      combined.includes("get started") ||
      combined.includes("getting started") ||
      combined.includes("intro") ||
      combined.includes("what is") ||
      combined.includes("setup") ||
      combined.includes("installation")
    ) {
      return language === "hi"
        ? [
            "UI ko Chhote Reusable Components me divide karta hai: Poore web app ko Header, Card, Button jaise alag-alag modules me baant-ta hai.",
            "Virtual DOM se Fast Rendering deta hai: Page reload kiye bina sirf change hue data ko browser screen par update karta hai.",
            "Declarative JSX Syntax pradan karta hai: JavaScript ke andar direct HTML-like UI templates likhne ki suvidha deta hai.",
            "Unidirectional Data Flow maintain karta hai: Data hamesha Parent component se Child component ki taraf Props ke zariye flow hota hai.",
          ]
        : [
            "Divides UI into Modular Reusable Components: Breaks down complex web pages into isolated, maintainable building blocks.",
            "Enables High-Performance Virtual DOM Diffing: Updates only the modified DOM nodes without full browser page reloads.",
            "Provides Declarative JSX Syntax: Allows writing HTML-like component markup directly within JavaScript logic.",
            "Enforces One-Way Data Flow: Streams state predictably from parent components to child components via props.",
          ];
    }
    if (combined.includes("state") || combined.includes("usestate") || combined.includes("hook")) {
      return language === "hi"
        ? [
            "Component ki Dynamic Memory manage karta hai: User clicks, form inputs, toggle status ko component ke andar yaad rakhta hai.",
            "Auto Re-render Trigger karta hai: Jab bhi state update hoti hai, React turant component ko naye data ke sath screen par render karta hai.",
            "Immutable Updates ensure karta hai: State ko direct modify kiye bina safe setter function (setState) se update karta hai.",
          ]
        : [
            "Manages Component Memory & Reactive State: Preserves user inputs, active tab status, and interactive UI states.",
            "Triggers Automatic Reconciliation: Re-renders the component with fresh state values whenever setter is called.",
            "Enforces Immutable State Transitions: Guarantees deterministic state updates using pure setter functions.",
          ];
    }
    if (combined.includes("prop") || combined.includes("component") || combined.includes("stateless")) {
      return language === "hi"
        ? [
            "Parent se Child me Data Pass karta hai: Components ke beech dynamic parameters aur configuration bhejne deta hai.",
            "Read-Only Data Contract follow karta hai: Child component props ko change nahi kar sakta, jisse side effects aur bugs nahi aate.",
            "Component ko Reusable banata hai: Ek hi component ko alag-alag props dekar 100 jagah alag data ke sath use kar sakte hain.",
          ]
        : [
            "Streams Data from Parent to Child: Passes configuration and dynamic data into child components as custom attributes.",
            "Enforces Read-Only Immutability: Prevents child components from mutating incoming props directly, eliminating bugs.",
            "Maximizes Code Reusability: Allows rendering the same UI component across multiple views with varying props.",
          ];
    }
    if (combined.includes("effect") || combined.includes("useeffect") || combined.includes("lifecycle")) {
      return language === "hi"
        ? [
            "Side Effects ko Handle karta hai: Backend API se data fetch karna, timers set karna aur local storage update karna manage karta hai.",
            "Lifecycle Phases control karta hai: Component mount hone par, update hone par ya screen se hatne par specific code run karta hai.",
            "Memory Leaks rokne ke liye Cleanup karta hai: Return function ke zariye event listeners aur socket connections ko destroy karta hai.",
          ]
        : [
            "Executes Asynchronous Side Effects: Handles REST API calls, WebSocket subscriptions, and DOM event listeners.",
            "Controls Component Lifecycle Timing: Runs logic on component mount, dependency updates, and component unmount.",
            "Performs Memory Cleanup: Destroys timers and unbinds event listeners in return callback to prevent memory leaks.",
          ];
    }
    // Generic React Chapter
    return language === "hi"
      ? [
          "React 19+ Modern Component Architecture ko implement karta hai.",
          "Synthetic Events ke zariye User Interactions (Clicks, Submits) ko smoothly handle karta hai.",
          "Clean, reactive aur high-performance UI components deliver karta hai.",
        ]
      : [
          "Implements modern React 19+ functional architecture and declarative state management.",
          "Handles synthetic browser events (clicks, inputs, submits) with zero performance lag.",
          "Delivers clean, reactive, and enterprise-grade UI components.",
        ];
  }

  // 2. Node.js & Express Backend Specific Points (PRIORITY OVER JS)
  if (combined.includes("node") || combined.includes("express") || combined.includes("backend")) {
    return language === "hi"
      ? [
          "Non-blocking Asynchronous I/O se high-speed HTTP servers banata hai: Request aate hi event loop ke zariye bina block hue fast execute hota hai.",
          "RESTful APIs aur Middleware pipelines execute karta hai: Routes (GET, POST, PUT, DELETE) aur auth tokens ko manage karta hai.",
          "Database Operations aur Enterprise Backend Services serve karta hai: MongoDB, PostgreSQL aur microservices ke sath data securely sync karta hai.",
        ]
      : [
          "Creates High-Speed Non-Blocking HTTP Servers: Processes thousands of concurrent requests via the V8 Event Loop without thread blockage.",
          "Executes Express RESTful Routing & Middleware: Manages request-response pipelines, JWT auth headers, and endpoint validation.",
          "Powers Robust Database & Microservice Layers: Connects securely to PostgreSQL, MongoDB, and external backend microservices.",
        ];
  }

  // 3. HTML5 Specific Points
  if (combined.includes("html")) {
    return language === "hi"
      ? [
          "Webpage ka Semantic Structure banata hai: Content ko header, nav, main, section, footer me organize karta hai.",
          "SEO aur Accessibility ko behtar karta hai: Search engines aur screen readers ko page ka sahi matlab samajhata hai.",
          "Forms, Media aur Links ko embed karta hai: Text, Images, Videos aur Buttons ko browser me render karta hai.",
        ]
      : [
          "Structures Semantic Web Documents: Organizes layout using standard elements (header, nav, main, section, footer).",
          "Optimizes SEO and Screen Reader Accessibility: Provides structured meaning to search engines and assistive technologies.",
          "Embeds Interactive Forms, Media, and Hyperlinks: Displays text, inputs, buttons, and multimedia assets.",
        ];
  }

  // 4. CSS3 Specific Points
  if (combined.includes("css") || combined.includes("flexbox") || combined.includes("grid")) {
    return language === "hi"
      ? [
          "Responsive Layouts design karta hai: Mobile, Tablet aur Desktop par content ko automatic fit karta hai.",
          "Flexbox aur Grid se Alignment control karta hai: Elements ko horizontally aur vertically perfectly center aur space karta hai.",
          "Animations aur Visual Effects apply karta hai: Colors, hover states, transitions aur shadows se attractive UI banata hai.",
        ]
      : [
          "Designs Fluid Responsive Layouts: Adapts UI seamlessly across mobile, tablet, and widescreen displays.",
          "Controls 1D/2D Alignment with Flexbox & Grid: Perfectly aligns, distributes, and centers elements in the DOM.",
          "Applies Modern Animations & Styling Rules: Transforms UI elements with colors, transitions, and micro-interactions.",
        ];
  }

  // 5. TypeScript Specific Points
  if (combined.includes("typescript") || combined.includes("type")) {
    return language === "hi"
      ? [
          "Compile-Time Type Safety deta hai: Code run hone se pehle hi bugs aur data type mismatches ko pakad leta hai.",
          "Interfaces aur Generics se Clean Architecture banata hai: Complex data structures ko strictly define karta hai.",
          "IDE Autocomplete aur Refactoring ko boost karta hai: VS Code me faster autocomplete aur safe renaming provide karta hai.",
        ]
      : [
          "Enforces Strict Compile-Time Type Safety: Catches bugs and type errors before code ever runs in production.",
          "Defines Robust Interfaces & Generics: Structures complex enterprise schemas with strict type contracts.",
          "Powers Rich IDE Autocompletion: Accelerates development with intelligent autocomplete and safe refactoring.",
        ];
  }

  // 6. Python / Data Science
  if (combined.includes("python")) {
    return language === "hi"
      ? [
          "Clean, readable syntax me Data Processing aur Scripting execute karta hai.",
          "OOPs aur Modular Architecture ke sath scalable programs banata hai.",
          "Libraries aur Built-in Functions se complex tasks ko 2 line me solve karta hai.",
        ]
      : [
          "Processes data and executes scripting workflows with clean, readable syntax.",
          "Builds scalable applications using Object-Oriented and functional paradigms.",
          "Leverages built-in standard library utilities for high-efficiency computation.",
        ];
  }

  // 7. Client-Side JavaScript Specific Points
  if (combined.includes("javascript") || combined.includes("dom") || combined.includes("vanilla js")) {
    return language === "hi"
      ? [
          "Webpage ko Interactive aur Dynamic banata hai: Button click, form validation aur data calculations execute karta hai.",
          "DOM Manipulation karta hai: Page reload kiye bina elements ko add, remove aur modify karta hai.",
          "Asynchronous Operations (Fetch / Promises) handle karta hai: Server se background me live data mangwata hai.",
        ]
      : [
          "Enables Dynamic Client-Side Interactivity: Validates forms, handles user inputs, and computes business logic.",
          "Performs Direct DOM Traversal & Manipulation: Dynamically creates, updates, and removes HTML nodes on the fly.",
          "Manages Asynchronous Execution with Promises: Fetches data in the background via fetch() and async/await.",
        ];
  }

  // Fallback Clean Points
  return language === "hi"
    ? [
        `${topicTitle || lessonTitle} ke core concepts ko apply karta hai.`,
        "Code ko modular, reusable aur maintainable banata hai.",
        "Runtime errors ko rokk kar fast performance deliver karta hai.",
      ]
    : [
        `Applies the core principles of ${topicTitle || lessonTitle}.`,
        "Structures code into modular, maintainable, and reusable blocks.",
        "Prevents runtime exceptions and optimizes overall execution performance.",
      ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Real-World Production Use Cases Generator
// ─────────────────────────────────────────────────────────────────────────────
function generateUseCases({
  courseTitle = "",
  moduleTitle = "",
  lessonTitle = "",
  topicTitle = "",
  language,
}: {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  topicTitle: string;
  language: ExplanationLanguage;
}): string[] {
  const combined = `${courseTitle} ${moduleTitle} ${lessonTitle} ${topicTitle}`.toLowerCase();

  // 1. React.js Specific Use Cases
  if (combined.includes("react")) {
    if (combined.includes("component") || combined.includes("stateless") || combined.includes("prop")) {
      return language === "hi"
        ? [
            "नेविगेशन बार (Navbar), प्रोडक्ट कार्ड्स और फुटर जैसी रियूजेबल UI लाइब्रेरी बनाना",
            "एटॉमिक डिजाइन सिस्टम (Design System) के कोर कंपोनेंट्स बनाना",
            "डैशबोर्ड विगेट्स को पेरेंट से अलग-अलग डेटा पास करके रेंडर करना",
          ]
        : [
            "Building modular UI component libraries (Navbar, Cards, Modals, Footers)",
            "Creating scalable Design System tokens and enterprise UI components",
            "Passing dynamic data across parent-child dashboard widgets via props",
          ];
    }
    if (combined.includes("state") || combined.includes("usestate") || combined.includes("hook")) {
      return language === "hi"
        ? [
            "शॉपिंग कार्ट में आइटम्स जोड़ना, हटाना और कुल कीमत लाइव कैलकुलेट करना",
            "मल्टी-स्टेप फॉर्म विज़ार्ड और इनपुट वैलिडेशन स्टेट मैनेज करना",
            "डार्क/लाइट थीम टॉगल और साइडबार ओपन/क्लोज स्थिति संभालना",
          ]
        : [
            "Live E-commerce shopping cart counters and total price calculations",
            "Multi-step registration form wizards with instant validation state",
            "Dark/Light theme toggles and collapsible sidebar UI states",
          ];
    }
    if (combined.includes("effect") || combined.includes("useeffect") || combined.includes("lifecycle")) {
      return language === "hi"
        ? [
            "कंपोनेंट लोड होते ही बैकएंड REST API से लाइव JSON डेटा फ़ेच करना",
            "वेबसॉकेट्स और रियल-टाइम चैट का कनेक्शन ओपन व क्लोज़ करना",
            "ब्राउज़र लोकल स्टोरेज (LocalStorage) में यूजर प्रेफरेंस सिंक करना",
          ]
        : [
            "Fetching live JSON data from REST APIs on component mount",
            "Establishing and tearing down WebSocket real-time chat connections",
            "Syncing reactive application state with browser LocalStorage",
          ];
    }
    if (combined.includes("form") || combined.includes("input")) {
      return language === "hi"
        ? [
            "सुरक्षित लॉगिन, साइनअप और ऑथेंटिकेशन फॉर्म्स प्रोसेस करना",
            "सर्च बार में यूजर के टाइप करते ही ऑटो-सजेशन और लाइव फ़िल्टरिंग",
            "कस्टम फ़ाइल अपलोड और ड्रैग-एंड-ड्रॉप प्रिव्यू तैयार करना",
          ]
        : [
            "Secure Login and Registration form submission with validations",
            "Real-time search bar autocomplete and debounce query filters",
            "Custom file uploaders with drag-and-drop preview handling",
          ];
    }
    if (combined.includes("typescript") || combined.includes("type")) {
      return language === "hi"
        ? [
            "एंटरप्राइज React ऐप्स में सख्त TypeScript इंटरफेस और प्रॉप टाइप्स लागू करना",
            "कॉम्प्लेक्स स्टेट और API रिस्पॉन्स ऑब्जेक्ट्स को टाइप-सेफ बनाना",
            "प्रोडक्शन में अनडिफाइंड प्रॉपर्टी एरर्स (Cannot read properties of undefined) को रोकना",
          ]
        : [
            "Enforcing strict TypeScript interfaces and generic prop contracts",
            "Type-safe management of complex state and asynchronous API payloads",
            "Eliminating runtime undefined property exceptions across enterprise apps",
          ];
    }
    return language === "hi"
      ? [
          "हाई-परफॉरमेंस सिंगल पेज वेब एप्लीकेशन्स (SPA) बनाना",
          "क्लाइंट-साइड स्टेट और यूजर इंटरैक्शन को रिएक्टिव तरीके से मैनेज करना",
          "एंटरप्राइज फ्रंटेंड आर्किटेक्चर में मॉडर्न React 19+ पैटर्न्स लागू करना",
        ]
      : [
          "Building high-performance Single Page Applications (SPAs)",
          "Managing reactive client-side state and rich interactive UI workflows",
          "Implementing modern React 19+ architecture across enterprise projects",
        ];
  }

  // 2. Node.js & Express Backend Specific Use Cases (PRIORITY OVER JS)
  if (combined.includes("node") || combined.includes("express") || combined.includes("backend")) {
    return language === "hi"
      ? [
          "हाई-स्पीड RESTful APIs और माइक्रो-सर्विसेज बैकएंड तैयार करना",
          "डेटाबेस ट्रांजेक्शन्स (PostgreSQL / MongoDB) को नॉन-ब्लॉकिंग प्रोसेस करना",
          "JWT ऑथेंटिकेशन और रोल-बेस्ड एक्सेस कंट्रोल (RBAC) सिस्टम बनाना",
        ]
      : [
          "Creating high-speed event-driven RESTful APIs and microservices",
          "Executing non-blocking database queries with PostgreSQL and MongoDB",
          "Implementing robust JWT authentication and Role-Based Access Control",
        ];
  }

  // 3. HTML5 Use Cases
  if (combined.includes("html")) {
    return language === "hi"
      ? [
          "सर्च इंजनों (Google SEO) के लिए सिमेंटिक वेब पेज लेआउट बनाना",
          "स्क्रीन रीडर्स और एक्सेसिबिलिटी (a11y) के लिए सही सिमेंटिक टैग्स लगाना",
          "मोबाइल और डेस्कटॉप के लिए रिस्पॉन्सिव वेब फॉर्म्स तैयार करना",
        ]
      : [
          "Building semantic, SEO-optimized web documents (header, main, footer)",
          "Ensuring WCAG screen reader accessibility across enterprise web apps",
          "Creating cross-platform responsive forms and interactive media elements",
        ];
  }

  // 4. CSS3 Use Cases
  if (combined.includes("css") || combined.includes("flexbox") || combined.includes("grid")) {
    return language === "hi"
      ? [
          "मोबाइल, टैबलेट और लैपटॉप पर बिना टूटे परफेक्ट रिस्पॉन्सिव ग्रिड लेआउट",
          "नेविगेशन बार और बटनों को हॉरिजॉन्टली व वर्टिकली सेंटर में अलाइन करना",
          "होवर इफेक्ट्स, कार्ड शैडोज और स्मूथ सीएसएस एनिमेशन जोड़ना",
        ]
      : [
          "Fluid responsive grid layouts adjusting from mobile to 4K displays",
          "Pixel-perfect horizontal and vertical centering with CSS Flexbox",
          "Interactive hover transitions, card shadows, and micro-animations",
        ];
  }

  // 5. TypeScript Use Cases
  if (combined.includes("typescript") || combined.includes("type")) {
    return language === "hi"
      ? [
          "प्रोडक्शन में डेटा टाइप मिसमैच के कारण होने वाले बग्स को पहले ही रोकना",
          "बड़े एंटरप्राइज कोडबेस में ऑटो-कंप्लीट और सेफ रीफैक्टरिंग पाना",
          "API रिस्पॉन्स के लिए सख्त टाइप डेफिनिशन और इंटरफेस बनाना",
        ]
      : [
          "Catching runtime type mismatch bugs before deploying to production",
          "Accelerating development with rich IDE autocompletion and refactoring",
          "Enforcing strict type contracts for REST API request and response bodies",
        ];
  }

  // 6. Python Use Cases
  if (combined.includes("python")) {
    return language === "hi"
      ? [
          "ऑटोमेशन स्क्रिप्ट्स और बैकएंड डेटा पाइपलाइन्स तैयार करना",
          "पांडा और नम्पाई के साथ डेटा एनालिसिस व विज़ुअलाइज़ेशन करना",
          "फास्टएपीआई और फ्लास्क के साथ हाई-स्पीड REST APIs बनाना",
        ]
      : [
          "Building backend automation scripts and ETL data pipelines",
          "Executing scientific data analysis and visualization workflows",
          "Serving lightweight, high-performance REST APIs with FastAPI/Flask",
        ];
  }

  // 7. Client-Side JavaScript Use Cases
  if (combined.includes("javascript") || combined.includes("dom") || combined.includes("vanilla js")) {
    return language === "hi"
      ? [
          "पेज को रीलोड किए बिना यूजर इंटरैक्शन पर डायनामिक HTML चेंज करना",
          "API से डेटा मंगाकर टेबल और लिस्ट्स को जावास्क्रिप्ट से भरना",
          "क्लाइंट-साइड बिजनेस लॉजिक और कैलकुलेशन प्रोसेस करना",
        ]
      : [
          "Zero-reload dynamic DOM manipulation on button clicks and inputs",
          "Populating tables and lists dynamically from asynchronous APIs",
          "Executing fast client-side calculations and business validations",
        ];
  }

  return language === "hi"
    ? [
        `${topicTitle || lessonTitle} को प्रोडक्शन ग्रेड प्रोजेक्ट्स में लागू करना`,
        "मॉड्यूलर और स्केलेबल सॉफ्टवेयर आर्किटेक्चर तैयार करना",
        "इंडस्ट्री बेस्ट प्रैक्टिसेज के साथ सुरक्षित कोड डेवलप करना",
      ]
    : [
        `Implementing ${topicTitle || lessonTitle} in production-grade software`,
        "Designing modular, scalable, and testable code architectures",
        "Enforcing industry standard best practices for reliable execution",
      ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Real-World Working Code Generator (Rich Structures, Not Generic Toggle)
// ─────────────────────────────────────────────────────────────────────────────
function generateRichTopicCode({
  courseTitle = "",
  moduleTitle = "",
  lessonTitle = "",
  topicTitle = "",
  examples = [],
}: {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  topicTitle: string;
  examples: ExampleItem[];
}): string {
  const existingCode = examples[0]?.solutionCode || examples[0]?.starterCode;
  // If database has an exhaustive, valid code example (over 120 chars and not generic Toggle), use it
  if (existingCode && existingCode.length > 120 && !existingCode.includes("Toggle State") && !existingCode.includes("console.log('React")) {
    return existingCode;
  }

  const combined = `${courseTitle} ${moduleTitle} ${lessonTitle} ${topicTitle}`.toLowerCase();

  // 1. React.js Component Architecture & Hierarchy
  if (combined.includes("react")) {
    if (combined.includes("component") || combined.includes("stateless") || combined.includes("getting started") || combined.includes("intro") || combined.includes("what is")) {
      return `import React, { useState } from 'react';

// 1. Child Component: Reusable Feature Card
function FeatureCard({ title, desc, icon, badge, onSelect }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 transition-all shadow-md flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{icon}</span>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-sky-500/20 text-sky-300">
            {badge}
          </span>
        </div>
        <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
        <p className="text-xs text-slate-400 mb-4">{desc}</p>
      </div>
      <button
        onClick={onSelect}
        className="w-full py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-mono font-bold transition-all cursor-pointer"
      >
        Select Component →
      </button>
    </div>
  );
}

// 2. Parent Component: Modular App Structure
export default function App() {
  const [selectedFeature, setSelectedFeature] = useState('Component Hierarchy');

  const componentsList = [
    { id: 1, title: 'Component Hierarchy', desc: 'Break complex UIs into independent, reusable functional building blocks.', icon: '🧩', badge: 'Architecture' },
    { id: 2, title: 'Props & Data Flow', desc: 'Pass configuration and dynamic data from parent to child components.', icon: '⚡', badge: 'Reactive' },
    { id: 3, title: 'Virtual DOM Diffing', desc: 'High-performance reconciliation that updates only changed DOM nodes.', icon: '⚛️', badge: 'Ultra-Fast' }
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 text-slate-100 font-sans">
      <header className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            React.js Architecture
          </span>
        </div>
        <h1 className="text-xl font-extrabold text-white">Modular Component Structure</h1>
        <p className="text-xs text-slate-400 mt-1">
          Parent component rendering multiple reusable Child components via Props.
        </p>
      </header>

      {selectedFeature && (
        <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono flex items-center justify-between">
          <span>Active Component: <strong>{selectedFeature}</strong></span>
          <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded font-bold">STATE SYNCED ✓</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {componentsList.map((item) => (
          <FeatureCard
            key={item.id}
            title={item.title}
            desc={item.desc}
            icon={item.icon}
            badge={item.badge}
            onSelect={() => setSelectedFeature(item.title)}
          />
        ))}
      </div>
    </div>
  );
}`;
    }

    if (combined.includes("state") || combined.includes("usestate")) {
      return `import React, { useState } from 'react';

export default function InteractiveTaskManager() {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Understand React Component Hierarchy', done: true },
    { id: 2, text: 'Master useState & Immutable Array Updates', done: false },
    { id: 3, text: 'Build Production-Ready Interactive Classroom', done: false }
  ]);
  const [inputVal, setInputVal] = useState('');

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setTasks([...tasks, { id: Date.now(), text: inputVal.trim(), done: false }]);
    setInputVal('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl space-y-5 font-sans text-slate-100">
      <div>
        <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
          React State Engine
        </span>
        <h2 className="text-lg font-extrabold text-white mt-1">Interactive Task Manager</h2>
        <p className="text-xs text-slate-400">
          Demonstrates dynamic arrays, immutable updates, and reactive re-renders.
        </p>
      </div>

      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Add a new learning goal..."
          className="flex-1 px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
        />
        <button
          type="submit"
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono rounded-xl cursor-pointer shadow-md"
        >
          Add +
        </button>
      </form>

      <div className="space-y-2">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800/80 transition-all hover:border-slate-700"
          >
            <button
              onClick={() => toggleTask(t.id)}
              className="flex items-center gap-2.5 text-xs text-left cursor-pointer"
            >
              <span
                className={\`size-4 rounded-md flex items-center justify-center text-[10px] font-bold \${
                  t.done
                    ? 'bg-emerald-500 text-slate-950'
                    : 'border border-slate-700 text-transparent'
                }\`}
              >
                ✓
              </span>
              <span className={t.done ? 'line-through text-slate-500' : 'text-slate-200'}>
                {t.text}
              </span>
            </button>
            <button
              onClick={() => deleteTask(t.id)}
              className="text-xs text-rose-400 hover:text-rose-300 font-mono px-2 cursor-pointer"
              title="Delete Task"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}`;
    }

    if (combined.includes("effect") || combined.includes("useeffect") || combined.includes("lifecycle")) {
      return `import React, { useState, useEffect } from 'react';

export default function LiveApiDataLoader() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    // Simulate async network request with cleanup
    const timer = setTimeout(() => {
      if (isMounted) {
        setUsers([
          { id: 1, name: 'Siddharth Rao', role: 'Frontend Architect', active: true },
          { id: 2, name: 'Ananya Sharma', role: 'Full-Stack Engineer', active: true },
          { id: 3, name: 'Vikram Mehta', role: 'DevOps Specialist', active: false }
        ]);
        setLoading(false);
      }
    }, 700);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [refreshCount]);

  return (
    <div className="p-6 max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-slate-100 font-sans shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="text-xs font-mono text-emerald-400 font-bold uppercase">
            React Lifecycle
          </span>
          <h2 className="text-lg font-bold text-white">useEffect Side-Effect Engine</h2>
        </div>
        <button
          onClick={() => setRefreshCount((c) => c + 1)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded-xl cursor-pointer"
        >
          Refresh #{refreshCount + 1}
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-slate-400 animate-pulse bg-slate-950 rounded-2xl border border-slate-800">
          ⚡ Fetching live API payload...
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800"
            >
              <div>
                <h4 className="text-xs font-bold text-white font-mono">{u.name}</h4>
                <p className="text-[11px] text-slate-400">{u.role}</p>
              </div>
              <span
                className={\`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold \${
                  u.active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }\`}
              >
                {u.active ? 'Active ✓' : 'Offline'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}`;
    }

    if (combined.includes("typescript") || combined.includes("type")) {
      return `import React, { useState } from 'react';

// 1. Strict TypeScript Interfaces
interface StudentProfile {
  id: number;
  name: string;
  specialization: string;
  progressPercentage: number;
  isCertified: boolean;
}

interface StudentCardProps {
  student: StudentProfile;
  onCertify: (id: number) => void;
}

// 2. Type-Safe Functional Component
function StudentCard({ student, onCertify }: StudentCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
      <div>
        <h4 className="text-xs font-bold text-white font-mono">{student.name}</h4>
        <p className="text-[11px] text-slate-400 font-mono">
          {student.specialization} • {student.progressPercentage}% Complete
        </p>
      </div>
      <button
        onClick={() => onCertify(student.id)}
        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-mono text-[11px] font-bold rounded-xl cursor-pointer"
      >
        {student.isCertified ? 'Certified ✓' : 'Issue Certificate'}
      </button>
    </div>
  );
}

// 3. Main Type-Safe Application
export default function App() {
  const [students, setStudents] = useState<StudentProfile[]>([
    { id: 1, name: 'Arjun Verma', specialization: 'Frontend & React', progressPercentage: 100, isCertified: true },
    { id: 2, name: 'Pooja Nair', specialization: 'TypeScript Architecture', progressPercentage: 90, isCertified: false }
  ]);

  const handleCertify = (id: number) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isCertified: true, progressPercentage: 100 } : s))
    );
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-slate-900 border border-slate-800 rounded-3xl space-y-4 text-slate-100 font-sans shadow-xl">
      <header className="border-b border-slate-800 pb-3">
        <span className="text-xs font-mono text-blue-400 font-bold uppercase">
          React + TypeScript Strict Typing
        </span>
        <h2 className="text-lg font-bold text-white">Type-Safe Interface Contracts</h2>
      </header>
      <div className="space-y-2.5">
        {students.map((s) => (
          <StudentCard key={s.id} student={s} onCertify={handleCertify} />
        ))}
      </div>
    </div>
  );
}`;
    }
  }

  // 2. HTML5 Semantic Layout
  if (combined.includes("html")) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Semantic HTML5 Web Structure</title>
  <style>
    body { font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }
    header, nav, main, footer { background: #1e293b; padding: 15px; border-radius: 10px; margin-bottom: 12px; }
    nav a { color: #38bdf8; margin-right: 15px; text-decoration: none; font-weight: bold; }
    .card { background: #0f172a; border: 1px solid #334155; padding: 15px; border-radius: 8px; }
  </style>
</head>
<body>
  <header>
    <h1>Semantic HTML5 Architecture</h1>
    <nav>
      <a href="#home">Home</a>
      <a href="#courses">Courses</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>
  <main>
    <article class="card">
      <h2>Article: Clean Web Standards</h2>
      <p>Semantic tags improve SEO indexing and screen-reader accessibility.</p>
    </article>
  </main>
  <footer>
    <p>&copy; 2026 SkillForge Education Platform</p>
  </footer>
</body>
</html>`;
  }

  // 3. CSS3 Flexbox / Grid Responsive Layout
  if (combined.includes("css") || combined.includes("flexbox") || combined.includes("grid")) {
    return `/* Modern Responsive CSS3 Grid & Flexbox System */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  padding: 20px;
}

.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px -5px rgba(56, 189, 248, 0.2);
}`;
  }

  // Default fallback code
  return `import React, { useState } from 'react';

export default function App() {
  const [active, setActive] = useState(true);
  return (
    <div className="p-6 max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl text-white space-y-3">
      <h2 className="text-lg font-bold">${topicTitle || 'Interactive Component'}</h2>
      <p className="text-xs text-slate-400">Professional React component implementation.</p>
      <button
        onClick={() => setActive(!active)}
        className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-xl text-xs font-mono font-bold"
      >
        Status: {active ? 'Active ✓' : 'Paused'}
      </button>
    </div>
  );
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure Canonical Syntax Blueprint Generator (Precise Formulas & Signatures, Not Full Code Demos)
// ─────────────────────────────────────────────────────────────────────────────
function generateExactSyntaxBlueprint({
  courseTitle = "",
  moduleTitle = "",
  lessonTitle = "",
  topicTitle = "",
}: {
  courseTitle?: string;
  moduleTitle?: string;
  lessonTitle: string;
  topicTitle: string;
}): string {
  const combined = `${courseTitle} ${moduleTitle} ${lessonTitle} ${topicTitle}`.toLowerCase();

  // 1. REACT.JS SYNTAX PATTERNS
  if (combined.includes("react")) {
    if (combined.includes("usestate") || combined.includes("state")) {
      return `// 1. Hook Declaration (Getter & Setter Function)
const [stateValue, setStateValue] = useState(initialValue);

// 2. Direct Value Update
setStateValue(newValue);

// 3. Functional Update (Safe previous state access)
setStateValue((prevState) => ({ ...prevState, updatedKey: newValue }));`;
    }

    if (combined.includes("useeffect") || combined.includes("effect") || combined.includes("lifecycle")) {
      return `// React Side Effect & Lifecycle Formula
useEffect(() => {
  // 1. Mount or Dependency Update logic (API calls, subscriptions, timers)
  const timerId = setInterval(() => { /* ... */ }, 1000);

  // 2. Optional Cleanup function (Runs on unmount or before next execution)
  return () => clearInterval(timerId);
}, [dependency1, dependency2]); // Pass [] to run ONLY once on mount`;
    }

    if (combined.includes("useref") || combined.includes("ref")) {
      return `// 1. Declare Mutable Reference / DOM Node Holder
const elementRef = useRef(initialValue);

// 2. Attach to JSX Element
<input ref={elementRef} type="text" />

// 3. Access current value directly without triggering re-render
elementRef.current.focus();`;
    }

    if (combined.includes("usememo") || combined.includes("usecallback") || combined.includes("memo")) {
      return `// Memoized Computed Value (Recalculates only when dependencies change)
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// Memoized Function Reference (Prevents child re-renders)
const memoizedCallback = useCallback((arg) => handleAction(arg), [depA, depB]);`;
    }

    if (combined.includes("context") || combined.includes("usecontext")) {
      return `// 1. Create Context Object
const AppContext = React.createContext(defaultValue);

// 2. Provider Component wraps child tree
<AppContext.Provider value={{ currentUser, theme }}>
  <ChildComponent />
</AppContext.Provider>

// 3. Consume in any descendant component
const { currentUser, theme } = useContext(AppContext);`;
    }

    if (combined.includes("usereducer") || combined.includes("reducer")) {
      return `// 1. Reducer Function Signature
function reducer(state, action) {
  switch (action.type) {
    case 'ACTION_TYPE': return { ...state, key: action.payload };
    default: return state;
  }
}

// 2. Hook Declaration & Dispatch
const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'ACTION_TYPE', payload: data });`;
    }

    if (combined.includes("router") || combined.includes("route") || combined.includes("navigation")) {
      return `// React Router SPA Route Setup Formula
<BrowserRouter>
  <Routes>
    <Route path="/" element={<HomeLayout />}>
      <Route index element={<Dashboard />} />
      <Route path="items/:itemId" element={<ItemDetail />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
</BrowserRouter>`;
    }

    if (combined.includes("prop") || combined.includes("component") || combined.includes("hierarchy") || combined.includes("getting started") || combined.includes("intro")) {
      return `// Functional Component with Props Destructuring & Defaults
function ComponentName({ title, count = 0, isActive = false, onAction }) {
  return (
    <div className="card-container" onClick={onAction}>
      <h3>{title}</h3>
      {isActive ? <span>Active: {count}</span> : <span>Inactive</span>}
    </div>
  );
}

export default ComponentName;`;
    }

    // Generic React Fallback
    return `// React Component & State Declaration Formula
import React, { useState, useEffect } from 'react';

export default function ComponentName(props) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Lifecycle setup logic
  }, []);

  return <div className="root-element">{props.children}</div>;
}`;
  }

  // 2. NODE.JS & EXPRESS BACKEND SYNTAX PATTERNS
  if (combined.includes("node") || combined.includes("express") || combined.includes("backend")) {
    if (combined.includes("route") || combined.includes("routing") || combined.includes("crud") || combined.includes("web app")) {
      return `// Express.js REST Route Handler Formula
app.METHOD('/api/resource/:id', (req, res, next) => {
  const { id } = req.params;       // URL Parameters (:id)
  const { filter } = req.query;     // Query Strings (?filter=value)
  const payload = req.body;         // JSON Request Body

  // HTTP Response status and JSON output
  return res.status(200).json({ success: true, id, data: payload });
});`;
    }

    if (combined.includes("middleware") || combined.includes("auth") || combined.includes("jwt") || combined.includes("security")) {
      return `// Express Middleware Pipeline Signature: (req, res, next)
function customMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  req.user = verifyToken(token); // Attach payload to request object
  next(); // Pass execution control to next handler in chain
}`;
    }

    if (combined.includes("error") || combined.includes("exception")) {
      return `// Global Express Error Handler Signature: 4 Arguments (err, req, res, next)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error('[Server Error]', err.stack);
  res.status(statusCode).json({ success: false, error: message });
});`;
    }

    if (combined.includes("file") || combined.includes("fs") || combined.includes("path") || combined.includes("stream")) {
      return `// Node.js File System (fs/promises) & Path Resolution
const fs = require('fs/promises');
const path = require('path');

const targetPath = path.join(__dirname, 'data', 'file.json');

// Async Read & Write Operations
const rawData = await fs.readFile(targetPath, 'utf-8');
await fs.writeFile(targetPath, JSON.stringify(data, null, 2), 'utf-8');`;
    }

    if (combined.includes("event") || combined.includes("emitter")) {
      return `// Node.js EventEmitter Pattern Formula
const EventEmitter = require('events');
const eventBus = new EventEmitter();

// 1. Subscribe to event
eventBus.on('user:created', (user) => {
  console.log('Sending welcome email to:', user.email);
});

// 2. Emit event with payload
eventBus.emit('user:created', { id: 'u1', email: 'alex@codeair.tech' });`;
    }

    // Generic Node.js & Express Fallback
    return `// Node.js Express Server Setup Formula
const express = require('express');
const app = express();

app.use(express.json()); // Parse incoming JSON bodies

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server active on port \${PORT}\`));`;
  }

  // 3. HTML5 SYNTAX PATTERNS
  if (combined.includes("html")) {
    if (combined.includes("form") || combined.includes("input")) {
      return `<!-- HTML5 Form Declaration & Input Validation Syntax -->
<form action="/api/submit" method="POST" enctype="multipart/form-data">
  <label for="userEmail">Email Address:</label>
  <input 
    type="email" 
    id="userEmail" 
    name="email" 
    required 
    placeholder="user@example.com" 
    autocomplete="email"
  />
  <button type="submit">Submit Form</button>
</form>`;
    }

    if (combined.includes("table")) {
      return `<!-- HTML5 Semantic Table Syntax -->
<table>
  <thead>
    <tr>
      <th scope="col">ID</th>
      <th scope="col">Product Name</th>
      <th scope="col">Price</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>#101</td>
      <td>React Masterclass</td>
      <td>$49.99</td>
    </tr>
  </tbody>
</table>`;
    }

    // Standard HTML5 Document Blueprint
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Document Title</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header><nav><!-- Navigation links --></nav></header>
  <main><article><!-- Primary page content --></article></main>
  <footer><p>&copy; 2026 CodeCraft Platform</p></footer>
</body>
</html>`;
  }

  // 4. CSS3 SYNTAX PATTERNS
  if (combined.includes("css") || combined.includes("flexbox") || combined.includes("grid") || combined.includes("responsive")) {
    if (combined.includes("flex") || combined.includes("flexbox")) {
      return `/* CSS3 Flexbox Container & Alignment Rules */
.flex-container {
  display: flex;
  flex-direction: row | column;
  justify-content: flex-start | center | space-between | space-around;
  align-items: stretch | center | flex-start | flex-end;
  gap: 16px;
  flex-wrap: wrap | nowrap;
}

.flex-item {
  flex: 1 1 200px; /* flex-grow flex-shrink flex-basis */
}`;
    }

    if (combined.includes("grid")) {
      return `/* CSS3 Grid Layout Rules */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  grid-template-rows: auto;
  gap: 20px;
  justify-items: stretch;
  align-items: start;
}`;
    }

    if (combined.includes("media") || combined.includes("responsive") || combined.includes("mobile")) {
      return `/* Mobile-First Responsive Breakpoint Syntax */
.container {
  width: 100%;
  padding: 12px;
}

@media (min-width: 768px) {
  .container { width: 720px; padding: 20px; } /* Tablet */
}

@media (min-width: 1024px) {
  .container { width: 960px; padding: 32px; } /* Desktop */
}`;
    }

    // Standard CSS Rule Syntax
    return `/* CSS3 Rule Structure: Selector { Property: Value; } */
.class-selector, #element-id, tag-name {
  display: block;
  margin: 0 auto;
  padding: clamp(1rem, 2vw, 2.5rem);
  color: var(--primary-color, #38bdf8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}`;
  }

  // 5. JAVASCRIPT (ES6+) SYNTAX PATTERNS
  if (combined.includes("javascript") || combined.includes("js") || combined.includes("dom") || combined.includes("string") || combined.includes("array")) {
    if (combined.includes("async") || combined.includes("await") || combined.includes("promise") || combined.includes("fetch")) {
      return `// ES6+ Async/Await with Try/Catch Exception Handling Formula
async function handleAsyncOperation(endpointUrl, requestPayload = {}) {
  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) throw new Error(\`HTTP Error \${response.status}\`);
    return await response.json();
  } catch (error) {
    console.error('Operation Failed:', error.message);
    throw error;
  }
}`;
    }

    if (combined.includes("array") || combined.includes("map") || combined.includes("filter") || combined.includes("reduce")) {
      return `// Functional Array Transformation Methods Syntax
const mappedArray   = array.map((item, index) => transform(item));
const filteredArray = array.filter((item) => predicateCondition(item));
const totalSum      = array.reduce((acc, curr) => acc + curr.value, initialValue);
const targetItem    = array.find((item) => item.id === searchedId);
const hasAnyMatch   = array.some((item) => item.status === 'active');`;
    }

    if (combined.includes("destructur") || combined.includes("spread") || combined.includes("rest")) {
      return `// Object & Array Destructuring + Spread Formulas
const { id, title, role = 'student' } = userObject;
const [firstItem, secondItem, ...remainingItems] = listArray;

// Spread Operator (Immutable Clone / Merge)
const clonedObject = { ...userObject, isVerified: true };
const combinedList = [...listA, ...listB];`;
    }

    if (combined.includes("dom") || combined.includes("event")) {
      return `// DOM Node Selection & Event Listener Formula
const actionButton = document.querySelector('#submit-btn');

actionButton.addEventListener('click', (event) => {
  event.preventDefault(); // Prevent default reload/submission
  actionButton.classList.toggle('active');
  actionButton.textContent = 'Processing...';
});`;
    }

    if (combined.includes("class") || combined.includes("oop") || combined.includes("inheritance")) {
      return `// ES6 Class Declaration & Inheritance Formula
class BaseService {
  constructor(serviceName) {
    this.name = serviceName;
  }
}

class AuthService extends BaseService {
  constructor(serviceName, secretKey) {
    super(serviceName); // Call parent constructor
    this.secret = secretKey;
  }

  authenticate(user) {
    return user.isValid();
  }
}`;
    }

    // Generic JS Fallback
    return `// JavaScript ES6+ Function & Variable Declaration Formula
const CONSTANT_NAME = 'immutable_binding';
let mutableVariable = 'can_be_reassigned';

const calculateResult = (paramA, paramB = 0) => {
  return paramA + paramB;
};`;
  }

  // 6. TYPESCRIPT ENTERPRISE SYNTAX PATTERNS
  if (combined.includes("typescript") || combined.includes("type") || combined.includes("interface")) {
    return `// TypeScript Interface, Type Alias & Generic Contract Formula
type ExecutionStatus = 'idle' | 'running' | 'completed' | 'failed';

interface BaseEntity {
  readonly id: string;
  createdAt: Date;
}

interface ServiceResponse<TData> extends BaseEntity {
  status: ExecutionStatus;
  payload: TData;
  errorMessage?: string; // Optional field
}

async function requestApi<T>(url: string): Promise<ServiceResponse<T>> {
  // Type-safe API client implementation
}`;
  }

  // 7. JAVA ENTERPRISE & SPRING BOOT / HIBERNATE SYNTAX PATTERNS
  if (combined.includes("java") || combined.includes("spring") || combined.includes("hibernate") || combined.includes("jpa")) {
    if (combined.includes("spring") || combined.includes("boot") || combined.includes("controller")) {
      return `// Spring Boot REST Controller Formula
@RestController
@RequestMapping("/api/v1/resources")
public class ResourceController {
    @Autowired
    private ResourceService service;

    @GetMapping("/{id}")
    public ResponseEntity<ResourceDto> getResource(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }
}`;
    }
    if (combined.includes("hibernate") || combined.includes("jpa") || combined.includes("entity")) {
      return `// JPA / Hibernate Entity Declaration Formula
@Entity
@Table(name = "users")
public class UserEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;
}`;
    }
    return `// Java Enterprise Class & Method Formula
package com.enterprise.service;

public class DataService<T> implements IService<T> {
    private final Repository<T> repository;

    public DataService(Repository<T> repo) {
        this.repository = repo;
    }

    public T processRecord(T entity) throws ServiceException {
        return repository.save(entity);
    }
}`;
  }

  // 8. C# & .NET CORE / ENTITY FRAMEWORK SYNTAX PATTERNS
  if (combined.includes("c#") || combined.includes(".net") || combined.includes("dotnet") || combined.includes("entity framework")) {
    return `// ASP.NET Core Controller & LINQ Query Formula
[ApiController]
[Route("api/[controller]")]
public class ItemsController : ControllerBase {
    private readonly AppDbContext _context;
    public ItemsController(AppDbContext ctx) => _context = ctx;

    [HttpGet("{id}")]
    public async Task<ActionResult<ItemDto>> GetItemAsync(int id) {
        var item = await _context.Items.FindAsync(id);
        return item != null ? Ok(item) : NotFound();
    }
}`;
  }

  // 9. C++ MODERN SYSTEMS (C++17 / C++20)
  if (combined.includes("c++") || combined.includes("cpp")) {
    return `// Modern C++ Template & Smart Pointer Formula
#include <iostream>
#include <memory>
#include <vector>

template <typename T>
class SystemManager {
private:
    std::vector<T> dataStore;
public:
    void addItem(const T& item) { dataStore.push_back(item); }
    [[nodiscard]] auto getSize() const noexcept -> size_t { return dataStore.size(); }
};

auto managerPtr = std::make_unique<SystemManager<int>>();`;
  }

  // 10. C SYSTEMS PROGRAMMING
  if (combined.includes("c systems") || combined.includes("c programming") || combined.includes("c language")) {
    return `// C Systems Memory Allocation & Pointer Formula
#include <stdio.h>
#include <stdlib.h>

typedef struct {
    int id;
    char buffer[256];
} SystemNode;

SystemNode* node = (SystemNode*)malloc(sizeof(SystemNode));
if (node == NULL) { return -1; }
// Cleanup:
free(node);`;
  }

  // 11. ANDROID & KOTLIN
  if (combined.includes("android") || combined.includes("kotlin")) {
    return `// Kotlin Coroutines & Android ViewModel Formula
class MainViewModel(private val repo: DataRepository) : ViewModel() {
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    fun loadData() = viewModelScope.launch {
        _uiState.value = UiState.Success(repo.fetchItems())
    }
}`;
  }

  // 12. IOS & SWIFT / SWIFTUI
  if (combined.includes("ios") || combined.includes("swift") || combined.includes("objective-c")) {
    return `// SwiftUI Declarative View & State Binding Formula
import SwiftUI

struct DashboardView: View {
    @State private var isLoading: Bool = false
    @StateObject private var viewModel = DashboardViewModel()

    var body: some View {
        VStack(spacing: 16) {
            Text("Dashboard").font(.headline)
            Button("Refresh") { viewModel.fetch() }
        }
    }
}`;
  }

  // 13. PHP 8 & LARAVEL
  if (combined.includes("php") || combined.includes("laravel")) {
    return `<?php
declare(strict_types=1);

namespace App\\Http\\Controllers;
use App\\Models\\User;
use Illuminate\\Http\\JsonResponse;

class ApiController extends Controller {
    public function show(int $id): JsonResponse {
        $data = User::findOrFail($id);
        return response()->json(['status' => 'success', 'data' => $data]);
    }
}`;
  }

  // 14. RUBY & RUBY ON RAILS
  if (combined.includes("ruby") || combined.includes("rails")) {
    return `# Ruby on Rails Controller & ActiveRecord Formula
class Api::V1::ItemsController < ApplicationController
  before_action :authenticate_user!

  def index
    @items = Item.where(active: true).order(created_at: :desc)
    render json: { success: true, items: @items }
  end
end`;
  }

  // 15. ANGULAR 2+
  if (combined.includes("angular")) {
    return `// Angular Component & RxJS Observable Formula
import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-data-view',
  standalone: true,
  template: \`<div *ngIf="items$ | async as items">{{ items.length }} items</div>\`
})
export class DataViewComponent {
  private http = inject(HttpClient);
  items$: Observable<Item[]> = this.http.get<Item[]>('/api/items');
}`;
  }

  // 16. DATA STRUCTURES & ALGORITHMS (DSA)
  if (combined.includes("dsa") || combined.includes("data structure") || combined.includes("algorithm") || combined.includes("tree") || combined.includes("graph") || combined.includes("sort")) {
    return `// Canonical Algorithm Formula (Time Complexity: O(log N) / O(N))
function binarySearch(sortedArray, targetValue) {
  let left = 0, right = sortedArray.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (sortedArray[mid] === targetValue) return mid;
    if (sortedArray[mid] < targetValue) left = mid + 1;
    else right = mid - 1;
  }
  return -1; // Not found
}`;
  }

  // 17. DEVOPS, BASH & POWERSHELL
  if (combined.includes("bash") || combined.includes("linux") || combined.includes("powershell") || combined.includes("devops") || combined.includes("git")) {
    if (combined.includes("powershell")) {
      return `# PowerShell Automation Function Formula
function Invoke-BuildPipeline {
    [CmdletBinding()]
    param([Parameter(Mandatory=$true)][string]$Environment)
    
    Write-Host "Deploying to $Environment..." -ForegroundColor Cyan
    Get-Service -Name "AppService" | Restart-Service
}`;
    }
    return `#!/usr/bin/env bash
# Robust Bash Shell Scripting Formula
set -euo pipefail

TARGET_DIR="\${1:-./dist}"
if [[ ! -d "$TARGET_DIR" ]]; then
  echo "Error: Target directory $TARGET_DIR does not exist" >&2
  exit 1
fi
echo "Deploying build artifacts from $TARGET_DIR..."`;
  }

  // 18. PYTHON SYNTAX PATTERNS
  if (combined.includes("python") || combined.includes("django") || combined.includes("flask")) {
    return `# Python 3 Function & Type Hints Formula
from typing import Optional, List, Dict

def process_data(
    records: List[Dict[str, any]], 
    threshold: float = 0.5
) -> Dict[str, any]:
    """Processes list of dict records with type annotations."""
    valid_items = [r for r in records if r.get("score", 0) >= threshold]
    return {"total": len(records), "valid_count": len(valid_items)}`;
  }

  // 19. DATABASE / SQL / MONGODB SYNTAX PATTERNS
  if (combined.includes("sql") || combined.includes("database") || combined.includes("query") || combined.includes("table") || combined.includes("mongo")) {
    if (combined.includes("mongo")) {
      return `// MongoDB Aggregation Pipeline Formula
db.collection.aggregate([
  { $match: { status: 'completed' } },
  { $group: { _id: '$userId', totalAmount: { $sum: '$amount' } } },
  { $sort: { totalAmount: -1 } },
  { $limit: 10 }
]);`;
    }
    return `-- Standard SQL Query & Transaction Formula
SELECT 
  u.id, u.name, 
  COUNT(o.id) AS total_orders
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.name
HAVING COUNT(o.id) >= 1
ORDER BY total_orders DESC
LIMIT 20;`;
  }

  // Final Universal Fallback
  return `// ${topicTitle || lessonTitle} Syntax Blueprint
// Declaration & Execution Formula:
const ${topicTitle.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "entity"} = new FeatureHandler({
  configOption: true,
  onSuccess: (result) => handleResult(result)
});`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Senior Rule Generator (Covering all 52+ Course Domains)
// ─────────────────────────────────────────────────────────────────────────────
function generateSeniorRule({
  courseTitle = "",
  moduleTitle = "",
  lessonTitle = "",
  topicTitle = "",
  language,
}: {
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  topicTitle: string;
  language: ExplanationLanguage;
}): string {
  const combined = `${courseTitle} ${moduleTitle} ${lessonTitle} ${topicTitle}`.toLowerCase();

  if (combined.includes("react")) {
    if (combined.includes("state") || combined.includes("usestate")) {
      return language === "hi"
        ? "State ko kabhi directly mutate na karein (state.push nahi chalana); hamesha setter function aur spread operator (`[...prev, item]`) ka use karein!"
        : "Never mutate state directly (e.g. state.push()); always use setter functions and immutable updates with spread syntax (`[...prev, item]`).";
    }
    if (combined.includes("effect") || combined.includes("useeffect")) {
      return language === "hi"
        ? "useEffect ke dependency array ko hamesha accurately define karein aur asynchronous listeners ke liye return cleanup function likhein taaki memory leak na ho!"
        : "Always declare all reactive values in useEffect dependency arrays and return cleanup handlers to prevent memory leaks.";
    }
    if (combined.includes("prop") || combined.includes("component")) {
      return language === "hi"
        ? "Props hamesha read-only hote hain; child component me prop value change karne ke bajaye parent se callback function trigger karein!"
        : "Props are strictly read-only; never mutate incoming props—pass callback handlers to notify parent components of changes.";
    }
    return language === "hi"
      ? "React me business logic ko custom hooks me aur UI ko small presentational components me separate rakhein!"
      : "Separate business logic into custom hooks and keep presentational UI components small and decoupled.";
  }

  if (combined.includes("node") || combined.includes("express") || combined.includes("backend")) {
    if (combined.includes("route") || combined.includes("async")) {
      return language === "hi"
        ? "Async route handlers me hamesha try/catch ya express-async-handler use karein taaki unhandled promise rejection se server crash na ho!"
        : "Always wrap async route handlers with try/catch or async middleware to catch unhandled promise rejections before they crash the server.";
    }
    if (combined.includes("middleware") || combined.includes("auth")) {
      return language === "hi"
        ? "Middleware function ke har path me ya to `next()` call karein ya `res.status().json()` send karein, varna request hang ho jayegi!"
        : "Ensure every code path in a middleware either calls `next()` or terminates with `res.json()`, otherwise client requests will hang indefinitely.";
    }
    return language === "hi"
      ? "Sensitive credentials ko `.env` me rakhein aur production me Helmet + Rate Limiter middlewares zarur lagayein!"
      : "Store sensitive secrets in environment variables (.env) and always attach security headers (Helmet) and rate limiters in production.";
  }

  if (combined.includes("java") || combined.includes("spring") || combined.includes("c#") || combined.includes(".net")) {
    return language === "hi"
      ? "Enterprise architecture me Dependency Injection (DI) aur Interface-based loose coupling follow karein!"
      : "Adhere to Dependency Injection (DI) and interface-based design patterns to maintain decoupled enterprise services.";
  }

  if (combined.includes("c++") || combined.includes("c systems")) {
    return language === "hi"
      ? "Raw pointers ke bajaye RAII aur smart pointers (`std::unique_ptr`, `std::shared_ptr`) ka use karein taaki memory leaks na hon!"
      : "Enforce RAII principles and smart pointers (std::unique_ptr, std::shared_ptr) to eliminate manual memory leaks.";
  }

  if (combined.includes("android") || combined.includes("ios") || combined.includes("mobile")) {
    return language === "hi"
      ? "Main/UI Thread par kabhi heavy I/O na karein; hamesha Coroutines ya Background Dispatchers use karein!"
      : "Never perform blocking disk/network operations on the Main UI thread; use Coroutines or background queues.";
  }

  if (combined.includes("html")) {
    return language === "hi"
      ? "Hamesha semantic HTML5 tags (`<main>`, `<nav>`, `<article>`, `<header>`) ka use karein; sirf `<div>` par depend na rahein!"
      : "Always write semantic HTML5 tags (<main>, <nav>, <article>, <header>) instead of generic <div> tags to ensure accessibility and SEO.";
  }

  if (combined.includes("css")) {
    return language === "hi"
      ? "Fixed pixel widths (`width: 800px`) se bachein; hamesha responsive units (`rem`, `%`, `clamp()`, `minmax()`) aur Flexbox/Grid use karein!"
      : "Avoid fixed pixel widths; use responsive units (rem, %, clamp(), minmax()) and Flexbox/Grid for fluid multi-device layouts.";
  }

  if (combined.includes("sql") || combined.includes("database")) {
    return language === "hi"
      ? "SQL Injection se bachne ke liye hamesha Parameterized Queries aur Prepared Statements use karein; indexes zarur banayein!"
      : "Always use parameterized queries/prepared statements to prevent SQL injection and index high-frequency query columns.";
  }

  if (combined.includes("javascript")) {
    return language === "hi"
      ? "Hamesha strict equality (`===`) use karein aur `var` ke bajaye `const`/`let` ka istemal karein!"
      : "Always use strict equality (`===`) to prevent unintended type coercion, and favor `const` over `let` and `var`.";
  }

  return language === "hi"
    ? "Clean code principles (DRY & Single Responsibility) ka palan karein aur defensive error boundaries implement karein!"
    : "Follow clean code principles (DRY & Single Responsibility) and always implement defensive error handling.";
}

// ─────────────────────────────────────────────────────────────────────────────
// Clean Pedagogical Topic Breakdown Generator (Ultra-Simple Words for 110 Chapters)
// ─────────────────────────────────────────────────────────────────────────────
function buildCleanTopicBreakdown({
  courseTitle = "",
  moduleTitle = "",
  lessonTitle = "",
  topicTitle = "",
  lessonExplanation,
  concepts = [],
  examples = [],
  language,
}: {
  courseTitle?: string;
  moduleTitle?: string;
  lessonTitle: string;
  topicTitle: string;
  lessonExplanation?: string;
  concepts: ConceptItem[];
  examples: ExampleItem[];
  language: ExplanationLanguage;
}) {
  const combined = `${courseTitle} ${moduleTitle} ${lessonTitle} ${topicTitle}`.toLowerCase();

  // 1. Detect Domain
  const isReact = combined.includes("react");
  const isHtml = combined.includes("html") || combined.includes("doctype") || combined.includes("heading") || combined.includes("paragraph") || combined.includes("semantic");
  const isCss = combined.includes("css") || combined.includes("responsive") || combined.includes("flexbox") || combined.includes("grid") || combined.includes("padding") || combined.includes("border");
  const isJs = !isReact && (combined.includes("javascript") || combined.includes("js") || combined.includes("dom") || combined.includes("string") || combined.includes("array") || combined.includes("date"));
  const isTs = combined.includes("typescript") || combined.includes("enum") || combined.includes("interface");
  const isPython = combined.includes("python") || combined.includes("django") || combined.includes("flask");
  const isJava = combined.includes("java ") || combined.includes("spring") || combined.includes("hibernate");
  const isAndroid = combined.includes("android") || combined.includes("kotlin");
  const isIos = combined.includes("ios") || combined.includes("swift");
  const isNode = combined.includes("node") || combined.includes("express") || combined.includes("koa") || combined.includes("mongoose");

  let domainName = "Software Engineering";
  if (isReact) domainName = "React.js & Modern Frontend Architecture";
  else if (isHtml) domainName = "HTML5 & Web Standards";
  else if (isCss) domainName = "CSS3 & Responsive Design";
  else if (isJs) domainName = "JavaScript ES6+";
  else if (isTs) domainName = "TypeScript Enterprise";
  else if (isPython) domainName = "Python 3 & Data Engineering";
  else if (isJava) domainName = "Java Enterprise Systems";
  else if (isAndroid) domainName = "Android Native Mobile";
  else if (isIos) domainName = "iOS Native Mobile";
  else if (isNode) domainName = "Node.js & Backend Architecture";

  const defaultDefinition =
    lessonExplanation ||
    (language === "hi"
      ? `${topicTitle || lessonTitle} ${domainName} का एक महत्वपूर्ण विषय है जो आपके कोड को संरचित, आधुनिक और शक्तिशाली बनाता है।`
      : `${topicTitle || lessonTitle} is a core foundation of ${domainName}, enabling clean, scalable, and professional software development.`);

  const conceptPoints = generateWhatItDoesPoints({
    courseTitle,
    moduleTitle,
    lessonTitle,
    topicTitle,
    concepts,
    language,
  });

  const useCasesList = generateUseCases({
    courseTitle,
    moduleTitle,
    lessonTitle,
    topicTitle,
    language,
  });

  // Pure, authentic, concise syntax formula for Section 4
  const exactSyntax = generateExactSyntaxBlueprint({
    courseTitle,
    moduleTitle,
    lessonTitle,
    topicTitle,
  });

  const seniorRuleText = generateSeniorRule({
    courseTitle,
    moduleTitle,
    lessonTitle,
    topicTitle,
    language,
  });

  return {
    title: topicTitle || lessonTitle,
    definition: defaultDefinition,
    whatItDoes: conceptPoints,
    useCases: useCasesList,
    syntaxSnippet: exactSyntax,
    seniorRule: seniorRuleText,
    withoutThis:
      language === "hi"
        ? "कोड अनियंत्रित और मुश्किल हो जाता था।"
        : "Unstructured code that is difficult to maintain and scale.",
    withThis:
      language === "hi"
        ? "साफ़, मॉडर्न और इंडस्ट्री-ग्रेड आर्किटेक्चर मिलता है!"
        : `Clean, industry-standard ${domainName} implementation!`,
    flowSteps: [
      {
        phase: `1. Initialize ${topicTitle || lessonTitle}`,
        whatHappens: language === "hi" ? "कॉन्सेप्ट और इनपुट्स लोड हुए।" : `Initializes ${topicTitle || lessonTitle} parameters.`,
        dataState: "State: INITIALIZED",
      },
      {
        phase: "2. Execution & State Update",
        whatHappens: language === "hi" ? "लॉजिक निष्पादित हुआ।" : "Executes logic and updates state.",
        dataState: "State: PROCESSING",
      },
      {
        phase: "3. Clean Resolution & Output",
        whatHappens: language === "hi" ? "सफलतापूर्वक आउटपुट रेंडर हुआ।" : "Renders clean output and updates view.",
        dataState: "State: RESOLVED / SUCCESS",
      },
    ],
  };
}