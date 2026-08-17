"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeProps,
  MarkerType,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight,
  Globe, Server, Database, Route, Cpu, Cloud, Terminal, Shield, Code2,
  Monitor, Smartphone, HardDrive, Wifi, Lock, Layers, Workflow, ArrowRight,
  Sparkles, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const NODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Browser: Globe, Router: Route, Controller: Cpu, Service: Server,
  Database: Database, Cloud, Terminal, Security: Shield, API: Code2,
  Desktop: Monitor, Mobile: Smartphone, Storage: HardDrive, Network: Wifi,
  Auth: Lock, Cache: Layers, Pipeline: Workflow, Worker: Zap,
  Queue: Layers, Gateway: Route, CDN: Cloud, DNS: Globe,
  Firewall: Shield, "Load Balancer": Workflow, "Web Server": Server,
  "App Server": Cpu, "Message Queue": Layers,
};

const NODE_COLORS: Record<string, string> = {
  Browser: "border-blue-500/50 bg-blue-500/10",
  Router: "border-amber-500/50 bg-amber-500/10",
  Controller: "border-purple-500/50 bg-purple-500/10",
  Service: "border-green-500/50 bg-green-500/10",
  Database: "border-red-500/50 bg-red-500/10",
  Cloud: "border-sky-500/50 bg-sky-500/10",
  Terminal: "border-gray-500/50 bg-gray-500/10",
  Security: "border-rose-500/50 bg-rose-500/10",
  API: "border-indigo-500/50 bg-indigo-500/10",
  Desktop: "border-cyan-500/50 bg-cyan-500/10",
  Mobile: "border-violet-500/50 bg-violet-500/10",
  Storage: "border-orange-500/50 bg-orange-500/10",
  Network: "border-teal-500/50 bg-teal-500/10",
  Auth: "border-yellow-500/50 bg-yellow-500/10",
  Cache: "border-pink-500/50 bg-pink-500/10",
  Pipeline: "border-lime-500/50 bg-lime-500/10",
  Worker: "border-fuchsia-500/50 bg-fuchsia-500/10",
  Queue: "border-emerald-500/50 bg-emerald-500/10",
  Gateway: "border-orange-500/50 bg-orange-500/10",
  CDN: "border-sky-500/50 bg-sky-500/10",
  DNS: "border-blue-500/50 bg-blue-500/10",
  Firewall: "border-red-500/50 bg-red-500/10",
  "Load Balancer": "border-purple-500/50 bg-purple-500/10",
  "Web Server": "border-green-500/50 bg-green-500/10",
  "App Server": "border-indigo-500/50 bg-indigo-500/10",
  "Message Queue": "border-amber-500/50 bg-amber-500/10",
};

const NODE_ICON_COLORS: Record<string, string> = {
  Browser: "text-blue-400", Router: "text-amber-400", Controller: "text-purple-400",
  Service: "text-green-400", Database: "text-red-400", Cloud: "text-sky-400",
  Terminal: "text-gray-400", Security: "text-rose-400", API: "text-indigo-400",
  Desktop: "text-cyan-400", Mobile: "text-violet-400", Storage: "text-orange-400",
  Network: "text-teal-400", Auth: "text-yellow-400", Cache: "text-pink-400",
  Pipeline: "text-lime-400", Worker: "text-fuchsia-400", Queue: "text-emerald-400",
  Gateway: "text-orange-400", CDN: "text-sky-400", DNS: "text-blue-400",
  Firewall: "text-red-400", "Load Balancer": "text-purple-400",
  "Web Server": "text-green-400", "App Server": "text-indigo-400",
  "Message Queue": "text-amber-400",
};

interface FlowNodeData {
  label: string;
  type: string;
  description?: string;
}

