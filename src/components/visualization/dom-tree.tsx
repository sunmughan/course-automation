"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DOMNode {
  id: string;
  tag: string;
  attributes?: Record<string, string>;
  children?: DOMNode[];
  text?: string;
}

interface DOMTreeProps {
  root: DOMNode;
  className?: string;
}

const DEFAULT_DOM: DOMNode = {
  id: "1",
  tag: "html",
  attributes: { lang: "en" },
  children: [
    {
      id: "2",
      tag: "head",
      children: [
        { id: "3", tag: "meta", attributes: { charset: "UTF-8" } },
        { id: "4", tag: "title", text: "Document" },
        { id: "5", tag: "link", attributes: { rel: "stylesheet", href: "styles.css" } },
      ],
    },
    {
      id: "6",
      tag: "body",
      children: [
        {
          id: "7",
          tag: "header",
          children: [
            { id: "8", tag: "h1", text: "Hello World" },
            { id: "9", tag: "nav", children: [{ id: "10", tag: "a", attributes: { href: "#" }, text: "Home" }] },
          ],
        },
        {
          id: "11",
          tag: "main",
          attributes: { class: "container" },
          children: [
            { id: "12", tag: "p", text: "Welcome to the DOM tree visualization." },
            { id: "13", tag: "button", attributes: { onclick: "handleClick()" }, text: "Click me" },
          ],
        },
        {
          id: "14",
          tag: "footer",
          children: [{ id: "15", tag: "p", text: "2024" }],
        },
      ],
    },
  ],
};

const TAG_COLORS: Record<string, string> = {
  html: "text-orange-400",
  head: "text-yellow-400",
  body: "text-blue-400",
  header: "text-purple-400",
  main: "text-green-400",
  footer: "text-gray-400",
  nav: "text-cyan-400",
  div: "text-sky-400",
  section: "text-teal-400",
  article: "text-emerald-400",
  aside: "text-violet-400",
  h1: "text-pink-400",
  h2: "text-pink-400",
  h3: "text-pink-400",
  p: "text-amber-400",
  a: "text-blue-400",
  button: "text-green-400",
  form: "text-indigo-400",
  input: "text-rose-400",
  img: "text-fuchsia-400",
  ul: "text-lime-400",
  ol: "text-lime-400",
  li: "text-yellow-400",
  span: "text-red-400",
  table: "text-slate-400",
  script: "text-amber-300",
  link: "text-amber-300",
  meta: "text-amber-300",
  title: "text-amber-300",
};

function DOMTreeNode({
  node,
  depth = 0,
}: {
  node: DOMNode;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [hovered, setHovered] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const tagColor = TAG_COLORS[node.tag] || "text-muted-foreground";

  const toggle = useCallback(() => {
    if (hasChildren) {
      setExpanded((prev) => !prev);
    }
  }, [hasChildren]);

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15 }}
        className={cn(
          "flex items-center gap-1 py-1 px-1.5 rounded cursor-pointer font-mono text-sm transition-colors",
          hovered && "bg-muted/50"
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={toggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span className="flex-shrink-0 w-4">
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )
          ) : (
            <span className="inline-block w-3.5" />
          )}
        </span>

        <span className="text-muted-foreground">&lt;</span>
        <span className={cn("font-medium", tagColor)}>{node.tag}</span>

        {node.attributes &&
          Object.entries(node.attributes).map(([key, value]) => (
            <span key={key} className="text-xs">
              <span className="text-cyan-400/70">{key}</span>
              <span className="text-muted-foreground">=</span>
              <span className="text-green-400/70">"{value}"</span>
            </span>
          ))}

        {!hasChildren && !node.text && (
          <span className="text-muted-foreground"> /&gt;</span>
        )}

        {!hasChildren && node.text && (
          <>
            <span className="text-muted-foreground">&gt;</span>
            <span className="text-foreground/80">{node.text}</span>
            <span className="text-muted-foreground">&lt;/</span>
            <span className={cn("font-medium", tagColor)}>{node.tag}</span>
            <span className="text-muted-foreground">&gt;</span>
          </>
        )}

        {hasChildren && !expanded && (
          <span className="text-muted-foreground">&gt;...&lt;/</span>
        )}
        {hasChildren && !expanded && (
          <span className={cn("font-medium", tagColor)}>{node.tag}</span>
        )}
        {hasChildren && !expanded && (
          <span className="text-muted-foreground">&gt;</span>
        )}

        {hasChildren && expanded && (
          <span className="text-muted-foreground">&gt;</span>
        )}
      </motion.div>

      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            {node.children!.map((child) => (
              <DOMTreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {hasChildren && expanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="font-mono text-sm"
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
        >
          <span className="text-muted-foreground">&lt;/</span>
          <span className={cn("font-medium", tagColor)}>{node.tag}</span>
          <span className="text-muted-foreground">&gt;</span>
        </motion.div>
      )}
    </div>
  );
}

export function DOMTree({ root, className }: DOMTreeProps) {
  const displayRoot = root.children?.length ? root : DEFAULT_DOM;

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-border bg-card",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          DOM Tree
        </span>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <DOMTreeNode node={displayRoot} />
      </div>
    </div>
  );
}