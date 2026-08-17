"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthHeaders } from "@/lib/fetch-helpers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderGit2,
  Clock,
  Layers,
  ArrowRight,
  Package,
  Play,
  Laptop,
  CheckCircle2,
  Code2,
  Server,
  Sparkles,
} from "lucide-react";

interface ProjectSpec {
  id: string;
  title: string;
  stream: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  targetCourse: string;
  milestones: string[];
  techStack: string[];
}

const MASTER_PROJECT_SPECS: ProjectSpec[] = [
  {
    id: "proj-node-api",
    title: "Enterprise E-Commerce REST API & Auth Engine",
    stream: "backend",
    difficulty: "Advanced",
    targetCourse: "Node.js & Express Enterprise Mastery",
    description: "Architect a production-grade Node.js/Express backend with JWT auth, Redis session caching, MongoDB schemas, rate limiting, and BullMQ background email jobs.",
    milestones: [
      "Implement Express routing and custom validation middleware",
      "Setup JWT authentication with refresh token rotation",
      "Integrate Redis cache-aside layer for fast catalog queries",
      "Build BullMQ worker for async order processing emails"
    ],
    techStack: ["Node.js", "Express", "Redis", "MongoDB", "BullMQ"]
  },
  {
    id: "proj-react-dashboard",
    title: "Real-Time Analytics Dashboard with Shadcn/UI",
    stream: "frontend",
    difficulty: "Intermediate",
    targetCourse: "React.js Complete Mastery",
    description: "Build an interactive financial analytics dashboard using React 19, Tailwind CSS v4, Shadcn/UI component primitives, and Framer Motion micro-interactions.",
    milestones: [
      "Setup responsive dashboard grid layout with Tailwind CSS",
      "Build compound data tables with sorting and pagination",
      "Implement dark/light theme switcher with Context API",
      "Add Framer Motion hover effects and smooth chart animations"
    ],
    techStack: ["React 19", "TypeScript", "Tailwind CSS v4", "Shadcn UI", "Framer Motion"]
  },
  {
    id: "proj-fullstack-collab",
    title: "Full-Stack Real-Time Team Collaboration Canvas",
    stream: "fullstack",
    difficulty: "Advanced",
    targetCourse: "Complete Full-Stack Enterprise Roadmap",
    description: "Connect React UI, Node.js WebSocket backend, PostgreSQL database, and Docker containerization for a real-time collaborative workspace.",
    milestones: [
      "Design relational PostgreSQL database schema with Prisma",
      "Implement WebSockets for live multi-user cursor tracking",
      "Setup Dockerfile and docker-compose for one-click development",
      "Configure GitHub Actions CI/CD pipeline for automated testing"
    ],
    techStack: ["Next.js", "WebSockets", "PostgreSQL", "Prisma", "Docker"]
  },
  {
    id: "proj-ai-agent-rag",
    title: "Autonomous RAG Agent with MCP Tool Calling",
    stream: "datascience",
    difficulty: "Advanced",
    targetCourse: "AI in Automation & Autonomous Agents",
    description: "Build an intelligent AI Agent using Model Context Protocol (MCP) that queries company documents, reasons through multi-step goals, and executes tools autonomously.",
    milestones: [
      "Implement custom TypeScript MCP server with tool endpoints",
      "Setup Vector embeddings and semantic search pipeline",
      "Implement ReAct (Reason + Act) autonomous agent loop",
      "Add human-in-the-loop fallback verification for destructive actions"
    ],
    techStack: ["TypeScript", "MCP Protocol", "LangGraph", "Vector DB", "LLM API"]
  }
];

export default function ProjectsPage() {
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEnrolled() {
      try {
        const res = await fetch("/api/courses", { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const enrolled = (data.courses || []).filter((c: any) => c.isEnrolled || c.progress > 0);
          setEnrolledCourses(enrolled);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    fetchEnrolled();
  }, []);

  // Filter projects matching enrolled courses or show relevant roadmaps
  const relevantProjects = MASTER_PROJECT_SPECS.filter((p) => {
    if (enrolledCourses.length === 0) return true;
    return enrolledCourses.some((c) =>
      c.title.toLowerCase().includes(p.stream) ||
      p.targetCourse.toLowerCase().includes(c.title.slice(0, 10).toLowerCase())
    );
  });

  const displayProjects = relevantProjects.length > 0 ? relevantProjects : MASTER_PROJECT_SPECS;

  if (loading) {
    return (
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
              Real-World Capstone Architecture
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Engineering Projects &amp; Capstones
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Build industry-standard projects matching your active enrolled career track.
          </p>
        </div>

        <Badge variant="outline" className="border-sky-500/30 text-sky-300 text-xs font-mono w-fit">
          {displayProjects.length} Capstone Projects Available
        </Badge>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayProjects.map((proj) => (
          <Card
            key={proj.id}
            className="bg-slate-900/90 border-slate-800 hover:border-sky-500/50 transition-all rounded-3xl overflow-hidden flex flex-col justify-between shadow-xl"
          >
            <CardHeader className="p-5 pb-3 space-y-2 border-b border-slate-800/80">
              <div className="flex items-center justify-between gap-2">
                <Badge className="bg-sky-500/10 text-sky-300 border-sky-500/30 text-[10px] font-mono">
                  {proj.targetCourse}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono ${
                    proj.difficulty === "Advanced"
                      ? "border-purple-500/40 text-purple-300"
                      : "border-emerald-500/40 text-emerald-300"
                  }`}
                >
                  {proj.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-base font-bold text-white">{proj.title}</CardTitle>
              <CardDescription className="text-xs text-slate-300 leading-relaxed">
                {proj.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 pt-3 space-y-4">
              {/* Milestones */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 font-mono uppercase block">
                  Key Project Milestones:
                </span>
                <ul className="space-y-1 text-xs text-slate-300 font-sans">
                  {proj.milestones.map((m, mIdx) => (
                    <li key={mIdx} className="flex items-start gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tech Stack Badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {proj.techStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                <Button
                  size="sm"
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs h-9 gap-1.5 cursor-pointer"
                  render={<Link href="/dashboard/playground" />}
                >
                  <Play className="size-3.5 fill-current" />
                  Open in Playground
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700 hover:bg-slate-800 text-slate-200 text-xs h-9 gap-1.5 cursor-pointer"
                  render={<Link href="/dashboard/courses" />}
                >
                  <Laptop className="size-3.5 text-amber-400" />
                  View Syllabus
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
