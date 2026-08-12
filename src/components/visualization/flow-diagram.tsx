"use client";

import { useCallback, useMemo } from "react";
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
import { cn } from "@/lib/utils";
import { Globe, Server, Database, Route, Cpu } from "lucide-react";

const NODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Browser: Globe,
  Router: Route,
  Controller: Cpu,
  Service: Server,
  Database: Database,
};

const NODE_COLORS: Record<string, string> = {
  Browser: "border-blue-500/50 bg-blue-500/10",
  Router: "border-amber-500/50 bg-amber-500/10",
  Controller: "border-purple-500/50 bg-purple-500/10",
  Service: "border-green-500/50 bg-green-500/10",
  Database: "border-red-500/50 bg-red-500/10",
};

const NODE_ICON_COLORS: Record<string, string> = {
  Browser: "text-blue-400",
  Router: "text-amber-400",
  Controller: "text-purple-400",
  Service: "text-green-400",
  Database: "text-red-400",
};

interface FlowNodeData {
  label: string;
  type: string;
  description?: string;
}

function FlowNode({ data }: NodeProps<FlowNodeData>) {
  const Icon = NODE_ICONS[data.type] || Cpu;
  const colorClasses = NODE_COLORS[data.type] || "border-muted bg-muted/30";
  const iconColor = NODE_ICON_COLORS[data.type] || "text-muted-foreground";

  return (
    <div
      className={cn(
        "rounded-lg border-2 px-4 py-3 shadow-sm backdrop-blur-sm min-w-[120px]",
        colorClasses
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4 flex-shrink-0", iconColor)} />
        <div>
          <p className="text-sm font-semibold">{data.label}</p>
          {data.description && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {data.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { flowNode: FlowNode };

interface FlowDiagramProps {
  nodes: FlowNodeData[];
  edges: { source: string; target: string; label?: string }[];
  className?: string;
}

const DEFAULT_LAYOUT: { nodes: FlowNodeData[]; edges: { source: string; target: string; label?: string }[] } = {
  nodes: [
    { label: "Browser", type: "Browser", description: "User interface" },
    { label: "Router", type: "Router", description: "Request routing" },
    { label: "Controller", type: "Controller", description: "Business logic" },
    { label: "Service", type: "Service", description: "Data processing" },
    { label: "Database", type: "Database", description: "Data storage" },
  ],
  edges: [
    { source: "Browser", target: "Router", label: "HTTP Request" },
    { source: "Router", target: "Controller", label: "Route" },
    { source: "Controller", target: "Service", label: "Call" },
    { source: "Service", target: "Database", label: "Query" },
    { source: "Database", target: "Service", label: "Result" },
    { source: "Service", target: "Controller", label: "Response" },
    { source: "Controller", target: "Router", label: "Render" },
    { source: "Router", target: "Browser", label: "HTTP Response" },
  ],
};

const LAYOUT_POSITIONS: Record<string, { x: number; y: number }> = {
  Browser: { x: 50, y: 200 },
  Router: { x: 250, y: 200 },
  Controller: { x: 450, y: 200 },
  Service: { x: 650, y: 200 },
  Database: { x: 850, y: 200 },
};

export function FlowDiagram({
  nodes: inputNodes,
  edges: inputEdges,
  className,
}: FlowDiagramProps) {
  const dataNodes = inputNodes.length > 0 ? inputNodes : DEFAULT_LAYOUT.nodes;
  const dataEdges = inputEdges.length > 0 ? inputEdges : DEFAULT_LAYOUT.edges;

  const initialNodes: Node<FlowNodeData>[] = useMemo(
    () =>
      dataNodes.map((n, i) => ({
        id: n.label,
        type: "flowNode",
        position: LAYOUT_POSITIONS[n.label] || { x: 50 + i * 200, y: 200 },
        data: n,
      })),
    [dataNodes]
  );

  const initialEdges: Edge[] = useMemo(
    () =>
      dataEdges.map((e, i) => ({
        id: `${e.source}-${e.target}-${i}`,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: true,
        style: {
          stroke: "hsl(var(--muted-foreground) / 0.4)",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "hsl(var(--muted-foreground) / 0.4)",
        },
        labelStyle: {
          fill: "hsl(var(--muted-foreground))",
          fontSize: 10,
          fontWeight: 500,
        },
        labelBgStyle: {
          fill: "hsl(var(--card))",
          fillOpacity: 0.8,
        },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
      })),
    [dataEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="border-b border-border px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          Flow Diagram
        </span>
      </div>
      <div className="h-[350px] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="hsl(var(--muted-foreground) / 0.1)" gap={20} />
          <Controls
            className="[&>button]:bg-card [&>button]:border-border [&>button]:text-muted-foreground [&>button]:fill-muted-foreground"
          />
          <MiniMap
            nodeColor={(n) => {
              const type = (n.data as FlowNodeData)?.type;
              if (type === "Browser") return "#3b82f6";
              if (type === "Router") return "#f59e0b";
              if (type === "Controller") return "#a855f7";
              if (type === "Service") return "#22c55e";
              if (type === "Database") return "#ef4444";
              return "hsl(var(--muted))";
            }}
            maskColor="hsl(var(--background) / 0.8)"
            style={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}