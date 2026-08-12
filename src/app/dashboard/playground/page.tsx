"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Code2, Save, Download, Upload, Trash2 } from "lucide-react";
import { IDEPanel } from "@/components/editor/ide-panel";
import { FileExplorer, type FileNode } from "@/components/editor/file-explorer";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const STORAGE_KEY = "playground_code";

const DEFAULT_CODE = `// Welcome to the Playground!
// Write your JavaScript code here and click Run to execute it.

function greet(name) {
  return \`Hello, \${name}! Welcome to coding.\`;
}

const message = greet("Developer");
console.log(message);

// Try some calculations
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
console.log(\`Sum of \${numbers.join(" + ")} = \${sum}\`);

// Create a simple data structure
const user = {
  name: "Alice",
  age: 25,
  skills: ["JavaScript", "React", "Node.js"],
};

console.log("User profile:", JSON.stringify(user, null, 2));
`;

const DEFAULT_FILE_TREE: FileNode[] = [
  {
    id: "src",
    name: "src",
    path: "src",
    type: "folder",
    children: [
      {
        id: "main-js",
        name: "main.js",
        path: "src/main.js",
        type: "file",
        language: "javascript",
      },
      {
        id: "utils-js",
        name: "utils.js",
        path: "src/utils.js",
        type: "file",
        language: "javascript",
      },
      {
        id: "styles-css",
        name: "styles.css",
        path: "src/styles.css",
        type: "file",
        language: "css",
      },
    ],
  },
  {
    id: "data",
    name: "data",
    path: "data",
    type: "folder",
    children: [
      {
        id: "config-json",
        name: "config.json",
        path: "data/config.json",
        type: "file",
        language: "json",
      },
    ],
  },
  {
    id: "readme-md",
    name: "README.md",
    path: "README.md",
    type: "file",
    language: "markdown",
  },
];

interface SavedState {
  code: string;
  language: string;
  timestamp: number;
}

function loadSavedState(): SavedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedState;
  } catch {
    return null;
  }
}

function saveState(code: string, language: string) {
  if (typeof window === "undefined") return;
  try {
    const state: SavedState = { code, language, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /**/
  }
}

export default function PlaygroundPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFileId, setActiveFileId] = useState("main-js");
  const [fileContents, setFileContents] = useState<Record<string, string>>(() => {
    const saved = loadSavedState();
    return {
      "main-js": saved?.code || DEFAULT_CODE,
      "utils-js": "// Utility functions\n\nexport function add(a, b) {\n  return a + b;\n}\n\nexport function multiply(a, b) {\n  return a * b;\n}\n",
      "styles-css": "/* Add your styles here */\n\nbody {\n  font-family: sans-serif;\n}\n",
      "config-json": "{\n  \"appName\": \"My Playground\",\n  \"version\": \"1.0.0\"\n}\n",
      "readme-md": "# My Playground\n\nWelcome to the playground!\n",
    };
  });
  const [language, setLanguage] = useState(() => loadSavedState()?.language || "javascript");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveState(fileContents[activeFileId] || "", language);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeFileId, fileContents, language]);

  useEffect(() => {
    const id = setTimeout(() => {
      saveState(fileContents[activeFileId] || "", language);
    }, 2000);
    return () => clearTimeout(id);
  }, [fileContents, activeFileId, language]);

  const activeCode = fileContents[activeFileId] || "";

  const handleFileSelect = useCallback((file: FileNode) => {
    if (file.type === "file") {
      setActiveFileId(file.id);
    }
  }, []);

  const handleCodeChange = useCallback(
    (code: string) => {
      setFileContents((prev) => ({ ...prev, [activeFileId]: code }));
    },
    [activeFileId]
  );

  const handleSave = useCallback(() => {
    saveState(fileContents[activeFileId] || "", language);
  }, [activeFileId, fileContents, language]);

  const handleExport = useCallback(() => {
    const code = fileContents[activeFileId] || "";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playground-${activeFileId}.js`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeFileId, fileContents]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        setFileContents((prev) => ({ ...prev, [activeFileId]: content }));
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [activeFileId]
  );

  const handleClear = useCallback(() => {
    setFileContents((prev) => ({ ...prev, [activeFileId]: "" }));
  }, [activeFileId]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 border-b border-border bg-card px-4 py-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          <Code2 className="size-4" />
          <span>Playground</span>
        </button>

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="icon-sm" />}
              onClick={handleSave}
            >
              <Save className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Save (Ctrl+S)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="icon-sm" />}
              onClick={handleExport}
            >
              <Download className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Export File</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="icon-sm" />}
              onClick={handleImport}
            >
              <Upload className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Import File</TooltipContent>
          </Tooltip>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileImport}
            accept=".js,.ts,.jsx,.tsx,.json,.css,.html,.md,.txt,.py,.sql"
          />

          <Separator orientation="vertical" className="mx-1 h-5" />

          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="icon-sm" />}
              onClick={handleClear}
            >
              <Trash2 className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Clear Editor</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {sidebarOpen && (
          <div className="w-56 shrink-0 border-r border-border">
            <FileExplorer
              files={DEFAULT_FILE_TREE}
              activeFileId={activeFileId}
              onFileSelect={handleFileSelect}
              className="h-full"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <IDEPanel
            initialCode={activeCode}
            defaultLanguage={language}
            onCodeChange={handleCodeChange}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}