"use client";

import { useRef, useCallback } from "react";
import Editor, { type OnMount, type BeforeMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string | undefined) => void;
  language?: string;
  readOnly?: boolean;
  height?: string | number;
  className?: string;
  onMount?: (editor: editor.IStandaloneCodeEditor) => void;
}

const LANGUAGE_MAP: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  jsx: "javascript",
  tsx: "typescript",
  py: "python",
  html: "html",
  css: "css",
  json: "json",
  md: "markdown",
  sql: "sql",
};

function resolveLanguage(lang: string): string {
  return LANGUAGE_MAP[lang] || lang;
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-2 p-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function MonacoEditor({
  value,
  onChange,
  language = "javascript",
  readOnly = false,
  height = "100%",
  className,
  onMount,
}: MonacoEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    monacoRef.current = monaco;

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });
  }, []);

  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;
      onMount?.(editor);
    },
    [onMount]
  );

  const resolvedLanguage = resolveLanguage(language);

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <Editor
        height={height}
        language={resolvedLanguage}
        value={value}
        onChange={onChange}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        loading={<LoadingSkeleton />}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: true, scale: 1, showSlider: "mouseover" },
          lineNumbers: "on",
          renderLineHighlight: "all",
          scrollBeyondLastLine: false,
          bracketPairColorization: { enabled: true },
          matchBrackets: "always",
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          formatOnPaste: true,
          formatOnType: true,
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
          tabSize: 2,
          insertSpaces: true,
          fontFamily: "var(--font-geist-mono, 'Cascadia Code', 'Fira Code', monospace)",
          fontSize: 14,
          lineHeight: 1.6,
          padding: { top: 12, bottom: 12 },
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          automaticLayout: true,
          wordWrap: "on",
          folding: true,
          foldingStrategy: "indentation",
          glyphMargin: true,
          guides: {
            indentation: true,
            bracketPairs: true,
          },
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
          contextmenu: true,
          quickSuggestions: true,
          parameterHints: { enabled: true },
          hover: { enabled: "on" as any, delay: 300 },
          links: true,
          colorDecorators: true,
          lightbulb: { enabled: "on" as any },
        }}
      />
    </div>
  );
}

export { resolveLanguage };