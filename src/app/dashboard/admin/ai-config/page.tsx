"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import {
  BrainIcon,
  SparklesIcon,
  KeyIcon,
  CpuIcon,
  CheckCircle2Icon,
  SlidersHorizontalIcon,
  ZapIcon,
  SaveIcon,
  RefreshCwIcon,
  SearchIcon,
  ImageIcon,
  ShieldAlertIcon,
  GraduationCapIcon,
  GaugeIcon,
  LayersIcon,
  Code2Icon,
  WrenchIcon,
  HelpCircleIcon,
  Trash2Icon,
  EyeIcon,
  ActivityIcon,
} from "lucide-react";
import type { ZylooModelMetadata } from "@/lib/ai/providers/zyloo";

interface ProviderItem {
  id: string;
  name: string;
  slug: string;
  baseUrl: string;
  description: string;
  isConfigured: boolean;
  maskedKey: string;
  totalModels: number;
  status: any;
}

interface DefaultSettings {
  defaultChatProvider: string;
  defaultChatModel: string;
  defaultCodeModel: string;
  defaultDebugModel: string;
  defaultArchitectureModel: string;
  defaultImageModel: string;
  defaultReasoningModel: string;
  defaultExerciseModel: string;
}

interface TutorModeItem {
  mode: string;
  label: string;
  defaultTemp: number;
  maxTokens: number;
  description: string;
}

