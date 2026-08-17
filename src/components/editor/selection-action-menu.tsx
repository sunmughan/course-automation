"use client";

import { motion } from "framer-motion";
import {
  HelpCircle,
  Lightbulb,
  Code2,
  Play,
  Workflow,
  Bug,
  Zap,
  Shield,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SelectionActionMenuProps {
  selectedCode: string;
  onAction: (actionType: string, selectedCode: string) => void;
  position?: { top: number; left: number };
  onClose?: () => void;
}

export function SelectionActionMenu({
  selectedCode,
  onAction,
  position,
  onClose,
}: SelectionActionMenuProps) {
  if (!selectedCode.trim()) return null;

  const actions = [
    { id: "explain", label: "Explain", icon: Lightbulb, color: "text-amber-400" },
    { id: "why", label: "Why this?", icon: HelpCircle, color: "text-sky-400" },
    { id: "syntax", label: "Syntax Breakdown", icon: Code2, color: "text-emerald-400" },
    { id: "visualize", label: "Visualize Flow", icon: Workflow, color: "text-indigo-400" },
    { id: "debug", label: "Debug Edge Cases", icon: Bug, color: "text-rose-400" },
    { id: "optimize", label: "Optimize & Perf", icon: Zap, color: "text-yellow-400" },
    { id: "security", label: "Security Check", icon: Shield, color: "text-purple-400" },
    { id: "tutor", label: "Ask Tutor", icon: MessageSquare, color: "text-blue-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-1.5 rounded-xl bg-slate-900/95 border border-slate-800 backdrop-blur-md shadow-2xl flex items-center gap-1 flex-wrap z-30 max-w-2xl"
    >
      <div className="px-2 py-0.5 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider border-r border-slate-800 mr-1">
        Selected Code Actions
      </div>

      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.id}
            onClick={() => onAction(act.id, selectedCode)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer shadow-xs"
            title={`${act.label} for selected code`}
          >
            <Icon className={`size-3.5 ${act.color}`} />
            <span>{act.label}</span>
          </button>
        );
      })}

      {onClose && (
        <button
          onClick={onClose}
          className="ml-auto text-slate-500 hover:text-white text-xs px-1.5 py-0.5"
        >
          ✕
        </button>
      )}
    </motion.div>
  );
}
