"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Loader2,
  Download,
  Copy,
  Check,
  ImageIcon,
  Layout,
  Network,
  Cpu,
  Boxes,
  Zap,
} from "lucide-react";
import type { ImageVisualType } from "@/lib/ai/images";

const VISUAL_PRESETS: { type: ImageVisualType; label: string; icon: any; samplePrompt: string }[] = [
  {
    type: "architecture",
    label: "Cloud Architecture",
    icon: Network,
    samplePrompt: "Microservices architecture with Next.js, FastAPI, Kafka event bus, and PostgreSQL cluster in AWS",
  },
  {
    type: "ui-mockup",
    label: "UI / Dashboard Mockup",
    icon: Layout,
    samplePrompt: "Modern dark-mode analytics dashboard with real-time charts, telemetry metric cards, and sleek glassmorphism",
  },
  {
    type: "flowchart",
    label: "System Flowchart",
    icon: Boxes,
    samplePrompt: "User authentication lifecycle: JWT token rotation, refresh token cookie validation, and RBAC guard",
  },
  {
    type: "concept-illustration",
    label: "Concept Illustration",
    icon: Sparkles,
    samplePrompt: "Transformer Attention mechanism Q, K, V matrix projection and self-attention heatmap visualization",
  },
  {
    type: "code-visualization",
    label: "Memory & Data Structure",
    icon: Cpu,
    samplePrompt: "Binary search tree node balancing, stack and heap memory pointer allocation",
  },
];

const ZYLOO_POPULAR_IMAGE_MODELS = [
  { id: "zyloo/gpt-image-2", name: "GPT Image 2 (OpenAI)", provider: "OpenAI" },
  { id: "zyloo/gemini-3-pro-image-preview-4k", name: "Gemini 3 Pro 4K (Google)", provider: "Google" },
  { id: "zyloo/nano-banana-2-4k", name: "Nano Banana 2 4K (Google)", provider: "Google" },
  { id: "zyloo/grok-imagine-image-2.0", name: "Grok Imagine 2.0 (xAI)", provider: "xAI" },
  { id: "zyloo/gpt-4o-image", name: "GPT-4o Vision Image (OpenAI)", provider: "OpenAI" },
  { id: "zyloo/gemini-2.5-flash-image", name: "Gemini 2.5 Flash Image (Google)", provider: "Google" },
];

interface ImageGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertToChat?: (markdownImage: string) => void;
  defaultPrompt?: string;
}

export function ImageGeneratorModal({
  open,
  onOpenChange,
  onInsertToChat,
  defaultPrompt = "",
}: ImageGeneratorModalProps) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [visualType, setVisualType] = useState<ImageVisualType>("architecture");
  const [model, setModel] = useState<string>("zyloo/gpt-image-2");
  const [size, setSize] = useState<string>("1024x1024");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    url?: string;
    b64_json?: string;
    svgFallback?: string;
    prompt: string;
    model: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      setIsGenerating(true);
      const res = await fetch("/api/ai/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          visualType,
          model,
          size,
        }),
      });

      if (!res.ok) throw new Error("Image generation failed");
      const data = await res.json();
      setGeneratedResult(data.image);
    } catch (err) {
      console.error("Generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!generatedResult) return;
    const imgRef = generatedResult.url || `data:image/svg+xml;utf8,${encodeURIComponent(generatedResult.svgFallback || "")}`;
    const md = `![${prompt}](${imgRef})`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!generatedResult || !onInsertToChat) return;
    const imgRef = generatedResult.url || generatedResult.svgFallback || "";
    onInsertToChat(`\n\n![${prompt}](${imgRef})\n\n`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-slate-950 border border-slate-800 text-white p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Zap className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold">Zyloo AI Visual Studio</DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                Generate diagrams, architecture blueprints, and UI visuals powered by Zyloo.ai (95+ models across 11 providers)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Visual Blueprint Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VISUAL_PRESETS.map((p) => {
                const Icon = p.icon;
                const isSelected = visualType === p.type;
                return (
                  <button
                    key={p.type}
                    type="button"
                    onClick={() => {
                      setVisualType(p.type);
                      if (!prompt || VISUAL_PRESETS.some((v) => v.samplePrompt === prompt)) {
                        setPrompt(p.samplePrompt);
                      }
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all ${
                      isSelected
                        ? "bg-sky-500/15 border-sky-500/60 text-sky-300 font-medium"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-sky-400" />
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model & Dimensions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                AI Model (Zyloo Gateway)
              </label>
              <Select value={model} onValueChange={(v) => v && setModel(v)}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs">
                  <SelectValue placeholder="Select image model" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  {ZYLOO_POPULAR_IMAGE_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                Resolution & Dimensions
              </label>
              <Select value={size} onValueChange={(v) => v && setSize(v)}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="1024x1024" className="text-xs">1024x1024 (1:1 Square)</SelectItem>
                  <SelectItem value="1792x1024" className="text-xs">1792x1024 (16:9 Landscape / Architecture)</SelectItem>
                  <SelectItem value="1024x1792" className="text-xs">1024x1792 (9:16 Portrait / Mobile)</SelectItem>
                  <SelectItem value="512x512" className="text-xs">512x512 (Fast Preview)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prompt */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">
              Visual Prompt & Concept Description
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the architectural nodes, UI layout, or technical concept to visualize..."
              rows={3}
              className="bg-slate-900 border-slate-800 text-white text-sm focus:border-sky-500 resize-none"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full bg-sky-600 hover:bg-sky-500 font-semibold text-sm py-2.5 gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Rendering Visual with {model.replace("zyloo/", "")}...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Visual Blueprint
              </>
            )}
          </Button>

          {/* Result Preview Box */}
          {generatedResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] text-emerald-400 border-emerald-500/30">
                    Generated via {generatedResult.model}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCopyMarkdown} className="h-8 text-xs gap-1.5">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy Markdown"}
                  </Button>
                  {onInsertToChat && (
                    <Button size="sm" onClick={handleInsert} className="h-8 text-xs bg-sky-600 hover:bg-sky-500">
                      Insert to Chat
                    </Button>
                  )}
                </div>
              </div>

              {/* Render Image or SVG Fallback */}
              <div className="w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-2 min-h-[300px]">
                {generatedResult.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={generatedResult.url} alt={prompt} className="max-h-[400px] w-auto object-contain rounded" />
                ) : generatedResult.svgFallback ? (
                  <div
                    className="w-full max-h-[400px] overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: generatedResult.svgFallback }}
                  />
                ) : (
                  <div className="text-slate-500 text-sm">Visual preview unavailable</div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