export default function AIConfigurationPage() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [zylooModels, setZylooModels] = useState<ZylooModelMetadata[]>([]);
  const [tutorModes, setTutorModes] = useState<TutorModeItem[]>([]);
  const [defaults, setDefaults] = useState<DefaultSettings>({
    defaultChatProvider: "zyloo",
    defaultChatModel: "zyloo/gemini-3.5-flash",
    defaultCodeModel: "zyloo/deepseek-v4-pro",
    defaultDebugModel: "zyloo/claude-sonnet-4-6",
    defaultArchitectureModel: "zyloo/claude-opus-5",
    defaultImageModel: "zyloo/gpt-image-2",
    defaultReasoningModel: "zyloo/claude-fable-5",
    defaultExerciseModel: "zyloo/gemini-3.5-flash",
  });

  // Feature Toggles State
  const [optimization, setOptimization] = useState({
    semanticCacheEnabled: true,
    cacheTtlSeconds: 3600,
    deduplicationEnabled: true,
    localFallbackEnabled: true,
    cacheStats: { size: 0, hits: 0, misses: 0, hitRate: 0 },
  });

  const [adaptive, setAdaptive] = useState({
    exerciseModel: "zyloo/gemini-3.5-flash",
    difficultyAutoScaling: true,
    errorDrillTargeting: true,
    sm2InitialIntervalDays: 1,
    sm2EaseFactorDefault: 2.5,
  });

  const [imageStudio, setImageStudio] = useState({
    defaultResolution: "1024x1024",
    defaultQuality: "standard",
    enhancedStyleInjection: true,
    svgFallbackEnabled: true,
  });

  // State for editing keys
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { success: boolean; latency: number; message: string }>>({});
  const [testingPing, setTestingPing] = useState<string | null>(null);

  // State for filtering models catalog
  const [selectedProviderFilter, setSelectedProviderFilter] = useState<string>("All");
  const [modelSearchQuery, setModelSearchQuery] = useState<string>("");
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  async function fetchConfig() {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const res = await fetch("/api/admin/ai-config", { headers });
      if (!res.ok) throw new Error("Failed to load AI configuration");
      const data = await res.json();
      setProviders(data.providers || []);
      setZylooModels(data.zylooModels || []);
      setTutorModes(data.tutorModes || []);
      if (data.defaults) setDefaults(data.defaults);
      if (data.optimizationSettings) setOptimization((prev) => ({ ...prev, ...data.optimizationSettings }));
      if (data.adaptiveSettings) setAdaptive((prev) => ({ ...prev, ...data.adaptiveSettings }));
      if (data.imageStudioSettings) setImageStudio((prev) => ({ ...prev, ...data.imageStudioSettings }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveKey = async (providerId: string) => {
    const key = keyInputs[providerId];
    if (!key) return;

    try {
      setSavingKey(providerId);
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "save_api_key",
          provider: providerId,
          apiKey: key,
        }),
      });
      if (!res.ok) throw new Error("Failed to save API key");
      setKeyInputs((prev) => ({ ...prev, [providerId]: "" }));
      await fetchConfig();
      setSaveSuccessMsg(`API key for ${providerId.toUpperCase()} saved successfully!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to save key");
    } finally {
      setSavingKey(null);
    }
  };

  const handleTestConnection = async (providerId: string) => {
    try {
      setTestingPing(providerId);
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "test_connection",
          provider: providerId,
        }),
      });
      const data = await res.json();
      setPingResults((prev) => ({
        ...prev,
        [providerId]: {
          success: data.success,
          latency: data.latency,
          message: data.message || (data.success ? "Online" : data.error || "Failed"),
        },
      }));
    } catch (err: any) {
      setPingResults((prev) => ({
        ...prev,
        [providerId]: {
          success: false,
          latency: 0,
          message: err.message || "Failed",
        },
      }));
    } finally {
      setTestingPing(null);
    }
  };

  const handleSaveDefaults = async () => {
    try {
      setSavingDefaults(true);
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "save_defaults",
          defaults,
        }),
      });
      if (!res.ok) throw new Error("Failed to save default routing");
      setSaveSuccessMsg("AI routing rules across all task domains saved successfully!");
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (err: any) {
      alert(err.message || "Failed to save defaults");
    } finally {
      setSavingDefaults(false);
    }
  };

  const handleClearCache = async () => {
    try {
      const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };
      await fetch("/api/admin/ai-config", {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "clear_cache" }),
      });
      setSaveSuccessMsg("Semantic AI cache purged.");
      await fetchConfig();
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch {
      alert("Failed to clear cache");
    }
  };

  // Filtered models catalog
  const filteredModels = useMemo(() => {
    return zylooModels.filter((m) => {
      const matchProvider = selectedProviderFilter === "All" || m.providerGroup === selectedProviderFilter;
      const matchSearch =
        !modelSearchQuery ||
        m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
        m.providerGroup.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
        m.capabilities.some((c) => c.toLowerCase().includes(modelSearchQuery.toLowerCase()));
      return matchProvider && matchSearch;
    });
  }, [zylooModels, selectedProviderFilter, modelSearchQuery]);

  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = { All: zylooModels.length };
    for (const m of zylooModels) {
      counts[m.providerGroup] = (counts[m.providerGroup] || 0) + 1;
    }
    return counts;
  }, [zylooModels]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <BrainIcon className="size-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">AI Master Configuration &amp; Control Center</h1>
              <p className="text-sm text-slate-400">
                Configure all AI providers, API keys, task-based model routing, tutor modes, adaptive learning, and 95+ models
              </p>
            </div>
          </div>
        </div>
        <Button onClick={fetchConfig} variant="outline" size="sm" className="gap-2 self-start md:self-auto">
          <RefreshCwIcon className="size-4" />
          Refresh Status
        </Button>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2Icon className="size-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-950 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Providers</span>
              <CpuIcon className="size-4 text-sky-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {providers.filter((p) => p.isConfigured).length}
              </span>
              <span className="text-xs text-slate-400">/ {providers.length} registered</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model Swarm</span>
              <SparklesIcon className="size-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{zylooModels.length + 16}</span>
              <span className="text-xs text-emerald-400 font-medium">11 Providers</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tutor Modes</span>
              <GraduationCapIcon className="size-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{tutorModes.length}</span>
              <span className="text-xs text-amber-400 font-medium">Fully Tunable</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 border-slate-800">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visual Studio</span>
              <ImageIcon className="size-4 text-purple-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">4K &amp; Vector</span>
              <span className="text-xs text-purple-400 font-medium">Ready</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Multi-Domain Tabs */}
      <Tabs defaultValue="routing" className="space-y-4">
        <TabsList className="bg-slate-900 border border-slate-800 p-1 flex-wrap h-auto gap-1">
          <TabsTrigger value="routing" className="text-xs gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <SlidersHorizontalIcon className="size-3.5" />
            Task-Based Model Routing
          </TabsTrigger>
          <TabsTrigger value="providers" className="text-xs gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <KeyIcon className="size-3.5" />
            Providers &amp; API Keys
          </TabsTrigger>
          <TabsTrigger value="tutor" className="text-xs gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <GraduationCapIcon className="size-3.5" />
            13 AI Tutor Modes
          </TabsTrigger>
          <TabsTrigger value="adaptive" className="text-xs gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <BrainIcon className="size-3.5" />
            Adaptive &amp; Exercises
          </TabsTrigger>
          <TabsTrigger value="optimization" className="text-xs gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <GaugeIcon className="size-3.5" />
            Cache &amp; Token Optimization
          </TabsTrigger>
          <TabsTrigger value="catalog" className="text-xs gap-1.5 data-[state=active]:bg-sky-600 data-[state=active]:text-white">
            <LayersIcon className="size-3.5" />
            95+ Models Catalog
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Task-Based Model Routing ─────────────────────────────── */}
        <TabsContent value="routing" className="space-y-4">
          <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Task-to-Model Specialization Routing</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Route specific engineering tasks to specialized AI models optimized for code generation, architectural design, debugging, reasoning, and visual blueprints.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. General Chat & Tutoring */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs">
                    <ZapIcon className="size-4" />
                    <span>General Chat &amp; Tutoring (`chat`)</span>
                  </div>
                  <Select
                    value={defaults.defaultChatModel}
                    onValueChange={(v) => v && setDefaults((d) => ({ ...d, defaultChatModel: v }))}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="zyloo/gemini-3.5-flash">zyloo/gemini-3.5-flash (Fast 1M Ctx)</SelectItem>
                      <SelectItem value="zyloo/gemini-3.6-flash">zyloo/gemini-3.6-flash (Ultra-Fast 1M)</SelectItem>
                      <SelectItem value="zyloo/claude-sonnet-5">zyloo/claude-sonnet-5 (Flagship)</SelectItem>
                      <SelectItem value="zyloo/gpt-5.5">zyloo/gpt-5.5 (OpenAI)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400">Primary model for student questions, explanations, and concepts.</p>
                </div>

                {/* 2. Code Generation */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <Code2Icon className="size-4" />
                    <span>Code Generation (`code_generation`)</span>
                  </div>
                  <Select
                    value={defaults.defaultCodeModel}
                    onValueChange={(v) => v && setDefaults((d) => ({ ...d, defaultCodeModel: v }))}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="zyloo/deepseek-v4-pro">zyloo/deepseek-v4-pro (High Accuracy)</SelectItem>
                      <SelectItem value="zyloo/claude-sonnet-4-6">zyloo/claude-sonnet-4-6 (Fast Code)</SelectItem>
                      <SelectItem value="zyloo/kimi-k2.7-code">zyloo/kimi-k2.7-code (Dedicated Code)</SelectItem>
                      <SelectItem value="zyloo/gpt-5.5">zyloo/gpt-5.5 (OpenAI)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400">Writing starter files, refactoring, and code generation.</p>
                </div>

                {/* 3. Debugging */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
                    <WrenchIcon className="size-4" />
                    <span>Debugging &amp; Fixes (`debugging`)</span>
                  </div>
                  <Select
                    value={defaults.defaultDebugModel}
                    onValueChange={(v) => v && setDefaults((d) => ({ ...d, defaultDebugModel: v }))}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="zyloo/claude-sonnet-4-6">zyloo/claude-sonnet-4-6</SelectItem>
                      <SelectItem value="zyloo/deepseek-v4-pro">zyloo/deepseek-v4-pro</SelectItem>
                      <SelectItem value="zyloo/claude-opus-4-7">zyloo/claude-opus-4-7</SelectItem>
                      <SelectItem value="zyloo/gpt-5.4">zyloo/gpt-5.4</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400">Error diagnosis, stack trace analysis, and bug hunting.</p>
                </div>

                {/* 4. Architecture & System Design */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                    <LayersIcon className="size-4" />
                    <span>Architecture &amp; Design (`architecture`)</span>
                  </div>
                  <Select
                    value={defaults.defaultArchitectureModel}
                    onValueChange={(v) => v && setDefaults((d) => ({ ...d, defaultArchitectureModel: v }))}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="zyloo/claude-opus-5">zyloo/claude-opus-5 (Frontier)</SelectItem>
                      <SelectItem value="zyloo/claude-fable-5">zyloo/claude-fable-5 (Deep-Dive)</SelectItem>
                      <SelectItem value="zyloo/gpt-5.6-sol">zyloo/gpt-5.6-sol</SelectItem>
                      <SelectItem value="zyloo/qwen3.8-max">zyloo/qwen3.8-max</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400">Distributed systems, microservices, and database topology.</p>
                </div>

                {/* 5. Image & Visual Blueprints */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs">
                    <ImageIcon className="size-4" />
                    <span>Visual Blueprints (`visualization`)</span>
                  </div>
                  <Select
                    value={defaults.defaultImageModel}
                    onValueChange={(v) => v && setDefaults((d) => ({ ...d, defaultImageModel: v }))}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="zyloo/gpt-image-2">zyloo/gpt-image-2 (OpenAI)</SelectItem>
                      <SelectItem value="zyloo/gemini-3-pro-image-preview-4k">zyloo/gemini-3-pro 4K (Google)</SelectItem>
                      <SelectItem value="zyloo/nano-banana-2-4k">zyloo/nano-banana-2 4K (Google)</SelectItem>
                      <SelectItem value="zyloo/grok-imagine-image-2.0">zyloo/grok-imagine 2.0 (xAI)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400">Renders high-res architecture diagrams and UI mockups.</p>
                </div>

                {/* 6. Chain-of-Thought Reasoning */}
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                    <BrainIcon className="size-4" />
                    <span>Deep Reasoning (`reasoning`)</span>
                  </div>
                  <Select
                    value={defaults.defaultReasoningModel}
                    onValueChange={(v) => v && setDefaults((d) => ({ ...d, defaultReasoningModel: v }))}
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="zyloo/claude-fable-5">zyloo/claude-fable-5 (Anthropic)</SelectItem>
                      <SelectItem value="zyloo/deepseek-r1">zyloo/deepseek-r1 (CoT Reasoner)</SelectItem>
                      <SelectItem value="zyloo/gpt-5.6-sol">zyloo/gpt-5.6-sol (OpenAI)</SelectItem>
                      <SelectItem value="zyloo/kimi-k2-thinking">zyloo/kimi-k2-thinking</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400">Complex mathematical reasoning, interview drills, and proof analysis.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <Button onClick={handleSaveDefaults} disabled={savingDefaults} className="bg-sky-600 hover:bg-sky-500 text-xs gap-2 font-semibold">
                  <SaveIcon className="size-4" />
                  {savingDefaults ? "Saving..." : "Save Routing Rules"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 2: AI Providers & API Keys ──────────────────────────────── */}
        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {providers.map((p) => {
              const ping = pingResults[p.id];
              return (
                <Card key={p.id} className="bg-slate-950 border-slate-800 text-white flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-bold">{p.name}</CardTitle>
                          {p.isConfigured ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                              <CheckCircle2Icon className="size-3" /> Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] gap-1">
                              <ShieldAlertIcon className="size-3" /> Key Missing
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-slate-400 text-xs mt-1">
                          {p.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    <div className="text-xs text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Base URL:</span>
                        <span className="font-mono text-slate-300">{p.baseUrl}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Key:</span>
                        <span className="font-mono text-slate-300">{p.maskedKey || "Not set in environment"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Model Swarm:</span>
                        <span className="font-semibold text-sky-400">{p.totalModels} models</span>
                      </div>
                    </div>

                    {/* Key Input Field */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <label className="text-[11px] font-semibold text-slate-400 block">
                        Update {p.name} API Key:
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          placeholder={`Enter ${p.name} API key...`}
                          value={keyInputs[p.id] || ""}
                          onChange={(e) => setKeyInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          className="bg-slate-900 border-slate-800 text-xs font-mono text-white"
                        />
                        <Button
                          size="sm"
                          disabled={savingKey === p.id || !keyInputs[p.id]}
                          onClick={() => handleSaveKey(p.id)}
                          className="bg-slate-800 hover:bg-slate-700 text-xs shrink-0"
                        >
                          {savingKey === p.id ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>

                    {/* Test Connection Ping */}
                    <div className="pt-2 flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={testingPing === p.id}
                        onClick={() => handleTestConnection(p.id)}
                        className="text-xs text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 h-7 px-2 gap-1.5"
                      >
                        <ActivityIcon className="size-3.5" />
                        {testingPing === p.id ? "Testing..." : "Test Connection"}
                      </Button>

                      {ping && (
                        <span className={`text-[11px] font-mono ${ping.success ? "text-emerald-400" : "text-rose-400"}`}>
                          {ping.success ? `✅ ${ping.latency}ms (${ping.message})` : `❌ ${ping.message}`}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── TAB 3: 13 AI Tutor Modes ───────────────────────────────────── */}
        <TabsContent value="tutor" className="space-y-4">
          <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">13 Specialized AI Tutor Modes</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Each mode adapts temperature, token budgets, and instructional scaffolding to deliver high-quality pedagogical outcomes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {tutorModes.map((tm) => (
                  <div key={tm.mode} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-sky-300">{tm.label}</span>
                      <Badge variant="outline" className="text-[10px] font-mono text-slate-400 border-slate-700">
                        {tm.mode}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400">{tm.description}</p>
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Temp: {tm.defaultTemp}</span>
                      <span>Max Tokens: {tm.maxTokens}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 4: Adaptive Learning & Exercises ────────────────────────── */}
        <TabsContent value="adaptive" className="space-y-4">
          <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Adaptive Learning &amp; Spaced Repetition (SM-2)</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Configure dynamic drill generation, mistake pattern targeting, and spaced review intervals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Error-Targeted Drill Generation</span>
                    <span className="text-[11px] text-slate-400">Generates practice exercises tailored to student mistake patterns.</span>
                  </div>
                  <Switch
                    checked={adaptive.errorDrillTargeting}
                    onCheckedChange={(v) => setAdaptive((a) => ({ ...a, errorDrillTargeting: v }))}
                  />
                </div>

                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Difficulty Auto-Scaling</span>
                    <span className="text-[11px] text-slate-400">Dynamically scales exercise difficulty (1-5) based on mastery score.</span>
                  </div>
                  <Switch
                    checked={adaptive.difficultyAutoScaling}
                    onCheckedChange={(v) => setAdaptive((a) => ({ ...a, difficultyAutoScaling: v }))}
                  />
                </div>

                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-white block">SM-2 Initial Review Interval</span>
                  <span className="text-[11px] text-slate-400 block">First repetition delay in days (Default: 1 day).</span>
                  <Input
                    type="number"
                    value={adaptive.sm2InitialIntervalDays}
                    onChange={(e) => setAdaptive((a) => ({ ...a, sm2InitialIntervalDays: Number(e.target.value) || 1 }))}
                    className="bg-slate-950 border-slate-800 text-xs w-32 font-mono"
                  />
                </div>

                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-white block">SM-2 Ease Factor Baseline</span>
                  <span className="text-[11px] text-slate-400 block">Baseline retention multiplier (Default: 2.5).</span>
                  <Input
                    type="number"
                    step="0.1"
                    value={adaptive.sm2EaseFactorDefault}
                    onChange={(e) => setAdaptive((a) => ({ ...a, sm2EaseFactorDefault: Number(e.target.value) || 2.5 }))}
                    className="bg-slate-950 border-slate-800 text-xs w-32 font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 5: Cache & Token Optimization ──────────────────────────── */}
        <TabsContent value="optimization" className="space-y-4">
          <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Semantic Cache &amp; Gateway Optimization</CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Reduce latency and token costs with semantic embedding caching, deduplication, and offline fallback.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Semantic Cache</span>
                    <Switch
                      checked={optimization.semanticCacheEnabled}
                      onCheckedChange={(v) => setOptimization((o) => ({ ...o, semanticCacheEnabled: v }))}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Caches identical and semantically similar queries to return sub-5ms responses.</p>
                  <div className="pt-2 flex items-center justify-between text-[10px] text-emerald-400 font-mono">
                    <span>Cache Items: {optimization.cacheStats.size}</span>
                    <Button variant="ghost" size="sm" onClick={handleClearCache} className="h-6 text-[10px] text-rose-400 hover:text-rose-300">
                      Clear Cache
                    </Button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Request Deduplication</span>
                    <Switch
                      checked={optimization.deduplicationEnabled}
                      onCheckedChange={(v) => setOptimization((o) => ({ ...o, deduplicationEnabled: v }))}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Coalesces concurrent identical student requests into a single upstream provider call.</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Offline Local Fallback</span>
                    <Switch
                      checked={optimization.localFallbackEnabled}
                      onCheckedChange={(v) => setOptimization((o) => ({ ...o, localFallbackEnabled: v }))}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">Falls back to deterministic local knowledge base when external providers fail.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 6: 95+ Models Catalog ──────────────────────────────────── */}
        <TabsContent value="catalog" className="space-y-4">
          <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold">Zyloo.ai Unified Model Catalog</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">
                    95+ models across 11 major AI providers with instant OpenAI-compatible wire access.
                  </CardDescription>
                </div>
                <div className="relative w-full md:w-64">
                  <SearchIcon className="size-4 absolute left-2.5 top-2.5 text-slate-500" />
                  <Input
                    placeholder="Search models or capability..."
                    value={modelSearchQuery}
                    onChange={(e) => setModelSearchQuery(e.target.value)}
                    className="pl-8 bg-slate-900 border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              {/* Provider filter buttons */}
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800">
                {Object.keys(providerCounts).map((prov) => {
                  const isSelected = selectedProviderFilter === prov;
                  return (
                    <button
                      key={prov}
                      onClick={() => setSelectedProviderFilter(prov)}
                      className={`px-2.5 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-sky-600 text-white font-semibold shadow-xs"
                          : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {prov} ({providerCounts[prov]})
                    </button>
                  );
                })}
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-1">
                {filteredModels.map((m) => (
                  <div
                    key={m.name}
                    className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-xs font-bold text-white truncate" title={m.name}>
                          {m.name.replace("zyloo/", "")}
                        </span>
                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-sky-400 border-sky-500/30">
                          {m.providerGroup}
                        </Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {m.isImageModel && (
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 text-[10px]">
                            Image 4K/2K
                          </Badge>
                        )}
                        {m.isThinkingModel && (
                          <Badge variant="secondary" className="bg-amber-500/20 text-amber-300 text-[10px]">
                            Thinking / CoT
                          </Badge>
                        )}
                        {m.capabilities.slice(0, 3).map((c) => (
                          <Badge key={c} variant="outline" className="text-[10px] text-slate-400 border-slate-800">
                            {c}
                          </Badge>
                        ))}
                        {m.capabilities.length > 3 && (
                          <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-800">
                            +{m.capabilities.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Ctx: {m.contextWindow >= 1000000 ? `${(m.contextWindow / 1000000).toFixed(1)}M` : `${Math.round(m.contextWindow / 1000)}K`}</span>
                      <span>${m.costPer1K}/1K</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
