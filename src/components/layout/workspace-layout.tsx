"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeft,
  PanelRight,
  PanelBottom,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface WorkspaceLayoutProps {
  leftPanel: React.ReactNode;
  centerPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  bottomPanel?: React.ReactNode;
  className?: string;
}

export function WorkspaceLayout({
  leftPanel,
  centerPanel,
  rightPanel,
  bottomPanel,
  className,
}: WorkspaceLayoutProps) {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomCollapsed, setBottomCollapsed] = useState(true);
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(340);
  const [bottomHeight, setBottomHeight] = useState(300);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const [isDraggingBottom, setIsDraggingBottom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "b") {
          e.preventDefault();
          setLeftCollapsed((prev) => !prev);
        } else if (e.key === "j") {
          e.preventDefault();
          setRightCollapsed((prev) => !prev);
        } else if (e.key === "k") {
          e.preventDefault();
          setBottomCollapsed((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeft && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.max(180, Math.min(500, e.clientX - rect.left));
        setLeftWidth(newWidth);
      }
      if (isDraggingRight && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.max(200, Math.min(500, rect.right - e.clientX));
        setRightWidth(newWidth);
      }
      if (isDraggingBottom && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newHeight = Math.max(100, Math.min(500, rect.bottom - e.clientY));
        setBottomHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      setIsDraggingRight(false);
      setIsDraggingBottom(false);
    };

    if (isDraggingLeft || isDraggingRight || isDraggingBottom) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDraggingLeft, isDraggingRight, isDraggingBottom]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex h-full flex-col md:flex-row bg-background",
        className
      )}
    >
      <AnimatePresence>
        {!leftCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: leftWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative flex-shrink-0 border-r border-border overflow-hidden"
          >
            {leftPanel}
          </motion.div>
        )}
      </AnimatePresence>

      {!leftCollapsed && (
        <div
          className="hidden md:flex w-1 flex-shrink-0 cursor-col-resize hover:bg-primary/50 bg-transparent transition-colors items-center justify-center group relative"
          onMouseDown={() => setIsDraggingLeft(true)}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/70 transition-colors" />
          <div className="absolute inset-y-0 -left-1 -right-1" />
        </div>
      )}

      {leftCollapsed && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex h-8 w-8 flex-shrink-0 mt-2 ml-1"
          onClick={() => setLeftCollapsed(false)}
          title="Show left panel (Ctrl+B)"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0 overflow-hidden bg-card">
            {centerPanel}
          </div>

          <AnimatePresence>
            {!rightCollapsed && (
              <>
                <div
                  className="hidden md:flex w-1 flex-shrink-0 cursor-col-resize hover:bg-primary/50 bg-transparent transition-colors items-center justify-center group relative"
                  onMouseDown={() => setIsDraggingRight(true)}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/70 transition-colors" />
                  <div className="absolute inset-y-0 -left-1 -right-1" />
                </div>
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: rightWidth, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative flex-shrink-0 border-l border-border overflow-hidden"
                >
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setRightCollapsed(true)}
                      title="Hide right panel (Ctrl+J)"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  {rightPanel}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {rightCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex h-8 w-8 flex-shrink-0 mt-2 mr-1"
              onClick={() => setRightCollapsed(false)}
              title="Show right panel (Ctrl+J)"
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {bottomPanel && (
          <>
            <div className="hidden md:flex border-t border-border relative">
              <div
                className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-primary/50 bg-transparent transition-colors flex items-center justify-center group"
                onMouseDown={() => setIsDraggingBottom(true)}
              >
                <div className="absolute inset-x-0 -top-1 -bottom-1" />
              </div>
            </div>

            <AnimatePresence>
              {!bottomCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: bottomHeight, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative flex-shrink-0 overflow-hidden border-t border-border"
                >
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setBottomCollapsed(true)}
                      title="Hide bottom panel (Ctrl+K)"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                  {bottomPanel}
                </motion.div>
              )}
            </AnimatePresence>

            {bottomCollapsed && (
              <div className="flex justify-center py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setBottomCollapsed(false)}
                  title="Show bottom panel (Ctrl+K)"
                >
                  <PanelBottom className="h-3.5 w-3.5" />
                  Visualization
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}