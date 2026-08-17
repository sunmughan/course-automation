"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Code2, Save, Download, Upload, Trash2, Cloud, Check, Loader2, FolderGit2 } from "lucide-react";
import { IDEPanel } from "@/components/editor/ide-panel";
import { FileExplorer, type FileNode } from "@/components/editor/file-explorer";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

const DEFAULT_CODE = `// ============================================================================
// SkillForge Playground: Multi-Language Cloud Execution Engine
// ============================================================================

function calculateDatasetMetrics(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    return { count: 0, sum: 0, average: 0, min: 0, max: 0, median: 0 };
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const average = Number((sum / sorted.length).toFixed(2));
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  return { count: sorted.length, sum, average, min, max, median };
}

console.log("=== SkillForge Backend Runtime Active ===");
const sampleData = [45, 12, 85, 32, 89, 39, 69, 44, 42, 1, 99];
const metrics = calculateDatasetMetrics(sampleData);

console.log("Input Dataset:", JSON.stringify(sampleData));
console.log("Computed Statistical Metrics:");
console.log(JSON.stringify(metrics, null, 2));
console.log("✓ Execution completed with status: SUCCESS");
`;

const INITIAL_FALLBACK_FILES: FileNode[] = [
  {
    id: "src",
    name: "src",
    path: "src",
    type: "folder",
    children: [
      {
        id: "src/main.js",
        name: "main.js",
        path: "src/main.js",
        type: "file",
        language: "javascript",
      },
    ],
  },
  {
    id: "README.md",
    name: "README.md",
    path: "README.md",
    type: "file",
    language: "markdown",
  },
];

const DEFAULT_FILE_CONTENTS: Record<string, string> = {
  "src/main.js": DEFAULT_CODE,
  "README.md": `# SkillForge Multi-Language Playground\n\nClick Run to execute any code file in real time.\n`,
};

function inferLanguageFromPath(path: string): string {
  if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".py")) return "python";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".sql")) return "sql";
  if (path.endsWith(".php")) return "php";
  if (path.endsWith(".yml") || path.endsWith(".yaml")) return "yaml";
  if (path.endsWith("Dockerfile")) return "dockerfile";
  return "javascript";
}

function buildFileTreeFromFiles(files: Array<{ name: string; path: string; language?: string; isFolder?: boolean }>): FileNode[] {
  const root: FileNode[] = [];
  const nodeMap: Record<string, FileNode> = {};

  // Sort: folders first, then by path depth
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const f of sorted) {
    const parts = f.path.split("/").filter(Boolean);
    let currPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const prevPath = currPath;
      currPath = prevPath ? `${prevPath}/${part}` : part;
      const isLeaf = i === parts.length - 1;
      const isFolder = isLeaf ? Boolean(f.isFolder) : true;

      if (!nodeMap[currPath]) {
        const newNode: FileNode = {
          id: currPath,
          name: part,
          path: currPath,
          type: isFolder ? "folder" : "file",
          language: isFolder ? undefined : f.language || inferLanguageFromPath(currPath),
          children: isFolder ? [] : undefined,
        };
        nodeMap[currPath] = newNode;

        if (prevPath && nodeMap[prevPath]?.children) {
          nodeMap[prevPath].children!.push(newNode);
        } else if (!prevPath) {
          root.push(newNode);
        }
      }
    }
  }

  return root;
}

