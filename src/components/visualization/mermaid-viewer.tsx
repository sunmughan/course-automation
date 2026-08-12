"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, RotateCcw, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { DiagramConfig } from "@/types";

interface MermaidViewerProps {
  diagram: DiagramConfig;
  className?: string;
}

export function MermaidViewer({ diagram, className }: MermaidViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function renderMermaid() {
      try {
        setLoading(true);
        const mermaid = (await import("mermaid")).default;

        mermaid.initialize({
          startOnLoad: false,
          theme: diagram.theme || "default",
          securityLevel: "loose",
          flowchart: { useMaxWidth: true, htmlLabels: true },
          sequence: { useMaxWidth: true },
        });

        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, diagram.content);

        if (!cancelled) {
          setSvg(renderedSvg);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError((e as Error).message || "Failed to render diagram");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    renderMermaid();
    return () => { cancelled = true; };
  }, [diagram.content, diagram.theme]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25));
  const handleReset = () => setZoom(1);

  const handleDownload = () => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagram-${diagram.type}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-card", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {diagram.caption || `${diagram.type} Diagram`}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
            {diagram.type}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut} title="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] text-muted-foreground w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn} title="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset} title="Reset zoom">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload} title="Download SVG">
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[200px]">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full"
            />
            Rendering diagram...
          </div>
        )}

        {error && (
          <div className="text-center">
            <p className="text-sm text-red-500 mb-2">Failed to render diagram</p>
            <p className="text-xs text-muted-foreground font-mono">{error}</p>
          </div>
        )}

        {!loading && !error && svg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
            className="max-w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
      </div>
    </div>
  );
}