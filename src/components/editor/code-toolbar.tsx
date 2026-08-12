"use client";

import { useCallback } from "react";
import {
  Play,
  RotateCcw,
  AlignLeft,
  ChevronDown,
  Minus,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { EXECUTABLE_LANGUAGES, DISPLAY_ONLY_LANGUAGES, LANGUAGE_REGISTRY } from "@/lib/execution/languages";

const SUPPORTED_LANGUAGES = (() => {
  const execLangs = EXECUTABLE_LANGUAGES.map((id) => {
    const def = LANGUAGE_REGISTRY[id];
    return { value: id, label: def?.name || id, executable: true };
  });
  const displayLangs = DISPLAY_ONLY_LANGUAGES.map((id) => {
    const def = LANGUAGE_REGISTRY[id];
    return { value: id, label: def?.name || id, executable: false };
  });
  return [...execLangs, ...displayLangs];
})();

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24];

interface CodeToolbarProps {
  onRun: () => void;
  onReset: () => void;
  onFormat?: () => void;
  language: string;
  onLanguageChange: (language: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  running?: boolean;
  className?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  tooltip: string;
  icon: React.ReactNode;
  disabled?: boolean;
  variant?: "ghost" | "default";
}

function ToolbarButton({
  onClick,
  tooltip,
  icon,
  disabled,
  variant = "ghost",
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant={variant}
            size="icon-sm"
            disabled={disabled}
            aria-label={tooltip}
          />
        }
        onClick={onClick}
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function CodeToolbar({
  onRun,
  onReset,
  onFormat,
  language,
  onLanguageChange,
  fontSize,
  onFontSizeChange,
  running = false,
  className,
}: CodeToolbarProps) {
  const handleFontSizeDecrease = useCallback(() => {
    const currentIndex = FONT_SIZES.indexOf(fontSize);
    if (currentIndex > 0) {
      onFontSizeChange(FONT_SIZES[currentIndex - 1]);
    }
  }, [fontSize, onFontSizeChange]);

  const handleFontSizeIncrease = useCallback(() => {
    const currentIndex = FONT_SIZES.indexOf(fontSize);
    if (currentIndex < FONT_SIZES.length - 1) {
      onFontSizeChange(FONT_SIZES[currentIndex + 1]);
    }
  }, [fontSize, onFontSizeChange]);

  return (
    <div
      className={cn(
        "flex items-center gap-1 border-b border-border bg-card px-2 py-1",
        className
      )}
    >
      <ToolbarButton
        onClick={onRun}
        tooltip="Run Code (Ctrl+Enter)"
        icon={
          running ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )
        }
        disabled={running}
        variant="default"
      />

      <ToolbarButton
        onClick={onReset}
        tooltip="Reset Code"
        icon={<RotateCcw className="size-3.5" />}
      />

      {onFormat && (
        <ToolbarButton
          onClick={onFormat}
          tooltip="Format Code"
          icon={<AlignLeft className="size-3.5" />}
        />
      )}

      <Separator orientation="vertical" className="mx-1 h-5" />

      <Select value={language} onValueChange={(v) => v && onLanguageChange(v)}>
        <Tooltip>
          <TooltipTrigger
            render={<SelectTrigger size="sm" className="h-7 gap-1 text-xs" />}
          >
            <SelectValue />
          </TooltipTrigger>
          <TooltipContent>Select Language</TooltipContent>
        </Tooltip>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.value} value={lang.value}>
              <span className="flex items-center gap-2">
                {lang.label}
                {lang.executable ? (
                  <Badge variant="outline" className="h-3.5 text-[9px] px-1 text-emerald-500 border-emerald-500/30">
                    RUN
                  </Badge>
                ) : (
                  <Badge variant="outline" className="h-3.5 text-[9px] px-1 text-muted-foreground/50">
                    VIEW
                  </Badge>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={fontSize <= FONT_SIZES[0]}
                aria-label="Decrease font size"
              />
            }
            onClick={handleFontSizeDecrease}
          >
            <Minus className="size-3" />
          </TooltipTrigger>
          <TooltipContent>Decrease Font Size</TooltipContent>
        </Tooltip>

        <span className="min-w-[2ch] text-center text-xs tabular-nums text-muted-foreground">
          {fontSize}
        </span>

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={fontSize >= FONT_SIZES[FONT_SIZES.length - 1]}
                aria-label="Increase font size"
              />
            }
            onClick={handleFontSizeIncrease}
          >
            <Plus className="size-3" />
          </TooltipTrigger>
          <TooltipContent>Increase Font Size</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export { SUPPORTED_LANGUAGES, FONT_SIZES };