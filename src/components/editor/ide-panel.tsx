"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { MonacoEditor } from "@/components/editor/monaco-editor";
import { CodeToolbar } from "@/components/editor/code-toolbar";
import { CodeOutput } from "@/components/editor/code-output";
import { useExecution } from "@/hooks/use-execution";
import { cn } from "@/lib/utils";

interface IDEPanelProps {
  initialCode?: string;
  defaultLanguage?: string;
  onCodeChange?: (code: string) => void;
  onRunComplete?: (output: string, error: string | null) => void;
  className?: string;
  hideToolbar?: boolean;
  hideOutput?: boolean;
  readOnly?: boolean;
}

export function IDEPanel({
  initialCode = "",
  defaultLanguage = "javascript",
  onCodeChange,
  onRunComplete,
  className,
  hideToolbar = false,
  hideOutput = false,
  readOnly = false,
}: IDEPanelProps) {
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState(defaultLanguage);
  const [fontSize, setFontSize] = useState(14);
  const [editorRatio, setEditorRatio] = useState(60);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const originalCodeRef = useRef(initialCode);

  const { output, error, events, loading, executionTime, executeCode, clearOutput } =
    useExecution();

  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const newCode = value || "";
      setCode(newCode);
      onCodeChange?.(newCode);
    },
    [onCodeChange]
  );

  const handleRun = useCallback(async () => {
    const result = await executeCode(code, language, language === "javascript");
    if (result) {
      onRunComplete?.(result.output, result.error);
    }
  }, [code, language, executeCode, onRunComplete]);

  const handleReset = useCallback(() => {
    setCode(originalCodeRef.current);
    clearOutput();
  }, [clearOutput]);

  const handleFormat = useCallback(() => {
    try {
      const formatted = JSON.stringify({ _: code }, null, 2);
      const lines = formatted.split("\n");
      lines.shift();
      lines.pop();
      const trimmed = lines.map((l) => l.slice(2)).join("\n");
      setCode(trimmed);
    } catch {
      /**/
    }
  }, [code]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const ratio = (y / rect.height) * 100;
      setEditorRatio(Math.min(Math.max(ratio, 20), 85));
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      {!hideToolbar && (
        <CodeToolbar
          onRun={handleRun}
          onReset={handleReset}
          onFormat={handleFormat}
          language={language}
          onLanguageChange={setLanguage}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          running={loading}
        />
      )}

      <div ref={containerRef} className="flex flex-1 flex-col min-h-0">
        <div style={{ height: hideOutput ? "100%" : `${editorRatio}%` }} className="min-h-0">
          <MonacoEditor
            value={code}
            onChange={handleCodeChange}
            language={language}
            readOnly={readOnly}
          />
        </div>

        {!hideOutput && (
          <>
            <div
              className={cn(
                "relative flex shrink-0 cursor-row-resize items-center justify-center bg-border/50 transition-colors hover:bg-border",
                isDragging && "bg-primary/50",
                "h-1.5"
              )}
              onMouseDown={() => setIsDragging(true)}
            >
              <div className="h-0.5 w-8 rounded-full bg-muted-foreground/30" />
            </div>
            <div style={{ height: `${100 - editorRatio}%` }} className="min-h-0">
              <CodeOutput
                output={output}
                error={error}
                events={events}
                loading={loading}
                executionTime={executionTime}
                language={language}
                className="h-full"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}