function PlaygroundInner() {
  const searchParams = useSearchParams();
  const projectParam = searchParams.get("project") || searchParams.get("course");

  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("Default Workspace");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFileId, setActiveFileId] = useState("src/main.js");
  const [fileContents, setFileContents] = useState<Record<string, string>>(DEFAULT_FILE_CONTENTS);
  const [fileTree, setFileTree] = useState<FileNode[]>(INITIAL_FALLBACK_FILES);
  const [language, setLanguage] = useState("javascript");
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error">("synced");
  const [, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSavedContent = useRef<Record<string, string>>({});

  // ── Load Project from Backend (Context-Aware) ──────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadBackendProject() {
      try {
        setIsLoading(true);
        const url = projectParam
          ? `/api/projects/playground?project=${encodeURIComponent(projectParam)}`
          : `/api/projects/playground?default=true`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load project");
        const data = await res.json();
        const proj = data.project;

        if (proj && isMounted) {
          setProjectId(proj.id);
          if (proj.name) setProjectName(proj.name);

          const contents: Record<string, string> = {};
          const validFiles: Array<{ name: string; path: string; language?: string; isFolder?: boolean }> = [];

          for (const f of proj.files || []) {
            contents[f.path] = f.content || "";
            validFiles.push({
              name: f.name,
              path: f.path,
              language: f.language,
              isFolder: f.isFolder,
            });
          }

          if (Object.keys(contents).length > 0) {
            setFileContents(contents);
            lastSavedContent.current = { ...contents };
          }

          if (validFiles.length > 0) {
            const tree = buildFileTreeFromFiles(validFiles);
            setFileTree(tree);
          }

          // Choose initial active file
          const session = proj.sessions?.[0];
          let chosenFile = session?.activeFileId;

          if (!chosenFile || contents[chosenFile] === undefined) {
            const firstCodeFile = validFiles.find(
              (f) =>
                !f.isFolder &&
                (f.path.endsWith(".js") ||
                  f.path.endsWith(".ts") ||
                  f.path.endsWith(".py") ||
                  f.path.endsWith(".html") ||
                  f.path.endsWith(".php"))
            ) || validFiles[0];

            chosenFile = firstCodeFile ? firstCodeFile.path : "src/main.js";
          }

          setActiveFileId(chosenFile);
          setLanguage(inferLanguageFromPath(chosenFile));
        }
      } catch (err) {
        console.warn("[Playground] Using local offline workspace:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadBackendProject();
    return () => {
      isMounted = false;
    };
  }, [projectParam]);

  // ── Auto-save File Changes to Backend ──────────────────────────────────────
  const saveActiveFileToBackend = useCallback(async (path: string, content: string) => {
    if (!projectId || lastSavedContent.current[path] === content) return;

    try {
      setSyncStatus("saving");
      const res = await fetch(`/api/projects/playground/${projectId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content, language }),
      });

      if (!res.ok) throw new Error("Failed to save file");
      lastSavedContent.current[path] = content;
      setSyncStatus("synced");
    } catch (err) {
      console.error("[Playground] Save error:", err);
      setSyncStatus("error");
    }
  }, [projectId, language]);

  // Debounced auto-save (1.5s after typing)
  useEffect(() => {
    const currentCode = fileContents[activeFileId];
    if (currentCode === undefined || !projectId) return;

    const timer = setTimeout(() => {
      saveActiveFileToBackend(activeFileId, currentCode);
    }, 1500);

    return () => clearTimeout(timer);
  }, [fileContents, activeFileId, projectId, saveActiveFileToBackend]);

  // ── Keyboard Shortcuts (Ctrl+S) ───────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveActiveFileToBackend(activeFileId, fileContents[activeFileId] || "");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [activeFileId, fileContents, saveActiveFileToBackend]);

  const activeCode = fileContents[activeFileId] || "";

  const handleFileSelect = useCallback((file: FileNode) => {
    if (file.type === "file") {
      setActiveFileId(file.path);
      const inferred = file.language || inferLanguageFromPath(file.path);
      setLanguage(inferred);

      // Persist active session tab
      if (projectId) {
        fetch(`/api/projects/playground/${projectId}/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activeFileId: file.path }),
        }).catch(() => {});
      }
    }
  }, [projectId]);

  const handleCodeChange = useCallback((code: string) => {
    setFileContents((prev) => ({ ...prev, [activeFileId]: code }));
  }, [activeFileId]);

  const handleManualSave = useCallback(() => {
    saveActiveFileToBackend(activeFileId, fileContents[activeFileId] || "");
  }, [activeFileId, fileContents, saveActiveFileToBackend]);

  const handleExport = useCallback(() => {
    const code = fileContents[activeFileId] || "";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFileId.replace(/\//g, "-");
    a.click();
    URL.revokeObjectURL(url);
  }, [activeFileId, fileContents]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      setFileContents((prev) => ({ ...prev, [activeFileId]: content }));
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [activeFileId]);

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
          <FolderGit2 className="size-4 text-primary" />
          <span className="font-semibold text-white">{projectName}</span>
        </button>

        {/* Sync Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-muted/60 text-muted-foreground border border-border/50">
          <Cloud className="size-3" />
          {syncStatus === "saving" ? (
            <span className="flex items-center gap-1">
              <Loader2 className="size-2.5 animate-spin" /> Saving...
            </span>
          ) : syncStatus === "synced" ? (
            <span className="flex items-center gap-1 text-emerald-500 font-medium">
              <Check className="size-2.5" /> Saved
            </span>
          ) : (
            <span className="text-amber-500">Offline</span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger
              render={<Button variant="ghost" size="icon-sm" />}
              onClick={handleManualSave}
            >
              <Save className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Save to Cloud (Ctrl+S)</TooltipContent>
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
            accept=".js,.ts,.jsx,.tsx,.json,.css,.html,.md,.txt,.py,.sql,.php,.yaml,.yml"
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
          <div className="w-60 shrink-0 border-r border-border">
            <FileExplorer
              files={fileTree}
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

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center text-muted-foreground"><Loader2 className="size-6 animate-spin mr-2" /> Loading workspace...</div>}>
      <PlaygroundInner />
    </Suspense>
  );
}