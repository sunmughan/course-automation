"use client";

import { useMemo, useCallback } from "react";
import {
  File,
  FileCode,
  FileJson,
  FileText,
  FileType,
  FileImage,
  FolderOpen,
  Folder,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  language?: string;
  children?: FileNode[];
}

interface FileExplorerProps {
  files: FileNode[];
  activeFileId?: string;
  onFileSelect: (file: FileNode) => void;
  className?: string;
}

const FILE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  js: FileCode,
  jsx: FileCode,
  ts: FileType,
  tsx: FileType,
  json: FileJson,
  md: FileText,
  txt: FileText,
  css: FileCode,
  html: FileCode,
  svg: FileImage,
  png: FileImage,
  jpg: FileImage,
  sql: FileCode,
  py: FileCode,
};

function getFileExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function getFileIcon(name: string): React.ComponentType<{ className?: string }> {
  const ext = getFileExtension(name);
  return FILE_ICON_MAP[ext] || File;
}

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  activeFileId?: string;
  onFileSelect: (file: FileNode) => void;
}

function FileTreeItem({
  node,
  depth,
  activeFileId,
  onFileSelect,
}: FileTreeItemProps) {
  const isFolder = node.type === "folder";
  const isActive = node.id === activeFileId;
  const paddingLeft = depth * 16 + 8;

  const handleClick = useCallback(() => {
    onFileSelect(node);
  }, [node, onFileSelect]);

  if (isFolder) {
    const FolderIcon = node.children?.length ? FolderOpen : Folder;
    const Chevron = node.children?.length ? ChevronDown : ChevronRight;

    return (
      <div>
        <button
          onClick={handleClick}
          className={cn(
            "flex w-full items-center gap-1.5 py-1 pr-2 text-sm transition-colors hover:bg-muted/50",
            isActive && "bg-muted"
          )}
          style={{ paddingLeft }}
        >
          <Chevron className="size-3.5 shrink-0 text-muted-foreground" />
          <FolderIcon className="size-4 shrink-0 text-sky-500" />
          <span className="truncate text-foreground">{node.name}</span>
        </button>
        {node.children?.map((child) => (
          <FileTreeItem
            key={child.id}
            node={child}
            depth={depth + 1}
            activeFileId={activeFileId}
            onFileSelect={onFileSelect}
          />
        ))}
      </div>
    );
  }

  const IconComponent = getFileIcon(node.name);

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex w-full items-center gap-1.5 py-1 pr-2 text-sm transition-colors hover:bg-muted/50",
        isActive && "bg-muted"
      )}
      style={{ paddingLeft: paddingLeft + 20 }}
    >
      <IconComponent className="size-4 shrink-0 text-muted-foreground" />
      <span className={cn("truncate", isActive ? "text-foreground font-medium" : "text-foreground")}>
        {node.name}
      </span>
    </button>
  );
}

export function FileExplorer({
  files,
  activeFileId,
  onFileSelect,
  className,
}: FileExplorerProps) {
  const flatFiles = useMemo(() => {
    const result: FileNode[] = [];
    function flatten(nodes: FileNode[]) {
      for (const node of nodes) {
        result.push(node);
        if (node.children) {
          flatten(node.children);
        }
      }
    }
    flatten(files);
    return result;
  }, [files]);

  return (
    <div className={cn("flex flex-col bg-card", className)}>
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <FolderOpen className="size-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Files
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {flatFiles.filter((f) => f.type === "file").length}
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {files.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No files in this project.
            </p>
          ) : (
            files.map((node) => (
              <FileTreeItem
                key={node.id}
                node={node}
                depth={0}
                activeFileId={activeFileId}
                onFileSelect={onFileSelect}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}