function FlowNode({ data, selected }: NodeProps<FlowNodeData>) {
  const Icon = NODE_ICONS[data.type] || Cpu;
  const colorClasses = selected
    ? "border-primary/80 bg-primary/20 ring-2 ring-primary/40 shadow-lg shadow-primary/10"
    : NODE_COLORS[data.type] || "border-muted bg-muted/30";
  const iconColor = selected ? "text-primary" : (NODE_ICON_COLORS[data.type] || "text-muted-foreground");

  return (
    <motion.div
      layout
      animate={selected ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.4 }}
      className={cn(
        "rounded-lg border-2 px-4 py-3 shadow-sm backdrop-blur-sm min-w-[130px] transition-all duration-300",
        colorClasses
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 flex-shrink-0", iconColor)} />
        <div>
          <p className="text-sm font-semibold">{data.label}</p>
          {data.description && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{data.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const nodeTypes = { flowNode: FlowNode };

export interface FlowStep {
  id: string;
  title: string;
  description: string;
  highlightNodes: string[];
  highlightEdges: string[];
  code?: string;
}

export interface AnimatedFlowConfig {
  nodes: { id: string; label: string; type: string; description?: string; x: number; y: number }[];
  edges: { id: string; from: string; to: string; label?: string }[];
  steps: FlowStep[];
}

interface RawFlowchartNode {
  id: string;
  label: string;
  x?: number;
  y?: number;
}

interface RawFlowchartEdge {
  from: string;
  to: string;
  label?: string;
}

function getNodeShortLabel(label: string): string {
  return label.split("\n")[0] || label;
}

function findStartNodes(nodes: RawFlowchartNode[], edges: RawFlowchartEdge[]): string[] {
  const hasIncoming = new Set(edges.map((e) => e.to));
  return nodes.filter((n) => !hasIncoming.has(n.id)).map((n) => n.id);
}

function topologicalSortEdges(nodes: RawFlowchartNode[], edges: RawFlowchartEdge[]): RawFlowchartEdge[] {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, RawFlowchartEdge[]>();

  for (const n of nodes) {
    inDegree.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of edges) {
    if (nodeIds.has(e.from) && nodeIds.has(e.to)) {
      inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
      adj.get(e.from)?.push(e);
    }
  }

  const sorted: RawFlowchartEdge[] = [];
  const queue = [...findStartNodes(nodes, edges)];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const outgoing = adj.get(nodeId) || [];
    const sortedOutgoing = [...outgoing].sort((a, b) => {
      const aIdx = edges.indexOf(a);
      const bIdx = edges.indexOf(b);
      return aIdx - bIdx;
    });
    for (const e of sortedOutgoing) {
      sorted.push(e);
      inDegree.set(e.to, (inDegree.get(e.to) || 1) - 1);
      if (inDegree.get(e.to) === 0) {
        queue.push(e.to);
      }
    }
  }

  return sorted;
}

export function generateFlowSteps(
  nodes: RawFlowchartNode[],
  edges: RawFlowchartEdge[]
): { config: AnimatedFlowConfig; nodeTypeMap: Map<string, string> } {
  const sortedEdges = topologicalSortEdges(nodes, edges);
  const startNodes = findStartNodes(nodes, edges);
  const nodeLabelMap = new Map(nodes.map((n) => [n.id, getNodeShortLabel(n.label)]));
  const nodeTypeMap = new Map<string, string>();

  const stepDescriptions: Record<string, string> = {
    "data bus": "CPU sends data across the data bus to read from or write to memory",
    "instructions": "CPU fetches the next instruction from RAM for execution",
    "load": "Program or data is loaded from storage into RAM for fast access",
    "save": "Data is persisted from RAM to permanent storage",
    "signals": "Input device sends electrical signals to the CPU for processing",
    "display": "CPU sends processed output to the display device",
    "renders": "Browser renders the HTML/CSS/JS to display the web page",
    "processes": "Server processes the request through its application logic",
    "returns": "Server returns the requested data back to the client",
    "query": "Database query is executed against the data store",
    "response": "Query results are returned from the database",
  };

  const steps: FlowStep[] = [];
  const idEdges = edges.map((e, i) => ({
    ...e,
    id: `edge-${i}`,
    edgeId: `${e.from}->${e.to}`,
  }));

  const allNodes = new Set(nodes.map((n) => n.id));
  const layoutNodes = nodes.map((n, i) => {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const row = Math.floor(i / cols);
    const col = i % cols;
    return {
      id: n.id,
      label: n.label,
      type: n.label.includes("Browser") ? "Browser"
        : n.label.includes("Router") || n.label.includes("DNS") ? "Router"
        : n.label.includes("Controller") || n.label.includes("CPU") ? "Controller"
        : n.label.includes("Service") || n.label.includes("Server") ? "Service"
        : n.label.includes("Database") || n.label.includes("Storage") || n.label.includes("RAM") ? "Database"
        : n.label.includes("Cloud") || n.label.includes("CDN") ? "Cloud"
        : n.label.includes("API") ? "API"
        : n.label.includes("Security") || n.label.includes("Firewall") || n.label.includes("TLS") ? "Security"
        : n.label.includes("Cache") ? "Cache"
        : "Service",
      description: n.label,
      x: n.x ?? col * 220 + 50,
      y: n.y ?? row * 120 + 20,
    };
  });

  const layoutMap = new Map(layoutNodes.map((n) => [n.id, n]));
  for (const n of layoutNodes) {
    nodeTypeMap.set(n.id, n.type);
  }

  if (startNodes.length > 0) {
    const startNode = layoutMap.get(startNodes[0]);
    const startLabel = startNode ? getNodeShortLabel(startNode.label) : "Start";
    steps.push({
      id: "step-0",
      title: `Step 1: ${startLabel} Initiates`,
      description: `The process begins at the ${startLabel}. ${
        startLabel.includes("Browser") || startLabel.includes("User") || startLabel.includes("Client")
          ? "A user action triggers the start of the flow."
          : "This is the entry point of the system."
      }`,
      highlightNodes: [startNodes[0]],
      highlightEdges: [],
    });
  }

  const orderedEdges = sortedEdges.length > 0 ? sortedEdges : edges;
  for (let i = 0; i < orderedEdges.length; i++) {
    const e = orderedEdges[i];
    const fromNode = layoutMap.get(e.from);
    const toNode = layoutMap.get(e.to);
    const fromLabel = fromNode ? getNodeShortLabel(fromNode.label) : e.from;
    const toLabel = toNode ? getNodeShortLabel(toNode.label) : e.to;
    const edgeLabel = e.label || "flows to";
    const edgeId = idEdges.find((ie) => ie.from === e.from && ie.to === e.to)?.edgeId || `${e.from}->${e.to}`;

    steps.push({
      id: `step-${i + 1}`,
      title: `Step ${i + 2}: ${fromLabel} → ${toLabel}`,
      description: `${fromLabel} sends data to ${toLabel}${edgeLabel !== "flows to" ? ` via ${edgeLabel}` : ""}. ${
        stepDescriptions[edgeLabel] ||
        (i === orderedEdges.length - 1
          ? `${toLabel} processes the final result and the flow is complete.`
          : `${toLabel} receives the data and prepares for the next step in the flow.`)
      }`,
      highlightNodes: [e.from, e.to],
      highlightEdges: [edgeId],
    });
  }

  if (orderedEdges.length > 0 && steps.length > 1) {
    const lastEdge = orderedEdges[orderedEdges.length - 1];
    const lastNode = layoutMap.get(lastEdge.to);
    const lastLabel = lastNode ? getNodeShortLabel(lastNode.label) : "Final";
    steps[steps.length - 1].description = `Data arrives at ${lastLabel}. ${lastLabel} completes the processing. ${
      lastLabel.includes("Browser") || lastLabel.includes("User") || lastLabel.includes("Render")
        ? "The result is now visible to the user."
        : "The flow has reached its destination."
    }`;
    steps[steps.length - 1].highlightNodes = [lastEdge.to];
  }

  return {
    config: { nodes: layoutNodes, edges: idEdges, steps },
    nodeTypeMap,
  };
}

interface AnimatedFlowExplainerProps {
  config: AnimatedFlowConfig;
  className?: string;
}

export function AnimatedFlowExplainer({ config, className }: AnimatedFlowExplainerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  const totalSteps = config.steps.length;
  const currentFlowStep = config.steps[currentStep] ?? null;

  useEffect(() => {
    if (isPlaying && currentStep < totalSteps - 1) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= totalSteps - 1) { setIsPlaying(false); return prev; }
          return prev + 1;
        });
      }, 1200);
    } else if (isPlaying && currentStep >= totalSteps - 1) {
      setIsPlaying(false);
    }
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isPlaying, currentStep, totalSteps]);

  const handlePlayPause = useCallback(() => {
    if (currentStep >= totalSteps - 1) { setCurrentStep(0); setIsPlaying(true); }
    else { setIsPlaying((prev) => !prev); }
  }, [currentStep, totalSteps]);

  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const handleStepBack = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  const highlightNodeSet = useMemo(
    () => new Set(currentFlowStep?.highlightNodes || []),
    [currentFlowStep]
  );

  const highlightEdgeSet = useMemo(
    () => new Set(currentFlowStep?.highlightEdges || []),
    [currentFlowStep]
  );

  const initialNodes: Node<FlowNodeData>[] = useMemo(
    () =>
      config.nodes.map((n) => ({
        id: n.id,
        type: "flowNode",
        position: { x: n.x, y: n.y },
        data: { label: n.label, type: n.type, description: n.description },
        selected: highlightNodeSet.has(n.id),
      })),
    [config.nodes, highlightNodeSet]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      config.edges.map((e) => {
        const isHighlighted = highlightEdgeSet.has(e.id);
        return {
          id: e.id,
          source: e.from,
          target: e.to,
          label: e.label,
          animated: isHighlighted,
          style: {
            stroke: isHighlighted ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
            strokeWidth: isHighlighted ? 3 : 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isHighlighted ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
          },
          labelStyle: {
            fill: isHighlighted ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
            fontSize: 10,
            fontWeight: isHighlighted ? 600 : 500,
          },
          labelBgStyle: {
            fill: isHighlighted ? "hsl(var(--primary) / 0.15)" : "hsl(var(--card))",
            fillOpacity: 0.9,
          },
          labelBgPadding: [8, 4],
          labelBgBorderRadius: 4,
        };
      }),
    [config.edges, highlightEdgeSet]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (totalSteps === 0) {
    return (
      <div className={cn("flex items-center justify-center p-8 rounded-lg border border-border bg-card", className)}>
        <p className="text-sm text-muted-foreground">No flow animation steps configured</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold">Live Flow Animation</span>
          <Badge variant="secondary" className="text-[10px]">
            Step {currentStep + 1}/{totalSteps}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleReset} disabled={currentStep === 0} title="Reset">
            <SkipBack className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleStepBack} disabled={currentStep === 0} title="Previous">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePlayPause} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleStepForward} disabled={currentStep >= totalSteps - 1} title="Next">
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setIsPlaying(false); setCurrentStep(totalSteps - 1); }} disabled={currentStep >= totalSteps - 1} title="End">
            <SkipForward className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex" ref={flowRef}>
        <div className="h-[380px] flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            attributionPosition="bottom-left"
            proOptions={{ hideAttribution: true }}
          >
            <Background color="hsl(var(--muted-foreground) / 0.08)" gap={20} />
            <Controls className="[&>button]:bg-card [&>button]:border-border [&>button]:text-muted-foreground" />
          </ReactFlow>
        </div>

        <div className="w-80 border-l border-border flex flex-col shrink-0">
          <div className="border-b border-border px-4 py-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Step-by-Step Breakdown
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {config.steps.map((step, idx) => {
                const isCurrent = idx === currentStep;
                const isPast = idx < currentStep;
                return (
                  <motion.button
                    key={step.id}
                    onClick={() => { setIsPlaying(false); setCurrentStep(idx); }}
                    className={cn(
                      "w-full text-left rounded-lg border px-3 py-2.5 transition-all duration-200",
                      isCurrent && "border-primary/50 bg-primary/10 ring-1 ring-primary/20",
                      isPast && "border-muted/50 bg-muted/20 opacity-70",
                      !isCurrent && !isPast && "border-transparent hover:border-border hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold flex-shrink-0",
                        isCurrent ? "bg-primary text-primary-foreground" :
                        isPast ? "bg-emerald-500/20 text-emerald-500" : "bg-muted text-muted-foreground"
                      )}>
                        {isPast ? "\u2713" : idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-xs font-medium truncate", isCurrent && "text-primary")}>
                          {step.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                          {step.description}
                        </p>
                      </div>
                      {isCurrent && (
                        <motion.div layoutId="step-arrow" className="ml-auto">
                          <ArrowRight className="h-3.5 w-3.5 text-primary" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </ScrollArea>

          <AnimatePresence mode="wait">
            {currentFlowStep && (
              <motion.div
                key={currentFlowStep.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border-t border-border p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold">
                    {currentFlowStep.title}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentFlowStep.description}
                </p>
                {currentFlowStep.code && (
                  <pre className="mt-3 bg-muted rounded-md p-3 text-[11px] font-mono overflow-x-auto">
                    <code>{currentFlowStep.code}</code>
                  </pre>
                )}
                {currentFlowStep.highlightNodes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-[10px] text-muted-foreground">Active:</span>
                    {currentFlowStep.highlightNodes.map((n) => (
                      <Badge key={n} variant="outline" className="text-[10px] h-4 px-1.5">
                        {config.nodes.find((nd) => nd.id === n)?.label || n}
                      </Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="border-t border-border px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="relative h-1.5 rounded-full bg-muted">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {Math.round(((currentStep + 1) / totalSteps) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}